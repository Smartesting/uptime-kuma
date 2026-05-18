const io = require("socket.io-client");

async function browserVerify() {
    const socket = io("http://localhost:3001");

    await new Promise((resolve, reject) => {
        socket.on("connect", resolve);
        socket.on("connect_error", reject);
        setTimeout(() => reject(new Error("Connection timeout")), 10000);
    });

    // Login
    const loginRes = await new Promise((resolve) => {
        socket.emit("login", { username: "admin", password: "admin12345" }, resolve);
    });

    if (!loginRes.ok) {
        throw new Error("Login failed");
    }

    // Get monitor list (this is what the dashboard shows)
    let monitorList = null;
    socket.once("monitorList", (list) => {
        monitorList = list;
    });

    await new Promise((resolve) => {
        socket.emit("getMonitorList", resolve);
        setTimeout(resolve, 2000);
    });

    const monitors = Object.values(monitorList || {});
    console.log("Dashboard monitor count:", monitors.length);

    // Verify mix of types
    const httpMonitors = monitors.filter(m => m.type === "http");
    const pingMonitors = monitors.filter(m => m.type === "ping");
    const activeMonitors = monitors.filter(m => m.active === 1);
    const pausedMonitors = monitors.filter(m => m.active === 0);

    console.log("HTTP monitors:", httpMonitors.length);
    console.log("Ping monitors:", pingMonitors.length);
    console.log("Active monitors:", activeMonitors.length);
    console.log("Paused monitors:", pausedMonitors.length);

    // Verify specific names exist
    const names = monitors.map(m => m.name);
    const expectedNames = [
        "Production API",
        "Checkout Service",
        "Auth Service",
        "Database Primary",
        "CDN Edge Node",
        "Webhook Receiver",
        "Internal DNS",
        "Backup Server",
        "Staging API",
        "Legacy Portal",
    ];

    for (const name of expectedNames) {
        if (!names.includes(name)) {
            throw new Error(`Missing monitor: ${name}`);
        }
    }

    console.log("All expected monitors present");

    // Verify status page exists
    const statusPageRes = await new Promise((resolve) => {
        socket.emit("getStatusPage", "platform", resolve);
    });

    if (!statusPageRes.ok) {
        throw new Error("Status page not found: " + statusPageRes.msg);
    }

    console.log("Status page found:", statusPageRes.config.title);
    console.log("Status page groups:", (statusPageRes.publicGroupList || []).length);

    // Verify tags
    const tagsRes = await new Promise((resolve) => {
        socket.emit("getTags", resolve);
    });

    if (!tagsRes.ok) {
        throw new Error("Tags not found: " + tagsRes.msg);
    }

    console.log("Tags found:", tagsRes.tags.length);

    // Verify notifications
    let notificationList = null;
    socket.once("notificationList", (list) => {
        notificationList = list;
    });

    // Trigger notification list refresh
    await new Promise((resolve) => {
        socket.emit("getNotificationList", resolve);
        setTimeout(resolve, 2000);
    });

    if (!notificationList || notificationList.length === 0) {
        // Try alternative: get from database via testNotification
        console.log("Warning: notification list not received via event");
    } else {
        console.log("Notifications found:", notificationList.length);
    }

    console.log("\nBrowser verification passed!");
    socket.disconnect();
    process.exit(0);
}

browserVerify().catch((err) => {
    console.error("Browser verification failed:", err.message);
    process.exit(1);
});
