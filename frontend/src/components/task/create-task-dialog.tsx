"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskSchema, type TaskFormValues } from "@/lib/validation/task-schema";
import { useKanbanStore } from "@/store/kanban-store";
import { useAuthStore } from "@/store/auth-store";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateTaskDialog() {
  const { isCreateOpen, isSubmitting, addTask, closeCreate } = useKanbanStore();
  const { user } = useAuthStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      assigned_to: user?.name || "",
      due_date: "",
    },
  });

  const onSubmit = async (values: TaskFormValues) => {
    const success = await addTask({
      title: values.title,
      description: values.description,
      priority: values.priority,
      assigned_to: user?.id,
      due_date: values.due_date,
    });

    if (success) {
      reset();
    }
  };

  const handleClose = () => {
    reset();
    closeCreate();
  };

  return (
    <Modal
      isOpen={isCreateOpen}
      onClose={handleClose}
      title="Tambah Tugas Baru"
      description={`Buat tugas baru untuk divisi ${user?.division_name || user?.division_id}.`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="create-title" required>
            Judul Tugas
          </Label>
          <Input
            id="create-title"
            placeholder="Contoh: Optimasi Halaman Landing Page"
            error={Boolean(errors.title)}
            {...register("title")}
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="create-desc">Deskripsi Tugas</Label>
          <textarea
            id="create-desc"
            rows={3}
            placeholder="Rincian informasi atau instruksi pelaksanaan tugas..."
            className="flex w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palette-olive focus-visible:ring-offset-1 font-sans"
            {...register("description")}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="create-priority" required>
              Tingkat Prioritas
            </Label>
            <select
              id="create-priority"
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-palette-olive"
              {...register("priority")}
            >
              <option value="low">Rendah (Low)</option>
              <option value="medium">Sedang (Medium)</option>
              <option value="high">Tinggi (High)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-due">Tenggat Waktu (Due Date)</Label>
            <Input
              id="create-due"
              type="date"
              {...register("due_date")}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="font-heading uppercase tracking-wider"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Tugas"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
