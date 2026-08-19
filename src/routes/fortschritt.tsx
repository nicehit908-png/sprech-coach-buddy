import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { statistik } from "@/lib/progress";
import { useAuth } from "@/hooks/useAuth";
import { cloudStatistik, ladeUebungen, type CloudUebung } from "@/lib/uebungen";

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
  const { user, laedt } = useAuth();
  const [stats, setStats] = useState<ReturnType<typeof statistik> | null>(null);
  const [cloud, setCloud] = useState<CloudUebung[] | null>(null);
  useEffect(() => setStats(statistik()), []);
  useEffect(() => {
    if (!user) {
      setCloud(null);
      return;
    }
    ladeUebungen()
      .then(setCloud)
      .catch(() => setCloud([]));
  }, [user]);

  if (user) {
    const s = cloudStatistik(cloud ?? []);
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-extrabold tracking-tight">📊 Mein Fortschritt</h1>
        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Kachel label="Themen geübt" wert={String(s.themen)} />
          <Kachel label="Übungen" wert={String(s.uebungen)} />
          <Kachel
            label="Durchschnittliche Bewertung"
            wert={s.durchschnitt ? `${s.durchschnitt}/100` : "–"}
          />
        </div>
        {!cloud ? (
          <p className="mt-6 text-muted-foreground">Wird geladen…</p>
        ) : cloud.length === 0 ? (
          <p className="mt-6 text-muted-foreground">
            Noch keine Übung gespeichert.{" "}
            <Link to="/themen" className="font-semibold text-primary">Jetzt starten →</Link>
          </p>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Thema</th>
                  <th className="px-4 py-3 font-semibold">Datum</th>
                  <th className="px-4 py-3 font-semibold">Bewertung</th>
                </tr>
              </thead>
              <tbody>
                {cloud.map((u) => (
                  <tr key={u.id} className="border-t border-border bg-card">
                    <td className="px-4 py-3 font-medium">
                      <Link to="/thema/$id" params={{ id: u.thema_id }}>{u.titel}</Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(u.datum).toLocaleDateString("de-DE")}
                    </td>
                    <td className="px-4 py-3">{u.score !== null ? `${u.score}/100` : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Link
          to="/konto"
          className="mt-6 block rounded-2xl border border-border bg-card p-4 text-center font-semibold"
        >
          👤 Mein Konto
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight">📈 Mein Fortschritt</h1>
      {!laedt && (
        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <p className="font-semibold">Erstelle ein kostenloses Konto, um deinen Fortschritt zu speichern.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link to="/registrieren" className="rounded-2xl bg-primary px-4 py-2 font-bold text-primary-foreground">
              👤 Registrieren
            </Link>
            <Link to="/anmelden" className="rounded-2xl border border-border px-4 py-2 font-semibold">
              🔐 Anmelden
            </Link>
          </div>
        </div>
      )}
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