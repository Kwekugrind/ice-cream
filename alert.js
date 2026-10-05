import WebSocket from "ws";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

// ==================== AUTO-RELOAD ON CODE UPDATE ====================
// Automatically monitors alert.js on disk. When git pull or a sync script updates the file,
// this watcher detects the timestamp change and gracefully exits (code 0) so PM2
// immediately respawns the daemon with the updated code in RAM.
const SCRIPT_PATH = fileURLToPath(import.meta.url);
let reloadTimer = null;
try {
  fs.watchFile(SCRIPT_PATH, { interval: 2000 }, (curr, prev) => {
    if (curr.mtimeMs !== prev.mtimeMs) {
      if (reloadTimer) clearTimeout(reloadTimer);
      console.log(`[AUTO-RELOAD] Code update detected on disk for ${path.basename(SCRIPT_PATH)}. Scheduling clean PM2 restart in 2s...`);
      reloadTimer = setTimeout(() => {
        console.log(`[AUTO-RELOAD] Exiting process cleanly now (code 1 for PM2 auto-respawn). PM2 will immediately respawn with updated code.`);
        process.exit(1);
      }, 2000);
    }
  });
} catch (e) {
  console.error("[AUTO-RELOAD] Watcher initialization error:", e.message);
}

// ==================== MASTER INSTRUMENT PROFILES (CALIBRATED EMPIRICAL MATRIX) ====================
// Authoritative multi-asset quantitative specifications aligned with MetaTrader 5 visual audit
// and multi-day flight recorder ledger analysis across Deriv Multiplier tick dynamics.
export const INSTRUMENT_PROFILES = {
  "R_75": {
    symbol: "R_75",
    symbolName: "Volatility 75 Index",
    repoLabel: "Lery's Alerts (V75 Demo)",
    server: "S1",
    multiplier: 50,
    stakeUsd: 5.0,
    commissionUsd: 0.15,
    strategyProfile: "PROFILE_V75_EMA_STOCH15",
    gateType: "EMA_STOCH15_RETRACEMENT",
    stochParams: { k: 15, d: 18, slowing: 8, method: "Exponential", levels: [25, 75] },
    emaPeriod: 100,
    minTakeProfitPoints: 1330.0,
    minTakeProfitUsd: 4.00,
    trailActivationUsd: 3.00,
    maxHardStopPoints: 180.0,
    slType: "M15_FRACTAL",
    notes: "Condition 1: M5 EMA 100 vs 200 Trend Filter; Condition 2: M5 EMA 100/200 Pullback Retracement Touch; Condition 3: M5 Stoch (15,18,8, Exponential) %K/%D extreme zone 25/75 cross; Early Exit: Active trade in loss liquidates on opposite %K/%D crossover."
  },
  "1HZ75V": {
    symbol: "1HZ75V",
    symbolName: "Volatility 75 (1s) Index",
    repoLabel: "Coffee (V75-1s Demo)",
    server: "S1",
    multiplier: 100,
    stakeUsd: 5.0,
    commissionUsd: 0.15,
    strategyProfile: "PROFILE_V75_1S_EMA_STOCH15",
    gateType: "EMA_STOCH15_CROSS",
    stochParams: { k: 15, d: 5, slowing: 8 },
    emaPeriod: 100,
    minTakeProfitPoints: 5.10,
    minTakeProfitUsd: 4.00,
    trailActivationUsd: 3.00,
    maxHardStopPoints: 18.0,
    slType: "M15_FRACTAL",
    notes: "Condition 1: M5 EMA 100 vs 200 Trend Filter; Condition 2: M5 EMA 100/200 Retracement Touch; Condition 3: M5 Candle Close > EMA 100 (Trend Resumption); Condition 4: Stoch (15,5,8) %K/%D cross out of 25/75 extreme zone + M5 EMA 200 opposite close early exit."
  },
  "R_100": {
    symbol: "R_100",
    symbolName: "Volatility 100 Index",
    repoLabel: "Milk (V100 Demo)",
    server: "S1",
    multiplier: 40,
    stakeUsd: 5.0,
    commissionUsd: 0.15,
    strategyProfile: "PROFILE_V100_MIDLINE_ENV",
    gateType: "STOCH_50_ENV200",
    stochParams: { k: 18, d: 12, slowing: 25 },
    envParams: { period: 200, devPct: 0.05 }, // Mandatory Envelope 200 breakout trend filter
    minTakeProfitPoints: 18.70,
    minTakeProfitUsd: 4.00,
    trailActivationUsd: 3.00,
    maxHardStopPoints: 3.00,
    slType: "M15_FRACTAL",
    notes: "40x multiplier; M15 Fib + M5 Stoch 50 Midline Cross + Envelope 200 breakout filter + Previous M15 Fractal SL + $4.00 TP & Trailing ($3.00 act / $1.50 buffer)."
  },
  "1HZ100V": {
    symbol: "1HZ100V",
    symbolName: "Volatility 100 (1s) Index",
    repoLabel: "Ice Cream Machine",
    server: "S2",
    multiplier: 40,
    stakeUsd: 5.0,
    commissionUsd: 0.15,
    strategyProfile: "PROFILE_V100_1S_EMA_STOCH533",
    gateType: "EMA100_STOCH533",
    stochParams: { k: 5, d: 3, slowing: 3 }, // Fast M5 Stoch (5,3,3)
    emaPeriod: 100, // M5 EMA 100
    minTakeProfitPoints: 30.80,
    minTakeProfitUsd: 4.00,
    trailActivationUsd: 3.00,
    maxHardStopPoints: 5.50,
    slType: "M15_FRACTAL",
    notes: "Two-stage state machine: Stage 1: M5 EMA 100 direction arming lock (Fib key level entry bypassed); Stage 2: Fast Stoch (5,3,3) 20/80 cross trigger + M15 Fib levels for TP target + Fast Stoch 50 adverse cross / EMA 100 early exit + Previous M15 Fractal SL + $4.00 TP ($3.00 act / $1.50 buffer)."
  },
  "R_25": {
    symbol: "R_25",
    symbolName: "Volatility 25 Index",
    repoLabel: "Tea (V25 Demo)",
    server: "S1",
    multiplier: 400,
    stakeUsd: 5.0,
    commissionUsd: 0.32,
    strategyProfile: "PROFILE_V25_STOCH200_CCI100",
    gateType: "STOCH200_CCI100_M5FRACTAL",
    stochParams: { k: 200, d: 1, slowing: 1 },
    minTakeProfitPoints: 5.52,
    minTakeProfitUsd: 4.00,
    trailActivationUsd: 3.00,
    maxHardStopPoints: 18.00,
    slType: "M5_FRACTAL",
    notes: "400x multiplier ($1.38 pts/$1); Condition 1: M5 Stoch (200,1,1) Main Trend Identifier (cross above 50 arms BUY, cross below 50 arms SELL, no timer window); Condition 2: M5 CCI 100 zero-line cross execution (>0 for BUY, <0 for SELL); Condition 1 must happen before Condition 2, except simultaneous cross on same M5 candle close; Early Exit: Previous M5 Fractal break in loss; Fib TP min $4.00."
  },
  "R_50": {
    symbol: "R_50",
    symbolName: "Volatility 50 Index",
    repoLabel: "OmniSight (V50)",
    server: "S2",
    multiplier: 80,
    stakeUsd: 5.0,
    commissionUsd: 0.16,
    strategyProfile: "PROFILE_V50_STOCH_BOUNDARIES",
    gateType: "STOCH_BOUNDARIES_20_80",
    stochParams: { k: 18, d: 12, slowing: 25 },
    excludeFib50: true,
    minTakeProfitPoints: 1.63,
    minTakeProfitUsd: 4.00,
    trailActivationUsd: 3.00,
    maxHardStopPoints: 0.20,
    slType: "M15_FRACTAL",
    notes: "80x multiplier; M15 Fib + M5 Stoch (18,12,25) 20/80 boundary cross + Previous M15 Fractal SL + $4.00 TP & Trailing ($3.00 act / $1.50 buffer)."
  },
  "R_10": {
    symbol: "R_10",
    symbolName: "Volatility 10 Index",
    repoLabel: "Test Bot (V10 Live)",
    server: "S2",
    multiplier: 400,
    stakeUsd: 5.0,
    commissionUsd: 0.80,
    strategyProfile: "PROFILE_V10_MIDLINE_FRACTAL",
    gateType: "STOCH_50_MIDLINE",
    stochParams: { k: 18, d: 12, slowing: 25 },
    minTakeProfitPoints: 16.80,
    minTakeProfitUsd: 4.00,
    trailActivationUsd: 3.00,
    maxHardStopPoints: 8.00,
    slType: "M15_FRACTAL",
    notes: "400x multiplier ($2.40 pts/$1); M15 Fib + M5 Stoch 50 Midline Cross + Previous M15 Fractal SL + $4.00 TP & Trailing ($3.00 act / $1.50 buffer)."
  }
};

// ==================== ACTIVE INSTANCE SELECTOR ====================
// Select via environment variable SYMBOL (e.g. SYMBOL=R_75) or fallback to default
const ACTIVE_SYMBOL = process.env.SYMBOL || "R_75";
const PROFILE = INSTRUMENT_PROFILES[ACTIVE_SYMBOL] || INSTRUMENT_PROFILES["R_75"];

const SYMBOL = PROFILE.symbol;
const SYMBOL_NAME = PROFILE.symbolName;
const REPO_LABEL = PROFILE.repoLabel;
const MULTIPLIER = PROFILE.multiplier;
const COMMISSION_USD = PROFILE.commissionUsd;
const STAKE_USD = PROFILE.stakeUsd || 5.0;
const STOCH_SEPARATION_MIN = 0; // Pure directional crossover (zero separation barrier)
const MIN_TP_POINTS_FLOOR = PROFILE.minTakeProfitPoints;
const MAX_HARD_SL_POINTS = PROFILE.maxHardStopPoints;
const GATE_TYPE = PROFILE.gateType;
const STRATEGY_PROFILE = PROFILE.strategyProfile;

const TRADING_SYMBOL = SYMBOL;

const SOFTWARE_SL_USD = -2.50;
const SERVER_TP_USD = 10.00;
const CATASTROPHIC_PNL_FLOOR = -5.50;
const DAILY_PROFIT_TARGET_USD = 7.00;
const rawAppId = String(process.env.DERIV_APP_ID || process.env.APP_ID || "1089").trim();
const MARKET_DATA_APP_ID = /^\d+$/.test(rawAppId) ? rawAppId : "1089";
const TARGET_MIN_PROFIT = PROFILE.minTakeProfitUsd || 4.00;

// Continuous Dollar Trailing Stop Settings (High Activation + Wide Buffer Calibration)
const TRAIL_ACTIVATION_USD = PROFILE.trailActivationUsd || 3.00; // Activated once profit reaches +$3.00 net
const TRAIL_BUFFER_USD = 1.50;     // Trail $1.50 behind peak unrealized profit
const TRAIL_INITIAL_FLOOR_USD = 1.50; // Initial guaranteed lock at activation (+$3.00 peak - $1.50 buffer = +$1.50)

const STOCH_MIDLINE_FALLBACK_SYMBOLS = ["R_50", "R_10"];

const GATEWAY_URL = process.env.GATEWAY_URL || process.env.PROXY_URL || "http://127.0.0.1:3000";
const GATEWAY_SECRET = process.env.GATEWAY_SECRET || process.env.PROXY_SECRET;

const TG_TOKEN = process.env.TG_BOT_TOKEN || process.env.TG_TOKEN;
const TG_CHAT_ID = process.env.TG_CHAT_ID;
const MODE = process.env.MODE || "live";

const M5  = 5  * 60;
const M15 = 15 * 60;
const M30 = 30 * 60;
const D1  = 24 * 60 * 60;

const DEBUG = process.env.DEBUG === "true";
function dbg(...a) { if (DEBUG) console.log("[DBG]", ...a); }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function getContractSymbol(c) {
  if (!c) return "";
  return c.underlying_symbol || c.symbol || (c.shortcode ? c.shortcode.split("_")[1] : "");
}

function escapeMarkdown(text) {
  if (!text) return "";
  return String(text).replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1");
}

// ==================== TELEGRAM & UTILS ====================
function toAsciiJson(obj) {
  const json = JSON.stringify(obj);
  return json.replace(/[\u007F-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]/g, (c) => {
    if (c.length === 1) {
      return "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0");
    }
    return (
      "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0") +
      "\\u" + c.charCodeAt(1).toString(16).padStart(4, "0")
    );
  });
}

async function sendTelegram(msg) {
  if (!TG_TOKEN || !TG_CHAT_ID) return { ok: false, error: "missing_credentials" };
  const send = async (text, parseMode) => {
    const body = { chat_id: TG_CHAT_ID, text };
    if (parseMode) body.parse_mode = parseMode;
    const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: toAsciiJson(body)
    });
    let json;
    try { json = await res.json(); } catch (e) { json = { ok: false }; }
    return json;
  };
  try {
    const data = await send(msg, "Markdown");
    if (!data.ok) return await send(msg.replace(/[*_`\[\]]/g, ""), "");
    return data;
  } catch (e) { return { ok: false }; }
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

// ==================== DAILY LEDGER FLIGHT RECORDER ====================
function writeToLedger(epoch, closePrice, cci, stochK, stochD, envUp, envLo, phase, extra = "") {
  const dateStr = new Date(epoch * 1000).toISOString().split('T')[0];
  const file = `ledger_${SYMBOL}_${dateStr}.csv`;
  const timeStr = new Date(epoch * 1000).toISOString().replace("T", " ").substring(0, 19);
  const extraStr = extra ? `,${extra}` : "";
  const line = `${timeStr},${closePrice.toFixed(4)},${(cci !== null ? cci.toFixed(2) : "0.00")},${(stochK !== null ? stochK.toFixed(2) : "0.00")},${(stochD !== null ? stochD.toFixed(2) : "0.00")},${(envUp !== null ? envUp.toFixed(4) : "0.0000")},${(envLo !== null ? envLo.toFixed(4) : "0.0000")},${phase || "IDLE"}${extraStr}\n`;
  
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, "Time,Close,CCI,Stoch_K,Stoch_D,Env_Up,Env_Lo,Phase,Extra\n");
  }
  fs.appendFileSync(file, line);
}

// ==================== GATEWAY CLIENT CALLS ====================
async function gatewayFetch(endpoint, method = "GET", body = null, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${GATEWAY_URL}${endpoint}`, {
      method,
      headers: { "Content-Type": "application/json", "x-gateway-secret": GATEWAY_SECRET },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`Gateway HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

async function getOpenPortfolio() {
  const res = await gatewayFetch("/portfolio");
  if (!res.ok || !res.authorized) throw new Error("Gateway is currently disconnected");
  return res.portfolio || [];
}

async function executeTrade(direction) {
  const expectedContractType = direction === "BUY" ? "MULTUP" : "MULTDOWN";
  const slDollars = parseFloat(STAKE_USD.toFixed(2));
  const payload = {
    buy: "1", price: STAKE_USD,
    parameters: { 
      contract_type: expectedContractType, 
      underlying_symbol: TRADING_SYMBOL, 
      currency: "USD", 
      amount: STAKE_USD, 
      basis: "stake", 
      multiplier: MULTIPLIER, 
      limit_order: { stop_loss: slDollars, take_profit: SERVER_TP_USD } 
    }
  };
  const data = await gatewayFetch("/buy", "POST", payload);
  if (data.error) throw new Error(data.error.message);
  return data.buy?.contract_id;
}

async function closeContract(contractId) {
  const data = await gatewayFetch("/sell", "POST", { sell: contractId, price: 0 });
  if (data.error && data.error.code !== "ContractNotFound") throw new Error(data.error.message);
  return data;
}

async function getContractProfitFromHistory(contractId, approxOpenEpoch) {
  const data = await gatewayFetch("/profit_table", "POST", { 
    profit_table: 1, 
    description: 1, 
    limit: 25, 
    sort: "DESC", 
    date_from: approxOpenEpoch ? approxOpenEpoch - 300 : undefined 
  });
  const match = (data.profit_table?.transactions || []).find(tx => String(tx.contract_id) === String(contractId));
  if (!match) return null;
  return { 
    profit: typeof match.profit === "number" ? match.profit : (parseFloat(match.sell_price) - parseFloat(match.buy_price)), 
    sellTime: match.sell_time 
  };
}

// ==================== MARKET DATA FETCHERS (GATEWAY MULTIPLEXED + WS FALLBACK) ====================
async function fetchAllData() {
  // 1. Primary Path: Query authenticated deriv-gateway (0ms connection overhead, zero Cloudflare blocks)
  try {
    const [resM5, resM15, resM30, resD1] = await Promise.all([
      gatewayFetch("/ticks_history", "POST", { ticks_history: SYMBOL, granularity: M5,  count: 300, end: "latest", style: "candles" }),
      gatewayFetch("/ticks_history", "POST", { ticks_history: SYMBOL, granularity: M15, count: 250, end: "latest", style: "candles" }),
      gatewayFetch("/ticks_history", "POST", { ticks_history: SYMBOL, granularity: M30, count: 120, end: "latest", style: "candles" }),
      gatewayFetch("/ticks_history", "POST", { ticks_history: SYMBOL, granularity: D1,  count: 5,   end: "latest", style: "candles" })
    ]);

    if (resM5?.candles && resM15?.candles && resM30?.candles && resD1?.candles) {
      return { m5: resM5.candles, m15: resM15.candles, m30: resM30.candles, d1: resD1.candles };
    }
  } catch (gwErr) {
    dbg(`[GATEWAY CANDLES] Gateway query failed (${gwErr.message}). Trying direct WS fallback...`);
  }

  // 2. Fallback Path: Direct standard WebSocket query
  const endpoints = [
    `wss://ws.binaryws.com/websockets/v3?app_id=${MARKET_DATA_APP_ID}`,
    `wss://ws.derivws.com/websockets/v3?app_id=${MARKET_DATA_APP_ID}`
  ];

  let lastError = null;
  for (const endpointUrl of endpoints) {
    try {
      return await new Promise((resolve, reject) => {
        const ws = new WebSocket(endpointUrl);
        const results = {};
        let timer = null;
        let isSettled = false;

        const cleanup = () => {
          if (timer) clearTimeout(timer);
          try {
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
              if (typeof ws.terminate === "function") ws.terminate();
              else ws.close();
            }
          } catch (e) {}
        };

        timer = setTimeout(() => {
          if (!isSettled) {
            isSettled = true;
            cleanup();
            reject(new Error(`fetchAllData timeout on ${endpointUrl} (15s exceeded)`));
          }
        }, 15000);

        ws.on("open", () => {
          try {
            ws.send(JSON.stringify({ req_id: 1, ticks_history: SYMBOL, granularity: M5,  count: 300, end: "latest", style: "candles" }));
            ws.send(JSON.stringify({ req_id: 4, ticks_history: SYMBOL, granularity: M15, count: 250, end: "latest", style: "candles" }));
            ws.send(JSON.stringify({ req_id: 6, ticks_history: SYMBOL, granularity: M30, count: 120, end: "latest", style: "candles" }));
            ws.send(JSON.stringify({ req_id: 5, ticks_history: SYMBOL, granularity: D1,  count: 5,   end: "latest", style: "candles" }));
          } catch (err) {
            if (!isSettled) {
              isSettled = true;
              cleanup();
              reject(err);
            }
          }
        });

        ws.on("message", d => {
          try {
            const msg = JSON.parse(d);
            if (msg.error) {
              if (!isSettled) {
                isSettled = true;
                cleanup();
                reject(new Error(`Deriv WS error: ${msg.error.message || msg.error.code}`));
              }
              return;
            }
            if (msg.req_id === 1) results.m5  = msg.candles;
            if (msg.req_id === 4) results.m15 = msg.candles;
            if (msg.req_id === 6) results.m30 = msg.candles;
            if (msg.req_id === 5) results.d1  = msg.candles;
            if (results.m5 && results.m15 && results.m30 && results.d1) {
              if (!isSettled) {
                isSettled = true;
                cleanup();
                resolve(results);
              }
            }
          } catch (err) {
            if (!isSettled) {
              isSettled = true;
              cleanup();
              reject(err);
            }
          }
        });

        ws.on("error", err => {
          if (!isSettled) {
            isSettled = true;
            cleanup();
            reject(err);
          }
        });
      });
    } catch (err) {
      lastError = err;
      dbg(`[MARKET DATA] Endpoint ${endpointUrl} failed (${err.message}). Trying fallback...`);
      await sleep(1000);
    }
  }
  throw lastError || new Error("All Deriv market data endpoints failed");
}

async function fetchCurrentSpotPrice() {
  // 1. Primary Path: Query authenticated deriv-gateway
  try {
    const res = await gatewayFetch("/ticks_history", "POST", { ticks_history: SYMBOL, count: 1, end: "latest", style: "ticks" });
    if (res?.history?.prices?.length > 0) {
      return parseFloat(res.history.prices[res.history.prices.length - 1]);
    }
  } catch (e) {}

  // 2. Fallback Path: Direct standard WebSocket query
  const endpoints = [
    `wss://ws.binaryws.com/websockets/v3?app_id=${MARKET_DATA_APP_ID}`,
    `wss://ws.derivws.com/websockets/v3?app_id=${MARKET_DATA_APP_ID}`
  ];

  let lastError = null;
  for (const endpointUrl of endpoints) {
    try {
      return await new Promise((resolve, reject) => {
        const ws = new WebSocket(endpointUrl);
        let timer = null;
        let isSettled = false;

        const cleanup = () => {
          if (timer) clearTimeout(timer);
          try {
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
              if (typeof ws.terminate === "function") ws.terminate();
              else ws.close();
            }
          } catch (e) {}
        };

        timer = setTimeout(() => {
          if (!isSettled) {
            isSettled = true;
            cleanup();
            reject(new Error(`fetchCurrentSpotPrice timeout on ${endpointUrl} (4s exceeded)`));
          }
        }, 4000);

        ws.on("open", () => {
          try {
            ws.send(JSON.stringify({ req_id: 3, ticks_history: SYMBOL, count: 1, end: "latest", style: "ticks" }));
          } catch (err) {
            if (!isSettled) {
              isSettled = true;
              cleanup();
              reject(err);
            }
          }
        });

        ws.on("message", d => {
          try {
            const msg = JSON.parse(d);
            if (msg.error) {
              if (!isSettled) {
                isSettled = true;
                cleanup();
                reject(new Error(`Deriv WS spot error: ${msg.error.message || msg.error.code}`));
              }
              return;
            }
            if (msg.req_id === 3 && msg.history && msg.history.prices && msg.history.prices.length > 0) {
              if (!isSettled) {
                isSettled = true;
                cleanup();
                resolve(parseFloat(msg.history.prices[msg.history.prices.length - 1]));
              }
            }
          } catch (err) {
            if (!isSettled) {
              isSettled = true;
              cleanup();
              reject(err);
            }
          }
        });

        ws.on("error", err => {
          if (!isSettled) {
            isSettled = true;
            cleanup();
            reject(err);
          }
        });
      });
    } catch (err) {
      lastError = err;
      dbg(`[SPOT PRICE] Endpoint ${endpointUrl} failed (${err.message}). Trying fallback...`);
      await sleep(500);
    }
  }
  throw lastError || new Error("All Deriv spot price endpoints failed");
}

// ==================== TECHNICAL ANALYSIS ====================
function sma(data, period) {
  return data.map((_, i) => (i < period - 1 ? null : data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period));
}

export function calculateEMA(candles, period = 100) {
  const closes = candles.map(c => parseFloat(c.close));
  const out = new Array(closes.length).fill(null);
  if (closes.length < period) return out;
  const k = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) sum += closes[i];
  let prevEma = sum / period;
  out[period - 1] = prevEma;
  for (let i = period; i < closes.length; i++) {
    const curEma = (closes[i] * k) + (prevEma * (1 - k));
    out[i] = curEma;
    prevEma = curEma;
  }
  return out;
}

function emaArray(data, period) {
  const out = new Array(data.length).fill(null);
  const k = 2 / (period + 1);
  let firstIdx = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i] !== null && !isNaN(data[i])) {
      firstIdx = i;
      break;
    }
  }
  if (firstIdx === -1 || data.length - firstIdx < period) return out;
  let sum = 0;
  for (let i = firstIdx; i < firstIdx + period; i++) sum += data[i];
  let prevEma = sum / period;
  out[firstIdx + period - 1] = prevEma;
  for (let i = firstIdx + period; i < data.length; i++) {
    const val = data[i];
    if (val !== null && !isNaN(val)) {
      const curEma = (val * k) + (prevEma * (1 - k));
      out[i] = curEma;
      prevEma = curEma;
    } else {
      out[i] = prevEma;
    }
  }
  return out;
}

export function calculateStoch(candles, kPeriod = 18, dPeriod = 12, slowing = 25, method = "Simple") {
  const fastK = new Array(candles.length).fill(null);
  for (let i = kPeriod - 1; i < candles.length; i++) {
    const sl = candles.slice(i - kPeriod + 1, i + 1);
    const hh = Math.max(...sl.map(c => parseFloat(c.high)));
    const ll = Math.min(...sl.map(c => parseFloat(c.low)));
    const c = parseFloat(candles[i].close);
    fastK[i] = hh === ll ? 100 : ((c - ll) / (hh - ll)) * 100;
  }
  const isExp = String(method).toLowerCase() === "exponential";
  const smoothFn = isExp ? emaArray : sma;
  const slowK = smoothFn(fastK.map(v => (v !== null ? v : 50)), slowing).map((v, i) => (fastK[i] === null ? null : v));
  const slowD = smoothFn(slowK.map(v => (v !== null ? v : 50)), dPeriod).map((v, i) => (slowK[i] === null ? null : v));
  return { k: slowK, d: slowD };
}

export function calculateEnvelopes(candles, period = 50, devPct = 0.05) {
  const closes = candles.map(c => parseFloat(c.close));
  const mid = sma(closes, period);
  return {
    upper: mid.map(m => (m !== null ? m * (1 + devPct / 100) : null)),
    lower: mid.map(m => (m !== null ? m * (1 - devPct / 100) : null))
  };
}

export function calculateCCI(candles, n = 100) {
  const out = new Array(candles.length).fill(null);
  for (let i = n - 1; i < candles.length; i++) {
    const sl = candles.slice(i - n + 1, i + 1);
    const tp = sl.map(c => (parseFloat(c.high) + parseFloat(c.low) + parseFloat(c.close)) / 3);
    const m = tp.reduce((a, b) => a + b, 0) / n;
    const md = tp.reduce((s, v) => s + Math.abs(v - m), 0) / n;
    out[i] = md === 0 ? 0 : (tp[tp.length - 1] - m) / (0.015 * md);
  }
  return out;
}

export function computeDailyFibLevels(d1Candles) {
  if (!d1Candles || d1Candles.length < 2) return null;
  const yesterday = d1Candles[d1Candles.length - 2];
  const today     = d1Candles[d1Candles.length - 1];

  const h = parseFloat(yesterday.high), l = parseFloat(yesterday.low), o = parseFloat(yesterday.open), c = parseFloat(yesterday.close);
  const rng = h - l;
  if (rng <= 0) return null;

  const bullish = c > o;
  const dailyBiasPrice = parseFloat(today.open);

  return bullish
    ? { bullish, fibM50: h + 0.5*rng, fib0: h, fib50: h - 0.5*rng, fib79: h - 0.79*rng, fib100: l, fib1618: h - 1.618*rng, dailyBiasPrice }
    : { bullish, fibM50: l - 0.5*rng, fib0: l, fib50: l + 0.5*rng, fib79: l + 0.79*rng, fib100: h, fib1618: l + 1.618*rng, dailyBiasPrice };
}

// Finds previous institutional swing fractal on M15 timeframe (Top for SELL, Down for BUY)
export function findRecentFractalM15(m15Candles, direction) {
  if (!m15Candles || m15Candles.length < 5) return null;
  for (let k = m15Candles.length - 3; k >= 2; k--) {
    if (direction === "BUY") {
      const low = parseFloat(m15Candles[k].low);
      if (low < parseFloat(m15Candles[k - 1].low) && low < parseFloat(m15Candles[k - 2].low) &&
          low < parseFloat(m15Candles[k + 1].low) && low < parseFloat(m15Candles[k + 2].low)) {
        return low;
      }
    } else {
      const high = parseFloat(m15Candles[k].high);
      if (high > parseFloat(m15Candles[k - 1].high) && high > parseFloat(m15Candles[k - 2].high) &&
          high > parseFloat(m15Candles[k + 1].high) && high > parseFloat(m15Candles[k + 2].high)) {
        return high;
      }
    }
  }
  return null;
}

// Finds if an opposing M15 swing fractal has formed after trade entry (Fakeout Detection)
// For BUY trade: looks for an UPPER (Bearish swing high) fractal formed at or after entryEpoch
// For SELL trade: looks for a LOWER (Bullish swing low) fractal formed at or after entryEpoch
export function findNewOpposingFractalM15(m15Candles, direction, entryEpoch) {
  if (!m15Candles || m15Candles.length < 5 || !entryEpoch) return null;
  for (let k = m15Candles.length - 3; k >= 2; k--) {
    const candleEpoch = m15Candles[k].epoch;
    if (candleEpoch < (entryEpoch - 900)) break;

    if (direction === "BUY") {
      const high = parseFloat(m15Candles[k].high);
      if (high > parseFloat(m15Candles[k - 1].high) && high > parseFloat(m15Candles[k - 2].high) &&
          high > parseFloat(m15Candles[k + 1].high) && high > parseFloat(m15Candles[k + 2].high)) {
        return { price: high, epoch: candleEpoch, type: "UPPER_BEARISH" };
      }
    } else {
      const low = parseFloat(m15Candles[k].low);
      if (low < parseFloat(m15Candles[k - 1].low) && low < parseFloat(m15Candles[k - 2].low) &&
          low < parseFloat(m15Candles[k + 1].low) && low < parseFloat(m15Candles[k + 2].low)) {
        return { price: low, epoch: candleEpoch, type: "LOWER_BULLISH" };
      }
    }
  }
  return null;
}


// Stochastic Continuous State-Based Arming (Unbounded by time: remains armed as long as %K is on the valid side of the threshold)
function checkStochastic8HrLookback(candles, stoch, dir, type = "MIDLINE") {
  if (!candles || candles.length < 2 || !stoch || !stoch.k) return false;
  
  // Evaluation index: latest completed candle
  const lastK = stoch.k[candles.length - 2];
  if (lastK === null || isNaN(lastK)) return false;

  if (type === "MIDLINE") {
    // BUY is armed whenever %K >= 50.0; SELL is armed whenever %K <= 50.0
    if (dir === "BUY") return lastK >= 50.0;
    if (dir === "SELL") return lastK <= 50.0;
  } else if (type === "BOUNDARIES_20_80") {
    // BUY is armed whenever %K >= 20.0; SELL is armed whenever %K <= 80.0
    if (dir === "BUY") return lastK >= 20.0;
    if (dir === "SELL") return lastK <= 80.0;
  }

  return false;
}

// Finds the candle epoch when the latest continuous cross/arming occurred
function findStochasticCrossCandleEpoch(candles, stoch, dir, type = "MIDLINE") {
  if (!candles || candles.length < 2 || !stoch || !stoch.k) return null;
  const lastIdx = candles.length - 2;

  // Walk backwards from latest completed candle
  for (let i = lastIdx; i >= 1; i--) {
    const k = stoch.k[i];
    const prevK = stoch.k[i - 1];
    if (k === null || prevK === null || isNaN(k) || isNaN(prevK)) break;

    if (type === "MIDLINE") {
      if (dir === "BUY") {
        if (k < 50.0) return candles[i + 1] ? candles[i + 1].epoch : null;
        if (prevK <= 50.0 && k >= 50.0) return candles[i].epoch;
      } else if (dir === "SELL") {
        if (k > 50.0) return candles[i + 1] ? candles[i + 1].epoch : null;
        if (prevK >= 50.0 && k <= 50.0) return candles[i].epoch;
      }
    } else if (type === "BOUNDARIES_20_80") {
      if (dir === "BUY") {
        if (k < 20.0) return candles[i + 1] ? candles[i + 1].epoch : null;
        if (prevK <= 20.0 && k >= 20.0) return candles[i].epoch;
      } else if (dir === "SELL") {
        if (k > 80.0) return candles[i + 1] ? candles[i + 1].epoch : null;
        if (prevK >= 80.0 && k <= 80.0) return candles[i].epoch;
      }
    }
  }
  return null;
}

const checkStochasticStateArmed = checkStochastic8HrLookback;

function deriveHardStopPrice(entry, direction) {
  const targetLoss = -5.00;
  const requiredRawPnl = targetLoss + COMMISSION_USD;
  const priceMoveFraction = requiredRawPnl / (STAKE_USD * MULTIPLIER);
  const dollarSlPrice = direction === "BUY" ? entry * (1 + priceMoveFraction) : entry * (1 - priceMoveFraction);

  return dollarSlPrice;
}

function calcUnrealizedPnL(trade, currentPrice) {
  const rawPnl = trade.direction === "BUY"
    ? (currentPrice - trade.entry) / trade.entry * STAKE_USD * MULTIPLIER
    : (trade.entry - currentPrice) / trade.entry * STAKE_USD * MULTIPLIER;
  return rawPnl - COMMISSION_USD;
}

function findRecentFractal(candles, currentIndex, direction) {
  for (let k = currentIndex - 2; k >= 2; k--) {
    if (direction === "BUY") {
      const low = parseFloat(candles[k].low);
      if (low < parseFloat(candles[k - 1].low) && low < parseFloat(candles[k - 2].low) &&
          low < parseFloat(candles[k + 1].low) && low < parseFloat(candles[k + 2].low)) return low;
    } else {
      const high = parseFloat(candles[k].high);
      if (high > parseFloat(candles[k - 1].high) && high > parseFloat(candles[k - 2].high) &&
          high > parseFloat(candles[k + 1].high) && high > parseFloat(candles[k + 2].high)) return high;
    }
  }
  return null;
}

// ==================== STATE MANAGEMENT ====================
let state = {
  symbol: SYMBOL,
  currentPrice: null,
  lastPriceUpdate: null,
  lastProcessedEpoch: null, lastTgUpdateId: 0, armed: null, armedEpoch: null, armedTime: null, confirm: null, dailyBiasPrice: null,
  last50Origin: null,
  lastTriggeredSetup: null,
  lastTriggeredEpoch: null,
  dailyNetPnl: 0,
  dailyTargetReached: false,
  dailyTargetDate: null,
  // Persistent directional state tracking
  stochState: null,
  stochSeparation: null,
  cciState: null,
  nextPhase: null, h1TdiDir: null, fibBullish: null, fib0: null, fib50: null, fib618: null, fib79: null, fib100: null,
  cciAligned: false, stochAligned: false, envAligned: false, emaAligned: false,
  // Indicator telemetry values
  strategyProfile: STRATEGY_PROFILE,
  stochVal: null,
  stochSignal: null,
  cciVal: null,
  envUpper: null,
  envLower: null,
  ema100Val: null,
  stoch533Val: null,
  stoch50CrossUp: false,
  stoch50CrossDown: false,
  stoch50Above: false,
  stoch50Below: false,
  stoch50Cross: false,
  ema100BuyArmed: false,
  ema100SellArmed: false,
  stoch533BuyCross: false,
  stoch533SellCross: false,
  envBuyActive: false,
  envSellActive: false,
  cciCrossBuy: false,
  cciCrossSell: false,
  stoch20CrossUp: false,
  stoch80CrossDown: false,
  stoch20Above: false,
  stoch80Below: false,
  // V100 (1s) Two-stage state machine
  v100_1s_armed: false,
  v100_1s_armDir: null,
  latchStoch533_BUY: false,
  latchStoch533_SELL: false,
  // V75 Retracement Touch Latches
  v75_emaTouched_BUY: false,
  v75_emaTouched_SELL: false,
  // V25 Stoch (200,1,1) Trend Indicator Arming
  v25_trendDirection: null,
  // V25 Out-of-Order 3-way latches
  latchFib_BUY: false,
  latchFib_SELL: false,
  latchCci_BUY: false,
  latchCci_SELL: false,
  latchStoch_BUY: false,
  latchStoch_SELL: false,
  engineVersion: "v6.2-master",
  codeTimestamp: "2026-10-03T10:35:00Z"
};
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_FILE_PATH = path.resolve(__dirname, "state.json");
const TRADES_FILE_PATH = path.resolve(__dirname, "trades.json");

const ENGINE_VERSION = "v6.2-master";
const CODE_TIMESTAMP = "2026-10-03T10:35:00Z";

try { state = { ...state, ...JSON.parse(fs.readFileSync(STATE_FILE_PATH, "utf8")) }; } catch {}
state.engineVersion = ENGINE_VERSION;
state.codeTimestamp = CODE_TIMESTAMP;
function saveState() {
  state.engineVersion = ENGINE_VERSION;
  state.codeTimestamp = CODE_TIMESTAMP;
  fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2));
}
function loadTrades() { try { return JSON.parse(fs.readFileSync(TRADES_FILE_PATH, "utf8")); } catch { return []; } }
function saveTrades(t) { fs.writeFileSync(TRADES_FILE_PATH, JSON.stringify(t, null, 2)); }

// ==================== FAST PATH: RISK MANAGEMENT (ADAPTIVE: 3S IN-TRADE / 10S IDLE) ====================
const closingContracts = new Set();

async function manageOpenTradesFastPath() {
  let trades = loadTrades();
  let openTrades = trades.filter(t => !t.result && !t.pending);
  if (openTrades.length === 0) return false;

  let currentPrice;
  try {
    currentPrice = await fetchCurrentSpotPrice();
    state.symbol = SYMBOL;
    state.currentPrice = currentPrice;
    state.lastPriceUpdate = new Date().toISOString();
    saveState();
  } catch (e) {
    // If transient price fetch failure occurred but trade is open, maintain in-trade flag
    return true;
  }

  for (const openTrade of openTrades) {
    if (!openTrade.contractId || closingContracts.has(openTrade.contractId)) continue;
    
    const isBuy = openTrade.direction === "BUY";
    const pnl = calcUnrealizedPnL(openTrade, currentPrice);

    // =========================================================================
    // 🛡️ TWO-TIER DYNAMIC PROFIT RATCHET (Breakeven Shield at +$2.50 -> Full Trail at +$4.00)
    // =========================================================================
    if (pnl >= 2.50) {
      if (!openTrade.maxUnrealizedPnl || pnl > openTrade.maxUnrealizedPnl) {
        openTrade.maxUnrealizedPnl = parseFloat(pnl.toFixed(2));
      }
      
      // Tier 1 (+$2.50): Capital Shield — Locks +$0.50 net (covers commission), leaves generous breathing buffer
      let targetFloor = 0.50;
      
      // Tier 2 (+$4.00+): Target Trailing — Locks +$3.00 minimum, trails $1.00 behind peak profit
      if (openTrade.maxUnrealizedPnl >= 4.00) {
        targetFloor = Math.max(3.00, openTrade.maxUnrealizedPnl - 1.00);
      }
      
      targetFloor = parseFloat(targetFloor.toFixed(2));

      if (!openTrade.lockedPnlFloor || targetFloor > openTrade.lockedPnlFloor) {
        openTrade.lockedPnlFloor = targetFloor;
        saveTrades(trades);
        console.log(`[TRAIL-STOP] ${openTrade.contractId} Peak PnL +$${openTrade.maxUnrealizedPnl.toFixed(2)} -> Trailing floor ratcheted to +$${openTrade.lockedPnlFloor.toFixed(2)}.`);
      }
    }
    // =========================================================================

    const hardStopPrice = deriveHardStopPrice(openTrade.entry, openTrade.direction);

    const hardStopBreached = isBuy ? currentPrice <= hardStopPrice : currentPrice >= hardStopPrice;
    let tpHit = false;
    if (openTrade.fibTpPrice) {
      tpHit = isBuy ? currentPrice >= openTrade.fibTpPrice : currentPrice <= openTrade.fibTpPrice;
    }

    // 🛡️ Rescue Retracement Exit: If this is an old parent trade with an active rescue position,
    // and price retraces back to old trade's entry price, close the old trade once its profit reaches at least +$0.20
    const activeRescueTrade = trades.find(t => !t.result && !t.pending && t.isRescue && (t.parentId === openTrade.id || t.parentContractId === openTrade.contractId));
    let rescueBreakevenHit = false;
    if (activeRescueTrade && !openTrade.isRescue) {
      const reachedOldEntry = isBuy ? currentPrice >= openTrade.entry : currentPrice <= openTrade.entry;
      if (reachedOldEntry && pnl >= 0.20) {
        rescueBreakevenHit = true;
      }
    }

    // 🛡️ Opposite M15 Fractal Fakeout Protection:
    // If trade has an opposing M15 fractal detected and is retracing in loss (adverse to entry)
    let fakeoutExitTriggered = false;
    if (openTrade.opposingM15Fractal && pnl < 0) {
      const isRetracing = isBuy ? currentPrice < openTrade.entry : currentPrice > openTrade.entry;
      if (isRetracing) {
        fakeoutExitTriggered = true;
      }
    }

    let reason = null;
    if (tpHit) { 
      reason = `Fib TP reached at ${currentPrice.toFixed(4)} (+ $${pnl.toFixed(2)})`; 
    } 
    else if (rescueBreakevenHit) {
      reason = `Rescue Retracement Target hit — Old position closed at +$${pnl.toFixed(2)} (>= +$0.20 profit) while rescue contract ${activeRescueTrade.contractId} runs to TP`;
    }
    else if (fakeoutExitTriggered) {
      reason = `Opposite M15 Fractal Fakeout Exit — Closed at ${currentPrice.toFixed(4)} ($${pnl.toFixed(2)}) to avoid full -$2.50 SL (Opposing ${openTrade.opposingM15Fractal.type} at ${Number(openTrade.opposingM15Fractal.price).toFixed(4)})`;
    }
    else if (openTrade.lockedPnlFloor && pnl <= openTrade.lockedPnlFloor) { 
      reason = `Profit-Lock hit — Secured +$${openTrade.lockedPnlFloor.toFixed(2)}`; 
    }
    else if (hardStopBreached) { reason = `Hard SL breached at ${currentPrice.toFixed(4)}`; } 
    else if (pnl <= CATASTROPHIC_PNL_FLOOR) { reason = `Catastrophic floor hit — PnL $${pnl.toFixed(2)}`; } 
    else if (pnl <= SOFTWARE_SL_USD) { reason = `Software SL hit — PnL $${pnl.toFixed(2)}`; }

    if (reason) {
      closingContracts.add(openTrade.contractId);
      console.log(`[RISK] Closing ${openTrade.contractId}: ${reason}`);
      let serverPnl = pnl, resultSource = "estimated_fallback";
      
      try {
        const closeRes = await closeContract(openTrade.contractId);
        if (closeRes && !closeRes.error) {
          serverPnl = closeRes.sell?.profit ?? pnl;
          resultSource = "server_close_confirmed";
        }
      } catch (e) {
        closingContracts.delete(openTrade.contractId);
        continue;
      }

      const finalResult = serverPnl >= 0 ? "WIN" : "LOSS";
      openTrade.result = finalResult;
      openTrade.resultSource = resultSource;
      openTrade.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
      openTrade.serverPnl = serverPnl;
      
      // Update cumulative daily net PnL
      state.dailyNetPnl = (state.dailyNetPnl || 0) + serverPnl;
      if (state.dailyNetPnl >= DAILY_PROFIT_TARGET_USD) {
        state.dailyTargetReached = true;
        state.dailyTargetDate = new Date().toISOString().split("T")[0];
        console.log(`[DAILY TARGET] +$${DAILY_PROFIT_TARGET_USD.toFixed(2)} Daily Goal Achieved ($${state.dailyNetPnl.toFixed(2)}). Switching to IDLE_DAILY_TARGET_REACHED.`);
        await sendTelegram(`🎯 *${REPO_LABEL} — DAILY TARGET ACHIEVED!* 🎯\n\nDaily Net Profit: *+$${state.dailyNetPnl.toFixed(2)}*\nBot is now locked in profit protection until 00:00 UTC rollover.`);
      }

      // Disarm setup upon trade exit to require a fresh key level re-test or fresh indicator reset
      state.armed = null;
      state.armedEpoch = null;
      state.armedTime = null;
      state.keyLevelTouched = false;
      state.levelTouched = null;
      state.v75_emaTouched_BUY = false;
      state.v75_emaTouched_SELL = false;
      state.v75_1s_emaTouched_BUY = false;
      state.v75_1s_emaTouched_SELL = false;
      state.v100_1s_armed = false;
      state.v100_1s_armDir = null;
      state.latchStoch533_BUY = false;
      state.latchStoch533_SELL = false;
      state.latchFib_BUY = false;
      state.latchFib_SELL = false;
      state.latchCci_BUY = false;
      state.latchCci_SELL = false;
      state.latchStoch_BUY = false;
      state.latchStoch_SELL = false;
      state.rescueStochArmed = false;

      saveTrades(trades);
      saveState();
      closingContracts.delete(openTrade.contractId);
      
      const icon = finalResult === "WIN" ? "✅" : "❌";
      const pnlStr = serverPnl >= 0 ? `+$${serverPnl.toFixed(2)}` : `-$${Math.abs(serverPnl).toFixed(2)}`;
      const durationMs = new Date(openTrade.closeTime) - new Date(openTrade.openTime);
      await sendTelegram(`${icon} *${REPO_LABEL} — Trade ${finalResult}*\n\nDirection: ${openTrade.direction}\n📍 Entry: ${Number(openTrade.entry).toFixed(4)}\n🏁 Exit: ${currentPrice.toFixed(4)}\n\n💵 P&L: *${pnlStr}* (Net of comm.)\nReason: ${reason}\nDuration: ${formatDuration(durationMs)}\nDaily Net Total: $${state.dailyNetPnl.toFixed(2)}\nContract: \`${openTrade.contractId}\``);
    }
  }

  // Return whether any trades remain actively open and unclosed
  const remainingTrades = loadTrades();
  return remainingTrades.some(t => !t.result && !t.pending);
}

// =========================================================================
// 🛡️ OPPOSITE M15 FRACTAL FAKEOUT PROTECTION (STOCHASTIC 18,12,25 INSTRUMENTS)
// If trade retraces immediately after entry and an M15 fractal draws on the opposite
// side of the trade while in negative PnL, exit immediately to prevent hitting full -$2.50 SL.
// =========================================================================
async function checkOppositeFractalFakeoutExit(m15Candles, currentPrice) {
  const isStoch18Profile = 
    PROFILE.stochParams?.k === 18 && 
    PROFILE.stochParams?.d === 12 && 
    (STRATEGY_PROFILE === "PROFILE_V75_MIDLINE_FRACTAL" || 
     STRATEGY_PROFILE === "PROFILE_V10_MIDLINE_FRACTAL" || 
     STRATEGY_PROFILE === "PROFILE_V100_MIDLINE_ENV" ||
     STRATEGY_PROFILE === "PROFILE_V50_STOCH_BOUNDARIES");

  if (!isStoch18Profile || !m15Candles || m15Candles.length < 5) return;

  let trades = loadTrades();
  const openTrades = trades.filter(t => !t.result && !t.pending && !closingContracts.has(t.contractId));
  if (openTrades.length === 0) return;

  for (const openTrade of openTrades) {
    if (!openTrade.contractId) continue;
    const isBuy = openTrade.direction === "BUY";
    const pnl = calcUnrealizedPnL(openTrade, currentPrice);

    // Only triggers if trade is retracing in loss (floating loss, price adverse to entry)
    const isRetracing = isBuy ? (currentPrice < openTrade.entry && pnl < 0) : (currentPrice > openTrade.entry && pnl < 0);

    // Look for opposing M15 fractal formed after trade entry
    const oppFractal = findNewOpposingFractalM15(m15Candles, openTrade.direction, openTrade.entryEpoch);
    if (!oppFractal) continue;

    // Tag opposing fractal on the trade record
    openTrade.opposingM15Fractal = oppFractal;
    saveTrades(trades);

    if (!isRetracing) continue;

    // Confirmed Fakeout: Opposite M15 fractal drawn while trade is retracing in loss
    console.log(`[FAKEOUT PROTECTION] 🚨 ${SYMBOL} Trade #${openTrade.contractId} (${openTrade.direction}) Fakeout detected!`);
    console.log(`  • Entry: ${Number(openTrade.entry).toFixed(4)} at epoch ${openTrade.entryEpoch}`);
    console.log(`  • Current Price: ${currentPrice.toFixed(4)} (PnL: $${pnl.toFixed(2)})`);
    console.log(`  • Opposing M15 Fractal: ${oppFractal.type} at ${oppFractal.price.toFixed(4)} (epoch ${oppFractal.epoch})`);
    console.log(`  • Action: Executing early exit to prevent full -$2.50 SL hit.`);

    closingContracts.add(openTrade.contractId);
    let serverPnl = pnl, resultSource = "fakeout_exit_fallback";
    try {
      const closeRes = await closeContract(openTrade.contractId);
      if (closeRes && !closeRes.error) {
        serverPnl = closeRes.sell?.profit ?? pnl;
        resultSource = "server_close_confirmed";
      }
    } catch (e) {
      closingContracts.delete(openTrade.contractId);
      continue;
    }

    openTrade.result = "LOSS";
    openTrade.resultSource = resultSource;
    openTrade.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
    openTrade.serverPnl = serverPnl;

    state.dailyNetPnl = (state.dailyNetPnl || 0) + serverPnl;
    // Disarm setup upon fakeout exit to require a fresh key level re-test or fresh indicator reset
    state.armed = null;
    state.armedEpoch = null;
    state.armedTime = null;
    state.keyLevelTouched = false;
    state.levelTouched = null;
    state.v75_emaTouched_BUY = false;
    state.v75_emaTouched_SELL = false;
    state.v75_1s_emaTouched_BUY = false;
    state.v75_1s_emaTouched_SELL = false;
    state.v100_1s_armed = false;
    state.v100_1s_armDir = null;
    state.latchStoch533_BUY = false;
    state.latchStoch533_SELL = false;
    state.latchFib_BUY = false;
    state.latchFib_SELL = false;
    state.latchCci_BUY = false;
    state.latchCci_SELL = false;
    state.latchStoch_BUY = false;
    state.latchStoch_SELL = false;
    state.rescueStochArmed = false;

    saveTrades(trades);
    saveState();
    closingContracts.delete(openTrade.contractId);

    const durationMs = new Date(openTrade.closeTime) - new Date(openTrade.openTime);
    await sendTelegram(
      `🛡️ *${REPO_LABEL} — OPPOSITE M15 FRACTAL FAKEOUT EXIT* 🛡️\n\n` +
      `Direction: ${openTrade.direction}\n` +
      `📍 Entry: ${Number(openTrade.entry).toFixed(4)}\n` +
      `🏁 Early Exit: ${currentPrice.toFixed(4)}\n` +
      `🛑 Avoided SL: -$2.50 Full Barrier\n\n` +
      `💵 P&L: *-$${Math.abs(serverPnl).toFixed(2)}* (Capped Loss)\n` +
      `Reason: Opposite M15 ${oppFractal.type} Fractal formed at ${oppFractal.price.toFixed(4)} while retracing. Structural fakeout confirmed.\n` +
      `Duration: ${formatDuration(durationMs)}\n` +
      `Daily Net Total: $${state.dailyNetPnl.toFixed(2)}\n` +
      `Contract: \`${openTrade.contractId}\``
    );
  }
}

// =========================================================================
// 🚑 LOSS RECOVERY / RESCUE ENTRY ENGINE (FOR STOCH 50 MIDLINE INSTRUMENTS)
// =========================================================================
async function checkAndExecuteRescueEntry(candles, currentPrice, m5BoundaryEpoch) {
  // Early trade recovery applies EXCLUSIVELY to instruments utilizing Stochastic (18, 12, 25)
  const isStoch18Profile = 
    PROFILE.stochParams?.k === 18 && 
    PROFILE.stochParams?.d === 12 && 
    (STRATEGY_PROFILE === "PROFILE_V75_MIDLINE_FRACTAL" || 
     STRATEGY_PROFILE === "PROFILE_V10_MIDLINE_FRACTAL" || 
     STRATEGY_PROFILE === "PROFILE_V100_MIDLINE_ENV" ||
     STRATEGY_PROFILE === "PROFILE_V50_STOCH_BOUNDARIES");
  
  if (!isStoch18Profile) return;

  let trades = loadTrades();
  const openTrades = trades.filter(t => !t.result && !t.pending);
  const parentTrade = openTrades.find(t => !t.isRescue);

  if (!parentTrade || !parentTrade.contractId) {
    state.rescueStochArmed = false;
    return;
  }

  // Verify that no rescue trade is already active for this parent trade
  const existingRescue = openTrades.find(t => t.isRescue && (t.parentId === parentTrade.id || t.parentContractId === parentTrade.contractId));
  if (existingRescue) {
    return;
  }

  // Must be in floating loss
  const parentPnl = calcUnrealizedPnL(parentTrade, currentPrice);
  if (parentPnl >= 0) {
    state.rescueStochArmed = false;
    return;
  }

  const si = candles.length - 2;

  // 1. Fast Stoch (5,3,3) Extreme Retracement & Level Crossing Trigger
  // For BUY: retrace to 20 level and cross > 20
  // For SELL: retrace to 80 level and cross < 80
  const stoch533 = calculateStoch(candles, 5, 3, 3);
  const sK533 = stoch533.k[si], sD533 = stoch533.d[si], prevK533 = stoch533.k[si - 1], prevD533 = stoch533.d[si - 1];
  if (sK533 === null || prevK533 === null) return;

  let stoch533Cross = false;
  if (parentTrade.direction === "BUY") {
    if (prevK533 <= 20.0 || sK533 <= 20.0) state.rescueStochArmed = true;
    stoch533Cross = (prevK533 <= 20.0 && sK533 > 20.0) || (state.rescueStochArmed && sK533 > 20.0);
  } else if (parentTrade.direction === "SELL") {
    if (prevK533 >= 80.0 || sK533 >= 80.0) state.rescueStochArmed = true;
    stoch533Cross = (prevK533 >= 80.0 && sK533 < 80.0) || (state.rescueStochArmed && sK533 < 80.0);
  }

  if (!stoch533Cross) {
    return;
  }

  // 2. Main Stochastic Indicator %K vs %D Directional Alignment
  // The bot can only enter a trade recovery if %K is below %D for a SELL and %K is above %D for a BUY on the Main Stoch
  const mainStochParams = PROFILE.stochParams || { k: 18, d: 12, slowing: 25 };
  const mainStoch = calculateStoch(candles, mainStochParams.k, mainStochParams.d, mainStochParams.slowing, mainStochParams.method || "Simple");
  const mainK = mainStoch.k[si], mainD = mainStoch.d[si];
  if (mainK === null || mainD === null) return;

  const mainStochAligned = parentTrade.direction === "BUY" ? mainK > mainD : mainK < mainD;
  if (!mainStochAligned) {
    console.log(`[RESCUE ENGINE] ${SYMBOL} Fast Stoch (5,3,3) triggered, but Main Stoch (${mainStochParams.k},${mainStochParams.d},${mainStochParams.slowing}) is not aligned: %K ${mainK.toFixed(1)} vs %D ${mainD.toFixed(1)} (Requires ${parentTrade.direction === "BUY" ? "%K > %D" : "%K < %D"}). Rescue gated.`);
    return;
  }

  console.log(`[RESCUE ENGINE] 🚨 All conditions satisfied for ${SYMBOL} Loss Recovery / Rescue Entry!`);
  console.log(`  • Parent Trade: #${parentTrade.contractId} (${parentTrade.direction} @ ${Number(parentTrade.entry).toFixed(4)}, PnL: $${parentPnl.toFixed(2)})`);
  console.log(`  • Fast Stoch (5,3,3) Trigger: CONFIRMED (%K: ${sK533.toFixed(1)}, prev: ${prevK533.toFixed(1)})`);
  console.log(`  • Main Stoch (${mainStochParams.k},${mainStochParams.d},${mainStochParams.slowing}) Alignment: CONFIRMED (%K: ${mainK.toFixed(1)} ${parentTrade.direction === "BUY" ? ">" : "<"} %D: ${mainD.toFixed(1)})`);

  const direction = parentTrade.direction;
  const entry = currentPrice;
  const sl = parentTrade.sl; // Inherited opposite M15 fractal recorded when the old trade was placed
  const fibTpPrice = parentTrade.fibTpPrice; // Same TP target as old trade
  const timeFormatted = new Date(m5BoundaryEpoch * 1000).toISOString().replace("T", " ").substring(0, 19);
  const dirEmoji = direction === "BUY" ? "🟢 ⬆️ BUY" : "🔴 ⬇️ SELL";

  const pendingRescueRecord = {
    id: `${SYMBOL}-RESCUE-${Date.now()}`,
    contractId: null,
    pending: true,
    repo: REPO_LABEL,
    symbol: SYMBOL,
    direction,
    entry,
    sl,
    rr: null,
    entryType: "RESCUE_ENTRY_STOCH533",
    brokerSlAmount: STAKE_USD,
    entryEpoch: m5BoundaryEpoch,
    fractalSl: parentTrade.fractalSl || parentTrade.sl,
    fractalEpoch: null,
    fractalTimeframe: parentTrade.fractalTimeframe || "M15",
    m30FractalUpgraded: false,
    fibTpPrice,
    keyLevel: parentTrade.keyLevel || null,
    openTime: timeFormatted,
    closeTime: null,
    result: null,
    isRescue: true,
    parentId: parentTrade.id,
    parentContractId: parentTrade.contractId
  };

  trades.push(pendingRescueRecord);
  saveTrades(trades);

  const rescueMessage = 
    `🚑 *${SYMBOL_NAME.toUpperCase()} — LOSS RECOVERY / RESCUE ENTRY* 🚑\n\n` +
    `Direction: *${dirEmoji}*\n` +
    `Setup: *Loss Recovery (Fast Stoch 5,3,3 Cross + Main Stoch %K/%D Alignment)*\n` +
    `📍 Rescue Entry: *${entry.toFixed(4)}*\n` +
    `🛑 Stop Loss: *${Number(sl).toFixed(4)}* (Inherited from Parent Trade)\n` +
    `🎯 Take Profit: *${fibTpPrice ? Number(fibTpPrice).toFixed(4) : "Parent TP Target"}*\n` +
    `💰 Stake: $${STAKE_USD} | Multiplier: ${MULTIPLIER}x\n\n` +
    `🔗 *Parent Trade Reference:*\n` +
    `• Parent Contract: \`${parentTrade.contractId}\` (${parentTrade.direction} @ ${Number(parentTrade.entry).toFixed(4)})\n` +
    `• Floating Loss at Rescue: *$${parentPnl.toFixed(2)}*\n` +
    `• Fast Stoch (5,3,3): *%K ${sK533.toFixed(1)}* (${direction === "BUY" ? "> 20 Cross" : "< 80 Cross"})\n` +
    `• Main Stoch (${mainStochParams.k},${mainStochParams.d},${mainStochParams.slowing}): *%K ${mainK.toFixed(1)}* ${direction === "BUY" ? ">" : "<"} *%D ${mainD.toFixed(1)}* (*Validated*)\n` +
    `• Strategy: *When price retraces to ${Number(parentTrade.entry).toFixed(4)}, parent trade will close at >= +$0.20 while this rescue position runs to TP.*\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `⏰ Time (UTC): ${timeFormatted}`;

  try {
    const contractId = await executeTrade(direction);
    if (!contractId) {
      trades.splice(trades.findIndex(t => t.id === pendingRescueRecord.id), 1);
      saveTrades(trades);
      await sendTelegram(`❌ *${REPO_LABEL}* — Rescue entry triggered, but broker returned no contract ID. Aborted.`);
      return;
    }
    pendingRescueRecord.contractId = contractId;
    pendingRescueRecord.pending = false;
    saveTrades(trades);

    state.rescueStochArmed = false;
    saveState();

    await sendTelegram(rescueMessage);
  } catch (execErr) {
    trades.splice(trades.findIndex(t => t.id === pendingRescueRecord.id), 1);
    saveTrades(trades);
    await sendTelegram(`❌ *${REPO_LABEL}* — Rescue entry live execution failed: ${execErr.message}`);
  }
}

// ==================== SLOW PATH (RUNS ON CLOSED M5 CANDLE) ====================
async function runSlowPathScan(m5BoundaryEpoch) {
  console.log(`[${REPO_LABEL}] Scanning closed M5 candle: ${new Date(m5BoundaryEpoch * 1000).toISOString()}`);
  state.lastProcessedEpoch = m5BoundaryEpoch;
  saveState();
  let trades = loadTrades();

  // Daily UTC Rollover Reset for Target Cap & PnL Accumulator
  const todayStr = new Date(m5BoundaryEpoch * 1000).toISOString().split("T")[0];
  if (!state.currentDayDate || state.currentDayDate !== todayStr) {
    console.log(`[DAILY ROLLOVER] New UTC Day detected (${todayStr}). Resetting daily net PnL, target lock, and daily key level touch state.`);
    state.currentDayDate = todayStr;
    state.dailyTargetDate = todayStr;
    state.dailyTargetReached = false;
    state.dailyNetPnl = 0;
    state.dailyKeyLevelTouchedToday = false;
    saveState();
  }

  // If daily target reached, protect profits and remain idle
  if (state.dailyTargetReached) {
    state.lastProcessedEpoch = m5BoundaryEpoch;
    saveState();
    return;
  }
  
  // 1. Gateway Portfolio Sync
  try {
    const allPortfolio = await getOpenPortfolio();
    const liveContracts = allPortfolio.filter(c => getContractSymbol(c) === TRADING_SYMBOL);
    
    for (const live of liveContracts) {
      if (!trades.find(t => String(t.contractId) === String(live.contract_id))) {
        const entryPrice = live.buy_price ? parseFloat(live.buy_price) : await fetchCurrentSpotPrice(); 
        const dir = live.contract_type === "MULTUP" ? "BUY" : "SELL";
        trades.push({
          id: `${SYMBOL}-${Date.now()}`, contractId: live.contract_id, pending: false, repo: REPO_LABEL, symbol: SYMBOL,
          direction: dir, entry: entryPrice, sl: deriveHardStopPrice(entryPrice, dir), rr: null, entryType: "RECOVERED_LIVE", brokerSlAmount: STAKE_USD,
          entryEpoch: live.date_start, fractalSl: null, fractalEpoch: null, fractalTimeframe: null, m30FractalUpgraded: false, fibTpPrice: null, keyLevel: null,
          openTime: new Date(live.date_start * 1000).toISOString().replace("T", " ").substring(0, 19), closeTime: null, result: null
        });
        await sendTelegram(`⚠️ *${REPO_LABEL}* — Adopted unmanaged live contract \`${live.contract_id}\` (${dir}).`);
      }
    }
    
    const liveIdSet = new Set(liveContracts.map(c => String(c.contract_id)));
    for (const t of trades.filter(t => !t.result && t.contractId)) {
      if (!liveIdSet.has(String(t.contractId)) && !closingContracts.has(t.contractId)) {
        const rec = await getContractProfitFromHistory(t.contractId, t.entryEpoch);
        if (rec && typeof rec.profit === "number") {
          t.result = rec.profit >= 0 ? "WIN" : "LOSS"; t.serverPnl = rec.profit; t.resultSource = "server_history_verified";
          t.closeTime = new Date(rec.sellTime * 1000).toISOString().replace("T", " ").substring(0, 19);
          state.dailyNetPnl = (state.dailyNetPnl || 0) + rec.profit;
          if (state.dailyNetPnl >= DAILY_PROFIT_TARGET_USD) {
            state.dailyTargetReached = true;
            state.dailyTargetDate = todayStr;
          }
          await sendTelegram(`${t.result === "WIN" ? "✅" : "❌"} *${REPO_LABEL} — Trade ${t.result} (Broker Native Exit)*\n\n💵 P&L: *${rec.profit >= 0 ? `+$${rec.profit.toFixed(2)}` : `-$${Math.abs(rec.profit).toFixed(2)}`}*`);
        } else {
          // Fallback: Contract is confirmed closed on Deriv (absent from live portfolio). Reconcile to unblock execution gate.
          t.result = "CLOSED_EXTERNAL";
          t.serverPnl = 0;
          t.resultSource = "server_portfolio_reconciled";
          t.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
          console.log(`[PORTFOLIO SYNC] Contract ${t.contractId} no longer in portfolio. Reconciled as CLOSED_EXTERNAL to unblock bot.`);
        }
      }
    }
    saveTrades(trades);
    saveState();
  } catch (e) { dbg("Portfolio sync skipped:", e.message); }

  // 2. Fetch Market Candles
  let scanData;
  try {
    scanData = await fetchAllData();
  } catch (e) {
    console.error(`[${REPO_LABEL}] fetchAllData error: ${e.message}`);
    return;
  }
  const { m5: candles, m15: m15Candles, m30: m30Candles, d1: d1Candles } = scanData;

  if (!candles || candles.length < 120 || !m15Candles || !m30Candles || !d1Candles) {
    console.warn(`[${REPO_LABEL}] Incomplete candle set: m5=${candles?.length || 0}, m15=${m15Candles?.length || 0}, m30=${m30Candles?.length || 0}, d1=${d1Candles?.length || 0}`);
    return;
  }
  const si = candles.length - 2; 
  const currentPrice = parseFloat(candles[si].close);
  state.symbol = SYMBOL;
  state.currentPrice = currentPrice;
  state.lastPriceUpdate = new Date().toISOString();

  // 3. Calculate Fibonacci Levels & Key M15 Candle Close
  const fib = computeDailyFibLevels(d1Candles);
  if (!fib) return;

  const newBiasPrice = parseFloat(fib.dailyBiasPrice.toFixed(4));
  if (state.dailyBiasPrice !== null && state.dailyBiasPrice !== newBiasPrice) {
    dbg(`[ROLLOVER] Updating daily bias to ${newBiasPrice}. Keeping active setups intact.`);
    state.dailyBiasPrice = newBiasPrice;
  } else if (state.dailyBiasPrice === null) {
    state.dailyBiasPrice = newBiasPrice;
  }

  state.fibBullish = fib.bullish; state.fib0 = parseFloat(fib.fib0.toFixed(4)); state.fib50 = parseFloat(fib.fib50.toFixed(4));
  state.fib618 = parseFloat(fib.fib1618?.toFixed(4) || 0); state.fib79 = parseFloat(fib.fib79.toFixed(4)); state.fib100 = parseFloat(fib.fib100.toFixed(4));
  state.h1TdiDir = fib.bullish ? "BULL" : "BEAR";

  const prevM15 = m15Candles[m15Candles.length - 3];
  const currM15 = m15Candles[m15Candles.length - 2];
  const prevM15Close = parseFloat(prevM15.close);
  const m15Close     = parseFloat(currM15.close);
  const m15Open      = parseFloat(currM15.open);

  // 4. Calculate Technical Indicators Based on Active Instrument Architecture
  const cci = calculateCCI(candles, 100);
  const stochParams = PROFILE.stochParams || { k: 18, d: 12, slowing: 25 };
  const stoch = calculateStoch(candles, stochParams.k, stochParams.d, stochParams.slowing, stochParams.method || "Simple");
  const envParams = PROFILE.envParams || { period: 50, devPct: 0.05 };
  const env = calculateEnvelopes(candles, envParams.period, envParams.devPct);

  // EMA 100 & EMA 200 for Trend Filters & Active Exits
  const ema100 = calculateEMA(candles, 100);
  const ema200 = calculateEMA(candles, 200);
  const currentEma100 = ema100[si];
  const currentEma200 = ema200[si];

  // Secondary Fast Stoch (5,3,3) for V100 (1s)
  const stoch533 = calculateStoch(candles, 5, 3, 3);

  const cVal = cci[si], prevCci = cci[si - 1];
  const eUp = env.upper[si], eLo = env.lower[si];
  const sK = stoch.k[si], sD = stoch.d[si], prevK = stoch.k[si - 1], prevD = stoch.d[si - 1];
  const sK533 = stoch533.k[si], sD533 = stoch533.d[si], prevK533 = stoch533.k[si - 1], prevD533 = stoch533.d[si - 1];

  if (STRATEGY_PROFILE === "PROFILE_V100_1S_EMA_STOCH533") {
    if (sK533 === null || prevK533 === null) {
      state.lastProcessedEpoch = m5BoundaryEpoch;
      saveState();
      return;
    }
  } else if (STRATEGY_PROFILE === "PROFILE_V25_STOCH200_CCI100" || STRATEGY_PROFILE === "PROFILE_V25_STOCH45_VALIDATOR") {
    if (sK === null || prevK === null || cVal === null || prevCci === null) {
      state.lastProcessedEpoch = m5BoundaryEpoch;
      saveState();
      return;
    }
  } else {
    if (sK === null || sD === null || prevK === null || prevD === null) {
      state.lastProcessedEpoch = m5BoundaryEpoch;
      saveState();
      return;
    }
  }

  // 5. Manage Structure & Early Exits on Active Trades
  const openTrades = trades.filter(t => !t.result && !t.pending);
  for (const t of openTrades) {
    if (closingContracts.has(t.contractId)) continue;

    // Fractal SL Market Structure Break (Evaluated strictly on M15 Candle Close)
    const isM15CloseBoundary = m5BoundaryEpoch % 900 === 0;
    if (t.sl && isM15CloseBoundary) {
      const isBuy = t.direction === "BUY";
      const structureBroken = isBuy ? m15Close < t.sl : m15Close > t.sl;
      if (structureBroken) {
        closingContracts.add(t.contractId);
        console.log(`[STRUCTURE] M15 candle closed at ${m15Close.toFixed(4)} breaking ${t.fractalTimeframe || "M15"} fractal SL ${t.sl.toFixed(4)}. Exiting.`);
        try {
          await closeContract(t.contractId);
          const settled = await getContractProfitFromHistory(t.contractId, t.entryEpoch);
          const pnl = calcUnrealizedPnL(t, m15Close);
          t.serverPnl = settled !== null ? settled.profit : parseFloat(pnl.toFixed(2));
          t.resultSource = settled !== null ? "deriv_settled_official" : "estimated_fallback";
          t.result = t.serverPnl >= 0 ? "WIN" : "LOSS";
          t.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
          state.dailyNetPnl = (state.dailyNetPnl || 0) + t.serverPnl;
          saveTrades(trades);
          saveState();
          const icon = t.result === "WIN" ? "✅" : "❌";
          const pnlStr = t.serverPnl >= 0 ? `+${t.serverPnl.toFixed(2)}` : `-${Math.abs(t.serverPnl).toFixed(2)}`;
          await sendTelegram(`${icon} *${REPO_LABEL} — ${t.fractalTimeframe || "M15"} Structure Break*\n\nM15 Candle closed at *${m15Close.toFixed(4)}* breaking fractal SL *${t.sl.toFixed(4)}*.\n💵 P&L: *${pnlStr}*\nContract: \`${t.contractId}\``);
        } catch (e) {
          console.error(`[STRUCTURE] Failed to close contract ${t.contractId}:`, e.message);
        }
        closingContracts.delete(t.contractId);
        continue;
      }
    }

    // Active Trade Exits for PROFILE_V100_1S_EMA_STOCH533
    if (STRATEGY_PROFILE === "PROFILE_V100_1S_EMA_STOCH533") {
      // Early Exit #1: Fast M5 Stoch (5,3,3) Adverse Cross back over Level 50
      if (sK533 !== null && prevK533 !== null) {
        const isBuy = t.direction === "BUY";
        const stochAdverseCross = isBuy ? (prevK533 >= 50.0 && sK533 < 50.0) : (prevK533 <= 50.0 && sK533 > 50.0);
        if (stochAdverseCross) {
          closingContracts.add(t.contractId);
          console.log(`[STOCH 50 EXIT] Fast M5 Stoch (5,3,3) %K crossed back ${isBuy ? "below" : "above"} 50.0 (${sK533.toFixed(1)}). Exiting early.`);
          try {
            await closeContract(t.contractId);
            const settled = await getContractProfitFromHistory(t.contractId, t.entryEpoch);
            const pnl = calcUnrealizedPnL(t, currentPrice);
            t.serverPnl = settled !== null ? settled.profit : parseFloat(pnl.toFixed(2));
            t.resultSource = settled !== null ? "deriv_settled_official" : "estimated_fallback";
            t.result = t.serverPnl >= 0 ? "WIN" : "LOSS";
            t.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
            state.dailyNetPnl = (state.dailyNetPnl || 0) + t.serverPnl;
            saveTrades(trades);
            saveState();
            const icon = t.result === "WIN" ? "✅" : "❌";
            const pnlStr = t.serverPnl >= 0 ? `+${t.serverPnl.toFixed(2)}` : `-${Math.abs(t.serverPnl).toFixed(2)}`;
            await sendTelegram(`${icon} *${REPO_LABEL} — Fast Stoch 50 Adverse Cross Early Exit*\n\nFast M5 Stoch (5,3,3) %K crossed back *${isBuy ? "below" : "above"} 50.0* (${sK533.toFixed(1)}).\n💵 P&L: *${pnlStr}*\nContract: \`${t.contractId}\``);
          } catch (e) {
            console.error(`[STOCH 50 EXIT] Failed to close contract ${t.contractId}:`, e.message);
          }
          closingContracts.delete(t.contractId);
          continue;
        }
      }

      // Early Exit #2: Price Closed Opposite M5 EMA 100
      if (currentEma100 !== null) {
        const isBuy = t.direction === "BUY";
        const emaExit = isBuy ? (currentPrice < currentEma100) : (currentPrice > currentEma100);
        if (emaExit) {
          closingContracts.add(t.contractId);
          console.log(`[EMA EXIT] M5 candle closed at ${currentPrice.toFixed(4)} opposite M5 EMA 100 (${currentEma100.toFixed(4)}). Exiting.`);
          try {
            await closeContract(t.contractId);
            const settled = await getContractProfitFromHistory(t.contractId, t.entryEpoch);
            const pnl = calcUnrealizedPnL(t, currentPrice);
            t.serverPnl = settled !== null ? settled.profit : parseFloat(pnl.toFixed(2));
            t.resultSource = settled !== null ? "deriv_settled_official" : "estimated_fallback";
            t.result = t.serverPnl >= 0 ? "WIN" : "LOSS";
            t.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
            state.dailyNetPnl = (state.dailyNetPnl || 0) + t.serverPnl;
            saveTrades(trades);
            saveState();
            const icon = t.result === "WIN" ? "✅" : "❌";
            const pnlStr = t.serverPnl >= 0 ? `+${t.serverPnl.toFixed(2)}` : `-${Math.abs(t.serverPnl).toFixed(2)}`;
            await sendTelegram(`${icon} *${REPO_LABEL} — M5 EMA 100 Early Exit*\n\nM5 Candle closed at *${currentPrice.toFixed(4)}* opposite M5 EMA 100 (${currentEma100.toFixed(4)}).\n💵 P&L: *${pnlStr}*\nContract: \`${t.contractId}\``);
          } catch (e) {
            console.error(`[EMA EXIT] Failed to close contract ${t.contractId}:`, e.message);
          }
          closingContracts.delete(t.contractId);
          continue;
        }
      }
    }

    // Active Trade Exits for PROFILE_V75_EMA_STOCH15 (V75 4-Condition Structural Retracement Model)
    if (STRATEGY_PROFILE === "PROFILE_V75_EMA_STOCH15") {
      // Early Exit: %K crossing %D in the opposite direction when the trade is in floating loss
      if (sK !== null && sD !== null && prevK !== null && prevD !== null) {
        const isBuy = t.direction === "BUY";
        const pnl = calcUnrealizedPnL(t, currentPrice);
        const inLoss = pnl < 0;

        // Opposite Crossover:
        // For BUY trade: %K crosses below %D (bearish crossover while underwater)
        // For SELL trade: %K crosses above %D (bullish crossover while underwater)
        const oppositeCross = isBuy
          ? (prevK >= prevD && sK < sD)
          : (prevK <= prevD && sK > sD);

        if (inLoss && oppositeCross) {
          closingContracts.add(t.contractId);
          console.log(`[STOCH OPPOSITE CROSS EXIT] Active ${t.direction} in loss ($${pnl.toFixed(2)}): M5 Stoch (15,18,8, Exp) %K crossed %D in opposite direction (%K: ${sK.toFixed(1)} vs %D: ${sD.toFixed(1)}). Liquidating immediately.`);
          try {
            await closeContract(t.contractId);
            const settled = await getContractProfitFromHistory(t.contractId, t.entryEpoch);
            t.serverPnl = settled !== null ? settled.profit : parseFloat(pnl.toFixed(2));
            t.resultSource = settled !== null ? "deriv_settled_official" : "estimated_fallback";
            t.result = t.serverPnl >= 0 ? "WIN" : "LOSS";
            t.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
            state.dailyNetPnl = (state.dailyNetPnl || 0) + t.serverPnl;
            saveTrades(trades);
            saveState();
            const icon = t.result === "WIN" ? "✅" : "❌";
            const pnlStr = t.serverPnl >= 0 ? `+${t.serverPnl.toFixed(2)}` : `-${Math.abs(t.serverPnl).toFixed(2)}`;
            await sendTelegram(
              `⚠️ *${REPO_LABEL} — Stoch %K/%D Opposite Cross Early Exit*\n\n` +
              `Active *${t.direction}* in floating loss: *${pnlStr}*.\n` +
              `M5 Stoch (15,18,8, Exp) %K crossed %D in opposite direction:\n` +
              `• %K: *${sK.toFixed(1)}* | %D: *${sD.toFixed(1)}* (${isBuy ? "Bearish %K < %D Cross" : "Bullish %K > %D Cross"})\n` +
              `Position liquidated immediately to protect capital.\n` +
              `Contract: \`${t.contractId}\``
            );
          } catch (e) {
            console.error(`[STOCH OPPOSITE CROSS EXIT] Failed to close contract ${t.contractId}:`, e.message);
          }
          closingContracts.delete(t.contractId);
          continue;
        }
      }
    }

    // Active Trade Exits for PROFILE_V75_1S_EMA_STOCH15
    if (STRATEGY_PROFILE === "PROFILE_V75_1S_EMA_STOCH15") {
      // Early Exit: M5 Candle Closed Opposite M5 EMA 200
      if (currentEma200 !== null) {
        const isBuy = t.direction === "BUY";
        const ema200Exit = isBuy ? (currentPrice < currentEma200) : (currentPrice > currentEma200);
        if (ema200Exit) {
          closingContracts.add(t.contractId);
          console.log(`[EMA 200 EXIT] M5 candle closed at ${currentPrice.toFixed(4)} opposite M5 EMA 200 (${currentEma200.toFixed(4)}). Exiting.`);
          try {
            await closeContract(t.contractId);
            const settled = await getContractProfitFromHistory(t.contractId, t.entryEpoch);
            const pnl = calcUnrealizedPnL(t, currentPrice);
            t.serverPnl = settled !== null ? settled.profit : parseFloat(pnl.toFixed(2));
            t.resultSource = settled !== null ? "deriv_settled_official" : "estimated_fallback";
            t.result = t.serverPnl >= 0 ? "WIN" : "LOSS";
            t.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
            state.dailyNetPnl = (state.dailyNetPnl || 0) + t.serverPnl;
            saveTrades(trades);
            saveState();
            const icon = t.result === "WIN" ? "✅" : "❌";
            const pnlStr = t.serverPnl >= 0 ? `+${t.serverPnl.toFixed(2)}` : `-${Math.abs(t.serverPnl).toFixed(2)}`;
            await sendTelegram(`${icon} *${REPO_LABEL} — M5 EMA 200 Early Exit*\n\nM5 Candle closed at *${currentPrice.toFixed(4)}* opposite M5 EMA 200 (${currentEma200.toFixed(4)}).\n💵 P&L: *${pnlStr}*\nContract: \`${t.contractId}\``);
          } catch (e) {
            console.error(`[EMA 200 EXIT] Failed to close contract ${t.contractId}:`, e.message);
          }
          closingContracts.delete(t.contractId);
          continue;
        }
      }
    }

    // Active Trade Early Exit for PROFILE_V25_STOCH200_CCI100 (Previous M5 Fractal Break)
    if (STRATEGY_PROFILE === "PROFILE_V25_STOCH200_CCI100" || STRATEGY_PROFILE === "PROFILE_V25_STOCH45_VALIDATOR") {
      const isBuy = t.direction === "BUY";
      const currentPnl = calcUnrealizedPnL(t, currentPrice);
      const inLoss = currentPnl < 0;
      const m5Close = parseFloat(candles[si].close);
      const m5FractalSl = t.m5Fractal || t.sl;

      const fractalBroken = isBuy
        ? (m5FractalSl && m5Close < m5FractalSl)
        : (m5FractalSl && m5Close > m5FractalSl);

      if (inLoss && fractalBroken) {
        closingContracts.add(t.contractId);
        console.log(`[EARLY EXIT] V25 Trade in loss ($${currentPnl.toFixed(2)}) and M5 Candle Close (${m5Close.toFixed(2)}) broke Previous M5 Fractal (${m5FractalSl.toFixed(2)}). Exiting early.`);
        try {
          await closeContract(t.contractId);
          const settled = await getContractProfitFromHistory(t.contractId, t.entryEpoch);
          const pnl = calcUnrealizedPnL(t, currentPrice);
          t.serverPnl = settled !== null ? settled.profit : parseFloat(pnl.toFixed(2));
          t.resultSource = settled !== null ? "deriv_settled_official" : "estimated_fallback";
          t.result = t.serverPnl >= 0 ? "WIN" : "LOSS";
          t.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
          state.dailyNetPnl = (state.dailyNetPnl || 0) + t.serverPnl;
          saveTrades(trades);
          saveState();
          const icon = t.result === "WIN" ? "✅" : "❌";
          const pnlStr = t.serverPnl >= 0 ? `+${t.serverPnl.toFixed(2)}` : `-${Math.abs(t.serverPnl).toFixed(2)}`;
          await sendTelegram(`${icon} *${REPO_LABEL} — Previous M5 Fractal Early Exit*\n\nTrade in loss (*${pnlStr}*) and M5 closed beyond Previous M5 Fractal (*${m5FractalSl.toFixed(2)}*).\n💵 Final P&L: *${pnlStr}*\nContract: \`${t.contractId}\``);
        } catch (e) {
          console.error(`[EARLY EXIT] Failed to close contract ${t.contractId}:`, e.message);
        }
        closingContracts.delete(t.contractId);
        continue;
      }
    }

    // =========================================================================
    // ADVERSE M15 FRACTAL EARLY EXIT (FAKEOUT MITIGATION FOR STOCH 18,12,25 BOTS)
    // =========================================================================
    const isStoch18Asset = 
      PROFILE.stochParams?.k === 18 && 
      PROFILE.stochParams?.d === 12 && 
      (STRATEGY_PROFILE === "PROFILE_V75_MIDLINE_FRACTAL" || 
       STRATEGY_PROFILE === "PROFILE_V10_MIDLINE_FRACTAL" || 
       STRATEGY_PROFILE === "PROFILE_V100_MIDLINE_ENV");

    if (isStoch18Asset && m15Candles && m15Candles.length >= 5) {
      const currentPnl = calcUnrealizedPnL(t, currentPrice);
      
      // Only evaluate if the trade is in floating loss (underwater)
      if (currentPnl < 0) {
        const c = m15Candles;
        let adverseFractalDetected = false;
        let adverseFractalPrice = 0;

        for (let k = 2; k <= c.length - 3; k++) {
          const confirmationBarEpoch = c[k + 2].epoch;

          // The fractal must have completed after our entry was executed
          if (confirmationBarEpoch > t.entryEpoch) {
            if (t.direction === "BUY") {
              // For BUY: An opposing TOP fractal (swing high) formed at or below entry price
              const isTop = parseFloat(c[k].high) === Math.max(
                parseFloat(c[k-2].high), parseFloat(c[k-1].high), 
                parseFloat(c[k].high), parseFloat(c[k+1].high), parseFloat(c[k+2].high)
              );
              const fracHigh = parseFloat(c[k].high);
              if (isTop && fracHigh <= t.entry && currentPrice < t.entry) {
                adverseFractalDetected = true;
                adverseFractalPrice = fracHigh;
                break;
              }
            } else if (t.direction === "SELL") {
              // For SELL: An opposing BOTTOM fractal (swing low) formed at or above entry price
              const isBottom = parseFloat(c[k].low) === Math.min(
                parseFloat(c[k-2].low), parseFloat(c[k-1].low), 
                parseFloat(c[k].low), parseFloat(c[k+1].low), parseFloat(c[k+2].low)
              );
              const fracLow = parseFloat(c[k].low);
              if (isBottom && fracLow >= t.entry && currentPrice > t.entry) {
                adverseFractalDetected = true;
                adverseFractalPrice = fracLow;
                break;
              }
            }
          }
        }

        if (adverseFractalDetected) {
          closingContracts.add(t.contractId);
          console.log(`[FAKEOUT MITIGATION] Adverse M15 ${t.direction === "BUY" ? "Top" : "Bottom"} Fractal formed at ${adverseFractalPrice.toFixed(4)} opposite ${t.direction} trade while underwater (Entry: ${t.entry.toFixed(4)}, Spot: ${currentPrice.toFixed(4)}). Closing early.`);
          try {
            await closeContract(t.contractId);
            const settled = await getContractProfitFromHistory(t.contractId, t.entryEpoch);
            const pnl = calcUnrealizedPnL(t, currentPrice);
            t.serverPnl = settled !== null ? settled.profit : parseFloat(pnl.toFixed(2));
            t.resultSource = settled !== null ? "deriv_settled_official" : "estimated_fallback";
            t.result = t.serverPnl >= 0 ? "WIN" : "LOSS";
            t.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
            state.dailyNetPnl = (state.dailyNetPnl || 0) + t.serverPnl;
            saveTrades(trades);
            saveState();
            const pnlStr = t.serverPnl >= 0 ? `+${t.serverPnl.toFixed(2)}` : `-${Math.abs(t.serverPnl).toFixed(2)}`;
            await sendTelegram(
              `⚠️ *${REPO_LABEL} — Adverse M15 Fractal Early Exit (Fakeout Mitigated)*\n\n` +
              `Opposing M15 ${t.direction === "BUY" ? "Top" : "Bottom"} Fractal formed at *${adverseFractalPrice.toFixed(4)}* opposite entry *${t.entry.toFixed(4)}* while in loss.\n` +
              `Trade liquidated early to prevent -$2.50 full SL.\n` +
              `💵 P&L: *${pnlStr}*\n` +
              `Contract: \`${t.contractId}\``
            );
          } catch (e) {
            console.error(`[FAKEOUT MITIGATION] Failed to close contract ${t.contractId}:`, e.message);
          }
          closingContracts.delete(t.contractId);
          continue;
        }
      }
    }

    // Upgrade M15 Fractal SL if new favorable M15 structure forms
    if (m15Candles.length >= 5) {
      for (let k = 2; k <= m15Candles.length - 4; k++) {
        if (m15Candles[k + 2].epoch + M15 > t.entryEpoch) {
          const c = m15Candles;
          if (t.direction === "BUY") {
            const isBottom = parseFloat(c[k].low) === Math.min(parseFloat(c[k-2].low), parseFloat(c[k-1].low), parseFloat(c[k].low), parseFloat(c[k+1].low), parseFloat(c[k+2].low));
            const frac = parseFloat(c[k].low);
            if (isBottom && frac > t.sl) { 
              t.sl = frac; t.fractalTimeframe = "M15"; saveTrades(trades); 
              console.log(`[TRAIL SL] Upgraded BUY SL to M15 Bottom Fractal: ${frac.toFixed(4)}`); 
              break; 
            }
          } else if (t.direction === "SELL") {
            const isTop = parseFloat(c[k].high) === Math.max(parseFloat(c[k-2].high), parseFloat(c[k-1].high), parseFloat(c[k].high), parseFloat(c[k+1].high), parseFloat(c[k+2].high));
            const frac = parseFloat(c[k].high);
            if (isTop && frac < t.sl) { 
              t.sl = frac; t.fractalTimeframe = "M15"; saveTrades(trades); 
              console.log(`[TRAIL SL] Upgraded SELL SL to M15 Top Fractal: ${frac.toFixed(4)}`); 
              break; 
            }
          }
        }
      }
    }
  }

  // ── LIVE INDICATOR TELEMETRY UPDATES FOR DASHBOARD SYNCHRONIZATION ──
  state.strategyProfile = STRATEGY_PROFILE;
  state.stochVal = sK;
  state.stochSignal = sD;
  state.cciVal = cVal;
  state.envUpper = eUp;
  state.envLower = eLo;
  state.ema100Val = currentEma100;
  state.ema200Val = currentEma200;
  state.stoch533Val = sK533;

  // Stoch 50 cross & status (Current cross OR 8-Hour Rolling Lookback OR Position Relative to 50)
  const stoch50CrossUpLookback = (prevK <= 50.0 && sK > 50.0) || checkStochastic8HrLookback(candles, stoch, "BUY", "MIDLINE");
  const stoch50CrossDownLookback = (prevK >= 50.0 && sK < 50.0) || checkStochastic8HrLookback(candles, stoch, "SELL", "MIDLINE");

  state.stoch50CrossUp = stoch50CrossUpLookback;
  state.stoch50CrossDown = stoch50CrossDownLookback;
  state.stoch50Above = sK > 50.0;
  state.stoch50Below = sK < 50.0;
  state.stoch50Cross = stoch50CrossUpLookback || stoch50CrossDownLookback || sK > 50.0 || sK < 50.0;

  // Track persistent cross epoch for Stoch 50
  if (stoch50CrossUpLookback || sK > 50.0) {
    if (!state.stoch50CrossEpoch || !state.stoch50CrossDir || state.stoch50CrossDir !== "BUY") {
      state.stoch50CrossEpoch = findStochasticCrossCandleEpoch(candles, stoch, "BUY", "MIDLINE") || m5BoundaryEpoch;
      state.stoch50CrossDir = "BUY";
    }
  } else if (stoch50CrossDownLookback || sK < 50.0) {
    if (!state.stoch50CrossEpoch || !state.stoch50CrossDir || state.stoch50CrossDir !== "SELL") {
      state.stoch50CrossEpoch = findStochasticCrossCandleEpoch(candles, stoch, "SELL", "MIDLINE") || m5BoundaryEpoch;
      state.stoch50CrossDir = "SELL";
    }
  } else {
    state.stoch50CrossEpoch = null;
    state.stoch50CrossDir = null;
  }

  // EMA 100 alignment status & persistent alignment epoch
  const emaBuyArmed = currentPrice > currentEma100;
  const emaSellArmed = currentPrice < currentEma100;
  state.ema100BuyArmed = emaBuyArmed;
  state.ema100SellArmed = emaSellArmed;
  state.emaAligned = emaBuyArmed ? "BUY" : (emaSellArmed ? "SELL" : null);

  if (emaBuyArmed) {
    if (!state.ema100AlignEpoch || state.emaAlignedDir !== "BUY") {
      state.ema100AlignEpoch = m5BoundaryEpoch;
      state.emaAlignedDir = "BUY";
    }
  } else if (emaSellArmed) {
    if (!state.ema100AlignEpoch || state.emaAlignedDir !== "SELL") {
      state.ema100AlignEpoch = m5BoundaryEpoch;
      state.emaAlignedDir = "SELL";
    }
  } else {
    state.ema100AlignEpoch = null;
    state.emaAlignedDir = null;
  }

  // Fast Stoch (5,3,3) status, directional latching & persistent cross epoch
  const stoch533BuyCross = (prevK533 <= 20.0 && sK533 > 20.0) || (prevD533 !== null && sD533 !== null && prevK533 <= prevD533 && sK533 > sD533 && (prevK533 <= 25.0 || sK533 <= 25.0));
  const stoch533SellCross = (prevK533 >= 80.0 && sK533 < 80.0) || (prevD533 !== null && sD533 !== null && prevK533 >= prevD533 && sK533 < sD533 && (prevK533 >= 75.0 || sK533 >= 75.0));

  if (stoch533BuyCross) {
    state.latchStoch533_BUY = true;
    state.latchStoch533_SELL = false;
  }
  if (stoch533SellCross) {
    state.latchStoch533_SELL = true;
    state.latchStoch533_BUY = false;
  }

  // De-alignment Protocol: If BUY-latched and candle subsequently closes back below 50, disarm
  if (state.latchStoch533_BUY && prevK533 >= 50.0 && sK533 < 50.0) {
    state.latchStoch533_BUY = false;
    dbg(`[STOCH 5,3,3 DISARM] Fast Stoch %K (${sK533.toFixed(2)}) closed back below 50. BUY trigger disarmed; awaiting fresh cross > 20.`);
  }
  // De-alignment Protocol: If SELL-latched and candle subsequently closes back above 50, disarm
  if (state.latchStoch533_SELL && prevK533 <= 50.0 && sK533 > 50.0) {
    state.latchStoch533_SELL = false;
    dbg(`[STOCH 5,3,3 DISARM] Fast Stoch %K (${sK533.toFixed(2)}) closed back above 50. SELL trigger disarmed; awaiting fresh cross < 80.`);
  }

  state.stoch533BuyCross = Boolean(stoch533BuyCross || state.latchStoch533_BUY);
  state.stoch533SellCross = Boolean(stoch533SellCross || state.latchStoch533_SELL);

  if (stoch533BuyCross || state.latchStoch533_BUY) {
    if (!state.stoch533CrossEpoch || state.stoch533CrossDir !== "BUY") {
      state.stoch533CrossEpoch = m5BoundaryEpoch;
      state.stoch533CrossDir = "BUY";
    }
  } else if (stoch533SellCross || state.latchStoch533_SELL) {
    if (!state.stoch533CrossEpoch || state.stoch533CrossDir !== "SELL") {
      state.stoch533CrossEpoch = m5BoundaryEpoch;
      state.stoch533CrossDir = "SELL";
    }
  } else {
    state.stoch533CrossEpoch = null;
    state.stoch533CrossDir = null;
  }

  // Envelope status (50 or 200 depending on profile)
  const envBuyActive = currentPrice > eUp;
  const envSellActive = currentPrice < eLo;
  state.envBuyActive = envBuyActive;
  state.envSellActive = envSellActive;
  state.envAligned = envBuyActive ? "BUY" : (envSellActive ? "SELL" : null);

  if (envBuyActive) {
    if (!state.envBreakoutEpoch || state.envBreakoutDir !== "BUY") {
      state.envBreakoutEpoch = m5BoundaryEpoch;
      state.envBreakoutDir = "BUY";
    }
  } else if (envSellActive) {
    if (!state.envBreakoutEpoch || state.envBreakoutDir !== "SELL") {
      state.envBreakoutEpoch = m5BoundaryEpoch;
      state.envBreakoutDir = "SELL";
    }
  } else {
    state.envBreakoutEpoch = null;
    state.envBreakoutDir = null;
  }

  // CCI status
  const cciCrossBuy = (prevCci !== null && cVal !== null) ? (prevCci <= -100.0 && cVal > -100.0) : false;
  const cciCrossSell = (prevCci !== null && cVal !== null) ? (prevCci >= 100.0 && cVal < 100.0) : false;
  state.cciCrossBuy = cciCrossBuy;
  state.cciCrossSell = cciCrossSell;
  state.cciAligned = (cVal !== null && cVal > 0) ? "BUY" : (cVal !== null && cVal < 0 ? "SELL" : null);

  if (cciCrossBuy) {
    state.cciCrossEpoch = m5BoundaryEpoch;
    state.cciCrossDir = "BUY";
  } else if (cciCrossSell) {
    state.cciCrossEpoch = m5BoundaryEpoch;
    state.cciCrossDir = "SELL";
  } else if (!state.cciCrossEpoch && cVal !== null) {
    if (cVal > -100 && cVal < 100) {
      state.cciCrossEpoch = m5BoundaryEpoch;
      state.cciCrossDir = cVal >= 0 ? "BUY" : "SELL";
    }
  }

  // Stoch Boundary status (20/80)
  const stoch20Cross8Hr = checkStochastic8HrLookback(candles, stoch, "BUY", "BOUNDARIES_20_80");
  const stoch80Cross8Hr = checkStochastic8HrLookback(candles, stoch, "SELL", "BOUNDARIES_20_80");
  state.stoch20CrossUp = (prevK <= 20.0 && sK > 20.0) || stoch20Cross8Hr;
  state.stoch80CrossDown = (prevK >= 80.0 && sK < 80.0) || stoch80Cross8Hr;
  state.stoch20Above = sK > 20.0;
  state.stoch80Below = sK < 80.0;
  state.stochAligned = (sK > sD) ? "BUY" : "SELL";

  if (state.stoch20CrossUp || sK > 20.0) {
    if (!state.stochBoundaryEpoch || state.stochBoundaryDir !== "BUY") {
      state.stochBoundaryEpoch = findStochasticCrossCandleEpoch(candles, stoch, "BUY", "BOUNDARIES_20_80") || m5BoundaryEpoch;
      state.stochBoundaryDir = "BUY";
    }
  } else if (state.stoch80CrossDown || sK < 80.0) {
    if (!state.stochBoundaryEpoch || state.stochBoundaryDir !== "SELL") {
      state.stochBoundaryEpoch = findStochasticCrossCandleEpoch(candles, stoch, "SELL", "BOUNDARIES_20_80") || m5BoundaryEpoch;
      state.stochBoundaryDir = "SELL";
    }
  } else {
    state.stochBoundaryEpoch = null;
    state.stochBoundaryDir = null;
  }
  saveState();

  writeToLedger(m5BoundaryEpoch, currentPrice, cVal, sK, sD, eUp, eLo, (state.armed && state.armed.lbl) ? state.armed.lbl : "IDLE", `EMA100:${currentEma100 ? currentEma100.toFixed(2) : "0"}`);

  // Evaluate Opposite M15 Fractal Fakeout Early Exit for open trades on Stoch 18,12,25 instruments
  await checkOppositeFractalFakeoutExit(m15Candles, currentPrice);

  // Evaluate Loss Recovery / Rescue Entry if parent trade is active and floating in loss
  await checkAndExecuteRescueEntry(candles, currentPrice, m5BoundaryEpoch);

  // ── A. RULE 1: UNIVERSAL KEY LEVEL TOUCH & CLOSE-SIDE ARMING ──
  function isLevelTouched(level, candle) {
    if (!level) return false;
    const h = parseFloat(candle.high);
    const l = parseFloat(candle.low);
    const buf = (h - l) * 0.05;
    return (l <= level + buf && h >= level - buf);
  }

  function checkCrossover(level, prevC, currC, currO) {
    if (!level) return false;
    const crossedUp = (prevC <= level || currO <= level) && currC > level;
    const crossedDn = (prevC >= level || currO >= level) && currC < level;
    return crossedUp || crossedDn;
  }

  let newArm = null;

  // Universal Key Levels Array (0%, 50%, 79%, 100%, -50%, 161.8% — 50% explicitly excluded if profile flags excludeFib50)
  const keyLevels = [
    { lvl: fib.fib0,    name: "0%" },
    ...(PROFILE.excludeFib50 ? [] : [{ lvl: fib.fib50, name: "50%" }]),
    { lvl: fib.fib79,   name: "79%" },
    { lvl: fib.fib100,  name: "100%" },
    { lvl: fib.fibM50,  name: "-50%" },
    { lvl: fib.fib1618, name: "161.8%" }
  ];

  function resolveFibSetup(level, price) {
    if (typeof level !== "number" || isNaN(level)) return null;
    const closedAbove = price >= level;
    const dir = closedAbove ? "BUY" : "SELL";

    // Sort distinct valid price levels in ascending order to find natural adjacent target
    const sortedLevels = Array.from(new Set(keyLevels.map(k => k.lvl).filter(v => typeof v === "number" && !isNaN(v)))).sort((a, b) => a - b);
    const currIdx = sortedLevels.findIndex(l => Math.abs(l - level) < 1e-6);

    let tp = null;
    if (currIdx !== -1) {
      if (dir === "BUY") {
        tp = currIdx < sortedLevels.length - 1 ? sortedLevels[currIdx + 1] : null;
      } else {
        tp = currIdx > 0 ? sortedLevels[currIdx - 1] : null;
      }
    }

    const matchedKey = keyLevels.find(k => Math.abs(k.lvl - level) < 1e-6);
    const lvlName = matchedKey ? matchedKey.name : level.toFixed(2);
    const targetKey = tp !== null ? keyLevels.find(k => Math.abs(k.lvl - tp) < 1e-6) : null;
    const tpName = targetKey ? targetKey.name : (tp !== null ? tp.toFixed(2) : "OPEN");

    const s = {
      dir,
      tp,
      lvl: level,
      lbl: `${dir} (${lvlName} to ${tpName})`
    };

    return s;
  }

  for (const item of keyLevels) {
    if (typeof item.lvl !== "number" || isNaN(item.lvl)) continue;
    const crossed = checkCrossover(item.lvl, prevM15Close, m15Close, m15Open);
    const touched = isLevelTouched(item.lvl, currM15);

    if (crossed || touched) {
      state.dailyKeyLevelTouchedToday = true;
      newArm = resolveFibSetup(item.lvl, m15Close);
      if (newArm) break;
    }
  }

  // ── DAILY STARTUP RECOVERY SCANNER (ACTIVE ONLY UNTIL FIRST KEY FIB TOUCH OF THE DAY) ──
  // Activates if no key Fib level has been touched since the new day candle opened (00:00 UTC).
  // Once the first key Fib level of the current day is touched, this mechanism permanently pauses until the next daily open.
  if (!newArm && !state.armed && !state.dailyKeyLevelTouchedToday && m15Candles && m15Candles.length >= 3) {
    const todayOpenEpoch = Math.floor(new Date(todayStr + "T00:00:00Z").getTime() / 1000);
    const todaysCandles = m15Candles.filter(c => c.epoch >= todayOpenEpoch);
    const maxLookback = Math.min(todaysCandles.length, m15Candles.length - 2);

    for (let i = m15Candles.length - 2; i >= m15Candles.length - 2 - maxLookback; i--) {
      if (i < 1) break;
      const histPrev = m15Candles[i - 1];
      const histCurr = m15Candles[i];
      if (histCurr.epoch < todayOpenEpoch) break; // Lookback strictly within current day's trading
      const hPrevClose = parseFloat(histPrev.close);
      const hCurrClose = parseFloat(histCurr.close);
      const hCurrOpen = parseFloat(histCurr.open);

      for (const item of keyLevels) {
        if (typeof item.lvl !== "number" || isNaN(item.lvl)) continue;
        const histCrossed = checkCrossover(item.lvl, hPrevClose, hCurrClose, hCurrOpen);
        const histTouched = isLevelTouched(item.lvl, histCurr);

        if (histCrossed || histTouched) {
          // Resolve direction using the historical bar close that generated the cross/touch
          const candidateArm = resolveFibSetup(item.lvl, hCurrClose);
          if (candidateArm) {
            // Check if setup is currently active without having breached the anchor level or reached TP
            const isBuyActive = candidateArm.dir === "BUY" && m15Close >= candidateArm.lvl && (candidateArm.tp === null || m15Close < candidateArm.tp);
            const isSellActive = candidateArm.dir === "SELL" && m15Close <= candidateArm.lvl && (candidateArm.tp === null || m15Close > candidateArm.tp);

            if (isBuyActive || isSellActive) {
              dbg(`[DAILY RECOVERY] Restored active structural Fib state from today's M15 candle at epoch ${histCurr.epoch}: ${candidateArm.lbl}`);
              newArm = candidateArm;
              state.dailyKeyLevelTouchedToday = true;
              break;
            } else if (candidateArm.tp !== null) {
              // If target was reached during the move, transition the reached target level to the new anchor
              const reachedTarget = (candidateArm.dir === "BUY" && m15Close >= candidateArm.tp) || (candidateArm.dir === "SELL" && m15Close <= candidateArm.tp);
              if (reachedTarget) {
                const transitionedArm = resolveFibSetup(candidateArm.tp, m15Close);
                if (transitionedArm) {
                  dbg(`[DAILY RECOVERY] Target ${candidateArm.tp} reached from today's epoch ${histCurr.epoch}. Transitioning to: ${transitionedArm.lbl}`);
                  newArm = transitionedArm;
                  state.dailyKeyLevelTouchedToday = true;
                  break;
                }
              }
            }
          }
        }
      }
      if (newArm) break;
    }
  }

  // Active M15 Dynamic Invalidation & Direction Transition
  if (state.armed) {
    const isBuyFlipped = state.armed.dir === "BUY" && m15Close < state.armed.lvl;
    const isSellFlipped = state.armed.dir === "SELL" && m15Close > state.armed.lvl;

    if (isBuyFlipped || isSellFlipped) {
      const flippedSetup = resolveFibSetup(state.armed.lvl, m15Close);
      if (flippedSetup) {
        dbg(`[DIRECTION FLIP] Price crossed level ${state.armed.lvl}. Arming opposite direction: ${flippedSetup.lbl}`);
        state.armed = flippedSetup;
        state.armedEpoch = m5BoundaryEpoch;
        state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC";
        state.confirm = { label: flippedSetup.lbl, dir: flippedSetup.dir, gate: GATE_TYPE };
      } else {
        dbg(`[INVALIDATION] Price crossed level ${state.armed.lvl}. Disarming.`);
        state.armed = null;
        state.armedEpoch = null;
        state.armedTime = null;
      }
    } else if (state.armed.dir === "BUY" && state.armed.tp && m15Close >= state.armed.tp) {
      dbg(`[TARGET REACHED] M15 reached armed BUY target ${state.armed.tp}. Transitioning to ${state.armed.tp}.`);
      const nextSetup = resolveFibSetup(state.armed.tp, m15Close);
      if (nextSetup) {
        state.armed = nextSetup;
        state.armedEpoch = m5BoundaryEpoch;
        state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC";
        state.confirm = { label: nextSetup.lbl, dir: nextSetup.dir, gate: GATE_TYPE };
      } else {
        state.armed = null;
        state.armedEpoch = null;
        state.armedTime = null;
      }
    } else if (state.armed.dir === "SELL" && state.armed.tp && m15Close <= state.armed.tp) {
      dbg(`[TARGET REACHED] M15 reached armed SELL target ${state.armed.tp}. Transitioning to ${state.armed.tp}.`);
      const nextSetup = resolveFibSetup(state.armed.tp, m15Close);
      if (nextSetup) {
        state.armed = nextSetup;
        state.armedEpoch = m5BoundaryEpoch;
        state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC";
        state.confirm = { label: nextSetup.lbl, dir: nextSetup.dir, gate: GATE_TYPE };
      } else {
        state.armed = null;
        state.armedEpoch = null;
        state.armedTime = null;
      }
    }
  }

  if (newArm && (!state.armed || state.armed.lbl !== newArm.lbl)) {
    dbg(`[STATE] New Arm: ${newArm.lbl} (Level: ${newArm.lvl}, TP: ${newArm.tp})`);
    state.armed = newArm;
    state.armedEpoch = m5BoundaryEpoch;
    state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC";
    state.confirm = { label: newArm.lbl, dir: newArm.dir, gate: GATE_TYPE };
    state.keyLevelTouched = true;
    state.levelTouched = `Level: ${newArm.lvl}`;
  } else if (!state.armed) {
    state.armedEpoch = null;
    state.armedTime = null;
    state.keyLevelTouched = false;
    state.levelTouched = null;
  } else {
    state.keyLevelTouched = true;
    state.levelTouched = `Level: ${state.armed.lvl}`;
  }

  state.nextPhase = state.armed ? state.armed.lbl : null;

  // ── B. QUANTITATIVE STRATEGY DISPATCHER & CONFLUENCE ENGINE ──
  let indicatorsSatisfied = false;
  let signalDirection = "";
  let setupLabel = state.armed ? state.armed.lbl : "";
  let calculatedFibTp = null;

  // 1. UNIFIED V75 / V10 MIDLINE FRACTAL ENGINE
  if (STRATEGY_PROFILE === "PROFILE_V75_MIDLINE_FRACTAL" || 
      STRATEGY_PROFILE === "PROFILE_V10_MIDLINE_FRACTAL") {
    
    // Stoch (18,12,25) Level 50 Midline Crossover (Handbook Section 5 Core Mandate #4)
    const stoch50CrossUp = prevK <= 50.0 && sK > 50.0;
    const stoch50CrossDown = prevK >= 50.0 && sK < 50.0;

    if (state.armed) {
      if (state.armed.dir === "BUY" && stoch50CrossUp) {
        indicatorsSatisfied = true;
        signalDirection = "BUY";
      } else if (state.armed.dir === "SELL" && stoch50CrossDown) {
        indicatorsSatisfied = true;
        signalDirection = "SELL";
      }
    }
  }
  // 1.5 VOLATILITY 75 (R_75) 4-CONDITION STRUCTURAL RETRACEMENT MODEL
  else if (STRATEGY_PROFILE === "PROFILE_V75_EMA_STOCH15") {
    // Condition 1: M5 EMA 100 vs M5 EMA 200 Trend Filter
    const ema100Above200 = currentEma100 !== null && currentEma200 !== null && currentEma100 > currentEma200;
    const ema100Below200 = currentEma100 !== null && currentEma200 !== null && currentEma100 < currentEma200;

    // Condition 2: Pullback Retracement Touch
    // Candle low touches/dips to EMA 100 or EMA 200 (for BUY) or high reaches/exceeds EMA 100 or EMA 200 (for SELL)
    const currCandle = candles[si];
    const low = parseFloat(currCandle.low), high = parseFloat(currCandle.high);
    const touchedBuyEma = (currentEma100 !== null && low <= currentEma100) || (currentEma200 !== null && low <= currentEma200);
    const touchedSellEma = (currentEma100 !== null && high >= currentEma100) || (currentEma200 !== null && high >= currentEma200);

    if (ema100Above200 && touchedBuyEma) {
      state.v75_emaTouched_BUY = true;
    }
    if (ema100Below200 && touchedSellEma) {
      state.v75_emaTouched_SELL = true;
    }

    // Reset touch latch if trend filter breaks
    if (!ema100Above200) {
      state.v75_emaTouched_BUY = false;
    }
    if (!ema100Below200) {
      state.v75_emaTouched_SELL = false;
    }

    // Condition 3: Extreme Zone Stoch (15,5,8) Crossover Trigger
    // BUY: %K crosses above %D originating from oversold zone (<= 25.0 / <= 20.0)
    // SELL: %K crosses below %D originating from overbought zone (>= 75.0 / >= 80.0)
    const stochCrossBuy = (prevK <= prevD && sK > sD) && (prevK <= 25.0 || prevD <= 25.0 || sK <= 25.0);
    const stochCrossSell = (prevK >= prevD && sK < sD) && (prevK >= 75.0 || prevD >= 75.0 || sK >= 75.0);

    if (ema100Above200 && state.v75_emaTouched_BUY && stochCrossBuy) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = "V75_EMA_STOCH15 (BUY)";
    } else if (ema100Below200 && state.v75_emaTouched_SELL && stochCrossSell) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = "V75_EMA_STOCH15 (SELL)";
    }
  }
  // 2. VOLATILITY 100 (R_100) MIDLINE & ENVELOPE 200 ENGINE
  else if (STRATEGY_PROFILE === "PROFILE_V100_MIDLINE_ENV") {
    const isInitialArmBar = state.armedEpoch === m5BoundaryEpoch;
    const stoch50CrossUp = (prevK <= 50.0 && sK > 50.0) || (isInitialArmBar && sK !== null && sK >= 50.0);
    const stoch50CrossDown = (prevK >= 50.0 && sK < 50.0) || (isInitialArmBar && sK !== null && sK <= 50.0);
    const env200Upper = eUp; // Computed with period 200
    const env200Lower = eLo;

    const envBuyActive = currentPrice > env200Upper;
    const envSellActive = currentPrice < env200Lower;

    if (state.armed) {
      if (state.armed.dir === "BUY" && stoch50CrossUp && envBuyActive) {
        indicatorsSatisfied = true;
        signalDirection = "BUY";
      } else if (state.armed.dir === "SELL" && stoch50CrossDown && envSellActive) {
        indicatorsSatisfied = true;
        signalDirection = "SELL";
      }
    }
  }
  // 3. VOLATILITY 100 (1s) TWO-STAGE STATE ARMING & FAST STOCH (5,3,3) ENGINE
  else if (STRATEGY_PROFILE === "PROFILE_V100_1S_EMA_STOCH533") {
    // Stage 1: State Arming based on M5 EMA 100 Direction alone (Fib key level entry requirement bypassed)
    const emaBuyArmed = currentEma100 !== null && currentPrice > currentEma100;
    const emaSellArmed = currentEma100 !== null && currentPrice < currentEma100;

    const buyStateArmed = Boolean(emaBuyArmed);
    const sellStateArmed = Boolean(emaSellArmed);

    state.v100_1s_armed = buyStateArmed || sellStateArmed;
    state.v100_1s_armDir = buyStateArmed ? "BUY" : (sellStateArmed ? "SELL" : null);

    // Stage 2: Fast M5 Stoch (5,3,3) Execution Trigger & 50 Midline Latched State
    // BUY: Fast Stoch %K crosses strictly above 20 (%K <= 20 to > 20) or %K crosses %D in oversold zone (<=25)
    // SELL: Fast Stoch %K crosses strictly below 80 (%K >= 80 to < 80) or %K crosses %D in overbought zone (>=75)
    const stoch533BuyCross = (prevK533 !== null && sK533 !== null) && ((prevK533 <= 20.0 && sK533 > 20.0) || (prevD533 !== null && sD533 !== null && prevK533 <= prevD533 && sK533 > sD533 && (prevK533 <= 25.0 || sK533 <= 25.0)));
    const stoch533SellCross = (prevK533 !== null && sK533 !== null) && ((prevK533 >= 80.0 && sK533 < 80.0) || (prevD533 !== null && sD533 !== null && prevK533 >= prevD533 && sK533 < sD533 && (prevK533 >= 75.0 || sK533 >= 75.0)));

    const isStoch533BuyActive = Boolean(stoch533BuyCross || state.latchStoch533_BUY);
    const isStoch533SellActive = Boolean(stoch533SellCross || state.latchStoch533_SELL);

    if (buyStateArmed && isStoch533BuyActive) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = "V100_1S_EMA_STOCH533 (BUY)";
    } else if (sellStateArmed && isStoch533SellActive) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = "V100_1S_EMA_STOCH533 (SELL)";
    }

    // Determine Fib TP target from key levels grid
    if (indicatorsSatisfied) {
      const sortedLevels = Array.from(new Set(keyLevels.map(k => k.lvl).filter(v => typeof v === "number" && !isNaN(v)))).sort((a, b) => a - b);
      if (signalDirection === "BUY") {
        const higher = sortedLevels.filter(l => l > currentPrice);
        calculatedFibTp = higher.length > 0 ? higher[0] : null;
      } else if (signalDirection === "SELL") {
        const lower = sortedLevels.filter(l => l < currentPrice);
        calculatedFibTp = lower.length > 0 ? lower[lower.length - 1] : null;
      }
    }
  }
  // 3.5 VOLATILITY 75 (1s) EMA 100/200 TREND, RETRACE TOUCH & STOCH (15,5,8) EXTREME CROSS ENGINE
  else if (STRATEGY_PROFILE === "PROFILE_V75_1S_EMA_STOCH15") {
    // Condition 1: M5 EMA 100 vs M5 EMA 200 Trend Filter
    const ema100Above200 = currentEma100 !== null && currentEma200 !== null && currentEma100 > currentEma200;
    const ema100Below200 = currentEma100 !== null && currentEma200 !== null && currentEma100 < currentEma200;

    // Condition 2: M5 EMA 100 / EMA 200 Retracement Touch
    const currCandle = candles[si];
    const low = parseFloat(currCandle.low), high = parseFloat(currCandle.high);
    // Touch occurs if candle low reaches/dips to EMA 100 or EMA 200 (for BUY) or high reaches/exceeds EMA 100 or EMA 200 (for SELL)
    const touchedBuyEma = (currentEma100 !== null && low <= currentEma100) || (currentEma200 !== null && low <= currentEma200);
    const touchedSellEma = (currentEma100 !== null && high >= currentEma100) || (currentEma200 !== null && high >= currentEma200);

    if (ema100Above200 && touchedBuyEma) {
      state.v75_1s_emaTouched_BUY = true;
    }
    if (ema100Below200 && touchedSellEma) {
      state.v75_1s_emaTouched_SELL = true;
    }

    // Reset touch latch if trend filter breaks
    if (!ema100Above200) {
      state.v75_1s_emaTouched_BUY = false;
    }
    if (!ema100Below200) {
      state.v75_1s_emaTouched_SELL = false;
    }

    // Condition 3: Price vs M5 EMA 100 Position Filter (Candle Close confirms retracement finished and trend resuming)
    const priceAboveEma100 = currentEma100 !== null && currentPrice > currentEma100;
    const priceBelowEma100 = currentEma100 !== null && currentPrice < currentEma100;

    // Condition 4: M5 Stochastic (15,5,8) %K/%D Fresh Cross out of 25/75 Extreme Zone
    const stochCrossBuy = (prevK <= prevD && sK > sD) && (prevK <= 25.0 || prevD <= 25.0 || sK <= 25.0);
    const stochCrossSell = (prevK >= prevD && sK < sD) && (prevK >= 75.0 || prevD >= 75.0 || sK >= 75.0);

    // All conditions satisfied (may occur in any order across different candles)
    if (ema100Above200 && priceAboveEma100 && state.v75_1s_emaTouched_BUY && stochCrossBuy) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = "V75_1S_EMA_STOCH15 (BUY)";
    } else if (ema100Below200 && priceBelowEma100 && state.v75_1s_emaTouched_SELL && stochCrossSell) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = "V75_1S_EMA_STOCH15 (SELL)";
    }

    // Determine Fib TP target from Daily Fibonacci Grid
    if (indicatorsSatisfied) {
      const sortedLevels = Array.from(new Set(keyLevels.map(k => k.lvl).filter(v => typeof v === "number" && !isNaN(v)))).sort((a, b) => a - b);
      if (signalDirection === "BUY") {
        const higher = sortedLevels.filter(l => l > currentPrice);
        calculatedFibTp = higher.length > 0 ? higher[0] : null;
      } else if (signalDirection === "SELL") {
        const lower = sortedLevels.filter(l => l < currentPrice);
        calculatedFibTp = lower.length > 0 ? lower[lower.length - 1] : null;
      }
    }
  }
  // 4. VOLATILITY 25 (R_25) M5 STOCH (200,1,1) MAIN TREND + M5 CCI 100 EXECUTION ENGINE
  else if (STRATEGY_PROFILE === "PROFILE_V25_STOCH200_CCI100" || STRATEGY_PROFILE === "PROFILE_V25_STOCH45_VALIDATOR" || STRATEGY_PROFILE === "PROFILE_V25_EMA_STOCH15") {
    // Condition 1: Indicator 1 - M5 Stoch (200,1,1) Main Trend Identifier
    // Cross above 50 arm buy, cross below 50 arm sell. Do not add entry timer window.
    const stoch200CrossUp50 = prevK !== null && prevK <= 50.0 && sK > 50.0;
    const stoch200CrossDown50 = prevK !== null && prevK >= 50.0 && sK < 50.0;

    if (stoch200CrossUp50) {
      state.v25_trendDirection = "BUY";
      console.log(`[V25 TREND ARM] M5 Stoch (200,1,1) crossed ABOVE 50 (%K ${sK.toFixed(1)}, prev ${prevK.toFixed(1)}). ARMED BUY.`);
    } else if (stoch200CrossDown50) {
      state.v25_trendDirection = "SELL";
      console.log(`[V25 TREND ARM] M5 Stoch (200,1,1) crossed BELOW 50 (%K ${sK.toFixed(1)}, prev ${prevK.toFixed(1)}). ARMED SELL.`);
    }

    // Condition 2: Indicator 2 - M5 CCI 100 Zero-Line Cross Trigger
    // Cross above zero: execute buy. Cross below zero: execute sell.
    const cciCrossUpZero = prevCci !== null && prevCci <= 0.0 && cVal > 0.0;
    const cciCrossDownZero = prevCci !== null && prevCci >= 0.0 && cVal < 0.0;

    // Simultaneous cross exception: cross for both conditions happened on the same M5 candle close
    const simultaneousBuy = stoch200CrossUp50 && cciCrossUpZero;
    const simultaneousSell = stoch200CrossDown50 && cciCrossDownZero;

    // --- BUY PATH ---
    // Condition 1 must happen before condition 2, except simultaneous cross on same M5 candle
    if (cciCrossUpZero && (state.v25_trendDirection === "BUY" || simultaneousBuy)) {
      const isSimultaneous = simultaneousBuy;
      console.log(`[V25 TRIGGER] ${isSimultaneous ? "SIMULTANEOUS CROSS" : "SEQUENTIAL TRIGGER"}: Stoch (200,1,1) %K ${sK.toFixed(1)} (Trend: BUY) + CCI 100 cross >0 (${cVal.toFixed(1)}). FIRING BUY!`);
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = isSimultaneous ? "V25_STOCH200_CCI100_SIMULTANEOUS (BUY)" : "V25_STOCH200_CCI100 (BUY)";
    }

    // --- SELL PATH ---
    // Condition 1 must happen before condition 2, except simultaneous cross on same M5 candle
    if (!indicatorsSatisfied && cciCrossDownZero && (state.v25_trendDirection === "SELL" || simultaneousSell)) {
      const isSimultaneous = simultaneousSell;
      console.log(`[V25 TRIGGER] ${isSimultaneous ? "SIMULTANEOUS CROSS" : "SEQUENTIAL TRIGGER"}: Stoch (200,1,1) %K ${sK.toFixed(1)} (Trend: SELL) + CCI 100 cross <0 (${cVal.toFixed(1)}). FIRING SELL!`);
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = isSimultaneous ? "V25_STOCH200_CCI100_SIMULTANEOUS (SELL)" : "V25_STOCH200_CCI100 (SELL)";
    }

    // Determine geometric Fib TP target from key levels grid
    if (indicatorsSatisfied) {
      const sortedLevels = Array.from(new Set(keyLevels.map(k => k.lvl).filter(v => typeof v === "number" && !isNaN(v)))).sort((a, b) => a - b);
      if (signalDirection === "BUY") {
        const higher = sortedLevels.filter(l => l > currentPrice);
        calculatedFibTp = higher.length > 0 ? higher[0] : null;
      } else if (signalDirection === "SELL") {
        const lower = sortedLevels.filter(l => l < currentPrice);
        calculatedFibTp = lower.length > 0 ? lower[lower.length - 1] : null;
      }
    }
  }
  // 5. VOLATILITY 50 STOCHASTIC BOUNDARIES (20 / 80) ENGINE
  else if (STRATEGY_PROFILE === "PROFILE_V50_STOCH_BOUNDARIES") {
    // Strict Boundary Crossing: BUY requires cross strictly above 20; SELL requires cross strictly below 80
    const stoch20CrossUp = prevK <= 20.0 && sK > 20.0;
    const stoch80CrossDown = prevK >= 80.0 && sK < 80.0;

    if (state.armed) {
      if (state.armed.dir === "BUY" && stoch20CrossUp) {
        indicatorsSatisfied = true;
        signalDirection = "BUY";
      } else if (state.armed.dir === "SELL" && stoch80CrossDown) {
        indicatorsSatisfied = true;
        signalDirection = "SELL";
      }
    }
  }
  // 6. GENERAL / LEGACY CONFLUENCE FALLBACK
  else {
    const crossUp = prevK <= prevD && sK > sD;
    const crossDown = prevK >= prevD && sK < sD;
    const crossedAbove50 = prevK < 50 && sK >= 50;
    const crossedBelow50 = prevK > 50 && sK <= 50;
    const envAligned = (currentPrice > eUp && state.armed?.dir === "BUY") || (currentPrice < eLo && state.armed?.dir === "SELL");

    if (state.armed && envAligned) {
      if (state.armed.dir === "BUY" && (crossUp || crossedAbove50)) {
        indicatorsSatisfied = true;
        signalDirection = "BUY";
      } else if (state.armed.dir === "SELL" && (crossDown || crossedBelow50)) {
        indicatorsSatisfied = true;
        signalDirection = "SELL";
      }
    }
  }

  // ── C. TRIGGER EXECUTION GATE & CONTRACT CREATION ──
  let signalTriggered = false;
  let direction = signalDirection;
  let fibTpPrice = calculatedFibTp || state.armed?.tp || null;
  let entryType = setupLabel || state.armed?.lbl || "STRATEGY_EXECUTION";
  let entryKeyLevel = state.armed?.lvl || null;

  if (indicatorsSatisfied && direction) {
    signalTriggered = true;
    state.lastTriggeredSetup = entryType;
    state.lastTriggeredEpoch = m5BoundaryEpoch;
    state.v100_1s_armed = false;
    state.v100_1s_armDir = null;
    state.v75_1s_emaTouched_BUY = false;
    state.v75_1s_emaTouched_SELL = false;
    state.v75_emaTouched_BUY = false;
    state.v75_emaTouched_SELL = false;
    state.latchStoch533_BUY = false;
    state.latchStoch533_SELL = false;
    state.latchFib_BUY = false;
    state.latchFib_SELL = false;
    state.latchCci_BUY = false;
    state.latchCci_SELL = false;
    state.latchStoch_BUY = false;
    state.latchStoch_SELL = false;
  }

  if (signalTriggered) {
    // Just-In-Time Execution Gate: Block if another position is active or pending in-flight
    trades = loadTrades();
    const activeTrade = trades.find(t => !t.result);
    if (activeTrade) {
      console.log(`[EXECUTION GATED] Signal ${entryType} confirmed, but contract ${activeTrade.contractId} (${activeTrade.direction}) is active. Maintaining active trade.`);
      state.lastProcessedEpoch = m5BoundaryEpoch;
      saveState();
      return;
    }
    const entry = currentPrice;

    // Calibrated Minimum Take Profit Engine ($4.00 TP Floor Across Fleet)
    let calibratedMinPts = MIN_TP_POINTS_FLOOR;
    const requiredRawPnl = TARGET_MIN_PROFIT + COMMISSION_USD;
    const priceMoveFraction = requiredRawPnl / (STAKE_USD * MULTIPLIER);
    const dollarTpPrice = direction === "BUY" ? entry * (1 + priceMoveFraction) : entry * (1 - priceMoveFraction);
    const pointsTpPrice = direction === "BUY" ? entry + calibratedMinPts : entry - calibratedMinPts;

    const minRequiredTp = direction === "BUY" ? Math.max(pointsTpPrice, dollarTpPrice) : Math.min(pointsTpPrice, dollarTpPrice);

    if (!fibTpPrice || (direction === "BUY" && minRequiredTp > fibTpPrice)) {
      fibTpPrice = minRequiredTp; entryType = entryType + " ($4.00 TP Floor)";
    } else if (direction === "SELL" && minRequiredTp < fibTpPrice) {
      fibTpPrice = minRequiredTp; entryType = entryType + " ($4.00 TP Floor)";
    }

    // Initial Stop Loss Anchor: Previous M15 / M5 Institutional Fractal Capped at $2.50 SL
    let initialM15Fractal = findRecentFractalM15(m15Candles, direction);
    let initialM5Fractal = findRecentFractal(candles, si, direction);
    const hardStopPrice = deriveHardStopPrice(entry, direction); // -$5.00 broker hard stop
    
    // Calculate -$2.50 maximum initial Stop Loss price
    const reqPnl250 = -2.50 + COMMISSION_USD;
    const moveFrac250 = reqPnl250 / (STAKE_USD * MULTIPLIER);
    const sl250Price = direction === "BUY" ? entry * (1 + moveFrac250) : entry * (1 - moveFrac250);

    let sl;
    if (PROFILE.slType === "HARD_POINTS") {
      sl = hardStopPrice;
    } else if (PROFILE.slType === "M5_FRACTAL") {
      if (direction === "BUY") {
        sl = (initialM5Fractal && initialM5Fractal > sl250Price && initialM5Fractal < entry) ? initialM5Fractal : sl250Price;
      } else {
        sl = (initialM5Fractal && initialM5Fractal < sl250Price && initialM5Fractal > entry) ? initialM5Fractal : sl250Price;
      }
    } else {
      if (direction === "BUY") {
        // Use M15 Fractal ONLY IF it is tighter than $2.50 SL price
        sl = (initialM15Fractal && initialM15Fractal > sl250Price && initialM15Fractal < entry) ? initialM15Fractal : sl250Price;
      } else {
        sl = (initialM15Fractal && initialM15Fractal < sl250Price && initialM15Fractal > entry) ? initialM15Fractal : sl250Price;
      }
    }

    const timeFormatted = new Date(m5BoundaryEpoch * 1000).toISOString().replace("T", " ").substring(0, 19);
    const dirEmoji = direction === "BUY" ? "🟢 ⬆️ BUY" : "🔴 ⬇️ SELL";

    // Build Dynamic Confluence Verification Lines Matching Exact Instrument Strategy Profile
    const matchedKey = keyLevels.find(k => entryKeyLevel !== null && Math.abs(k.lvl - entryKeyLevel) < 1e-4);
    const exactKeyName = matchedKey ? matchedKey.name : (entryKeyLevel ? entryKeyLevel.toFixed(2) : "N/A");

    const matchedTp = keyLevels.find(k => fibTpPrice !== null && Math.abs(k.lvl - fibTpPrice) < 1e-4);
    const exactTpName = matchedTp ? matchedTp.name : (fibTpPrice ? fibTpPrice.toFixed(2) : "TP Target");

    let confluenceLines = `• Gate Engine: *${GATE_TYPE}*\n`;
    if (STRATEGY_PROFILE === "PROFILE_V100_1S_EMA_STOCH533") {
      confluenceLines += `• M5 EMA 100: *${currentEma100 ? currentEma100.toFixed(4) : "N/A"}* (${direction === "BUY" ? "Price > EMA 100 [BULLISH]" : "Price < EMA 100 [BEARISH]"})\n` +
                         `• Fast Stoch (5,3,3): *%K ${(sK533 !== null ? sK533.toFixed(1) : "N/A")}* | *%D ${(sD533 !== null ? sD533.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">20 Oversold Cross [TRIGGERED]" : "<80 Overbought Cross [TRIGGERED]"})\n` +
                         `• Target Fib Level: *${fibTpPrice ? fibTpPrice.toFixed(4) : "N/A"}* (${exactTpName} Target)\n`;
    } else if (STRATEGY_PROFILE === "PROFILE_V75_EMA_STOCH15") {
      confluenceLines += `• M5 EMA 100 vs 200: *EMA 100 (${currentEma100 ? currentEma100.toFixed(2) : "N/A"}) ${direction === "BUY" ? ">" : "<"} EMA 200 (${currentEma200 ? currentEma200.toFixed(2) : "N/A"})* [${direction === "BUY" ? "UPTREND" : "DOWNTREND"}]\n` +
                         `• M5 EMA Retracement: *EMA 100/200 Touch Verified* [LATCHED]\n` +
                         `• M5 Stoch (15,18,8, Exp): *%K ${(sK !== null ? sK.toFixed(1) : "N/A")}* | *%D ${(sD !== null ? sD.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">%D Oversold Cross (<=25)" : "<%D Overbought Cross (>=75)"} [TRIGGERED])\n` +
                         `• Take Profit Target: *${fibTpPrice ? fibTpPrice.toFixed(2) : "N/A"}* (Min $${TARGET_MIN_PROFIT.toFixed(2)} Net + Trailing Stop)\n` +
                         `• Early Exit Engine: *Loss Protection — Opposite %K/%D Cross Liquidation*\n`;
    } else if (STRATEGY_PROFILE === "PROFILE_V75_1S_EMA_STOCH15") {
      confluenceLines += `• M5 EMA 100 vs 200: *EMA 100 (${currentEma100 ? currentEma100.toFixed(2) : "N/A"}) ${direction === "BUY" ? ">" : "<"} EMA 200 (${currentEma200 ? currentEma200.toFixed(2) : "N/A"})* [${direction === "BUY" ? "UPTREND" : "DOWNTREND"}]\n` +
                         `• M5 EMA Retracement: *EMA 100/200 Touch Verified* [LATCHED]\n` +
                         `• M5 Candle Close: *Price (${currentPrice.toFixed(2)}) ${direction === "BUY" ? ">" : "<"} EMA 100* [RESUMPTION]\n` +
                         `• M5 Stoch (15,5,8): *%K ${(sK !== null ? sK.toFixed(1) : "N/A")}* | *%D ${(sD !== null ? sD.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">D Oversold Cross (<=20)" : "<D Overbought Cross (>=80)"} [TRIGGERED])\n` +
                         `• M15 Key Fib Target: *${fibTpPrice ? fibTpPrice.toFixed(2) : "N/A"}* (${exactTpName} Target)\n`;
    } else if (STRATEGY_PROFILE === "PROFILE_V100_MIDLINE_ENV") {
      confluenceLines += `• M15 Key Fib Level: *${entryKeyLevel ? entryKeyLevel.toFixed(4) : "N/A"}* (${exactKeyName} Anchor Level)\n` +
                         `• M5 Stoch (18,12,25): *%K ${(sK !== null ? sK.toFixed(1) : "N/A")}* | *%D ${(sD !== null ? sD.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">50 Midline Cross [TRIGGERED]" : "<50 Midline Cross [TRIGGERED]"})\n` +
                         `• Envelope 200 (0.05%): *${direction === "BUY" ? "Price > Upper (" + eUp.toFixed(4) + ")" : "Price < Lower (" + eLo.toFixed(4) + ")"}* [BREAKOUT]\n` +
                         `• Target Fib Level: *${fibTpPrice ? fibTpPrice.toFixed(4) : "N/A"}* (${exactTpName} Target)\n`;
    } else if (STRATEGY_PROFILE === "PROFILE_V25_STOCH200_CCI100" || STRATEGY_PROFILE === "PROFILE_V25_STOCH45_VALIDATOR") {
      confluenceLines += `• M5 Stoch (200,1,1) Trend: *%K ${(sK !== null ? sK.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">50 [BULLISH ARMED]" : "<50 [BEARISH ARMED]"})\n` +
                         `• M5 CCI 100 Trigger: *${(cVal !== null ? cVal.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">0 Cross [TRIGGERED]" : "<0 Cross [TRIGGERED]"})\n` +
                         `• Target Fib Level: *${fibTpPrice ? fibTpPrice.toFixed(4) : "N/A"}* (${exactTpName} Target)\n` +
                         `• Early Exit Engine: *Loss Protection — Previous M5 Fractal (${initialM5Fractal ? initialM5Fractal.toFixed(2) : "N/A"}) Break*\n`;
    } else if (STRATEGY_PROFILE === "PROFILE_V50_STOCH_BOUNDARIES") {
      confluenceLines += `• M15 Key Fib Level: *${entryKeyLevel ? entryKeyLevel.toFixed(4) : "N/A"}* (${exactKeyName} Anchor Level - Excludes 50%)\n` +
                         `• M5 Stoch (18,12,25): *%K ${(sK !== null ? sK.toFixed(1) : "N/A")}* | *%D ${(sD !== null ? sD.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">20 Oversold Boundary Cross [TRIGGERED]" : "<80 Overbought Boundary Cross [TRIGGERED]"})\n` +
                         `• Target Fib Level: *${fibTpPrice ? fibTpPrice.toFixed(4) : "N/A"}* (${exactTpName} Target)\n`;
    } else {
      // V75 (PROFILE_V75_MIDLINE_FRACTAL) and V10 (PROFILE_V10_MIDLINE_FRACTAL)
      confluenceLines += `• M15 Key Fib Level: *${entryKeyLevel ? entryKeyLevel.toFixed(4) : "N/A"}* (${exactKeyName} Anchor Level)\n` +
                         `• M5 Stoch (18,12,25): *%K ${(sK !== null ? sK.toFixed(1) : "N/A")}* | *%D ${(sD !== null ? sD.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">50 Midline Cross [TRIGGERED]" : "<50 Midline Cross [TRIGGERED]"})\n` +
                         `• Target Fib Level: *${fibTpPrice ? fibTpPrice.toFixed(4) : "N/A"}* (${exactTpName} Target)\n`;
    }
    confluenceLines += `• Daily Target Progress: *$${(state.dailyNetPnl || 0).toFixed(2)} / $${DAILY_PROFIT_TARGET_USD.toFixed(2)}*`;

    const message = 
      `🚨 *${SYMBOL_NAME.toUpperCase()} SIGNAL* 🚨\n\n` +
      `Direction: *${dirEmoji}*\n` +
      `Strategy Profile: *${STRATEGY_PROFILE}*\n` +
      `Setup: *${escapeMarkdown(entryType)}*\n` +
      `📍 Entry: *${entry.toFixed(4)}*\n` +
      `🛑 Initial SL: *${sl.toFixed(4)}* (${initialM5Fractal ? "M5 Fractal Anchor" : (initialM15Fractal ? "M15 Fractal Anchor" : "Hard Stop Barrier")})\n` +
      `🎯 Take Profit: *${fibTpPrice.toFixed(4)}* (Min $${TARGET_MIN_PROFIT.toFixed(2)} Net + Trailing Active)\n\n` +
      `💰 Stake: $${STAKE_USD} | Multiplier: ${MULTIPLIER}x\n\n` +
      `📐 *Technical Confluence Verification:*\n` +
      confluenceLines + `\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⏰ Time (UTC): ${timeFormatted}\n\n` +
      `💡 To close manually: send \`/close win\` or \`/close loss\``;

    const pendingTradeRecord = {
      id: `${SYMBOL}-${Date.now()}`, contractId: null, pending: true, repo: REPO_LABEL, symbol: SYMBOL, direction, entry, sl, rr: null, entryType, brokerSlAmount: STAKE_USD,
      entryEpoch: m5BoundaryEpoch, purchaseTimeEpoch: m5BoundaryEpoch, purchase_time: m5BoundaryEpoch,
      fractalSl: initialM5Fractal || initialM15Fractal,
      fractalEpoch: null,
      fractalTimeframe: initialM5Fractal ? "M5" : (initialM15Fractal ? "M15" : null),
      m5Fractal: initialM5Fractal,
      m30FractalUpgraded: false, fibTpPrice,
      keyLevel: entryKeyLevel,
      openTime: timeFormatted, closeTime: null, result: null
    };
    trades.push(pendingTradeRecord);
    saveTrades(trades);

    try {
      const contractId = await executeTrade(direction);
      if (!contractId) {
        trades.splice(trades.findIndex(t => t.id === pendingTradeRecord.id), 1); saveTrades(trades);
        await sendTelegram(`❌ *${REPO_LABEL}* — Signal triggered, but broker returned no contract ID. Aborted.`);
      } else {
        pendingTradeRecord.contractId = contractId;
        pendingTradeRecord.pending = false;
        saveTrades(trades);
        state.armed = null;
        state.armedEpoch = null;
        state.armedTime = null;
        state.confirm = null;
        state.nextPhase = null;
        await sendTelegram(message);
      }
    } catch (execErr) {
      trades.splice(trades.findIndex(t => t.id === pendingTradeRecord.id), 1); saveTrades(trades);
      await sendTelegram(`❌ *${REPO_LABEL}* — Live execution failed: ${execErr.message}`);
    }
  }

  state.lastProcessedEpoch = m5BoundaryEpoch; saveState();
}

// ==================== 24/7 CONTINUOUS ENGINE ====================
async function checkTelegramCommands() {
  if (!TG_TOKEN || !TG_CHAT_ID) return;
  try {
    const offset = (state.lastTgUpdateId || 0) + 1;
    const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/getUpdates?offset=${offset}&limit=10&timeout=0`);
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.result)) return;
    for (const update of data.result) {
      state.lastTgUpdateId = update.update_id;
      const text = update.message?.text?.trim()?.toLowerCase();
      if (text === "/status") {
        const t = loadTrades().filter(x => !x.result && !x.pending);
        const reply = t.length ? `📍 *Active Trades:*\n` + t.map(x => `• ${x.symbol || SYMBOL} ${x.direction} @ ${Number(x.entry).toFixed(4)} (SL: ${Number(x.sl).toFixed(4)})`).join("\n") : `⚪ No open trades.`;
        await sendTelegram(reply);
      }
    }
    saveState();
  } catch (e) {}
}

export async function startContinuousEngine() {
  console.log(`[${REPO_LABEL}] 🚀 24/7 Continuous Master Trading Engine Initialized.`);
  console.log(`[${REPO_LABEL}] ⚙️ Profile: ${STRATEGY_PROFILE} | Multiplier: ${MULTIPLIER}x`);
  
  setInterval(checkTelegramCommands, 15000);

  let isScanning = false;

  // Immediate Initial Scan on Startup: Resolve market structure and arm state immediately
  try {
    const initEpoch = Math.floor(Date.now() / 1000);
    const initM5Boundary = initEpoch - (initEpoch % 300);
    console.log(`[${REPO_LABEL}] 🔄 Executing initial startup slow-path scan to resolve market state...`);
    isScanning = true;
    await runSlowPathScan(initM5Boundary);
    isScanning = false;
  } catch (initErr) {
    console.error(`[${REPO_LABEL}] Initial Startup Scan Warning:`, initErr.message);
    isScanning = false;
  }

  while (true) {
    let hasOpenTrade = false;
    try {
      const nowEpoch = Math.floor(Date.now() / 1000);
      const currentM5Boundary = nowEpoch - (nowEpoch % 300);

      hasOpenTrade = await manageOpenTradesFastPath();

      // Ensure spot price is refreshed periodically in state.json even if no open trades
      if (!state.currentPrice || !state.lastPriceUpdate || (Date.now() - new Date(state.lastPriceUpdate).getTime() > 30000)) {
        try {
          const freshPrice = await fetchCurrentSpotPrice();
          state.symbol = SYMBOL;
          state.currentPrice = freshPrice;
          state.lastPriceUpdate = new Date().toISOString();
          saveState();
        } catch (e) {
          // Log only if price has never been fetched yet
          if (!state.currentPrice) {
            console.warn(`[${REPO_LABEL}] Periodic spot fetch warning: ${e.message}`);
          }
        }
      }

      const secondsIntoCandle = nowEpoch % 300;
      if (currentM5Boundary > (state.lastProcessedEpoch || 0) && secondsIntoCandle >= 3 && !isScanning) {
        isScanning = true;
        await runSlowPathScan(currentM5Boundary);
        isScanning = false;
      }
    } catch (err) {
      console.error(`[${REPO_LABEL}] Engine Loop Error:`, err.message);
      isScanning = false;
    }

    // Adaptive Risk Pulse: 2 seconds when managing an active live trade, 3 seconds when idle
    await sleep(hasOpenTrade ? 2000 : 3000);
  }
}

// ==================== EXECUTION HOOK ====================
(async () => {
  await startContinuousEngine();
})();
