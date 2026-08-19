export type Eintrag = {
  themaId: string;
  titel: string;
  datum: number;
  score: number | null;
};

const KEY = "sprechen-b1-fortschritt";

export function ladeVerlauf(): Eintrag[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Eintrag[]) : [];
  } catch {
    return [];
  }
}

export function speichereEintrag(eintrag: Eintrag) {
  if (typeof window === "undefined") return;
  const alle = [eintrag, ...ladeVerlauf()].slice(0, 200);
  window.localStorage.setItem(KEY, JSON.stringify(alle));
}

export function aktualisiereScore(themaId: string, datum: number, score: number) {
  if (typeof window === "undefined") return;
  const alle = ladeVerlauf().map((e) =>
    e.themaId === themaId && e.datum === datum ? { ...e, score } : e,
  );
  window.localStorage.setItem(KEY, JSON.stringify(alle));
}

export function statistik() {
  const alle = ladeVerlauf();
  const mitScore = alle.filter((e) => typeof e.score === "number") as (Eintrag & { score: number })[];
  const durchschnitt = mitScore.length
    ? Math.round(mitScore.reduce((s, e) => s + e.score, 0) / mitScore.length)
    : null;
  return {
    uebungen: alle.length,
    themen: new Set(alle.map((e) => e.themaId)).size,
    durchschnitt,
    letzte: alle.slice(0, 8),
  };
}

/** Bevorzugt Themen, die noch nicht (oder lange nicht) geübt wurden. */
export function zufaelligesThema(ids: string[]): string {
  const verlauf = ladeVerlauf();
  const zuletzt = new Map<string, number>();
  for (const e of verlauf) if (!zuletzt.has(e.themaId)) zuletzt.set(e.themaId, e.datum);
  const ungeuebt = ids.filter((id) => !zuletzt.has(id));
  const pool = ungeuebt.length ? ungeuebt : [...ids].sort((a, b) => (zuletzt.get(a) ?? 0) - (zuletzt.get(b) ?? 0)).slice(0, Math.max(5, Math.floor(ids.length / 2)));
  return pool[Math.floor(Math.random() * pool.length)]!;
}