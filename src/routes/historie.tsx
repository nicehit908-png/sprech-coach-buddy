import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ladeUebungen, type CloudUebung } from "@/lib/uebungen";

export const Route = createFileRoute("/historie")({
  head: () => ({
    meta: [
      { title: "Aktivitätsverlauf – Sprechen B1 Coach" },
      {
        name: "description",
        content: "Dein kompletter Aktivitätsverlauf mit Filtern und Details.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Historie,
});

type Filter = "alle" | "bestanden" | "nochmal";

function Historie() {
  const { user } = useAuth();
  const [liste, setListe] = useState<CloudUebung[] | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("alle");

  useEffect(() => {
    if (!user) {
      setListe([]);
      return;
    }
    ladeUebungen()
      .then(setListe)
      .catch(() => setFehler("Deine Daten konnten nicht geladen werden."));
  }, [user]);

  const gefiltert = (liste ?? []).filter((u) => {
    if (filter === "bestanden") return u.status === "bestanden";
    if (filter === "nochmal") return u.status === "nochmal";
    return true;
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight">📜 Aktivitätsverlauf</h1>

      {!user ? (
        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <p className="font-semibold">Melde dich an, um deinen Verlauf zu sehen.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link to="/anmelden" className="rounded-2xl bg-primary px-4 py-2 font-bold text-primary-foreground">
              🔐 Anmelden
            </Link>
            <Link to="/registrieren" className="rounded-2xl border border-border px-4 py-2 font-semibold">
              👤 Registrieren
            </Link>
          </div>
        </div>
      ) : !liste ? (
        <p className="mt-4 text-muted-foreground">Wird geladen…</p>
      ) : liste.length === 0 ? (
        <p className="mt-4 text-muted-foreground">
          Noch keine Übung gespeichert.{" "}
          <Link to="/themen" className="font-semibold text-primary">Jetzt starten →</Link>
        </p>
      ) : (
        <>
          <div className="mt-4 flex gap-2">
            {(["alle", "bestanden", "nochmal"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-muted-foreground"
                }`}
              >
                {f === "alle" ? "Alle" : f === "bestanden" ? "Bestanden" : "Nochmal üben"}
              </button>
            ))}
          </div>

          <ul className="mt-4 space-y-3">
            {gefiltert.map((u) => (
              <li key={u.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link to="/thema/$id" params={{ id: u.thema_id }} className="font-semibold">
                    {u.titel}
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    {new Date(u.datum).toLocaleDateString("de-DE")}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                  {u.dauer && (
                    <span className="text-muted-foreground">
                      ⏱️ {Math.floor(u.dauer / 60)}:{String(u.dauer % 60).padStart(2, "0")}
                    </span>
                  )}
                  {u.score !== null && (
                    <span className="font-medium">{u.score}/100</span>
                  )}
                  {u.status === "bestanden" && (
                    <span style={{ color: "var(--success)" }}>✅ Modul bestanden</span>
                  )}
                  {u.status === "nochmal" && (
                    <span className="text-destructive">🔄 Nochmal üben</span>
                  )}
                  {!u.status && <span className="text-muted-foreground">⏳ In Bearbeitung</span>}
                </div>
                {u.bewertung && (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs sm:grid-cols-6">
                    {[
                      ["Grammatik", u.bewertung.bewertung.grammatik],
                      ["Wortschatz", u.bewertung.bewertung.wortschatz],
                      ["Aussprache", u.bewertung.bewertung.aussprache],
                      ["Flüssigkeit", u.bewertung.bewertung.fluessigkeit],
                      ["Struktur", u.bewertung.bewertung.struktur],
                      ["Inhalt", u.bewertung.bewertung.inhalt],
                    ].map(([name, wert]) => (
                      <div key={name as string} className="rounded-xl bg-muted p-2 text-center">
                        <p className="text-muted-foreground">{name}</p>
                        <p className="font-bold">{wert}</p>
                      </div>
                    ))}
                  </div>
                )}
                {u.tips && u.tips.length > 0 && (
                  <div className="mt-3 rounded-xl bg-muted p-3 text-sm">
                    <p className="font-semibold">💡 Tipps</p>
                    <ul className="mt-1 list-inside list-disc space-y-1 text-muted-foreground">
                      {u.tips.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      {fehler && <p className="mt-3 text-sm text-destructive">{fehler}</p>}
    </div>
  );
}
