#!/bin/sh
# Starts as root only to hand a mounted storage volume to the app user, then
# drops privileges, so the app itself never runs as root.
set -e
if [ "$(id -u)" = "0" ]; then
  dir="${STORAGE_LOCAL_DIR:-/app/storage}"
  mkdir -p "$dir" && chown -R lampstand:lampstand "$dir"
  exec setpriv --reuid=lampstand --regid=lampstand --init-groups "$@"
fi
exec "$@"
