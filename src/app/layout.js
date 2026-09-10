import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SoundProvider } from "./components/SoundProvider";
import FloatingWhatsApp from "./components/FloatingWhatsApp";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "Lucky73 | Virtual Gaming Experience",
    template: "%s | Lucky73",
  },
  description:
    "Explore Lucky73, a modern virtual gaming experience with interactive games, secure account tools, and dedicated support.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SoundProvider>{children}</SoundProvider>
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
