import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AuthCard, Meldung, buttonClass, feldClass } from "@/components/app/AuthCard";

export const Route = createFileRoute("/anmelden")({
  head: () => ({
    meta: [
      { title: "Anmelden – Deutsch Sprechen B1" },
      { name: "description", content: "Melde dich an und finde deinen gespeicherten Sprech-Fortschritt wieder." },
      { property: "og:title", content: "Anmelden – Sprechen B1" },
      { property: "og:description", content: "Zugang zu deinen Übungen, Bewertungen und Aufnahmen." },
    ],
  }),
  component: Anmelden,
});

const schema = z.object({
  email: z.string().trim().email("Bitte gib eine gültige E-Mail-Adresse ein.").max(255),
  passwort: z.string().min(1, "Bitte gib dein Passwort ein.").max(72),
});

function Anmelden() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/konto", replace: true });
  }, [user, navigate]);

  async function absenden(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);
    const geprueft = schema.safeParse({ email, passwort });
    if (!geprueft.success) {
      setFehler(geprueft.error.issues[0]?.message ?? "Bitte prüfe deine Eingaben.");
      return;
    }
    setLaedt(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: geprueft.data.email,
      password: geprueft.data.passwort,
    });
    setLaedt(false);
    if (error) {
      setFehler(
        error.message.toLowerCase().includes("invalid")
          ? "E-Mail oder Passwort ist falsch."
          : error.message.toLowerCase().includes("confirm")
            ? "Bitte bestätige zuerst den Link in deiner E-Mail."
            : error.message,
      );
      return;
    }
    navigate({ to: "/konto" });
  }

  return (
    <AuthCard titel="🔐 Anmelden" untertitel="Willkommen zurück! Melde dich mit deiner E-Mail an.">
      <form onSubmit={absenden} className="grid gap-3">
        <label className="text-sm font-semibold" htmlFor="email">E-Mail</label>
        <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={feldClass} placeholder="name@beispiel.de" />
        <label className="text-sm font-semibold" htmlFor="pw">Passwort</label>
        <input id="pw" type="password" autoComplete="current-password" value={passwort} onChange={(e) => setPasswort(e.target.value)} className={feldClass} />
        <button type="submit" disabled={laedt} className={`${buttonClass} mt-2`}>
          {laedt ? "Wird geprüft..." : "Anmelden"}
        </button>
      </form>
      {fehler && <Meldung art="fehler" text={fehler} />}
      <p className="mt-4 text-center text-sm">
        <Link to="/passwort-vergessen" className="font-semibold text-primary">Passwort vergessen?</Link>
      </p>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Noch kein Konto?{" "}
        <Link to="/registrieren" className="font-semibold text-primary">Registrieren</Link>
      </p>
    </AuthCard>
  );
}