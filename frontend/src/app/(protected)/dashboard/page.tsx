"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Calendar, LogOut, Menu, Plus, Users } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useKanbanStore } from "@/store/kanban-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KanbanStats } from "@/components/kanban/kanban-stats";
import { KanbanFilterBar } from "@/components/kanban/kanban-filter-bar";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import { CreateTaskDialog } from "@/components/task/create-task-dialog";
import { TaskDetailDialog } from "@/components/task/task-detail-dialog";
import { DeleteTaskDialog } from "@/components/task/delete-task-dialog";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { AppFooter } from "@/components/layout/app-footer";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isCheckingSession, logout } = useAuthStore();
  const { tasks, isLoading, error, fetchTasks, openCreate, onlyMyTasks } = useKanbanStore();
  const [currentDate, setCurrentDate] = useState("");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  useEffect(() => {
    setCurrentDate(
      new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    );
  }, []);

  useEffect(() => {
    if (!isCheckingSession && !isAuthenticated) {
      router.push("/login");
    }
  }, [isCheckingSession, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
    }
  }, [isAuthenticated, fetchTasks]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground font-sans">
        Memeriksa sesi login...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "KM";

  const displayTasks =
    onlyMyTasks && user
      ? tasks.filter(
          (t) =>
            t.assigned_to === user.id ||
            (t.assignee_name &&
              t.assignee_name.toLowerCase() === user.name.toLowerCase())
        )
      : tasks;

  const todoTasks = displayTasks.filter((t) => t.status === "todo");
  const inProgressTasks = displayTasks.filter((t) => t.status === "in_progress");
  const doneTasks = displayTasks.filter((t) => t.status === "done");

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="border-b border-border bg-card px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          {/* Left Brand & Division Info */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-palette-olive text-palette-cream font-heading font-bold text-sm shadow-sm">
              KM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-lg font-bold uppercase tracking-wide text-palette-brown">
                  Kanban Board
                </h1>
                <Badge
                  variant={
                    user.division_id === "div-marketing" ? "marketing" : "it"
                  }
                >
                  {user.division_name || user.division_id}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground capitalize font-sans">
                {user.role} Divisi
              </p>
            </div>
          </div>

          {/* Center Context Date & Active Tasks Widget (Visible on >= 850px) */}
          <div className="hidden nav:flex items-center gap-2.5 rounded-full border border-border bg-palette-cream/35 px-4 py-1 text-xs text-muted-foreground font-sans">
            <div className="flex items-center gap-1.5 text-palette-brown">
              <Calendar className="h-3.5 w-3.5 text-palette-brown" />
              <time className="font-medium">{currentDate}</time>
            </div>
            <span className="text-border">•</span>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-palette-olive" />
              <span className="font-heading font-bold uppercase tracking-wider text-palette-olive">
                {inProgressTasks.length}
              </span>
              <span>Tugas Berjalan</span>
            </div>
          </div>

          {/* Right User Profile Pill & Actions (Desktop >= 850px) */}
          <div className="hidden nav:flex items-center gap-2.5">
            {user.role === "admin" && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs font-heading uppercase tracking-wider"
              >
                <Link href="/members">
                  <Users className="h-3.5 w-3.5" />
                  Kelola Anggota
                </Link>
              </Button>
            )}

            {/* Avatar Pill */}
            <div className="flex items-center gap-2.5 rounded-full border border-border bg-card py-1 pl-1.5 pr-3.5 shadow-sm">
              <div className="relative">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-palette-olive text-palette-cream text-xs font-bold font-heading uppercase">
                  {initials}
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-600"
                  title="Status: Aktif / Online"
                  aria-label="Status: Aktif / Online"
                />
              </div>

              <div className="text-left">
                <p className="text-xs font-semibold leading-tight text-palette-brown">
                  {user.name}
                </p>
                <p className="text-[10px] text-muted-foreground capitalize leading-tight font-sans">
                  {user.role} • {user.division_name || user.division_id}
                </p>
              </div>
            </div>

            {/* Cohesive Integrated Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="h-8 gap-1.5 rounded-lg px-2.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Keluar dari akun"
              aria-label="Keluar dari akun"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar</span>
            </Button>
          </div>

          {/* Right Mobile Hamburger Button (Active on < 850px) */}
          <div className="flex nav:hidden items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="h-9 px-3 gap-1.5 text-xs font-heading uppercase tracking-wider border-border bg-card shadow-sm hover:bg-palette-cream/40"
              aria-label="Buka menu navigasi"
            >
              <Menu className="h-4 w-4 text-palette-brown" />
              <span className="text-palette-brown font-bold">Menu</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="mx-auto max-w-7xl p-4 sm:p-6 space-y-6">
        {/* Workspace Title & Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-wider text-palette-brown">
              Papan Kerja {user.division_name || user.division_id}
            </h2>
            <p className="text-sm text-muted-foreground">
              Kelola tugas, delegasikan pekerjaan, dan perbarui progres divisi
              secara langsung.
            </p>
          </div>

          <Button
            onClick={openCreate}
            className="gap-2 font-heading uppercase text-xs tracking-wider shrink-0"
          >
            <Plus className="h-4 w-4" />
            Tambah Tugas
          </Button>
        </div>

        {/* Metric Statistics */}
        <KanbanStats tasks={displayTasks} />

        {/* Filter & Search Bar */}
        <KanbanFilterBar />

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 3 Columns Kanban Board */}
        {isLoading && tasks.length === 0 ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {[1, 2, 3].map((col) => (
              <div
                key={col}
                className="h-[400px] rounded-xl border border-border bg-palette-cream/20 animate-pulse p-4"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 items-start">
            <KanbanColumn
              status="todo"
              title="To Do"
              tasks={todoTasks}
              count={todoTasks.length}
            />
            <KanbanColumn
              status="in_progress"
              title="In Progress"
              tasks={inProgressTasks}
              count={inProgressTasks.length}
            />
            <KanbanColumn
              status="done"
              title="Done"
              tasks={doneTasks}
              count={doneTasks.length}
            />
          </div>
        )}
      </main>

      {/* Micro-Footer Status Bar */}
      <AppFooter divisionName={user.division_name || user.division_id} />

      {/* CRUD Modals */}
      <CreateTaskDialog />
      <TaskDetailDialog />
      <DeleteTaskDialog />

      {/* Mobile Slide-over Drawer (< 850px) */}
      <MobileNavDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        user={user}
        currentDate={currentDate}
        activeTasksCount={inProgressTasks.length}
        onOpenCreateTask={openCreate}
        onLogout={handleLogout}
      />
    </div>
  );
}
