import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { themen } from "@/data/themen";
import { statistik } from "@/lib/progress";
import { useAuth } from "@/hooks/useAuth";
import { cloudStatistik, ladeUebungen, type CloudUebung } from "@/lib/uebungen";
import {
  stelleStatsSicher,
  levelFromXp,
  BADGE_DEFS,
  type StatsRow,
} from "@/lib/gamification";

export const Route = createFileRoute("/fortschritt")({
  head: () => ({
    meta: [
      { title: "Mein Fortschritt – Sprechen B1 Coach" },
      {
        name: "description",
        content: "Module, Scores, Badges, Streak und deine B1-Reise auf einen Blick.",
      },
      { property: "og:title", content: "Mein Fortschritt – Sprechen B1 Coach" },
      { property: "og:description", content: "Deine B1-Sprechreise mit Modulen, Badges und Statistiken." },
    ],
  }),
  component: Fortschritt,
});

function Fortschritt() {
  const { user, laedt } = useAuth();
  const [stats, setStats] = useState<ReturnType<typeof statistik> | null>(null);
  const [cloud, setCloud] = useState<CloudUebung[] | null>(null);
  const [gami, setGami] = useState<StatsRow | null>(null);
  useEffect(() => setStats(statistik()), []);
  useEffect(() => {
    if (!user) {
      setCloud(null);
      setGami(null);
      return;
    }
    ladeUebungen().then(setCloud).catch(() => setCloud([]));
    stelleStatsSicher(user.id).then(setGami).catch(() => {});
  }, [user]);

  const cs = cloudStatistik(cloud ?? []);
  const lvl = gami ? levelFromXp(gami.xp) : null;
  const moduleFertig = gami?.module_abgeschlossen ?? [];
  const moduleProzent = Math.round((moduleFertig.length / themen.length) * 100);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight">📈 Mein Fortschritt</h1>

      {user && gami && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kachel label="⭐ XP" wert={String(gami.xp)} />
            <Kachel label="🔥 Streak" wert={`${gami.streak} Tage`} />
            <Kachel label="🏆 Module" wert={`${moduleFertig.length}/${themen.length}`} />
            <Kachel label="📊 Ø Score" wert={cs.durchschnitt ? `${cs.durchschnitt}` : "–"} />
          </div>

          {lvl && (
            <div className="mt-4 rounded-2xl border border-border bg-card p-4">
              <div className="flex justify-between text-sm font-medium">
                <span>Level {lvl.level} – {lvl.name}</span>
                <span>{gami.xp}/{lvl.nextXp} XP</span>
              </div>
              <div className="mt-2 h-3 rounded-full bg-muted">
                <div className="h-3 rounded-full bg-primary" style={{ width: `${lvl.prozent}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{lvl.prozent}% bis Level {lvl.level + 1}</p>
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-border bg-card p-4">
            <div className="flex justify-between text-sm font-medium">
              <span>🗺️ B1-Reise: Module abgeschlossen</span>
              <span>{moduleProzent}%</span>
            </div>
            <div className="mt-2 h-3 rounded-full bg-muted">
              <div className="h-3 rounded-full bg-primary" style={{ width: `${moduleProzent}%` }} />
            </div>
          </div>

          {cs.beste !== null && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Kachel label="Beste Bewertung" wert={`${cs.beste}/100`} />
              <Kachel label="Bestandene Module" wert={String(cs.bestanden)} />
              <Kachel label="Übungen gesamt" wert={String(cs.uebungen)} />
            </div>
          )}

          {/* Badges */}
          <h2 className="mt-8 text-lg font-bold">🏅 Meine Abzeichen</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {BADGE_DEFS.map((b) => {
              const earned = gami.badges.includes(b.id);
              return (
                <div
                  key={b.id}
                  className={`rounded-2xl border border-border p-4 text-center ${
                    earned ? "bg-card" : "bg-muted opacity-50"
                  }`}
                >
                  <p className="text-3xl">{earned ? b.icon : "🔒"}</p>
                  <p className="mt-2 text-sm font-semibold">{b.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {earned ? "Freigeschaltet" : b.bedingung}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Schwächen */}
          {gami.schwaechen && Object.keys(gami.schwaechen).length > 0 && (
            <>
              <h2 className="mt-8 text-lg font-bold">🧠 Meine Schwächen</h2>
              <div className="mt-3 rounded-2xl border border-border bg-card p-4">
                <p className="text-sm font-semibold">Daran solltest du arbeiten:</p>
                <ul className="mt-2 space-y-1">
                  {Object.entries(gami.schwaechen)
                    .sort((a, b) => b[1]! - a[1]!)
                    .slice(0, 5)
                    .map(([name, count]) => (
                      <li key={name} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{name}</span>
                        <span className="font-medium">{count}× ⚠️</span>
                      </li>
                    ))}
                </ul>
              </div>
            </>
          )}

          {/* Trainingsplan */}
          {gami.trainingsplan && gami.trainingsplan.length > 0 && (
            <>
              <h2 className="mt-8 text-lg font-bold">🎯 Mein Trainingsplan</h2>
              <div className="mt-3 rounded-2xl border border-border bg-card p-4">
                <p className="text-sm font-semibold">Diese Woche solltest du besonders üben:</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {gami.trainingsplan.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* B1 Journey */}
          <h2 className="mt-8 text-lg font-bold">🗺️ Meine B1-Reise</h2>
          <ul className="mt-3 space-y-2">
            {themen.map((t, i) => {
              const abgeschlossen = moduleFertig.includes(t.id);
              const isNext = !abgeschlossen && moduleFertig.length === i;
              return (
                <li key={t.id}>
                  <Link
                    to="/thema/$id"
                    params={{ id: t.id }}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-4 transition-colors hover:bg-secondary ${
                      abgeschlossen
                        ? "border-success/30 bg-success/5"
                        : isNext
                          ? "border-primary/40 bg-primary/5"
                          : "border-border bg-card"
                    }`}
                  >
                    <span className="text-xl">{abgeschlossen ? "🟢" : isNext ? "🎯" : "🔒"}</span>
                    <div>
                      <p className="text-xs text-muted-foreground">Modul {i + 1}</p>
                      <p className="font-medium">{t.title}</p>
                      {abgeschlossen && (
                        <p className="text-xs" style={{ color: "var(--success)" }}>✅ Abgeschlossen</p>
                      )}
                      {isNext && (
                        <p className="text-xs text-primary">🎯 Nächstes Modul</p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {!user && !laedt && (
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

      {!user && stats && stats.uebungen > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Kachel label="Themen geübt" wert={String(stats.themen)} />
          <Kachel label="Übungen" wert={String(stats.uebungen)} />
          <Kachel label="Durchschnitt" wert={stats.durchschnitt ? `${stats.durchschnitt}/100` : "–"} />
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

function Kachel({ label, wert }: { label: string; wert: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center">
      <p className="text-2xl font-extrabold text-primary">{wert}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
