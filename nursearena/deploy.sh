#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Running type check..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo ""
  echo "ERROR: Type check failed. Fix errors before deploying."
  exit 1
fi

echo "==> Running lint..."
npm run lint
if [ $? -ne 0 ]; then
  echo ""
  echo "ERROR: Lint failed. Fix errors before deploying."
  exit 1
fi

echo "==> Building production bundle..."
npx next build
if [ $? -ne 0 ]; then
  echo ""
  echo "ERROR: Build failed. Fix errors before deploying."
  exit 1
fi

if ! command -v vercel &> /dev/null; then
  echo "==> Installing Vercel CLI..."
  npm install -g vercel
fi

echo "==> Deploying to Vercel..."
vercel --prod
if [ $? -ne 0 ]; then
  echo ""
  echo "ERROR: Vercel deploy failed. Check the output above."
  exit 1
fi

echo ""
echo "Deploy complete."
