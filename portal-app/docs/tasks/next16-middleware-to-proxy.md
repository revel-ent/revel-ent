# Next 16 Middleware to Proxy Migration Task

Status: Planned
Owner: Platform

## Goal

Migrate route guard entrypoint from middleware.ts to proxy.ts per Next 16 convention without changing behavior.

## Behavior Lock (must stay the same)

- `/portal/**` requires a valid session token.
- Missing/invalid token redirects to `/login`.
- Missing event context for non-admin redirects to `/login?error=missing_event`.
- Unauthorized role/path access redirects to `/unauthorized`.
- Authorized traffic continues with no redirect.

## Required test coverage before behavior changes

- API/unit coverage for token/no-token redirects.
- Role/path matrix coverage for canAccessRoute outcomes.
- Event-context guard coverage for admin vs non-admin.

## Migration steps

1. Add test coverage for current middleware behavior (parity harness).
2. Introduce `proxy.ts` with equivalent matcher and guard logic.
3. Keep `middleware.ts` behavior unchanged until parity tests pass.
4. Remove or forward legacy file only after CI confirms parity.

## Definition of done

- Test suite asserts behavior parity for all guard outcomes.
- No redirect behavior differences in local and CI runs.
- Docs updated to reference proxy convention only.
