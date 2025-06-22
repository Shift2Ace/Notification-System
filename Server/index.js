const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const port = 3000;

const keyPath = path.join(__dirname, "secret.key");

app.use(express.json());

// Get server status
app.get("/", (req, res) => {
  res.send("Server is active.");
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
  // Read message
  fs.readFile("messages.json", "utf8", (err, data) => {
    if (err) {
      console.error("Error reading messages.json:", err);
      return res.status(500).json({ error: "Failed to read messages file" });
    }

    try {
      const messages = JSON.parse(data);
      res.json(messages);
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
    let messageData = null;
    if (!err && data) {
      try {
        messageData = JSON.parse(data);
      } catch (parseErr) {
        console.error("Error parsing messages.json:", parseErr);
        return res.status(500).json({ error: "Invalid messages file format" });
      }
    }
    messageData.count += 1;

    const newMessage = {
      level,
      title,
      content,
      messageID: messageData.count,
      timestamp: Date.now(),
    };

    console.log("Message received")

    messageData.messages.push(newMessage);

    fs.writeFile(
      "./messages.json",
      JSON.stringify(messageData, null, 2),
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

  // Get message
  const { messageIDToRemove, timestampToRemove } = req.body;

  if (messageIDToRemove === undefined || timestampToRemove === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (
    !Number.isInteger(messageIDToRemove) ||
    !Number.isInteger(timestampToRemove)
  ) {
    return res.status(400).json({ error: "Invalid data" });
  }

  // Delete message
  fs.readFile("messages.json", "utf8", (err, data) => {
    let messageData = null;

    if (!err && data) {
      try {
        messageData = JSON.parse(data);
        messages = messageData.messages;
      } catch (parseErr) {
        console.error("Error parsing messages.json:", parseErr);
        return res.status(500).json({ error: "Invalid messages file format" });
      }
    }

    messageOriginalLength = messageData.messages.length;
    if (messageIDToRemove == 0 && timestampToRemove == 0) {
      messageData.messages = [];
    } else {
      messageData.messages = messageData.messages.filter(
        (message) =>
          !(
            message.messageID == messageIDToRemove &&
            message.timestamp == timestampToRemove
          )
      );
      if (messageData.messages.length == messageOriginalLength){
        return res.status(400).json({ error: "Message not found" });
      }
    }

    fs.writeFile(
      "./messages.json",
      JSON.stringify(messageData, null, 2),
      (writeErr) => {
        if (writeErr) {
          console.error("Error writing to messages.json:", writeErr);
          return res.status(500).json({ error: "Failed to delete message" });
        }

        console.log(`${messageOriginalLength - messageData.messages.length} message(s) deleted.`);
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
