// server.js

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "docs")));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 3000;

const raw = fs.readFileSync("database/pins.json", "utf-8");
const pins = JSON.parse(raw);

app.get("/api/pins", (req, res) => res.json(pins));

const USERS_FILE = path.join(__dirname, "database/users.json");

// helper to safely read users
function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return {};
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
}

// helper to save users
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Register user
app.post("/api/register", (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();

  if (users[username]) {
    return res.json({ success: false, message: "Username already exists." });
  }

  users[username] = {
    password,
    playlists: {},
    queue: [],
    queueIndex: -1,
    manualQueue: 0,
    history: [],
    friends: {},
    shareLoc: true
  };

  saveUsers(users);
  res.json({ success: true, message: "Registration successful!" });
});

// Login user
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();

  if (!users[username]) {
    return res.json({ success: false, message: "User not found." });
  }
  if (users[username].password !== password) {
    return res.json({ success: false, message: "Incorrect password." });
  }

  res.json({ success: true, message: "Login successful!" });
});

// Update user data (like queue or playlists)
app.post("/api/updateUser", (req, res) => {
  const { username, updates } = req.body;
  if (!username || !updates) return res.status(400).json({ success: false, message: "Missing data" });

  const users = loadUsers();
  if (!users[username]) return res.status(404).json({ success: false, message: "User not found" });

  // Merge queue
  if (updates.queue) {
    users[username].queue = updates.queue;
  }

  // Merge playlists
  if (updates.playlists) {
    users[username].playlists = users[username].playlists || {};
    for (const [name, songs] of Object.entries(updates.playlists)) {
      if (!users[username].playlists[name]) users[username].playlists[name] = [];
      songs.forEach(s => {
        if (!users[username].playlists[name].find(x => x.url === s.url)) {
          users[username].playlists[name].push(s);
        }
      });
    }
  }

  // Merge queueIndex
  if (updates.queueIndex !== undefined) {
    users[username].queueIndex = updates.queueIndex;
  }

  // Merge queueIndex
  if (updates.manualQueue !== undefined) {
    users[username].manualQueue = updates.manualQueue;
  }

  if (updates.history) {
    users[username].history = users[username].history || [];
    users[username].history.push(...updates.history);
  }

  if (updates.friends) {
    
  }

  if (updates.shareLoc !== undefined) {
    users[username].shareLoc = updates.shareLoc
  }

  saveUsers(users);
  res.json({ success: true, message: "User data saved" });
});


app.get("/api/getUser/:username", (req, res) => {
  const username = req.params.username;
  const users = loadUsers();

  if (!users[username]) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.json({ success: true, data: users[username] });
});

app.get("/api/searchUsers", (req, res) => {
  const query = req.query.q?.toLowerCase() || "";

  if (query.length === 0) {
    return res.json({ success: true, users: [] });
  }

  try {
    const users = loadUsers();   // your existing function that loads JSON

    // users is an object: { ABC:{...}, XYZ:{...} }
    const usernames = Object.keys(users);

    const matches = usernames
      .filter(name => name.toLowerCase().includes(query))
      .map(name => ({ username: name }))  // return only username unless you want more
      .slice(0, 20);

    res.json({ success: true, users: matches });
  } catch (err) {
    console.error("Search error:", err);
    res.json({ success: false, message: "Search failed" });
  }
});



io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);
  socket.emit("pins", pins); 

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
