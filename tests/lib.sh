#!/usr/bin/env bash
# ==============================================================================
# tests/lib.sh - Shared TAP (Test Anything Protocol) primitives for LifeGuard
# Compatible with Windows (Git Bash/MSYS/WSL) and Unix environments.
# ==============================================================================

if [ -n "${LIFEGUARD_TEST_LIB_SOURCED:-}" ]; then
  return 0
fi
LIFEGUARD_TEST_LIB_SOURCED=1

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export ROOT

TEST_COUNT=0
TEST_PASSED=0
TEST_FAILED=0

pass() {
  TEST_COUNT=$((TEST_COUNT + 1))
  TEST_PASSED=$((TEST_PASSED + 1))
  printf "ok %d - %s\n" "$TEST_COUNT" "$1"
}

fail() {
  TEST_COUNT=$((TEST_COUNT + 1))
  TEST_FAILED=$((TEST_FAILED + 1))
  printf "not ok %d - %s\n" "$TEST_COUNT" "$1" >&2
}

assert_contains() {
  local haystack="$1" needle="$2" msg="$3"
  case "$haystack" in
    *"$needle"*) pass "$msg" ;;
    *) fail "$msg (expected to contain: '$needle')" ;;
  esac
}

assert_present() {
  local path="$1" msg="$2"
  if [ -e "$path" ]; then
    pass "$msg"
  else
    fail "$msg (path missing: '$path')"
  fi
}

expect_code() {
  local expected="$1" actual="$2" msg="$3"
  if [ "$actual" -eq "$expected" ]; then
    pass "$msg"
  else
    fail "$msg (expected exit $expected, got $actual)"
  fi
}
