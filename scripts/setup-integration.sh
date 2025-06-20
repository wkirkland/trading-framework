#!/bin/bash

# Integration Test Environment Setup Script
# Helps configure real API keys for integration testing

set -e

echo "🧪 Integration Test Environment Setup"
echo "===================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in project root directory${NC}"
    exit 1
fi

echo "📋 Integration Test Prerequisites"
echo "==============================="
echo ""
echo "For integration tests, you'll need:"
echo "1. 🏦 FRED API Key (Required)"
echo "   - Get one at: https://fred.stlouisfed.org/docs/api/api_key.html"
echo "   - Free registration required"
echo ""
echo "2. 📈 Alpha Vantage API Key (Optional)"
echo "   - Get one at: https://www.alphavantage.co/support/#api-key"
echo "   - Free tier available"
echo ""

# Check if integration config already exists
if [ -f ".env.integration.local" ]; then
    echo -e "${YELLOW}⚠️  .env.integration.local already exists${NC}"
    echo "Do you want to update it? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Keeping existing configuration."
        exit 0
    fi
fi

echo "🔧 Setting up integration environment..."

# Copy template to local file
cp .env.integration .env.integration.local

echo -e "${GREEN}✅ Created .env.integration.local from template${NC}"
echo ""

# Prompt for FRED API key
echo "🏦 Please enter your FRED API key:"
echo "   (You can get one at: https://fred.stlouisfed.org/docs/api/api_key.html)"
read -r -p "FRED API Key: " fred_api_key

if [ -z "$fred_api_key" ]; then
    echo -e "${RED}❌ FRED API key is required for integration tests${NC}"
    exit 1
fi

# Update the local file with the real API key
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/FRED_API_KEY=your_real_fred_api_key_here/FRED_API_KEY=$fred_api_key/" .env.integration.local
else
    # Linux
    sed -i "s/FRED_API_KEY=your_real_fred_api_key_here/FRED_API_KEY=$fred_api_key/" .env.integration.local
fi

echo -e "${GREEN}✅ FRED API key configured${NC}"

# Prompt for Alpha Vantage API key (optional)
echo ""
echo "📈 Alpha Vantage API key (optional, press Enter to skip):"
read -r -p "Alpha Vantage API Key: " av_api_key

if [ -n "$av_api_key" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here/ALPHA_VANTAGE_API_KEY=$av_api_key/" .env.integration.local
    else
        # Linux
        sed -i "s/ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here/ALPHA_VANTAGE_API_KEY=$av_api_key/" .env.integration.local
    fi
    echo -e "${GREEN}✅ Alpha Vantage API key configured${NC}"
else
    echo -e "${YELLOW}⚠️  Alpha Vantage API key skipped (optional)${NC}"
fi

echo ""
echo "🧪 Testing API key configuration..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Test the configuration
echo "🔍 Validating FRED API key..."
response=$(curl -s --max-time 10 \
    "https://api.stlouisfed.org/fred/series/observations?series_id=UNRATE&api_key=$fred_api_key&limit=1&file_type=json" \
    || echo "ERROR")

if echo "$response" | grep -q '"observations"'; then
    echo -e "${GREEN}✅ FRED API key validation successful${NC}"
    api_valid=true
else
    echo -e "${RED}❌ FRED API key validation failed${NC}"
    echo "Response: $response"
    api_valid=false
fi

echo ""
echo "📊 Integration Test Setup Summary"
echo "==============================="
echo "Configuration file: .env.integration.local"
echo "FRED API Key: ${fred_api_key:0:8}..." 
echo "Alpha Vantage: ${av_api_key:+Configured}"
echo "API Validation: ${api_valid:+✅ Passed}"

if [ "$api_valid" = true ]; then
    echo ""
    echo -e "${GREEN}🎉 Integration test environment ready!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run integration tests: npm run test:integration"
    echo "2. Run all tests: npm run test:all"
    echo "3. Watch integration tests: npm run test:integration:watch"
    echo ""
    echo "📁 Files created:"
    echo "   - .env.integration.local (contains your API keys)"
    echo "   - This file is automatically git-ignored for security"
else
    echo ""
    echo -e "${YELLOW}⚠️  Setup complete with warnings${NC}"
    echo ""
    echo "Issues to resolve:"
    echo "- FRED API key validation failed"
    echo "- Please verify your API key and try again"
    echo ""
    echo "You can re-run this script to update your configuration:"
    echo "   ./scripts/setup-integration.sh"
fi

echo ""
echo "🔒 Security Note:"
echo "Your API keys are stored in .env.integration.local"
echo "This file is git-ignored and will not be committed to version control."
echo "Keep your API keys secure and never share them publicly."