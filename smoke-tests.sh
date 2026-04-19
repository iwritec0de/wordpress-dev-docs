#!/usr/bin/env bash
# smoke-tests.sh — exercise every example fixture against every built-in skin
# using the globally-installed `wpdocs` binary.
#
# Usage:
#   ./smoke-tests.sh <output-dir>                # full matrix: examples × skins
#   ./smoke-tests.sh <output-dir> --skin <id>    # one skin across all examples
#   ./smoke-tests.sh <output-dir> --example <id> # one example across all skins
#   ./smoke-tests.sh <output-dir> --clean        # wipe <output-dir> before run
#   ./smoke-tests.sh <output-dir> --validate     # also run `wpdocs validate`
#   ./smoke-tests.sh <output-dir> --quick        # only `default` skin per example
#   ./smoke-tests.sh --help
#
# The script never calls `pnpm dev` or the repo's source — it uses `wpdocs`
# from PATH (install via `pnpm install:global` in the repo root first).
#
# Exit codes:
#   0  all combinations succeeded
#   1  one or more generate / validate invocations failed
#   2  usage / prerequisite error (wpdocs missing, bad args, etc.)
set -u

# ─── Colors ───────────────────────────────────────────────────────────────────

if [[ -t 1 ]]; then
  C_RESET=$'\033[0m'
  C_BOLD=$'\033[1m'
  C_DIM=$'\033[2m'
  C_GREEN=$'\033[32m'
  C_RED=$'\033[31m'
  C_YELLOW=$'\033[33m'
  C_CYAN=$'\033[36m'
else
  C_RESET="" C_BOLD="" C_DIM="" C_GREEN="" C_RED="" C_YELLOW="" C_CYAN=""
fi

log()   { printf '%s\n' "$*"; }
info()  { printf '%s%s%s %s\n' "$C_CYAN" "▸" "$C_RESET" "$*"; }
pass()  { printf '%s%s%s %s\n' "$C_GREEN" "✓" "$C_RESET" "$*"; }
fail()  { printf '%s%s%s %s\n' "$C_RED"   "✗" "$C_RESET" "$*"; }
warn()  { printf '%s%s%s %s\n' "$C_YELLOW" "!" "$C_RESET" "$*"; }
dim()   { printf '%s%s%s\n' "$C_DIM" "$*" "$C_RESET"; }

# ─── Arg parsing ──────────────────────────────────────────────────────────────

usage() {
  sed -n '2,16p' "$0" | sed 's/^# \{0,1\}//'
  exit "${1:-0}"
}

OUTPUT_DIR=""
SKIN_FILTER=""
EXAMPLE_FILTER=""
CLEAN=0
RUN_VALIDATE=0
QUICK=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help) usage 0 ;;
    --skin)     SKIN_FILTER="${2:-}";    shift 2 ;;
    --example)  EXAMPLE_FILTER="${2:-}"; shift 2 ;;
    --clean)    CLEAN=1;        shift ;;
    --validate) RUN_VALIDATE=1; shift ;;
    --quick)    QUICK=1;        shift ;;
    -*) fail "Unknown flag: $1"; usage 2 ;;
    *)
      if [[ -z "$OUTPUT_DIR" ]]; then
        OUTPUT_DIR="$1"; shift
      else
        fail "Unexpected argument: $1"; usage 2
      fi
      ;;
  esac
done

if [[ -z "$OUTPUT_DIR" ]]; then
  fail "Missing required <output-dir> argument"
  usage 2
fi

# ─── Prerequisites ────────────────────────────────────────────────────────────

if ! command -v wpdocs >/dev/null 2>&1; then
  fail "wpdocs not found on PATH."
  dim "  Install it first from the repo root:"
  dim "    pnpm install:global"
  exit 2
fi

if ! command -v jq >/dev/null 2>&1; then
  fail "jq is required (reads _meta.json)."
  dim "  Install with: brew install jq"
  exit 2
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXAMPLES_DIR="$REPO_ROOT/examples"

if [[ ! -d "$EXAMPLES_DIR" ]]; then
  fail "No examples directory at $EXAMPLES_DIR"
  exit 2
fi

# ─── Resolve output dir (supports ~ and relative paths) ───────────────────────

OUTPUT_DIR="${OUTPUT_DIR/#\~/$HOME}"
if [[ "$OUTPUT_DIR" != /* ]]; then
  OUTPUT_DIR="$(pwd)/$OUTPUT_DIR"
fi

if [[ $CLEAN -eq 1 && -d "$OUTPUT_DIR" ]]; then
  warn "Cleaning existing output directory: $OUTPUT_DIR"
  rm -rf "$OUTPUT_DIR"
fi
mkdir -p "$OUTPUT_DIR"

# ─── Discover examples and skins ──────────────────────────────────────────────

EXAMPLES=()
while IFS= read -r meta; do
  EXAMPLES+=("$(dirname "$meta")")
done < <(find "$EXAMPLES_DIR" -mindepth 2 -maxdepth 2 -name '_meta.json' | sort)

if [[ ${#EXAMPLES[@]} -eq 0 ]]; then
  fail "No examples with _meta.json found under $EXAMPLES_DIR"
  exit 2
fi

if [[ -n "$EXAMPLE_FILTER" ]]; then
  FILTERED=()
  for ex_dir in "${EXAMPLES[@]}"; do
    [[ "$(basename "$ex_dir")" == "$EXAMPLE_FILTER" ]] && FILTERED+=("$ex_dir")
  done
  if [[ ${#FILTERED[@]} -eq 0 ]]; then
    fail "Unknown example: $EXAMPLE_FILTER"
    dim "  Available: $(for d in "${EXAMPLES[@]}"; do basename "$d"; done | tr '\n' ' ')"
    exit 2
  fi
  EXAMPLES=("${FILTERED[@]}")
fi

# Pull skin list from `wpdocs themes --json` — source of truth
if ! SKINS_JSON="$(wpdocs themes --json 2>/dev/null)"; then
  fail "Failed to query wpdocs themes. Is the installed version up to date?"
  dim "  Re-run: pnpm install:global"
  exit 2
fi

SKINS=()
while IFS= read -r _skin_id; do
  [[ -n "$_skin_id" ]] && SKINS+=("$_skin_id")
done < <(echo "$SKINS_JSON" | jq -r '.themes[].id')

if [[ $QUICK -eq 1 ]]; then
  SKINS=("default")
fi

if [[ -n "$SKIN_FILTER" ]]; then
  found=0
  for s in "${SKINS[@]}"; do [[ "$s" == "$SKIN_FILTER" ]] && found=1 && break; done
  if [[ $found -eq 0 ]]; then
    fail "Unknown skin: $SKIN_FILTER"
    dim "  Available: ${SKINS[*]}"
    exit 2
  fi
  SKINS=("$SKIN_FILTER")
fi

# ─── Banner ───────────────────────────────────────────────────────────────────

WPDOCS_VERSION="$(wpdocs --version 2>/dev/null || echo 'unknown')"
WPDOCS_PATH="$(command -v wpdocs)"
TOTAL=$(( ${#EXAMPLES[@]} * ${#SKINS[@]} ))

echo
log "${C_BOLD}wpdocs smoke tests${C_RESET}"
dim  "  binary:    $WPDOCS_PATH ($WPDOCS_VERSION)"
dim  "  output:    $OUTPUT_DIR"
dim  "  examples:  ${#EXAMPLES[@]}"
dim  "  skins:     ${#SKINS[@]} (${SKINS[*]})"
dim  "  total:     $TOTAL generate runs$([[ $RUN_VALIDATE -eq 1 ]] && echo " + ${#EXAMPLES[@]} validate runs")"
echo

# ─── Run matrix ───────────────────────────────────────────────────────────────

PASSES=0
FAILURES=()
START_TS=$(date +%s)

for ex_dir in "${EXAMPLES[@]}"; do
  ex_name="$(basename "$ex_dir")"
  meta="$ex_dir/_meta.json"
  ex_display="$(jq -r '.displayName // .name' "$meta")"
  ex_type="$(jq -r '.type' "$meta")"

  info "${C_BOLD}$ex_display${C_RESET} ${C_DIM}(type=$ex_type)${C_RESET}"

  for skin in "${SKINS[@]}"; do
    out_sub="$OUTPUT_DIR/${ex_name}-${skin}"
    log_file="$OUTPUT_DIR/.logs/${ex_name}-${skin}.log"
    mkdir -p "$(dirname "$log_file")"

    label="$ex_name × $skin"
    printf '  %s%s%s %-50s ' "$C_DIM" "›" "$C_RESET" "$label"

    if wpdocs generate "$ex_dir" \
        --type "$ex_type" \
        --skin "$skin" \
        --output-dir "$out_sub" \
        >"$log_file" 2>&1; then
      pass "→ $out_sub"
      PASSES=$((PASSES + 1))
    else
      fail "(see $log_file)"
      FAILURES+=("$label")
    fi
  done

  if [[ $RUN_VALIDATE -eq 1 ]]; then
    validate_log="$OUTPUT_DIR/.logs/${ex_name}-validate.log"
    printf '  %s%s%s %-50s ' "$C_DIM" "›" "$C_RESET" "$ex_name validate"
    if wpdocs validate "$ex_dir" --type "$ex_type" >"$validate_log" 2>&1; then
      pass "coverage ok"
    else
      fail "(see $validate_log)"
      FAILURES+=("$ex_name validate")
    fi
  fi

  echo
done

# ─── Summary ──────────────────────────────────────────────────────────────────

DURATION=$(( $(date +%s) - START_TS ))

log "${C_BOLD}Summary${C_RESET}"
pass "$PASSES / $TOTAL$([[ $RUN_VALIDATE -eq 1 ]] && echo " (+ validate)") passed in ${DURATION}s"

if [[ ${#FAILURES[@]} -gt 0 ]]; then
  echo
  fail "${#FAILURES[@]} failure(s):"
  for f in "${FAILURES[@]}"; do
    echo "    - $f"
  done
  echo
  dim "Per-run logs in: $OUTPUT_DIR/.logs/"
  exit 1
fi

echo
dim "Generated sites under: $OUTPUT_DIR"
dim "Preview one with: cd $OUTPUT_DIR/<example>-<skin> && npm install && npm run dev"
exit 0
