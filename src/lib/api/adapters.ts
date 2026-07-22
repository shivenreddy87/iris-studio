// Feature-level adapters. UI imports from here; swap internals for `apiRequest`
// once VITE_API_BASE_URL points at FastAPI.
import { campaigns, creators, deals, conversations, lists, type Campaign, type Creator, type Deal, type Conversation } from "./mock-data";

const delay = <T,>(v: T, ms = 120) => new Promise<T>((r) => setTimeout(() => r(v), ms));

export const campaignsApi = {
  list: () => delay(campaigns),
  get: (id: string) => delay(campaigns.find((c) => c.id === id) ?? null),
  recommendations: (_id: string) =>
    delay([...creators].sort((a, b) => b.matchScore - a.matchScore).slice(0, 4)),
  invitations: (id: string) =>
    delay(deals.filter((d) => d.campaignId === id)),
};

export const creatorsApi = {
  search: (q: string = "") =>
    delay(
      creators.filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q.toLowerCase()) ||
          c.niche.toLowerCase().includes(q.toLowerCase()) ||
          c.tags.some((t) => t.toLowerCase().includes(q.toLowerCase())),
      ),
    ),
  get: (id: string) => delay(creators.find((c) => c.id === id) ?? null),
};

export const dealsApi = {
  get: (id: string) => delay(deals.find((d) => d.id === id) ?? null),
  list: () => delay(deals),
};

export const messagesApi = {
  conversations: () => delay(conversations),
  get: (id: string) => delay(conversations.find((c) => c.id === id) ?? null),
};

export const listsApi = {
  list: () => delay(lists),
};

export type { Campaign, Creator, Deal, Conversation };
