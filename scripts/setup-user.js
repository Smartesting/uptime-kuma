const io = require("socket.io-client");
const socket = io("http://localhost:3001");

socket.on("connect", () => {
    console.log("Connected");
    socket.emit("setup", "admin", "admin12345", (res) => {
        console.log("Setup response:", res);
        socket.disconnect();
        process.exit(res.ok ? 0 : 1);
    });
});

socket.on("connect_error", (err) => {
    console.error("Connection error:", err.message);
    process.exit(1);
});
