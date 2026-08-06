# Architecture Overview

```text
Browser (React 19)
  routes/*.tsx  ──►  hooks (TanStack Query)  ──►  *.functions.ts  (RPC)
                                                       │
                                        requireSupabaseAuth middleware
                                                       │
                                    *.server.ts (validation + lifecycle)
                                                       │
                          Supabase: Postgres (RLS) · Storage · Realtime
```

## Layers

| Layer | Location | Responsibility |
| --- | --- | --- |
| Routes | `src/routes` | Layout, gating, page composition |
| Features | `src/features/<module>` | Domain UI, hooks, schemas, server logic |
| Server fns | `src/features/**/*.functions.ts` | Typed RPC boundary |
| Server logic | `src/features/**/*.server.ts` | Never reaches the client bundle |
| Shared libs | `src/lib` | roles, navigation, storage, audit, formatting |
| UI kit | `src/components/ui`, `src/components/app` | shadcn + app primitives |

## Boundaries

- `*.server.ts` files are blocked from client bundles by filename.
- `supabaseAdmin` is imported only inside handlers, after authorization.
- `process.env` is read inside handlers; browser config uses `import.meta.env`.

## Cross-cutting services

- **Suspension** — `assertNotSuspended` (`platform-admin/admin.server.ts`).
- **Audit** — `recordAuditLog` / `recordAdminAudit` (`src/lib/audit.server.ts`).
- **Notifications** — `activity/notification.server.ts`, preference-aware.
- **Activity feed** — `activity/activity.server.ts`, append-only audit view.
- **Storage** — `src/lib/storage.ts` (client) + `storage.server.ts` (validation).
