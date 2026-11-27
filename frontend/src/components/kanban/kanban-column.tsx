import React, { useState } from "react";
import { CheckCircle2, Clock, ListTodo } from "lucide-react";
import { Task, TaskStatus } from "@/types/task";
import { TaskCard } from "./task-card";
import { useKanbanStore } from "@/store/kanban-store";

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  count: number;
}

export function KanbanColumn({ status, title, tasks, count }: KanbanColumnProps) {
  const { moveTaskStatus } = useKanbanStore();
  const [isDragOver, setIsDragOver] = useState(false);

  const getHeaderIcon = () => {
    switch (status) {
      case "todo":
        return <ListTodo className="h-4 w-4 text-palette-brown" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-palette-olive" />;
      case "done":
        return <CheckCircle2 className="h-4 w-4 text-palette-sage" />;
    }
  };

  const getBorderAccent = () => {
    switch (status) {
      case "todo":
        return "border-palette-brown/30";
      case "in_progress":
        return "border-palette-olive/40";
      case "done":
        return "border-palette-sage/50";
    }
  };

  return (
    <section
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!isDragOver) setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragOver(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const taskId = e.dataTransfer.getData("text/plain");
        if (taskId) {
          moveTaskStatus(taskId, status);
        }
      }}
      className={`flex flex-col rounded-xl border p-3 sm:p-4 transition-all duration-200 ${
        isDragOver
          ? "border-palette-olive ring-2 ring-palette-olive/40 bg-palette-sage/15"
          : "border-border bg-palette-cream/25"
      }`}
    >
      {/* Column Header */}
      <div
        className={`flex items-center justify-between border-b pb-3 mb-3 ${getBorderAccent()}`}
      >
        <div className="flex items-center gap-2">
          {getHeaderIcon()}
          <h3 className="font-heading text-base font-bold uppercase tracking-wider text-palette-brown">
            {title}
          </h3>
        </div>
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-card px-1.5 text-xs font-semibold text-palette-brown shadow-sm border border-border">
          {count}
        </span>
      </div>

      {/* Task List */}
      <div className="flex flex-col gap-3 min-h-[350px]">
        {/* Drop Zone Banner when hovering */}
        {isDragOver && (
          <div className="rounded-lg border-2 border-dashed border-palette-olive bg-palette-olive/10 p-3 text-center text-xs font-semibold text-palette-olive transition-all animate-pulse">
            Lepas kartu di sini untuk memindahkan ke {title}
          </div>
        )}

        {tasks.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border/80 p-6 text-center">
            <p className="text-xs font-medium text-muted-foreground">
              Tidak ada tugas di kolom ini.
            </p>
          </div>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </section>
  );
}
