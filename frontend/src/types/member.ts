import { Role } from "./auth";

export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "inactive";
  division_id: string;
  created_at?: string;
}

export interface CreateMemberInput {
  name: string;
  email: string;
  password?: string;
  role?: string;
}