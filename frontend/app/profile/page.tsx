"use client";

import Link from "next/link";
import { Award, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();

  if (loading) return <p className="text-sm text-ink-500">Chargement...</p>;

  if (!user) {
    return (
      <div className="card flex flex-col items-center gap-3 text-center">
        <p className="text-ink-700">Connectez-vous pour voir votre profil, vos points et vos badges.</p>
        <Link href="/login" className="btn-primary">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card flex flex-col items-center gap-2 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-volt-100 text-2xl font-bold text-volt-700">
          {user.display_name.slice(0, 1).toUpperCase()}
        </span>
        <h1 className="text-lg font-bold text-ink-900">{user.display_name}</h1>
        <p className="text-sm text-ink-500">{user.email}</p>
        {user.role === "admin" && (
          <span className="rounded-full bg-ink-900 px-3 py-1 text-xs font-semibold text-white">Admin</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-volt-600">{user.points}</p>
          <p className="text-sm text-ink-500">Points communautaires</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-volt-600">{user.reports_count}</p>
          <p className="text-sm text-ink-500">Signalements envoyés</p>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold text-ink-900">Badges</h2>
        {user.badges.length === 0 ? (
          <p className="text-sm text-ink-500">
            Pas encore de badge. Faites votre premier signalement pour en débloquer un !
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {user.badges.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-volt-100 px-3 py-1 text-sm font-medium text-volt-700"
              >
                <Award className="h-4 w-4" />
                {b.badge_name}
              </span>
            ))}
          </div>
        )}
      </div>

      {user.role === "admin" && (
        <Link href="/admin" className="btn-secondary">
          <Settings className="h-5 w-5" />
          Tableau de bord admin
        </Link>
      )}

      <button onClick={logout} className="btn-secondary">
        Se déconnecter
      </button>
    </div>
  );
}
