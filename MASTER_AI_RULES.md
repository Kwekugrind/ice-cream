# MASTER AI & DEVELOPER GOVERNANCE RULES
### Non-Negotiable Directives for Antigravity & All Autonomous Trading Agents
**Last Updated: November 14, 2026**

---

## 1. THE TWO-SYSTEM DIVISION INVARIANT
Never merge, overwrite, or confuse the two trading systems:
* **Account 2596044 — Baseline Strategy (Old / Legacy):**
  * BUY: Closed M5 candle > High Fractal High.
  * SELL: Closed M5 candle < Low Fractal Low.
  * SL: Bill Williams Fractal Body Anchor (Open/Close of fractal candle) with breakout candle dual confirmation.
* **Account 2450642 — Sweep-Reclaim Strategy (New / Experimental):**
  * BUY: Closed M5 candle > Lowest Point of recent Up or Down fractal (wick dipped below, closed above).
  * SELL: Closed M5 candle < Highest Point of recent Up or Down fractal (wick spiked above, closed below).
  * SL: Strictly the **Breakout Candle extreme** (`breakoutCandle.low` for BUY, `breakoutCandle.high` for SELL). Never modified post-entry.

---

## 2. STRICT RISK & EXECUTION CONSTRAINTS
* **Broker Hard SL Cap:** Transmitted with every order; strictly capped at **$15.00 USD maximum catastrophic broker loss**.
* **1HZ25V Hard TP:** Strictly locked to **$15.00 USD**.
* **Initial Entry Timing:** The $\pm 3$-candle lookback rule applies strictly to prior fractals formed before the Stoch 100 cross. As long as Stoch (8,1,1) holds above 50 (BUY) or below 50 (SELL), the initial setup never expires forward.
* **Closed-M5 Evaluation:** All signals and software stop-losses execute strictly on confirmed closed M5 candles (`m5BoundaryEpoch`), never on intrabar flickers.

---

## 3. AUDIT & TROUBLESHOOTING PROTOCOL
* When answering "which candle was the fractal" or "which candle broke it":
  * Do NOT guess, compute, or spend multiple turns scanning logs.
  * Immediately read `trades.json` via the S1/S2 API. The exact fields `fractalEpoch`, `breakoutCandleEpoch`, `entryCandleEpoch`, and `sl` are recorded directly in the trade ledger.
* Always verify syntax with `node -c` before restarting any PM2 process.
