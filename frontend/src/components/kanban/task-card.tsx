import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Calendar, Check, Edit3, GripVertical } from "lucide-react";
import { Task } from "@/types/task";
import { Badge } from "@/components/ui/badge";
import { useKanbanStore } from "@/store/kanban-store";

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const { openDetail, moveTaskStatus } = useKanbanStore();
  const [isDragging, setIsDragging] = useState(false);

  const getPriorityVariant = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return "priorityHigh";
      case "medium":
        return "priorityMedium";
      case "low":
        return "priorityLow";
      default:
        return "outline";
    }
  };

  const formattedDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      })
    : null;

  return (
    <article
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
        setIsDragging(true);
      }}
      onDragEnd={() => setIsDragging(false)}
      className={`group relative rounded-xl border bg-card p-4 shadow-sm transition-all select-none ${
        isDragging
          ? "opacity-40 border-palette-olive border-dashed scale-[0.98]"
          : "border-border hover:border-palette-sage/60 hover:shadow-md cursor-grab active:cursor-grabbing"
      }`}
    >
      {/* Priority, Grip Indicator & Due Date Header */}
      <div className="flex items-start justify-between gap-2 pb-2">
        <div className="flex items-center gap-1.5">
          <span
            className="text-muted-foreground/50 group-hover:text-palette-brown transition-colors"
            title="Tarik untuk memindahkan tugas"
            aria-label="Tarik untuk memindahkan tugas"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </span>
          <Badge variant={getPriorityVariant(task.priority)}>
            {task.priority}
          </Badge>
        </div>
        {formattedDate && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{formattedDate}</span>
          </div>
        )}
      </div>

      {/* Title & Description (Clickable to open Detail) */}
      <div
        onClick={() => openDetail(task)}
        className="cursor-pointer space-y-1.5 focus:outline-none"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openDetail(task);
          }
        }}
      >
        <h4 className="text-sm font-semibold text-foreground leading-snug group-hover:text-palette-brown transition-colors">
          {task.title}
        </h4>

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-sans">
            {task.description}
          </p>
        )}
      </div>

      {/* Footer Info & Quick Status Actions */}
      <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-palette-sage/20 text-[10px] font-bold text-palette-brown uppercase">
              {task.assignee_name ? task.assignee_name.charAt(0) : "U"}
            </div>
            <span className="truncate max-w-[120px] font-medium text-palette-brown">
              {task.assignee_name || "Unassigned"}
            </span>
          </div>

          <button
            type="button"
            draggable={false}
            onClick={(e) => {
              e.stopPropagation();
              openDetail(task);
            }}
            className="flex items-center gap-1 text-[11px] text-palette-olive hover:underline"
            title="Edit Detail"
            aria-label="Edit Detail Tugas"
          >
            <Edit3 className="h-3 w-3" />
            <span>Detail</span>
          </button>
        </div>

        {/* Quick Transition Bar */}
        <div className="flex items-center justify-between pt-1 gap-1 text-[11px]">
          {task.status === "todo" && (
            <button
              type="button"
              draggable={false}
              onClick={(e) => {
                e.stopPropagation();
                moveTaskStatus(task.id, "in_progress");
              }}
              className="ml-auto inline-flex items-center gap-1 rounded bg-palette-olive/10 px-2 py-1 font-semibold text-palette-olive hover:bg-palette-olive/20 transition-colors"
            >
              <span>Mulai</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          )}

          {task.status === "in_progress" && (
            <>
              <button
                type="button"
                draggable={false}
                onClick={(e) => {
                  e.stopPropagation();
                  moveTaskStatus(task.id, "todo");
                }}
                className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>To Do</span>
              </button>
              <button
                type="button"
                draggable={false}
                onClick={(e) => {
                  e.stopPropagation();
                  moveTaskStatus(task.id, "done");
                }}
                className="inline-flex items-center gap-1 rounded bg-palette-sage/20 px-2 py-1 font-semibold text-palette-brown hover:bg-palette-sage/30 transition-colors"
              >
                <span>Selesai</span>
                <Check className="h-3 w-3" />
              </button>
            </>
          )}

          {task.status === "done" && (
            <button
              type="button"
              draggable={false}
              onClick={(e) => {
                e.stopPropagation();
                moveTaskStatus(task.id, "in_progress");
              }}
              className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Kembalikan ke Progress</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
