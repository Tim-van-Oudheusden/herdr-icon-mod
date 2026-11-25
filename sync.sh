#!/usr/bin/env bash
# Copy the runtime mod into Herdr's app home. Your icons.json and staged icons
# are kept as-is, so editing the config never gets overwritten by an update.
set -euo pipefail

root="$(cd "$(dirname "$0")" && pwd)"
src="$root/mods/icon-spaces"
dest="${HERDR_APP_HOME:-${XDG_CONFIG_HOME:-$HOME/.config}/herdr-app}/mods/icon-spaces"

mkdir -p "$dest"
cp -f "$src"/*.js "$src"/mod.json "$dest"/
if [ ! -f "$dest/icons.json" ]; then
  cp "$src/icons.json" "$dest/icons.json"
fi

herdr-app check "$dest"
