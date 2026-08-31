import { Link, useRouterState } from "@tanstack/react-router";

const navItems = [
  { label: "Pull a note", to: "/", color: "#c4d5dd" },
  { label: "Why I am doing this", to: "/about", color: "#d7dde0" },
  { label: "See every note", to: "/notes", color: "#e4e1d8" },
  { label: "Write a note", to: "/submit", color: "#b9cbd3" },
] as const;

export function SideNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-ink/10 bg-[#e7ecee]/95 px-4 pt-3 backdrop-blur-sm sm:px-8 sm:pt-4">
      <div className="mx-auto flex max-w-6xl items-end gap-4 sm:gap-8">
        <Link
          to="/"
          className="shrink-0 pb-3 font-type text-sm tracking-[-0.04em] text-ink sm:pb-4 sm:text-lg"
        >
          stranger.fm
        </Link>

        <nav
          aria-label="Archive sections"
          className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {navItems.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={`archive-nav-tab shrink-0 px-4 py-3 font-type text-[9px] uppercase tracking-[0.08em] text-ink transition-transform sm:px-6 sm:text-[11px] ${
                  active ? "-translate-y-1 font-bold" : "hover:-translate-y-0.5"
                }`}
                style={{ backgroundColor: item.color }}
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
