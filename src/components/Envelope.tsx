import { motion } from "motion/react";
import { useState } from "react";
import envelope from "@/assets/envelope.png.asset.json";

/**
 * The hand-drawn air mail envelope. Tap it and a little letter
 * slides out of the top before the real note is revealed.
 */
export function Envelope({ onOpen }: { onOpen: () => void }) {
  const [opening, setOpening] = useState(false);

  function handleOpen() {
    if (opening) return;
    setOpening(true);
    window.setTimeout(onOpen, 1050);
  }

  return (
    <motion.button
      type="button"
      onClick={handleOpen}
      aria-label="Open the letter from a stranger"
      className="group relative block cursor-pointer select-none focus-visible:outline-none"
      initial={{ opacity: 0, y: 34, rotate: -6 }}
      animate={{ opacity: 1, y: 0, rotate: -2 }}
      transition={{ delay: 1.05, duration: 0.7, ease: "easeOut" }}
      whileHover={opening ? undefined : { rotate: 0.5, scale: 1.03, y: -5 }}
      whileTap={{ scale: 0.97 }}
    >
      <span className="relative block">
        {/* the little letter that pops out of the envelope */}
        <motion.span
          aria-hidden
          className="absolute inset-x-[16%] top-[6%] bottom-[30%] z-20 rounded-sm bg-card shadow-[0_10px_24px_-10px_hsl(var(--ink)/0.4)] ring-1 ring-border/70"
          initial={false}
          animate={
            opening
              ? { y: "-72%", opacity: 1, rotate: 3, scale: 1.04 }
              : { y: "30%", opacity: 0, rotate: 0, scale: 0.96 }
          }
          transition={{ type: "spring", stiffness: 110, damping: 13 }}
        >
          <span className="flex h-full items-center justify-center font-display text-3xl text-ink">
            ♡
          </span>
        </motion.span>

        {/* idle sway + dip as it opens */}
        <motion.span
          className="relative z-10 block"
          animate={
            opening
              ? { y: 22, rotate: -4, scale: 0.99 }
              : { y: [0, -5, 0], rotate: [0, -0.8, 0] }
          }
          transition={
            opening
              ? { type: "spring", stiffness: 120, damping: 13 }
              : { duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.8 }
          }
        >
          <img
            src={envelope.url}
            alt="A hand-drawn air mail envelope. To: a stranger. Open when you need it. From: someone you've never met."
            width={1536}
            height={1024}
            className="w-full max-w-lg mix-blend-multiply"
          />
        </motion.span>
      </span>
    </motion.button>
  );
}
