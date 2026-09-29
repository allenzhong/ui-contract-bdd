# 11 · Break it on purpose

**Goal:** see each safety net fire, read what it tells you, and know **who** has to act. Every lab starts from the green state at the end of chapter 10 and ends by undoing the change.

Run every command in this chapter from `learn/workspace`.

> **Tip.** Take a snapshot before you start, so undoing is one command:
> ```bash
> rm -rf /tmp/web-src.bak /tmp/contracts.bak /tmp/generated.bak   # cp -R would copy *into* an old backup
> cp -R web/src /tmp/web-src.bak && cp -R web/contracts /tmp/contracts.bak && cp -R tests/Generated /tmp/generated.bak
> ```
> To restore after each lab (this covers `web/`, contracts and `tests/Generated`. Labs 5 and 6 edit other files and say how to undo them):
> ```bash
> rm -rf web/src web/contracts tests/Generated
> cp -R /tmp/web-src.bak web/src && cp -R /tmp/contracts.bak web/contracts && cp -R /tmp/generated.bak tests/Generated
> ```

## Lab 1: the developer renames a test ID

A developer renames the Save button's test ID. In a traditional setup, an E2E test fails at night with "element not found". Here's what happens instead.

**Break it.** In `web/src/pages/CustomerProfilePage.tsx`, change `data-testid="profile-save"` to `data-testid="profile-submit"`.

**Net 1: the developer's own flow tests.**

```bash
(cd web && npm run contracts)
```

```
FAIL … > AC-101 update full name
VitestBrowserElementError: Cannot find element with locator: getByTestId('profile-save')
```

The developer notices within seconds, on their own machine. They fix the flow test too. In `CustomerProfilePage.flows.browser.test.tsx`, change `getByTestId('profile-save')` to `getByTestId('profile-submit')`, then run it again:

```bash
(cd web && npm run contracts)    # 3 passed. The contracts now say "profile-submit".
```

**Net 2: stale generated files (CI).**

```bash
(cd web && npm run locators:check); echo "exit=$?"
```

```
error: Generated/CustomerProfileLocators.g.cs is stale; run `npm run locators` in web/ and commit.
error: Generated/CustomerProfile.recipes.md is stale; run `npm run locators` in web/ and commit.
exit=1
```

**Net 3: the compiler.**

```bash
(cd web && npm run locators) && (cd tests && dotnet build)
```

```
Pages/CustomerProfilePage.cs(42,38): error CS0117: 'CustomerProfileLocators' does not contain a definition for 'Save'
```

The generated member is now `Submit`. The UI change has become a **compile error at the exact line that uses it**, not a runtime failure. The fix is a one-word edit in the page object (`L.Save` → `L.Submit`), which the tester makes or reviews.

**Lesson:** a test ID is part of the component's public API. Renaming one is a breaking change that three nets catch before any E2E run.

**Undo** (restore commands above).

## Lab 2: persistence is broken

**Break it.** In `web/src/api/customerApi.ts`, comment out the `setItem` inside `saveCustomer`:

```ts
export function saveCustomer(customer: Customer): Promise<Customer> {
  // localStorage.setItem(KEY, JSON.stringify(customer));
  return delay(customer);
}
```

The UI still shows "Profile saved", so a test that only checked the toast would pass.

**Net 1: flow tests.**

```bash
(cd web && npm run contracts)
```

```
FAIL … > AC-101 update full name
Expected the element to have value: …
FAIL … > AC-102 change country
Expected element to have text content: …
Tests  2 failed | 1 passed (3)
```

The `reload()` + `outcome()` at the end of each flow caught it. The failing flows never reach `flow.save()`, so **the contract JSON isn't rewritten** with a broken outcome.

But look at what *did* change:

```bash
diff -rq /tmp/contracts.bak web/contracts
```

```
Files …/customer-profile.change-country/05-reloaded.html and … differ
Files …/customer-profile.update-full-name/03-reloaded.html and … differ
```

`flow.state()` writes each state's HTML **immediately**, before the outcome that follows it is checked. A failing flow leaves the HTML of its last states showing the broken UI, while the JSON still describes the old, working run. So **never commit contracts from a red flow run**. Fix the code, rerun until it's green, and only then commit. (With git, `git checkout web/contracts` undoes a bad run.)

**Net 2: E2E.** Suppose the flow didn't have the reload step. Would E2E catch it? Start the app (`npm start` in `web/`), then:

```bash
(cd tests && dotnet test --filter Category=AC-101)
```

```
  Expected: "Aroha Ngata"
  But was:  "Aroha Smith"
Failed!  - Failed:     1, Passed:     0
```

The message is precise because `ValueEventually` returns the actual value (chapter 08). Now look at the evidence:

```bash
ls tests/bin/Debug/net8.0/artifacts/*/
# dom.html  screenshot.png
```

Open `dom.html` next to the **good** contract state, `/tmp/contracts.bak/customer-profile.update-full-name/03-reloaded.html`. Don't use your `web/contracts` copy, because Net 1 just overwrote it (see above). The good contract has `value="Aroha Ngata"` and the failure has `value="Aroha Smith"`. Same shape of file, one difference: that's the bug.

**Lesson:** a `Then` must assert the business outcome (the data survived), not just that something happened (a toast appeared).

**Undo**, and stop `npm start`.

## Lab 3: repeated items without business keys

**Break it.** In `web/src/components/CountrySelect.tsx`, delete the line `data-key={c.code}`.

```bash
(cd web && npm run contracts)          # still passes. The UI works.
(cd web && npm run locators)
```

```
warning: customer-profile.change-country#country-open: "profile-country-option" is repeated 5x without data-key; rows cannot be told apart by business identity.
```

The recipe's `country-open` step now has a **⚠**, the locator docs say `Keys: (none)`, and recipe step 6 has lost its key: it now reads ``click `CountryOption` `` instead of ``click `CountryOption("NZ")` ``, so nothing says *which* option was picked. The skill tells the agent to **stop** on ⚠ and ask for the missing attribute, instead of guessing an index like `options[2]`.

**Lesson:** for repeated things (options, table rows, cards), the business identity must be in the DOM.

**Undo.**

## Lab 4: an interactive element without a test ID

**Break it.** In `web/src/pages/CustomerProfilePage.tsx`, delete the line `data-testid="profile-newsletter"` from the checkbox.

```bash
(cd web && npm run contracts)
(cd web && npm run locators)
```

```
warning: customer-profile.change-country#loaded: Interactive checkbox "Subscribe to newsletter" (<input>) has no data-testid.
…
```

`Newsletter` also disappears from `CustomerProfileLocators.g.cs`. Nothing uses it yet, so the build still passes. If a page object did use it, you'd get a compile error, as in Lab 1.

**Lesson:** the recorder finds untestable UI **while the developer is still working on it**.

**Undo.**

## Lab 5: the tester is ahead of the developer

**Break it.** Add a new scenario to `tests/Features/CustomerProfile.feature` (at the end of the file):

```gherkin
  @AC-199
  Scenario: Something the developer hasn't built yet
    When I save my profile
```

```bash
(cd web && npm run locators); echo "exit=$?"
```

```
error: AC-199 (Features/CustomerProfile.feature:37) has no UI contract; ask the web developer for a flow test.
3 flows, 3/4 tagged acceptance criteria covered
exit=1
```

This isn't a failure to work around. It's a **to-do for the developer**. The coverage line is also a progress bar for the sprint.

**Undo:** delete the scenario.

## Lab 6: Selenium's `Clear()` against a React input

Chapter 08 said `IWebElement.Clear()` doesn't work on React inputs. Here's the proof.

**Break it.** In `tests/Pages/CustomerProfilePage.cs`, replace `ClearFullName` with the "obvious" Selenium code:

```csharp
public void ClearFullName() => ui.Driver.FindElement(L.FullName).Clear();
```

With the app running (`npm start` in `web/`):

```bash
(cd tests && dotnet test --filter Category=AC-103)
```

```
  Expected: "Full name is required"
  But was:  <string.Empty>
```

With `HEADED=1` you can watch it happen: the box looks empty, but no error appears after Save. `Clear()` changed the DOM without firing React's `onChange`, so React's state still holds "Aroha Smith" and the form saves happily. `Ui.Fill` uses real keystrokes (select-all + Delete), which React sees.

**Lesson:** tricks like this belong in `Ui.cs`, written once and tested. Page objects should never talk to `ui.Driver` directly.

**Undo:** in `tests/Pages/CustomerProfilePage.cs`, put back `public void ClearFullName() => ui.Fill(L.FullName, "");`. The snapshot doesn't cover `tests/Pages/`.

## Summary: who acts on which signal

| Signal | Fires in | Who acts |
|---|---|---|
| Flow test fails | Developer's machine, web CI | Developer |
| Contracts diff in PR | Web PR | Developer commits it, tester reviews it |
| `locators:check` stale | CI | Whoever changed contracts regenerates |
| AC has no contract | Generator / CI | Developer writes the flow |
| ⚠ missing test ID / data-key | Generator warnings, recipes | Developer adds attributes |
| Compile error in `Pages/` | `dotnet build` | Tester (or agent) updates the page object |
| E2E assertion fails + evidence | `dotnet test` | Look at the diff of `dom.html` against the contract first |

Next: [12 · Practice](12-practice.md)
