# Aviator Crash Game — How It Actually Works

**This is a simulation.** Every balance, bet and payout described below is a demo
credit stored in MongoDB. No payment processor, bank account or real currency is
involved anywhere in this system.

This document explains the real, complete implementation of the Aviator-style
crash game shipped in this repo: `src/lib/gameEngine.js`, the `src/app/api/game/*`
routes, and the `src/app/game/page.js` client.

---

## 1. Concept

Each round, a plane takes off and a multiplier climbs from `1.00x`. Players bet
demo credits before the round starts. While the multiplier is climbing, a player
can cash out to win `bet amount x multiplier`. At an unpredictable point the
round "crashes" — any player who hadn't cashed out yet loses their bet.

The server is the only source of truth for the round's state and outcome. The
client never decides what the multiplier is, whether a bet won, or when the
round crashes — it only polls and displays what the server reports.

---

## 2. Round lifecycle

A round moves through four phases, computed **purely from wall-clock time** —
there is no background timer/cron process running the game. This makes the
engine work correctly across serverless instances and survive a server
restart with no state loss (the round's identity lives in MongoDB, not in
memory).

```
WAITING  →  RUNNING  →  CRASHED  →  DONE  →  (next round created)
 6s          grows        4s        instant
```

| Phase     | Meaning                                                              |
|-----------|-----------------------------------------------------------------------|
| `WAITING` | Betting window. Multiplier is pinned at `1.00x`. Lasts `WAITING_MS` (6000ms). |
| `RUNNING` | The multiplier is climbing. Bets can be cashed out. Ends when elapsed time reaches the round's pre-determined crash point. |
| `CRASHED` | The plane has flown away. Result is shown for `RESULT_MS` (4000ms). No new bets or cashouts accepted. |
| `DONE`    | Result display window has elapsed. The very next request that touches the engine will create a new round and settle any un-cashed-out bets as losses. |

This is implemented in `getRoundPhase(round, now)` in `src/lib/gameEngine.js`,
which derives the phase from three fixed timestamps: `round.createdAt`,
`waitingEndsAt = createdAt + WAITING_MS`, and the crash instant computed from
the round's crash point (see §3).

### Advancing rounds without a background process

`getActiveRound()` is called at the top of every game API request. It:

1. Looks up the current round via a singleton pointer document
   (`GameEngineState { _id: "main", currentRoundId }`).
2. If that round's phase is `DONE`, it creates a brand new `GameRound` and
   attempts to swap the pointer with an **optimistic compare-and-swap**:
   `findOneAndUpdate({ _id: "main", currentRoundId: <old round id> }, { $set: { currentRoundId: <new round id> } })`.
3. Only one concurrent request can win that swap (the filter only matches if
   the pointer hasn't moved). The losing request(s) discard the round they
   speculatively created and re-read whichever round actually won.
4. The winner also calls `settleRound()`, which marks every bet still in
   `placed` status on the old round as `lost`.

This means the game keeps advancing correctly even with many simultaneous
players polling at once, and even if the whole app restarts mid-round — the
next request just picks up the phase math from `GameRound.createdAt`.

---

## 3. Provably-fair crash point

The crash point for a round is **decided before the round starts**, using a
commit–reveal scheme so it can't be predicted by players and can't be changed
by the server after the fact:

1. `generateServerSeed()` creates a random 32-byte hex seed.
2. `crashPointFromSeed(seed)` hashes it (`sha256`) and derives the crash
   point deterministically from the hash — a heavier tail (rare huge
   multipliers) and a small chance (~4%) of an instant `1.00x` crash, both
   modeled on the standard "Bustabit-style" crash formula, with a 4% built-in
   house edge and a hard cap at `2000x`.
3. The round is created with both the seed and `serverSeedHash = sha256(seed)`.
4. **`serverSeedHash` is shown to clients immediately** (`GET /api/game/state`
   always returns it), before anyone bets. This is the "commit."
5. The raw `serverSeed` (and therefore the crash point) is only included in
   the API response once the round reaches `CRASHED`/`DONE`. This is the
   "reveal" — anyone can now hash the revealed seed themselves and confirm it
   matches the hash that was published before the round ran, proving the
   server didn't change the outcome after seeing bets.

Crash point is stored as an integer in basis points where `100 == 1.00x`
(e.g. `250` means the round crashes at `2.50x`).

---

## 4. Multiplier curve

While `RUNNING`, the multiplier grows exponentially with elapsed seconds `t`:

```
multiplier(t) = e^(0.085 * t)
```

`getRoundPhase()` inverts this formula (`elapsedMsForMultiplier`) to find the
exact elapsed time at which the round's pre-determined crash point is
reached, and reports `CRASHED` from that instant onward. So the *shape* of
the curve is fixed and public, but *when* it stops is only known once the
seed is revealed.

---

## 5. Data model

| Collection | Purpose |
|---|---|
| `GameRound` | One document per round: `serverSeed`, `serverSeedHash`, `crashPoint`, `createdAt`. |
| `GameBet` | One document per (round, user) — enforced with a unique compound index so a user can only have one bet per round. Fields: `amount`, `status` (`placed` → `cashed_out` \| `lost`), `cashoutMultiplier`, `payout`. |
| `GameEngineState` | Singleton (`_id: "main"`) pointer to the currently active `GameRound`. |
| `Transaction` | Every bet/cashout also writes a `game_bet` / `game_win` transaction so it shows up in the unified `/transactions` history alongside deposits/withdrawals. |
| `Activity` | `game_bet_placed` / `game_cashout` entries for the user's own activity feed and the admin audit log. |

---

## 6. API surface

All routes live under `src/app/api/game/`.

### `GET /api/game/state`
Returns the current round's phase, live multiplier, the commit hash (and the
revealed seed/crash point once resolved), the caller's own bet on this round
(if any), and their balance. No auth required — spectators can watch without
logging in. Polled by the client every 250ms.

### `POST /api/game/bet`  `{ amount }`
- Requires auth and phase `WAITING`.
- Rejects a second bet on the same round (`409`).
- Debits the bet amount **atomically** via `adjustBalance()` (a balance-guarded
  `$inc`, not a read-then-write), so two concurrent bet requests can't both
  succeed against insufficient funds.
- Records a `game_bet` transaction and an activity log entry.

### `POST /api/game/cashout`
- Requires auth and phase `RUNNING`.
- **Atomically claims** the bet with
  `findOneAndUpdate({ round, user, status: "placed" }, { $set: { status: "cashed_out", ... } })`
  — only one request can win this update per bet, which is what prevents a
  double-submit (or a race between two tabs) from paying out twice.
- The payout multiplier is **always the server's own `getRoundPhase()`
  computation at the moment of the request** — a client can never send its own
  multiplier and get paid on it.
- Credits `amount * multiplier` back to the balance and logs a `game_win`
  transaction.

### `GET /api/game/history`
Last 20 rounds that have finished (`CRASHED`/`DONE`), for the round-history
strip in the UI.

### `GET /api/admin/game-rounds` (admin only)
Paginated round list with aggregated bet counts, total wagered, and total
paid out per round, for the admin "Game Rounds" tab.

---

## 7. What "server-authoritative" actually guards against

- **A client can't fabricate a win.** Cashout multiplier is recomputed
  server-side from `Date.now()` and the round's stored crash point — nothing
  from the request body is trusted.
- **A client can't bet after the crash.** `getRoundPhase()` is re-derived on
  every request; a bet arriving even a few ms into `RUNNING` is rejected.
- **Double-submits and duplicate tabs can't double-spend or double-pay.**
  The unique `{round, user}` index blocks a second bet; the
  `findOneAndUpdate({status:"placed"} → {status:"cashed_out"})` claim blocks a
  second cashout.
- **A server restart doesn't corrupt state.** Phase is a pure function of
  timestamps stored in MongoDB, not in-process memory.
