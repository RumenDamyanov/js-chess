#!/bin/bash
# Development Environment Setup Script

echo "🚀 Setting up JS Chess development environment..."

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

if ! command_exists docker; then
    echo "❌ Docker is not installed. Please install Docker from https://docker.com/"
    exit 1
fi

if ! command_exists git; then
    echo "❌ Git is not installed. Please install Git"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Initialize git submodule for backend
echo "📦 Setting up backend submodule..."
if [ ! -d "backend/go-chess/.git" ]; then
    echo "Adding go-chess as submodule..."
    git submodule add https://github.com/RumenDamyanov/go-chess.git backend/go-chess
    git submodule update --init --recursive
else
    echo "Backend submodule already exists, updating..."
    git submodule update --remote backend/go-chess
fi

# Copy environment configuration
echo "⚙️ Setting up environment configuration..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "Created .env file from template"
else
    echo ".env file already exists"
fi

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Setup individual applications
echo "🏗️ Setting up frontend applications..."

# Vue.js app
if [ ! -d "apps/vue/node_modules" ]; then
    echo "Setting up Vue.js application..."
    if [ -d "apps/vue" ] && [ "$(ls -A apps/vue)" ]; then
        echo "Vue directory exists with files, installing dependencies..."
        cd apps/vue
        npm install
        cd ../..
    else
        mkdir -p apps/vue
        cd apps/vue
        echo "y" | npm create vue@latest . -- --typescript --router --pinia --eslint --prettier --devtools
        npm install
        cd ../..
    fi
fi

# React.js app
if [ ! -d "apps/react/node_modules" ]; then
    echo "Setting up React.js application..."
    if [ -d "apps/react" ] && [ "$(ls -A apps/react)" ]; then
        echo "React directory exists with files, installing dependencies..."
        cd apps/react
        npm install
        cd ../..
    else
        mkdir -p apps/react
        cd apps/react
        echo "y" | npm create vite@latest . -- --template react-ts
        npm install
        cd ../..
    fi
fi

# Angular app
if [ ! -d "apps/angular/node_modules" ]; then
    echo "Setting up Angular application..."
    if [ -d "apps/angular" ] && [ "$(ls -A apps/angular)" ]; then
        echo "Angular directory exists with files, installing dependencies..."
        cd apps/angular
        npm install
        cd ../..
    else
        mkdir -p apps/angular
        cd apps/angular
        if command_exists ng; then
            echo "y" | ng new . --routing --style=css --skip-git
        else
            echo "Angular CLI not found. Installing globally..."
            npm install -g @angular/cli
            echo "y" | ng new . --routing --style=css --skip-git
        fi
        npm install
        cd ../..
    fi
fi

# Create shared assets directory
echo "📁 Creating shared assets..."
mkdir -p shared/assets/{pieces,sounds,icons}

# Build backend if Go is available
if command_exists go; then
    echo "🔨 Building backend..."
    cd backend/go-chess
    make build
    cd ../..
else
    echo "⚠️ Go not found, skipping backend build. Will use Docker instead."
fi

echo "✅ Development environment setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Start the development environment:"
echo "   npm run dev"
echo ""
echo "2. Or start individual components:"
echo "   npm run start:backend  # Start Go backend API"
echo "   npm run start:vanilla  # Start Vanilla JS app"
echo "   npm run start:vue      # Start Vue.js app"
echo "   npm run start:react    # Start React.js app"
echo "   npm run start:angular  # Start Angular app"
echo ""
echo "3. Or use Docker for full stack:"
echo "   docker-compose up --build"
echo ""
echo "📚 Documentation:"
echo "   - API: http://localhost:8080"
echo "   - Vanilla JS: http://localhost:3001"
echo "   - Vue.js: http://localhost:3003"
echo "   - React.js: http://localhost:3004"
echo "   - Angular: http://localhost:3005"
