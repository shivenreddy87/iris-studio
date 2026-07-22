/**
 * API adapter layer.
 *
 * All frontend data access flows through this module so it can later be
 * pointed at the FastAPI backend without touching UI code.
 *
 * Set VITE_API_BASE_URL to enable real requests. Until then, the adapters
 * return mocked demo data.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export type ApiRequest<T = unknown> = {
  path: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: T;
  signal?: AbortSignal;
};

export async function apiRequest<TResponse, TBody = unknown>({
  path,
  method = "GET",
  body,
  signal,
}: ApiRequest<TBody>): Promise<TResponse> {
  if (!API_BASE_URL) {
    // Mock mode — features/* implement their own mock adapters until FastAPI is live.
    throw new Error(
      `apiRequest called for ${path} but VITE_API_BASE_URL is not set. ` +
        `Use a feature-level mock adapter, or set the FastAPI base URL.`,
    );
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
  if (!res.ok) throw new Error(`API ${method} ${path} failed: ${res.status}`);
  return res.json() as Promise<TResponse>;
}

// ---------------------------------------------------------------------------
// Endpoint contracts (mirrors of the FastAPI surface — safe to import from UI)
// ---------------------------------------------------------------------------
export const endpoints = {
  me: () => `/api/v1/me`,
  organizations: () => `/api/v1/organizations`,
  campaigns: () => `/api/v1/campaigns`,
  campaign: (id: string) => `/api/v1/campaigns/${id}`,
  campaignApprove: (id: string) => `/api/v1/campaigns/${id}/approve`,
  creatorsSearch: () => `/api/v1/creators/search`,
  creator: (id: string) => `/api/v1/creators/${id}`,
  campaignRecommendations: (id: string) => `/api/v1/campaigns/${id}/recommendations`,
  campaignInvitations: (id: string) => `/api/v1/campaigns/${id}/invitations`,
  deal: (id: string) => `/api/v1/deals/${id}`,
  dealOffers: (id: string) => `/api/v1/deals/${id}/offers`,
  conversationMessages: (id: string) => `/api/v1/conversations/${id}/messages`,
  irisRuns: () => `/api/v1/iris/runs`,
  irisStream: (id: string) => `/api/v1/iris/runs/${id}/stream`,
} as const;
