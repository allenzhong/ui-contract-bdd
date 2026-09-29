---
name: interaction-migration
description: Diagnose and migrate Selenium Reqnroll interactions across a React UI rewrite while preserving feature scenarios and assertions.
---

# Interaction migration

Use this project skill for a failing Reqnroll scenario against the rewritten React app. Read `README.md`, `docs/architecture.md`, `docs/agent-prompts.md` and the scenario's actual source. Respect repository-local instructions. Never modify `.feature` files or weaken verification.

1. Inventory feature → binding → page object → locator, and React route/component/test id. State the scenario's business goal.
2. Run a single scenario and retain error, DOM, screenshot, console/network information and test data identifiers.
3. Observe before/action/after. A snapshot of the initial DOM alone cannot reveal transient dropdown options. Explore one action at a time, infer interactions from runtime state, ARIA semantics and source, and verify the final business outcome.
4. Distinguish test implementation, React, backend/data and environment failures. Supply evidence and confidence; use UNKNOWN when unresolved.
5. Patch minimally. Prefer unique scoped test id and accessible semantics; make reusable component helpers for multi-action controls. Explicit waits must target observable state. Treat `SelectElement` → custom dropdown as an interaction migration.
6. Run `python3 tools/migrate.py guard --config project.json --base HEAD`, focused case, feature and related regressions; inspect diff manually for semantic assertion preservation.
7. Record a structured diagnosis (`docs/schemas.md`). Promote a pattern to `.ai/interaction-patterns.yaml` only after repeated verified use.

When a control appears missing, inspect prior transitions and their snapshots retrospectively to locate the first divergence. Do not manufacture a passing test by changing the expected behavior.
