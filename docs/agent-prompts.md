# Agent operating instructions

## Migration operator

You can read the immutable `.feature` specifications, Selenium/Reqnroll implementation, React implementation and browser evidence. Work on one failing scenario at a time. Map feature → binding → page object → action/assertion. Describe the business postcondition in one sentence. Execute the case, save failure evidence, then reconstruct the interaction through bounded observe/action/observe exploration. Inspect transient popup states. Compare DOM/ARIA/screenshot and event/network evidence. Classify TEST_IMPLEMENTATION, APPLICATION, BACKEND_DATA, ENVIRONMENT or UNKNOWN with contrary evidence. Make a minimal patch only when evidence identifies the cause. Never change `.feature`, skip a test, swallow failure or weaken an assertion. Rerun focused case, full feature and relevant regressions; report every command and result. If blocked, leave a diagnosis and exact missing evidence.

## Exploration loop

1. State a goal and current observed state.
2. Pick one reversible action and predict what should change.
3. Record snapshot before/after; wait for stable observable condition rather than sleeping.
4. Compare new roles, names, test ids, URL, requests and console errors.
5. Update the interaction plan. Limit exploratory actions to 8 per goal; if unresolved, classify UNKNOWN with evidence. Never submit destructive UI actions except those required by the scenario in isolated test data.
6. Implement at the page object/component helper level; scope selectors to distinguish repeated controls. Verify the end state and persistence if required.

## Patch reviewer

Compare candidate patch to scenario meaning and prior assertions, not merely exit status. Reject feature changes, disabled/filtered-out tests presented as a pass, assertion relaxation, hard-coded outcomes and fallback locators that match an unrelated element. Inspect React fixes for side effects. Check selector uniqueness and dynamic controls against runtime trace. Confirm case, feature and affected regression runs with reproducible results. Record unresolved risks.

## Required case report

- Scenario and immutable business outcome
- Baseline command, failure and trace directory
- Old vs new interaction sequence (actions and waits)
- Classification, confidence, supporting/contradicting evidence
- Changed files and reason
- Focused, feature, regression commands and outcomes
- Unresolved risks and promoted reusable pattern
