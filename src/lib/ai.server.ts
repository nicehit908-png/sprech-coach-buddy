const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.6-flash-preview";

export type AnalysisResult = {
  transkript: string;
  bewertung: {
    grammatik: number;
    wortschatz: number;
    aussprache: number;
    fluessigkeit: number;
    struktur: number;
    inhalt: number;
    gesamt: number;
  };
  fehler: { falsch: string; richtig: string; erklaerung: string }[];
  verbesserteAntwort: string;
  vergleich: {
    verwendeteArgumente: string[];
    fehlendeArgumente: string[];
    nuetzlicheAusdruecke: string[];
    zuVermeiden: string[];
  };
};

export async function analyseAudio(params: {
  audioBase64: string;
  format: string;
  thema: string;
  musterloesung: string;
}): Promise<AnalysisResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("KI-Dienst ist nicht konfiguriert (LOVABLE_API_KEY fehlt).");

  const system = `Du bist ein erfahrener Prüfer für die Deutschprüfung B1 (Sprechen).
Du bekommst eine Audioaufnahme einer Schülerin/eines Schülers zum Thema "${params.thema}".
Aufgaben:
1. Transkribiere die Aufnahme möglichst genau (auf Deutsch, so wie gesprochen, inklusive Fehler).
2. Bewerte auf B1-Niveau: Grammatik, Wortschatz, Aussprache, Flüssigkeit, Struktur, Inhalt (jeweils 0-100) und eine Gesamtnote.
3. Liste die wichtigsten Fehler (maximal 8) mit falscher Version, korrekter Version und kurzer Erklärung auf Deutsch.
4. Schreibe eine verbesserte Version der Antwort - sie muss auf B1-Niveau bleiben, natürlich und nicht künstlich kompliziert.
5. Vergleiche die Antwort mit dieser originalen Musterlösung (nicht neu erfinden, nur vergleichen):
"""${params.musterloesung}"""
Antworte NUR mit gültigem JSON, ohne Markdown, in genau diesem Format:
{"transkript":"...","bewertung":{"grammatik":0,"wortschatz":0,"aussprache":0,"fluessigkeit":0,"struktur":0,"inhalt":0,"gesamt":0},"fehler":[{"falsch":"...","richtig":"...","erklaerung":"..."}],"verbesserteAntwort":"...","vergleich":{"verwendeteArgumente":["..."],"fehlendeArgumente":["..."],"nuetzlicheAusdruecke":["..."],"zuVermeiden":["..."]}}
Wenn die Aufnahme leer oder unverständlich ist, gib alle Noten 0 und erkläre das im Transkript.`;

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            { type: "text", text: `Thema: ${params.thema}. Bitte analysiere meine Aufnahme.` },
            {
              type: "input_audio",
              input_audio: { data: params.audioBase64, format: params.format },
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("Zu viele Anfragen. Bitte warte kurz und versuche es erneut.");
    if (res.status === 402) throw new Error("Das KI-Guthaben ist aufgebraucht. Bitte lade dein Lovable-Guthaben auf.");
    throw new Error(`KI-Fehler (${res.status}): ${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = json.choices?.[0]?.message?.content ?? "";
  const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Die KI-Antwort konnte nicht gelesen werden.");
  return JSON.parse(cleaned.slice(start, end + 1)) as AnalysisResult;
}
