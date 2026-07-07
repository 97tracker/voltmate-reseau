import type { Metadata } from "next";
import { Space_Grotesk, Orbitron } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import Navbar from "@/components/Navbar";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VoltMate : Recharge smarter. Drive calmer.",
  description:
    "L'assistant communautaire des conducteurs de voitures électriques. Signalez, consultez et trouvez une borne de recharge fiable.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${spaceGrotesk.variable} ${orbitron.variable}`}>
      <body>
        <AuthProvider>
          <Navbar />
          <main className="mx-auto min-h-[calc(100vh-56px)] max-w-3xl px-4 pb-24 pt-4">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
