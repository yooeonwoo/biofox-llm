#!/bin/bash

# Deployment fix script for Memory Management feature
# This script will force rebuild the container and ensure frontend is properly deployed

set -e

echo "🚀 Starting deployment fix for Memory Management feature..."

# Change to project directory
cd "$(dirname "$0")"

echo "📁 Current directory: $(pwd)"

# Step 1: Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Step 2: Stop and remove existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker/docker-compose.yml down --remove-orphans || echo "No containers to stop"

# Step 3: Remove existing images to force rebuild
echo "🗑️  Removing existing images..."
docker image rm anythingllm_anything-llm 2>/dev/null || echo "Image not found, continuing..."
docker image rm anythingllm-anything-llm 2>/dev/null || echo "Image not found, continuing..."

# Step 4: Clean up build cache
echo "🧹 Cleaning up Docker build cache..."
docker builder prune -f

# Step 5: Build frontend locally first to ensure it works
echo "🔧 Building frontend locally..."
cd frontend
npm run build
echo "✅ Frontend build completed successfully"
cd ..

# Step 6: Force rebuild container with no cache
echo "🔨 Rebuilding Docker container with --no-cache..."
docker-compose -f docker/docker-compose.yml build --no-cache

# Step 7: Start the services
echo "🚀 Starting services..."
docker-compose -f docker/docker-compose.yml up -d

# Step 8: Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Step 9: Check if containers are running
echo "📊 Checking container status..."
docker-compose -f docker/docker-compose.yml ps

# Step 10: Check if frontend files exist in container
echo "🔍 Verifying frontend files in container..."
docker exec anythingllm ls -la /app/server/public/ || echo "Could not check frontend files"

# Step 11: Show container logs for debugging
echo "📝 Container logs (last 20 lines):"
docker-compose -f docker/docker-compose.yml logs --tail=20 anything-llm

echo "✅ Deployment fix completed!"
echo ""
echo "🔗 Your application should be available at: http://localhost:3001"
echo ""
echo "🔍 To debug further:"
echo "   - Check container logs: docker-compose -f docker/docker-compose.yml logs anything-llm"
echo "   - Check frontend files: docker exec anythingllm ls -la /app/server/public/"
echo "   - Check user mem0 status: node check_mem0_status.js"