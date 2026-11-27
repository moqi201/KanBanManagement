// Mendukung role lama FE ("admin") maupun role final BE ("platform_admin" | "division_admin" | "member")
export type Role = "platform_admin" | "division_admin" | "admin" | "member";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  division_id: string;
  division_name?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}