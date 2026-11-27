'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  LogOut,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  Clock,
  Circle,
  Edit3,
  Trash2,
  Shield,
  UserPlus,
  AlertCircle,
  Loader2,
  Menu,
  X,
  Check,
  ChevronRight,
  Lock,
  Power,
  Server,
  Sparkles,
  Info,
} from 'lucide-react';

// ============================================================================
// 1. TYPES & INTERFACES (Sesuai Kontrak BE.md & FE.md)
// ============================================================================

export type UserRole = 'platform_admin' | 'division_admin' | 'member';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Division {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  divisionId?: string | null;
  division?: Division | null;
}

export interface TaskAssignee {
  id: string;
  name: string;
  email?: string;
}

export interface Task {
  id: string;
  divisionId: string;
  createdBy: string;
  creatorName?: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  assignees: TaskAssignee[];
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: unknown[];
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

// ============================================================================
// 2. DEMO SANDBOX DATA & ENGINE (Untuk Simulasi Jika Belum Konek TiDB)
// ============================================================================

const INITIAL_DIVISIONS: Division[] = [
  { id: 'div-it-001', name: 'Information Technology', slug: 'it', isActive: true, createdAt: '2026-11-01' },
  { id: 'div-mkt-002', name: 'Marketing & Growth', slug: 'marketing', isActive: true, createdAt: '2026-11-02' },
  { id: 'div-fin-003', name: 'Finance & Accounting', slug: 'finance', isActive: false, createdAt: '2026-11-05' },
];

const INITIAL_USERS: User[] = [
  {
    id: 'usr-plat-001',
    name: 'Super Admin Platform',
    email: 'platform@kantor.com',
    role: 'platform_admin',
    isActive: true,
    divisionId: null,
    division: null,
  },
  {
    id: 'usr-it-admin',
    name: 'Andi Pratama',
    email: 'andi.it@kantor.com',
    role: 'division_admin',
    isActive: true,
    divisionId: 'div-it-001',
    division: INITIAL_DIVISIONS[0],
  },
  {
    id: 'usr-it-mem1',
    name: 'Siti Rahma',
    email: 'siti.it@kantor.com',
    role: 'member',
    isActive: true,
    divisionId: 'div-it-001',
    division: INITIAL_DIVISIONS[0],
  },
  {
    id: 'usr-it-mem2',
    name: 'Budi Santoso',
    email: 'budi.it@kantor.com',
    role: 'member',
    isActive: true,
    divisionId: 'div-it-001',
    division: INITIAL_DIVISIONS[0],
  },
  {
    id: 'usr-mkt-admin',
    name: 'Rina Wijaya',
    email: 'rina.mkt@kantor.com',
    role: 'division_admin',
    isActive: true,
    divisionId: 'div-mkt-002',
    division: INITIAL_DIVISIONS[1],
  },
];

const INITIAL_TASKS: Task[] = [
  {
    id: 'tsk-001',
    divisionId: 'div-it-001',
    createdBy: 'usr-it-admin',
    creatorName: 'Andi Pratama',
    title: 'Konfigurasi SSL TiDB Cloud Production',
    description: 'Pastikan connection string mysql2 menggunakan rejectUnauthorized: true sebelum deploy ke Vercel.',
    status: 'in_progress',
    priority: 'high',
    dueDate: '2026-12-05',
    assignees: [
      { id: 'usr-it-mem1', name: 'Siti Rahma' },
      { id: 'usr-it-mem2', name: 'Budi Santoso' },
    ],
  },
  {
    id: 'tsk-002',
    divisionId: 'div-it-001',
    createdBy: 'usr-it-mem1',
    creatorName: 'Siti Rahma',
    title: 'Integrasi API Auth & Session Cookie ke FE',
    description: 'Ganti mock data auth-store dengan GET /api/auth/me dan POST /api/auth/login.',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-12-08',
    assignees: [{ id: 'usr-it-mem1', name: 'Siti Rahma' }],
  },
  {
    id: 'tsk-003',
    divisionId: 'div-it-001',
    createdBy: 'usr-it-mem2',
    creatorName: 'Budi Santoso',
    title: 'Audit Composite Foreign Key Drizzle ORM',
    description: 'Verifikasi constraint lintas divisi pada tabel tasks dan task_assignees.',
    status: 'done',
    priority: 'low',
    dueDate: '2026-11-28',
    assignees: [{ id: 'usr-it-mem2', name: 'Budi Santoso' }],
  },
  {
    id: 'tsk-004',
    divisionId: 'div-mkt-002',
    createdBy: 'usr-mkt-admin',
    creatorName: 'Rina Wijaya',
    title: 'Kampanye Peluncuran Produk Q4',
    description: 'Menyiapkan materi media sosial dan landing page promo akhir tahun.',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-12-12',
    assignees: [{ id: 'usr-mkt-admin', name: 'Rina Wijaya' }],
  },
];

// ============================================================================
// 3. CENTRALIZED API CLIENT (Sesuai Kontrak BE.md)
// ============================================================================

const BASE_API_URL =
  typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : '';

async function liveApiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_API_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // Wajib untuk mengirim HttpOnly session cookie ke Hono
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  let json: ApiResponse<T>;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Server mengembalikan respons tidak valid (HTTP ${res.status})`);
  }

  if (!res.ok || !json.success) {
    throw new Error(json.message || `Request gagal (HTTP ${res.status})`);
  }

  return json.data;
}

// ============================================================================
// 4. HELPER COMPONENTS (Badges, Avatars, Toasts)
// ============================================================================

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const styles: Record<TaskPriority, string> = {
    high: 'bg-rose-50 text-rose-700 border-rose-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  const labels: Record<TaskPriority, string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${styles[priority]}`}>
      {labels[priority]}
    </span>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const map: Record<UserRole, { label: string; cls: string }> = {
    platform_admin: { label: 'Platform Admin', cls: 'bg-purple-100 text-purple-800 border-purple-200' },
    division_admin: { label: 'Division Admin', cls: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    member: { label: 'Member', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  };
  const cfg = map[role] || map.member;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>
      <Shield className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function getInitials(name?: string | null) {
  if (!name || typeof name !== 'string') return 'U';
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';
}

// Helper normalisasi payload user jika backend membungkusnya dalam { user: ... }
function normalizeUserPayload(raw: unknown): User {
  const obj = raw as Record<string, unknown>;
  const u = (obj?.user && typeof obj.user === 'object' ? obj.user : obj) as Record<string, unknown>;
  const rawDiv = (u?.division && typeof u.division === 'object' ? u.division : null) as Record<string, unknown> | null;
  return {
    id: String(u?.id || ''),
    name: String(u?.name || u?.email || 'Pengguna'),
    email: String(u?.email || ''),
    role: (u?.role as UserRole) || 'member',
    isActive: u?.isActive !== undefined ? Boolean(u.isActive) : u?.is_active !== undefined ? Boolean(u.is_active) : true,
    divisionId: (u?.divisionId as string | null) ?? (u?.division_id as string | null) ?? null,
    division: rawDiv
      ? {
          id: String(rawDiv.id || ''),
          name: String(rawDiv.name || ''),
          slug: String(rawDiv.slug || ''),
          isActive: rawDiv.isActive !== undefined ? Boolean(rawDiv.isActive) : Boolean(rawDiv.is_active ?? true),
        }
      : null,
  };
}

// Helper ekstraksi array dari berbagai kemungkinan wrapper JSON backend ({ data: [...] } atau { data: { tasks/members/divisions/items: [...] } })
function extractArrayPayload<T>(raw: unknown, keys: string[]): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    for (const key of keys) {
      if (Array.isArray(obj[key])) return obj[key] as T[];
    }
  }
  return [];
}

// Helper normalisasi payload task (mendukung camelCase maupun snake_case dari Drizzle/MySQL)
function normalizeTaskPayload(raw: unknown): Task {
  const t = (raw || {}) as Record<string, unknown>;
  const rawAssignees = Array.isArray(t.assignees)
    ? t.assignees
    : Array.isArray(t.taskAssignees)
    ? t.taskAssignees
    : [];

  const assignees: TaskAssignee[] = rawAssignees
    .map((item: unknown) => {
      const a = (item || {}) as Record<string, unknown>;
      const nestedUser = (a.user && typeof a.user === 'object' ? a.user : a) as Record<string, unknown>;
      return {
        id: String(nestedUser.id || a.userId || a.user_id || ''),
        name: String(nestedUser.name || nestedUser.email || 'Member'),
        email: nestedUser.email ? String(nestedUser.email) : undefined,
      };
    })
    .filter((a) => Boolean(a.id));

  return {
    id: String(t.id || ''),
    divisionId: String(t.divisionId || t.division_id || ''),
    createdBy: String(t.createdBy || t.created_by || ''),
    creatorName: t.creatorName ? String(t.creatorName) : undefined,
    title: String(t.title || 'Untitled Task'),
    description: t.description ? String(t.description) : null,
    status: (t.status as TaskStatus) || 'todo',
    priority: (t.priority as TaskPriority) || 'medium',
    dueDate: (t.dueDate as string | null) ?? (t.due_date as string | null) ?? null,
    assignees,
    createdAt: (t.createdAt as string) || (t.created_at as string),
    updatedAt: (t.updatedAt as string) || (t.updated_at as string),
  };
}

function normalizeDivisionPayload(raw: unknown): Division {
  const d = (raw || {}) as Record<string, unknown>;
  return {
    id: String(d.id || ''),
    name: String(d.name || ''),
    slug: String(d.slug || ''),
    isActive: d.isActive !== undefined ? Boolean(d.isActive) : d.is_active !== undefined ? Boolean(d.is_active) : true,
    createdAt: (d.createdAt as string) || (d.created_at as string),
  };
}

// ============================================================================
// 5. MAIN APPLICATION COMPONENT
// ============================================================================

export default function App() {
  // Mode Koneksi: 'live' memanggil endpoint Hono asli (/api/...), 'demo' memakai sandbox lokal
  const [apiMode, setApiMode] = useState<'live' | 'demo'>('live');

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Navigation State (Menggantikan Next Router agar single-file & mulus)
  const [activeRoute, setActiveRoute] = useState<'dashboard' | 'members' | 'divisions'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Data States (Dari Backend / Sandbox)
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(false);

  // Demo Sandbox Storage States
  const [demoDivisions, setDemoDivisions] = useState<Division[]>(INITIAL_DIVISIONS);
  const [demoUsers, setDemoUsers] = useState<User[]>(INITIAL_USERS);
  const [demoTasks, setDemoTasks] = useState<Task[]>(INITIAL_TASKS);

  // Filter & Search States (Kanban)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  // Search State (Members)
  const [memberSearch, setMemberSearch] = useState<string>('');

  // Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const [isMemberModalOpen, setIsMemberModalOpen] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);

  const [isDivisionModalOpen, setIsDivisionModalOpen] = useState<boolean>(false);
  const [editingDivision, setEditingDivision] = useState<Division | null>(null);
  const [adminTargetDivision, setAdminTargetDivision] = useState<Division | null>(null);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastMessage['type'], text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // ==========================================================================
  // 6. UNIFIED API EXECUTOR (Live Hono API vs Demo Sandbox)
  // ==========================================================================

  const requestApi = useCallback(
    async <T,>(
      method: string,
      endpoint: string,
      body?: Record<string, unknown>
    ): Promise<T> => {
      if (apiMode === 'live') {
        return liveApiFetch<T>(endpoint, {
          method,
          body: body ? JSON.stringify(body) : undefined,
        });
      }

      // Simulasi Latency & Logic Backend Hono saat Demo Sandbox aktif
      await new Promise((r) => setTimeout(r, 250));

      // --- AUTH ENDPOINTS ---
      if (endpoint === '/api/auth/login' && method === 'POST') {
        const email = String(body?.email || '').toLowerCase().trim();
        const found = demoUsers.find((u) => u.email.toLowerCase() === email);
        if (!found) throw new Error('Email atau password tidak valid');
        if (!found.isActive) throw new Error('Akun Anda telah dinonaktifkan');
        if (found.role !== 'platform_admin' && found.division && !found.division.isActive) {
          throw new Error('Divisi Anda sedang dinonaktifkan');
        }
        return found as unknown as T;
      }

      if (endpoint === '/api/auth/me' && method === 'GET') {
        if (!user) throw new Error('Belum terautentikasi');
        return user as unknown as T;
      }

      if (endpoint === '/api/auth/logout' && method === 'POST') {
        return null as unknown as T;
      }

      // --- DIVISION ENDPOINTS (Platform Admin Only) ---
      if (endpoint === '/api/divisions' && method === 'GET') {
        if (user?.role !== 'platform_admin') throw new Error('403 Forbidden: Khusus Platform Admin');
        return demoDivisions as unknown as T;
      }

      if (endpoint === '/api/divisions' && method === 'POST') {
        if (user?.role !== 'platform_admin') throw new Error('403 Forbidden: Khusus Platform Admin');
        const slug = String(body?.slug || '').toLowerCase().trim();
        if (demoDivisions.some((d) => d.slug === slug)) {
          throw new Error('Slug divisi sudah digunakan');
        }
        const newDiv: Division = {
          id: `div-${Date.now()}`,
          name: String(body?.name),
          slug,
          isActive: true,
          createdAt: new Date().toISOString().slice(0, 10),
        };
        setDemoDivisions((prev) => [newDiv, ...prev]);
        return newDiv as unknown as T;
      }

      if (endpoint.startsWith('/api/divisions/') && endpoint.endsWith('/status') && method === 'PATCH') {
        if (user?.role !== 'platform_admin') throw new Error('403 Forbidden');
        const id = endpoint.split('/')[3];
        const isActive = Boolean(body?.isActive);
        setDemoDivisions((prev) => prev.map((d) => (d.id === id ? { ...d, isActive } : d)));
        return { id, isActive } as unknown as T;
      }

      if (endpoint.startsWith('/api/divisions/') && endpoint.endsWith('/admins') && method === 'POST') {
        if (user?.role !== 'platform_admin') throw new Error('403 Forbidden');
        const divId = endpoint.split('/')[3];
        const div = demoDivisions.find((d) => d.id === divId);
        if (!div || !div.isActive) throw new Error('Divisi tidak ditemukan atau tidak aktif');
        const newAdmin: User = {
          id: `usr-${Date.now()}`,
          name: String(body?.name),
          email: String(body?.email).toLowerCase(),
          role: 'division_admin',
          isActive: true,
          divisionId: div.id,
          division: div,
        };
        setDemoUsers((prev) => [...prev, newAdmin]);
        return newAdmin as unknown as T;
      }

      if (endpoint.startsWith('/api/divisions/') && method === 'PATCH') {
        if (user?.role !== 'platform_admin') throw new Error('403 Forbidden');
        const id = endpoint.split('/')[3];
        setDemoDivisions((prev) =>
          prev.map((d) =>
            d.id === id
              ? { ...d, name: String(body?.name || d.name), slug: String(body?.slug || d.slug) }
              : d
          )
        );
        return { id } as unknown as T;
      }

      // --- MEMBER ENDPOINTS ---
      if (endpoint === '/api/members' && method === 'GET') {
        if (!user || user.role === 'platform_admin') throw new Error('403 Forbidden');
        const list = demoUsers.filter((u) => u.divisionId === user.divisionId);
        return list as unknown as T;
      }

      if (endpoint === '/api/members' && method === 'POST') {
        if (user?.role !== 'division_admin') throw new Error('403 Forbidden: Khusus Division Admin');
        const newMember: User = {
          id: `usr-${Date.now()}`,
          name: String(body?.name),
          email: String(body?.email).toLowerCase(),
          role: 'member',
          isActive: true,
          divisionId: user.divisionId,
          division: user.division,
        };
        setDemoUsers((prev) => [...prev, newMember]);
        return newMember as unknown as T;
      }

      if (endpoint.startsWith('/api/members/') && endpoint.endsWith('/status') && method === 'PATCH') {
        if (user?.role !== 'division_admin') throw new Error('403 Forbidden');
        const id = endpoint.split('/')[3];
        const isActive = Boolean(body?.isActive);
        setDemoUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isActive } : u)));
        return { id, isActive } as unknown as T;
      }

      if (endpoint.startsWith('/api/members/') && method === 'PATCH') {
        if (user?.role !== 'division_admin') throw new Error('403 Forbidden');
        const id = endpoint.split('/')[3];
        setDemoUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, name: String(body?.name || u.name) } : u))
        );
        return { id } as unknown as T;
      }

      // --- TASK ENDPOINTS ---
      if (endpoint.startsWith('/api/tasks') && method === 'GET') {
        if (!user || user.role === 'platform_admin') {
          throw new Error('403 Forbidden: Platform Admin tidak mengakses task divisi');
        }
        const urlObj = new URL(endpoint, 'http://localhost');
        const q = (urlObj.searchParams.get('q') || '').toLowerCase();
        const status = urlObj.searchParams.get('status');
        const priority = urlObj.searchParams.get('priority');
        const assigneeId = urlObj.searchParams.get('assigneeId');

        const filtered = demoTasks.filter((t) => {
          if (t.divisionId !== user.divisionId) return false;
          if (q && !t.title.toLowerCase().includes(q) && !(t.description || '').toLowerCase().includes(q)) {
            return false;
          }
          if (status && t.status !== status) return false;
          if (priority && t.priority !== priority) return false;
          if (assigneeId && !t.assignees.some((a) => a.id === assigneeId)) return false;
          return true;
        });
        return filtered as unknown as T;
      }

      if (endpoint === '/api/tasks' && method === 'POST') {
        if (!user || user.role === 'platform_admin') throw new Error('403 Forbidden');
        const assigneeIds = (body?.assigneeIds as string[]) || [];
        const resolvedAssignees = demoUsers
          .filter((u) => assigneeIds.includes(u.id) && u.divisionId === user.divisionId && u.isActive)
          .map((u) => ({ id: u.id, name: u.name, email: u.email }));

        const newTask: Task = {
          id: `tsk-${Date.now()}`,
          divisionId: user.divisionId!,
          createdBy: user.id,
          creatorName: user.name,
          title: String(body?.title),
          description: body?.description ? String(body.description) : null,
          status: (body?.status as TaskStatus) || 'todo',
          priority: (body?.priority as TaskPriority) || 'medium',
          dueDate: body?.dueDate ? String(body.dueDate) : null,
          assignees: resolvedAssignees,
        };
        setDemoTasks((prev) => [newTask, ...prev]);
        return newTask as unknown as T;
      }

      if (endpoint.startsWith('/api/tasks/') && method === 'PATCH') {
        if (!user || user.role === 'platform_admin') throw new Error('403 Forbidden');
        const id = endpoint.split('/')[3];
        const target = demoTasks.find((t) => t.id === id && t.divisionId === user.divisionId);
        if (!target) throw new Error('404 Task tidak ditemukan');

        const canEdit =
          user.role === 'division_admin' ||
          target.createdBy === user.id ||
          target.assignees.some((a) => a.id === user.id);

        if (!canEdit) {
          throw new Error('403 Forbidden: Member hanya dapat mengedit task buatan sendiri atau yang ditugaskan');
        }

        let nextAssignees = target.assignees;
        if (Array.isArray(body?.assigneeIds)) {
          const ids = body.assigneeIds as string[];
          nextAssignees = demoUsers
            .filter((u) => ids.includes(u.id) && u.divisionId === user.divisionId && u.isActive)
            .map((u) => ({ id: u.id, name: u.name, email: u.email }));
        }

        const updated: Task = {
          ...target,
          title: body?.title !== undefined ? String(body.title) : target.title,
          description: body?.description !== undefined ? String(body.description) : target.description,
          status: body?.status !== undefined ? (body.status as TaskStatus) : target.status,
          priority: body?.priority !== undefined ? (body.priority as TaskPriority) : target.priority,
          dueDate: body?.dueDate !== undefined ? (body.dueDate ? String(body.dueDate) : null) : target.dueDate,
          assignees: nextAssignees,
        };
        setDemoTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
        return updated as unknown as T;
      }

      if (endpoint.startsWith('/api/tasks/') && method === 'DELETE') {
        if (!user || user.role === 'platform_admin') throw new Error('403 Forbidden');
        const id = endpoint.split('/')[3];
        const target = demoTasks.find((t) => t.id === id && t.divisionId === user.divisionId);
        if (!target) throw new Error('404 Task tidak ditemukan');

        const canDelete = user.role === 'division_admin' || target.createdBy === user.id;
        if (!canDelete) {
          throw new Error('403 Forbidden: Member hanya dapat menghapus task yang dibuat sendiri');
        }

        setDemoTasks((prev) => prev.filter((t) => t.id !== id));
        return null as unknown as T;
      }

      throw new Error(`Endpoint tidak dikenal: ${method} ${endpoint}`);
    },
    [apiMode, demoDivisions, demoTasks, demoUsers, user]
  );

  // ==========================================================================
  // 7. INITIAL SESSION CHECK (`GET /api/auth/me`) & DATA LOADERS
  // ==========================================================================

  useEffect(() => {
    let mounted = true;
    async function checkSession() {
      if (apiMode === 'demo') {
        setAuthLoading(false);
        return;
      }
      setAuthLoading(true);
      try {
        const rawMe = await liveApiFetch<unknown>('/api/auth/me');
        const me = normalizeUserPayload(rawMe);
        if (mounted && me.id) {
          setUser(me);
          setActiveRoute(me.role === 'platform_admin' ? 'divisions' : 'dashboard');
        }
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    }
    checkSession();
    return () => {
      mounted = false;
    };
  }, [apiMode]);

  const loadWorkspaceData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      if (user.role === 'platform_admin') {
        const rawDivs = await requestApi<unknown>('GET', '/api/divisions');
        const listDivs = extractArrayPayload<unknown>(rawDivs, ['divisions', 'items', 'rows', 'list']);
        setDivisions(listDivs.map(normalizeDivisionPayload));
      } else {
        // Bangun query params untuk GET /api/tasks sesuai kontrak BE.md
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        if (priorityFilter !== 'all') params.set('priority', priorityFilter);
        if (assigneeFilter !== 'all') params.set('assigneeId', assigneeFilter);
        const queryString = params.toString() ? `?${params.toString()}` : '';

        const rawTasks = await requestApi<unknown>('GET', `/api/tasks${queryString}`);
        const listTasks = extractArrayPayload<unknown>(rawTasks, ['tasks', 'items', 'rows', 'list']);
        const safeTasks = listTasks.map(normalizeTaskPayload);
        setTasks(safeTasks);

        // Ambil daftar anggota divisi untuk dropdown assignee & halaman /members
        try {
          const rawMembers = await requestApi<unknown>('GET', '/api/members');
          const listMembers = extractArrayPayload<unknown>(rawMembers, ['members', 'users', 'items', 'rows', 'list']);
          setMembers(listMembers.map(normalizeUserPayload));
        } catch {
          // Jika backend membatasi GET /api/members hanya untuk division_admin,
          // ekstrak daftar assignee unik dari task yang ada sebagai fallback dropdown
          const uniqueMap = new Map<string, User>();
          safeTasks.forEach((t) => {
            t.assignees?.forEach((a) => {
              if (a?.id) {
                uniqueMap.set(a.id, {
                  id: a.id,
                  name: a.name || a.email || 'Member',
                  email: a.email || '',
                  role: 'member',
                  isActive: true,
                });
              }
            });
          });
          if (user) {
            uniqueMap.set(user.id, user);
          }
          setMembers(Array.from(uniqueMap.values()));
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data';
      addToast('error', msg);
    } finally {
      setDataLoading(false);
    }
  }, [user, requestApi, searchQuery, priorityFilter, assigneeFilter, addToast]);

  useEffect(() => {
    if (user) {
      loadWorkspaceData();
    }
  }, [user, loadWorkspaceData]);

  // ==========================================================================
  // 8. AUTH HANDLERS (`POST /api/auth/login`, `POST /api/auth/logout`)
  // ==========================================================================

  const handleLogin = async (email: string, password: string) => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const rawLogin = await requestApi<unknown>('POST', '/api/auth/login', { email, password });
      let profile = normalizeUserPayload(rawLogin);
      // Ambil profil lengkap via GET /api/auth/me jika mode live
      if (apiMode === 'live') {
        try {
          const rawMe = await liveApiFetch<unknown>('/api/auth/me');
          const meProfile = normalizeUserPayload(rawMe);
          if (meProfile.id) profile = meProfile;
        } catch {
          // Fallback ke payload login jika /me belum mengembalikan detail
        }
      }
      setUser(profile);
      setActiveRoute(profile.role === 'platform_admin' ? 'divisions' : 'dashboard');
      addToast('success', `Selamat datang kembali, ${profile.name}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login gagal';
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await requestApi('POST', '/api/auth/logout');
    } catch {
      // Tetap bersihkan state lokal meskipun session sudah expired
    } finally {
      setUser(null);
      setTasks([]);
      setMembers([]);
      setDivisions([]);
      addToast('info', 'Anda telah keluar dari sistem.');
    }
  };

  // ==========================================================================
  // 9. PERMISSION CHECKERS (FE UX Guard — BE tetap menjadi penentu utama)
  // ==========================================================================

  const canUserEditTask = (task: Task) => {
    if (!user) return false;
    if (user.role === 'division_admin') return true;
    if (user.role === 'member') {
      return task.createdBy === user.id || task.assignees.some((a) => a.id === user.id);
    }
    return false;
  };

  const canUserDeleteTask = (task: Task) => {
    if (!user) return false;
    if (user.role === 'division_admin') return true;
    if (user.role === 'member') {
      return task.createdBy === user.id;
    }
    return false;
  };

  // ==========================================================================
  // 10. TASK CRUD HANDLERS (`POST`, `PATCH`, `DELETE /api/tasks`)
  // ==========================================================================

  const handleSaveTask = async (payload: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
    assigneeIds: string[];
  }) => {
    try {
      if (editingTask) {
        await requestApi('PATCH', `/api/tasks/${editingTask.id}`, {
          title: payload.title,
          description: payload.description,
          status: payload.status,
          priority: payload.priority,
          dueDate: payload.dueDate || null,
          assigneeIds: payload.assigneeIds,
        });
        addToast('success', 'Task berhasil diperbarui.');
      } else {
        // Sesuai BE.md: JANGAN kirim divisionId atau createdBy dari FE
        await requestApi('POST', '/api/tasks', {
          title: payload.title,
          description: payload.description,
          status: payload.status,
          priority: payload.priority,
          dueDate: payload.dueDate || null,
          assigneeIds: payload.assigneeIds,
        });
        addToast('success', 'Task baru berhasil dibuat.');
      }
      setIsTaskModalOpen(false);
      setEditingTask(null);
      await loadWorkspaceData();
    } catch (err: unknown) {
      addToast('error', err instanceof Error ? err.message : 'Gagal menyimpan task');
    }
  };

  const handleQuickStatusChange = async (task: Task, newStatus: TaskStatus) => {
    if (task.status === newStatus) return;
    // Optimistic UI update dengan rollback otomatis bila BE menolak (misal 403)
    const previousTasks = [...tasks];
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    try {
      await requestApi('PATCH', `/api/tasks/${task.id}`, { status: newStatus });
      addToast('success', `Status diubah ke ${newStatus.replace('_', ' ').toUpperCase()}`);
      await loadWorkspaceData();
    } catch (err: unknown) {
      setTasks(previousTasks);
      addToast('error', err instanceof Error ? err.message : 'Tidak diizinkan mengubah status task ini');
    }
  };

  const handleConfirmDeleteTask = async () => {
    if (!deletingTask) return;
    try {
      await requestApi('DELETE', `/api/tasks/${deletingTask.id}`);
      addToast('success', 'Task berhasil dihapus.');
      setDeletingTask(null);
      await loadWorkspaceData();
    } catch (err: unknown) {
      addToast('error', err instanceof Error ? err.message : 'Gagal menghapus task');
    }
  };

  // ==========================================================================
  // 11. MEMBER & DIVISION HANDLERS
  // ==========================================================================

  const handleSaveMember = async (payload: { name: string; email?: string; password?: string }) => {
    try {
      if (editingMember) {
        await requestApi('PATCH', `/api/members/${editingMember.id}`, { name: payload.name });
        addToast('success', 'Data anggota diperbarui.');
      } else {
        await requestApi('POST', '/api/members', {
          name: payload.name,
          email: payload.email,
          password: payload.password,
        });
        addToast('success', 'Member baru berhasil ditambahkan ke divisi.');
      }
      setIsMemberModalOpen(false);
      setEditingMember(null);
      await loadWorkspaceData();
    } catch (err: unknown) {
      addToast('error', err instanceof Error ? err.message : 'Gagal menyimpan data member');
    }
  };

  const handleToggleMemberStatus = async (member: User) => {
    try {
      await requestApi('PATCH', `/api/members/${member.id}/status`, { isActive: !member.isActive });
      addToast('success', `Status akun ${member.name} berhasil diubah.`);
      await loadWorkspaceData();
    } catch (err: unknown) {
      addToast('error', err instanceof Error ? err.message : 'Gagal mengubah status member');
    }
  };

  const handleSaveDivision = async (payload: { name: string; slug: string }) => {
    try {
      if (editingDivision) {
        await requestApi('PATCH', `/api/divisions/${editingDivision.id}`, payload);
        addToast('success', 'Divisi berhasil diperbarui.');
      } else {
        await requestApi('POST', '/api/divisions', payload);
        addToast('success', 'Divisi baru berhasil dibuat.');
      }
      setIsDivisionModalOpen(false);
      setEditingDivision(null);
      await loadWorkspaceData();
    } catch (err: unknown) {
      addToast('error', err instanceof Error ? err.message : 'Gagal menyimpan divisi');
    }
  };

  const handleToggleDivisionStatus = async (div: Division) => {
    try {
      await requestApi('PATCH', `/api/divisions/${div.id}/status`, { isActive: !div.isActive });
      addToast('success', `Divisi ${div.name} kini ${!div.isActive ? 'Aktif' : 'Nonaktif'}.`);
      await loadWorkspaceData();
    } catch (err: unknown) {
      addToast('error', err instanceof Error ? err.message : 'Gagal mengubah status divisi');
    }
  };

  const handleCreateDivisionAdmin = async (payload: { name: string; email: string; password: string }) => {
    if (!adminTargetDivision) return;
    try {
      await requestApi('POST', `/api/divisions/${adminTargetDivision.id}/admins`, payload);
      addToast('success', `Division Admin untuk ${adminTargetDivision.name} berhasil dibuat.`);
      setAdminTargetDivision(null);
    } catch (err: unknown) {
      addToast('error', err instanceof Error ? err.message : 'Gagal membuat Division Admin');
    }
  };

  // ==========================================================================
  // 12. COMPUTED STATS & GROUPED TASKS
  // ==========================================================================

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      done: tasks.filter((t) => t.status === 'done').length,
    };
  }, [tasks]);

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members;
    const q = memberSearch.toLowerCase();
    return members.filter(
      (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    );
  }, [members, memberSearch]);

  // ==========================================================================
  // 13. RENDER: LOADING INITIAL SESSION
  // ==========================================================================

  if (authLoading && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Memeriksa sesi pengguna (`GET /api/auth/me`)...</p>
      </div>
    );
  }

  // ==========================================================================
  // 14. RENDER: LOGIN PAGE (`/login`)
  // ==========================================================================

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/40 to-slate-100 flex flex-col justify-between p-4 sm:p-6">
        {/* Top Connection Switcher Bar */}
        <div className="max-w-5xl w-full mx-auto flex flex-wrap items-center justify-between gap-3 bg-white/80 backdrop-blur border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <Server className="w-4 h-4 text-indigo-600" />
            <span>Mode API Backend:</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setApiMode('live');
                setAuthError(null);
              }}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                apiMode === 'live'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Live API (`/api/...`)
            </button>
            <button
              type="button"
              onClick={() => {
                setApiMode('demo');
                setAuthError(null);
              }}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1 ${
                apiMode === 'demo'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              Demo Sandbox
            </button>
          </div>
        </div>

        {/* Login Card */}
        <LoginForm
          apiMode={apiMode}
          loading={authLoading}
          error={authError}
          onSubmit={handleLogin}
        />

        <div className="text-center text-xs text-slate-400">
          Kanban Multi-Division System &bull; Next.js App Router + Hono + Drizzle + TiDB
        </div>

        <ToastContainer toasts={toasts} />
      </div>
    );
  }

  // ==========================================================================
  // 15. RENDER: AUTHENTICATED APPLICATION SHELL
  // ==========================================================================

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                K
              </div>
              <div>
                <h1 className="font-bold text-slate-900 text-sm leading-tight">KanbanFlow</h1>
                <p className="text-[11px] text-slate-500">Multi-Division Workspace</p>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Division Badge Card */}
          <div className="p-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Scope Aktif
              </div>
              <div className="flex items-center gap-2 font-semibold text-sm text-slate-800">
                <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="truncate">
                  {user.role === 'platform_admin'
                    ? 'Platform Organization'
                    : user.division?.name || 'Divisi Terdaftar'}
                </span>
              </div>
              <div className="mt-2">
                <RoleBadge role={user.role} />
              </div>
            </div>
          </div>

          {/* Navigation Links (Sesuai Hak Akses Role di BE.md) */}
          <nav className="px-3 space-y-1">
            {user.role === 'platform_admin' ? (
              <button
                onClick={() => {
                  setActiveRoute('divisions');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  activeRoute === 'divisions'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Division Management
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setActiveRoute('dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    activeRoute === 'dashboard'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Kanban Board
                </button>

                {user.role === 'division_admin' && (
                  <button
                    onClick={() => {
                      setActiveRoute('members');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                      activeRoute === 'members'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Anggota Divisi
                  </button>
                )}
              </>
            )}
          </nav>
        </div>

        {/* User Profile & Logout Footer */}
        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
              {getInitials(user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-sm font-medium transition"
          >
            <LogOut className="w-4 h-4" />
            Keluar (`POST /logout`)
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {activeRoute === 'divisions' && 'Manajemen Divisi Organisasi'}
                {activeRoute === 'dashboard' && `Kanban Board — ${user.division?.name || 'Divisi'}`}
                {activeRoute === 'members' && `Manajemen Anggota — ${user.division?.name || 'Divisi'}`}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* API Mode Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
              <span
                className={`w-2 h-2 rounded-full ${
                  apiMode === 'live' ? 'bg-indigo-600' : 'bg-emerald-500'
                }`}
              />
              {apiMode === 'live' ? 'Live Hono API' : 'Demo Sandbox'}
            </div>

            {activeRoute === 'dashboard' && user.role !== 'platform_admin' && (
              <button
                onClick={() => {
                  setEditingTask(null);
                  setIsTaskModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Task</span>
              </button>
            )}

            {activeRoute === 'members' && user.role === 'division_admin' && (
              <button
                onClick={() => {
                  setEditingMember(null);
                  setIsMemberModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah Member</span>
              </button>
            )}

            {activeRoute === 'divisions' && user.role === 'platform_admin' && (
              <button
                onClick={() => {
                  setEditingDivision(null);
                  setIsDivisionModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Divisi</span>
              </button>
            )}
          </div>
        </header>

        {/* Main View Router */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {/* ================================================================ */}
          {/* VIEW A: PLATFORM ADMIN — DIVISION MANAGEMENT (`/divisions`)        */}
          {/* ================================================================ */}
          {activeRoute === 'divisions' && user.role === 'platform_admin' && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                <div className="text-sm text-purple-900">
                  <p className="font-semibold">Hak Akses Platform Admin</p>
                  <p className="text-purple-700 mt-0.5">
                    Anda dapat membuat divisi baru, mengaktifkan/menonaktifkan divisi, dan menunjuk{' '}
                    <code className="bg-purple-100 px-1 rounded">division_admin</code>. Sesuai aturan keamanan,
                    Platform Admin tidak mengakses papan task internal divisi.
                  </p>
                </div>
              </div>

              {dataLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
              ) : divisions.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                  <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-slate-900">Belum Ada Divisi</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Mulai dengan membuat divisi pertama (misalnya IT atau Marketing).
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {divisions.map((div) => (
                    <div
                      key={div.id}
                      className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">{div.name}</h3>
                            <p className="text-xs font-mono text-slate-500 mt-0.5">slug: {div.slug}</p>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              div.isActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {div.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingDivision(div);
                            setIsDivisionModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </button>

                        <button
                          onClick={() => handleToggleDivisionStatus(div)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
                            div.isActive
                              ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          {div.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>

                        {div.isActive && (
                          <button
                            onClick={() => setAdminTargetDivision(div)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold ml-auto"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            + Admin Divisi
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* VIEW B: KANBAN DASHBOARD (`/dashboard`)                          */}
          {/* ================================================================ */}
          {activeRoute === 'dashboard' && user.role !== 'platform_admin' && (
            <div className="space-y-6">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-medium text-slate-500">Total Task Divisi</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                    <Circle className="w-3.5 h-3.5 text-slate-400" /> To Do
                  </p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{stats.todo}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-medium text-indigo-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> In Progress
                  </p>
                  <p className="text-2xl font-bold text-indigo-700 mt-1">{stats.inProgress}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-medium text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Done
                  </p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.done}</p>
                </div>
              </div>

              {/* Search & Filter Bar (`GET /api/tasks?q=&priority=&assigneeId=`) */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari judul atau deskripsi task..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex flex-wrap sm:flex-nowrap gap-2">
                  <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                    <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="w-full sm:w-36 px-2.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="all">Semua Prioritas</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <select
                    value={assigneeFilter}
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                    className="flex-1 sm:w-44 px-2.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">Semua Assignee</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3-Column Kanban Board */}
              {dataLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                  <p className="text-sm text-slate-500">Memuat board divisi...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                  {(
                    [
                      { key: 'todo', title: 'To Do', badgeBg: 'bg-slate-200 text-slate-700', dot: 'bg-slate-500' },
                      { key: 'in_progress', title: 'In Progress', badgeBg: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-600' },
                      { key: 'done', title: 'Done', badgeBg: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-600' },
                    ] as const
                  ).map((col) => {
                    const colTasks = tasks.filter((t) => t.status === col.key);
                    return (
                      <div
                        key={col.key}
                        className="bg-slate-100/80 border border-slate-200/80 rounded-xl p-3.5 space-y-3"
                      >
                        {/* Column Header */}
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                            <h3 className="font-bold text-sm text-slate-800">{col.title}</h3>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.badgeBg}`}>
                            {colTasks.length}
                          </span>
                        </div>

                        {/* Task Cards */}
                        {colTasks.length === 0 ? (
                          <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center text-xs text-slate-400">
                            Belum ada task di kolom ini
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {colTasks.map((task) => {
                              const editable = canUserEditTask(task);
                              const deletable = canUserDeleteTask(task);
                              return (
                                <div
                                  key={task.id}
                                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition space-y-3"
                                >
                                  {/* Card Top: Priority & Actions */}
                                  <div className="flex items-start justify-between gap-2">
                                    <PriorityBadge priority={task.priority} />
                                    <div className="flex items-center gap-1">
                                      {editable ? (
                                        <button
                                          onClick={() => {
                                            setEditingTask(task);
                                            setIsTaskModalOpen(true);
                                          }}
                                          title="Edit Task"
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                      ) : (
                                        <span
                                          title="Read-only: Bukan pembuat atau assignee task ini"
                                          className="p-1.5 text-slate-300"
                                        >
                                          <Lock className="w-3.5 h-3.5" />
                                        </span>
                                      )}

                                      {deletable && (
                                        <button
                                          onClick={() => setDeletingTask(task)}
                                          title="Hapus Task"
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Title & Description */}
                                  <div>
                                    <h4 className="font-semibold text-sm text-slate-900 leading-snug">
                                      {task.title}
                                    </h4>
                                    {task.description && (
                                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                        {task.description}
                                      </p>
                                    )}
                                  </div>

                                  {/* Assignees & Due Date */}
                                  <div className="flex items-center justify-between pt-1">
                                    <div className="flex -space-x-1.5 overflow-hidden">
                                      {task.assignees.length === 0 ? (
                                        <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                                      ) : (
                                        task.assignees.map((a) => (
                                          <div
                                            key={a.id}
                                            title={a.name}
                                            className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white text-indigo-700 text-[10px] font-bold flex items-center justify-center"
                                          >
                                            {getInitials(a.name)}
                                          </div>
                                        ))
                                      )}
                                    </div>

                                    {task.dueDate && (
                                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                                        <Calendar className="w-3 h-3 text-slate-400" />
                                        <span>{task.dueDate.slice(0, 10)}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Quick Status Switcher (Hanya aktif jika user punya izin edit) */}
                                  {editable && (
                                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1">
                                      <span className="text-[11px] text-slate-400">Pindah:</span>
                                      <div className="flex gap-1">
                                        {(['todo', 'in_progress', 'done'] as TaskStatus[]).map((st) => (
                                          <button
                                            key={st}
                                            disabled={task.status === st}
                                            onClick={() => handleQuickStatusChange(task, st)}
                                            className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                                              task.status === st
                                                ? 'bg-indigo-600 text-white cursor-default'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                          >
                                            {st === 'todo' ? 'To Do' : st === 'in_progress' ? 'Progress' : 'Done'}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* VIEW C: MEMBER MANAGEMENT (`/members` - Khusus Division Admin)   */}
          {/* ================================================================ */}
          {activeRoute === 'members' && user.role === 'division_admin' && (
            <div className="space-y-5">
              {/* Search Bar */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Cari nama atau email anggota divisi..."
                  className="flex-1 text-sm focus:outline-none"
                />
              </div>

              {/* Members Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                        <th className="py-3.5 px-4">Anggota</th>
                        <th className="py-3.5 px-4">Role</th>
                        <th className="py-3.5 px-4">Status Akun</th>
                        <th className="py-3.5 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredMembers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400">
                            Tidak ada anggota yang ditemukan.
                          </td>
                        </tr>
                      ) : (
                        filteredMembers.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50/70">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                                  {getInitials(m.name)}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">{m.name}</p>
                                  <p className="text-xs text-slate-500">{m.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <RoleBadge role={m.role} />
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  m.isActive
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {m.isActive ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {m.role === 'member' ? (
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingMember(m);
                                      setIsMemberModalOpen(true);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                  >
                                    Edit Nama
                                  </button>
                                  <button
                                    onClick={() => handleToggleMemberStatus(m)}
                                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
                                      m.isActive
                                        ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                                        : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                    }`}
                                  >
                                    {m.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 italic">Admin Divisi</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ==================================================================== */}
      {/* MODALS (Create/Edit Task, Delete Confirm, Member, Division)          */}
      {/* ==================================================================== */}

      {isTaskModalOpen && (
        <TaskFormModal
          initialTask={editingTask}
          divisionMembers={members.filter((m) => m.isActive)}
          onClose={() => {
            setIsTaskModalOpen(false);
            setEditingTask(null);
          }}
          onSave={handleSaveTask}
        />
      )}

      {deletingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Hapus Task?</h3>
                <p className="text-xs text-slate-500">Tindakan ini permanen (`DELETE /api/tasks/:id`).</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Anda yakin ingin menghapus task <span className="font-semibold">"{deletingTask.title}"</span>?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingTask(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDeleteTask}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {isMemberModalOpen && (
        <MemberFormModal
          initialMember={editingMember}
          onClose={() => {
            setIsMemberModalOpen(false);
            setEditingMember(null);
          }}
          onSave={handleSaveMember}
        />
      )}

      {isDivisionModalOpen && (
        <DivisionFormModal
          initialDivision={editingDivision}
          onClose={() => {
            setIsDivisionModalOpen(false);
            setEditingDivision(null);
          }}
          onSave={handleSaveDivision}
        />
      )}

      {adminTargetDivision && (
        <DivisionAdminFormModal
          division={adminTargetDivision}
          onClose={() => setAdminTargetDivision(null)}
          onSave={handleCreateDivisionAdmin}
        />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}

// ============================================================================
// 16. SUB-COMPONENTS: LOGIN & MODALS
// ============================================================================

function LoginForm({
  apiMode,
  loading,
  error,
  onSubmit,
}: {
  apiMode: 'live' | 'demo';
  loading: boolean;
  error: string | null;
  onSubmit: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    onSubmit(email.trim(), password);
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
      <div className="text-center space-y-1.5">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-xl flex items-center justify-center mx-auto shadow-md mb-3">
          K
        </div>
        <h1 className="text-xl font-bold text-slate-900">Masuk ke KanbanFlow</h1>
        <p className="text-xs text-slate-500">
          Autentikasi berbasis HttpOnly Session Cookie (`POST /api/auth/login`)
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@kantor.com"
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold shadow-sm flex items-center justify-center gap-2 transition"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
          <span>{loading ? 'Memproses...' : 'Masuk'}</span>
        </button>
      </form>

      {/* Quick Demo Accounts (Hanya tampil saat Demo Sandbox aktif) */}
      {apiMode === 'demo' && (
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Akun Cepat Demo Sandbox (Klik untuk isi):
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            {[
              { label: 'Platform Admin', email: 'platform@kantor.com' },
              { label: 'Division Admin (IT)', email: 'andi.it@kantor.com' },
              { label: 'Member (IT - Siti)', email: 'siti.it@kantor.com' },
            ].map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => {
                  setEmail(acc.email);
                  setPassword('PasswordDemo123!');
                }}
                className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 text-xs text-slate-700 border border-slate-200/80 transition"
              >
                <span className="font-semibold">{acc.label}</span>
                <span className="font-mono text-[11px] text-slate-500">{acc.email}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskFormModal({
  initialTask,
  divisionMembers,
  onClose,
  onSave,
}: {
  initialTask: Task | null;
  divisionMembers: User[];
  onClose: () => void;
  onSave: (payload: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
    assigneeIds: string[];
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [status, setStatus] = useState<TaskStatus>(initialTask?.status || 'todo');
  const [priority, setPriority] = useState<TaskPriority>(initialTask?.priority || 'medium');
  const [dueDate, setDueDate] = useState(initialTask?.dueDate ? initialTask.dueDate.slice(0, 10) : '');
  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    initialTask?.assignees.map((a) => a.id) || []
  );
  const [submitting, setSubmitting] = useState(false);

  const toggleAssignee = (id: string) => {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onSave({ title: title.trim(), description, status, priority, dueDate, assigneeIds });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            {initialTask ? 'Edit Task' : 'Buat Task Baru'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Task *</label>
            <input
              type="text"
              required
              maxLength={160}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Migrasi Schema TiDB"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail pekerjaan yang perlu dilakukan..."
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Prioritas</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* Multi-Assignee Picker (Satu Divisi) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assignee (Anggota Divisi Aktif)
            </label>
            {divisionMembers.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Tidak ada daftar anggota tersedia.</p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2.5 rounded-xl border border-slate-200 bg-slate-50/50">
                {divisionMembers.map((m) => {
                  const selected = assigneeIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleAssignee(m.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                        selected
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {selected && <Check className="w-3 h-3" />}
                      <span>{m.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center gap-1.5"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{initialTask ? 'Simpan Perubahan' : 'Buat Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MemberFormModal({
  initialMember,
  onClose,
  onSave,
}: {
  initialMember: User | null;
  onClose: () => void;
  onSave: (payload: { name: string; email?: string; password?: string }) => Promise<void>;
}) {
  const [name, setName] = useState(initialMember?.name || '');
  const [email, setEmail] = useState(initialMember?.email || '');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave({ name, email, password });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            {initialMember ? 'Edit Nama Member' : 'Tambah Member Divisi'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          {!initialMember && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password Awal * (Min. 12 karakter)
                </label>
                <input
                  type="password"
                  required
                  minLength={12}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
            >
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DivisionFormModal({
  initialDivision,
  onClose,
  onSave,
}: {
  initialDivision: Division | null;
  onClose: () => void;
  onSave: (payload: { name: string; slug: string }) => Promise<void>;
}) {
  const [name, setName] = useState(initialDivision?.name || '');
  const [slug, setSlug] = useState(initialDivision?.slug || '');
  const [submitting, setSubmitting] = useState(false);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!initialDivision) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave({ name: name.trim(), slug: slug.trim() });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            {initialDivision ? 'Edit Divisi' : 'Buat Divisi Baru'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Divisi *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Contoh: Information Technology"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Slug Unik *</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="it"
              className="w-full px-3.5 py-2 text-sm font-mono border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Divisi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DivisionAdminFormModal({
  division,
  onClose,
  onSave,
}: {
  division: Division;
  onClose: () => void;
  onSave: (payload: { name: string; email: string; password: string }) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave({ name, email, password });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Tambah Division Admin</h3>
            <p className="text-xs text-slate-500">Divisi: {division.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Admin *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password Awal * (Min. 12 karakter)
            </label>
            <input
              type="password"
              required
              minLength={12}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
            >
              {submitting ? 'Membuat...' : 'Buat Admin Divisi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ToastContainer({ toasts }: { toasts: ToastMessage[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2.5 ${
            t.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : t.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {t.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {t.type === 'info' && <Info className="w-4 h-4 text-indigo-400 shrink-0" />}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}