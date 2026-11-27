import { apiFetch } from "@/lib/api-client";
import { LoginInput, Role, User } from "@/types/auth";

function mapUserFromBackend(raw: unknown): User {
  const obj = (raw || {}) as Record<string, unknown>;
  const u = (obj.user && typeof obj.user === "object" ? obj.user : obj) as Record<string, unknown>;
  const div = (u.division && typeof u.division === "object" ? u.division : null) as Record<string, unknown> | null;

  const rawRole = String(u.role || "member");
  // Jika komponen UI temanmu mengecek `user.role === "admin"`, arahkan division_admin agar kompatibel
  const mappedRole: Role =
    rawRole === "division_admin"
      ? "admin"
      : (rawRole as Role);

  return {
    id: String(u.id || ""),
    name: String(u.name || u.email || "User"),
    email: String(u.email || ""),
    role: mappedRole,
    division_id: String(u.divisionId || u.division_id || div?.id || ""),
    division_name: String(div?.name || u.divisionName || u.division_name || ""),
    is_active: u.isActive !== undefined ? Boolean(u.isActive) : Boolean(u.is_active ?? true),
    created_at: String(u.createdAt || u.created_at || ""),
  };
}

export const authApi = {
  async login(input: LoginInput): Promise<{ message: string; user: User }> {
    const loginData = await apiFetch<unknown>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });

    // Setelah login berhasil & cookie terpasang, ambil profil lengkap dari /api/auth/me
    try {
      const meData = await apiFetch<unknown>("/api/auth/me");
      return {
        message: "Login berhasil",
        user: mapUserFromBackend(meData),
      };
    } catch {
      return {
        message: "Login berhasil",
        user: mapUserFromBackend(loginData),
      };
    }
  },

  async logout(): Promise<void> {
    await apiFetch<null>("/api/auth/logout", {
      method: "POST",
    });
  },

  async getMe(): Promise<{ user: User }> {
    const meData = await apiFetch<unknown>("/api/auth/me");
    return {
      user: mapUserFromBackend(meData),
    };
  },
};