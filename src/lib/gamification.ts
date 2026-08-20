import { supabase } from "@/integrations/supabase/client";
import type { AnalysisResult } from "@/lib/ai.server";

export type StatsRow = {
  user_id: string;
  xp: number;
  level: number;
  streak: number;
  beste_streak: number;
  letzter_tag: string | null;
  taegliches_ziel: number;
  heute_gemacht: number;
  ziel_datum: string | null;
  challenge_datum: string | null;
  challenge_text: string | null;
  badges: string[];
  schwaechen: Record<string, number> | null;
  trainingsplan: string[] | null;
  module_abgeschlossen: string[];
  beste_bewertung: number | null;
  anzahl_bestanden: number;
};

const LEVELS = [
  "Sprechstarter",
  "Sprechlerner",
  "Sprechprofi",
  "Sprechexperte",
  "Sprechmeister",
  "B1 Champion",
  "B1 Meister",
  "B1 Legende",
];

export function levelFromXp(xp: number): {
  level: number;
  name: string;
  minXp: number;
  nextXp: number;
  prozent: number;
} {
  const level = Math.floor(xp / 250) + 1;
  const minXp = (level - 1) * 250;
  const nextXp = level * 250;
  const prozent = Math.round(((xp - minXp) / (nextXp - minXp)) * 100);
  const name = LEVELS[Math.min(level - 1, LEVELS.length - 1)] ?? "B1 Legende";
  return { level, name, minXp, nextXp, prozent };
}

export const BADGE_DEFS: { id: string; name: string; icon: string; bedingung: string }[] = [
  { id: "erste-praesentation", name: "Erste Präsentation", icon: "🥉", bedingung: "Erste Präsentation abgeschlossen" },
  { id: "10-praesentationen", name: "Sprechprofi", icon: "🎤", bedingung: "10 Präsentationen abgeschlossen" },
  { id: "7-tage-streak", name: "7 Tage aktiv", icon: "🔥", bedingung: "7 Tage Streak" },
  { id: "b1-meister", name: "B1 Meister", icon: "🏆", bedingung: "5 Module bestanden" },
  { id: "top-sprecher", name: "Top-Sprecher", icon: "💯", bedingung: "Mindestens 90/100 erreicht" },
  { id: "themen-experte", name: "Themen-Experte", icon: "📚", bedingung: "20 verschiedene Themen geübt" },
];

const CHALLENGES = [
  "Verwende mindestens 5 Konnektoren.",
  "Begründe deine Meinung mit mindestens zwei Argumenten.",
  "Verwende einen Relativsatz.",
  "Verwende mindestens drei Redemittel für deine Meinung.",
  "Verwende mindestens zweimal das Wort „deshalb“.",
  "Sprich mindestens 2 Minuten ohne Pause.",
  "Verwende einen Satz mit „weil“.",
  "Verwende einen Satz mit „dass“.",
  "Nenne mindestens ein Beispiel aus deinem Heimatland.",
  "Vergleiche zwei Dinge mit einem Komparativ.",
];

function dayOfYear(date: Date): number {
  return Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
}

export function tagesChallenge(): { text: string } {
  const d = new Date();
  return { text: CHALLENGES[dayOfYear(d) % CHALLENGES.length]! };
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function ladeStats(userId: string): Promise<StatsRow | null> {
  const { data } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  return {
    ...data,
    badges: Array.isArray(data.badges) ? (data.badges as string[]) : [],
    module_abgeschlossen: Array.isArray(data.module_abgeschlossen)
      ? (data.module_abgeschlossen as string[])
      : [],
    schwaechen: data.schwaechen as Record<string, number> | null,
    trainingsplan: data.trainingsplan as string[] | null,
  } as StatsRow;
}

export async function stelleStatsSicher(userId: string): Promise<StatsRow> {
  const existing = await ladeStats(userId);
  if (existing) return existing;
  const today = todayStr();
  const { text } = tagesChallenge();
  const row = {
    user_id: userId,
    letzter_tag: today,
    ziel_datum: today,
    challenge_datum: today,
    challenge_text: text,
  };
  const { data } = await supabase
    .from("user_stats")
    .insert(row)
    .select("*")
    .single();
  if (!data) {
    return {
      user_id: userId,
      xp: 0,
      level: 1,
      streak: 0,
      beste_streak: 0,
      letzter_tag: today,
      taegliches_ziel: 1,
      heute_gemacht: 0,
      ziel_datum: today,
      challenge_datum: today,
      challenge_text: text,
      badges: [],
      schwaechen: null,
      trainingsplan: null,
      module_abgeschlossen: [],
      beste_bewertung: null,
      anzahl_bestanden: 0,
    };
  }
  return {
    ...data,
    badges: Array.isArray(data.badges) ? (data.badges as string[]) : [],
    module_abgeschlossen: Array.isArray(data.module_abgeschlossen)
      ? (data.module_abgeschlossen as string[])
      : [],
    schwaechen: data.schwaechen as Record<string, number> | null,
    trainingsplan: data.trainingsplan as string[] | null,
  } as StatsRow;
}

export async function aktualisiereStreak(stats: StatsRow): Promise<StatsRow> {
  const today = todayStr();
  if (stats.letzter_tag === today) return stats;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const newStreak = stats.letzter_tag === yesterday ? stats.streak + 1 : 1;
  const update: Partial<StatsRow> = {
    streak: newStreak,
    beste_streak: Math.max(stats.beste_streak, newStreak),
    letzter_tag: today,
  };
  await supabase.from("user_stats").update(update).eq("user_id", stats.user_id);
  return { ...stats, ...update } as StatsRow;
}

export async function uebeAbgeschlossen(
  userId: string,
  params: {
    themaId: string;
    score: number;
    bestanden: boolean;
    analyse: AnalysisResult;
    challengeErfuellt: boolean;
    anzahlThemenGeuebt: number;
    anzahlPraesentationen: number;
  },
): Promise<StatsRow> {
  let stats = await stelleStatsSicher(userId);
  stats = await aktualisiereStreak(stats);

  const today = todayStr();
  let xpGain = 20;
  if (params.bestanden) xpGain += 100;
  if (params.challengeErfuellt) xpGain += 30;

  const neueXp = stats.xp + xpGain;
  const { level } = levelFromXp(neueXp);

  let heuteGemacht = stats.heute_gemacht;
  let zielDatum = stats.ziel_datum;
  if (stats.ziel_datum !== today) {
    heuteGemacht = 1;
    zielDatum = today;
  } else {
    heuteGemacht = stats.heute_gemacht + 1;
  }

  const moduleAbgeschlossen = [...stats.module_abgeschlossen];
  if (params.bestanden && !moduleAbgeschlossen.includes(params.themaId)) {
    moduleAbgeschlossen.push(params.themaId);
  }

  const neueBadges = [...stats.badges];
  function addBadge(id: string) {
    if (!neueBadges.includes(id)) neueBadges.push(id);
  }
  if (params.anzahlPraesentationen >= 1) addBadge("erste-praesentation");
  if (params.anzahlPraesentationen >= 10) addBadge("10-praesentationen");
  if (stats.streak >= 7) addBadge("7-tage-streak");
  if (moduleAbgeschlossen.length >= 5) addBadge("b1-meister");
  if (params.score >= 90) addBadge("top-sprecher");
  if (params.anzahlThemenGeuebt >= 20) addBadge("themen-experte");

  const neueSchwaechen: Record<string, number> = { ...(stats.schwaechen ?? {}) };
  for (const f of params.analyse.fehler) {
    const key = f.erklaerung.slice(0, 80);
    neueSchwaechen[key] = (neueSchwaechen[key] ?? 0) + 1;
  }
  const topSchwaechen = Object.entries(neueSchwaechen)
    .sort((a, b) => b[1]! - a[1]!)
    .slice(0, 5);

  const trainingsplan: string[] = [];
  if (params.analyse.bewertung.grammatik < 70) trainingsplan.push("Übe Nebensätze mit „weil“ und „dass“.");
  if (params.analyse.bewertung.fluessigkeit < 70) trainingsplan.push("Sprich langsamer und flüssiger.");
  if (params.analyse.bewertung.wortschatz < 70) trainingsplan.push("Lerne neue Redemittel für deine Meinung.");
  if (params.analyse.bewertung.struktur < 70) trainingsplan.push("Strukturiere deine Präsentation klarer.");
  if (trainingsplan.length === 0) trainingsplan.push("Weiter so! Du bist auf einem guten Weg.");

  const updateData = {
    xp: neueXp,
    level,
    heute_gemacht: heuteGemacht,
    ziel_datum: zielDatum,
    module_abgeschlossen: moduleAbgeschlossen,
    badges: neueBadges,
    schwaechen: topSchwaechen.length > 0 ? Object.fromEntries(topSchwaechen) : null,
    trainingsplan,
    beste_bewertung: Math.max(stats.beste_bewertung ?? 0, params.score),
    anzahl_bestanden: params.bestanden ? stats.anzahl_bestanden + 1 : stats.anzahl_bestanden,
    updated_at: new Date().toISOString(),
  };

  await supabase.from("user_stats").update(updateData).eq("user_id", userId);

  return {
    ...stats,
    ...updateData,
    badges: neueBadges,
    module_abgeschlossen: moduleAbgeschlossen,
    schwaechen: updateData.schwaechen as Record<string, number> | null,
    trainingsplan,
  } as StatsRow;
}

export function tagesZielErreicht(stats: StatsRow): boolean {
  return stats.heute_gemacht >= stats.taegliches_ziel;
}
