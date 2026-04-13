import express from "express";
import {
  createInstance,
  deleteInstance,
  listInstances,
  getConnectionState,
  getSocket,
  getInstance,
  restoreSessions,
} from "./instance-manager.js";
import {
  sendText,
  sendMedia,
  sendButtons,
  sendInteractiveButtons,
  sendList,
  sendPoll,
  sendCarousel,
  sendTextMenu,
  sendLocation,
  sendContact,
  sendReaction,
} from "./helpers.js";

const app = express();
app.use(express.json({ limit: "10mb" }));

// ─── Auth middleware ───
const API_KEY = process.env.API_KEY || "";
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return next();
  const key = req.headers["apikey"] as string ||
    (req.headers["authorization"] as string || "").replace(/^Bearer\s+/i, "");
  if (!API_KEY) return res.status(500).json({ error: "API_KEY not configured" });
  if (key !== API_KEY) return res.status(401).json({ error: "Invalid API key" });
  next();
});

// ─── CORS ───
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization,apikey");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ══════════════════════════════════════════
// INSTANCE MANAGEMENT (Evolution API compat)
// ══════════════════════════════════════════

// Create instance
app.post("/instance/create/:name", async (req, res) => {
  try {
    const info = await createInstance(req.params.name);
    res.json({ instance: info });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List instances
app.get("/instance/fetchInstances", (req, res) => {
  res.json(listInstances());
});

// Connection state
app.get("/instance/connectionState/:name", (req, res) => {
  res.json(getConnectionState(req.params.name));
});

// Connect (returns QR)
app.get("/instance/connect/:name", async (req, res) => {
  try {
    const info = await createInstance(req.params.name);
    res.json(info);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete instance
app.delete("/instance/delete/:name", async (req, res) => {
  await deleteInstance(req.params.name);
  res.json({ deleted: true });
});

// ══════════════════════════════════════════
// MESSAGES — Standard (Evolution API compat)
// ══════════════════════════════════════════

app.post("/message/sendText/:name", async (req, res) => {
  const sock = getSocket(req.params.name);
  if (!sock) return res.status(404).json({ error: "Instance not found or not connected" });
  try {
    const result = await sendText(sock, req.body.number, req.body.text || req.body.textMessage?.text);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/message/sendMedia/:name", async (req, res) => {
  const sock = getSocket(req.params.name);
  if (!sock) return res.status(404).json({ error: "Instance not found or not connected" });
  try {
    const result = await sendMedia(sock, req.body.number, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/message/sendLocation/:name", async (req, res) => {
  const sock = getSocket(req.params.name);
  if (!sock) return res.status(404).json({ error: "Instance not found or not connected" });
  try {
    const result = await sendLocation(sock, req.body.number, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/message/sendContact/:name", async (req, res) => {
  const sock = getSocket(req.params.name);
  if (!sock) return res.status(404).json({ error: "Instance not found or not connected" });
  try {
    const result = await sendContact(sock, req.body.number, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/message/sendReaction/:name", async (req, res) => {
  const sock = getSocket(req.params.name);
  if (!sock) return res.status(404).json({ error: "Instance not found or not connected" });
  try {
    const result = await sendReaction(sock, req.body.number, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════
// MESSAGES — Interactive (InfiniteAPI exclusive!)
// ══════════════════════════════════════════

// Quick Reply Buttons (up to 16!)
app.post("/message/sendButtons/:name", async (req, res) => {
  const sock = getSocket(req.params.name);
  if (!sock) return res.status(404).json({ error: "Instance not found or not connected" });
  try {
    const result = await sendButtons(sock, req.body.number, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CTA Buttons (URL / Copy / Call)
app.post("/message/sendInteractive/:name", async (req, res) => {
  const sock = getSocket(req.params.name);
  if (!sock) return res.status(404).json({ error: "Instance not found or not connected" });
  try {
    const result = await sendInteractiveButtons(sock, req.body.number, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List (Dropdown)
app.post("/message/sendList/:name", async (req, res) => {
  const sock = getSocket(req.params.name);
  if (!sock) return res.status(404).json({ error: "Instance not found or not connected" });
  try {
    const result = await sendList(sock, req.body.number, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Poll
app.post("/message/sendPoll/:name", async (req, res) => {
  const sock = getSocket(req.params.name);
  if (!sock) return res.status(404).json({ error: "Instance not found or not connected" });
  try {
    const result = await sendPoll(sock, req.body.number, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Carousel with Images
app.post("/message/sendCarousel/:name", async (req, res) => {
  const sock = getSocket(req.params.name);
  if (!sock) return res.status(404).json({ error: "Instance not found or not connected" });
  try {
    const result = await sendCarousel(sock, req.body.number, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Text Menu (plain text numbered options)
app.post("/message/sendMenu/:name", async (req, res) => {
  const sock = getSocket(req.params.name);
  if (!sock) return res.status(404).json({ error: "Instance not found or not connected" });
  try {
    const result = await sendTextMenu(sock, req.body.number, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Health check ───
app.get("/health", (req, res) => {
  res.json({ status: "ok", instances: listInstances().length });
});

// ─── Start ───
const PORT = parseInt(process.env.PORT || "8080");

restoreSessions().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 InfiniteAPI Microservice running on port ${PORT}`);
    console.log(`   Endpoints: /instance/* and /message/*`);
    console.log(`   Health: http://localhost:${PORT}/health\n`);
  });
});
