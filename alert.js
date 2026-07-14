import WebSocket from "ws";
import fetch from "node-fetch";
import fs from "fs";

const SYMBOL = "R_100";
const SYMBOL_NAME = "📊 V100 — R_100";

const M15 = 900;
const CANDLES = 50;

const TG_TOKEN = process.env.TG_BOT_TOKEN;
const TG_CHAT = process.env.TG_CHAT_ID;
const TRIGGER_SOURCE = process.env.TRIGGER_SOURCE;

if (TRIGGER_SOURCE !== "cronjob") {
  console.log("⛔ Blocked:", TRIGGER_SOURCE);
  process.exit(0);
}

async function sendTelegram(message) {
  await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TG_CHAT,
      text: message
    })
  });
}

async function getCandles(granularity) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket("wss://ws.binaryws.com/websockets/v3?app_id=1089");

    ws.on("open", () => {
      ws.send(JSON.stringify({
        ticks_history: SYMBOL,
        count: CANDLES,
        granularity,
        end: "latest",
        style: "candles"
      }));
    });

    ws.on("message", (data) => {
      const response = JSON.parse(data);
      if (response.error) reject(new Error(response.error.message));
      if (response.candles) resolve(response.candles);
      ws.close();
    });

    ws.on("error", reject);
  });
}

(async () => {
  try {

    const candles = await getCandles(M15);
    const last = candles[candles.length - 1];

    const isoTime = new Date(last.epoch * 1000).toISOString();
    const closePrice = last.close;

    await sendTelegram(
`══════════════════════
${SYMBOL_NAME}
══════════════════════

✅ BOT ACTIVE (TEST MODE)

Time: ${isoTime}
Latest Close: ${closePrice}

If you receive this every 15 minutes,
cron + GitHub + Telegram are working correctly.`
    );

    console.log("✅ Test message sent successfully.");

  } catch (err) {
    console.error("❌ TEST ERROR:", err.message);
    process.exit(1);
  }
})();
