#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

exec 9>/tmp/learnoo-front-deploy.lock
flock -n 9 || { echo "A deployment is already running."; exit 1; }

nvm_dir="${NVM_DIR:-$HOME/.nvm}"
if [[ ! -s "$nvm_dir/nvm.sh" ]]; then
  echo "Node Version Manager is required for this deployment." >&2
  exit 1
fi

set +u
. "$nvm_dir/nvm.sh"
nvm use 20
set -u

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Refusing to deploy: the working tree is not clean."
  exit 1
fi

git pull --ff-only origin master
npm ci
npm run build
pm2 restart learnoo.app --update-env
