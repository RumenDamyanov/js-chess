#!/bin/bash
# Docker Build Script for all applications

echo "🐳 Building Docker images for all applications..."

# Function to build with error handling
build_image() {
    local context=$1
    local image_name=$2

    echo "Building $image_name..."
    if docker build -t "$image_name" "$context"; then
        echo "✅ $image_name built successfully"
    else
        echo "❌ Failed to build $image_name"
        return 1
    fi
}

# Build backend
if [ -d "backend/go-chess" ]; then
    build_image "backend/go-chess" "chess-backend"
else
    echo "⚠️ Backend not found, skipping..."
fi

# Build frontend applications
for app in vanilla-js jquery vue react angular; do
    if [ -d "apps/$app" ]; then
        build_image "apps/$app" "chess-$app"
    else
        echo "⚠️ $app not found, skipping..."
    fi
done

# Build nginx if config exists
if [ -d "docker/nginx" ]; then
    build_image "docker/nginx" "chess-nginx"
fi

echo ""
echo "🎯 Build complete! You can now run:"
echo "   docker-compose up"
echo ""
echo "Or run individual containers:"
echo "   docker run -p 8080:8080 chess-backend"
echo "   docker run -p 3001:80 chess-vanilla-js"
echo "   docker run -p 3002:80 chess-jquery"
echo "   docker run -p 3003:80 chess-vue"
echo "   docker run -p 3004:80 chess-react"
echo "   docker run -p 3005:80 chess-angular"
