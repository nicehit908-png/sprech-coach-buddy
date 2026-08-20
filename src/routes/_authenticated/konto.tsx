import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  aufnahmeUrl,
  cloudStatistik,
  ladeUebungen,
  loescheUebung,
  type CloudUebung,
} from "@/lib/uebungen";
import {
  stelleStatsSicher,
  levelFromXp,
  BADGE_DEFS,
  tagesZielErreicht,
  type StatsRow,
} from "@/lib/gamification";

export const Route = createFileRoute("/_authenticated/konto")({
  head: () => ({
    meta: [
      { title: "Mein Konto – Sprechen B1 Coach" },
      { name: "description", content: "Dein Konto: Profil, XP, Badges, Streak, Tipps und Aufnahmen." },
      { property: "og:title", content: "Mein Konto – Sprechen B1 Coach" },
      { property: "og:description", content: "Dein persönliches Profil mit allen Statistiken." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Konto,
});

function Konto() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liste, setListe] = useState<CloudUebung[] | null>(null);
  const [gami, setGami] = useState<StatsRow | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [audio, setAudio] = useState<Record<string, string>>({});

  useEffect(() => {
    ladeUebungen()
      .then(setListe)
      .catch(() => setFehler("Deine Daten konnten nicht geladen werden."));
    if (user) stelleStatsSicher(user.id).then(setGami).catch(() => {});
  }, [user]);

  async function abmelden() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  async function anhoeren(u: CloudUebung) {
    if (!u.audio_pfad) return;
    const url = await aufnahmeUrl(u.audio_pfad);
    if (url) setAudio((a) => ({ ...a, [u.id]: url }));
  }

  async function entfernen(u: CloudUebung) {
    await loescheUebung(u);
    setListe((l) => (l ? l.filter((x) => x.id !== u.id) : l));
  }

  const stats = cloudStatistik(liste ?? []);
  const lvl = gami ? levelFromXp(gami.xp) : null;
  const zielErreicht = gami ? tagesZielErreicht(gami) : false;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight">👤 Mein Konto</h1>
      <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>

      {gami && lvl && (
        <div className="mt-5 rounded-2xl border border-border bg-card p-5">
          <div className="flex justify-between text-sm font-medium">
            <span>Level {lvl.level} – {lvl.name}</span>
            <span>{gami.xp} XP</span>
          </div>
          <div className="mt-2 h-3 rounded-full bg-muted">
            <div className="h-3 rounded-full bg-primary" style={{ width: `${lvl.prozent}%` }} />
          </div>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kachel label="⭐ XP" wert={gami ? String(gami.xp) : "–"} />
        <Kachel label="🔥 Streak" wert={gami ? `${gami.streak} Tage` : "–"} />
        <Kachel label="🏆 Module" wert={gami ? `${gami.module_abgeschlossen.length}` : "–"} />
        <Kachel label="📊 Ø Score" wert={stats.durchschnitt ? `${stats.durchschnitt}` : "–"} />
      </div>

      {/* Tagesziel */}
      {gami && (
        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-semibold">🎯 Mein Tagesziel</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {gami.heute_gemacht} / {gami.taegliches_ziel} Übungen
          </p>
          <div className="mt-2 h-2 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary"
              style={{ width: `${Math.min(100, (gami.heute_gemacht / gami.taegliches_ziel) * 100)}%` }}
            />
          </div>
          {zielErreicht && (
            <p className="mt-2 text-sm font-semibold" style={{ color: "var(--success)" }}>
              🎉 Tagesziel erreicht!
            </p>
          )}
        </div>
      )}

      {/* Badges */}
      {gami && (
        <>
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
        </>
      )}

      {/* Tipps */}
      {gami?.trainingsplan && gami.trainingsplan.length > 0 && (
        <>
          <h2 className="mt-8 text-lg font-bold">💡 Meine Tipps</h2>
          <div className="mt-3 rounded-2xl border border-border bg-card p-4">
            <ul className="space-y-2">
              {gami.trainingsplan.map((t, i) => (
                <li key={i} className="rounded-xl bg-muted p-3 text-sm">💡 {t}</li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* Schwächen */}
      {gami?.schwaechen && Object.keys(gami.schwaechen).length > 0 && (
        <>
          <h2 className="mt-8 text-lg font-bold">🧠 Meine Schwächen</h2>
          <div className="mt-3 rounded-2xl border border-border bg-card p-4">
            <ul className="space-y-1">
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

      {/* Verlauf */}
      <h2 className="mt-8 text-lg font-bold">📜 Letzte Aktivitäten</h2>
      {fehler && <p className="mt-3 text-sm text-destructive">{fehler}</p>}
      {!liste ? (
        <p className="mt-3 text-muted-foreground">Wird geladen…</p>
      ) : liste.length === 0 ? (
        <p className="mt-3 text-muted-foreground">
          Noch keine Übung gespeichert.{" "}
          <Link to="/themen" className="font-semibold text-primary">Jetzt starten →</Link>
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {liste.slice(0, 10).map((u) => (
            <li key={u.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link to="/thema/$id" params={{ id: u.thema_id }} className="font-semibold">
                  {u.titel}
                </Link>
                <span className="text-sm text-muted-foreground">
                  {new Date(u.datum).toLocaleDateString("de-DE")} ·{" "}
                  {u.score !== null ? `${u.score}/100` : "ohne Bewertung"}
                  {u.status === "bestanden" && " · ✅"}
                  {u.status === "nochmal" && " · 🔄"}
                </span>
              </div>
              {audio[u.id] && <audio controls src={audio[u.id]} className="mt-3 w-full" />}
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                {u.audio_pfad && !audio[u.id] && (
                  <button onClick={() => anhoeren(u)} className="rounded-full border border-border px-3 py-1 font-medium">
                    🎧 Anhören
                  </button>
                )}
                <button
                  onClick={() => entfernen(u)}
                  className="rounded-full border border-border px-3 py-1 font-medium text-destructive"
                >
                  🗑 Löschen
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Link to="/historie" className="mt-4 block text-center text-sm font-semibold text-primary">
        Vollständigen Verlauf ansehen →
      </Link>

      <button
        onClick={abmelden}
        className="mt-8 w-full rounded-2xl border border-border px-6 py-4 font-semibold"
      >
        🚪 Abmelden
      </button>
    </div>
  );
}

function Kachel({ label, wert }: { label: string; wert: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center">
      <p className="text-xl font-extrabold text-primary">{wert}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
