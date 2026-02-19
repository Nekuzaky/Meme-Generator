export const API_TOKEN_KEY = "meme-creator-api-token";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

export interface ApiUser {
  id: number;
  username: string;
  email: string;
  created_at?: string;
}

export interface ApiMeme {
  id: number;
  user_id: number;
  username?: string | null;
  title: string;
  description?: string | null;
  source_image_url?: string | null;
  generated_image_url?: string | null;
  payload?: unknown;
  tags?: string[];
  is_public: boolean;
  favorites_count?: number | null;
  created_at: string;
  updated_at: string;
}

type ApiResponse<T> = {
  ok: boolean;
  error?: string;
} & T;

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  const rawBody = await res.text();
  let body: ApiResponse<T> | null = null;
  if (rawBody.trim() !== "") {
    try {
      body = JSON.parse(rawBody) as ApiResponse<T>;
    } catch {
      throw new Error(!res.ok ? `HTTP ${res.status}` : "Invalid API response");
    }
  }

  if (!body) {
    throw new Error(!res.ok ? `HTTP ${res.status}` : "Empty API response");
  }

  if (!res.ok || body.ok === false) {
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return body;
}

export async function registerApi(params: {
  username: string;
  email: string;
  password: string;
}) {
  return request<{ token: string; user: ApiUser }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function loginApi(params: { email: string; password: string }) {
  return request<{ token: string; user: ApiUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function logoutApi(token: string) {
  return request<{ logged_out: boolean }>(
    "/auth/logout",
    {
      method: "POST",
      body: JSON.stringify({}),
    },
    token
  );
}

export async function getMeApi(token: string) {
  return request<{
    user: ApiUser;
    stats: { total_memes: number; public_memes: number };
  }>("/me", { method: "GET" }, token);
}

export async function getMyMemesApi(token: string) {
  return request<{ items: ApiMeme[] }>("/memes", { method: "GET" }, token);
}

export async function deleteMemeApi(token: string, id: number) {
  return request<{ deleted: boolean }>(`/memes/${id}`, { method: "DELETE" }, token);
}

export async function updateMemeApi(
  token: string,
  id: number,
  payload: Record<string, unknown>
) {
  return request<{ updated: boolean }>(
    `/memes/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function saveMemeApi(
  token: string,
  payload: {
    title: string;
    description?: string;
    source_image_url?: string;
    generated_image_url?: string;
    payload?: unknown;
    tags?: string[];
    is_public?: boolean;
  }
) {
  return request<{ id: number }>(
    "/memes",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  );
}
