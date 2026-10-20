# OMNISIGHT FLEET TRADE RULES COMPENDIUM
### Version 8.8 -- October 2026 Authoritative Trading Rules & Parameter Specification

---

## 1. FLEET ROSTER & STRATEGY MATRIX

All active trading bots operate on cTrader Open API execution, targeting a **$4.00 Minimum Net Take Profit** ($7.00 Extended Target Alignment) and protected by a **-$2.50 Software Stop Loss** (-$3.50 on `R_25`; -$5.00 Hard Broker SL limit).

| Bot Label | PM2 Name | Server | Directory Path | Symbol | Symbol ID | Lot Size | Stake | Strategy Gate | Min TP Pts ($4 Net) | Max Hard SL Pts |
|---|---|---|---|---|---|---|---|---|---|---|
| **Lery's Alerts** | `lery-v75` | S1 | `~/trading-bots/Lery-s-Alerts` | Volatility 75 | `R_75` | 0.01 Lots | $5.00 | M5 EMA 100/200 2-Step Initial (80/20) & EMA 100 Touch Retracement (20/80) | 400.0 pts | 250.0 pts |
| **Coffee Machine** | `coffee-v75-1s` | S1 | `~/trading-bots/coffee` | Volatility 75 (1s) | `1HZ75V` | 0.05 Lots | $5.00 | Sequential Stoch 200 -> MACD (25,75,1) + EMA 100 + Stoch (15,2,5) Re-Entry (20/80) | 80.0 pts | 50.0 pts |
| **Milk Machine** | `milk-v100` | S1 | `~/trading-bots/milk` | Volatility 100 | `R_100` | 1.00 Lot | $5.00 | M5 Stoch 200 (48/52) Trend + M5 Stoch (15,2,5) 50 Cross & Extreme Re-Entry (20/80) | 4.00 pts | 2.50 pts |
| **Tea Machine** | `tea-v25` | S1 | `~/trading-bots/tea` | Volatility 25 | `R_25` | 0.50 Lots | $5.00 | M5 Stoch (200,1,1) Trend + CCI 100 Zero Cross + Stoch (15,2,5) Re-Entry (25/75) | 8.00 pts | 5.00 pts |
| **Ice Cream** | `ice-cream-100-1s` | S2 | `~/trading-bots/ice-cream` | Volatility 100 (1s) | `1HZ100V` | 1.00 Lot | $5.00 | M5 Stoch 200 + MACD (25,75,1) + EMA 100 + Stoch (5,3,3) Extreme Re-Entry (20/80) | 4.00 pts | 2.50 pts |
| **OmniSight** | `omni-v50` | S2 | `~/trading-bots/OmniSight` | Volatility 50 | `R_50` | 4.00 Lots | $5.00 | M5 Stoch (200,1,1) Trend + M5 Stoch (15,2,5) 50 Cross & Re-Entry (25 Buy / 85 Sell) | 1.00 pt | 0.625 pts |
| **Test Bot** | `test-v10` | S2 | `~/trading-bots/Test-Bot` | Volatility 10 | `R_10` | 0.50 Lots | $5.00 | M5 Stoch 200 + MACD (25,75,1) + EMA 100 Any-Order + Stoch (5,3,3) Re-Entry (20/80) | 8.00 pts | 5.00 pts |

---

## 2. STRATEGY PROFILE RULES & INDICATOR MATRIX

* **Entry Execution Mandate:** Fibonacci Grid Touch/Crossover is **NOT REQUIRED FOR ENTRY** on any instrument in the fleet. Entries are governed strictly by calibrated M5 EMA, Stochastic, CCI, and MACD indicators as detailed in Section 1 and `HANDBOOK.md` Section 9.
* **Take Profit Target Mandate:** The Daily Fibonacci Grid (0%, 50%, 79%, 100%, -50%, 161.8%) serves as the technical **Take Profit Target Grid** for active trades, enforced with a minimum **$4.00 Net Take Profit Target Floor** ($7.00 Extended Target Alignment) and managed by the Two-Tier Dynamic Trailing Stop Ratchet + Closed-M5 Stoch (15, 2, 5) Midline Profit Exit when in profit.

---

## 3. FOUR-TIER DYNAMIC PROFIT RATCHET & RUNNER IMMUNITY ENGINE

* **Software Stop Loss (-$2.50 / -$3.50 on `R_25`):** Hard software cap liquidates trade at -$2.50 unrealized PnL (-$3.50 on `R_25`).
* **Hard Broker Stop Loss (-$5.00):** Broker-level safety order.
* **Tier 1 Breakeven Shield (+$2.20 Floating Profit):** Locks in `+$1.00` net profit floor to guarantee positive trade and cover broker spread.
* **Tier 2 Standard Runner Ratchet (+$4.00 to +$7.99 Peak Profit):** Locks in `+$2.50` base profit floor and trails tightly `$1.80` behind peak unrealized profit (`maxUnrealizedPnL`):
  $$\text{lockedPnlFloor} = \max(+\$2.50, \text{maxUnrealizedPnL} - \$1.80)$$
* **Tier 3 Advanced Runner Ratchet (+$8.00 to +$11.99 Peak Profit):** Locks in at least **70% of peak profit** (capping maximum giveback to `$2.20`):
  $$\text{lockedPnlFloor} = \max(\text{lockedPnlFloor}, \text{maxUnrealizedPnL} \times 0.70, \text{maxUnrealizedPnL} - \$2.20)$$
  *Example:* At +$10.00 peak $\rightarrow$ floor locked at `+$7.80`. At +$12.00 peak $\rightarrow$ floor locked at `+$9.50`.
* **Tier 4 Super Runner Ratchet (+$12.00+ Peak Profit):** Locks in at least **80% of peak profit** (capping maximum giveback to `$2.50`):
  $$\text{lockedPnlFloor} = \max(\text{lockedPnlFloor}, \text{maxUnrealizedPnL} \times 0.80, \text{maxUnrealizedPnL} - \$2.50)$$
  *Example:* At +$15.00 peak $\rightarrow$ floor locked at `+$12.50`. At +$20.00 peak $\rightarrow$ floor locked at `+$16.00`.
* **Hard Take Profit / Super Runner Cash-out Ceiling (+$20.00):** Instant market cash-out upon touching `+$20.00` floating profit.
* **Runner Immunity Mandate:** 
  Trades in profit ($\text{PnL} \ge +\$3.50$ or active Trend-Rider) receive **Runner Immunity**. Early loss-prevention exits (such as 3 consecutive M5 adverse candles, Stoch (15,2,5) %K crossing 35/65, or Stoch %K crossing 50) are **bypassed** to allow profitable runners to breathe through routine pullbacks without being killed prematurely. The position is managed strictly by the Tiered Dynamic Ratchet and macro trend invalidations (Stoch 200 / EMA 100).

---

## 4. GOOGLE AI STUDIO DEPLOYMENT & REPOSITORY SYNC PROTOCOL

* **Direct AI Studio Push:** All code changes are committed from Google AI Studio and pushed using `scripts/sync-to-github.sh` and `scripts/auto-sync.sh`.
* **Zero Direct Server Edits:** Never edit code directly on live servers. Server daemons run `pull-trades.sh` every 5 minutes and overwrite direct server edits with origin main.

---

## 5. UNIVERSAL M5 EMA 100 DIRECTIONAL FILTER & CONTINUOUS RE-ENTRY ENGINE

* **Universal M5 EMA 100 Filter Across All 7 Bots:**
  * **BUY Orders (Initial & Re-Entry):** Strictly permitted **ONLY** when current M5 candle price is **ABOVE** M5 EMA 100 (`currentPrice > currentEma100`). If price is below or equal to EMA 100, BUY triggers are blocked.
  * **SELL Orders (Initial & Re-Entry):** Strictly permitted **ONLY** when current M5 candle price is **BELOW** M5 EMA 100 (`currentPrice < currentEma100`). If price is above or equal to EMA 100, SELL triggers are blocked.
  * **Live Engine Verification:** Both the continuous M5 slow-path scan and the immediate fast-path re-entry engine actively enforce this rule before placing any order.

* **Continuous Signal Search & Immediate Re-Entry Execution:**
  * While a trade is active, the engine continues evaluating every closed M5 candle to detect qualifying re-entry setups.
  * Qualifying setups are latched in `state.activeReentryOpportunity`.
  * The instant an active trade exits (via take profit, dynamic ratchet, or software SL), the fast-path watchdog executes `checkAndExecuteImmediateReentry()` immediately without waiting up to 5 minutes for the next candle boundary.

* **Fleet Monitor Re-Entry Mode Telemetry:**
  * When an initial trade has executed and closed, the bot transitions to **RE-ENTRY WATCH** status (`state.isReentryMode = true`).
  * If the market has not pulled back into the trigger zone, `state.armed` is explicitly `null` (not static "ARMED"), displaying `Awaiting Re-Entry Signal` (purple status).
  * When price enters the active pullback zone and aligns with EMA 100, `state.armed` engages with `type: "RE_ENTRY"`.

---

## 6. STRICT AI SYSTEM DISCIPLINE & CAPITAL PROTECTION MANDATE

> [!] **CRITICAL AI OPERATIONAL DIRECTIVE (LIVE CAPITAL SAFETY):**
> 1. **Zero Assumptions Policy:** The AI engineering engine must **NEVER make assumptions, extrapolate, or guess user intent** regarding trading rules, indicators, target engines, or strategy profiles. If any instruction is underspecified, ambiguous, or unclear, the AI MUST HALT execution and ask the trader for explicit clarification.
> 2. **Strict Instruction Adherence:** The AI must adhere 100% strictly to explicit user instructions. Do NOT add, remove, "optimize", or strip strategy components or target engines beyond what was explicitly requested.
> 3. **Real Capital Responsibility:** Acknowledging that live financial capital is at stake, all code modifications, indicator gates, and execution logic must undergo mandatory verification and strictly preserve system stability and capital safety.
