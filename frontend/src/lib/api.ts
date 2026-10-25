import type { Category } from "./options";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/$/, "");
const TIMEOUT_MS = 15000;

export type ApiFieldError = { path: string; message: string };

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public details: ApiFieldError[] = [],
  ) {
    super(message);
  }
}

type Budget = { min: number; max: number; currency: string };

export type Requirement = {
  id: string;
  category: Category;
  eventName: string;
  eventType: string;
  startDate: string;
  endDate?: string;
  location: string;
  venue?: string;
  status: "open" | "closed";
  createdAt: string;
  details: {
    budget: Budget;
    notes?: string;
    [key: string]: unknown;
  };
};

export type Pagination = { page: number; limit: number; total: number; totalPages: number };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      signal: init?.signal ?? AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === "TimeoutError";
    throw new ApiError(
      timedOut
        ? "The server took too long to respond. It may be waking up — please try again."
        : "Couldn't reach the server. Check your connection and try again.",
      0,
      timedOut ? "TIMEOUT" : "NETWORK_ERROR",
    );
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      body?.error?.message ?? `Request failed (${res.status})`,
      res.status,
      body?.error?.code ?? "UNKNOWN",
      body?.error?.details ?? [],
    );
  }
  return body as T;
}

export function createRequirement(payload: unknown) {
  return request<{ data: Requirement }>("/api/requirements", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listRequirements(params: { category?: Category; page?: number; limit?: number }, signal?: AbortSignal) {
  const qs = new URLSearchParams();
  if (params.category) qs.set("category", params.category);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  return request<{ data: Requirement[]; pagination: Pagination }>(`/api/requirements?${qs}`, { signal });
}

export function getRequirementStats(signal?: AbortSignal) {
  return request<{ data: { total: number; byCategory: Record<Category, number> } }>("/api/requirements/stats", {
    signal,
  });
}
