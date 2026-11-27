import { apiFetch, extractList } from "@/lib/api-client";
import { memberApi } from "@/services/member-api";
import { CreateTaskInput, Task, TaskAssigneeItem, TaskFilters, TaskPriority, TaskStatus, UpdateTaskInput } from "@/types/task";

function mapTaskFromBackend(raw: unknown, memberNameMap?: Map<string, string>): Task {
  const t = (raw || {}) as Record<string, unknown>;
  const rawAssignees = Array.isArray(t.assignees)
    ? t.assignees
    : Array.isArray(t.taskAssignees)
    ? t.taskAssignees
    : Array.isArray(t.task_assignees)
    ? t.task_assignees
    : Array.isArray(t.assignedUsers)
    ? t.assignedUsers
    : Array.isArray(t.assigned_users)
    ? t.assigned_users
    : [];

  const assignees: TaskAssigneeItem[] = rawAssignees
    .map((item: unknown) => {
      // Jika item berupa string ID langsung
      if (typeof item === "string") {
        const id = item.trim();
        return {
          id,
          name: memberNameMap?.get(id) || "Member",
        };
      }

      const a = (item || {}) as Record<string, unknown>;
      const u = (
        (a.user && typeof a.user === "object"
          ? a.user
          : a.member && typeof a.member === "object"
          ? a.member
          : a.assignee && typeof a.assignee === "object"
          ? a.assignee
          : a)
      ) as Record<string, unknown>;

      const id = String(u.id || a.userId || a.user_id || a.memberId || a.member_id || "");
      const resolvedName = String(
        u.name ||
          a.name ||
          a.userName ||
          a.user_name ||
          a.assigneeName ||
          a.assignee_name ||
          (id ? memberNameMap?.get(id) : "") ||
          u.email ||
          "Member"
      );

      return {
        id,
        name: resolvedName,
        email: u.email ? String(u.email) : a.email ? String(a.email) : undefined,
      };
    })
    .filter((a) => Boolean(a.id));

  // Fallback jika backend hanya mengirim array ID `assigneeIds` / `assignee_ids`
  if (assignees.length === 0) {
    const rawIds = Array.isArray(t.assigneeIds)
      ? t.assigneeIds
      : Array.isArray(t.assignee_ids)
      ? t.assignee_ids
      : [];
    rawIds.forEach((idVal: unknown) => {
      const id = String(idVal || "").trim();
      if (id) {
        assignees.push({
          id,
          name: memberNameMap?.get(id) || "Member",
        });
      }
    });
  }

  // Ambil assignee pertama untuk kompatibilitas field tunggal UI temanmu (assigned_to & assignee_name)
  const firstAssignee = assignees[0];
  const allAssigneeNames =
    assignees.map((a) => a.name).filter(Boolean).join(", ") ||
    String(t.assignee_name || t.assigneeName || t.assignedToName || "");

  const rawDueDate = (t.dueDate as string | null) ?? (t.due_date as string | null) ?? undefined;

  return {
    id: String(t.id || ""),
    title: String(t.title || ""),
    description: t.description ? String(t.description) : undefined,
    status: (t.status as TaskStatus) || "todo",
    priority: (t.priority as TaskPriority) || "medium",
    assigned_to: firstAssignee?.id || (t.assigned_to as string) || (t.assignedTo as string) || undefined,
    assignee_name: allAssigneeNames || undefined,
    assignees,
    due_date: rawDueDate ? String(rawDueDate).slice(0, 10) : undefined,
    created_by: String(t.createdBy || t.created_by || ""),
    created_at: String(t.createdAt || t.created_at || ""),
    updated_at: String(t.updatedAt || t.updated_at || ""),
  };
}

async function buildMemberNameMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const members = await memberApi.getMembers();
    for (const m of members) {
      if (m.id && m.name) {
        map.set(m.id, m.name);
      }
    }
  } catch {
    // Abaikan jika endpoint /api/members tidak diizinkan untuk role tertentu
  }
  return map;
}

export const taskApi = {
  async getTasks(filters?: TaskFilters): Promise<Task[]> {
    const query = new URLSearchParams();
    if (filters?.status) query.set("status", filters.status);
    if (filters?.priority) query.set("priority", filters.priority);
    // BE menggunakan query param `q` untuk pencarian teks
    if (filters?.search) query.set("q", filters.search);
    if (filters?.assigneeId) query.set("assigneeId", filters.assigneeId);

    const qs = query.toString();
    const [rawData, memberNameMap] = await Promise.all([
      apiFetch<unknown>(`/api/tasks${qs ? `?${qs}` : ""}`),
      buildMemberNameMap(),
    ]);
    const list = extractList<unknown>(rawData, ["tasks", "items", "rows", "list"]);
    return list.map((item) => mapTaskFromBackend(item, memberNameMap));
  },

  async getTaskById(id: string): Promise<Task> {
    const [rawData, memberNameMap] = await Promise.all([
      apiFetch<unknown>(`/api/tasks/${id}`),
      buildMemberNameMap(),
    ]);
    return mapTaskFromBackend(rawData, memberNameMap);
  },

  async createTask(input: CreateTaskInput): Promise<Task> {
    // Terjemahkan single `assigned_to` dari form FE menjadi array `assigneeIds` sesuai kontrak BE
    const assigneeIds = input.assigneeIds
      ? input.assigneeIds
      : input.assigned_to
      ? [input.assigned_to]
      : [];

    const payload = {
      title: input.title,
      description: input.description || "",
      status: input.status || "todo",
      priority: input.priority || "medium",
      dueDate: input.due_date || null,
      assigneeIds,
    };

    const rawData = await apiFetch<unknown>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const memberNameMap = await buildMemberNameMap();
    return mapTaskFromBackend(rawData, memberNameMap);
  },

  async updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
    const payload: Record<string, unknown> = {};
    if (input.title !== undefined) payload.title = input.title;
    if (input.description !== undefined) payload.description = input.description;
    if (input.status !== undefined) payload.status = input.status;
    if (input.priority !== undefined) payload.priority = input.priority;
    if (input.due_date !== undefined) payload.dueDate = input.due_date || null;

    if (input.assigneeIds !== undefined) {
      payload.assigneeIds = input.assigneeIds;
    } else if (input.assigned_to !== undefined) {
      payload.assigneeIds = input.assigned_to ? [input.assigned_to] : [];
    }

    const rawData = await apiFetch<unknown>(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    const memberNameMap = await buildMemberNameMap();
    return mapTaskFromBackend(rawData, memberNameMap);
  },

  async deleteTask(id: string): Promise<void> {
    await apiFetch<null>(`/api/tasks/${id}`, {
      method: "DELETE",
    });
  },
};