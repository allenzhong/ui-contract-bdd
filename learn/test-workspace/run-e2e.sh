#!/usr/bin/env bash
# One-shot local pipeline: contracts -> generated locators -> E2E against the running app.
set -euo pipefail
cd "$(dirname "$0")"

echo "== 1. Web: record UI contracts (Vitest browser mode, real Chrome)"
(cd web && npm run --silent contracts)

echo "== 2. Regenerate locators + recipes for tests/, check AC coverage"
(cd web && npm run --silent locators)

echo "== 3. Start web app (webpack dev server) if not already running"
BASE_URL="${WEB_BASE_URL:-http://localhost:8080}"
STARTED=""
if ! curl -fs "$BASE_URL" >/dev/null; then
  (cd web && npx webpack serve --mode development >/tmp/sample-web.log 2>&1) &
  STARTED=$!
  trap '[ -n "$STARTED" ] && pkill -P "$STARTED" 2>/dev/null; kill "$STARTED" 2>/dev/null || true' EXIT
  for _ in $(seq 1 60); do curl -fs "$BASE_URL" >/dev/null && break; sleep 1; done
fi

echo "== 4. Reqnroll + Selenium E2E"
(cd tests && dotnet test "$@")
