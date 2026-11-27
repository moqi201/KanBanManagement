"use client";

import React from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useToastStore, ToastType } from "@/store/toast-store";

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-palette-cream" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive-foreground" />;
      case "info":
        return <Info className="h-4 w-4 text-palette-cream" />;
    }
  };

  const getIconBg = (type: ToastType) => {
    switch (type) {
      case "success":
        return "bg-palette-olive";
      case "error":
        return "bg-destructive";
      case "info":
        return "bg-palette-sage";
    }
  };

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return "border-palette-olive/40";
      case "error":
        return "border-destructive/40";
      case "info":
        return "border-palette-sage/40";
    }
  };

  return (
    <div
      aria-live="polite"
      aria-label="Pemberitahuan Sistem"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0 pointer-events-none"
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          role="status"
          className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-card p-3.5 text-xs text-foreground shadow-lg transition-all animate-in slide-in-from-bottom-2 duration-200 ${getBorderColor(
            item.type
          )}`}
        >
          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${getIconBg(
              item.type
            )}`}
          >
            {getIcon(item.type)}
          </div>

          <div className="flex-1 pt-0.5">
            <p className="font-semibold text-palette-brown font-heading uppercase tracking-wide text-[11px]">
              {item.type === "success"
                ? "Berhasil"
                : item.type === "error"
                ? "Gagal"
                : "Informasi"}
            </p>
            <p className="mt-0.5 text-muted-foreground font-sans leading-normal">
              {item.message}
            </p>
          </div>

          <button
            type="button"
            onClick={() => removeToast(item.id)}
            aria-label="Tutup notifikasi"
            className="text-muted-foreground hover:text-foreground p-1 transition-colors rounded-md"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
