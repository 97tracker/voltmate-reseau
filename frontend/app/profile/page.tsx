"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Award, Car, Settings } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { UserProfile } from "@/lib/types";

export default function ProfilePage() {
  const { user, loading, logout, refresh } = useAuth();
  const [vehicle, setVehicle] = useState("");
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [vehicleMsg, setVehicleMsg] = useState<string | null>(null);

  useEffect(() => {
    setVehicle(user?.vehicle || "");
  }, [user]);

  async function saveVehicle(e: React.FormEvent) {
    e.preventDefault();
    setSavingVehicle(true);
    setVehicleMsg(null);
    try {
      await api.patch<UserProfile>("/users/me", { vehicle: vehicle.trim() || null });
      await refresh();
      setVehicleMsg("Véhicule enregistré.");
    } catch (err) {
      setVehicleMsg(err instanceof ApiError ? err.message : "Impossible d'enregistrer le véhicule.");
    } finally {
      setSavingVehicle(false);
    }
  }

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

      <div className="card">
        <h2 className="mb-1 flex items-center gap-2 font-semibold text-ink-900">
          <Car className="h-5 w-5 text-volt-600" />
          Mon véhicule
        </h2>
        <p className="mb-3 text-xs text-ink-500">
          Utilisé par l&apos;assistant pour des conseils adaptés (autonomie, temps de charge).
        </p>
        <form onSubmit={saveVehicle} className="flex flex-col gap-2">
          <input
            className="input"
            placeholder="Ex : Renault Mégane E-Tech"
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
          />
          <button type="submit" className="btn-secondary self-start" disabled={savingVehicle}>
            {savingVehicle ? "Enregistrement..." : "Enregistrer"}
          </button>
          {vehicleMsg && <p className="text-sm text-ink-500">{vehicleMsg}</p>}
        </form>
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
