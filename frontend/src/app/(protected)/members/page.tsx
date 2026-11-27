"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  LogOut,
  Menu,
  Plus,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { memberApi } from "@/services/member-api";
import { Member } from "@/types/member";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AddMemberDialog } from "@/components/members/add-member-dialog";
import { MemberTable } from "@/components/members/member-table";
import { MemberFormValues } from "@/lib/validation/member-schema";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { AppFooter } from "@/components/layout/app-footer";
import { toast } from "@/store/toast-store";

export default function MembersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isCheckingSession, logout } = useAuthStore();

  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await memberApi.getMembers();
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat anggota");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isCheckingSession && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (isAuthenticated && user?.role === "admin") {
      fetchMembers();
    }
  }, [isCheckingSession, isAuthenticated, user, router, fetchMembers]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleAddMember = async (values: MemberFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await memberApi.addMember({
        name: values.name,
        email: values.email,
        role: values.role,
      });
      await fetchMembers();
      setIsSubmitting(false);
      toast.success(`Anggota "${values.name}" berhasil ditambahkan`);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal menambahkan anggota";
      setError(msg);
      setIsSubmitting(false);
      toast.error(msg);
      return false;
    }
  };

  const handleToggleStatus = async (member: Member) => {
    const nextStatus = member.status === "active" ? "inactive" : "active";
    setIsUpdatingId(member.id);
    try {
      await memberApi.updateMemberStatus(member.id, nextStatus);
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, status: nextStatus } : m))
      );
      toast.success(
        `Status ${member.name} diubah menjadi ${
          nextStatus === "active" ? "Aktif" : "Nonaktif"
        }`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal mengubah status";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsUpdatingId(null);
    }
  };

  const handleToggleRole = async (member: Member) => {
    const nextRole = member.role === "admin" ? "member" : "admin";
    setIsUpdatingId(member.id);
    try {
      await memberApi.updateMember(member.id, { role: nextRole });
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, role: nextRole } : m))
      );
      toast.success(
        `Role ${member.name} diubah menjadi ${
          nextRole === "admin" ? "Admin" : "Member"
        }`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal mengubah role";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsUpdatingId(null);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground font-sans">
        Memeriksa hak akses...
      </div>
    );
  }

  if (!user) return null;

  // Role Authorization Check: 403 Forbidden Screen for Regular Member
  if (user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-xl border border-destructive/30 bg-card p-6 text-center shadow-sm space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="font-heading text-xl font-bold uppercase tracking-wide text-palette-brown">
            Akses Terbatas (403 Forbidden)
          </h2>
          <p className="text-xs text-muted-foreground font-sans leading-relaxed">
            Halaman Manajemen Anggota hanya dapat diakses oleh <strong>Admin Divisi</strong>. Akun Anda saat ini terdaftar sebagai <strong>{user.role}</strong> di divisi {user.division_name || user.division_id}.
          </p>
          <Button asChild className="w-full font-heading uppercase tracking-wider">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Board Kanban
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="border-b border-border bg-card px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                <span>Papan Kanban</span>
              </Link>
            </Button>
            <div className="h-4 w-[1px] bg-border" />
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-lg font-bold uppercase tracking-wide text-palette-brown">
                Manajemen Anggota
              </h1>
              <Badge variant={user.division_id === "div-marketing" ? "marketing" : "it"}>
                {user.division_name || user.division_id}
              </Badge>
            </div>
          </div>

          {/* Right Desktop Actions (>= 850px) */}
          <div className="hidden nav:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-palette-brown">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">Admin Divisi</p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-3.5 w-3.5" />
              Keluar
            </Button>
          </div>

          {/* Right Mobile Hamburger Button (< 850px) */}
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
        {/* Workspace Title & Add Member Action */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-wider text-palette-brown">
              Daftar Anggota Divisi {user.division_name || user.division_id}
            </h2>
            <p className="text-sm text-muted-foreground font-sans">
              Kelola hak akses dan status keaktifan anggota di tim divisi Anda.
            </p>
          </div>

          <Button
            onClick={() => setIsAddOpen(true)}
            className="gap-2 font-heading uppercase text-xs tracking-wider shrink-0"
          >
            <Plus className="h-4 w-4" />
            Tambah Anggota
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari anggota berdasarkan nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

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

        {/* Member Table */}
        {isLoading ? (
          <div className="h-48 rounded-xl border border-border bg-card p-6 animate-pulse" />
        ) : (
          <MemberTable
            members={filteredMembers}
            currentUserId={user.id}
            onToggleStatus={handleToggleStatus}
            onToggleRole={handleToggleRole}
            isUpdating={isUpdatingId}
          />
        )}
      </main>

      {/* Micro-Footer Status Bar */}
      <AppFooter divisionName={user.division_name || user.division_id} />

      {/* Add Member Dialog */}
      <AddMemberDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAddMember}
        isSubmitting={isSubmitting}
        divisionName={user.division_name || user.division_id}
      />

      {/* Mobile Slide-over Drawer (< 850px) */}
      <MobileNavDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        user={user}
        onLogout={handleLogout}
      />
    </div>
  );
}
