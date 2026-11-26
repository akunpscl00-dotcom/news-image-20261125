#!/usr/bin/env bash
# Renders design/poster.html to entry.png (1024x1024) with headless Chromium. Development only:
# the graded program (main.ts) never runs this, it ships the rendered entry.png.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
chrome="${CHROME:-$HOME/.cache/ms-playwright/chromium_headless_shell-1148/chrome-linux/headless_shell}"
"$chrome" --headless --no-sandbox --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1024,1024 --screenshot="$here/../entry.png" "file://$here/poster.html"
ls -l "$here/../entry.png"
