import type { ReactNode } from "react";

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
    <main className="archive-stage min-h-screen px-4 pb-16 pt-28 sm:px-8 sm:pb-24 sm:pt-32">
      <section
        className={`letter-page-sheet relative mx-auto px-5 pb-10 pt-14 sm:px-10 sm:pb-14 sm:pt-16 ${
          wide ? "max-w-6xl" : "max-w-3xl"
        }`}
        style={{ borderTopColor: tabColor }}
      >
        <div className="letter-page-label font-type">
          <span aria-hidden>✉</span>
          <span>{tabLabel}</span>
        </div>
        {children}
      </section>
    </main>
  );
}
