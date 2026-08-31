import { Link, useRouterState } from "@tanstack/react-router";
import { Archive, FolderOpen, Home, NotebookPen, Radio } from "lucide-react";

const navItems = [
  { label: "Pull a note", to: "/", icon: Radio },
  { label: "Why this exists", to: "/about", icon: FolderOpen },
  { label: "Every note", to: "/notes", icon: Archive },
  { label: "Write a note", to: "/submit", icon: NotebookPen },
] as const;

export function SideNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <header className="retro-taskbar">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Link
          to="/"
          aria-label="Back to the Stranger FM desktop"
          className="retro-start-button shrink-0"
        >
          <Home aria-hidden className="h-4 w-4" />
          <span className="hidden sm:inline">desktop</span>
        </Link>

        <nav
          aria-label="Archive sections"
          className="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {navItems.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={`retro-task-button shrink-0 ${
                  active ? "bg-[#f6f0df] font-bold" : "bg-[#dedbd3] hover:bg-[#f0ede4]"
                }`}
              >
                <Icon aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
