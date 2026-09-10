/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allows a separate local-only study server to run without sharing the
  // regular development server's build directory. Default behavior is kept.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // The default dev-mode route indicator renders at the true browser corner,
  // ignoring the app's centered mobile-card layout — looks like a stray
  // floating button outside the card. Dev-only either way (never in a
  // production build), so just turn it off for a clean local preview.
  devIndicators: false,
};

export default nextConfig;
