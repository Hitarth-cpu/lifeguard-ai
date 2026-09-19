#!/usr/bin/env bash
# ==============================================================================
# tests/lifeguard-desktop.test.sh - Validates desktop package build and preload
# ==============================================================================

# shellcheck source=tests/lib.sh
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

printf "1..3\n"

assert_present "$ROOT/packages/desktop/src/main.ts" "Desktop main process source exists"
assert_present "$ROOT/packages/desktop/src/preload.ts" "Desktop preload script source exists"

if [ -d "$ROOT/packages/desktop/dist" ]; then
  pass "Desktop app build compiled to dist/"
else
  fail "Desktop app build output missing"
fi
