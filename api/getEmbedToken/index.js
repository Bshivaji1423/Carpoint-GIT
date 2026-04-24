const jwt = require("jsonwebtoken");

module.exports = async function (context, req) {

    const tenantId = process.env.TENANT_ID;
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const workspaceId = process.env.WORKSPACE_ID;
    const reportId = process.env.REPORT_ID;

    try {

        // -------------------------------
        // 1. Get user from MSAL token
        // -------------------------------
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            context.res = {
                status: 401,
                body: "Missing token"
            };
            return;
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.decode(token);

        const userEmail = decoded?.preferred_username?.toLowerCase();

        context.log("User email:", userEmail);

        if (!userEmail) {
            context.res = {
                status: 401,
                body: "Invalid token"
            };
            return;
        }

        // -------------------------------
        // 2. Restrict domain
        // -------------------------------
        if (!userEmail.endsWith("@carpoint.it")) {
            context.res = {
                status: 403,
                body: "Access denied"
            };
            return;
        }

        // -------------------------------
        // 3. Get Azure AD token (Power BI)
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
            throw new Error(JSON.stringify(tokenData));
        }

        const accessToken = tokenData.access_token;

        // -------------------------------
        // 4. Get report
        // -------------------------------
        const reportResponse = await fetch(
            `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}`,
            {
                headers: { Authorization: `Bearer ${accessToken}` }
            }
        );

        const reportData = await reportResponse.json();

        // -------------------------------
        // 5. Generate embed token
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
                            roles: ["Sales_Role"],
                            datasets: [reportData.datasetId]
                        }
                    ]
                })
            }
        );

        const embedData = await embedTokenResponse.json();

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
