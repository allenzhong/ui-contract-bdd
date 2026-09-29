# Artifact contracts

`inventory.json`: source paths, feature scenario headings, Selenium locator occurrences, React test id occurrences and textual candidate matches. Candidate matches are leads, not validated mappings.

`diagnosis.json`:

```json
{
  "scenario": "Edit customer country",
  "classification": "TEST_IMPLEMENTATION",
  "confidence": 0.87,
  "goal": "Saved customer country is New Zealand",
  "old_interaction": ["SelectElement.SelectByText"],
  "new_interaction": ["click combobox", "wait for listbox", "click exact option", "verify selection", "save and verify persistence"],
  "evidence": ["Closed state has role=combobox", "After click role=listbox contains New Zealand"],
  "contrary_evidence": [],
  "trace": "path/to/run",
  "suggested_files": ["CustomerPage.cs"],
  "status": "PROPOSED"
}
```

Allowed classifications: `TEST_IMPLEMENTATION`, `APPLICATION`, `BACKEND_DATA`, `ENVIRONMENT`, `UNKNOWN`. Allowed statuses: `PROPOSED`, `PATCHED`, `VERIFIED`, `BLOCKED`. Diagnosis validation requires scenario, goal, evidence, confidence, trace, classification and status. Verification status also needs `verification` with focused, feature and regression outcomes.

Snapshot bundle per step: `metadata.json` (scenario, step, timestamp, URL, action), `dom.html`, `screenshot.png`, optional `accessibility.json`, `console.json`, `network.json`. Snapshot before the step and after UI state changes, including popup open. Sanitize before persistent storage.

Component pattern: recognition properties, interaction sequence, observable wait, postcondition, version/evidence and exceptions. Promote patterns after verification, not merely an AI proposal.
