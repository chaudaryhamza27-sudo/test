"use client";

import { useEffect, useRef, useState } from "react";
import { IconAviatorPlane } from "../icons";

const VB_W = 800;
const VB_H = 260;
const PAD_L = 46;
const PAD_R = 14;
const PAD_T = 22;
const PAD_B = 28;
const SAMPLE_MIN_GAP_S = 0.06;

// Renders the live multiplier trajectory as a real, continuously-sampled SVG
// curve (axis included) rather than a static illustration. Samples are
// collected client-side from the same polled/pushed `multiplier` value
// already driving the rest of the page — nothing here is fabricated, it's
// just plotted instead of only being shown as a number. The plane is a
// fixed-size HTML element positioned at the curve's current end point via
// percentage coordinates, so it can never grow beyond its own CSS size and
// can never render outside the (overflow-hidden) chart container.
export default function GameChart({ phase, multiplier, roundId }) {
  const samplesRef = useRef([]); // [{ t, m }]
  const startRef = useRef(null);
  const [, bump] = useState(0);

  // New round -> clear the trail.
  useEffect(() => {
    samplesRef.current = [];
    startRef.current = null;
    bump((n) => n + 1);
  }, [roundId]);

  useEffect(() => {
    if (phase !== "RUNNING") return;
    if (startRef.current === null) startRef.current = Date.now();
    const t = (Date.now() - startRef.current) / 1000;
    const last = samplesRef.current[samplesRef.current.length - 1];
    if (!last || t - last.t >= SAMPLE_MIN_GAP_S) {
      samplesRef.current = [...samplesRef.current, { t, m: multiplier }].slice(-500);
      bump((n) => n + 1);
    }
  }, [phase, multiplier]);

  const samples = samplesRef.current;
  const elapsed = samples.length ? samples[samples.length - 1].t : 0;
  const maxM = Math.max(2, Math.ceil(multiplier * 1.25 * 5) / 5);
  const maxT = Math.max(10, Math.ceil((elapsed * 1.15) / 2) * 2);

  const xFor = (t) => PAD_L + (Math.min(t, maxT) / maxT) * (VB_W - PAD_L - PAD_R);
  const yFor = (m) => VB_H - PAD_B - ((Math.min(m, maxM) - 1) / (maxM - 1)) * (VB_H - PAD_T - PAD_B);

  const linePoints = samples.map((s) => `${xFor(s.t).toFixed(1)},${yFor(s.m).toFixed(1)}`).join(" ");
  const last = samples[samples.length - 1];
  const planeX = last ? xFor(last.t) : PAD_L;
  const planeY = last ? yFor(last.m) : VB_H - PAD_B;

  let angle = -18;
  if (samples.length >= 2) {
    const a = samples[Math.max(0, samples.length - 4)];
    const b = last;
    const dx = xFor(b.t) - xFor(a.t);
    const dy = yFor(b.m) - yFor(a.m);
    if (dx > 0.5) angle = Math.max(-65, Math.min(5, (Math.atan2(dy, dx) * 180) / Math.PI));
  }

  const yTicks = [0, 1, 2, 3, 4].map((i) => 1 + ((maxM - 1) * i) / 4);
  const xTicks = [0, 1, 2, 3, 4, 5].map((i) => (maxT * i) / 5);

  return (
    <div className="game-chart-wrap">
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none" className="game-chart-svg">
        <defs>
          <linearGradient id="gcLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#e9203a" stopOpacity=".45" />
            <stop offset="100%" stopColor="#ff5c72" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="gcFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e9203a" stopOpacity=".38" />
            <stop offset="100%" stopColor="#e9203a" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((v) => (
          <g key={v}>
            <line x1={PAD_L} x2={VB_W - PAD_R} y1={yFor(v)} y2={yFor(v)} className="game-chart-grid" />
            <text x={PAD_L - 8} y={yFor(v) + 4} className="game-chart-axis" textAnchor="end">
              {v.toFixed(1)}x
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={t} x={xFor(t)} y={VB_H - 8} className="game-chart-axis" textAnchor="middle">
            {Math.round(t)}s
          </text>
        ))}

        {samples.length > 1 && (
          <>
            <polygon
              points={`${xFor(0)},${VB_H - PAD_B} ${linePoints} ${planeX.toFixed(1)},${(VB_H - PAD_B).toFixed(1)}`}
              fill="url(#gcFill)"
            />
            <polyline points={linePoints} fill="none" stroke="url(#gcLine)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
      </svg>

      {(phase === "RUNNING" || phase === "CRASHED" || phase === "DONE") && samples.length > 0 && (
        <div
          className={`game-chart-plane ${phase === "CRASHED" || phase === "DONE" ? "crashed" : ""}`}
          style={{ left: `${(planeX / VB_W) * 100}%`, top: `${(planeY / VB_H) * 100}%`, transform: `translate(-50%,-50%) rotate(${angle}deg)` }}
        >
          {/* Drop your own plane artwork at public/game/plane.png — this path
              picks it up automatically. Falls back to the built-in SVG icon
              if the file isn't there yet, so the page never shows a broken image. */}
          <img
            src="/game/plane.png"
            alt=""
            
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling.style.display = "block";
            }}
          />
          <IconAviatorPlane style={{ display: "none" }} />
          <span className="game-chart-plane-trail" />
        </div>
      )}
    </div>
  );
}
