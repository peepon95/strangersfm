import { Link } from "@tanstack/react-router";

/**
 * The five printed tabs on the right edge of the notebook page are covered
 * with real, clickable journal tabs. Positions are percentages of the page
 * image so they stay glued to the paper at every size.
 */
const tabs = [
  { label: "100 strangers", to: "/", top: 3.5 },
  { label: "letters", to: "/notes", top: 26 },
  { label: "write a note", to: "/submit", top: 48.5 },
  { label: "about", to: "/about", top: 71 },
] as const;

export function JournalTabs({ active }: { active?: string }) {
  return (
    <div className="absolute inset-y-0 right-[1.5%] z-20 w-[11%] min-w-[42px]">
      {tabs.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          className="group absolute right-0 flex w-full items-center justify-center rounded-r-md bg-paper shadow-[2px_2px_6px_-2px_var(--paper-shadow)] ring-1 ring-ink/10 transition-transform hover:translate-x-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          style={{ top: `${tab.top}%`, height: "21.5%" }}
        >
          <span
            className={`text-[clamp(9px,1.15vw,15px)] uppercase tracking-[0.22em] ${
              active === tab.to ? "text-ink" : "text-ink/70 group-hover:text-ink"
            }`}
            style={{ writingMode: "vertical-rl" }}
          >
            {tab.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
