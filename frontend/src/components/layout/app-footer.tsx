import React from "react";

interface AppFooterProps {
  divisionName?: string;
}

export function AppFooter({ divisionName }: AppFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card/60 px-4 py-3 sm:px-6 mt-12 transition-colors">
      <div className="mx-auto flex max-w-7xl flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground font-sans">
        {/* Left: Live Connection & Sync Status */}
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
          </span>
          <span className="font-medium text-palette-brown">
            Sistem Aktif & Tersinkron
          </span>
          {divisionName && (
            <span className="hidden md:inline text-muted-foreground">
              • Divisi {divisionName}
            </span>
          )}
        </div>

        {/* Center: Keyboard Shortcut Assistance (Desktop / Tablet) */}
        <div className="hidden lg:flex items-center gap-1.5 text-muted-foreground">
          <span>Tips: Gunakan tombol</span>
          <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-mono font-semibold text-palette-brown shadow-2xs">
            Esc
          </kbd>
          <span>untuk menutup dialog kapan saja</span>
        </div>

        {/* Right: Product & Version Label */}
        <div className="flex items-center justify-center sm:justify-end gap-2 text-center sm:text-right">
          <span>&copy; {currentYear} Kanban Portal</span>
          <span className="text-border">•</span>
          <span className="font-heading font-semibold uppercase tracking-wider text-palette-olive">
            v1.0.0
          </span>
        </div>
      </div>
    </footer>
  );
}
