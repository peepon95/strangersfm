import { Link, useRouterState } from "@tanstack/react-router";

const navItems = [
  { label: "Why this exists", to: "/about" },
  { label: "Write a note", to: "/submit" },
  { label: "Every note", to: "/notes" },
] as const;

export function SideNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <header className="letter-site-nav fixed inset-x-0 top-0 z-50 px-4 backdrop-blur-sm sm:px-8">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center gap-5 sm:min-h-20 sm:gap-10">
        <Link to="/" className="shrink-0 font-type text-sm tracking-[-0.04em] text-ink sm:text-lg">
          stranger.fm
        </Link>

        <nav
          aria-label="Letter sections"
          className="flex min-w-0 flex-1 items-center justify-end gap-5 overflow-x-auto py-4 [scrollbar-width:none] sm:gap-8 [&::-webkit-scrollbar]:hidden"
        >
          {navItems.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={`letter-nav-link shrink-0 py-2 font-type text-[9px] uppercase tracking-[0.1em] text-ink sm:text-[11px] ${
                  active ? "letter-nav-link--active" : ""
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
