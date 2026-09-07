import Link from "next/link";
import { IconChevronLeft, IconChevronRight, IconDocument, IconShield } from "../icons";
import { LEGAL_PAGES } from "./data";

const ICONS = { document: IconDocument, shield: IconShield };

export const metadata = { title: "Legal & Support — Lucky73" };

export default function LegalIndexPage() {
  return (
    <div className="kk-page">
      <header className="kk-header">
        <Link href="/profile" className="kk-header-icon-btn">
          <IconChevronLeft />
        </Link>
        <span className="kk-header-title">Legal & Support</span>
        <span className="kk-header-side" />
      </header>

      <p className="legal-index-note">
        Lucky73 is an educational app using virtual funds only — no real money is involved. These pages explain how the platform works and how your account data is handled.
      </p>

      <div className="kk-list">
        {Object.entries(LEGAL_PAGES).map(([slug, page]) => {
          const Icon = ICONS[page.icon] || IconDocument;
          return (
            <Link key={slug} href={`/legal/${slug}`} className="kk-list-item">
              <span className="kk-list-item-icon">
                <Icon />
              </span>
              <span className="label">{page.title}</span>
              <span className="chev">
                <IconChevronRight />
              </span>
            </Link>
          );
        })}
      </div>

      {/* <footer className="kk-footer">This account and its balance are placeholders for this UI preview. No real money is involved.</footer> */}
    </div>
  );
}
