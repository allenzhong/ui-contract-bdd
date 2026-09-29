# UI Contract BDD

A working scaffold for migrating Selenium + Reqnroll tests to a rewritten React UI while preserving the existing `.feature` scenarios and their assertions. The old implementation is historical evidence; observed browser behavior and the React source determine the new interaction.

## Quick start

1. Install Python 3.10+ and the existing .NET test project dependencies. No Python package is required.
2. Copy this directory beside the React and test repositories. Set paths and commands in `project.json`.
3. Run `python3 tools/migrate.py inventory --config project.json` to index scenarios, test locators, React test ids, and possible matches.
4. Run `python3 tools/migrate.py baseline --config project.json --filter 'FullyQualifiedName~Example'` to execute a focused case and save a result. Adjust the filter to your Reqnroll test runner's actual discovery names.
5. For each failing case, follow `.claude/skills/interaction-migration/SKILL.md` in Claude Code; provide both repositories and `docs/agent-prompts.md`. Capture a UI trace using the Selenium helper in `examples/SnapshotRecorder.cs` or your existing browser harness.
6. Save a diagnosis with `python3 tools/migrate.py diagnose --config project.json --input diagnosis.json`; run `python3 tools/migrate.py guard --config project.json --base HEAD` before accepting a patch. Re-run case, feature, then related tests.

`inventory` is heuristic and **does not rewrite code**. `baseline` runs a configured command; it does not assume a green result. The snapshot helper is example integration code requiring your test project's Selenium packages. The AI prompts are an operator workflow, not a hosted AI service. An actual project still needs its repository paths, environment and test runner configuration.

## Contract and acceptance

- `.feature` files, scenario names, step text, examples and tags remain byte-for-byte unchanged.
- No removed/disabled tests, skipped scenarios, weakened assertions, hard-coded expected outcomes or silent exception swallowing.
- A passing case must verify the same business outcome; a valid click alone is insufficient.
- Diagnose test implementation, React behavior, backend/data, and environment separately. Mark uncertainty and attach evidence.
- Capture DOM **after each significant action**, including transient popovers and portals; sanitize sensitive values before sharing traces.

## Layout

- `project.json`: integration points.
- `tools/migrate.py`: inventory, focused execution, diagnosis validation, patch guard.
- `examples/SnapshotRecorder.cs`: DOM, screenshot, visible ARIA attributes and step metadata capture.
- `docs/architecture.md`: end-to-end design, failure taxonomy, state transitions, limits.
- `docs/agent-prompts.md`: operator and reviewer instructions, required artifacts.
- `docs/schemas.md`: JSON formats and sample diagnosis.
- `.claude/skills/interaction-migration/SKILL.md`: reusable project-local Claude Code skill.
- `.ai/interaction-patterns.yaml`: seed component patterns, extended after verified exploration.

## Practical order

Start with one representative native-select-to-custom-dropdown case, one simple test-id migration, and one real React defect. Validate the guard and evidence workflow before batching similar cases. Store approved interaction patterns only after the same component behavior is verified in a second use.
