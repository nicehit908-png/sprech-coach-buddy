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

export const Route = createFileRoute("/_authenticated/konto")({
  head: () => ({
    meta: [
      { title: "Mein Konto – Deutsch Sprechen B1" },
      { name: "description", content: "Dein Konto: geübte Themen, Durchschnittsnote, Verlauf und Aufnahmen." },
      { property: "og:title", content: "Mein Konto – Sprechen B1" },
      { property: "og:description", content: "Fortschritt, Bewertungen und Aufnahmen deines Kontos." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Konto,
});

function Konto() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liste, setListe] = useState<CloudUebung[] | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [audio, setAudio] = useState<Record<string, string>>({});

  useEffect(() => {
    ladeUebungen()
      .then(setListe)
      .catch(() => setFehler("Deine Daten konnten nicht geladen werden."));
  }, []);

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight">👤 Mein Konto</h1>
      <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Kachel label="Themen geübt" wert={String(stats.themen)} />
        <Kachel label="Übungen" wert={String(stats.uebungen)} />
        <Kachel
          label="Durchschnittliche Bewertung"
          wert={stats.durchschnitt ? `${stats.durchschnitt}/100` : "–"}
        />
      </div>

      <h2 className="mt-8 text-lg font-bold">📊 Mein Fortschritt</h2>
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
          {liste.map((u) => (
            <li key={u.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link to="/thema/$id" params={{ id: u.thema_id }} className="font-semibold">
                  {u.titel}
                </Link>
                <span className="text-sm text-muted-foreground">
                  {new Date(u.datum).toLocaleDateString("de-DE")} ·{" "}
                  {u.score !== null ? `${u.score}/100` : "ohne Bewertung"}
                </span>
              </div>
              {audio[u.id] && <audio controls src={audio[u.id]} className="mt-3 w-full" />}
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                {u.audio_pfad && !audio[u.id] && (
                  <button onClick={() => anhoeren(u)} className="rounded-full border border-border px-3 py-1 font-medium">
                    🎧 Aufnahme anhören
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
      <p className="text-2xl font-extrabold text-primary">{wert}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}