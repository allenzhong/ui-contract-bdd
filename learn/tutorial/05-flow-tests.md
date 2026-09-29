# 05 · Flow tests and contracts

**Goal:** one flow test per acceptance criterion (AC-101, AC-102, AC-103), producing `web/contracts/`. Then you learn to read a contract.

**You'll replace:** `web/src/pages/CustomerProfilePage.flows.browser.test.tsx`

## 5.1 The flow test file

Replace the smoke test with this:

**File:** `web/src/pages/CustomerProfilePage.flows.browser.test.tsx`
```tsx
// Flow tests: one per acceptance criterion. Each renders the real page in a
// real browser, drives it the way a user would, asserts the outcome and
// records a UI contract (contracts/*.contract.json + per-state HTML).
import { beforeEach, test } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { resetStore } from '@/api/customerApi';
import { App } from '@/App';
import '@/styles.css';
import { recordFlow } from '@/testing/uiContract';

let screen: Awaited<ReturnType<typeof render>>;

beforeEach(async () => {
  resetStore(); // same seed as the E2E environment's "/?reset=1"
  screen = await render(<App />);
});

function profileFlow(id: string, acceptance: string[]) {
  return recordFlow({
    id,
    page: 'CustomerProfile',
    route: '/',
    acceptance,
    fixture: 'seedCustomer',
    root: () => screen.container,
    remount: async () => {
      await screen.unmount();
      screen = await render(<App />);
    },
  });
}

const fullName = () => page.getByTestId('profile-full-name');
const country = () => page.getByTestId('profile-country');
const save = () => page.getByTestId('profile-save');
const toast = () => page.getByTestId('toast');
const profile = () => page.getByTestId('profile-page');

test('AC-101 update full name', async () => {
  const flow = profileFlow('customer-profile.update-full-name', ['AC-101']);
  await flow.state('loaded', { waitFor: profile() });
  await flow.fill(fullName(), 'Aroha Ngata');
  await flow.click(save());
  await flow.state('saved', { waitFor: toast() });
  await flow.outcome(toast(), { text: 'Profile saved' });
  await flow.reload();
  await flow.state('reloaded', { waitFor: profile() });
  await flow.outcome(fullName(), { value: 'Aroha Ngata' });
  await flow.save();
});

test('AC-102 change country', async () => {
  const flow = profileFlow('customer-profile.change-country', ['AC-102']);
  await flow.state('loaded', { waitFor: profile() });
  await flow.click(country());
  await flow.state('country-open', { waitFor: page.getByRole('listbox', { name: 'Country' }) });
  await flow.click(page.getByRole('option', { name: 'New Zealand', exact: true }), {
    closes: page.getByRole('listbox', { name: 'Country' }),
  });
  await flow.state('country-selected');
  await flow.outcome(country(), { text: 'New Zealand' });
  await flow.click(save());
  await flow.state('saved', { waitFor: toast() });
  await flow.outcome(toast(), { text: 'Profile saved' });
  await flow.reload();
  await flow.state('reloaded', { waitFor: profile() });
  await flow.outcome(country(), { text: 'New Zealand' });
  await flow.save();
});

test('AC-103 full name is required', async () => {
  const flow = profileFlow('customer-profile.full-name-required', ['AC-103']);
  await flow.state('loaded', { waitFor: profile() });
  await flow.fill(fullName(), '');
  await flow.click(save());
  await flow.state('validation-error', { waitFor: page.getByRole('alert') });
  await flow.outcome(page.getByTestId('profile-full-name-error'), { text: 'Full name is required' });
  await flow.save();
});
```

## 5.2 How to write a flow: the pattern

Every flow follows the same rhythm. Read AC-102 against it:

| Rhythm | AC-102 line | Why |
|---|---|---|
| 1. Wait for the page, then snapshot | `state('loaded', { waitFor: profile() })` | Data loads after 300 ms. |
| 2. Act | `click(country())` | |
| 3. **If new things appeared**, wait for them and snapshot | `state('country-open', { waitFor: listbox })` | The options only exist now. This snapshot is the one that proves the portal. |
| 4. Act. **If something disappears**, say so | `click(option, { closes: listbox })` | Selenium must wait for the list to close before touching the page again. |
| 5. Assert the intermediate result | `outcome(country(), { text: 'New Zealand' })` | |
| 6. Act, then wait for the feedback | `click(save())` → `state('saved', { waitFor: toast() })` | The toast appears after the 300 ms save. |
| 7. Assert the business outcome | `outcome(toast(), { text: 'Profile saved' })` | This becomes `Then I see the confirmation …`. |
| 8. **If the AC implies persistence**, reload and assert again | `reload()` → `state('reloaded', …)` → `outcome(…)` | Proves the data was really saved. |
| 9. Write the files | `save()` | |

Other details:

- **`beforeEach`** resets the seed and renders a fresh app, so tests don't affect each other.
- **`profileFlow()`** fills in the options shared by all flows on this page. The flow **ID** (`customer-profile.change-country`) becomes the file name. Choose IDs that describe the behaviour, not the AC number, because AC numbers can be regrouped later.
- **`remount`** simulates a browser reload: unmount React, render again, and `localStorage` still holds the saved data.
- **Locators are functions** (`() => page.getByTestId(…)`), so each use gets a fresh locator.
- **`exact: true`** on the option avoids a partial match. This isn't a problem today, but "New" would also match "New Zealand".
- **AC-103 has no reload**, because nothing is saved.

## 5.3 Record

```bash
(cd web && npm run contracts)
```

```
 Test Files  1 passed (1)
      Tests  3 passed (3)
```

Look at what appeared:

```bash
find web/contracts -type f | sort
```

```
web/contracts/customer-profile.change-country.contract.json
web/contracts/customer-profile.change-country/01-loaded.html
web/contracts/customer-profile.change-country/02-country-open.html
web/contracts/customer-profile.change-country/03-country-selected.html
web/contracts/customer-profile.change-country/04-saved.html
web/contracts/customer-profile.change-country/05-reloaded.html
web/contracts/customer-profile.full-name-required.contract.json
web/contracts/customer-profile.full-name-required/01-loaded.html
web/contracts/customer-profile.full-name-required/02-validation-error.html
web/contracts/customer-profile.update-full-name.contract.json
web/contracts/customer-profile.update-full-name/01-loaded.html
web/contracts/customer-profile.update-full-name/02-saved.html
web/contracts/customer-profile.update-full-name/03-reloaded.html
```

## 5.4 Read a contract

Open `web/contracts/customer-profile.change-country.contract.json`. The top is the header:

```json
{
  "schema": "ui-contract/v1",
  "flow": "customer-profile.change-country",
  "page": "CustomerProfile",
  "route": "/",
  "acceptance": ["AC-102"],
  "fixture": "seedCustomer",
  "steps": [ … ]
}
```

Then scroll through `steps` and look for these facts. Each one answers a question a Selenium author would otherwise have to guess:

| Look for | You'll find | Question it answers |
|---|---|---|
| The `country-open` state, element `profile-country` | `"expanded": true, "controls": "profile-country-listbox"` | What does the button point at? |
| The `country-open` state, element `profile-country-listbox` | `"portal": true` | Where must I search for the list? From the document root. |
| The `country-open` state, element `profile-country-option` | `"repeated": { "count": 5, "keys": ["AU","CA","NZ","GB","US"], "names": ["Australia", …] }` | Which options exist, and how do I pick one? |
| The step after clicking the option | `{ "type": "wait", "until": "hidden", "target": { "testId": "profile-country-listbox" … } }` | What must I wait for after picking? |
| The `outcome` steps | `"expect": { "text": "New Zealand", "visible": true }` | What exactly do I assert, and is it text or value? |
| Every state's `warnings` | `[]` | Is anything missing a test ID? |

Now open `web/contracts/customer-profile.change-country/02-country-open.html` in an editor. It's the `<body>` at that moment. The `<ul role="listbox" …>` comes **after** the app's `<div>`, which is the portal made visible.

Compare `01-loaded.html` with `05-reloaded.html`: the country button text changed from `Australia` to `New Zealand`.

## 5.5 Determinism

Run it again and check that nothing changed:

```bash
(cd web && npm run contracts)
```

With git, `git status web/contracts` would show nothing. Without git, compare with the sample, which was recorded from the same code:

```bash
diff -r web/contracts ../../sample/web/contracts && echo "identical to the sample"
```

This is why contracts can be **committed and reviewed**. Any diff in a pull request is a real UI change, never noise. React's `useId` values (`_r_4_`) are stable because the render order is the same every run.

## ✅ Checkpoint

- `(cd web && npm run contracts)` shows **3 passed**.
- `diff -r web/contracts ../../sample/web/contracts` prints `identical to the sample`.
- You can point at the portal, the repeated options with keys, and the `wait: hidden` step in the AC-102 contract.

The developer's side is done. In a real team, the developer would open a PR containing the component, the flow test and `contracts/`.

Next: [06 · The test project](06-test-project.md)
