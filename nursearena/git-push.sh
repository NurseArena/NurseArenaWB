#!/usr/bin/env bash
set -euo pipefail

if [ $# -eq 0 ]; then
  echo "Usage: $0 \"commit message\""
  exit 1
fi

COMMIT_MSG="$*"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Running type check..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo ""
  echo "ERROR: Type check failed. Fix errors before pushing."
  exit 1
fi

echo "==> Running lint..."
npm run lint
if [ $? -ne 0 ]; then
  echo ""
  echo "ERROR: Lint failed. Fix errors before pushing."
  exit 1
fi

echo "==> Staging all changes..."
git add -A

echo "==> Committing..."
git commit -m "$COMMIT_MSG"

echo "==> Pushing..."
git push

echo ""
echo "Done — pushed with message: $COMMIT_MSG"
