# 02 · The web app

**Goal:** a working Customer profile page, built so it's **testable by design**: stable `data-testid`s, correct ARIA roles, business keys on repeated items, and shared seed data.

**You'll create:** `src/api/seed.ts`, `src/api/customerApi.ts`, `src/components/Toast.tsx`, `src/components/CountrySelect.tsx`, `src/pages/CustomerProfilePage.tsx`, `src/styles.css`. You'll also replace `App.tsx` and `main.tsx`.

```bash
mkdir -p web/src/api web/src/components web/src/pages
```

## 2.1 Shared test data: `seed.ts`

**File:** `web/src/api/seed.ts`
```ts
// Shared test data. The same records back component tests (contracts) and the
// E2E environment ("/?reset=1"), so accessible names in contracts match runtime.
export interface Customer {
  id: string;
  fullName: string;
  countryCode: string;
  newsletter: boolean;
}

export interface Country {
  code: string;
  name: string;
}

export const countries: Country[] = [
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
];

export const seedCustomer: Customer = {
  id: 'C-1001',
  fullName: 'Aroha Smith',
  countryCode: 'AU',
  newsletter: false,
};
```

**Why this matters:** the flow test (chapter 05) and the E2E test (chapter 10) start from **exactly the same data**. When the contract says the country button shows "Australia", the Selenium test sees "Australia" too. In a real system this file would be a backend seeding API or shared fixtures. In the sample it's one TypeScript file.

## 2.2 Fake backend: `customerApi.ts`

**File:** `web/src/api/customerApi.ts`
```ts
// Fake backend persisted in localStorage, with latency so tests must wait on
// observable state rather than on timing.
import { countries, seedCustomer, type Country, type Customer } from './seed';

const KEY = 'sample.customer';
const LATENCY_MS = 300;

const delay = <T,>(value: T) => new Promise<T>((r) => setTimeout(() => r(value), LATENCY_MS));

export function resetStore(): void {
  localStorage.setItem(KEY, JSON.stringify(seedCustomer));
}

export function getCustomer(): Promise<Customer> {
  const raw = localStorage.getItem(KEY);
  return delay(raw ? (JSON.parse(raw) as Customer) : seedCustomer);
}

export function saveCustomer(customer: Customer): Promise<Customer> {
  localStorage.setItem(KEY, JSON.stringify(customer));
  return delay(customer);
}

export function getCountries(): Promise<Country[]> {
  return delay(countries);
}
```

- **`localStorage`** makes data survive a page reload. That's what lets the tests check *persistence* ("after reloading the page my country is …").
- **`LATENCY_MS = 300`** is deliberate. Every call is slow, like a real network. A test that clicks Save and checks the toast immediately will **fail**. Tests must wait for something observable, like the toast becoming visible. This trains everyone to write correct waits.
- **`resetStore()`** puts the seed back. Flow tests call it directly. E2E tests call it through `/?reset=1` (section 2.7).
- `<T,>` has a trailing comma so that `.ts` + JSX tooling doesn't mistake it for a JSX tag.

## 2.3 `Toast.tsx`

**File:** `web/src/components/Toast.tsx`
```tsx
export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="status" data-testid="toast" className="toast">
      {message}
    </div>
  );
}
```

- `role="status"` is the ARIA role for a polite confirmation message. Screen readers announce it, and tests can wait for it.
- `data-testid="toast"` has **no page prefix**, because the toast is a global widget (see the conventions table below).

## 2.4 `CountrySelect.tsx`: a custom combobox with a portal

This is the hardest component, and it's here on purpose. It has the three things that most often break Selenium tests:

1. **The popup doesn't exist until you click.** A snapshot of the closed page has no options in it.
2. **The popup is rendered in a portal.** `createPortal(…, document.body)` puts the `<ul>` at the end of `<body>`, not inside the button's parent. A locator like "find the option *inside* the country field" finds nothing.
3. **Repeated items.** Five `<li>` share one `data-testid`. `data-key="NZ"` says which one is New Zealand.

**File:** `web/src/components/CountrySelect.tsx`
```tsx
// Custom combobox replacing a native <select>. The listbox is portaled to
// <body>, so it is NOT inside the trigger's DOM subtree — a classic reason
// static locators derived from the closed state fail.
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Country } from '@/api/seed';

interface Props {
  label: string;
  testId: string;
  countries: Country[];
  value: string;
  onChange: (code: string) => void;
}

export function CountrySelect({ label, testId, countries, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  const listboxId = useId();
  const selected = countries.find((c) => c.code === value);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`#${CSS.escape(listboxId)}`) && target !== triggerRef.current) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open, listboxId]);

  const rect = open ? triggerRef.current?.getBoundingClientRect() : undefined;

  return (
    <div className="field">
      <span id={labelId} className="label">
        {label}
      </span>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-labelledby={labelId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        data-testid={testId}
        className="combobox"
        onClick={() => setOpen((o) => !o)}
      >
        {selected?.name ?? 'Select…'}
      </button>
      {open &&
        createPortal(
          <ul
            id={listboxId}
            role="listbox"
            aria-labelledby={labelId}
            data-testid={`${testId}-listbox`}
            className="listbox"
            style={rect ? { top: rect.bottom + window.scrollY, left: rect.left, width: rect.width } : undefined}
          >
            {countries.map((c) => (
              <li
                key={c.code}
                role="option"
                aria-selected={c.code === value}
                data-testid={`${testId}-option`}
                data-key={c.code}
                onClick={() => {
                  onChange(c.code);
                  setOpen(false);
                }}
              >
                {c.name}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}
```

Read it in pieces:

| Code | Why |
|---|---|
| `useId()` | React generates unique IDs such as `_r_4_`. They link the label to the button and listbox through `aria-labelledby`. |
| `role="combobox"`, `aria-haspopup`, `aria-expanded` | The correct ARIA pattern for a custom dropdown. The contract records `expanded: false/true`, so the tester can see the state change. |
| `aria-controls={open ? listboxId : undefined}` | Points at the listbox only while it's open. The recorder turns this into `controls: "profile-country-listbox"`. |
| `aria-labelledby={labelId}` on both button and listbox | Gives both the **accessible name** "Country". The flow test uses it: `getByRole('listbox', { name: 'Country' })`. |
| `data-testid={testId}` and `${testId}-listbox`, `${testId}-option` | Parts of a composite control extend the control's test ID. |
| `data-key={c.code}` | The business identity of each repeated option. Without it, the recorder writes a warning. |
| The `mousedown` effect | Closes the list when you click outside it. |
| `rect` / `style` | Positions the portal under the button. The recorder strips `style` attributes from the HTML, because positions depend on layout and would make contracts differ between runs. |

## 2.5 `CustomerProfilePage.tsx`

**File:** `web/src/pages/CustomerProfilePage.tsx`
```tsx
import { useEffect, useState } from 'react';
import { getCountries, getCustomer, saveCustomer } from '@/api/customerApi';
import type { Country, Customer } from '@/api/seed';
import { CountrySelect } from '@/components/CountrySelect';
import { Toast } from '@/components/Toast';

export function CustomerProfilePage() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getCustomer(), getCountries()]).then(([c, list]) => {
      setCustomer(c);
      setCountries(list);
    });
  }, []);

  if (!customer) {
    return (
      <p role="status" data-testid="profile-loading">
        Loading profile…
      </p>
    );
  }

  const update = (patch: Partial<Customer>) => {
    setToast(null);
    setCustomer({ ...customer, ...patch });
  };

  const save = async () => {
    if (!customer.fullName.trim()) {
      setError('Full name is required');
      return;
    }
    setError(null);
    setSaving(true);
    await saveCustomer(customer);
    setSaving(false);
    setToast('Profile saved');
  };

  return (
    <main data-testid="profile-page">
      <h1>Customer profile</h1>
      <form
        aria-label="Customer profile"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className="field">
          <label htmlFor="fullName" className="label">
            Full name
          </label>
          <input
            id="fullName"
            data-testid="profile-full-name"
            value={customer.fullName}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'fullName-error' : undefined}
            onChange={(e) => update({ fullName: e.target.value })}
          />
          {error && (
            <p id="fullName-error" role="alert" data-testid="profile-full-name-error" className="error">
              {error}
            </p>
          )}
        </div>
        <CountrySelect
          label="Country"
          testId="profile-country"
          countries={countries}
          value={customer.countryCode}
          onChange={(countryCode) => update({ countryCode })}
        />
        <div className="field">
          <label>
            <input
              type="checkbox"
              data-testid="profile-newsletter"
              checked={customer.newsletter}
              onChange={(e) => update({ newsletter: e.target.checked })}
            />{' '}
            Subscribe to newsletter
          </label>
        </div>
        <button type="submit" data-testid="profile-save" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
      <Toast message={toast} />
    </main>
  );
}
```

Things to notice:

- **Loading state.** For the first 300 ms, only "Loading profile…" is on screen. That's why every flow starts with "wait until `profile-page` is visible".
- **`<main data-testid="profile-page">`** is the page's "I'm ready" marker. Both the flow tests and the E2E tests wait for it.
- **Controlled input.** `value={customer.fullName}` plus `onChange`. React owns the value. This matters in chapter 08: Selenium's `Clear()` changes the DOM without firing React's `onChange`, so the tests clear a field another way.
- **Validation.** `role="alert"` makes the error announce itself and gives a natural wait target.
- **Newsletter checkbox.** It's on the page but no AC uses it yet. It's waiting for you in chapter 12.

### The test ID conventions you just followed

| Rule | Example |
|---|---|
| kebab-case, prefixed by the page or feature | `profile-full-name`, `profile-save` |
| Parts of a composite control extend the control's ID | `profile-country-listbox`, `profile-country-option` |
| Repeated items share one test ID **and** carry `data-key` | `data-testid="profile-country-option" data-key="NZ"` |
| Global widgets have no prefix | `toast` |
| Every interactive element has one | The recorder warns otherwise |

The generator (chapter 07) strips the most common prefix to name C# members: `profile-country` → `Country`, `profile-save` → `Save`, `toast` → `Toast`.

## 2.6 Styles

**File:** `web/src/styles.css`
```css
body { font-family: system-ui, sans-serif; margin: 2rem; color: #1f2328; }
.field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 1rem; max-width: 20rem; }
.label { font-weight: 600; }
input:not([type='checkbox']), .combobox { padding: 0.4rem 0.5rem; font: inherit; text-align: left; }
.listbox { position: absolute; margin: 0; padding: 0; list-style: none; background: #fff; border: 1px solid #8c959f; box-shadow: 0 4px 12px rgb(0 0 0 / 15%); }
.listbox li { padding: 0.4rem 0.5rem; cursor: pointer; }
.listbox li:hover, .listbox li[aria-selected='true'] { background: #ddf4ff; }
.error { color: #cf222e; margin: 0; }
.toast { margin-top: 1rem; padding: 0.5rem 0.75rem; background: #dafbe1; border: 1px solid #4ac26b; display: inline-block; }
```

## 2.7 Replace `App.tsx` and `main.tsx`

**File:** `web/src/App.tsx`
```tsx
import { CustomerProfilePage } from '@/pages/CustomerProfilePage';

export function App() {
  return <CustomerProfilePage />;
}
```

**File:** `web/src/main.tsx`
```tsx
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { resetStore } from './api/customerApi';
import './styles.css';

// Test isolation hook: E2E tests open "/?reset=1" to restore seed data.
const url = new URL(window.location.href);
if (url.searchParams.has('reset')) {
  resetStore();
  url.searchParams.delete('reset');
  window.history.replaceState(null, '', url);
}

createRoot(document.getElementById('root')!).render(<App />);
```

**Test isolation.** Every E2E scenario starts a new browser and opens `/?reset=1`. That puts the seed back into `localStorage` *before* the app loads, and then removes `?reset=1` from the address bar. Each scenario starts from "Aroha Smith, Australia" no matter what the previous one saved.

## ✅ Checkpoint

```bash
(cd web && npm run typecheck)   # no errors
(cd web && npm start)           # open http://localhost:8080/?reset=1
```

Try each acceptance criterion by hand:

1. **AC-101:** change the name to `Aroha Ngata`, click **Save**. "Profile saved" appears. Reload the page, and the name is still `Aroha Ngata`.
2. **AC-102:** click **Country**. The list opens *below* the button. Pick **New Zealand**, save, reload. It persists.
3. **AC-103:** clear the name and click **Save**. A red "Full name is required" appears.
4. Open DevTools → Elements while the country list is open. The `<ul role="listbox">` is **at the end of `<body>`**, not inside `<main>`. That's the portal.

Open `http://localhost:8080/?reset=1` to go back to the seed. Stop the server with `Ctrl+C`.

Next: [03 · Vitest browser mode](03-vitest-browser-mode.md)
