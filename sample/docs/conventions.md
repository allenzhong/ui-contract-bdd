# Web ↔ test conventions

Both the developer and the tester agree to these rules. The contract recorder and the generator depend on them.

## Acceptance criteria

- Every AC has an ID, `AC-nnn`.
- Feature scenarios carry the tag `@AC-nnn`. Reqnroll turns it into an NUnit category, so `dotnet test --filter Category=AC-102` works.
- Every web flow declares `acceptance: ['AC-nnn']`. One flow per AC is the default.

## `data-testid`

| Rule | Example |
|---|---|
| kebab-case, prefixed by the page or feature | `profile-full-name`, `profile-save` |
| The generator strips the most common prefix to name members | `profile-country` → `CustomerProfileLocators.Country` |
| Popups and parts of a composite control extend the control's id | `profile-country-listbox`, `profile-country-option` |
| Repeated items share one testid **and** carry `data-key` with the business identity | `data-testid="profile-country-option" data-key="NZ"` |
| Global widgets get an unprefixed id | `toast` |
| Every interactive element has one; the recorder warns otherwise | |
| Renaming is a breaking change: regenerate, fix compile errors, tell the tester | |

## Accessibility

- Custom controls use the correct role and state (`role="combobox"`, `aria-expanded`, `aria-controls`, `role="option"`, `aria-selected`).
- Every control has an accessible name (a `<label>`, `aria-labelledby` or `aria-label`). Scenario values such as "New Zealand" are matched against accessible names.
- Alerts use `role="alert"` and confirmations use `role="status"`. They make natural wait targets.

## Test data

- Flow tests and the E2E environment use the same fixtures (`web/src/api/seed.ts`).
- E2E isolation: `/?reset=1` restores the seed before each scenario (`Support/Hooks.cs`).
- Only synthetic data appears in contracts; they are committed.

## Flow tests (`*.flows.browser.test.tsx`)

- Drive the UI like a user: `userEvent` via the recorder (`flow.click`, `flow.fill`, `flow.check`).
- Call `flow.state(name, { waitFor })` after each action that changes what's available.
- Pass `click(x, { closes: popup })` when a click dismisses something.
- End every flow with `flow.outcome(...)` assertions matching the AC's `Then`, and `flow.reload()` when the AC implies persistence.

## Generated and hand-written code in `tests/`

| Path | Author | Edit by hand? |
|---|---|---|
| `Features/` | tester | yes (the spec) |
| `Generated/` | `web/tools/generate-locators` (`npm run locators`) | **never** |
| `Pages/`, `Steps/` | AI agent (`bind-steps` skill), reviewed by the tester | yes, through PRs |
| `Support/` | tester / platform | yes |
