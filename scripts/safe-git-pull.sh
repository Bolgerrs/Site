#!/usr/bin/env bash
set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "safe-git-pull: not a git repository"
  exit 0
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "safe-git-pull: skip pull, no git remote configured"
  exit 0
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if ! git rev-parse --verify "origin/$BRANCH" >/dev/null 2>&1; then
  echo "safe-git-pull: skip pull, no upstream origin/$BRANCH"
  exit 0
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "safe-git-pull: skip pull, worktree dirty"
  exit 0
fi

git pull --ff-only
