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
* **Daily Profit Target:** +$7.00 USD per bot per calendar day.
* **Initial Entry Timing:** The $\pm 3$-candle lookback rule applies strictly to prior fractals formed before the Stoch 100 cross. As long as Stoch (8,1,1) holds above 50 (BUY) or below 50 (SELL), the initial setup never expires forward.
* **Closed-M5 Evaluation:** All signals and software stop-losses execute strictly on confirmed closed M5 candles (`m5BoundaryEpoch`), never on intrabar flickers.

---

## 3. AUDIT & TROUBLESHOOTING PROTOCOL
* When answering "which candle was the fractal" or "which candle broke it":
  * Do NOT guess, compute, or spend multiple turns scanning logs.
  * Immediately read `trades.json` via the S1/S2 API. The exact fields `fractalEpoch`, `breakoutCandleEpoch`, `entryCandleEpoch`, and `sl` are recorded directly in the trade ledger.
* Always verify syntax with `node -c` before restarting any PM2 process.
* **Zero Direct Server Edits:** Never edit files directly on Oracle Server 1 or Server 2. Commit and push all changes to GitHub; the universal daemon (`pull-trades.sh`) syncs and hot-reloads PM2 automatically within 60 seconds.

---

## 4. ARCHITECTURE & REPOSITORY DIRECTORY (OPTION B CENTRALIZATION)
* **Single Authoritative Handbook Home:** The Master Operations Handbook (`HANDBOOK.md`) lives strictly in **`Kwekugrind/trading-handbook`** (https://github.com/Kwekugrind/trading-handbook) and the central dev workspace (`omnisight-command-center`).
* **Bot Repositories are Lean Code Containers:** Individual bot repos (`Lery-s-Alerts`, `coffee`, `Milk`, `ice-cream`, `Tea`, `OmniSight`, `Test-Bot`, `command-bot`) must contain ONLY executable bot code (`alert.js`, `alert_experimental.js`, `package.json`, `.env.example`, `.gitignore`, `README.md`).
* **AI Rule for Documentation:** Never commit duplicate copies of `HANDBOOK.md` into individual bot repositories. Any AI or developer needing architectural specifications, deployment steps, or strategy definitions must consult `https://github.com/Kwekugrind/trading-handbook`.
* **Single Master Updates:** When updating system architecture or trading rules, edit `HANDBOOK.md` and `MASTER_AI_RULES.md` in `omnisight-command-center`, then commit and push to `Kwekugrind/trading-handbook` and `Kwekugrind/Google-ai-studio`.
