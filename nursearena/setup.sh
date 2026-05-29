#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Installing dependencies..."
npm install

echo "==> Setting up .env.local if missing..."
if [ ! -f .env.local ]; then
  if [ -f .env.example ]; then
    cp .env.example .env.local
    echo "    Created .env.local from .env.example"
    echo "    ==> Open .env.local and fill in your Supabase credentials."
  else
    echo "    WARNING: No .env.example found. Create .env.local manually."
  fi
else
  echo "    .env.local already exists — skipping"
fi

echo "==> Running type check..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo ""
  echo "ERROR: Type check failed. Fix the errors above before proceeding."
  exit 1
fi

echo "==> Running lint..."
npm run lint
if [ $? -ne 0 ]; then
  echo ""
  echo "ERROR: Lint failed. Fix the errors above before proceeding."
  exit 1
fi

echo ""
echo "Setup complete. Run 'npm run dev' to start."
