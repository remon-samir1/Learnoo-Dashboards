#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

exec 9>/tmp/learnoo-front-deploy.lock
flock -n 9 || { echo "A deployment is already running."; exit 1; }

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Refusing to deploy: the working tree is not clean."
  exit 1
fi

git pull --ff-only origin master
npm ci
npm run build
pm2 restart learnoo.app
