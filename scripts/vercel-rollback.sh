#!/bin/bash
# Vercel instant rollback script
# Usage: ./scripts/vercel-rollback.sh [production|preview]

set -euo pipefail

ENVIRONMENT="${1:-production}"
PROJECT="sendquote-india"
TEAM="zenith-reachers-group"

echo "🔍 Checking Vercel CLI availability..."
if ! command -v vercel &> /dev/null; then
  echo "Installing Vercel CLI..."
  npm install -g vercel
fi

echo "📋 Fetching last 5 deployments for ${ENVIRONMENT}..."
vercel list --team "$TEAM" --environment "$ENVIRONMENT" --limit 5

echo ""
echo "⚠️  To rollback to a specific deployment, run:"
echo "   vercel rollback <deployment-url> --team $TEAM"
echo ""
echo "   Or for instant rollback to previous:"
echo "   vercel rollback --team $TEAM"
