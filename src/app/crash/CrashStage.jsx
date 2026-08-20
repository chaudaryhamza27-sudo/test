'use client';

import { useEffect, useRef } from 'react';
import styles from './CrashStage.module.css';

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

export default function CrashStage({ phase, multiplier = 1, elapsed = 0, countdown = 0 }) {
  const canvasRef = useRef(null);
  const liveRef = useRef({ phase, multiplier, elapsed });
  const crashedAtRef = useRef(0);

  // the animation loop reads props through a ref so it never has to restart
  liveRef.current = { phase, multiplier, elapsed };

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
      const { phase: ph, multiplier: m, elapsed: t } = liveRef.current;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      ctx.clearRect(0, 0, w, h);
      drawAxes(w, h);
      stepProp(ph !== 'betting');

      if (ph === 'betting') {
        drawPlane(PAD + 46, h - PAD - 22, -0.05);   // parked, same sprite
        raf = requestAnimationFrame(frame);
        return;
      }

      /* The curve depends on the round alone. After the crash it is frozen and
         only the plane keeps moving — that is why the line stays put. */
      const usableW = w - PAD - 30;
      const usableH = h - PAD - 30;
      const cx = PAD + usableW * (1 - Math.exp(-t / 4.5));
      const cy = (h - PAD) - usableH * (1 - Math.exp(-(m - 1) / 3.2));

      ctx.beginPath();
      ctx.moveTo(PAD, h - PAD);
      ctx.quadraticCurveTo(PAD + (cx - PAD) * 0.72, h - PAD, cx, cy);
      ctx.lineTo(cx, h - PAD);
      ctx.closePath();
      ctx.fillStyle = 'rgba(104,1,14,0.75)';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(PAD, h - PAD);
      ctx.quadraticCurveTo(PAD + (cx - PAD) * 0.72, h - PAD, cx, cy);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#F00B3E';
      ctx.stroke();

      const gone = ph === 'crashed';
      const offset = gone
        ? Math.min(Date.now() - crashedAtRef.current, FLYOFF_MS) * 0.9
        : 0;
      const bob = gone ? 0 : Math.sin(t * 6) * 2.5;

      drawPlane(cx + PLANE_W * 0.3 + offset, cy - 14 + bob - offset * 0.38, -0.1);
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
