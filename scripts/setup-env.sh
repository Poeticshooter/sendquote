#!/bin/bash
# Environment Security Setup Script
# Run this script to configure secure environment variables and permissions

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔒 Environment Security Setup"
echo "==========================="

# 1. Create .env.example (for development)
echo -e "${GREEN}📝 Creating .env.example...${NC}"

cat > .env.example << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here

# PostHog Configuration (Analytics)
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Google Services
NEXT_PUBLIC_GOOGLE_VERIFICATION=your_google_verification_here
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# Formbricks Configuration
FORMBRICK_API_KEY=your_formbrick_api_key_here
FORMBRICKS_WORKSPACE_ID=your_workspace_id_here

# Security
TURNSTILE_SECRET_KEY=your_turnstile_secret_key_here

# Environment
NODE_ENV=production
PORT=3000
EOF

echo -e "${GREEN}✅ .env.example created${NC}"

# 2. Check for existing .env and remove it
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️ .env file exists. Backing up...${NC}"
    mv .env .env.backup
fi

# 3. Create .env from example (user will fill this in)
echo -e "${YELLOW}📝 Copy .env.example to .env and fill in your credentials${NC}"
echo "Please edit .env file with your actual API keys and secrets."
echo "The .env.example file contains all required fields."

# 4. Set proper file permissions
echo -e "${YELLOW}🔐 Setting file permissions...${NC}"
chmod 600 .env.example
if [ -f ".env" ]; then
    chmod 600 .env
fi

# 5. Add .env to .gitignore
echo -e "${YELLOW}📝 Updating .gitignore...${NC}"
git add .gitignore
if ! grep -q "\.env$" .gitignore; then
    echo ".env" >> .gitignore
    echo "Added .env to .gitignore"
fi

# 6 of 6: Verify setup
echo -e "${YELLOW}🔍 Verifying environment setup...${NC}"

if [ -f .env ]; then
    echo -e "${GREEN}✅ .env file exists. Please fill in your credentials. ${NC}"
    echo "Required variables:"
    grep -E '^[A-Z_]+' .env.example | while read line; do
        key=$(echo $line | cut -d'=' -f1)
        if [ -n "$key" ]; then
            if [ -z "${!key}" ]; then
                echo -e "${RED}❌ Missing: $key${NC}"
            else
                echo -e "${GREEN}✅ Set: $key${NC}"
            fi
        fi
    done
else
    echo -e "${RED}❌ .env file not found. Please create it from .env.example${NC}"
    echo "Run: cp .env.example .env and fill in your credentials"
fi

echo -e "${GREEN}🎉 Environment setup completed!${NC}"
echo "Next steps:"
echo "1. Copy .env.example to .env and add your API keys"
echo "2. Run 'node scripts/validate-env.js' to verify configuration"
echo "3. Start the application: npm run dev"
