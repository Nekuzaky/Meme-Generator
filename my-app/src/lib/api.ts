export const API_TOKEN_KEY = "meme-creator-api-token";

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/+$/, "");

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

export interface ApiModerationReport {
  id: number;
  meme_id: number;
  reporter_user_id?: number | null;
  reason: string;
  details?: string | null;
  status: "open" | "reviewed" | "dismissed";
  reviewed_by_user_id?: number | null;
  resolution_note?: string | null;
  created_at: string;
  reviewed_at?: string | null;
  title?: string;
  user_id?: number;
  reporter_username?: string | null;
}

export interface ApiBlacklistTerm {
  id: number;
  term: string;
  is_active: boolean | number;
  created_at: string;
}

export interface ApiMemeSuggestion {
  top: string;
  bottom: string;
}

type ApiResponse<T> = {
  ok: boolean;
  error?: string;
} & T;

function tryParseJson<T>(raw: string): ApiResponse<T> | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;

  try {
    return JSON.parse(trimmed) as ApiResponse<T>;
  } catch {
    // Continue with fallback extraction below.
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  const candidate = trimmed.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(candidate) as ApiResponse<T>;
  } catch {
    return null;
  }
}

function buildApiCandidates(path: string): string[] {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const queryIndex = normalizedPath.indexOf("?");
  const pathname =
    queryIndex >= 0 ? normalizedPath.slice(0, queryIndex) : normalizedPath;
  const queryString = queryIndex >= 0 ? normalizedPath.slice(queryIndex + 1) : "";
  const routePath = pathname.replace(/^\/+/, "");
  const querySuffix = queryString ? `?${queryString}` : "";
  const candidates = [`${API_BASE}${pathname}${querySuffix}`];

  const params = new URLSearchParams(queryString);
  params.set("_path", routePath);
  const indexPhpQuerySuffix = `?${params.toString()}`;

  if (API_BASE.toLowerCase().endsWith("/index.php")) {
    candidates.push(`${API_BASE}${indexPhpQuerySuffix}`);
  } else {
    candidates.push(`${API_BASE}/index.php${pathname}${querySuffix}`);
    candidates.push(`${API_BASE}/index.php${indexPhpQuerySuffix}`);
  }
  return Array.from(new Set(candidates));
}

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

  const candidates = buildApiCandidates(path);
  let lastNetworkError: Error | null = null;

  for (let index = 0; index < candidates.length; index += 1) {
    const isLastCandidate = index === candidates.length - 1;
    const candidate = candidates[index];

    let res: Response;
    try {
      res = await fetch(candidate, {
        ...options,
        headers,
      });
    } catch (error) {
      if (error instanceof Error) {
        lastNetworkError = error;
      }
      if (!isLastCandidate) {
        continue;
      }
      throw lastNetworkError ?? new Error("Network error");
    }

    const rawBody = await res.text();
    const body = tryParseJson<T>(rawBody);

    if (res.status === 404 && !isLastCandidate) {
      continue;
    }

    if (!body && rawBody.trim() !== "") {
      if (/<html[\s>]/i.test(rawBody)) {
        throw new Error(!res.ok ? `HTTP ${res.status}` : "API returned HTML instead of JSON");
      }
      throw new Error(!res.ok ? `HTTP ${res.status}` : "Invalid API response");
    }

    if (!body) {
      throw new Error(!res.ok ? `HTTP ${res.status}` : "Empty API response");
    }

    if (!res.ok || body.ok === false) {
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    return body;
  }

  throw lastNetworkError ?? new Error("HTTP 404");
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

export async function getModerationReportsApi(
  token: string,
  params?: {
    status?: "open" | "reviewed" | "dismissed" | "all";
    limit?: number;
    offset?: number;
  }
) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  if (params?.offset !== undefined) query.set("offset", String(params.offset));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request<{ items: ApiModerationReport[] }>(
    `/moderation/reports${suffix}`,
    { method: "GET" },
    token
  );
}

export async function reviewModerationReportApi(
  token: string,
  id: number | string,
  payload: {
    status: "open" | "reviewed" | "dismissed";
    resolution_note?: string;
  }
) {
  return request<{ updated: boolean }>(
    `/moderation/reports/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );
}

export async function getModerationBlacklistApi(token: string) {
  return request<{ items: ApiBlacklistTerm[] }>(
    "/moderation/blacklist",
    { method: "GET" },
    token
  );
}

export async function createModerationBlacklistApi(
  token: string,
  payload: { term: string }
) {
  return request<{ created: boolean }>(
    "/moderation/blacklist",
    { method: "POST", body: JSON.stringify(payload) },
    token
  );
}

export async function deleteModerationBlacklistApi(
  token: string,
  id: number | string
) {
  return request<{ deleted: boolean }>(
    `/moderation/blacklist/${id}`,
    { method: "DELETE" },
    token
  );
}
