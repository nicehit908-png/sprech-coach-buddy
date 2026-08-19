import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { statistik } from "@/lib/progress";

export const Route = createFileRoute("/fortschritt")({
  head: () => ({
    meta: [
      { title: "Mein Fortschritt – Deutsch Sprechen B1" },
      {
        name: "description",
        content: "Sieh deine geübten Themen, die Anzahl der Übungen und deinen Durchschnittsscore.",
      },
      { property: "og:title", content: "Mein Fortschritt – Sprechen B1" },
      { property: "og:description", content: "Geübte Themen, Übungen und Durchschnittsnote auf einen Blick." },
    ],
  }),
  component: Fortschritt,
});

function Fortschritt() {
  const [stats, setStats] = useState<ReturnType<typeof statistik> | null>(null);
  useEffect(() => setStats(statistik()), []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight">📈 Mein Fortschritt</h1>
      {!stats || stats.uebungen === 0 ? (
        <p className="mt-4 text-muted-foreground">
          Noch keine Übung. <Link to="/themen" className="font-semibold text-primary">Jetzt starten →</Link>
        </p>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Kachel label="Themen geübt" wert={String(stats.themen)} />
            <Kachel label="Übungen" wert={String(stats.uebungen)} />
            <Kachel
              label="Durchschnitt"
              wert={stats.durchschnitt ? `${stats.durchschnitt}/100` : "–"}
            />
          </div>
          <h2 className="mt-8 text-lg font-bold">Letzte Themen</h2>
          <ul className="mt-3 space-y-2">
            {stats.letzte.map((e) => (
              <li key={`${e.themaId}-${e.datum}`}>
                <Link
                  to="/thema/$id"
                  params={{ id: e.themaId }}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-4"
                >
                  <span className="font-medium">{e.titel}</span>
                  <span className="text-sm text-muted-foreground">
                    {e.score !== null ? `${e.score}/100` : "ohne Bewertung"} ·{" "}
                    {new Date(e.datum).toLocaleDateString("de-DE")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Kachel({ label, wert }: { label: string; wert: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center">
      <p className="text-2xl font-extrabold text-primary">{wert}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}