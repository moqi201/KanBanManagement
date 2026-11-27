const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface BackendApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: unknown[];
}

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include", // Wajib agar HttpOnly cookie session selalu dikirim ke Hono
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  let json: BackendApiResponse<T>;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Respons server tidak valid (HTTP ${res.status})`);
  }

  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Request gagal (HTTP ${res.status})`);
  }

  return json.data;
}

// Helper untuk mengekstrak array jika backend membungkusnya di dalam properti object
export function extractList<T>(raw: unknown, keys: string[]): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const k of keys) {
      if (Array.isArray(obj[k])) return obj[k] as T[];
    }
  }
  return [];
}