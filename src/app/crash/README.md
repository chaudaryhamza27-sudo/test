# Crash stage — Next.js port

Port of the single-file HTML demo into your `gaming-ui-demo` App Router project.

## Where the files go

```
public/plane-body.png                        sprite: fuselage + static spinner
public/plane-blades.png                      sprite: the two blades only
src/components/crash/CrashStage.jsx          canvas stage (client component)
src/components/crash/CrashStage.module.css
src/components/crash/BetPanel.jsx            stake + bet/cancel/cash out
src/components/crash/BetPanel.module.css
src/hooks/useCrashRound.js                   round state: SSE, or local demo
src/app/game/demo/page.js                    harness — run it to see the UI
```

Both components are `'use client'` — they use canvas, `requestAnimationFrame`
and `ResizeObserver`. Everything above them can stay a server component.

Visit `/game/demo` after copying the files in. Nothing else needs to be running.

## Keeping it server-authoritative

`CrashStage` and `BetPanel` decide nothing about the round or the money. The
stage draws the `phase`, `multiplier` and `elapsed` it is handed; the panel
reports intent through `onBet`, `onCancel` and `onCashOut`. The crash point,
the payout and the multiplier at cash-out stay in `src/lib/gameEngine.js`.

`useCrashRound` has two sources:

- `source: 'server'` (default) — subscribes to `/api/game/stream` and expects:

  ```js
  { phase: 'betting', roundId, betsCloseAt }   // ms epoch
  { phase: 'flying',  roundId, startedAt }     // ms epoch
  { phase: 'crashed', roundId, crashPoint }
  ```

  Between messages the multiplier is interpolated locally so the number moves
  smoothly instead of stepping at the tick rate. That interpolation is cosmetic
  and is overwritten by every message — it must never be what a payout is
  computed from.

- `source: 'demo'` — a local loop that picks its own crash point so the UI can
  be developed with no backend. **Local UI work only.** A client that decides
  the crash point can be read by anyone with devtools open.

Keep `GROWTH` in `useCrashRound.js` equal to the engine's curve constant, or
the drawn line will drift from the server's multiplier.

## Wiring the demo page to the real thing

Three changes in `src/app/game/demo/page.js`:

1. `useCrashRound({ source: 'server' })`
2. `placeBet` / `cancelBet` / `cashOut` → POST to your existing bet routes and
   use the response, rather than adjusting local state
3. `balance` → your wallet, not `useState`

Auto cash-out currently fires in the browser. That is fine as a convenience,
but the server should also hold the target and settle it, otherwise a closed
tab loses the bet.

## Tunable constants

In `CrashStage.jsx`:

| Constant | Does |
| --- | --- |
| `PLANE_W` | rendered plane width, px |
| `PROP_RPS` | propeller revolutions per second |
| `PROP_DIR` | `-1` anticlockwise, `1` clockwise |
| `PROP_GHOST` | trailing blur opacity, `0` turns it off |
| `FLYOFF_MS` | how long the plane keeps going after the crash |

The blades are drawn behind the body so a horizontal blade passes behind the
fuselage, and the angle advances by elapsed time only while the round is live —
a parked plane holds its blades still instead of resetting them.

The sprites came out of a screenshot, so they soften above roughly 104px wide.
Replacing them with the original artwork is a drop-in swap.
