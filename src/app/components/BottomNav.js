"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconPromotion, IconActivity, IconGame, IconWallet, IconAccount } from "../icons";

export default function BottomNav() {
  const pathname = usePathname();

  const isAgency = pathname === "/agency";
  const isActivity = pathname === "/activity";
  const isWallet = pathname === "/wallet";
  const isProfile = pathname === "/profile";

  return (
    <nav className="bottom-nav">
      <Link href="/agency" className={`nav-link ${isAgency ? "active" : ""}`}>
        <IconPromotion />
        <span>Promotion</span>
      </Link>

      <Link href="/activity" className={`nav-link ${isActivity ? "active" : ""}`}>
        <IconActivity />
        <span>Activity</span>
      </Link>

      <Link href="/" className="center-btn">
        <IconGame />
      </Link>

      <Link href="/wallet" className={`nav-link ${isWallet ? "active" : ""}`}>
        <IconWallet />
        <span>Wallet</span>
      </Link>

      <Link href="/profile" className={`nav-link ${isProfile ? "active" : ""}`}>
        <IconAccount />
        <span>Account</span>
      </Link>
    </nav>
  );
}
