import React from "react";
import { AlertTriangle, CheckCircle2, Clock, Layers } from "lucide-react";
import { Task } from "@/types/task";

interface KanbanStatsProps {
  tasks: Task[];
}

export function KanbanStats({ tasks }: KanbanStatsProps) {
  const total = tasks.length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const highPriority = tasks.filter((t) => t.priority === "high").length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between text-muted-foreground pb-1">
          <span className="font-heading text-xs font-semibold uppercase tracking-wider text-palette-brown">
            Total Tugas
          </span>
          <Layers className="h-4 w-4 text-palette-brown" />
        </div>
        <p className="font-heading text-3xl font-bold text-palette-brown mt-1">
          {total}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between text-muted-foreground pb-1">
          <span className="font-heading text-xs font-semibold uppercase tracking-wider text-palette-olive">
            Sedang Berjalan
          </span>
          <Clock className="h-4 w-4 text-palette-olive" />
        </div>
        <p className="font-heading text-3xl font-bold text-palette-olive mt-1">
          {inProgress}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between text-muted-foreground pb-1">
          <span className="font-heading text-xs font-semibold uppercase tracking-wider text-palette-sage">
            Selesai
          </span>
          <CheckCircle2 className="h-4 w-4 text-palette-sage" />
        </div>
        <p className="font-heading text-3xl font-bold text-palette-sage mt-1">
          {done}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between text-muted-foreground pb-1">
          <span className="font-heading text-xs font-semibold uppercase tracking-wider text-[#6E3511]">
            Prioritas Tinggi
          </span>
          <AlertTriangle className="h-4 w-4 text-[#6E3511]" />
        </div>
        <p className="font-heading text-3xl font-bold text-[#6E3511] mt-1">
          {highPriority}
        </p>
      </div>
    </div>
  );
}
