import type { ReactNode } from "react";
import { FileHeart, Minus, Sparkles, X } from "lucide-react";

export function ArchivePageShell({
  tabLabel,
  tabColor,
  wide = false,
  children,
}: {
  tabLabel: string;
  tabColor: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <main className="retro-desktop min-h-screen px-4 pb-28 pt-8 sm:px-8 sm:pb-32 sm:pt-12">
      <section className={`retro-window relative mx-auto ${wide ? "max-w-6xl" : "max-w-3xl"}`}>
        <div className="retro-titlebar">
          <span className="flex min-w-0 items-center gap-2">
            <FileHeart aria-hidden className="h-4 w-4 shrink-0" />
            <span className="truncate">stranger.fm / {tabLabel}</span>
          </span>
          <span className="retro-window-controls" aria-hidden>
            <span>
              <Minus />
            </span>
            <span>
              <Sparkles />
            </span>
            <span>
              <X />
            </span>
          </span>
        </div>
        <div
          className="archive-page-sheet min-h-[70svh] border-0 px-5 pb-10 pt-10 shadow-none sm:px-10 sm:pb-14 sm:pt-14"
          style={{ borderTop: `6px solid ${tabColor}` }}
        >
          {children}
        </div>
      </section>
    </main>
  );
}
