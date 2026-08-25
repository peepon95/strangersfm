import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";

const navItems = [
  { label: "Pull a note", to: "/" },
  { label: "Why I am doing this", to: "/about" },
  { label: "See every note", to: "/notes" },
  { label: "Write a note", to: "/submit" },
];

export function SideNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      {/* Mobile toggle — bottom-left */}
      <button
        type="button"
        onClick={() => setMobileOpen((o) => !o)}
        className="fixed bottom-4 left-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-background/90 shadow-sm backdrop-blur md:hidden"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {/* Desktop menu — anchored directly to the bottom-left side */}
      <nav className="fixed bottom-8 left-6 z-50 hidden flex-col gap-2 md:flex">
        <Link to="/" className="font-display text-xl leading-none">
          stranger fm
        </Link>
        <div className="mt-4 flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink key={item.to} item={item} active={pathname === item.to} />
          ))}
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-56 border-r border-border bg-background px-6 py-10">
            <Link
              to="/"
              className="font-display text-2xl leading-none"
              onClick={() => setMobileOpen(false)}
            >
              stranger fm
            </Link>
            <nav className="mt-12 flex flex-col gap-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  item={item}
                  active={pathname === item.to}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}

function NavLink({
  item,
  active,
  onClick,
}: {
  item: { label: string; to: string };
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to={item.to}
      onClick={onClick}
      className={`text-sm leading-snug transition-colors ${
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {item.label}
    </Link>
  );
}
