<!DOCTYPE html>
<html>
<head>
    <title>Inevaso Report</title>

    <!-- Power BI -->
    <script src="https://cdn.jsdelivr.net/npm/powerbi-client@2.23.1/dist/powerbi.min.js"></script>

    <style>
        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            font-family: Arial;
        }

        .header {
            height: 70px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 20px;
            background: linear-gradient(90deg, #1f4e79, #2b6cb0);
            color: white;
        }

        .logo {
            height: 40px;
        }

        .right {
            display: flex;
            align-items: center;
        }

        .right a {
            margin-left: 10px;
            padding: 6px 10px;
            background: white;
            color: #1f4e79;
            text-decoration: none;
            font-weight: bold;
        }

        #reportContainer {
            width: 100%;
            height: calc(100vh - 70px);
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 18px;
            color: #555;
        }
    </style>
</head>

<body>

<div class="header">
    <img src="/logo_carpoint.png" class="logo">

    <div class="right">
        <span id="username">Checking user...</span>

        <!-- Tenant-restricted login -->
        <a href="/.auth/login/aad?tenantId=1113460a-1574-4516-95b0-02c76e168800">
            Login
        </a>

        <!-- Logout with reason=user -->
        <a href="/.auth/logout?post_logout_redirect_uri=/logged-out.html?reason=user">
            Logout
        </a>
    </div>
</div>

<div id="reportContainer">
    Loading report...
</div>

<script>

// ================= GET USER =================
async function getUser() {
    try {
        const res = await fetch('/.auth/me');
        const data = await res.json();

        if (data.clientPrincipal) {
            const user = data.clientPrincipal.userDetails;
            document.getElementById("username").innerText = user;

            loadReport();
        } else {
            document.getElementById("username").innerText = "Not logged in";
        }
    } catch (err) {
        console.error("User load error:", err);
        document.getElementById("username").innerText = "Error loading user";
    }
}

// ================= LOAD REPORT =================
async function loadReport() {

    const container = document.getElementById("reportContainer");
    container.innerText = "Loading report...";

    try {
        const response = await fetch("/api/getEmbedToken");

        // 🔴 If user is not allowed → force logout with reason=external
        if (!response.ok) {
            window.location.href =
                "/.auth/logout?post_logout_redirect_uri=/logged-out.html?reason=external";
            return;
        }

        const data = await response.json();

        const models = window['powerbi-client'].models;

        const embedConfig = {
            type: 'report',
            tokenType: models.TokenType.Embed,
            accessToken: data.accessToken,
            embedUrl: data.embedUrl,
            id: data.reportId
        };

        powerbi.reset(container);
        powerbi.embed(container, embedConfig);

    } catch (err) {
        console.error("Report load error:", err);
        container.innerText = "Error loading report";
    }
}

// ================= INIT =================
getUser();

</script>

</body>
</html>
