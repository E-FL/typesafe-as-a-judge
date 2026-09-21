#!/usr/bin/env bash
set -euo pipefail

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
printf "TypeSafe API token (input hidden): " >&2
IFS= read -r -s TYPESAFE_API_KEY
printf "\n" >&2
export TYPESAFE_API_KEY

node "$script_dir/validate-token.mjs"

config_home="${XDG_CONFIG_HOME:-$HOME/.config}"
token_dir="$config_home/typesafe-as-a-judge"
umask 077
mkdir -p "$token_dir"
printf '%s' "$TYPESAFE_API_KEY" > "$token_dir/token"
chmod 600 "$token_dir/token"
unset TYPESAFE_API_KEY

printf "TypeSafe token saved with owner-only permissions. Restart Codex and Claude Code to use it.\n"
