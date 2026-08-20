import { supabase } from "@/integrations/supabase/client";
import type { AnalysisResult } from "@/lib/ai.server";

export type CloudUebung = {
  id: string;
  thema_id: string;
  titel: string;
  datum: string;
  score: number | null;
  bewertung: AnalysisResult | null;
  audio_pfad: string | null;
  status: string | null;
  dauer: number | null;
  tips: string[] | null;
};

export async function ladeUebungen(): Promise<CloudUebung[]> {
  const { data, error } = await supabase
    .from("uebungen")
    .select("id, thema_id, titel, datum, score, bewertung, audio_pfad, status, dauer, tips")
    .order("datum", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as CloudUebung[];
}

export async function starteUebung(
  userId: string,
  thema: { id: string; title: string },
): Promise<string | null> {
  const { data, error } = await supabase
    .from("uebungen")
    .insert({ user_id: userId, thema_id: thema.id, titel: thema.title })
    .select("id")
    .single();
  if (error) return null;
  return data.id;
}

export async function speichereBewertung(id: string, ergebnis: AnalysisResult) {
  await supabase
    .from("uebungen")
    .update({
      score: ergebnis.bewertung.gesamt,
      bewertung: JSON.parse(JSON.stringify(ergebnis)),
      status: ergebnis.bewertung.gesamt >= 70 ? "bestanden" : "nochmal",
      tips: JSON.parse(JSON.stringify(ergebnis.vergleich?.fehlendeArgumente ?? [])),
    })
    .eq("id", id);
}

export async function ladeAufnahmeHoch(userId: string, uebungId: string, blob: Blob, format: string) {
  const pfad = `${userId}/${uebungId}.${format}`;
  const { error } = await supabase.storage
    .from("aufnahmen")
    .upload(pfad, blob, { upsert: true, contentType: blob.type || "audio/webm" });
  if (error) return null;
  await supabase.from("uebungen").update({ audio_pfad: pfad }).eq("id", uebungId);
  return pfad;
}

export async function aufnahmeUrl(pfad: string) {
  const { data } = await supabase.storage.from("aufnahmen").createSignedUrl(pfad, 3600);
  return data?.signedUrl ?? null;
}

export async function loescheAufnahme(uebungId: string, pfad: string) {
  await supabase.storage.from("aufnahmen").remove([pfad]);
  await supabase.from("uebungen").update({ audio_pfad: null }).eq("id", uebungId);
}

export async function loescheUebung(uebung: CloudUebung) {
  if (uebung.audio_pfad) await supabase.storage.from("aufnahmen").remove([uebung.audio_pfad]);
  await supabase.from("uebungen").delete().eq("id", uebung.id);
}

export function cloudStatistik(alle: CloudUebung[]) {
  const mitScore = alle.filter((e) => typeof e.score === "number") as (CloudUebung & { score: number })[];
  return {
    uebungen: alle.length,
    themen: new Set(alle.map((e) => e.thema_id)).size,
    durchschnitt: mitScore.length
      ? Math.round(mitScore.reduce((s, e) => s + e.score, 0) / mitScore.length)
      : null,
    beste: mitScore.length ? Math.max(...mitScore.map((e) => e.score)) : null,
    bestanden: alle.filter((e) => e.status === "bestanden").length,
  };
}