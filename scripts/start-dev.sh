#!/bin/bash
# Start Development Environment Script

echo "🚀 Starting JS Chess development environment..."

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $port is already in use"
        return 1
    fi
    return 0
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    echo "⏳ Waiting for $service_name to be ready..."

    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo "✅ $service_name is ready!"
            return 0
        fi

        echo "   Attempt $attempt/$max_attempts - waiting for $service_name..."
        sleep 2
        attempt=$((attempt + 1))
    done

    echo "❌ $service_name failed to start within timeout"
    return 1
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ docker-compose is not installed. Please install Docker Compose."
    exit 1
fi

# Check required ports
echo "🔍 Checking required ports..."
ports=(8080 3000 3001 3002 3003 3004 3005)
port_conflicts=false

for port in "${ports[@]}"; do
    if ! check_port $port; then
        port_conflicts=true
    fi
done

if [ "$port_conflicts" = true ]; then
    echo ""
    echo "❌ Some required ports are in use. Please free them or stop the conflicting services."
    echo "   Required ports: ${ports[*]}"
    echo ""
    echo "   To kill processes using these ports:"
    for port in "${ports[@]}"; do
        echo "   lsof -ti:$port | xargs kill -9"
    done
    exit 1
fi

echo "✅ All required ports are available"

# Start the development environment
echo ""
echo "🐳 Starting Docker containers..."
docker-compose down --remove-orphans
docker-compose up --build -d

# Wait for backend API to be ready
if wait_for_service "http://localhost:8080/health" "Backend API"; then
    echo ""
    echo "🎯 Development environment is ready!"
    echo ""
    echo "📱 Frontend Applications:"
    echo "   Landing Page: http://localhost:3000"
    echo "   Vanilla JS:   http://localhost:3001"
    echo "   jQuery:       http://localhost:3002"
    echo "   Vue.js:       http://localhost:3003"
    echo "   React.js:     http://localhost:3004"
    echo "   Angular:      http://localhost:3005"
    echo ""
    echo "🔌 Backend API:"
    echo "   API Health:   http://localhost:8080/health"
    echo "   API Docs:     http://localhost:8080/api/docs"
    echo ""
    echo "📊 Monitoring:"
    echo "   Docker logs:  docker-compose logs -f"
    echo "   Stop all:     docker-compose down"
    echo ""
    echo "🎮 Happy coding!"
else
    echo ""
    echo "❌ Failed to start development environment"
    echo "📋 Check the logs:"
    echo "   docker-compose logs"
    exit 1
fi
