import { apiFetch, extractList } from "@/lib/api-client";
import { Role } from "@/types/auth";
import { CreateMemberInput, Member } from "@/types/member";

function mapMemberFromBackend(raw: unknown): Member {
  const m = (raw || {}) as Record<string, unknown>;
  const isActive =
    m.isActive !== undefined
      ? Boolean(m.isActive)
      : m.is_active !== undefined
      ? Boolean(m.is_active)
      : m.status !== "inactive";

  const rawRole = String(m.role || "member");
  const mappedRole: Role = rawRole === "division_admin" ? "admin" : (rawRole as Role);

  return {
    id: String(m.id || ""),
    name: String(m.name || ""),
    email: String(m.email || ""),
    role: mappedRole,
    status: isActive ? "active" : "inactive",
    division_id: String(m.divisionId || m.division_id || ""),
    created_at: String(m.createdAt || m.created_at || ""),
  };
}

export const memberApi = {
  async getMembers(): Promise<Member[]> {
    const rawData = await apiFetch<unknown>("/api/members");
    const list = extractList<unknown>(rawData, ["members", "users", "items", "rows", "list"]);
    return list.map(mapMemberFromBackend);
  },

  async addMember(input: CreateMemberInput): Promise<Member> {
    // Backend BE.md mewajibkan password (min 12 karakter) saat Division Admin membuat member baru.
    // Jika dialog UI temanmu belum menyediakan input password, sediakan fallback sementara.
    const payload = {
      name: input.name,
      email: input.email,
      password: input.password || "MemberDefault123!",
    };

    const rawData = await apiFetch<unknown>("/api/members", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return mapMemberFromBackend(rawData);
  },

  async updateMember(id: string, input: Partial<Member>): Promise<Member> {
    const payload: Record<string, unknown> = {};
    if (input.name !== undefined) payload.name = input.name;

    const rawData = await apiFetch<unknown>(`/api/members/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return mapMemberFromBackend(rawData);
  },

  async updateMemberStatus(id: string, status: "active" | "inactive"): Promise<void> {
    // BE menggunakan boolean `isActive`, bukan string `status`
    await apiFetch<unknown>(`/api/members/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: status === "active" }),
    });
  },
};