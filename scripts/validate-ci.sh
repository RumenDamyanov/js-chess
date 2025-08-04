#!/bin/bash
# Local CI validation script
# This script performs basic validation similar to the GitHub Actions CI

set -e

echo "🔍 Running local CI validation for JS Chess project..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "1. 🔍 Checking prerequisites..."

# Check for required tools
if command_exists node; then
    NODE_VERSION=$(node --version)
    success "Node.js found: $NODE_VERSION"
else
    error "Node.js not found - please install Node.js 18+"
    exit 1
fi

if command_exists npm; then
    NPM_VERSION=$(npm --version)
    success "npm found: $NPM_VERSION"
else
    error "npm not found"
    exit 1
fi

if command_exists docker; then
    DOCKER_VERSION=$(docker --version)
    success "Docker found: $DOCKER_VERSION"
else
    warning "Docker not found - Docker tests will be skipped"
fi

if command_exists go; then
    GO_VERSION=$(go version)
    success "Go found: $GO_VERSION"
else
    warning "Go not found - backend build tests will be skipped"
fi

echo ""
echo "2. 📁 Validating project structure..."

# Check essential directories
REQUIRED_DIRS=("apps" "shared" "docker" "wiki" ".github")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        success "$dir directory exists"
    else
        error "$dir directory missing"
        exit 1
    fi
done

# Check essential files
REQUIRED_FILES=("README.md" "Makefile" "docker-compose.yml" ".gitignore")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        success "$file exists"
    else
        error "$file missing"
        exit 1
    fi
done

echo ""
echo "3. 🔍 Checking submodule..."

if [ -d "backend/go-chess" ]; then
    success "go-chess submodule found"
    if [ -f "backend/go-chess/go.mod" ]; then
        success "go-chess has go.mod file"
    else
        warning "go-chess go.mod not found"
    fi
else
    error "go-chess submodule missing - run: git submodule update --init --recursive"
    exit 1
fi

echo ""
echo "4. 📦 Checking frontend dependencies..."

# Check Vue.js
if [ -f "apps/vue/package.json" ]; then
    success "Vue.js package.json found"
    cd apps/vue
    if [ -d "node_modules" ]; then
        success "Vue.js dependencies already installed"
    else
        echo "Installing Vue.js dependencies..."
        npm ci
        success "Vue.js dependencies installed"
    fi
    cd ../..
else
    warning "Vue.js package.json not found"
fi

# Check React
if [ -f "apps/react/package.json" ]; then
    success "React package.json found"
    cd apps/react
    if [ -d "node_modules" ]; then
        success "React dependencies already installed"
    else
        echo "Installing React dependencies..."
        npm ci
        success "React dependencies installed"
    fi
    cd ../..
else
    warning "React package.json not found"
fi

# Check Angular
if [ -f "apps/angular/package.json" ]; then
    success "Angular package.json found"
    cd apps/angular
    if [ -d "node_modules" ]; then
        success "Angular dependencies already installed"
    else
        echo "Installing Angular dependencies..."
        npm ci
        success "Angular dependencies installed"
    fi
    cd ../..
else
    warning "Angular package.json not found"
fi

echo ""
echo "5. 🧪 Testing frontend builds..."

# Test Vue.js build
if [ -f "apps/vue/package.json" ]; then
    echo "Building Vue.js..."
    cd apps/vue
    npm run build
    if [ -d "dist" ]; then
        success "Vue.js build successful"
    else
        error "Vue.js build failed - dist directory not created"
    fi
    cd ../..
fi

# Test React build
if [ -f "apps/react/package.json" ]; then
    echo "Building React..."
    cd apps/react
    npm run build
    if [ -d "dist" ]; then
        success "React build successful"
    else
        error "React build failed - dist directory not created"
    fi
    cd ../..
fi

# Test Angular build
if [ -f "apps/angular/package.json" ]; then
    echo "Building Angular..."
    cd apps/angular
    npm run build
    if [ -d "dist" ]; then
        success "Angular build successful"
    else
        error "Angular build failed - dist directory not created"
    fi
    cd ../..
fi

echo ""
echo "6. 🐳 Testing Docker configuration..."

if command_exists docker; then
    if command_exists docker-compose; then
        echo "Validating Docker Compose configuration..."
        docker-compose config > /dev/null
        success "Docker Compose configuration is valid"
    else
        warning "docker-compose not found - using docker compose"
        docker compose config > /dev/null
        success "Docker Compose configuration is valid"
    fi
else
    warning "Skipping Docker tests - Docker not available"
fi

echo ""
echo "7. 📚 Checking documentation..."

DOCS=("README.md" "CONTRIBUTING.md" "LICENSE.md" "SECURITY.md" "FUNDING.md" "CHANGELOG.md")
for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        success "$doc exists"
    else
        warning "$doc missing"
    fi
done

# Check wiki files
if [ -d "wiki" ]; then
    WIKI_FILES=$(find wiki -name "*.md" | wc -l)
    success "Wiki directory contains $WIKI_FILES documentation files"
else
    warning "Wiki directory missing"
fi

echo ""
echo "8. 🔧 Testing Makefile commands..."

if command_exists make; then
    echo "Testing Makefile help command..."
    make help > /dev/null
    success "Makefile help command works"
else
    error "Make not found - please install make"
fi

echo ""
echo "=================================================="
echo "🎉 Local CI validation completed!"
echo ""
echo "Next steps:"
echo "- Push changes to trigger GitHub Actions CI"
echo "- Check CI results at: https://github.com/RumenDamyanov/js-chess/actions"
echo "- Fix any issues reported by the CI pipeline"
echo ""
echo "To run full Docker integration test:"
echo "  make up && make health"
