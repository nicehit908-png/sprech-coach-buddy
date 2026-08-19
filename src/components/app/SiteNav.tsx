import { Link } from "@tanstack/react-router";

const links = [
  { to: "/", label: "🏠 Start" },
  { to: "/themen", label: "📚 Alle Themen" },
  { to: "/fortschritt", label: "📈 Fortschritt" },
] as const;

export function SiteNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
      <nav className="mx-auto flex max-w-3xl items-center gap-1 overflow-x-auto px-3 py-2">
        <Link to="/" className="mr-auto shrink-0 text-base font-bold tracking-tight text-primary">
          Sprechen&nbsp;B1
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
      </nav>
    </header>
  );
}