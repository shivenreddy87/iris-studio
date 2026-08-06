# Permission Matrix

Roles: **Business** (`brand`), **Influencer** (`creator`), **Admin** (`admin`).
Suspended users of any role are read-only.

| Capability | Business | Influencer | Admin |
| --- | --- | --- | --- |
| Own profile read/update | ✅ | ✅ | ✅ |
| Create / edit / submit campaign request | ✅ own | — | — |
| Review, approve, reject, request changes | — | — | ✅ |
| Create / edit contest, lifecycle changes | — | — | ✅ |
| View published contests | ✅ own | ✅ eligible | ✅ all |
| Save / unsave contest | — | ✅ | — |
| Apply / withdraw application | — | ✅ own | — |
| View applications | counts only | own only | ✅ all |
| Shortlist / select participants, activate contest | — | — | ✅ |
| Submit content | — | ✅ participant | — |
| Verify / flag submission | — | — | ✅ |
| View submissions | ✅ own contest (aggregate) | own only | ✅ all |
| Score / finalise winners | — | — | ✅ |
| View results | ✅ own contest | own outcome | ✅ all |
| Submit payout details | — | ✅ winner | — |
| View payout financial details | ❌ | own only | ✅ |
| Advance payout lifecycle | — | — | ✅ |
| Moderation, suspensions, settings, templates | — | — | ✅ |
| Analytics | own scope | own scope | platform-wide |
| Audit logs | ❌ | ❌ | ✅ read-only |

Enforcement points: RLS policies (`private.has_role`), server-side role
assertions (`assertAdmin`, ownership checks), and `assertNotSuspended` on every
mutation.
