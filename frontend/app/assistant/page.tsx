"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { getCurrentPosition } from "@/lib/geolocation";
import type { AssistantAnswer } from "@/lib/types";

interface Message {
  role: "user" | "assistant";
  text: string;
  suggestedStationIds?: string[];
}

const SUGGESTIONS = [
  "Cette borne est-elle fiable ?",
  "Je dois faire 120 km, combien de batterie me faut-il ?",
  "Est-ce mieux de charger à 80 % ou 100 % ?",
  "Trouve-moi une borne fiable proche.",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Bonjour ! Je suis l'assistant VoltMate. Demandez-moi si une borne est fiable, combien de batterie prévoir pour un trajet, ou tout autre conseil de recharge.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(question: string) {
    if (!question.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);

    const payload: { question: string; latitude?: number; longitude?: number; trip_distance_km?: number } = {
      question,
    };

    const distanceMatch = question.match(/(\d+)\s*km/i);
    if (distanceMatch) {
      payload.trip_distance_km = parseFloat(distanceMatch[1]);
    }

    const askWithPosition = (lat?: number, lng?: number) => {
      if (lat !== undefined) payload.latitude = lat;
      if (lng !== undefined) payload.longitude = lng;

      api
        .post<AssistantAnswer>("/assistant/query", payload)
        .then((res) => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", text: res.answer, suggestedStationIds: res.suggested_station_ids },
          ]);
        })
        .catch(() => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", text: "Désolé, je n'ai pas pu traiter votre question." },
          ]);
        })
        .finally(() => setLoading(false));
    };

    if (question.toLowerCase().includes("proche")) {
      getCurrentPosition()
        .then(({ latitude, longitude }) => askWithPosition(latitude, longitude))
        .catch((err) => {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              text:
                err instanceof Error
                  ? err.message
                  : "Impossible d'obtenir votre position, je réponds sans la prendre en compte.",
            },
          ]);
          askWithPosition();
        });
    } else {
      askWithPosition();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-ink-900">Assistant VoltMate</h1>

      <div className="flex flex-col gap-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
              m.role === "user" ? "self-end bg-volt-500 text-white" : "self-start bg-white shadow-sm border border-slate-100"
            }`}
          >
            {m.text}
            {m.suggestedStationIds && m.suggestedStationIds.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                {m.suggestedStationIds.map((id) => (
                  <Link key={id} href={`/station/${id}`} className="text-xs font-semibold underline">
                    Voir la fiche de la borne suggérée →
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && <p className="self-start text-sm text-ink-500">L&apos;assistant réfléchit...</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => send(s)} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-ink-700">
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="sticky bottom-16 flex gap-2 rounded-2xl bg-white p-2 shadow-md border border-slate-100"
      >
        <input
          className="input flex-1 border-none focus:ring-0"
          placeholder="Posez votre question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          Envoyer
        </button>
      </form>
    </div>
  );
}
