
import { Hono } from "hono";
import { RowDataPacket } from "mysql2";
import { pool } from "../../db";

export const healthRoutes = new Hono();

// Cek backend
healthRoutes.get("/health", (c) => {
  return c.json({
    success: true,
    message: "Kanban API is running",
  }, 200);
});

// Cek koneksi MySQL
healthRoutes.get("/health/db", async (c) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT
        1 AS connected,
        DATABASE() AS database_name,
        VERSION() AS mysql_version
    `);

    return c.json({
      success: true,
      message: "MySQL connection successful",
      data: {
        connected: rows[0].connected === 1,
        database: rows[0].database_name,
        version: rows[0].mysql_version,
      },
    }, 200);

  } catch (error) {
    console.error("[DATABASE CONNECTION ERROR]:", error);

    return c.json({
      success: false,
      message: "Database connection failed",
    }, 500);
  }
});
