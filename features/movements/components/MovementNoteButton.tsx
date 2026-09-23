"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { StickyNote, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { movementsContent } from "@/lib/content/movements";

interface MovementNoteButtonProps {
  note: string;
  title: string;
}

/** Icon in the book row; the note itself opens in a modal so the table stays compact. */
export function MovementNoteButton({ note, title }: MovementNoteButtonProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" as const };

  const wasOpen = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      if (wasOpen.current) {
        triggerRef.current?.focus();
        wasOpen.current = false;
      }
      return undefined;
    }
    wasOpen.current = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusClose = window.requestAnimationFrame(() => {
      closeRef.current?.focus();
    });
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusClose);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function close() {
    setOpen(false);
  }

  const modal =
    mounted &&
    createPortal(
      <AnimatePresence>
        {open ? (
          <div key="note-modal" className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.button
              type="button"
              aria-label={movementsContent.closeNote}
              className="absolute inset-0 cursor-pointer bg-primary/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transition}
              onClick={close}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="relative z-10 w-full max-w-md rounded-3xl border border-primary/10 bg-surface p-6 shadow-lg"
              initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
              transition={transition}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 id={titleId} className="text-lg font-semibold text-foreground">
                  {title}
                </h2>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={close}
                  aria-label={movementsContent.closeNote}
                  className="cursor-pointer rounded-xl p-2 text-primary transition-colors duration-200 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-base leading-7 text-foreground">{note}</p>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>,
      document.body,
    );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={movementsContent.viewNote}
        className="cursor-pointer rounded-xl p-2 text-primary transition-colors duration-200 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        <StickyNote className="size-5" aria-hidden />
      </button>
      {modal}
    </>
  );
}
