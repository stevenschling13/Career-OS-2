# Full-Stack Code Audit for Career-OS-2 (2026-01-18)

## Overview
This audit reviews the Career-OS-2 repository and Google OAuth integration, based on the existing code and design documentation.

## What Works Well
- Uses backend-anchored OAuth 2.0 (authorization code flow) for Gmail and Calendar, with state cookie and secure session cookie.
- Tokens are encrypted server-side using AES-256-GCM; tokens are never exposed to the browser.
- Comprehensive repository governance: MIT license, code of conduct, contributing guide, CI workflows, issue and PR templates.
- Clear UX for connecting Google account; Settings page explains scopes and shows connection status.
- CORS configuration restricts backend access to the known frontend origin; environment variables are externalized.

## Issues Found
- Persistent storage missing: tokens and sessions are stored in an in-memory map; they are lost on server restart. Needs Prisma/SQLite integration.
- Mixed OAuth flows: remnants of client-side OAuth in the frontend cause confusion; unify around backend-driven OAuth.
- Frontend lacks a `refreshStatus()` function to sync session state from the backend; user state resets on reload.
- Disconnect flow only revokes the current access token; refresh tokens remain active.
- Dashboard still uses mock data for Gmail threads and job pipeline; real API integration is required.
- README remains generic and does not reflect the actual stack or setup.

## Recommendations
1. **Persist tokens**: Implement Prisma with a `GoogleAccount` model (e.g. `sub`, `email`, `encryptedAccessToken`, `encryptedRefreshToken`, `scope`, `expiresAt`).
2. **Remove client-side OAuth**: Delete `initTokenClient` usage in the frontend and rely solely on the backend `/auth/google/start` redirect.
3. **Session sync**: Add a `refreshStatus()` method to the authentication context to call `/api/google/status` at startup and update the user/email state.
4. **Disconnect**: Call Google's token revocation endpoint for both access and refresh tokens; clear the session cookie and delete the record in the database.
5. **Real data integration**: Replace mock calendar and inbox data with calls to backend endpoints; implement Gmail listing endpoints in the backend.
6. **Update documentation**: Revise the README to explain the backend service, environment variables, and deployment steps; add a full setup guide.
7. **Testing**: Add unit tests for token encryption/decryption, OAuth state validation, and API routes; ensure CI runs them.
8. **Production configuration**: Ensure environment secrets are set in the deployed environment; configure authorized redirect URIs; enable secure cookies.

## Next Steps
- Apply these recommendations in a new branch and open a pull request for review.
- Once Prisma integration and code changes are in place, deploy to a staging environment and test the full OAuth flow.
- Update the docs and commit this audit report to `docs/audit-report-2026-01-18.md` for future reference.
