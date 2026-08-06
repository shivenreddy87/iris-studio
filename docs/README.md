# Iris Studio — Developer Documentation

Contest-based influencer marketing platform. React 19 + TanStack Start (SSR),
TanStack Query, Tailwind v4, shadcn/ui, Lovable Cloud (Postgres + Auth +
Storage + Realtime).

## Contents

- [Architecture](./architecture.md)
- [Feature module map](./feature-modules.md)
- [Database](./database.md)
- [Route map](./routes.md)
- [Permission matrix](./permissions.md)
- [Lifecycles](./lifecycles.md)
- [Server function index](./server-functions.md)
- [Phase 1 production readiness report](./production-readiness.md)

## Conventions

- Every server mutation: `requireSupabaseAuth` → `assertNotSuspended` → role
  check → ownership check → lifecycle check → write → event log → notification
  → audit log.
- Data access is always through `*.functions.ts` (RPC) calling `*.server.ts`
  helpers. Components never query privileged data directly.
- Reads use `queryOptions` + `useQuery`/`useSuspenseQuery`; every async section
  renders through `DataSection` (skeleton / empty / error / retry).
- Storage uploads go through `src/lib/storage.ts`; paths are validated
  server-side with `assertOwnedStoragePath` from `src/lib/storage.server.ts`.
