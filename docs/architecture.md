# Design and decision process

## Evidence flow

Scenario intent → old step definition/page object → new React source → browser state/action/state trace → hypothesis → minimal patch → case/feature/regression verification. The `.feature` specification is immutable. Preserve the assertions that implement its intent.

A case trace contains a baseline state plus snapshots around **every action that can change the available controls**. Capture URL, DOM HTML, screenshot, accessible roles/names or a browser accessibility snapshot when supported, console/network events, action metadata, and timing. Selenium page source alone can miss shadow roots, transient portals, virtualized rows and later state changes. Prefer fresh browser observations over a static inventory mapping.

## State transitions

Model an interaction as `precondition → action → observed state → next action → business postcondition`. Example native select to custom combobox:

1. Find the country control and record closed state.
2. Click the trigger; wait for popup, record new state (including portal outside the control subtree).
3. Scope option by role, popup association and exact accessible name; click the requested value.
4. Wait for popup to close or selection to update; verify the selected value.
5. Continue scenario and check downstream saved value. A displayed label alone may be insufficient if persistence is specified.

Do not assume one old locator maps to one new locator. For autocomplete, typing may trigger network traffic and async suggestions. For virtualized grids, a row may require scrolling and stable row identity. For date pickers, distinguish text entry from calendar selection. Handle shadow DOM explicitly.

## Failure triage

| Observation | Candidate cause | Next evidence |
| --- | --- | --- |
| Element missing | changed interaction, not rendered, wrong data/state | DOM before/after trigger, route, component condition |
| Element found, click intercepted | overlay or timing | screenshot, hit target, visibility, explicit wait |
| Action succeeds, outcome absent | React/API defect or wrong action | console, network, state, component handler |
| Outcome shown but not persisted | React/API/backend defect | response and reload |
| Inconsistent results | test isolation, data, timing or environment | repeated focused run, seed, timestamps |

Classifier output must include a confidence estimate, supporting and contradicting evidence, and `UNKNOWN` when evidence is insufficient. Do not label a missing option as an app bug until checking whether the popup opened, search text or data conditions are required.

## Evaluation gates

1. Capture baseline failure and reproduction inputs.
2. Change the smallest affected page object/helper or React component.
3. Run static guard: protected features unchanged and no obvious skip/assertion bypass. Manual semantic review remains required.
4. Rerun the focused case; verify expected outcome and evidence trace.
5. Run its feature and related regressions; compare changes and log residual failures.
6. Promote verified component interactions to `.ai/interaction-patterns.yaml`, recording recognition, actions, waits, verification and evidence.

Do not automatically patch all matching selectors. Disambiguate repeated test ids by component scope and business identity. Separate non-deterministic infrastructure failures from migration failures. Preserve test data and redact authentication, personal data and tokens in exported snapshots.

## Agents and boundaries

The orchestrator plans one case at a time. A scenario analyst maps business intent; test analyst traces binding → step → page object; React analyst identifies render and event flow; browser explorer executes reversible UI actions and captures evidence; classifier proposes the cause; repair agent patches test or app; evaluator checks semantic preservation and reruns. These are **roles in one agent workflow**; separate agents are optional. Tool permissions should limit modifications to test implementation and React source, and exclude feature files.

## What the scaffold cannot know

It cannot infer your application's login, test data seeding, backend endpoints, runner names, accessible tree provider or exact Selenium/Reqnroll framework version. Wire existing fixtures/hooks to capture screenshots and browser logs. Configure CI to run the guard and focused/feature suites. Review any app behavior change with a domain owner if the scenario's intended outcome is ambiguous.
