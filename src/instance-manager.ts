import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from "baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import path from "path";
import fs from "fs";
import QRCode from "qrcode";

const logger = pino({ level: "warn" });

export interface InstanceInfo {
  name: string;
  status: "connecting" | "open" | "close" | "qr";
  qr?: string;
  qrBase64?: string;
}

interface ManagedInstance {
  socket: WASocket;
  status: "connecting" | "open" | "close" | "qr";
  qr?: string;
  qrBase64?: string;
}

const instances = new Map<string, ManagedInstance>();

function getSessionsDir(): string {
  return process.env.SESSIONS_DIR || "./sessions";
}

export async function createInstance(name: string): Promise<InstanceInfo> {
  if (instances.has(name)) {
    const inst = instances.get(name)!;
    return { name, status: inst.status, qr: inst.qr, qrBase64: inst.qrBase64 };
  }

  const sessionDir = path.join(getSessionsDir(), name);
  fs.mkdirSync(sessionDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const socket = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    logger,
    printQRInTerminal: false,
    generateHighQualityLinkPreview: true,
  });

  const managed: ManagedInstance = { socket, status: "connecting" };
  instances.set(name, managed);

  socket.ev.on("creds.update", saveCreds);

  socket.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      managed.status = "qr";
      managed.qr = qr;
      try {
        managed.qrBase64 = await QRCode.toDataURL(qr);
      } catch {
        managed.qrBase64 = undefined;
      }
      console.log(`[${name}] QR code generated`);
    }

    if (connection === "open") {
      managed.status = "open";
      managed.qr = undefined;
      managed.qrBase64 = undefined;
      console.log(`[${name}] Connected!`);
    }

    if (connection === "close") {
      const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const loggedOut = reason === DisconnectReason.loggedOut;

      if (loggedOut) {
        managed.status = "close";
        console.log(`[${name}] Logged out. Removing session.`);
        instances.delete(name);
        fs.rmSync(sessionDir, { recursive: true, force: true });
      } else {
        console.log(`[${name}] Disconnected (reason ${reason}). Reconnecting...`);
        instances.delete(name);
        setTimeout(() => createInstance(name), 3000);
      }
    }
  });

  // Forward messages to webhook
  socket.ev.on("messages.upsert", async ({ messages, type }) => {
    const webhookUrl = process.env.WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "messages.upsert",
          instance: name,
          data: { messages, type },
        }),
      });
    } catch (err) {
      console.error(`[${name}] Webhook error:`, err);
    }
  });

  return { name, status: managed.status, qr: managed.qr, qrBase64: managed.qrBase64 };
}

export function getInstance(name: string): ManagedInstance | undefined {
  return instances.get(name);
}

export function getSocket(name: string): WASocket | undefined {
  return instances.get(name)?.socket;
}

export function listInstances(): InstanceInfo[] {
  const result: InstanceInfo[] = [];
  for (const [name, inst] of instances) {
    result.push({ name, status: inst.status, qr: inst.qr, qrBase64: inst.qrBase64 });
  }
  return result;
}

export async function deleteInstance(name: string): Promise<boolean> {
  const inst = instances.get(name);
  if (inst) {
    try {
      await inst.socket.logout();
    } catch { /* ignore */ }
    instances.delete(name);
  }
  const sessionDir = path.join(getSessionsDir(), name);
  if (fs.existsSync(sessionDir)) {
    fs.rmSync(sessionDir, { recursive: true, force: true });
  }
  return true;
}

export function getConnectionState(name: string): { instance: string; state: string } {
  const inst = instances.get(name);
  return {
    instance: name,
    state: inst?.status || "close",
  };
}

// Restore saved sessions on startup
export async function restoreSessions(): Promise<void> {
  const dir = getSessionsDir();
  if (!fs.existsSync(dir)) return;

  const folders = fs.readdirSync(dir).filter((f) => {
    return fs.statSync(path.join(dir, f)).isDirectory();
  });

  console.log(`[Startup] Restoring ${folders.length} sessions...`);
  for (const name of folders) {
    try {
      await createInstance(name);
      console.log(`[Startup] Restored: ${name}`);
    } catch (err) {
      console.error(`[Startup] Failed to restore ${name}:`, err);
    }
  }
}
