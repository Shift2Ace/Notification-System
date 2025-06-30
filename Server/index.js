const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);

const port = 3000;

const keyPath = path.join(__dirname, "secret.key");

let connectedClients = [];

app.use(express.json());

//Whenever someone connects this gets executed
io.on("connection", function (socket) {
  connectedClients.push(socket);
  console.log(`User connected (${socket.id})`);

  //Whenever someone disconnects this piece of code executed
  socket.on("disconnect", function () {
    connectedClients = connectedClients.filter((s) => s.id !== socket.id);
    console.log(`User disconnected (${socket.id})`);
  });
});

// Get server status
app.get("/", (req, res) => {
  res.send("Server is active.");
});

// Get server status
app.get("/downloadKey", (req, res) => {
  const filePath = path.join(__dirname, "secret.key");
  res.download(filePath, "secret.key", (err) => {
    if (err) {
      console.error("Download failed:", err);
      res.status(500).send("Download failed");
    }
  });
});

// Get message
app.get("/message", (req, res) => {
  //check key
  const clientKey = req.headers["x-api-key"];
  const serverKey = fs.readFileSync(keyPath, "utf8");
  if (!fs.existsSync(keyPath)) {
    return res.status(500).json({ error: "Server key not found" });
  }

  if (clientKey !== serverKey) {
    return res.status(403).json({ error: "Invalid API key" });
  }

  const sinceParam = req.query.since;
  const since = sinceParam ? parseInt(sinceParam, 10) : null;

  if (sinceParam && isNaN(since)) {
    return res.status(400).json({ error: "Invalid timestamp" });
  }

  // Read message
  fs.readFile("messages.json", "utf8", (err, data) => {
    if (err) {
      console.error("Error reading messages.json:", err);
      return res.status(500).json({ error: "Failed to read messages file" });
    }

    try {
      const messages = JSON.parse(data);
      const filteredMessages = since
        ? messages.filter((msg) => msg.timestamp > since)
        : messages;

      res.json(filteredMessages);
    } catch (parseErr) {
      console.error("Error parsing JSON:", parseErr);
      res.status(500).json({ error: "Invalid JSON format" });
    }
  });
});

// Send message
app.post("/message/send", (req, res) => {
  //Check Key
  const clientKey = req.headers["x-api-key"];
  const serverKey = fs.readFileSync(keyPath, "utf8");
  if (!fs.existsSync(keyPath)) {
    return res.status(500).json({ error: "Server key not found" });
  }

  if (clientKey !== serverKey) {
    return res.status(403).json({ error: "Invalid API key" });
  }

  // Get message
  const { level, title, content } = req.body;

  if (level === undefined || title === undefined || content === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!Number.isInteger(level) || level < 0 || level > 3) {
    return res.status(400).json({ error: "Invalid level" });
  }

  // Write data
  fs.readFile("messages.json", "utf8", (err, data) => {
    let messages = [];
    if (!err && data) {
      try {
        messages = JSON.parse(data);
      } catch (parseErr) {
        console.error("Error parsing messages.json:", parseErr);
        return res.status(500).json({ error: "Invalid messages file format" });
      }
    }

    const newMessage = {
      level,
      title,
      content,
      timestamp: Date.now(),
      nonce: crypto.randomInt(0, 65536),
    };

    console.log("Message received");
    connectedClients.forEach((socket) => {
      socket.emit("new-message", newMessage);
    });

    messages.push(newMessage);

    fs.writeFile(
      "./messages.json",
      JSON.stringify(messages, null, 2),
      (writeErr) => {
        if (writeErr) {
          console.error("Error writing to messages.json:", writeErr);
          return res.status(500).json({ error: "Failed to save message" });
        }
        res.status(201).json({ message: "Message saved successfully" });
      }
    );
  });
});

// Delete message
app.post("/message/delete", (req, res) => {
  //Check Key
  const clientKey = req.headers["x-api-key"];
  const serverKey = fs.readFileSync(keyPath, "utf8");
  if (!fs.existsSync(keyPath)) {
    return res.status(500).json({ error: "Server key not found" });
  }

  if (clientKey !== serverKey) {
    return res.status(403).json({ error: "Invalid API key" });
  }

  // Get message info
  const { timestampToRemove, messageNonceToRemove } = req.body;

  if (messageNonceToRemove === undefined || timestampToRemove === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (
    !Number.isInteger(messageNonceToRemove) ||
    !Number.isInteger(timestampToRemove)
  ) {
    return res.status(400).json({ error: "Invalid data" });
  }

  connectedClients.forEach((socket) => {
    socket.emit("new-message", newMessage);
  });

  // Delete message
  fs.readFile("messages.json", "utf8", (err, data) => {
    let messages = [];

    if (!err && data) {
      try {
        messages = JSON.parse(data);
      } catch (parseErr) {
        console.error("Error parsing messages.json:", parseErr);
        return res.status(500).json({ error: "Invalid messages file format" });
      }
    }

    messageOriginalLength = messages.length;
    if (messageNonceToRemove == 0 && timestampToRemove == 0) {
      messages = [];
    } else {
      messages = messages.filter(
        (message) =>
          !(
            message.nonce == messageNonceToRemove &&
            message.timestamp == timestampToRemove
          )
      );
      if (messages.length == messageOriginalLength) {
        return res.status(400).json({ error: "Message not found" });
      }
    }

    fs.writeFile(
      "./messages.json",
      JSON.stringify(messages, null, 2),
      (writeErr) => {
        if (writeErr) {
          console.error("Error writing to messages.json:", writeErr);
          return res.status(500).json({ error: "Failed to delete message" });
        }

        console.log(
          `${messageOriginalLength - messages.length} message(s) deleted.`
        );
        res.status(201).json({ message: "Message deleted successfully" });
      }
    );
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  initializeApp();
});

function initializeApp() {
  console.log("Initializing application...");

  // Create random key
  const keyPath = path.join(__dirname, "secret.key");
  if (!fs.existsSync(keyPath)) {
    const key = crypto.randomBytes(32).toString("hex");
    fs.writeFileSync(keyPath, key);
    console.log("Generated and saved a new 256-bit key to secret.key");
  }
}
