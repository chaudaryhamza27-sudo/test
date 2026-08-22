"use client";

import { useState } from "react";
import Link from "next/link";
import { IconChevronLeft } from "../../icons";
import BottomNav from "../../components/BottomNav";
import { categories } from "../../data";

// Demo rebate schedule — not a real commission plan. Each agency "level"
// (L0-L6) gets a slightly higher base rate, and each tier below the
// subordinate (1st-6th level down) earns a fraction of the tier above it.
function buildTiers(level) {
  const base = 0.003 + level * 0.00033;
  const rows = [];
  let pct = base;
  for (let tier = 1; tier <= 6; tier++) {
    rows.push({ tier, pct });
    pct *= 0.35;
  }
  return rows;
}

function formatPct(v) {
  return `${parseFloat((v * 100).toFixed(6))}%`;
}

const LEVELS = [0, 1, 2, 3, 4, 5, 6];

export default function RebateRatioPage() {
  const [cat, setCat] = useState(categories[0].key);

  return (
    <div className="kk-page">
      <header className="kk-header">
        <Link href="/agency" className="kk-header-icon-btn">
          <IconChevronLeft />
        </Link>
        <span className="kk-header-title">Rebate Ratio</span>
        <span className="kk-header-side" />
      </header>

      <main>
        <div className="rebate-tabs">
          {categories.map((c) => (
            <button key={c.key} className={`rebate-tab ${cat === c.key ? "active" : ""}`} onClick={() => setCat(c.key)}>
              {c.label}
            </button>
          ))}
        </div>

        {LEVELS.map((level) => (
          <div className="card rebate-card" key={level}>
            <div className="rebate-card-title">
              Rebate level <b>L{level}</b>
            </div>
            {buildTiers(level).map((row) => (
              <div className="rebate-row" key={row.tier}>
                <span className="dot" />
                <span className="lbl">
                  {row.tier} level lower level commission rebate
                </span>
                <span className="val">{formatPct(row.pct)}</span>
              </div>
            ))}
          </div>
        ))}

        <div className="agency-note">This is a sample rebate schedule for interface purposes only — no real commission is paid.</div>
      </main>

      <BottomNav />
    </div>
  );
}
