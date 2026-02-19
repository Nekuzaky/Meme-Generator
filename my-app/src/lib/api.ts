export const API_TOKEN_KEY = "meme-creator-api-token";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

export interface ApiUser {
  id: number;
  username: string;
  email: string;
  created_at?: string;
  is_admin?: boolean;
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
  moderation_status?: "pending" | "approved" | "rejected";
  moderation_reason?: string | null;
  favorites_count?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ApiMemeVersion {
  id: number;
  meme_id: number;
  version_label?: string | null;
  change_source: "create" | "update" | "autosave" | "manual" | "restore";
  created_at: string;
  created_by_user_id?: number | null;
}

export interface ApiMemeSuggestion {
  top: string;
  bottom: string;
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
    user: ApiUser & { is_admin?: boolean };
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

export async function autosaveMemeApi(
  token: string,
  payload: {
    id?: number;
    title?: string;
    description?: string;
    source_image_url?: string;
    generated_image_url?: string;
    payload?: unknown;
    tags?: string[];
    is_public?: boolean;
  }
) {
  return request<{
    id: number;
    created: boolean;
    updated: boolean;
    moderation_status?: "pending" | "approved" | "rejected";
  }>(
    "/memes/autosave",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function getPublicMemesApi(params?: { limit?: number; offset?: number; q?: string }) {
  const query = new URLSearchParams();
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  if (params?.offset !== undefined) query.set("offset", String(params.offset));
  if (params?.q) query.set("q", params.q);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request<{ items: ApiMeme[] }>(`/memes/public${suffix}`, { method: "GET" });
}

export async function getPublicMemeApi(id: number | string) {
  return request<{ item: ApiMeme }>(`/memes/${id}`, { method: "GET" });
}

export async function reportMemeApi(
  id: number | string,
  params: { reason: string; details?: string },
  token: string
) {
  return request<{ reported: boolean }>(
    `/memes/${id}/report`,
    {
      method: "POST",
      body: JSON.stringify(params),
    },
    token
  );
}

export async function getMemeVersionsApi(token: string, id: number | string) {
  return request<{ items: ApiMemeVersion[] }>(`/memes/${id}/versions`, { method: "GET" }, token);
}

export async function createMemeVersionApi(
  token: string,
  id: number | string,
  label?: string
) {
  return request<{ created: boolean }>(
    `/memes/${id}/versions`,
    {
      method: "POST",
      body: JSON.stringify({ label }),
    },
    token
  );
}

export async function restoreMemeVersionApi(
  token: string,
  id: number | string,
  versionId: number | string
) {
  return request<{ restored: boolean; item: ApiMeme }>(
    `/memes/${id}/restore/${versionId}`,
    { method: "POST", body: JSON.stringify({}) },
    token
  );
}

export async function generateMemeSuggestionsApi(params: {
  language: string;
  topic?: string;
  style?: string;
}) {
  return request<{ items: ApiMemeSuggestion[]; provider: "openai" | "local" }>(
    "/ai/meme-suggestions",
    {
      method: "POST",
      body: JSON.stringify(params),
    }
  );
}

export async function getModerationMemesApi(
  token: string,
  params?: { status?: "pending" | "approved" | "rejected"; limit?: number; offset?: number }
) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  if (params?.offset !== undefined) query.set("offset", String(params.offset));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request<{ items: ApiMeme[] }>(`/moderation/memes${suffix}`, { method: "GET" }, token);
}

export async function moderateMemeApi(
  token: string,
  id: number | string,
  payload: { status: "pending" | "approved" | "rejected"; reason?: string }
) {
  return request<{ updated: boolean }>(
    `/moderation/memes/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );
}
