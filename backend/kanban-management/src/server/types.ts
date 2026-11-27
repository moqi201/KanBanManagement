
export type UserRole =
  | "platform_admin"
  | "division_admin"
  | "member";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  divisionId: string | null;
  division: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export type AppEnv = {
  Variables: {
    authUser: AuthenticatedUser;
    sessionId: string;
  };
};
