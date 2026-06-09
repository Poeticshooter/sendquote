#!/bin/bash
# Post-deployment smoke test
# Usage: ./scripts/smoke-test.sh [url]

set -euo pipefail

BASE_URL="${1:-https://sendquote.in}"
PASS=0
FAIL=0

check_url() {
  local url="$1"
  local expected="$2"
  local desc="$3"

  status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  if [ "$status" = "$expected" ]; then
    echo "✅ $desc ($status)"
    PASS=$((PASS + 1))
  else
    echo "❌ $desc - expected $expected, got $status"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Smoke Testing $BASE_URL ==="
check_url "$BASE_URL" "200" "Homepage"
check_url "$BASE_URL/pricing" "200" "Pricing"
check_url "$BASE_URL/blog" "200" "Blog"
check_url "$BASE_URL/faq" "200" "FAQ"
check_url "$BASE_URL/features" "200" "Features"
check_url "$BASE_URL/contact" "200" "Contact"
check_url "$BASE_URL/login" "200" "Login"
check_url "$BASE_URL/api/health" "200" "Health API"

echo ""
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
