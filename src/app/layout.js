import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SoundProvider } from "./components/SoundProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Lucky73 — UI Showcase",
  description: "A professional educational simulation built with Next.js using virtual funds.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SoundProvider>{children}</SoundProvider>
      </body>
    </html>
  );
}
