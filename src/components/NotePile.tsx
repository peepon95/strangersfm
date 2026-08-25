import { motion } from "motion/react";
import type { Note } from "@/data/notes";

/**
 * A little pile of handwriting scraps under the jar.
 * Every note in the collection drops in with its own bounce,
 * so the pile grows visibly as new strangers are added.
 */
export function NotePile({
  notes,
  onSelect,
  startDelay = 1.6,
}: {
  notes: Note[];
  onSelect: (index: number) => void;
  startDelay?: number;
}) {
  return (
    <div className="mt-8 flex flex-wrap items-end justify-center gap-x-1 gap-y-3 sm:gap-x-2">
      {notes.map((note, i) => {
        const tilt = ((i * 37) % 13) - 6;
        const lift = (i % 3) * 4;
        return (
          <motion.button
            key={note.id}
            type="button"
            onClick={() => onSelect(i)}
            aria-label="Read this note"
            className="group relative block cursor-pointer rounded-sm bg-card p-1 shadow-[0_2px_10px_-4px_hsl(var(--ink)/0.35)] ring-1 ring-border/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            style={{ marginBottom: lift, transformOrigin: "50% 100%" }}
            initial={{ y: -220, rotate: tilt - 18, opacity: 0 }}
            animate={{
              y: [-220, 0, -18, 0, -5, 0],
              rotate: [tilt - 18, tilt + 3, tilt - 1, tilt, tilt, tilt],
              opacity: 1,
            }}
            transition={{
              duration: 1.1,
              delay: startDelay + i * 0.14,
              times: [0, 0.42, 0.6, 0.78, 0.9, 1],
              ease: "easeOut",
            }}
            whileHover={{ y: -8, rotate: 0, scale: 1.06 }}
            whileTap={{ scale: 0.96 }}
          >
            <img
              src={note.image}
              alt="Handwriting preview"
              loading="lazy"
              className="h-14 w-20 object-contain sm:h-16 sm:w-24"
            />
          </motion.button>
        );
      })}
    </div>
  );
}
