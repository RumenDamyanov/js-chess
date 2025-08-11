#!/bin/bash
# Simple Development Setup Script for existing project

echo "🚀 Setting up JS Chess development environment (existing project)..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not available. Please ensure Node.js is properly installed."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install dependencies for existing apps
echo "🏗️ Installing dependencies for frontend applications..."

# Vue.js app dependencies
if [ -f "apps/vue/package.json" ]; then
    echo "Installing Vue.js dependencies..."
    cd apps/vue
    npm install
    cd ../..
    echo "✅ Vue.js dependencies installed"
else
    echo "⚠️ Vue.js package.json not found, skipping..."
fi

# React.js app dependencies
if [ -f "apps/react/package.json" ]; then
    echo "Installing React.js dependencies..."
    cd apps/react
    npm install
    cd ../..
    echo "✅ React.js dependencies installed"
else
    echo "⚠️ React.js package.json not found, skipping..."
fi

# Angular app dependencies
if [ -f "apps/angular/package.json" ]; then
    echo "Installing Angular dependencies..."
    cd apps/angular
    npm install
    cd ../..
    echo "✅ Angular dependencies installed"
else
    echo "⚠️ Angular package.json not found, skipping..."
fi

# jQuery app (no package.json needed)
echo "✅ jQuery app ready (no dependencies needed)"

# Vanilla JS app (no package.json needed)
echo "✅ Vanilla JS app ready (no dependencies needed)"

# Initialize git submodule for backend (if not already done)
echo "📦 Checking backend submodule..."
if [ ! -d "backend/go-chess/.git" ]; then
    echo "Adding go-chess as submodule..."
    git submodule add https://github.com/RumenDamyanov/go-chess.git backend/go-chess 2>/dev/null || echo "Submodule may already exist"
    git submodule update --init --recursive
else
    echo "Backend submodule exists, updating..."
    git submodule update --remote backend/go-chess
fi

# Copy environment configuration if it doesn't exist
echo "⚙️ Setting up environment configuration..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "Created .env file from template"
    else
        # Create a basic .env file
        cat > .env << EOF
# Backend Configuration
CHESS_HOST=localhost
CHESS_PORT=8080

# Frontend Ports
VANILLA_PORT=3001
JQUERY_PORT=3002
VUE_PORT=3003
REACT_PORT=3004
ANGULAR_PORT=3005

# Development
NODE_ENV=development
EOF
        echo "Created basic .env file"
    fi
else
    echo ".env file already exists"
fi

echo ""
echo "✅ Development environment setup complete!"
echo ""
echo "🎯 Next steps:"
echo ""
echo "1. Start with Docker (recommended):"
echo "   docker-compose up --build"
echo ""
echo "2. Or start individual components:"
echo "   npm run start:backend  # Start Go backend API"
echo "   npm run start:vanilla  # Start Vanilla JS app"
echo "   npm run start:vue      # Start Vue.js app"
echo "   npm run start:react    # Start React.js app"
echo "   npm run start:angular  # Start Angular app"
echo ""
echo "3. Or start all frontends at once:"
echo "   npm run start:all"
echo ""
echo "📚 Access URLs:"
echo "   - Landing Page: http://localhost:3000"
echo "   - API: http://localhost:8080"
echo "   - Vanilla JS: http://localhost:3001"
echo "   - jQuery: http://localhost:3002"
echo "   - Vue.js: http://localhost:3003"
echo "   - React.js: http://localhost:3004"
echo "   - Angular: http://localhost:3006"
echo ""
echo "📖 Documentation: docs/development.md"
