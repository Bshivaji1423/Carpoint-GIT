module.exports = async function (context, req) {

    const tenantId = process.env.TENANT_ID;
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const workspaceId = process.env.WORKSPACE_ID;
    const reportId = process.env.REPORT_ID;

    try {

        // -------------------------------
        // 1. Get logged-in user
        // -------------------------------
        const userHeader = req.headers["x-ms-client-principal"];
        let userEmail = null;

        if (userHeader) {
            const decoded = Buffer.from(userHeader, "base64").toString("ascii");
            const user = JSON.parse(decoded);

            const claims = user.claims || [];

            const preferred = claims.find(c => c.typ === "preferred_username")?.val;
            const email = claims.find(c =>
                c.typ === "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
            )?.val;

            userEmail = (email || preferred || "").toLowerCase();
        }

        // Debug log (VERY useful)
        context.log("User email detected:", userEmail);

        if (!userEmail) {
            context.res = {
                status: 401,
                body: "User not authenticated"
            };
            return;
        }

        // -------------------------------
        // 2. Restrict access (DOMAIN)
        // -------------------------------
        if (!userEmail.includes("@carpoint.it")) {
            context.log("Access denied for:", userEmail);

            context.res = {
                status: 403,
                body: "Access denied: only @carpoint.it accounts allowed"
            };
            return;
        }

        // -------------------------------
        // 3. Get Azure AD token
        // -------------------------------
        const tokenResponse = await fetch(
            `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
            {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    grant_type: "client_credentials",
                    client_id: clientId,
                    client_secret: clientSecret,
                    scope: "https://analysis.windows.net/powerbi/api/.default"
                })
            }
        );

        const tokenData = await tokenResponse.json();

        if (!tokenData.access_token) {
            throw new Error("Failed to get Azure AD token: " + JSON.stringify(tokenData));
        }

        const accessToken = tokenData.access_token;

        // -------------------------------
        // 4. Get report details
        // -------------------------------
        const reportResponse = await fetch(
            `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}`,
            {
                headers: { Authorization: `Bearer ${accessToken}` }
            }
        );

        const reportData = await reportResponse.json();

        if (!reportData.id) {
            throw new Error("Failed to get report: " + JSON.stringify(reportData));
        }

        // -------------------------------
        // 5. Generate embed token (RLS)
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
                            username: userEmail,
                            roles: ["Sales_Role"], // must match Power BI role
                            datasets: [reportData.datasetId]
                        }
                    ]
                })
            }
        );

        const embedData = await embedTokenResponse.json();

        if (!embedData.token) {
            throw new Error("Failed to generate embed token: " + JSON.stringify(embedData));
        }

        // -------------------------------
        // 6. Return to frontend
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
        context.log("ERROR:", error.message);

        context.res = {
            status: 500,
            body: error.message
        };
    }
};
