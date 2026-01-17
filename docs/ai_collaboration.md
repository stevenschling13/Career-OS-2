# AI Collaboration Playbook

This document defines how Gemini (AI Studio), ChatGPT/Codex, and any human contributors collaborate on Career OS. The goal is to keep work predictable, auditable, and production-ready.

## Roles & Responsibilities

**Gemini (AI Studio, Build Mode)**
- Rapid UI scaffolding and prototype flows.
- Generates component skeletons and layout iterations.
- Must record changes in `docs/progress_log.md` after each session.

**ChatGPT/Codex (Agent Mode)**
- Code audit, refactoring, and quality upgrades.
- Adds tests, linting, typing, and security improvements.
- Validates schema/API changes and ensures consistency.

**Human Maintainer**
- Approves scope and privacy decisions (OAuth scopes, data retention).
- Owns final merges to `main`.
- Keeps repository settings and access policies aligned.

## Standard Workflow (Every Request)

1. **Sync Context**
   - Read `docs/progress_log.md` to understand the last changes.
   - If unclear, inspect git history and key files before edits.

2. **Define Scope**
   - Summarize objective, affected areas, and any required API changes.
   - Call out risks (security, privacy, data migration).

3. **Plan Minimal Changes**
   - Prefer small, reviewable changes.
   - Avoid mixing refactors with new features.

4. **Implement + Validate**
   - Keep behavior stable unless explicitly changing it.
   - Add or update tests when behavior changes.
   - Run relevant checks (`npm test`, `npm run lint`, etc.) when available.

5. **Record Progress**
   - Append a log entry to `docs/progress_log.md`.
   - Include: date, actor, summary, files touched, tests run.

6. **Handoff Summary**
   - Provide a clear summary of changes and follow-ups.

## Change Classification

- **UI Changes:** Must note any visual changes and (if applicable) include a screenshot.
- **API/Schema Changes:** Require validation updates and data migration notes.
- **Security/Privacy:** Must include scope adjustments and retention implications.

## Commit Standards

- Commit messages should be imperative and scoped (e.g., `Add progress log template`).
- Each PR should link to the related log entry.

## Communication Protocol

- Use the same shared vocabulary for statuses: `planned`, `in-progress`, `blocked`, `done`.
- Record blockers explicitly with owner + next step.

## Files to Always Update

- `docs/progress_log.md` after any substantial change.
- `README.md` when setup or developer workflow changes.

