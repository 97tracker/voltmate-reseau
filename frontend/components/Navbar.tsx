"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, MessageCircle, User, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";

const TABS = [
  { href: "/", label: "Accueil", Icon: Home },
  { href: "/map", label: "Carte", Icon: Map },
  { href: "/assistant", label: "Assistant", Icon: MessageCircle },
  { href: "/profile", label: "Profil", Icon: User },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-display font-bold text-ink-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-volt-500 text-white shadow-[0_0_16px_rgba(34,197,94,0.55)]">
              <Zap className="h-4 w-4" />
            </span>
            VoltMate
          </Link>
          {user ? (
            <Link href="/profile" className="text-sm font-medium text-ink-700">
              {user.points} pts
            </Link>
          ) : (
            <Link href="/login" className="text-sm font-semibold text-volt-600">
              Se connecter
            </Link>
          )}
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-3xl">
          {TABS.map((tab) => {
            const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                  active ? "text-volt-600" : "text-ink-500"
                }`}
              >
                <tab.Icon className="h-5 w-5" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
