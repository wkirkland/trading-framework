#!/bin/bash

# Development Setup Script for Trading Framework
# Sets up the complete development environment

set -e

echo "🚀 Setting up Trading Framework development environment..."

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required (current: $(node -v))"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Setup git hooks
echo "🎣 Setting up git hooks..."
npm run prepare

# Create .env.example if it doesn't exist
if [ ! -f .env.example ]; then
    echo "📝 Creating .env.example..."
    cat > .env.example << 'EOF'
# Trading Framework Environment Variables

# FRED API Configuration
FRED_API_KEY=your_fred_api_key_here

# Alpha Vantage API Configuration  
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here

# Application Configuration
NODE_ENV=development
PORT=3000

# Security Note:
# Never commit actual API keys to version control
# Copy this file to .env.local and add your real keys
EOF
fi

# Run initial tests
echo "🧪 Running initial test suite..."
npm run test:ci

# Run linting
echo "🔍 Running linting..."
npm run lint

# Test gitleaks configuration
echo "🔒 Testing secret scanning..."
npx gitleaks detect --config .gitleaks.toml

echo "✅ Development environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy .env.example to .env.local"
echo "2. Add your real API keys to .env.local"
echo "3. Run 'npm run dev' to start development server"
echo "4. Run 'scripts/test-docker.sh' to verify Docker setup (if Docker is available)"
echo ""
echo "🔗 Available scripts:"
echo "  npm run dev          - Start development server"
echo "  npm run test         - Run tests in watch mode"
echo "  npm run test:ci      - Run tests once with coverage"
echo "  npm run lint         - Run ESLint"
echo "  npm run build        - Build for production"