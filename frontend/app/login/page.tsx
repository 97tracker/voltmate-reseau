"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/profile");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Connexion impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-ink-900">Connexion</h1>
      <form onSubmit={onSubmit} className="card flex flex-col gap-4">
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Mot de passe</label>
          <input
            className="input"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Connexion..." : "Se connecter"}
        </button>
      </form>
      <p className="text-center text-sm text-ink-500">
        Pas de compte ?{" "}
        <Link href="/register" className="font-semibold text-volt-600">
          Inscrivez-vous
        </Link>
      </p>
      <p className="text-center text-xs text-ink-500">
        Les signalements anonymes restent possibles sans compte. S&apos;inscrire permet de gagner des
        points et des badges.
      </p>
    </div>
  );
}
