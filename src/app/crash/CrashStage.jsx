'use client';

import { useEffect, useRef, useState } from 'react';
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

const JOIN_AVATARS = ['/avitor/icon1.webp', '/avitor/icon2.webp', '/avitor/icon4.webp'];

export default function CrashStage({ phase, multiplier = 1, elapsed = 0, countdown = 0, growthRate, crashPoint, animationsOn = true }) {
  const canvasRef = useRef(null);
  const liveRef = useRef({ phase, multiplier, elapsed, growthRate });
  const crashedAtRef = useRef(0);
  const animationsOnRef = useRef(animationsOn);
  // How many players "joined" this betting window — a new random target each
  // round, filled in step with the countdown so it reads 0 the instant a
  // fresh round opens and lands on the target right as betting closes.
  const [joinTarget, setJoinTarget] = useState(0);

  // the animation loop reads props through a ref so it never has to restart
  liveRef.current = { phase, multiplier, elapsed, growthRate };
  animationsOnRef.current = animationsOn;

  useEffect(() => {
    if (phase === 'crashed') crashedAtRef.current = Date.now();
  }, [phase]);

  useEffect(() => {
    if (phase === 'betting') setJoinTarget(900 + Math.floor(Math.random() * 500));
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

  // Counts up to the target while players are joining the betting window,
  // then back down to 0 over the course of the flight as they cash out —
  // landing on exactly 0 right as the plane crashes.
  let joinCount = joinTarget;
  if (phase === 'betting') {
    joinCount = joinTarget * countdown;
  } else if (phase === 'flying') {
    const flightDuration = crashPoint && growthRate ? Math.log(crashPoint) / growthRate : 5;
    joinCount = joinTarget * (1 - Math.min(1, elapsed / flightDuration));
  } else if (phase === 'crashed') {
    joinCount = 0;
  }

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

      <div className={styles.joinWidget}>
        <span className={styles.joinAvatars}>
          {JOIN_AVATARS.map((src) => (
            <img key={src} src={src} alt="" />
          ))}
        </span>
        <span className={styles.joinCount}>{Math.round(joinCount)}</span>
      </div>

      {waiting && (
        <div className={styles.waiting}>
          <div className={styles.brandBanner}>
            <div className={styles.brandRow}>
              <span className={styles.brandName}>Lucky73</span>
              <span className={styles.brandDivider} />
              <span className={styles.brandGame}>Crash</span>
            </div>
            <div className={styles.brandSub}>VERIFIED PLATFORM</div>
            <div className={styles.brandUnderline}>
              <i style={{ width: `${Math.round(countdown * 100)}%` }} />
            </div>
            <div className={styles.fairBadge}>
              <div className={styles.fairBrand}>Lucky73</div>
              <div className={styles.fairPill}>
                Official Game
                <span className={styles.fairCheck}>✓</span>
              </div>
              <div className={styles.fairSince}>Since 2024</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
