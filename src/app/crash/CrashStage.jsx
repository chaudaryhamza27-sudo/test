'use client';

import { useEffect, useRef } from 'react';
import styles from './CrashStage.module.css';
import { multiplierAt } from './useCrashRound';

/*
 * CrashStage — the flight area only. It renders whatever round state it is
 * given and decides nothing about the round itself: no crash point, no
 * multiplier maths, no timers that the payout depends on. That stays on the
 * server (src/lib/gameEngine.js), which is what keeps the game
 * server-authoritative.
 *
 * Props
 *   phase       'betting' | 'flying' | 'crashed'
 *   multiplier  current multiplier from the server (1 while betting)
 *   elapsed     seconds since take-off, frozen at the crash value
 *   countdown   0..1 progress through the betting window
 *   animationsOn  false freezes the canvas on its current frame (the round
 *                 clock/multiplier keep running elsewhere on the page — this
 *                 only pauses the plane/graph drawing, e.g. for low-end devices)
 */

const PAD = 30;              // graph inset, px
const SPR_W = 150;           // sprite sheet size, in sprite pixels
const SPR_H = 71;
const BLADE_X = 131;         // where the blades sheet sits on the sheet
const BLADE_HUB_X = 11;      // propeller axis inside the blades sheet
const HUB_Y = 40;            // propeller axis height
const PLANE_W = 104;         // rendered plane width, px
const PROP_RPS = 1.2;        // propeller revolutions per second
const PROP_DIR = -1;         // -1 anticlockwise, 1 clockwise
const PROP_GHOST = 0.15;     // trailing blur opacity, 0 = off
const PROP_TRAIL = 0.5;      // how far the blur trails, radians
const FLYOFF_MS = 1200;      // how long the plane keeps going after the crash

export default function CrashStage({ phase, multiplier = 1, elapsed = 0, countdown = 0, growthRate, animationsOn = true }) {
  const canvasRef = useRef(null);
  const liveRef = useRef({ phase, multiplier, elapsed, growthRate });
  const crashedAtRef = useRef(0);
  const animationsOnRef = useRef(animationsOn);

  // the animation loop reads props through a ref so it never has to restart
  liveRef.current = { phase, multiplier, elapsed, growthRate };
  animationsOnRef.current = animationsOn;

  useEffect(() => {
    if (phase === 'crashed') crashedAtRef.current = Date.now();
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const body = new Image();
    const blades = new Image();
    body.src = '/plane-body.png';
    blades.src = '/plane-blades.png';

    let raf = 0;
    let dotShift = 0;
    let propAngle = 0;
    let propLast = Date.now();

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const drawAxes = (w, h) => {
      ctx.strokeStyle = '#423033';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD, 6);
      ctx.lineTo(PAD, h - PAD);
      ctx.lineTo(w - 4, h - PAD);
      ctx.stroke();

      ctx.fillStyle = '#fff';
      for (let x = PAD + 4 - (dotShift % 40); x < w; x += 40) {
        if (x < PAD) continue;
        ctx.beginPath(); ctx.arc(x, h - PAD + 10, 1.8, 0, 6.283); ctx.fill();
      }
      ctx.fillStyle = '#1197D6';
      for (let y = h - PAD - 4 + (dotShift % 40); y > 0; y -= 40) {
        ctx.beginPath(); ctx.arc(PAD - 10, y, 1.8, 0, 6.283); ctx.fill();
      }
      dotShift += 0.7;
    };

    /* Blades turn a full 360 around the hub and are drawn behind the body, so
       a horizontal blade passes behind the fuselage. The angle advances by
       real elapsed time, and only while the round is live — a parked plane
       holds its blades still rather than resetting them. */
    const stepProp = (running) => {
      const now = Date.now();
      const dt = Math.min((now - propLast) / 1000, 0.1);   // clamp after a tab switch
      propLast = now;
      if (running) propAngle += PROP_DIR * dt * PROP_RPS * 2 * Math.PI;
    };

    const drawPlane = (x, y, tilt) => {
      if (!body.complete || !body.naturalWidth) return;
      const w = Math.min(PLANE_W, canvas.clientWidth * 0.26);
      const s = w / SPR_W;
      const h = SPR_H * s;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(tilt);

      if (blades.complete && blades.naturalWidth) {
        const bw = blades.width * s;
        const bh = blades.height * s;
        const ox = -BLADE_HUB_X * s;
        const oy = -HUB_Y * s;

        ctx.save();
        ctx.translate(-w / 2 + (BLADE_X + BLADE_HUB_X) * s, -h / 2 + HUB_Y * s);
        if (PROP_GHOST > 0) {
          ctx.rotate(propAngle - PROP_DIR * PROP_TRAIL);
          ctx.globalAlpha = PROP_GHOST;
          ctx.drawImage(blades, ox, oy, bw, bh);
          ctx.globalAlpha = 1;
          ctx.rotate(PROP_DIR * PROP_TRAIL);
        } else {
          ctx.rotate(propAngle);
        }
        ctx.drawImage(blades, ox, oy, bw, bh);
        ctx.restore();
      }

      ctx.drawImage(body, -w / 2, -h / 2, w, h);
      ctx.restore();
    };

    const frame = () => {
      if (!animationsOnRef.current) {
        raf = requestAnimationFrame(frame);
        return;
      }

      const { phase: ph, multiplier: m, elapsed: t, growthRate: gr } = liveRef.current;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      ctx.clearRect(0, 0, w, h);
      if (ph !== 'betting') drawAxes(w, h);   // grid only while a round is actually running
      stepProp(ph !== 'betting');

      if (ph === 'betting') {
        drawPlane(PAD + 46, h - PAD - 22, -0.05);   // parked, same sprite
        raf = requestAnimationFrame(frame);
        return;
      }

      /* The curve depends on the round alone. After the crash it is frozen and
         only the plane keeps moving — that is why the line stays put.

         cx/cy are a plain hyperbolic ease — s/(s+C) — not the exponential
         1-e^(-s/K) used before. An exponential is essentially "arrived" a
         few K after it starts (e^-4 is already background noise), so a long
         round pinned the tip against the right edge for the entire back
         half of the flight while the multiplier kept visibly climbing on
         the y-axis — the line looked stuck/dead on one side. s/(s+C) has
         the same slope at s=0 (so early pace is untouched — same speed as
         launch, deliberately not touched again) but only decays like 1/s^2,
         so the tip is still visibly creeping at s=90s the way it was fixed
         solid before. It still asymptotes (has to — the box is finite) but
         far more gradually, and it never plateaus outright.

         The plane is drawn at that *exact* (cx, cy) — no separate offset or
         edge clamp for its own position. Two independently-adjusted copies
         of "where the tip is" is what let the plane and the line drift out
         of sync near the edges before; one shared coordinate can't drift
         from itself. Clipping at the box edge is instead prevented by
         baking the sprite's own half-size (+ a corner-radius margin, since
         the stage's overflow:hidden border is rounded) into usableW/usableH
         up front, so cx/cy themselves never approach the true edge closely
         enough for the sprite to reach it.

         xAt/yAt are pure functions of "seconds since launch" alone — no
         dependence on the current live t or m — so a trail point drawn for
         s=3s looks identical whether the round is now at s=4s or s=40s;
         only the tip (at the live t) moves. That matters because the curve
         used to be a single quadraticCurveTo redrawn every frame with a
         control point scaled off the *current* cx, so the already-drawn
         part of the line subtly reshaped itself every frame — it read as
         fake/unstable instead of a fixed history extending at the tip.

         Reconstructing each past sample's multiplier uses multiplierAt from
         useCrashRound rather than a locally-hardcoded growth rate — those
         two used to disagree (0.085 here vs the 0.09 the round hook's own
         cosmetic interpolation actually runs on), so the reconstructed trail
         drifted further from the live (cx, cy) endpoint the longer the round
         ran, showing up as a kink or a visible seam near the tip. Importing
         the same function both places use means they can't drift apart. */
      const spriteW = Math.min(PLANE_W, w * 0.26);
      const spriteH = SPR_H * (spriteW / SPR_W);
      const edge = 14; // clears the stage's 16px corner radius
      // Plane's own half-height is spriteH/2 (~24-25px); lifting it by a fixed
      // 28px — more than that half-height — left its belly a few px above the
      // line's tip at every zoom level, a visible gap between the trail and
      // the plane sitting on it. Deriving LIFT from spriteH instead keeps the
      // belly settled just past the tip (slight overlap, not a gap) at any
      // screen size, and it scales with the sprite instead of drifting from
      // it the way an unrelated constant would.
      const LIFT = spriteH * 0.45;
      const NOSE_AHEAD = spriteW * 0.25; // sprite is centred, so without this the
      // tip lands in the middle of the plane instead of at its tail — this is a
      // fixed offset off the same cx (not a separate/clamped coordinate), so the
      // plane's tail always sits right where the trail ends and its nose points
      // on ahead of it, the way a plane riding the tip of its own trail should.
      const usableW = w - PAD - (spriteW / 2 + NOSE_AHEAD + edge);
      const usableH = h - PAD - (spriteH / 2 + edge);

      const xAt = (s) => PAD + usableW * (s / (s + 4));
      const yAt = (mv) => (h - PAD) - usableH * ((mv - 1) / (mv - 1 + 2.6));

      const cx = xAt(t);
      const cy = yAt(m);
      const STEP = 0.15; // seconds between path samples
      const tracePath = () => {
        ctx.moveTo(PAD, h - PAD);
        for (let s = STEP; s < t; s += STEP) {
          ctx.lineTo(xAt(s), yAt(multiplierAt(s, gr)));
        }
        ctx.lineTo(cx, cy);
      };

      ctx.beginPath();
      tracePath();
      ctx.lineTo(cx, h - PAD);
      ctx.closePath();
      ctx.fillStyle = 'rgba(104,1,14,0.75)';
      ctx.fill();

      ctx.beginPath();
      tracePath();
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#F00B3E';
      ctx.stroke();

      const gone = ph === 'crashed';
      if (!gone) {
        // NOSE_AHEAD/LIFT are fixed pixel offsets from the tip, but right at
        // launch the trail itself is only a few pixels long — the full
        // offset would plant the plane visibly ahead of its own still-tiny
        // line, looking disconnected until the trail grew long enough to
        // catch up. Easing the offset in over the first ~0.6s keeps the
        // plane pinned to the tip at t=0 and lets it ease forward to its
        // normal riding position as the trail actually grows.
        const ramp = Math.min(1, t / 0.6);
        const bob = Math.sin(t * 6) * 2.5;
        drawPlane(cx + NOSE_AHEAD * ramp, cy - LIFT * ramp + bob, -0.1);
      } else {
        // Post-crash only: the plane keeps sailing off past the edge on
        // purpose — this is the one place it's meant to leave the box.
        const offset = Math.min(Date.now() - crashedAtRef.current, FLYOFF_MS) * 0.9;
        drawPlane(cx + NOSE_AHEAD + offset, cy - LIFT - offset * 0.38, -0.1);
      }
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  const waiting = phase === 'betting';

  return (
    <div className={styles.stage}>
      {/* Ray backdrop: a square ~2.5x the board whose CENTRE sits on the graph
          origin, so the rays fan out from the same point the curve starts at.
          Turns only while the plane is in the air. */}
      <div className={`${styles.rays} ${waiting ? '' : styles.raysOn}`} />

      <canvas ref={canvasRef} className={styles.canvas} />

      {phase === 'crashed' && <div className={styles.flew}>FLEW AWAY!</div>}

      {!waiting && (
        <div className={`${styles.mult} ${phase === 'crashed' ? styles.crashed : ''}`}>
          {multiplier.toFixed(2)}x
        </div>
      )}

      {waiting && (
        <div className={styles.waiting}>
          {/* Same propeller mark as the live build. Held still between rounds;
              it starts turning when the round starts. */}
          <svg className={styles.spinner} viewBox="0 0 120 120" aria-hidden="true">
            <g fill="#E50539" fillRule="nonzero">
              <path d="M67.785 67.77a10.882 10.882 0 0 0 2.995-5.502l18.37-6.36c.47-.163.876-.471 1.16-.88l29.263-42.18a2.343 2.343 0 0 0-.268-2.993L110.153.704a2.344 2.344 0 0 0-3.314 0L95.73 11.813C71.965-5.861 38.683-3.514 17.58 17.588a60.26 60.26 0 0 0-8.829 11.21 2.343 2.343 0 0 0 4.001 2.441 55.575 55.575 0 0 1 8.142-10.336C40.184 1.613 70.512-.68 92.378 15.165l-5.72 5.72c-8.742-5.967-19.302-8.837-29.947-8.1a47.31 47.31 0 0 0-30.183 13.751 47.722 47.722 0 0 0-5.92 7.207 2.344 2.344 0 0 0 3.897 2.605 42.996 42.996 0 0 1 5.337-6.497c14.233-14.234 36.774-16.445 53.436-5.586l-6.818 6.818a33.418 33.418 0 0 0-19.773-4.186A33.338 33.338 0 0 0 36.47 36.48a2.344 2.344 0 0 0 3.314 3.314c8.787-8.786 22.336-10.795 33.215-5.248L58.38 49.163a10.969 10.969 0 0 0-6.164 3.084 10.882 10.882 0 0 0-2.996 5.504l-18.37 6.36c-.47.163-.876.47-1.159.879L.427 107.17a2.343 2.343 0 0 0 .268 2.992l9.152 9.151a2.337 2.337 0 0 0 1.657.687c.6 0 1.2-.23 1.657-.687l11.109-11.109A59.835 59.835 0 0 0 59.99 120a59.873 59.873 0 0 0 42.43-17.571 60.476 60.476 0 0 0 7.162-8.63 2.343 2.343 0 1 0-3.87-2.643 55.793 55.793 0 0 1-6.606 7.959c-19.321 19.32-49.61 21.598-71.487 5.74l5.722-5.723a47.325 47.325 0 0 0 30.058 8.092A47.318 47.318 0 0 0 93.472 93.48a47.82 47.82 0 0 0 5.15-6.09 2.343 2.343 0 0 0-3.82-2.715 43.106 43.106 0 0 1-4.644 5.49c-14.21 14.211-36.783 16.436-53.436 5.587l6.82-6.82a33.416 33.416 0 0 0 19.825 4.182A33.343 33.343 0 0 0 83.53 83.54a2.344 2.344 0 0 0-3.314-3.315c-8.777 8.778-22.34 10.792-33.215 5.25L61.62 70.855a10.97 10.97 0 0 0 6.165-3.084zm40.711-62.095l6.11 6.11-27.712 39.944-16.207 5.61a10.892 10.892 0 0 0-2.903-5.092 10.953 10.953 0 0 0-3.512-2.348l44.224-44.224zM11.504 114.342l-6.11-6.11 27.712-39.944 16.207-5.61a10.892 10.892 0 0 0 2.903 5.092 10.953 10.953 0 0 0 3.512 2.348l-44.224 44.224zm44.018-49.894a6.223 6.223 0 0 1-1.85-4.44l.003-.094c.036-.19.047-.383.035-.579a6.22 6.22 0 0 1 1.812-3.766A6.33 6.33 0 0 1 60 53.726a6.33 6.33 0 0 1 4.478 1.843 6.223 6.223 0 0 1 1.85 4.44l-.003.094a2.325 2.325 0 0 0-.035.579 6.22 6.22 0 0 1-1.812 3.766c-2.47 2.458-6.487 2.457-8.956 0z" />
              <path d="M113.341 82.064a2.344 2.344 0 0 0-3.115 1.131l-.026.057a2.343 2.343 0 1 0 4.26 1.955l.013-.028a2.344 2.344 0 0 0-1.132-3.115zM7.65 35.765a2.343 2.343 0 0 0-3.072 1.241l-.021.05a2.338 2.338 0 0 0 2.165 3.228c.922 0 1.8-.55 2.173-1.454.5-1.19-.056-2.56-1.245-3.065z" />
            </g>
          </svg>
          <p>WAITING FOR NEXT ROUND</p>
          <div className={styles.bar}>
            <i style={{ width: `${Math.round(countdown * 100)}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
