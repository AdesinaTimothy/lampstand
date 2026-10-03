#!/bin/sh
# Container start: apply migrations, then serve. The optional demo seed runs in
# the background so the app binds its port at once (small hosts such as Render's
# free plan need several minutes to seed and would otherwise time out the deploy).
# Node is invoked directly rather than through npm/npx to keep memory low.
set -e
node node_modules/prisma/build/index.js migrate deploy

if [ "$SEED_DEMO_IF_EMPTY" = "true" ]; then
  (
    status=0
    node node_modules/tsx/dist/cli.mjs --conditions=react-server scripts/seed-if-empty.ts || status=$?
    if [ "$status" = "3" ]; then
      if node node_modules/tsx/dist/cli.mjs --conditions=react-server prisma/seed.ts; then
        echo "start: demo seed finished"
      else
        echo "start: demo seed FAILED (see the error above)" >&2
      fi
    elif [ "$status" != "0" ]; then
      echo "start: seed check FAILED with status $status" >&2
    fi
  ) &
fi

exec node node_modules/next/dist/bin/next start -p "${PORT:-3000}"
