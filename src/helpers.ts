/**
 * Helper functions for building interactive messages
 * Based on InfiniteAPI's interactive message capabilities
 */
import type { WASocket } from "baileys";

const jidFromNumber = (number: string) =>
  number.includes("@") ? number : `${number}@s.whatsapp.net`;

// ─── Text Menu (plain text numbered options) ───
export async function sendTextMenu(
  sock: WASocket,
  to: string,
  opts: { title?: string; text: string; options: string[]; footer?: string }
) {
  const lines = [];
  if (opts.title) lines.push(`*${opts.title}*\n`);
  lines.push(opts.text);
  lines.push("");
  opts.options.forEach((o, i) => lines.push(`${i + 1}. ${o}`));
  if (opts.footer) lines.push(`\n_${opts.footer}_`);

  return sock.sendMessage(jidFromNumber(to), { text: lines.join("\n") });
}

// ─── Buttons (Quick Reply) — up to 16 buttons ───
export async function sendButtons(
  sock: WASocket,
  to: string,
  opts: {
    text: string;
    footer?: string;
    buttons: Array<{ id: string; text: string }>;
  }
) {
  const msg = {
    text: opts.text,
    footer: opts.footer || "",
    buttons: opts.buttons.map((b) => ({
      buttonId: b.id,
      buttonText: { displayText: b.text },
      type: 1,
    })),
    headerType: 1,
  };

  return sock.sendMessage(jidFromNumber(to), msg as any);
}

// ─── Interactive CTA Buttons (URL / Copy / Call) ───
export async function sendInteractiveButtons(
  sock: WASocket,
  to: string,
  opts: {
    text: string;
    footer?: string;
    buttons: Array<
      | { type: "url"; text: string; url: string }
      | { type: "copy"; text: string; copyCode: string }
      | { type: "call"; text: string; phoneNumber: string }
    >;
  }
) {
  const nativeFlowButtons = opts.buttons.map((b) => {
    switch (b.type) {
      case "url":
        return {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: b.text,
            url: b.url,
            merchant_url: b.url,
          }),
        };
      case "copy":
        return {
          name: "cta_copy",
          buttonParamsJson: JSON.stringify({
            display_text: b.text,
            copy_code: b.copyCode,
          }),
        };
      case "call":
        return {
          name: "cta_call",
          buttonParamsJson: JSON.stringify({
            display_text: b.text,
            phone_number: b.phoneNumber,
          }),
        };
    }
  });

  const msg = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          body: { text: opts.text },
          footer: { text: opts.footer || "" },
          nativeFlowMessage: {
            buttons: nativeFlowButtons,
          },
        },
      },
    },
  };

  return sock.sendMessage(jidFromNumber(to), msg as any);
}

// ─── List (Dropdown) — up to 10 sections × 3 rows ───
export async function sendList(
  sock: WASocket,
  to: string,
  opts: {
    text: string;
    footer?: string;
    buttonText: string;
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>;
  }
) {
  const msg = {
    text: opts.text,
    footer: opts.footer || "",
    title: "",
    buttonText: opts.buttonText,
    sections: opts.sections,
  };

  return sock.sendMessage(jidFromNumber(to), msg as any);
}

// ─── Poll ───
export async function sendPoll(
  sock: WASocket,
  to: string,
  opts: { name: string; options: string[]; selectableCount: number }
) {
  return sock.sendMessage(jidFromNumber(to), {
    poll: {
      name: opts.name,
      values: opts.options,
      selectableCount: opts.selectableCount,
    },
  });
}

// ─── Carousel with Images — 2-10 cards ───
export async function sendCarousel(
  sock: WASocket,
  to: string,
  opts: {
    text: string;
    footer?: string;
    cards: Array<{
      body: string;
      footer?: string;
      imageUrl: string;
      buttons: Array<{ id: string; text: string }>;
    }>;
  }
) {
  const carouselCards = opts.cards.map((card) => ({
    body: { text: card.body },
    footer: { text: card.footer || "" },
    header: {
      hasMediaAttachment: true,
      imageMessage: { url: card.imageUrl },
    },
    nativeFlowMessage: {
      buttons: card.buttons.map((b) => ({
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({ display_text: b.text, id: b.id }),
      })),
    },
  }));

  const msg = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          body: { text: opts.text },
          footer: { text: opts.footer || "" },
          carouselMessage: {
            cards: carouselCards,
          },
        },
      },
    },
  };

  return sock.sendMessage(jidFromNumber(to), msg as any);
}

// ─── Standard text ───
export async function sendText(
  sock: WASocket,
  to: string,
  text: string
) {
  return sock.sendMessage(jidFromNumber(to), { text });
}

// ─── Media ───
export async function sendMedia(
  sock: WASocket,
  to: string,
  opts: {
    mediatype: "image" | "video" | "audio" | "document";
    url: string;
    caption?: string;
    fileName?: string;
    mimetype?: string;
  }
) {
  const jid = jidFromNumber(to);
  const base: any = { caption: opts.caption || "" };

  switch (opts.mediatype) {
    case "image":
      return sock.sendMessage(jid, { image: { url: opts.url }, ...base });
    case "video":
      return sock.sendMessage(jid, { video: { url: opts.url }, ...base });
    case "audio":
      return sock.sendMessage(jid, {
        audio: { url: opts.url },
        mimetype: opts.mimetype || "audio/mpeg",
      });
    case "document":
      return sock.sendMessage(jid, {
        document: { url: opts.url },
        mimetype: opts.mimetype || "application/pdf",
        fileName: opts.fileName || "document",
        ...base,
      });
  }
}

// ─── Location ───
export async function sendLocation(
  sock: WASocket,
  to: string,
  opts: { latitude: number; longitude: number; name?: string; address?: string }
) {
  return sock.sendMessage(jidFromNumber(to), {
    location: {
      degreesLatitude: opts.latitude,
      degreesLongitude: opts.longitude,
      name: opts.name,
      address: opts.address,
    },
  });
}

// ─── Contact ───
export async function sendContact(
  sock: WASocket,
  to: string,
  opts: { fullName: string; phoneNumber: string }
) {
  const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${opts.fullName}\nTEL;type=CELL;type=VOICE;waid=${opts.phoneNumber}:+${opts.phoneNumber}\nEND:VCARD`;
  return sock.sendMessage(jidFromNumber(to), {
    contacts: {
      displayName: opts.fullName,
      contacts: [{ vcard }],
    },
  });
}

// ─── Reaction ───
export async function sendReaction(
  sock: WASocket,
  to: string,
  opts: { messageId: string; emoji: string }
) {
  return sock.sendMessage(jidFromNumber(to), {
    react: { text: opts.emoji, key: { remoteJid: jidFromNumber(to), id: opts.messageId } },
  });
}
