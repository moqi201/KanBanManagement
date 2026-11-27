"use client";

import React from "react";
import { Shield, ShieldAlert, UserCheck, UserX } from "lucide-react";
import { Member } from "@/types/member";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MemberTableProps {
  members: Member[];
  currentUserId: string;
  onToggleStatus: (member: Member) => Promise<void>;
  onToggleRole: (member: Member) => Promise<void>;
  isUpdating: string | null;
}

export function MemberTable({
  members,
  currentUserId,
  onToggleStatus,
  onToggleRole,
  isUpdating,
}: MemberTableProps) {
  if (members.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
        Tidak ditemukan anggota yang sesuai pencarian.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-palette-cream/30 text-xs font-semibold uppercase tracking-wider text-palette-brown font-heading">
          <tr>
            <th className="px-4 py-3.5 sm:px-6">Anggota</th>
            <th className="px-4 py-3.5">Email</th>
            <th className="px-4 py-3.5">Role</th>
            <th className="px-4 py-3.5">Status</th>
            <th className="px-4 py-3.5 text-right sm:px-6">Aksi Kelola</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border font-sans">
          {members.map((member) => {
            const isSelf = member.id === currentUserId;
            const isBusy = isUpdating === member.id;

            return (
              <tr
                key={member.id}
                className="hover:bg-palette-cream/15 transition-colors"
              >
                {/* Name & Avatar */}
                <td className="px-4 py-3.5 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-palette-olive text-palette-cream text-xs font-bold font-heading uppercase">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {member.name}
                        </span>
                        {isSelf && (
                          <span className="rounded bg-palette-sage/20 px-1.5 py-0.5 text-[10px] font-semibold text-palette-brown uppercase">
                            Anda
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground sm:hidden">
                        {member.email}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Email */}
                <td className="hidden px-4 py-3.5 text-muted-foreground sm:table-cell">
                  {member.email}
                </td>

                {/* Role */}
                <td className="px-4 py-3.5">
                  <Badge
                    variant={member.role === "admin" ? "it" : "marketing"}
                    className="capitalize"
                  >
                    {member.role}
                  </Badge>
                </td>

                {/* Status */}
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                      member.status === "active"
                        ? "bg-palette-olive/15 text-palette-olive"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        member.status === "active" ? "bg-palette-olive" : "bg-muted-foreground"
                      }`}
                    />
                    {member.status === "active" ? "Aktif" : "Nonaktif"}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5 text-right sm:px-6">
                  {!isSelf ? (
                    <div className="flex items-center justify-end gap-2">
                      {/* Toggle Role */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => onToggleRole(member)}
                        className="text-xs h-8"
                        title={
                          member.role === "admin"
                            ? "Ubah jadi Member"
                            : "Jadikan Admin"
                        }
                      >
                        {member.role === "admin" ? (
                          <>
                            <ShieldAlert className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            <span className="hidden md:inline">Jadikan Member</span>
                          </>
                        ) : (
                          <>
                            <Shield className="h-3.5 w-3.5 mr-1 text-palette-olive" />
                            <span className="hidden md:inline">Jadikan Admin</span>
                          </>
                        )}
                      </Button>

                      {/* Toggle Status */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => onToggleStatus(member)}
                        className={`text-xs h-8 ${
                          member.status === "active"
                            ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
                            : "text-palette-olive hover:bg-palette-olive/10 hover:text-palette-olive"
                        }`}
                      >
                        {member.status === "active" ? (
                          <>
                            <UserX className="h-3.5 w-3.5 mr-1" />
                            <span>Nonaktifkan</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-3.5 w-3.5 mr-1" />
                            <span>Aktifkan</span>
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      Akun Aktif
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
