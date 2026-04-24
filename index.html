<!DOCTYPE html>
<html>
<head>
    <title>Inevaso Report</title>

    <script src="https://cdn.jsdelivr.net/npm/powerbi-client@2.23.1/dist/powerbi.min.js"></script>

    <style>
        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            font-family: Arial;
        }

        /* HIDDEN BY DEFAULT */
        #app {
            display: none;
            height: 100%;
        }

        /* ACCESS DENIED SCREEN */
        #denied {
            display: none;
            height: 100%;
            justify-content: center;
            align-items: center;
            font-size: 24px;
            font-weight: bold;
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
        }
    </style>
</head>

<body>

<!-- 🔴 ACCESS DENIED -->
<div id="denied">
    ⛔ Access Denied
</div>

<!-- ✅ FULL APP -->
<div id="app">

    <div class="header">
        <img src="/logo_carpoint.png" class="logo">

        <div class="right">
            <span id="username"></span>

            <a href="/.auth/login/aad?tenantId=1113460a-1574-4516-95b0-02c76e168800">Login</a>

            <a href="/.auth/logout?post_logout_redirect_uri=/logged-out.html">
                Logout
            </a>
        </div>
    </div>

    <div id="reportContainer"></div>

</div>

<script>

// ================= INIT =================
init();

async function init() {

    try {
        const userRes = await fetch('/.auth/me');
        const userData = await userRes.json();

        // Not logged in
        if (!userData.clientPrincipal) {
            showDenied();
            return;
        }

        const userEmail = userData.clientPrincipal.userDetails.toLowerCase();

        // 🔴 BLOCK EXTERNAL USERS HERE (frontend guard)
        if (!userEmail.endsWith("@carpoint.it")) {
            showDenied();
            return;
        }

        // ✅ SHOW APP
        document.getElementById("app").style.display = "block";
        document.getElementById("username").innerText = userEmail;

        // Load report
        loadReport();

    } catch (err) {
        console.error(err);
        showDenied();
    }
}

// ================= LOAD REPORT =================
async function loadReport() {

    try {
        const response = await fetch("/api/getEmbedToken");

        if (!response.ok) {
            showDenied();
            return;
        }

        const data = await response.json();

        const models = window['powerbi-client'].models;

        const config = {
            type: 'report',
            tokenType: models.TokenType.Embed,
            accessToken: data.accessToken,
            embedUrl: data.embedUrl,
            id: data.reportId
        };

        const container = document.getElementById("reportContainer");

        powerbi.reset(container);
        powerbi.embed(container, config);

    } catch (err) {
        console.error(err);
        showDenied();
    }
}

// ================= ACCESS DENIED =================
function showDenied() {
    document.getElementById("denied").style.display = "flex";
    document.getElementById("app").style.display = "none";
}

</script>

</body>
</html>
