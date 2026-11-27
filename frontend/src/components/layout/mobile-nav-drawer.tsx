"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Kanban,
  LogOut,
  Plus,
  Users,
  X,
} from "lucide-react";
import { User } from "@/types/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  currentDate?: string;
  activeTasksCount?: number;
  onOpenCreateTask?: () => void;
  onLogout: () => void;
}

export function MobileNavDrawer({
  isOpen,
  onClose,
  user,
  currentDate,
  activeTasksCount = 0,
  onOpenCreateTask,
  onLogout,
}: MobileNavDrawerProps) {
  useEffect(() => {
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

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu Navigasi Mobile"
      className="fixed inset-0 z-50 flex justify-end"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#6E3511]/40 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative z-10 flex h-full w-[310px] sm:w-[350px] max-w-[85vw] flex-col justify-between border-l border-border bg-card p-5 text-card-foreground shadow-2xl transition-transform duration-300 ease-out">
        {/* Drawer Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-palette-olive text-palette-cream font-heading font-bold text-xs">
                KM
              </div>
              <span className="font-heading text-sm font-bold uppercase tracking-wider text-palette-brown">
                Kanban Portal
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup menu navigasi"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-palette-cream/50 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palette-olive"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="rounded-xl border border-border bg-palette-cream/25 p-3.5 space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-palette-olive text-palette-cream text-sm font-bold font-heading uppercase shadow-sm">
                  {initials}
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-600"
                  title="Status: Aktif"
                  aria-label="Status: Aktif"
                />
              </div>

              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate text-palette-brown">
                  {user.name}
                </p>
                <p className="text-xs truncate text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-border/60">
              <Badge
                variant={user.division_id === "div-marketing" ? "marketing" : "it"}
              >
                {user.division_name || user.division_id}
              </Badge>
              <span className="text-xs capitalize text-muted-foreground font-sans">
                {user.role} Divisi
              </span>
            </div>
          </div>

          {/* Context Date & Active Tasks Info */}
          {currentDate && (
            <div className="rounded-lg border border-border bg-card p-3 space-y-1.5 text-xs text-muted-foreground font-sans">
              <div className="flex items-center gap-2 text-palette-brown">
                <Calendar className="h-4 w-4 shrink-0 text-palette-brown" />
                <time className="font-medium">{currentDate}</time>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                <span className="h-2 w-2 rounded-full bg-palette-olive" />
                <span>
                  <strong className="font-heading font-bold text-palette-olive uppercase tracking-wider">
                    {activeTasksCount}
                  </strong>{" "}
                  tugas sedang berjalan
                </span>
              </div>
            </div>
          )}

          {/* Navigation Action Links */}
          <div className="space-y-2 pt-2">
            <Button
              asChild
              variant="outline"
              className="w-full justify-start gap-2.5 text-xs font-heading uppercase tracking-wider h-10"
              onClick={onClose}
            >
              <Link href="/dashboard">
                <Kanban className="h-4 w-4 text-palette-olive" />
                <span>Papan Kanban</span>
              </Link>
            </Button>

            {user.role === "admin" && (
              <Button
                asChild
                variant="outline"
                className="w-full justify-start gap-2.5 text-xs font-heading uppercase tracking-wider h-10"
                onClick={onClose}
              >
                <Link href="/members">
                  <Users className="h-4 w-4 text-palette-brown" />
                  <span>Kelola Anggota</span>
                </Link>
              </Button>
            )}

            {onOpenCreateTask && (
              <Button
                type="button"
                className="w-full justify-start gap-2.5 text-xs font-heading uppercase tracking-wider h-10 mt-1"
                onClick={() => {
                  onClose();
                  onOpenCreateTask();
                }}
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Tugas Baru</span>
              </Button>
            )}
          </div>
        </div>

        {/* Drawer Footer (Logout) */}
        <div className="pt-4 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full justify-center gap-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive h-10 font-heading uppercase tracking-wider"
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar dari Akun</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
