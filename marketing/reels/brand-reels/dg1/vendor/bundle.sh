#!/bin/sh
# Builds vendor/three-bundle.js (three.js r170 and the addons dg1 uses, as one IIFE that sets window.T3). three isn't
# one of the app's dependencies, so install it anywhere and point THREE_DIR at that folder:
#   mkdir -p /tmp/t3 && (cd /tmp/t3 && npm init -y && npm install three@0.170.0)
#   THREE_DIR=/tmp/t3 sh vendor/bundle.sh
set -e
cd "$(dirname "$0")"
NODE_PATH="$THREE_DIR/node_modules" ../../../../../node_modules/.bin/esbuild entry.js --bundle --minify --format=iife \
  --outfile=three-bundle.js --alias:three="$THREE_DIR/node_modules/three" --resolve-extensions=.js
