"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { useKanbanStore } from "@/store/kanban-store";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function DeleteTaskDialog() {
  const {
    selectedTask,
    isDeleteConfirmOpen,
    isSubmitting,
    closeDeleteConfirm,
    deleteTask,
  } = useKanbanStore();

  if (!selectedTask) return null;

  const handleDelete = async () => {
    await deleteTask(selectedTask.id);
  };

  return (
    <Modal
      isOpen={isDeleteConfirmOpen}
      onClose={closeDeleteConfirm}
      title="Konfirmasi Hapus Tugas"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3.5 text-xs text-foreground">
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              Apakah Anda yakin ingin menghapus tugas ini?
            </p>
            <p className="text-muted-foreground font-sans">
              Tugas &quot;<strong className="text-palette-brown">{selectedTask.title}</strong>&quot; akan dihapus secara permanen dari board divisi Anda. Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={closeDeleteConfirm}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="font-heading uppercase tracking-wider"
          >
            {isSubmitting ? "Menghapus..." : "Ya, Hapus Tugas"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
