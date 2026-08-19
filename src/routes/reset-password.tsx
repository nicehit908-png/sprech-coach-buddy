import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard, Meldung, buttonClass, feldClass } from "@/components/app/AuthCard";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Neues Passwort – Deutsch Sprechen B1" },
      { name: "description", content: "Lege jetzt ein neues Passwort für dein Konto fest." },
      { property: "og:title", content: "Neues Passwort festlegen – Sprechen B1" },
      { property: "og:description", content: "Wähle ein neues Passwort und übe weiter." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [passwort, setPasswort] = useState("");
  const [bestaetigung, setBestaetigung] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);

  async function absenden(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);
    setErfolg(null);
    if (passwort.length < 6) {
      setFehler("Das Passwort muss mindestens 6 Zeichen haben.");
      return;
    }
    if (passwort !== bestaetigung) {
      setFehler("Die beiden Passwörter sind nicht identisch.");
      return;
    }
    setLaedt(true);
    const { error } = await supabase.auth.updateUser({ password: passwort });
    setLaedt(false);
    if (error) {
      setFehler(
        error.message.toLowerCase().includes("session")
          ? "Der Link ist abgelaufen. Bitte fordere einen neuen Link an."
          : error.message,
      );
      return;
    }
    setErfolg("✅ Dein Passwort wurde geändert.");
    setTimeout(() => navigate({ to: "/konto" }), 1200);
  }

  return (
    <AuthCard titel="🔑 Neues Passwort" untertitel="Lege jetzt dein neues Passwort fest.">
      <form onSubmit={absenden} className="grid gap-3">
        <label className="text-sm font-semibold" htmlFor="pw">Neues Passwort</label>
        <input id="pw" type="password" autoComplete="new-password" value={passwort} onChange={(e) => setPasswort(e.target.value)} className={feldClass} />
        <label className="text-sm font-semibold" htmlFor="pw2">Passwort bestätigen</label>
        <input id="pw2" type="password" autoComplete="new-password" value={bestaetigung} onChange={(e) => setBestaetigung(e.target.value)} className={feldClass} />
        <button type="submit" disabled={laedt} className={`${buttonClass} mt-2`}>
          {laedt ? "Wird gespeichert..." : "Passwort speichern"}
        </button>
      </form>
      {fehler && <Meldung art="fehler" text={fehler} />}
      {erfolg && <Meldung art="erfolg" text={erfolg} />}
    </AuthCard>
  );
}