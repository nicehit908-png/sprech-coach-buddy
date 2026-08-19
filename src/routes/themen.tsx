import { createFileRoute, Link } from "@tanstack/react-router";
import { themen } from "@/data/themen";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/themen")({
  head: () => ({
    meta: [
      { title: "Alle Themen – Deutsch Sprechen B1" },
      {
        name: "description",
        content: "Alle 49 B1-Sprechthemen mit originaler Musterlösung – suchen und direkt üben.",
      },
      { property: "og:title", content: "Alle B1-Sprechthemen" },
      { property: "og:description", content: "Suche ein Thema und starte sofort dein 5-Minuten-Training." },
    ],
  }),
  component: ThemenListe,
});

function ThemenListe() {
  const [q, setQ] = useState("");
  const gefiltert = useMemo(
    () => themen.filter((t) => t.title.toLowerCase().includes(q.trim().toLowerCase())),
    [q],
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight">📚 Alle Themen</h1>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔍 Thema suchen..."
        className="mt-4 w-full rounded-2xl border border-input bg-card px-4 py-4 text-base outline-none focus:ring-2 focus:ring-ring"
      />
      <p className="mt-3 text-sm text-muted-foreground">{gefiltert.length} Themen</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {gefiltert.map((t) => (
          <li key={t.id}>
            <Link
              to="/thema/$id"
              params={{ id: t.id }}
              className="flex min-h-16 items-center justify-between rounded-2xl border border-border bg-card px-4 py-4 font-medium transition-colors hover:bg-secondary"
            >
              <span>{t.title}</span>
              <span aria-hidden className="text-muted-foreground">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}