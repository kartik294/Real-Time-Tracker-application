const express = require("express");
const app = express();
const http = require("http");
const socketio = require("socket.io");
const path = require("path");
const server = http.createServer(app);
const io = socketio(server);

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// Store user data
const users = {};

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Assign a unique name or identifier for the user
  socket.on("set-username", (username) => {
    users[socket.id] = { username, path: [] };
    io.emit("user-list", Object.values(users));
  });

  socket.on("send-location", (data) => {
    const { latitude, longitude } = data;

    // Store location history for each user
    if (users[socket.id]) {
      users[socket.id].path.push([latitude, longitude]);
    }

    io.emit("receive-location", {
      id: socket.id,
      ...data,
      username: users[socket.id]?.username,
    });
  });

  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("user-disconnected", socket.id);
    io.emit("user-list", Object.values(users));
    console.log("User disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.render("index");
});

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
