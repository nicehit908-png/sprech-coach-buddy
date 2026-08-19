import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { themen } from "@/data/themen";
import { zufaelligesThema, statistik } from "@/lib/progress";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Deutsch Sprechen B1 – Sprechtraining mit echten Themen" },
      {
        name: "description",
        content:
          "Übe das Sprechen auf B1-Niveau: 49 echte Prüfungsthemen, 5-Minuten-Timer, Aufnahme, KI-Bewertung und Musterlösung.",
      },
      { property: "og:title", content: "Deutsch Sprechen B1 – Sprechtraining" },
      {
        property: "og:description",
        content: "Zufälliges Thema, 5 Minuten sprechen, KI-Bewertung und originale Musterlösung.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ReturnType<typeof statistik> | null>(null);
  useEffect(() => setStats(statistik()), []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <section
        className="rounded-3xl p-7 text-primary-foreground"
        style={{ backgroundImage: "var(--gradient-hero)", boxShadow: "var(--shadow-soft)" }}
      >
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Deutsch Sprechen B1</h1>
        <p className="mt-2 text-base opacity-90">Verbessere dein Sprechen mit echten B1-Themen</p>
        <button
          onClick={() => {
            const id = zufaelligesThema(themen.map((t) => t.id));
            navigate({ to: "/thema/$id", params: { id } });
          }}
          className="mt-6 w-full rounded-2xl bg-card px-6 py-5 text-lg font-bold text-primary transition-transform active:scale-[0.98]"
        >
          🎲 Zufälliges Thema
        </button>
        <Link
          to="/themen"
          className="mt-3 block w-full rounded-2xl border border-primary-foreground/40 px-6 py-4 text-center text-base font-semibold"
        >
          📚 Alle Themen ({themen.length})
        </Link>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { t: "⏱️ 5 Minuten", d: "Echter Prüfungs-Timer" },
          { t: "🎤 Aufnahme", d: "Sprich frei und hör dich an" },
          { t: "🤖 KI-Bewertung", d: "Noten, Fehler, Verbesserung" },
        ].map((c) => (
          <div key={c.t} className="rounded-2xl border border-border bg-card p-4">
            <p className="font-semibold text-foreground">{c.t}</p>
            <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
          </div>
        ))}
      </section>

      {stats && stats.uebungen > 0 && (
        <Link
          to="/fortschritt"
          className="mt-6 flex items-center justify-between rounded-2xl border border-border bg-card p-4"
        >
          <span className="font-semibold">📈 Mein Fortschritt</span>
          <span className="text-sm text-muted-foreground">
            Themen geübt: {stats.themen} · Durchschnitt:{" "}
            {stats.durchschnitt ? `${stats.durchschnitt}/100` : "–"}
          </span>
        </Link>
      )}
    </div>
  );
}
