import type { ReactNode } from "react";

export function AuthCard({
  titel,
  untertitel,
  children,
}: {
  titel: string;
  untertitel: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-3xl border border-border bg-card p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
        <h1 className="text-2xl font-extrabold tracking-tight">{titel}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{untertitel}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export const feldClass =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-base outline-none focus:border-primary";

export const buttonClass =
  "w-full rounded-2xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground active:scale-[0.98] disabled:opacity-60";

export function Meldung({ art, text }: { art: "fehler" | "erfolg"; text: string }) {
  return (
    <p
      className="mt-4 rounded-2xl px-4 py-3 text-sm font-medium"
      style={
        art === "fehler"
          ? { background: "color-mix(in oklab, var(--destructive) 12%, transparent)", color: "var(--destructive)" }
          : { background: "var(--muted)", color: "var(--success, var(--primary))" }
      }
    >
      {text}
    </p>
  );
}