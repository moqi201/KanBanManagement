import { Hono } from "hono";
import type { AppEnv } from "./types";
import { healthRoutes } from "./routes/health.routes";
import { authRoutes } from "./routes/auth.routes";
import { divisionRoutes } from "./routes/division.routes";
import { taskRoutes } from "./routes/task.routes";
import { memberRoutes } from "./routes/member.routes";
import {
  corsMiddleware,
  csrfMiddleware,
} from "./middleware/security.middleware";
const app = new Hono<AppEnv>();
app.use("*", corsMiddleware);
app.use("*", csrfMiddleware);

app.route("/api", healthRoutes);
app.route("/api/auth", authRoutes);
app.route("/api", divisionRoutes);
app.route("/api", taskRoutes);
app.route("/api", memberRoutes);

app.notFound((c) => {
  return c.json(
    {
      success: false,
      message: "Endpoint tidak ditemukan",
    },
    404
  );
});

app.onError((error, c) => {
  console.error("[Hono Error]:", error);

  return c.json(
    {
      success: false,
      message: "Terjadi kesalahan pada server",
    },
    500
  );
});

export { app };