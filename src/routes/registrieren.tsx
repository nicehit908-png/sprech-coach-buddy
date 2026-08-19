import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AuthCard, Meldung, buttonClass, feldClass } from "@/components/app/AuthCard";

export const Route = createFileRoute("/registrieren")({
  head: () => ({
    meta: [
      { title: "Registrieren – Deutsch Sprechen B1" },
      { name: "description", content: "Erstelle ein kostenloses Konto und speichere deinen Sprech-Fortschritt." },
      { property: "og:title", content: "Kostenloses Konto erstellen – Sprechen B1" },
      { property: "og:description", content: "Registriere dich, um Übungen, Bewertungen und Aufnahmen zu speichern." },
    ],
  }),
  component: Registrieren,
});

const schema = z
  .object({
    email: z.string().trim().email("Bitte gib eine gültige E-Mail-Adresse ein.").max(255),
    passwort: z.string().min(6, "Das Passwort muss mindestens 6 Zeichen haben.").max(72),
    bestaetigung: z.string(),
  })
  .refine((d) => d.passwort === d.bestaetigung, {
    message: "Die beiden Passwörter sind nicht identisch.",
    path: ["bestaetigung"],
  });

function Registrieren() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [bestaetigung, setBestaetigung] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/konto", replace: true });
  }, [user, navigate]);

  async function absenden(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);
    setErfolg(null);
    const geprueft = schema.safeParse({ email, passwort, bestaetigung });
    if (!geprueft.success) {
      setFehler(geprueft.error.issues[0]?.message ?? "Bitte prüfe deine Eingaben.");
      return;
    }
    setLaedt(true);
    const { data, error } = await supabase.auth.signUp({
      email: geprueft.data.email,
      password: geprueft.data.passwort,
      options: { emailRedirectTo: `${window.location.origin}/konto` },
    });
    setLaedt(false);
    if (error) {
      setFehler(
        error.message.toLowerCase().includes("already")
          ? "Diese E-Mail-Adresse ist schon registriert. Bitte melde dich an."
          : error.message,
      );
      return;
    }
    if (data.session) {
      navigate({ to: "/konto" });
      return;
    }
    setErfolg(
      "✅ Konto erstellt! Wir haben dir eine E-Mail geschickt. Bitte bestätige den Link und melde dich danach an.",
    );
  }

  return (
    <AuthCard titel="👤 Registrieren" untertitel="Erstelle ein kostenloses Konto, um deinen Fortschritt zu speichern.">
      <form onSubmit={absenden} className="grid gap-3">
        <label className="text-sm font-semibold" htmlFor="email">E-Mail</label>
        <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={feldClass} placeholder="name@beispiel.de" />
        <label className="text-sm font-semibold" htmlFor="pw">Passwort</label>
        <input id="pw" type="password" autoComplete="new-password" value={passwort} onChange={(e) => setPasswort(e.target.value)} className={feldClass} placeholder="mindestens 6 Zeichen" />
        <label className="text-sm font-semibold" htmlFor="pw2">Passwort bestätigen</label>
        <input id="pw2" type="password" autoComplete="new-password" value={bestaetigung} onChange={(e) => setBestaetigung(e.target.value)} className={feldClass} />
        <button type="submit" disabled={laedt} className={`${buttonClass} mt-2`}>
          {laedt ? "Wird erstellt..." : "Registrieren"}
        </button>
      </form>
      {fehler && <Meldung art="fehler" text={fehler} />}
      {erfolg && <Meldung art="erfolg" text={erfolg} />}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Sie haben bereits ein Konto?{" "}
        <Link to="/anmelden" className="font-semibold text-primary">Anmelden</Link>
      </p>
    </AuthCard>
  );
}