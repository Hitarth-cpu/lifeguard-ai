#!/usr/bin/env bash
# ==============================================================================
# tests/lifeguard-scripts.test.sh - Validates presence and structure of sh_scripts
# ==============================================================================

# shellcheck source=tests/lib.sh
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

printf "1..10\n"

assert_present "$ROOT/sh_scripts/01_setup.sh" "01_setup.sh script exists"
assert_present "$ROOT/sh_scripts/02_start_backend.sh" "02_start_backend.sh script exists"
assert_present "$ROOT/sh_scripts/03_start_mcp.sh" "03_start_mcp.sh script exists"
assert_present "$ROOT/sh_scripts/04_start_desktop.sh" "04_start_desktop.sh script exists"
assert_present "$ROOT/sh_scripts/05_run_all.sh" "05_run_all.sh script exists"
assert_present "$ROOT/sh_scripts/06_trigger_risk_scan.sh" "06_trigger_risk_scan.sh script exists"
assert_present "$ROOT/sh_scripts/07_run_tests.sh" "07_run_tests.sh script exists"
assert_present "$ROOT/sh_scripts/08_qodo_code_review.sh" "08_qodo_code_review.sh script exists"
assert_present "$ROOT/sh_scripts/09_lifeguard_guard.sh" "09_lifeguard_guard.sh script exists"
assert_present "$ROOT/sh_scripts/10_bearings_snapshot.sh" "10_bearings_snapshot.sh script exists"
