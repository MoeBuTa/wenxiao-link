export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function readError(resp: Response, fallback: string): Promise<string> {
  try {
    const err = (await resp.json()) as Record<string, unknown> & {
      detail?: string;
    };
    if (err.detail) return String(err.detail);
    const firstField = Object.entries(err).find(
      ([, v]) => Array.isArray(v) && (v as unknown[]).length > 0,
    );
    if (firstField) {
      const [field, msgs] = firstField;
      return `${field}: ${(msgs as string[])[0]}`;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers: HeadersInit = { ...(init?.headers ?? {}) };
  if (init?.body && !(init.body instanceof FormData)) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }
  return fetch(path, {
    credentials: "include",
    ...init,
    headers,
  });
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const resp = await apiFetch(path, init);
  if (!resp.ok) {
    throw new ApiError(await readError(resp, `Request failed (${resp.status})`), resp.status);
  }
  if (resp.status === 204) return undefined as T;
  return (await resp.json()) as T;
}
