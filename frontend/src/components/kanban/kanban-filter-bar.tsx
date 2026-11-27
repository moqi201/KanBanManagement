import React from "react";
import { RotateCw, Search, User, X } from "lucide-react";
import { useKanbanStore } from "@/store/kanban-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function KanbanFilterBar() {
  const {
    search,
    statusFilter,
    priorityFilter,
    onlyMyTasks,
    isLoading,
    setSearch,
    setStatusFilter,
    setPriorityFilter,
    toggleOnlyMyTasks,
    resetFilters,
    fetchTasks,
  } = useKanbanStore();

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    onlyMyTasks;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Cari tugas berdasarkan judul atau deskripsi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-9"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Selects & Actions */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Only My Tasks Toggle Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleOnlyMyTasks}
          className={`gap-1.5 text-xs font-heading uppercase tracking-wider transition-all shadow-sm ${
            onlyMyTasks
              ? "bg-palette-olive text-palette-cream border-palette-olive hover:bg-palette-olive/90 hover:text-palette-cream"
              : "border-border bg-card text-palette-brown hover:bg-palette-cream/40"
          }`}
          aria-pressed={onlyMyTasks}
        >
          <User className="h-3.5 w-3.5" />
          <span>Tugas Saya</span>
        </Button>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter status"
          className="h-10 rounded-lg border border-border bg-card px-3 text-xs font-semibold uppercase tracking-wider text-palette-brown shadow-sm focus:outline-none focus:ring-2 focus:ring-palette-olive font-heading cursor-pointer"
        >
          <option value="all">Semua Status</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          aria-label="Filter prioritas"
          className="h-10 rounded-lg border border-border bg-card px-3 text-xs font-semibold uppercase tracking-wider text-palette-brown shadow-sm focus:outline-none focus:ring-2 focus:ring-palette-olive font-heading cursor-pointer"
        >
          <option value="all">Semua Prioritas</option>
          <option value="high">Tinggi (High)</option>
          <option value="medium">Sedang (Medium)</option>
          <option value="low">Rendah (Low)</option>
        </select>

        {/* Reset Button */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Reset Filter
          </Button>
        )}

        {/* Refresh Button */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fetchTasks()}
          disabled={isLoading}
          title="Muat Ulang Data"
          aria-label="Muat Ulang Data"
          className="shrink-0"
        >
          <RotateCw className={`h-4 w-4 ${isLoading ? "animate-spin text-palette-olive" : ""}`} />
        </Button>
      </div>
    </div>
  );
}
