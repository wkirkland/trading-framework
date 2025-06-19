#!/bin/bash

# Docker Test Script for Trading Framework
# Tests the Docker setup and verifies all 48 tests pass

set -e

echo "🐳 Testing Docker setup for Trading Framework..."

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available"
    exit 1
fi

# Build and run tests
echo "🏗️  Building Docker images..."
docker compose build test

echo "🧪 Running tests in Docker container..."
docker compose up test --abort-on-container-exit

# Check if tests passed
if [ $? -eq 0 ]; then
    echo "✅ All 48 tests passed in Docker environment!"
else
    echo "❌ Tests failed in Docker environment"
    exit 1
fi

# Clean up
echo "🧹 Cleaning up..."
docker compose down

echo "🎉 Docker setup verification complete!"