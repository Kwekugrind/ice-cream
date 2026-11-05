# OMNISIGHT FLEET TRADE RULES COMPENDIUM
### Version 10.0 -- November 2026 Authoritative Trading Rules: Universal 5-Gate Fractal Breakout Engine

---

## 1. FLEET ROSTER & STRATEGY MATRIX

All 7 active trading bots operate with a standard **$5.00 Stake**, engineered for a **$100.00 Live Account Balance** to target **$7.00 Net Daily Profit per bot** ($49.00/day total fleet quota). Risk is strictly governed by the **Entry Candle Invalidation Stop Loss** (closed M5 candle beyond entry candle Low for BUY / High for SELL), protected by a catastrophic broker safety floor (-$10.00).

| Bot Label | PM2 Name | Server | Directory Path | Symbol | Symbol ID | Lot Size | Stake | Strategy Gate | Base TP | Main Stop Loss | Early Exit |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Lery's Alerts** | `lery-v75` | S1 | `~/trading-bots/Lery-s-Alerts` | Volatility 75 | `R_75` | 0.01 Lots | $5.00 | Universal 5-Gate Fractal Breakout | $3.50 | Entry Candle Invalidation | Stoch 8 Level 50 Opposite Cross |
| **Coffee Machine** | `coffee-v75-1s` | S1 | `~/trading-bots/coffee` | Volatility 75 (1s) | `1HZ75V` | 0.15 Lots | $5.00 | Universal 5-Gate Fractal Breakout | $6.00 | Entry Candle Invalidation | Stoch 8 Level 50 Opposite Cross |
| **Milk Machine** | `milk-v100` | S1 | `~/trading-bots/milk` | Volatility 100 | `R_100` | 1.00 Lot | $5.00 | Universal 5-Gate Fractal Breakout | $10.00 | Entry Candle Invalidation | Stoch 8 Level 50 Opposite Cross |
| **Tea Machine** | `tea-v25` | S1 | `~/trading-bots/tea` | Volatility 25 | `R_25` | 0.50 Lots | $5.00 | Universal 5-Gate Fractal Breakout | $5.00 | Entry Candle Invalidation | Stoch 8 Level 50 Opposite Cross |
| **Ice Cream** | `ice-cream-100-1s` | S2 | `~/trading-bots/ice-cream` | Volatility 25 (1s) | `1HZ25V` | 0.005 Lots | $5.00 | Universal 5-Gate Fractal Breakout | $10.00 | Entry Candle Invalidation | Stoch 8 Level 50 Opposite Cross |
| **OmniSight** | `omni-v50` | S2 | `~/trading-bots/OmniSight` | Volatility 50 | `R_50` | 4.00 Lots | $5.00 | Universal 5-Gate Fractal Breakout | $3.00 | Entry Candle Invalidation | Stoch 8 Level 50 Opposite Cross |
| **Test Bot** | `test-v10` | S2 | `~/trading-bots/Test-Bot` | Volatility 10 | `R_10` | 0.50 Lots | $5.00 | Universal 5-Gate Fractal Breakout | $3.50 | Entry Candle Invalidation | Stoch 8 Level 50 Opposite Cross |

---

## 2. UNIVERSAL 5-GATE FRACTAL BREAKOUT STRATEGY SPECIFICATION

### Gate 1: Macro Trend Gate -- Closed M5 Stochastic (100, 1, 1 Simple)
* **BUY Mode:** Closed M5 Stoch 100 %K > 50.0.
* **SELL Mode:** Closed M5 Stoch 100 %K < 50.0.
* **Invalidation:** If Stoch 100 crosses opposite Level 50, the current setup is invalidated and the engine flips to watch for opposite signals.

### Gate 2: Entry Triggers -- Closed M5 Stochastic (8, 1, 1 Simple)
1. **Initial Trigger (Trend Reversal Entry):**
   * Occurs when Stoch (100, 1, 1) crosses Level 50.
   * If Stoch (8, 1, 1) crosses Level 50 in the same direction within ±2 M5 closed candles of the Stoch 100 transition, an Initial Trigger is armed.
   * The setup searches for a fractal breakout. It expires when Stoch 8 crosses below Level 10 (BUY) / above Level 90 (SELL), switching the engine to Re-Entry Mode.
2. **Re-Entry Mode (Trend Continuation Pullback):**
   * Operates as long as Stoch 100 remains aligned on the same side of Level 50.
   * **BUY Re-Entry:** Stoch (8, 1, 1) pulls back to touch or close <= 10.0. Arms re-entry breakout watch.
   * **SELL Re-Entry:** Stoch (8, 1, 1) pulls back to touch or close >= 90.0. Arms re-entry breakout watch.
   * Remains active as long as Stoch 100 remains on trend side; refreshes if Stoch 8 touches the extreme again.

### Gate 3: M5 Fractal Candle Breakout Trigger
* **BUY Entry:** Trigger trade when an M5 candle closes **ABOVE the close price** of the candle on which the most recent HIGH (UP) M5 fractal was drawn (`close > fractal.close`).
* **SELL Entry:** Trigger trade when an M5 candle closes **BELOW the close price** of the candle on which the most recent LOW (DOWN) M5 fractal was drawn (`close < fractal.close`).
* **No Timeframe Restriction:** No expiration count is imposed as long as Stoch 100 remains aligned.

### Gate 4: Directional Candle Confirmation
* The confirmed closed M5 candle triggering the signal must physically match trade direction:
  * **BUY Signal:** Closed M5 candle must be **Bullish** (`close > open`).
  * **SELL Signal:** Closed M5 candle must be **Bearish** (`close < open`).

### Gate 5: Trade Management & Capital Protection
1. **Primary Invalidation Stop Loss (Main SL):**
   * **BUY:** If confirmed M5 candle closes below the **LOW** of the candle on which the trade was executed, close trade immediately.
   * **SELL:** If confirmed M5 candle closes above the **HIGH** of the candle on which the trade was executed, close trade immediately.
2. **Early Trade Exit (Opposite Stoch 8 Midline Cross):**
   * To prevent premature stop-outs from sensitive breakeven locks on high-volatility instruments (e.g. VIX 100), all intrabar breakeven logic has been eliminated.
   * When in trade, if confirmed closed M5 Stoch 8 crosses opposite Level 50 (`prevK8 >= 50 && currK8 < 50` for BUY, `prevK8 <= 50 && currK8 > 50` for SELL), close trade immediately.
3. **Position Flipping:**
   * While a trade is open, continuous monitoring is active. If a valid opposite signal is confirmed, immediately close current trade and execute the new trade without delay.
4. **Catastrophic Broker SL Floor:**
   * Hard broker SL floor (-$10.00 / wide distance buffer) guards against extreme slippage or network disconnection.

---

## 3. STRICT AI SYSTEM DISCIPLINE & CAPITAL PROTECTION MANDATE

> [!] **CRITICAL AI OPERATIONAL DIRECTIVE (LIVE CAPITAL SAFETY):**
> 1. **Zero Assumptions Policy:** The AI engineering engine must **NEVER make assumptions, extrapolate, or guess user intent** regarding trading rules, indicators, target engines, or strategy profiles. If any instruction is underspecified, ambiguous, or unclear, the AI MUST HALT execution and ask the trader for explicit clarification.
> 2. **Strict Instruction Adherence:** The AI must adhere 100% strictly to explicit user instructions. Do NOT add, remove, "optimize", or strip strategy components or target engines beyond what was explicitly requested.
> 3. **Real Capital Responsibility:** Acknowledging that live financial capital is at stake, all code modifications, indicator gates, and execution logic must undergo mandatory verification and strictly preserve system stability and capital safety.
