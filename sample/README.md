# Sample: contract-driven BDD (React + Reqnroll/Selenium)

A working example of the web-developer ↔ tester pairing workflow described in [docs/contract-driven-bdd.md](docs/contract-driven-bdd.md).

```
sample/
├── web/                       React 19 + TypeScript, built by webpack 5
│   ├── src/pages/…Page.tsx               the UI (custom combobox with portal listbox)
│   ├── src/pages/…flows.browser.test.tsx one flow test per acceptance criterion
│   ├── src/testing/uiContract.ts         contract recorder (state/action/wait/outcome)
│   ├── src/api/seed.ts                   shared test data
│   ├── tools/generate-locators/          contracts → ../tests/Generated/ (deterministic, TypeScript)
│   └── contracts/                        ← generated, committed: the hand-off
├── tests/                     .NET 8 · Reqnroll 3 · NUnit · Selenium 4
│   ├── Features/*.feature                tester-owned, tagged @AC-nnn
│   ├── Generated/*Locators.g.cs          locators (never edit)
│   ├── Generated/*.recipes.md            verified interaction recipes (agent input)
│   ├── Pages/, Steps/                    AI-written via the bind-steps skill, human-reviewed
│   └── Support/                          Ui helpers, hooks, settings
├── .claude/skills/bind-steps/SKILL.md    the agent's instructions
├── docs/                                 article, diagrams, conventions
└── run-e2e.sh                            contracts → generate → E2E in one go
```

## Prerequisites (macOS)

- Node **20.19+** (Vitest 4.1 is pinned; Vitest 5 needs Node 22)
- .NET SDK 8
- Google Chrome. Both runners use the installed Chrome, so there are no browser downloads. Selenium Manager fetches a matching chromedriver on first run, which needs network access.

## Run it

```bash
cd web && npm install && cd ..
./run-e2e.sh
```

Or step by step:

```bash
cd web && npm run contracts                           # 1. record contracts (≈3 s)
npm run locators                                       # 2. tests/Generated: locators + recipes + AC coverage
npm start                                              # 3. app on http://localhost:8080 (keep running)
cd ../tests && dotnet test                             # 4. E2E (HEADED=1 to watch)
dotnet test --filter Category=AC-102                   #    one acceptance criterion
```

## The loop, day to day

| Who | Does | Produces |
|---|---|---|
| Both | Agree ACs and IDs | `AC-101…` |
| Tester | Writes scenarios | `tests/Features/*.feature` |
| Developer | Builds component + flow test, runs `npm run contracts` | `web/contracts/*` in the PR |
| Tester | `npm run locators` (in `web/`) | `tests/Generated/*` |
| Tester + AI | "use bind-steps for @AC-nnn" in Claude Code | `tests/Pages`, `tests/Steps` |
| CI | `npm run locators:check`, build, `dotnet test` (an AI-safety guard is planned, see the article's gap 15) | pass/fail + failure evidence |

## What's been verified

- 3 flow tests pass and produce the same contracts on every run.
- 4 E2E scenarios pass (including a 2-row Scenario Outline).
- Renaming `data-testid="profile-save"` makes `npm run locators:check` fail as stale.
- Breaking persistence in the fake API makes the "after reloading" steps fail with expected vs actual values, and saves `dom.html` + `screenshot.png` under `tests/bin/Debug/net8.0/artifacts/`.
