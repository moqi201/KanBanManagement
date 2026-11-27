import { randomUUID } from "node:crypto";
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  like,
} from "drizzle-orm";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import { db } from "../../db";
import {
  divisions,
  taskAssignees,
  tasks,
  users,
} from "../../db/schema";

import type { AuthenticatedUser } from "../types";

import type {
  CreateTaskInput,
  TaskQueryInput,
  UpdateTaskInput,
} from "../validators/task.schema";

export class TaskServiceError extends Error {
  status: ContentfulStatusCode;

  constructor(message: string, status: ContentfulStatusCode) {
    super(message);
    this.name = "TaskServiceError";
    this.status = status;
  }
}

function getDivisionId(user: AuthenticatedUser): string {
  if (!user.divisionId) {
    throw new TaskServiceError(
      "Akun ini tidak memiliki divisi.",
      403
    );
  }

  return user.divisionId;
}

async function ensureActiveDivision(divisionId: string) {
  const [division] = await db
    .select({
      id: divisions.id,
      isActive: divisions.isActive,
    })
    .from(divisions)
    .where(eq(divisions.id, divisionId))
    .limit(1);

  if (!division || !division.isActive) {
    throw new TaskServiceError(
      "Divisi tidak ditemukan atau sedang nonaktif.",
      403
    );
  }
}

async function getTaskAssignees(
  taskIds: string[],
  divisionId: string
) {
  const result = new Map<string, Array<{
    id: string;
    name: string;
    email: string;
    role: "platform_admin" | "division_admin" | "member";
    assignedAt: Date;
  }>>();

  if (taskIds.length === 0) {
    return result;
  }

  const rows = await db
    .select({
      taskId: taskAssignees.taskId,
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      assignedAt: taskAssignees.assignedAt,
    })
    .from(taskAssignees)
    .innerJoin(
      users,
      eq(taskAssignees.userId, users.id)
    )
    .where(
      and(
        eq(taskAssignees.divisionId, divisionId),
        inArray(taskAssignees.taskId, taskIds)
      )
    )
    .orderBy(asc(users.name));

  for (const row of rows) {
    const current = result.get(row.taskId) ?? [];

    current.push({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      assignedAt: row.assignedAt,
    });

    result.set(row.taskId, current);
  }

  return result;
}

async function getScopedTask(
  taskId: string,
  divisionId: string
) {
  const [task] = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.id, taskId),
        eq(tasks.divisionId, divisionId)
      )
    )
    .limit(1);

  if (!task) {
    throw new TaskServiceError(
      "Task tidak ditemukan.",
      404
    );
  }

  return task;
}

export async function getAllTasks(
  user: AuthenticatedUser,
  filters: TaskQueryInput
) {
  const divisionId = getDivisionId(user);

  await ensureActiveDivision(divisionId);

  const conditions = [
    eq(tasks.divisionId, divisionId),
  ];

  if (filters.q) {
    const escapedQuery = filters.q.replace(
      /[\\%_]/g,
      "\\$&"
    );

    conditions.push(
      like(tasks.title, `%${escapedQuery}%`)
    );
  }

  if (filters.status) {
    conditions.push(
      eq(tasks.status, filters.status)
    );
  }

  if (filters.priority) {
    conditions.push(
      eq(tasks.priority, filters.priority)
    );
  }

  if (filters.assigneeId) {
    const assignedTaskIds = db
      .select({
        taskId: taskAssignees.taskId,
      })
      .from(taskAssignees)
      .where(
        and(
          eq(taskAssignees.userId, filters.assigneeId),
          eq(taskAssignees.divisionId, divisionId)
        )
      );

    conditions.push(
      inArray(tasks.id, assignedTaskIds)
    );
  }

  const taskRows = await db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(
      desc(tasks.createdAt),
      desc(tasks.id)
    );

  const assigneeMap = await getTaskAssignees(
    taskRows.map((task) => task.id),
    divisionId
  );

  return taskRows.map((task) => ({
    ...task,
    assignees: assigneeMap.get(task.id) ?? [],
  }));
}

export async function getTaskById(
  user: AuthenticatedUser,
  taskId: string
) {
  const divisionId = getDivisionId(user);

  await ensureActiveDivision(divisionId);

  const task = await getScopedTask(
    taskId,
    divisionId
  );

  const assigneeMap = await getTaskAssignees(
    [taskId],
    divisionId
  );

  return {
    ...task,
    assignees: assigneeMap.get(taskId) ?? [],
  };
}

export async function createTask(
  user: AuthenticatedUser,
  input: CreateTaskInput
) {
  const divisionId = getDivisionId(user);

  await ensureActiveDivision(divisionId);

  const id = randomUUID();
  const assigneeIds = input.assigneeIds ?? [];

  await db.transaction(async (tx) => {
    if (assigneeIds.length > 0) {
      const activeUsers = await tx
        .select({
          id: users.id,
        })
        .from(users)
        .where(
          and(
            eq(users.divisionId, divisionId),
            eq(users.isActive, true),
            inArray(users.id, assigneeIds)
          )
        );

      if (activeUsers.length !== assigneeIds.length) {
        throw new TaskServiceError(
          "Semua assignee harus merupakan user aktif dari divisi yang sama.",
          400
        );
      }
    }

    await tx.insert(tasks).values({
      id,
      divisionId,
      createdBy: user.id,
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? "todo",
      priority: input.priority ?? "medium",
      dueDate: input.dueDate ?? null,
    });

    if (assigneeIds.length > 0) {
      await tx.insert(taskAssignees).values(
        assigneeIds.map((userId) => ({
          taskId: id,
          userId,
          divisionId,
        }))
      );
    }
  });

  return getTaskById(user, id);
}

export async function updateTask(
  user: AuthenticatedUser,
  taskId: string,
  input: UpdateTaskInput
) {
  const divisionId = getDivisionId(user);

  await ensureActiveDivision(divisionId);

  await db.transaction(async (tx) => {
    const [task] = await tx
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.divisionId, divisionId)
        )
      )
      .limit(1);

    if (!task) {
      throw new TaskServiceError(
        "Task tidak ditemukan.",
        404
      );
    }

    if (
      user.role === "member" &&
      task.createdBy !== user.id
    ) {
      const [assignment] = await tx
        .select({
          taskId: taskAssignees.taskId,
        })
        .from(taskAssignees)
        .where(
          and(
            eq(taskAssignees.taskId, taskId),
            eq(taskAssignees.userId, user.id),
            eq(taskAssignees.divisionId, divisionId)
          )
        )
        .limit(1);

      if (!assignment) {
        throw new TaskServiceError(
          "Anda hanya dapat mengedit task yang dibuat sendiri atau ditugaskan kepada Anda.",
          403
        );
      }
    }

    const updates: {
      title?: string;
      description?: string | null;
      status?: "todo" | "in_progress" | "done";
      priority?: "low" | "medium" | "high";
      dueDate?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (input.title !== undefined) {
      updates.title = input.title;
    }

    if (input.description !== undefined) {
      updates.description = input.description;
    }

    if (input.status !== undefined) {
      updates.status = input.status;
    }

    if (input.priority !== undefined) {
      updates.priority = input.priority;
    }

    if (input.dueDate !== undefined) {
      updates.dueDate = input.dueDate;
    }

    await tx
      .update(tasks)
      .set(updates)
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.divisionId, divisionId)
        )
      );

    if (input.assigneeIds !== undefined) {
      const assigneeIds = input.assigneeIds;

      if (assigneeIds.length > 0) {
        const activeUsers = await tx
          .select({
            id: users.id,
          })
          .from(users)
          .where(
            and(
              eq(users.divisionId, divisionId),
              eq(users.isActive, true),
              inArray(users.id, assigneeIds)
            )
          );

        if (activeUsers.length !== assigneeIds.length) {
          throw new TaskServiceError(
            "Semua assignee harus merupakan user aktif dari divisi yang sama.",
            400
          );
        }
      }

      await tx
        .delete(taskAssignees)
        .where(
          and(
            eq(taskAssignees.taskId, taskId),
            eq(taskAssignees.divisionId, divisionId)
          )
        );

      if (assigneeIds.length > 0) {
        await tx.insert(taskAssignees).values(
          assigneeIds.map((userId) => ({
            taskId,
            userId,
            divisionId,
          }))
        );
      }
    }
  });

  return getTaskById(user, taskId);
}

export async function deleteTask(
  user: AuthenticatedUser,
  taskId: string
) {
  const divisionId = getDivisionId(user);

  await ensureActiveDivision(divisionId);

  await db.transaction(async (tx) => {
    const [task] = await tx
      .select({
        id: tasks.id,
        createdBy: tasks.createdBy,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.divisionId, divisionId)
        )
      )
      .limit(1);

    if (!task) {
      throw new TaskServiceError(
        "Task tidak ditemukan.",
        404
      );
    }

    if (
      user.role === "member" &&
      task.createdBy !== user.id
    ) {
      throw new TaskServiceError(
        "Member hanya dapat menghapus task yang dibuat sendiri.",
        403
      );
    }

    await tx
      .delete(tasks)
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.divisionId, divisionId)
        )
      );
  });
}