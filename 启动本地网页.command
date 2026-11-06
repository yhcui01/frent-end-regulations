#!/bin/zsh
set -e
cd "$(dirname "$0")"
exec node local-server.mjs

