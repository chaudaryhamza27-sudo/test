import Link from "next/link";
import { notFound } from "next/navigation";
import { IconChevronLeft } from "../../icons";
import { LEGAL_PAGES, LEGAL_UPDATED, getLegalSlugs } from "../data";

export function generateStaticParams() {
  return getLegalSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = LEGAL_PAGES[slug];
  return { title: page ? `${page.title} — Lucky73` : "Lucky73" };
}

export default async function LegalDetailPage({ params }) {
  const { slug } = await params;
  const page = LEGAL_PAGES[slug];
  if (!page) notFound();

  return (
    <div className="kk-page">
      <header className="kk-header">
        <Link href="/legal" className="kk-header-icon-btn">
          <IconChevronLeft />
        </Link>
        <span className="kk-header-title">{page.title}</span>
        <span className="kk-header-side" />
      </header>

      <div className="legal-content">
        <div className="legal-updated">Last updated: {LEGAL_UPDATED}</div>
        {page.blocks.map((block, i) => {
          if (block.type === "callout") {
            return (
              <div key={i} className={`alert alert-${block.tone}`}>
                <span>{block.text}</span>
              </div>
            );
          }
          if (block.type === "h") {
            return <h2 key={i}>{block.text}</h2>;
          }
          if (block.type === "ul") {
            return (
              <ul key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          }
          return <p key={i}>{block.text}</p>;
        })}
      </div>

      {/* <footer className="kk-footer">This account and its balance are placeholders for this UI preview. No real money is involved.</footer> */}
    </div>
  );
}
