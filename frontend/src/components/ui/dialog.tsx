"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}: ModalProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#6E3511]/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Dialog Surface */}
      <div
        className={cn(
          "relative w-full max-w-lg rounded-xl border border-border bg-card p-6 text-card-foreground shadow-lg transition-all z-10 max-h-[90vh] overflow-y-auto",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2
              id="modal-title"
              className="font-heading text-xl font-bold uppercase tracking-wide text-palette-brown"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="rounded-lg p-1 text-muted-foreground hover:bg-palette-cream/50 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palette-olive"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="pt-4">{children}</div>
      </div>
    </div>
  );
}
