#!/usr/bin/env bash
# ==============================================================================
# LifeGuard - 08_qodo_code_review.sh
# Verifies repository state for Qodo AI Code Review compliance
# ==============================================================================

set -e

echo "🔍 Verifying Qodo AI Code Review Readiness..."

# Check git status and pull request instructions
if command -v git &> /dev/null; then
    echo "📌 Git Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'Not in a git repo')"
    echo "📌 Uncommitted changes:"
    git status --short
else
    echo "⚠️ Git command not found."
fi

echo ""
echo "📋 Qodo Code Review Instructions for PR Submission:"
echo "--------------------------------------------------------"
echo "1. Push your branch to GitHub repository."
echo "2. Open a Pull Request against 'main'."
echo "3. Qodo will automatically review the PR."
echo "4. If Qodo does not trigger automatically, comment:"
echo "   /agentic_review"
echo "5. Address or dismiss high-severity findings."
echo "6. Link the merged PR under '## Qodo Code Review Evidence' in README.md."
echo "--------------------------------------------------------"
echo "✅ Readiness check completed!"
