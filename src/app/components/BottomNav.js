"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { IconPromotion, IconGift, IconWallet, IconAccount } from "../icons";

export default function BottomNav() {
  const pathname = usePathname();

  const isAgency = pathname === "/agency";
  const isActivity = pathname === "/activity";
  const isWallet =
    pathname === "/wallet" ||
    pathname.startsWith("/deposit") ||
    pathname.startsWith("/withdraw") ||
    pathname.startsWith("/transactions");
  const isProfile = pathname === "/profile";
  const isGame = pathname === "/crash";

  return (
    <nav className="bottom-nav">
      <Link href="/agency" className={`nav-link ${isAgency ? "active" : ""}`}>
        <IconPromotion />
        <span>Promotion</span>
      </Link>

      <Link href="/activity" className={`nav-link ${isActivity ? "active" : ""}`}>
        <IconGift />
        <span>Activity</span>
      </Link>

      <Link href="/" className={`center-btn ${isGame ? "active" : ""}`}>
        <Image src="/game/gameicon.png" alt="" width={28} height={28} />
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
