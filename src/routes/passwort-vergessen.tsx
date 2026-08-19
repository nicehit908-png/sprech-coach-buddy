import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard, Meldung, buttonClass, feldClass } from "@/components/app/AuthCard";

export const Route = createFileRoute("/passwort-vergessen")({
  head: () => ({
    meta: [
      { title: "Passwort vergessen – Deutsch Sprechen B1" },
      { name: "description", content: "Setze dein Passwort per E-Mail zurück und übe weiter." },
      { property: "og:title", content: "Passwort zurücksetzen – Sprechen B1" },
      { property: "og:description", content: "Wir schicken dir einen Link zum Zurücksetzen deines Passworts." },
    ],
  }),
  component: PasswortVergessen,
});

function PasswortVergessen() {
  const [email, setEmail] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);

  async function absenden(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);
    setErfolg(null);
    const geprueft = z.string().trim().email().max(255).safeParse(email);
    if (!geprueft.success) {
      setFehler("Bitte gib eine gültige E-Mail-Adresse ein.");
      return;
    }
    setLaedt(true);
    const { error } = await supabase.auth.resetPasswordForEmail(geprueft.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLaedt(false);
    if (error) {
      setFehler(error.message);
      return;
    }
    setErfolg("📧 Wenn ein Konto existiert, haben wir dir einen Link zum Zurücksetzen geschickt.");
  }

  return (
    <AuthCard titel="🔑 Passwort vergessen?" untertitel="Wir schicken dir einen Link per E-Mail.">
      <form onSubmit={absenden} className="grid gap-3">
        <label className="text-sm font-semibold" htmlFor="email">E-Mail</label>
        <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={feldClass} placeholder="name@beispiel.de" />
        <button type="submit" disabled={laedt} className={`${buttonClass} mt-2`}>
          {laedt ? "Wird gesendet..." : "Link senden"}
        </button>
      </form>
      {fehler && <Meldung art="fehler" text={fehler} />}
      {erfolg && <Meldung art="erfolg" text={erfolg} />}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/anmelden" className="font-semibold text-primary">Zurück zur Anmeldung</Link>
      </p>
    </AuthCard>
  );
}