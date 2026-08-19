import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { themen } from "@/data/themen";
import { useRecorder } from "@/hooks/useRecorder";
import { analysiereAufnahme } from "@/lib/analyse.functions";
import type { AnalysisResult } from "@/lib/ai.server";
import { aktualisiereScore, speichereEintrag, zufaelligesThema } from "@/lib/progress";

const DAUER = 5 * 60;

export const Route = createFileRoute("/thema/$id")({
  loader: ({ params }) => {
    const thema = themen.find((t) => t.id === params.id);
    if (!thema) throw notFound();
    return { thema };
  },
  head: ({ loaderData }) => {
    const titel = loaderData ? `Thema: ${loaderData.thema.title}` : "Thema nicht gefunden";
    const beschreibung = loaderData
      ? `Sprich 5 Minuten frei über "${loaderData.thema.title}" und erhalte eine KI-Bewertung auf B1-Niveau.`
      : "Dieses Thema gibt es nicht.";
    return {
      meta: [
        { title: `${titel} – Sprechen B1` },
        { name: "description", content: beschreibung },
        { property: "og:title", content: `${titel} – Sprechen B1` },
        { property: "og:description", content: beschreibung },
        ...(loaderData ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  component: ThemaSeite,
});

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function ThemaSeite() {
  const { thema } = Route.useLoaderData();
  const navigate = useNavigate();
  const rec = useRecorder();
  const [rest, setRest] = useState(DAUER);
  const [laeuft, setLaeuft] = useState(false);
  const [vorbei, setVorbei] = useState(false);
  const [zeigeLoesung, setZeigeLoesung] = useState(false);
  const [analyse, setAnalyse] = useState<AnalysisResult | null>(null);
  const [ladeAnalyse, setLadeAnalyse] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const eintragZeit = useRef<number | null>(null);

  // Reset beim Themenwechsel
  useEffect(() => {
    setRest(DAUER);
    setLaeuft(false);
    setVorbei(false);
    setZeigeLoesung(false);
    setAnalyse(null);
    setFehler(null);
    eintragZeit.current = null;
    rec.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thema.id]);

  useEffect(() => {
    if (!laeuft) return;
    const t = setInterval(() => {
      setRest((r) => {
        if (r <= 1) {
          clearInterval(t);
          setLaeuft(false);
          setVorbei(true);
          rec.stop();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [laeuft]);

  async function start() {
    const ok = await rec.start();
    if (!ok) return;
    const zeit = Date.now();
    eintragZeit.current = zeit;
    speichereEintrag({ themaId: thema.id, titel: thema.title, datum: zeit, score: null });
    setRest(DAUER);
    setVorbei(false);
    setLaeuft(true);
  }

  function beenden() {
    rec.stop();
    setLaeuft(false);
    setVorbei(true);
  }

  async function analysieren() {
    if (!rec.audioBase64) return;
    setLadeAnalyse(true);
    setFehler(null);
    try {
      const res = await analysiereAufnahme({
        data: {
          audioBase64: rec.audioBase64,
          format: rec.format,
          thema: thema.title,
          musterloesung: thema.model.slice(0, 11000),
        },
      });
      setAnalyse(res);
      if (eintragZeit.current) aktualisiereScore(thema.id, eintragZeit.current, res.bewertung.gesamt);
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "Die Analyse ist fehlgeschlagen.");
    } finally {
      setLadeAnalyse(false);
    }
  }

  const anteil = rest / DAUER;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Thema</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{thema.title}</h1>
      <p className="mt-3 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Sprich 5 Minuten frei über dieses Thema: eigene Erfahrung, Situation in deinem Heimatland,
        Vorteile, Nachteile und deine Meinung. Die Musterlösung bleibt bis zum Ende versteckt.
      </p>

      <section className="mt-6 rounded-3xl border border-border bg-card p-6 text-center" style={{ boxShadow: "var(--shadow-soft)" }}>
        <p
          className="font-mono text-6xl font-extrabold tabular-nums"
          style={{ color: anteil < 0.2 ? "var(--destructive)" : "var(--primary)" }}
        >
          {fmt(rest)}
        </p>
        {rec.status === "recording" && (
          <p className="mt-2 font-semibold text-destructive">🔴 Aufnahme läuft...</p>
        )}
        {vorbei && rest === 0 && <p className="mt-2 font-semibold">⏰ Zeit ist vorbei!</p>}
        {rec.fehler && <p className="mt-2 text-sm text-destructive">{rec.fehler}</p>}

        <div className="mt-5 grid gap-3">
          {!laeuft && !vorbei && (
            <button
              onClick={start}
              className="rounded-2xl bg-primary px-6 py-5 text-lg font-bold text-primary-foreground active:scale-[0.98]"
            >
              ▶ Start · 🎤 Aufnahme starten
            </button>
          )}
          {laeuft && (
            <button
              onClick={beenden}
              className="rounded-2xl bg-destructive px-6 py-5 text-lg font-bold text-destructive-foreground active:scale-[0.98]"
            >
              ⏹ Beenden
            </button>
          )}
          {vorbei && rec.audioUrl && (
            <>
              <audio controls src={rec.audioUrl} className="w-full" />
              <button
                onClick={analysieren}
                disabled={ladeAnalyse}
                className="rounded-2xl bg-primary px-6 py-5 text-lg font-bold text-primary-foreground disabled:opacity-60"
              >
                {ladeAnalyse ? "🤖 Analyse läuft..." : "🤖 Antwort analysieren"}
              </button>
            </>
          )}
          {vorbei && (
            <button
              onClick={() => {
                setRest(DAUER);
                setVorbei(false);
                setAnalyse(null);
                setZeigeLoesung(false);
                rec.reset();
              }}
              className="rounded-2xl border border-border px-6 py-4 font-semibold"
            >
              🔁 Noch einmal versuchen
            </button>
          )}
        </div>
        {fehler && <p className="mt-4 text-sm text-destructive">{fehler}</p>}
      </section>

      {analyse && <AnalyseAnsicht a={analyse} />}

      <section className="mt-6">
        {!zeigeLoesung ? (
          <button
            onClick={() => setZeigeLoesung(true)}
            className="w-full rounded-2xl border border-border bg-card px-6 py-5 text-base font-bold"
          >
            📖 Musterlösung anzeigen
          </button>
        ) : (
          <div className="rounded-3xl border border-border bg-card p-5">
            <h2 className="text-lg font-bold">📖 Originale Musterlösung</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Unverändert aus dem Original-Dokument · Thema „{thema.title}“
            </p>
            <div className="mt-4 space-y-3 whitespace-pre-wrap text-[15px] leading-relaxed">
              {thema.model}
            </div>
            {analyse && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-muted p-4">
                  <h3 className="font-bold">🗣️ Meine Antwort</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{analyse.transkript}</p>
                </div>
                <div className="rounded-2xl bg-muted p-4">
                  <h3 className="font-bold">📖 Musterlösung</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{thema.model.slice(0, 900)}…</p>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() =>
            navigate({ to: "/thema/$id", params: { id: zufaelligesThema(themen.map((t) => t.id)) } })
          }
          className="flex-1 rounded-2xl bg-secondary px-4 py-4 font-semibold text-secondary-foreground"
        >
          🔄 Neues Thema
        </button>
        <Link
          to="/themen"
          className="flex-1 rounded-2xl border border-border px-4 py-4 text-center font-semibold"
        >
          📚 Alle Themen
        </Link>
      </div>
    </div>
  );
}

function AnalyseAnsicht({ a }: { a: AnalysisResult }) {
  const kategorien: [string, number][] = [
    ["Grammatik", a.bewertung.grammatik],
    ["Wortschatz", a.bewertung.wortschatz],
    ["Aussprache", a.bewertung.aussprache],
    ["Flüssigkeit", a.bewertung.fluessigkeit],
    ["Struktur", a.bewertung.struktur],
    ["Inhalt", a.bewertung.inhalt],
  ];
  return (
    <section className="mt-6 space-y-5">
      <div className="rounded-3xl border border-border bg-card p-5">
        <h2 className="text-lg font-bold">📊 Bewertung</h2>
        <div className="mt-4 space-y-3">
          {kategorien.map(([name, wert]) => (
            <div key={name}>
              <div className="flex justify-between text-sm font-medium">
                <span>{name}</span>
                <span>{wert}/100</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${Math.max(0, Math.min(100, wert))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-2xl font-extrabold text-primary">
          Gesamtnote: {a.bewertung.gesamt}/100
        </p>
      </div>

      {a.fehler?.length > 0 && (
        <div className="rounded-3xl border border-border bg-card p-5">
          <h2 className="text-lg font-bold">📝 Deine Fehler</h2>
          <ul className="mt-4 space-y-4">
            {a.fehler.map((f, i) => (
              <li key={i} className="rounded-2xl bg-muted p-4 text-sm">
                <p className="text-destructive">❌ „{f.falsch}“</p>
                <p className="mt-1 font-semibold" style={{ color: "var(--success)" }}>
                  ✅ „{f.richtig}“
                </p>
                <p className="mt-2 text-muted-foreground">{f.erklaerung}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {a.verbesserteAntwort && (
        <div className="rounded-3xl border border-border bg-card p-5">
          <h2 className="text-lg font-bold">✨ So kannst du es besser sagen:</h2>
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">{a.verbesserteAntwort}</p>
        </div>
      )}

      {a.vergleich && (
        <div className="rounded-3xl border border-border bg-card p-5">
          <h2 className="text-lg font-bold">🔍 Vergleich mit der Musterlösung</h2>
          <Liste titel="✅ Deine Argumente" items={a.vergleich.verwendeteArgumente} />
          <Liste titel="➕ Vergessene Argumente" items={a.vergleich.fehlendeArgumente} />
          <Liste titel="💡 Nützliche Ausdrücke" items={a.vergleich.nuetzlicheAusdruecke} />
          <Liste titel="⚠️ Das solltest du vermeiden" items={a.vergleich.zuVermeiden} />
        </div>
      )}
    </section>
  );
}

function Liste({ titel, items }: { titel: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="mt-4">
      <h3 className="font-semibold">{titel}</h3>
      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
        {items.map((i, k) => (
          <li key={k}>{i}</li>
        ))}
      </ul>
    </div>
  );
}