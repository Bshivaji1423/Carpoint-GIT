module.exports = async function (context, req) {

    const tenantId = process.env.TENANT_ID;
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const workspaceId = process.env.WORKSPACE_ID;
    const reportId = process.env.REPORT_ID;

    try {

        // -------------------------------
        // 1. Get logged-in user (for RLS)
        // -------------------------------
        const userHeader = req.headers["x-ms-client-principal"];
        let userEmail = null;

        if (userHeader) {
            const decoded = Buffer.from(userHeader, "base64").toString("ascii");
            const user = JSON.parse(decoded);
            userEmail = user.userDetails;
        }

        if (!userEmail) {
            context.res = {
                status: 401,
                body: "User not authenticated"
            };
            return;
        }

        // -------------------------------
        // ✅ 1.1 Restrict domain
        // -------------------------------
        const email = userEmail.toLowerCase();

        if (!email.endsWith("@carpoint.it")) {
            context.res = {
                status: 403,
                body: "Access denied: only @carpoint.it accounts allowed"
            };
            return;
        }

        // -------------------------------
        // 2. Get Azure AD token
        // -------------------------------
        const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "client_credentials",
                client_id: clientId,
                client_secret: clientSecret,
                scope: "https://analysis.windows.net/powerbi/api/.default"
            })
        });

        const tokenData = await tokenResponse.json();

        if (!tokenData.access_token) {
            throw new Error(JSON.stringify(tokenData));
        }

        const accessToken = tokenData.access_token;

        // -------------------------------
        // 3. Get report details
        // -------------------------------
        const reportResponse = await fetch(
            `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}`,
            {
                headers: { Authorization: `Bearer ${accessToken}` }
            }
        );

        const reportData = await reportResponse.json();

        if (!reportData.id) {
            throw new Error(JSON.stringify(reportData));
        }

        // -------------------------------
        // 4. Generate embed token (WITH RLS)
        // -------------------------------
        const embedTokenResponse = await fetch(
            `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}/GenerateToken`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    accessLevel: "View",
                    identities: [
                        {
                            username: email,
                            roles: ["Sales_Role"], // must match Power BI role
                            datasets: [reportData.datasetId]
                        }
                    ]
                })
            }
        );

        const embedData = await embedTokenResponse.json();

        if (!embedData.token) {
            throw new Error(JSON.stringify(embedData));
        }

        // -------------------------------
        // 5. Return to frontend
        // -------------------------------
        context.res = {
            status: 200,
            body: {
                embedUrl: reportData.embedUrl,
                accessToken: embedData.token,
                reportId: reportId
            }
        };

    } catch (error) {
        context.res = {
            status: 500,
            body: error.message
        };
    }
};
