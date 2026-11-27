import { create } from "zustand";
import { CreateTaskInput, Task, TaskFilters, TaskPriority, TaskStatus, UpdateTaskInput } from "@/types/task";
import { taskApi } from "@/services/task-api";
import { toast } from "@/store/toast-store";

interface KanbanState {
  tasks: Task[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  search: string;
  statusFilter: string;
  priorityFilter: string;
  onlyMyTasks: boolean;

  selectedTask: Task | null;
  isCreateOpen: boolean;
  isDetailOpen: boolean;
  isDeleteConfirmOpen: boolean;

  fetchTasks: (customFilters?: TaskFilters) => Promise<void>;
  addTask: (input: CreateTaskInput) => Promise<boolean>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  moveTaskStatus: (id: string, newStatus: TaskStatus) => Promise<boolean>;

  setSearch: (search: string) => void;
  setStatusFilter: (status: string) => void;
  setPriorityFilter: (priority: string) => void;
  toggleOnlyMyTasks: () => void;
  setOnlyMyTasks: (val: boolean) => void;
  resetFilters: () => void;

  setSelectedTask: (task: Task | null) => void;
  openCreate: () => void;
  closeCreate: () => void;
  openDetail: (task: Task) => void;
  closeDetail: () => void;
  openDeleteConfirm: (task: Task) => void;
  closeDeleteConfirm: () => void;
}

const statusLabels: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

export const useKanbanStore = create<KanbanState>((set, get) => ({
  tasks: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  search: "",
  statusFilter: "all",
  priorityFilter: "all",
  onlyMyTasks: false,

  selectedTask: null,
  isCreateOpen: false,
  isDetailOpen: false,
  isDeleteConfirmOpen: false,

  fetchTasks: async (customFilters?: TaskFilters) => {
    set({ isLoading: true, error: null });
    try {
      const { search, statusFilter, priorityFilter } = get();

      const activeFilters: TaskFilters = {
        search: customFilters?.search ?? (search ? search : undefined),
        status:
          customFilters?.status ??
          (statusFilter !== "all" ? (statusFilter as TaskStatus) : undefined),
        priority:
          customFilters?.priority ??
          (priorityFilter !== "all" ? (priorityFilter as TaskPriority) : undefined),
      };

      const tasks = await taskApi.getTasks(activeFilters);
      set({ tasks, isLoading: false, error: null });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal memuat daftar tugas";
      set({ error: message, isLoading: false });
    }
  },

  addTask: async (input: CreateTaskInput) => {
    set({ isSubmitting: true, error: null });
    try {
      await taskApi.createTask(input);
      await get().fetchTasks();
      set({ isSubmitting: false, isCreateOpen: false });
      toast.success("Tugas baru berhasil ditambahkan");
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal menambahkan tugas baru";
      set({ error: message, isSubmitting: false });
      toast.error(message);
      return false;
    }
  },

  updateTask: async (id: string, input: UpdateTaskInput) => {
    set({ isSubmitting: true, error: null });
    try {
      const updated = await taskApi.updateTask(id, input);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
        selectedTask: state.selectedTask?.id === id ? updated : state.selectedTask,
        isSubmitting: false,
      }));
      toast.success("Perubahan tugas berhasil disimpan");
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal memperbarui tugas";
      set({ error: message, isSubmitting: false });
      toast.error(message);
      return false;
    }
  },

  deleteTask: async (id: string) => {
    set({ isSubmitting: true, error: null });
    try {
      await taskApi.deleteTask(id);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        selectedTask: null,
        isDetailOpen: false,
        isDeleteConfirmOpen: false,
        isSubmitting: false,
      }));
      toast.info("Tugas berhasil dihapus");
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal menghapus tugas";
      set({ error: message, isSubmitting: false });
      toast.error(message);
      return false;
    }
  },

  moveTaskStatus: async (id: string, newStatus: TaskStatus) => {
    const currentTask = get().tasks.find((t) => t.id === id);
    if (!currentTask || currentTask.status === newStatus) {
      return true;
    }

    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, status: newStatus } : t)),
    }));

    try {
      await taskApi.updateTask(id, { status: newStatus });
      toast.success(`Tugas dipindahkan ke kolom "${statusLabels[newStatus]}"`);
      return true;
    } catch {
      set({ tasks: previousTasks, error: "Gagal memindahkan status tugas" });
      toast.error("Gagal memindahkan status tugas");
      return false;
    }
  },

  setSearch: (search: string) => {
    set({ search });
    get().fetchTasks();
  },

  setStatusFilter: (statusFilter: string) => {
    set({ statusFilter });
    get().fetchTasks();
  },

  setPriorityFilter: (priorityFilter: string) => {
    set({ priorityFilter });
    get().fetchTasks();
  },

  toggleOnlyMyTasks: () => {
    set((state) => ({ onlyMyTasks: !state.onlyMyTasks }));
  },

  setOnlyMyTasks: (onlyMyTasks: boolean) => {
    set({ onlyMyTasks });
  },

  resetFilters: () => {
    set({ search: "", statusFilter: "all", priorityFilter: "all", onlyMyTasks: false });
    get().fetchTasks({ search: undefined, status: undefined, priority: undefined });
  },

  setSelectedTask: (task: Task | null) => set({ selectedTask: task }),
  openCreate: () => set({ isCreateOpen: true, error: null }),
  closeCreate: () => set({ isCreateOpen: false }),
  openDetail: (task: Task) => set({ selectedTask: task, isDetailOpen: true, error: null }),
  closeDetail: () => set({ isDetailOpen: false }),
  openDeleteConfirm: (task: Task) => set({ selectedTask: task, isDeleteConfirmOpen: true }),
  closeDeleteConfirm: () => set({ isDeleteConfirmOpen: false }),
}));
