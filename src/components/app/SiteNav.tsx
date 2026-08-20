import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const links = [
  { to: "/", label: "🏠 Start" },
  { to: "/themen", label: "📚 Themen" },
  { to: "/fortschritt", label: "📈 Fortschritt" },
  { to: "/historie", label: "📜 Historie" },
] as const;

export function SiteNav() {
  const { user } = useAuth();
  const navigate = useNavigate();

  async function abmelden() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
      <nav className="mx-auto flex max-w-3xl items-center gap-1 overflow-x-auto px-3 py-2">
        <Link to="/" className="mr-auto shrink-0 text-base font-bold tracking-tight text-primary">
          Sprechen&nbsp;B1&nbsp;Coach
        </Link>
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            activeOptions={{ exact: l.to === "/" }}
            className="shrink-0 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
            activeProps={{ className: "bg-secondary text-secondary-foreground" }}
          >
            {l.label}
          </Link>
        ))}
        {user ? (
          <>
            <Link
              to="/konto"
              className="shrink-0 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
              activeProps={{ className: "bg-secondary text-secondary-foreground" }}
            >
              👤 Konto
            </Link>
            <button
              onClick={abmelden}
              className="shrink-0 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
            >
              🚪
            </button>
          </>
        ) : (
          <>
            <Link
              to="/anmelden"
              className="shrink-0 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
              activeProps={{ className: "bg-secondary text-secondary-foreground" }}
            >
              🔐
            </Link>
            <Link
              to="/registrieren"
              className="shrink-0 rounded-full bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
            >
              👤
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
