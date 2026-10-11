#!/bin/sh
set -eu
if [ "${GOLOCAL_HOSTED:-}" != true ] || [ "${DATA_DIR:-}" != /var/data/golocal ]; then
  echo 'Hosted service requires the approved persistent data directory.' >&2
  exit 1
fi
mkdir -p "$DATA_DIR"
chmod 700 "$DATA_DIR"
# Kernel flock is released on crashes. Only its exclusive holder may remove the stale app lock.
# --no-fork retains the lock through exec; concurrent instances fail closed.
exec flock --exclusive --nonblock --no-fork "$DATA_DIR/service.lock" /bin/sh -c '
  rm -f "$DATA_DIR/process.lock"
  exec node src/server.js
'
