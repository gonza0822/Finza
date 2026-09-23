"use client";

import { useCallback, useRef, useState, type PointerEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { authContent } from "@/lib/content/auth";

function CardChip() {
  return (
    <span className="block h-7 w-9 rounded-md bg-linear-to-br from-amber-200 to-amber-500" aria-hidden />
  );
}

/** Front of the illustrative credit card. */
function CardFront() {
  return (
    <div className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-cream/20 bg-linear-to-br from-[#1f5c58] to-[#0e2f2d] p-5 text-cream shadow-lg [backface-visibility:hidden]">
      <div className="flex items-start">
        <CardChip />
      </div>
      <p className="font-mono text-sm tracking-[0.18em]" aria-hidden>
        •••• •••• •••• 4821
      </p>
      <p className="text-sm font-semibold tracking-wide">{authContent.brand}</p>
    </div>
  );
}

/** Back of the illustrative credit card. */
function CardBack() {
  return (
    <div className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-cream/15 bg-[#0e2f2d] p-5 text-cream shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
      <div className="mt-3 h-8 rounded-sm bg-zinc-900" aria-hidden />
      <div className="flex items-center justify-end">
        <span className="rounded bg-cream px-2 py-1 font-mono text-xs text-primary">•••</span>
      </div>
      <p className="text-xs font-medium tracking-wide opacity-80">{authContent.brand}</p>
    </div>
  );
}

/** Interactive card stack: pointer tilt + click/keyboard flip. No idle loop. */
export function AuthBrandCards() {
  const shouldReduceMotion = useReducedMotion();
  const sceneRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [flipped, setFlipped] = useState(false);

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (shouldReduceMotion) {
        return;
      }
      const rect = sceneRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      setTilt({ x: py * -10, y: px * 14 });
    },
    [shouldReduceMotion],
  );

  const resetTilt = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center py-6">
      <div
        ref={sceneRef}
        className="[perspective:1000px]"
        onPointerMove={onPointerMove}
        onPointerLeave={resetTilt}
      >
        <motion.div
          className="relative h-44 w-72"
          animate={
            shouldReduceMotion ? undefined : { rotateX: tilt.x, rotateY: tilt.y }
          }
          transition={{ type: "spring", stiffness: 180, damping: 20 }}
        >
          <div
            aria-hidden
            className="absolute inset-0 translate-x-5 translate-y-4 rotate-6 rounded-2xl bg-cream/15"
          />
          <div
            aria-hidden
            className="absolute inset-0 -translate-x-3 translate-y-2 -rotate-8 rounded-2xl bg-warm/25"
          />

          <button
            type="button"
            onClick={() => setFlipped((value) => !value)}
            aria-label={authContent.brandCardsAria}
            aria-pressed={flipped}
            className="absolute inset-0 cursor-pointer rounded-2xl focus-visible:ring-2 focus-visible:ring-cream focus-visible:ring-offset-2 focus-visible:ring-offset-primary focus-visible:outline-none"
          >
            <motion.div
              className="relative h-full w-full [transform-style:preserve-3d]"
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 0.45, ease: "easeOut" }
              }
            >
              <CardFront />
              <CardBack />
            </motion.div>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
