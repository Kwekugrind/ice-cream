# OMNISIGHT FLEET TRADE RULES COMPENDIUM
### Version 9.0 -- October 2026 Calibrated Empirical Fleet Matrix & Indicator Reversal Specification

---

## 1. FLEET ROSTER & CALIBRATED STRATEGY MATRIX

All active trading bots operate on cTrader Open API execution, protected by a **-$4.00 Software Stop Loss** (-$2.50 on `R_75` and `R_10`; -$5.00 Hard Broker SL limit). Trades are categorized into **Target Assets with Breakeven Shields** and **High-Trend Dynamic Runners with Indicator Reversal Exits**.

| Bot Label | PM2 Name | Server | Directory Path | Symbol | Symbol ID | Lot Size | Stake | Strategy Engine | Target / Exit Engine | Max Hard SL |
|---|---|---|---|---|---|---|---|---|---|---|
| **Milk Machine** | `milk-v100` | S1 | `~/trading-bots/milk` | Volatility 100 | `R_100` | 1.00 Lot | $5.00 | M5 Stoch 200 (48/52) Trend + M5 Stoch (15,2,5) 50 Initial & 20/80 Re-Entry + EMA 100 Baseline | Dynamic Runner (Stoch 15,2,5 %K/%D Cross & Midline 48/52 Exit, $2.00 Breathing Room, $20 Cap) | -$5.00 ($4.00 soft) |
| **Coffee (V75)** | `lery-v75` | S1 | `~/trading-bots/Lery-s-Alerts` | Volatility 75 | `R_75` | 0.01 Lots | $5.00 | M5 EMA 100/200 2-Step Initial (50/50 Fresh Cross) & EMA 100 Touch Retracement (20/80) | Dynamic Runner (Fast Stoch 9,2,3 Cross Exit, $2.00 Breathing Room) | -$5.00 ($2.50 soft) |
| **Ice Cream** | `ice-cream-100-1s` | S2 | `~/trading-bots/ice-cream` | Volatility 25 (1s) | `1HZ25V` | 0.005 Lots | $5.00 | **MACD (25,75,1) + Stoch 200 Confluence Engine** + EMA 100 Baseline + Aux Stoch 15 Re-Entry | Target $2.50 + Breakeven Shield at $1.00 (+0.20 floor) + Fast Stoch(9,2,3) Exit | -$5.00 ($4.00 soft) |
| **Cocoa Machine** | `coffee-v75-1s` | S1 | `~/trading-bots/coffee` | Volatility 75 (1s) | `1HZ75V` | 0.05 Lots | $5.00 | Sequential Stoch 200 -> MACD (25,75,1) + EMA 100 Baseline + Stoch (15,2,5) Re-Entry (20/80) | Target $1.80 + Breakeven Shield at $1.00 (+0.20 floor) | -$5.00 ($4.00 soft) |
| **Juice (V10)** | `test-v10` | S2 | `~/trading-bots/Test-Bot` | Volatility 10 | `R_10` | 0.50 Lots | $5.00 | M5 Stoch 200 + MACD (25,75,1) + EMA 100 Baseline Any-Order Confluence + Stoch (5,3,3) Re-Entry | Dynamic Runner (Stoch 15,2,5 Cross & Midline Exit, $2.00 Breathing Room) | -$5.00 ($2.50 soft) |
| **Tea Machine** | `tea-v25` | S1 | `~/trading-bots/tea` | Volatility 25 | `R_25` | 0.50 Lots | $5.00 | M5 Stoch 200 (48/52) Trend + M5 Stoch (15,2,5) 50 Initial & 20/80 Re-Entry + EMA 100 Baseline | Target $1.80 + Breakeven Shield at $1.00 (+0.20 floor) | -$5.00 ($4.00 soft) |
| **OmniSight** | `omni-v50` | S2 | `~/trading-bots/OmniSight` | Volatility 50 | `R_50` | 4.00 Lots | $5.00 | M5 Stoch 200 (48/52) Trend + M5 Stoch (15,2,5) 50 Initial & 20/80 Re-Entry + EMA 100 Baseline | Dynamic Runner (M5 Stoch 15 Midline Reversal Exit, Runners to $8.21+, $1.50 BE Shield) | -$5.00 ($4.00 soft) |

---

## 2. DUAL-ASSET MANAGEMENT ARCHITECTURE

Based on empirical testing across 1,000 live M5 candles from Deriv Gateway, fleet instruments are managed under two distinct architectures:

### Category 1: Fixed Target Assets with Breakeven Shield (`R_25`, `1HZ75V`, `1HZ25V`)
* **Characteristics:** High entry precision (91% to 96% of trades immediately enter profit), but choppy/mean-reverting intraday swings that retrace before extended runner targets.
* **Target Profit Cap:**
  * `R_25` (Tea): **$1.80 Take Profit**
  * `1HZ75V` (Cocoa): **$1.80 Take Profit**
  * `1HZ25V` (Ice Cream): **$2.50 Take Profit**
* **Breakeven Shield at $1.00 Peak:**
  * The instant floating profit touches `+$1.00`, a **+$0.20 net profit floor** is locked.
  * Leaves up to **$1.60 of breathing room** for wicks while guaranteeing the trade **NEVER reverses into a -$4.00 loss**.
* **Empirical Validation:** Flipped Cocoa from -$12.48 to **+$7.10 (83.3% Win Rate)** and Tea from -$2.33 to **+$2.84 (75% Win Rate)**.

### Category 2: High-Trend Dynamic Runners with Closed-M5 Indicator Reversal (`R_100`, `R_75`, `R_10`, `R_50`)
* **Characteristics:** Wide, sustained momentum expansion waves that can easily run to $5.00, $10.00, or $15.00+.
* **Full Intrabar Breathing Room:**
  * **NO dollar floor is clamped under $2.00!** Normal M5 wicks (which swing $0.50 to $1.00) are allowed to fluctuate freely without premature liquidation.
* **Closed-M5 Stochastic Reversal Exit:**
  * Activates when in profit (`pnl >= $0.35`).
  * **BUY:** Exits when closed M5 Stoch %K hooks down below %D in Overbought (>75), OR breaks below Midline 48.0.
  * **SELL:** Exits when closed M5 Stoch %K hooks up above %D in Oversold (<25), OR breaks above Midline 52.0.
* **Tiered Dynamic Ratchet (Bank Bags on Runaway Moves):**
  * Peak $ge +$2.00$: Locks **+$1.00** base floor.
  * Peak $ge +$3.00$: Locks **+$1.80** floor.
  * Peak $ge +$5.00$: Locks **+$3.50** floor.
  * Peak $ge +$8.00$: Locks **+$6.00** floor (75% locked).
  * Peak $ge +$12.00$: Locks **80% of peak profit**.
  * Super Runner Ceiling: **+$20.00** hard cap.
* **Empirical Validation:** Surged Milk (`R_100`) from -$9.38 to **+$16.80** (Average win jumped from $0.50 to **$6.60**, max win **$14.92**).

---

## 3. UNIFIED RISK MANAGEMENT & SAFETY BOUNDS

* **Software Stop Loss:** -$4.00 on `R_100`, `R_25`, `R_50`, `1HZ75V`, `1HZ25V`; -$2.50 on `R_75` and `R_10`.
* **Hard Broker Stop Loss:** -$5.00 placed on cTrader at execution.
* **Early Loss Invalidations:** When in floating loss (`pnl < 0`), trades exit immediately upon:
  1. Opposite M5 Fractal break.
  2. Adverse Entry-Hour H1 candle close.
  3. Opposite Stoch 200 crossover on closed M5.
