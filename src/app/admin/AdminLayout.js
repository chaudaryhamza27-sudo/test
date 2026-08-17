"use client";

import { useState } from "react";
import {
  IconHome,
  IconUsers,
  IconWithdraw,
  IconWallet,
  IconTrophy,
  IconDeposit,
  IconHistory,
  IconTransaction,
  IconShield,
  IconLogout,
  IconHeadset,
  IconRefresh,
} from "../icons";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: IconHome },
  { key: "users", label: "User Control", icon: IconUsers },
  { key: "withdrawals", label: "Withdraws", icon: IconWithdraw },
  { key: "balance", label: "Balance Manager", icon: IconWallet },
  // { key: "cashouts", label: "CashOut", icon: IconTrophy },
  // { key: "deposits", label: "Deposits", icon: IconDeposit },
  // { key: "rounds", label: "Game Rounds", icon: IconHistory },
  // { key: "payments", label: "Payments", icon: IconTransaction },
  { key: "support", label: "Manual Payment", icon: IconHeadset },
  // { key: "audit", label: "Audit Log", icon: IconShield },
];

const PAGE_TITLES = Object.fromEntries(NAV_ITEMS.map((i) => [i.key, i.label]));

function HamburgerIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export default function AdminLayout({ active, onNavigate, onLogout, onRefreshTab, refreshingTab, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const go = (key) => {
    onNavigate(key);
    setDrawerOpen(false);
  };

  return (
    <div className="admin-root">
      <div className="admin-topbar">
        <button className="admin-hamburger" aria-label="Open menu" onClick={() => setDrawerOpen(true)}>
          <HamburgerIcon style={{ width: 18, height: 18 }} />
        </button>
        <span className="admin-topbar-title">{PAGE_TITLES[active] || "Admin"}</span>
      </div>

      <div className={`admin-sidebar-backdrop ${drawerOpen ? "open" : ""}`} onClick={() => setDrawerOpen(false)} />

      <div className="admin-layout">
        <aside className={`admin-sidebar ${drawerOpen ? "open" : ""}`}>
          <div className="admin-sidebar-header">
            <div className="admin-sidebar-mark">A</div>
            <div className="admin-sidebar-title">
              <b>Admin</b>
              <span>Control Dashboard</span>
            </div>
          </div>

          <nav className="admin-nav">
            {NAV_ITEMS.map((item) => (
              <div key={item.key} className="admin-nav-row">
                <button
                  type="button"
                  className={`admin-nav-item ${active === item.key ? "active" : ""}`}
                  onClick={() => go(item.key)}
                >
                  <item.icon />
                  {item.label}
                </button>
                {onRefreshTab && (
                  <button
                    type="button"
                    className="admin-nav-refresh"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRefreshTab(item.key);
                    }}
                    disabled={refreshingTab === item.key}
                    aria-label={`Refresh ${item.label}`}
                    title={`Refresh ${item.label}`}
                  >
                    <IconRefresh className={refreshingTab === item.key ? "spinning" : ""} />
                  </button>
                )}
              </div>
            ))}
          </nav>

          <div className="admin-sidebar-footer">
            <button type="button" className="admin-logout-btn" onClick={onLogout}>
              <IconLogout style={{ width: 15, height: 15 }} />
              Logout
            </button>
          </div>
        </aside>

        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
