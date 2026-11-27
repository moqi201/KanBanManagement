"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { taskSchema, type TaskFormValues } from "@/lib/validation/task-schema";
import { TaskPriority, TaskStatus } from "@/types/task";
import { useKanbanStore } from "@/store/kanban-store";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TaskDetailDialog() {
  const {
    selectedTask,
    isDetailOpen,
    isSubmitting,
    closeDetail,
    updateTask,
    openDeleteConfirm,
  } = useKanbanStore();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TaskFormValues & { status: TaskStatus }>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      status: "todo",
      assigned_to: "",
      due_date: "",
    },
  });

  useEffect(() => {
    if (selectedTask) {
      reset({
        title: selectedTask.title,
        description: selectedTask.description || "",
        priority: selectedTask.priority,
        status: selectedTask.status,
        assigned_to: selectedTask.assignee_name || "",
        due_date: selectedTask.due_date || "",
      });
    }
  }, [selectedTask, reset]);

  if (!selectedTask) return null;

  const currentStatus = watch("status");

  const onSubmit = async (values: TaskFormValues & { status: TaskStatus }) => {
    const success = await updateTask(selectedTask.id, {
      title: values.title,
      description: values.description,
      priority: values.priority as TaskPriority,
      status: values.status,
      due_date: values.due_date,
    });

    if (success) {
      closeDetail();
    }
  };

  return (
    <Modal
      isOpen={isDetailOpen}
      onClose={closeDetail}
      title="Detail & Edit Tugas"
      description={`ID: #${selectedTask.id.slice(-6)} • Dibuat ${
        selectedTask.created_at
          ? new Date(selectedTask.created_at).toLocaleDateString("id-ID")
          : "-"
      }`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Status Quick Switcher */}
        <div className="space-y-1.5">
          <Label required>Status Alur Kerja</Label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { value: "todo", label: "To Do" },
                { value: "in_progress", label: "In Progress" },
                { value: "done", label: "Done" },
              ] as const
            ).map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setValue("status", item.value)}
                className={`rounded-lg border py-2 text-xs font-semibold uppercase tracking-wider font-heading transition-all ${
                  currentStatus === item.value
                    ? "border-palette-olive bg-palette-olive text-palette-cream shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:bg-palette-cream/40"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-title" required>
            Judul Tugas
          </Label>
          <Input
            id="edit-title"
            error={Boolean(errors.title)}
            {...register("title")}
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-desc">Deskripsi</Label>
          <textarea
            id="edit-desc"
            rows={3}
            className="flex w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palette-olive focus-visible:ring-offset-1 font-sans"
            {...register("description")}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-priority" required>
              Prioritas
            </Label>
            <select
              id="edit-priority"
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-palette-olive"
              {...register("priority")}
            >
              <option value="low">Rendah (Low)</option>
              <option value="medium">Sedang (Medium)</option>
              <option value="high">Tinggi (High)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-due">Tenggat Waktu</Label>
            <Input id="edit-due" type="date" {...register("due_date")} />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            onClick={() => openDeleteConfirm(selectedTask)}
            disabled={isSubmitting}
            className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            Hapus Tugas
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeDetail}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="font-heading uppercase tracking-wider"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
