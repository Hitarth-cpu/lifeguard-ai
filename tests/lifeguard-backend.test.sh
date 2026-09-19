#!/usr/bin/env bash
# ==============================================================================
# tests/lifeguard-backend.test.sh - Validates backend build and db initializers
# ==============================================================================

# shellcheck source=tests/lib.sh
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

printf "1..3\n"

assert_present "$ROOT/packages/backend/src/server.ts" "Backend server source file exists"
assert_present "$ROOT/packages/backend/src/db.ts" "Backend database module exists"

# Test TypeScript compilation output
if [ -d "$ROOT/packages/backend/dist" ]; then
  pass "Backend build artifacts present in packages/backend/dist"
else
  fail "Backend build artifacts missing"
fi
