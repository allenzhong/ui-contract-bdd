# 12 · Practice

Now you drive. There's no code to copy in the exercises. Solutions are hidden in collapsible sections, so open them only after you've tried.

Start from the green state at the end of chapter 10 (all 4 E2E tests pass).

---

## Exercise A: AC-104, subscribe to the newsletter (full loop)

The team agrees on a new criterion:

> **AC-104:** A customer can subscribe to the newsletter, and the subscription persists after reload.

The checkbox is already on the page (`profile-newsletter`). Play **both roles**, in the order a real team would.

### A1 · Tester: write the scenario first

Add a scenario tagged `@AC-104` to `tests/Features/CustomerProfile.feature`. Use business language and reuse existing steps where they fit ("I save my profile", "I see the confirmation …").

Then run the generator. **What do you expect it to say?**

<details>
<summary>Solution A1</summary>

```gherkin
  @AC-104
  Scenario: Subscribe to the newsletter
    When I subscribe to the newsletter
    And I save my profile
    Then I see the confirmation "Profile saved"
    And after reloading the page I am subscribed to the newsletter
```

```bash
(cd web && npm run locators)
```

```
error: AC-104 (Features/CustomerProfile.feature:37) has no UI contract; ask the web developer for a flow test.
3 flows, 3/4 tagged acceptance criteria covered
```

That's correct: the tester is ahead, and the developer now owes a flow.
</details>

### A2 · Developer: write the flow test

Add a test `AC-104 subscribe to the newsletter` to `web/src/pages/CustomerProfilePage.flows.browser.test.tsx`. Follow the rhythm from chapter 05, section 5.2. Which recorder method ticks a checkbox? Which `outcome` property checks it?

Run `(cd web && npm run contracts)`. You should have **4 passed** and a new `web/contracts/customer-profile.subscribe-newsletter*`.

<details>
<summary>Solution A2</summary>

Add a locator helper next to the others:

```tsx
const newsletter = () => page.getByTestId('profile-newsletter');
```

And the test:

```tsx
test('AC-104 subscribe to the newsletter', async () => {
  const flow = profileFlow('customer-profile.subscribe-newsletter', ['AC-104']);
  await flow.state('loaded', { waitFor: profile() });
  await flow.check(newsletter());
  await flow.click(save());
  await flow.state('saved', { waitFor: toast() });
  await flow.outcome(toast(), { text: 'Profile saved' });
  await flow.reload();
  await flow.state('reloaded', { waitFor: profile() });
  await flow.outcome(newsletter(), { checked: true });
  await flow.save();
});
```
</details>

### A3 · Tester: regenerate and read the recipe

```bash
(cd web && npm run locators)
```

The output should say `4 flows, 4/4 tagged acceptance criteria covered`. Open `Generated/CustomerProfile.recipes.md` and find the new recipe. Which steps are new kinds of steps that `Ui.cs` can't do yet?

<details>
<summary>Solution A3</summary>

```
## customer-profile.subscribe-newsletter

- Acceptance: @AC-104
- Route: `/` · Fixture: `seedCustomer`

1. wait until `Page` is visible
2. _state_ **loaded** (…/01-loaded.html)
3. check `Newsletter`
4. click `Save`
5. wait until `Toast` is visible
6. _state_ **saved** (…/02-saved.html)
7. **assert** `Toast` text="Profile saved"
8. reload the page
9. wait until `Page` is visible
10. _state_ **reloaded** (…/03-reloaded.html)
11. **assert** `Newsletter` checked=true
```

Two things are new: **`check`** (step 3) and **assert `checked`** (step 11). `Ui` has no method for either yet.
</details>

### A4 · Bind the steps (choose a route)

**Route 1: by hand.** Extend `Support/Ui.cs` with a generic way to set and read a checkbox (keep the "wait on an observable condition" style, with no sleeps), add page-object methods, and add the two new step definitions. Before you write code, fill in the mapping table from chapter 09, section 9.2 for the new steps.

**Route 2: with the AI agent.** Start Claude Code **in `learn/workspace/`** and ask:

```
use bind-steps for @AC-104
```

Then **review** its changes the way a tester would. Are all locators from `CustomerProfileLocators`? Is the assertion equality on `checked`? Are there no sleeps, and is the feature file untouched? Did it put the checkbox logic in `Ui` (generic) or in the page object (specific)? Compare with the solution below.

Either way, finish with (app running):

```bash
(cd tests && dotnet test --filter Category=AC-104)     # 1 passed
(cd tests && dotnet test)                              # 5 passed
```

<details>
<summary>Solution A4</summary>

`Support/Ui.cs`: two generic methods. Add `SetChecked` after `Fill`:

```csharp
    /// <summary>Tick or untick a checkbox, then wait until the DOM reflects it.</summary>
    public void SetChecked(By by, bool isChecked)
    {
        var e = Visible(by);
        if (e.Selected != isChecked) Click(by);
        Until(_ => Visible(by).Selected == isChecked, $"{by} checked to be {isChecked}");
    }
```

and `CheckedEventually` after `ValueEventually`:

```csharp
    public bool CheckedEventually(By by, bool expected)
    {
        bool actual = !expected;
        try
        {
            Until(_ => (actual = Visible(by).Selected) == expected, $"{by} checked to be {expected}");
        }
        catch (WebDriverTimeoutException) { }
        return actual;
    }
```

`Pages/CustomerProfilePage.cs`, inside the class (for example after `FullName(…)`):

```csharp
    /// <summary>customer-profile.subscribe-newsletter, step 3.</summary>
    public void SetNewsletter(bool subscribed) => ui.SetChecked(L.Newsletter, subscribed);

    public bool IsSubscribed(bool expected) => ui.CheckedEventually(L.Newsletter, expected);
```

`Steps/CustomerProfileSteps.cs`, inside the class. Put the `[When]` next to the other `[When]` steps and the `[Then]` at the end:

```csharp
    [When("I subscribe to the newsletter")]
    public void WhenISubscribeToTheNewsletter() => profile.SetNewsletter(true);

    [Then("after reloading the page I am subscribed to the newsletter")]
    public void ThenAfterReloadingIAmSubscribed()
    {
        profile.Reload();
        Assert.That(profile.IsSubscribed(true), Is.True);
    }
```

Mapping:

| Gherkin | Recipe slice | Method |
|---|---|---|
| When I subscribe to the newsletter | 3 `check Newsletter` | `SetNewsletter(true)` |
| after reloading … I am subscribed | 8 reload, 9 wait `Page`, 11 assert `Newsletter` checked=true | `Reload()` + `IsSubscribed(true)` |

- In Selenium, `IWebElement.Selected` is the checked state of a checkbox.
- `SetChecked` only clicks if the state has to change, the same as the recorder's `check()`.
- `SetChecked` reuses `Ui.Click`, which performs a real mouse click on the `<input>`. React's `onChange` fires on a real click, so the checkbox state reaches React. Compare Lab 6, where `Clear()` changed the DOM without firing `onChange`.

Result: `Passed! - Failed: 0, Passed: 5, Skipped: 0, Total: 5`.
</details>

---

## Exercise B: AC-105, unsubscribe (spot the data gap)

> **AC-105:** A subscribed customer can unsubscribe, and it persists after reload.

Before you write anything, think it through. What does the seed customer look like? What would the flow test have to do first? What would the `Given` for E2E be?

<details>
<summary>Discussion</summary>

The seed customer has `newsletter: false`. There are two ways to get a *subscribed* customer:

1. **Set it up through the UI** in the flow and scenario: check, save, then uncheck, save, reload. It works, but the scenario is about unsubscribing, not subscribing, and the setup steps hide the intent.
2. **Add a fixture** such as `subscribedCustomer` in `seed.ts`. Both sides must be able to select it: the flow via `resetStore(subscribedCustomer)` (give `resetStore` a customer parameter that defaults to `seedCustomer`) and `fixture: 'subscribedCustomer'`, and E2E via a reset parameter such as `/?reset=subscribed`, plus a step such as `Given I am a customer subscribed to the newsletter`.

Option 2 is the **shared test data** problem (gap 6 in `sample/docs/contract-driven-bdd.md`). Notice that the contract already has a `fixture` field for this. Try implementing option 2. You'll touch `seed.ts`, `customerApi.ts`, `main.tsx`, the flow file, `Hooks.cs` (or a new `Given` step that opens a different reset URL), and the feature file.
</details>

---

## Exercise C: AC-106, a new field (stretch, no solution)

> **AC-106:** A customer can set a phone number. It must contain only digits, spaces and an optional leading `+`. Otherwise "Enter a valid phone number" is shown.

This touches everything, the same as a real story. Use this checklist:

- [ ] Tester: two scenarios (valid, persists after reload; invalid shows the error), tagged `@AC-106`. Maybe a Scenario Outline for several invalid values.
- [ ] Generator reports AC-106 has no contract.
- [ ] Developer: add `phone` to `Customer` and the seed, the input with `data-testid="profile-phone"` and a `<label>`, validation with `role="alert"` and `data-testid="profile-phone-error"`.
- [ ] Developer: flow test(s) for AC-106, `(cd web && npm run contracts)`, no ⚠ warnings.
- [ ] Generator: `Phone` and `PhoneError` members appear, and coverage is 5/5 (or 6/6 with Exercise B).
- [ ] Bind with the agent or by hand. Review against the rules in chapter 09, section 9.5.
- [ ] `./run-e2e.sh` all green.
- [ ] Break it once: make validation accept letters. Which net catches it first?

---

## Exercise D: explain it back

Answer these in your own words, then check.

1. Why does the flow test use `flow.click(option, { closes: listbox })` instead of just `flow.click(option)`?
2. The developer's flow only ever picked New Zealand. Why does the United Kingdom row of the outline pass?
3. Where would a Selenium test that searched for the options *inside* the country field's `<div>` fail, and which contract fact warns you about it?
4. Why are locators generated by a script, while page objects are written by AI?
5. Your E2E "after reloading" step fails. What's the first thing you compare, and with what?
6. A developer renames `profile-full-name` to `profile-name`. List, in order, every place something turns red.

<details>
<summary>Answers</summary>

1. Picking an option closes the listbox. Recording `closes` adds a `wait until CountryListbox is hidden` step, so Selenium waits for the popup to go away before the next action. Without it, the next click could land on the closing popup.
2. The page object selects options by **accessible name** (`ClickByName(CountryOptions, name)`), not by the recorded key. "United Kingdom" is in the contract's `Names:` list, because the recorder saw all five options in `country-open`.
3. The listbox is rendered in a **portal** at the end of `<body>`, so it isn't inside the field's `<div>`. The contract marks it `"portal": true`, and the locator docs say `PORTAL: … search from document root`.
4. A locator is a fact, and a script copies it the same way every time, with clean diffs and a CI `--check`. Mapping "I choose X as my country" to open → wait → pick → wait-hidden is about meaning, which AI is good at. The result is reviewed by a human.
5. Compare `bin/Debug/net8.0/artifacts/<scenario>/dom.html` with the contract's HTML for the same state (for example `…/05-reloaded.html`). They're the same kind of file, so the difference is the bug.
6. (1) The flow tests, because `getByTestId('profile-full-name')` isn't found, so the developer updates them. (2) The contracts change in the PR diff. (3) `npm run locators:check` reports stale files. (4) After regenerating, `dotnet build` fails: `CustomerProfileLocators` has no `FullName` (it's now `Name`). (5) The page object is updated in one place, and E2E is green again.
</details>

---

## Where to go next

- Read `sample/docs/contract-driven-bdd.md`, sections 7–9 (gap analysis, working agreement, pipeline). Now every line should make sense.
- Pick a real page in your own product with a hard control (autocomplete, date picker, data grid). Add a recorder-based flow for one AC, and see which gaps from section 7 of that document show up first.
