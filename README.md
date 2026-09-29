# UI Contract BDD

Contract-driven BDD for a React web app and a Reqnroll + Selenium test suite.

The web developer writes one **flow test** per acceptance criterion. It drives the real component in a real browser and records a **UI contract**: states, actions, waits and outcomes, plus the HTML of each state. A generator turns the contracts into C# Selenium locators and step-by-step recipes. The tester's Gherkin scenarios (tagged `@AC-nnn`) are then bound to those recipes, by an AI agent with human review. Nobody guesses a selector, and CI catches UI drift as a stale file or a compile error instead of a flaky test.

## What's here

```
ui-contract-bdd/
├── sample/    the working reference project
│   ├── web/     React 19 + TypeScript (webpack), flow tests (Vitest browser mode),
│   │            contracts/, and tools/generate-locators (contracts → tests/Generated)
│   ├── tests/   .NET 8 · Reqnroll 3 · NUnit · Selenium 4
│   ├── docs/    the design article and the web ↔ test conventions
│   └── .claude/skills/bind-steps/   instructions for the AI agent that writes bindings
└── learn/     a step-by-step tutorial that rebuilds the sample from an empty folder
    ├── tutorial/    chapters 00–12, each ending with a checkpoint
    └── workspace/   where you build while following it
```

## Start here

- **See it work:** [sample/README.md](sample/README.md), then run `./run-e2e.sh` in `sample/`.
- **Understand the design:** [sample/docs/contract-driven-bdd.md](sample/docs/contract-driven-bdd.md) and [sample/docs/conventions.md](sample/docs/conventions.md).
- **Learn it by building it:** [learn/README.md](learn/README.md).

## Prerequisites (macOS)

- Node.js 20.19+
- .NET SDK 8
- Google Chrome (both the flow tests and Selenium use the installed Chrome)
