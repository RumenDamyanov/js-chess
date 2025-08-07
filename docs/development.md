# Development Setup Guide

This guide will help you set up the js-chess development environment on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download from nodejs.org](https://nodejs.org/)
- **Docker & Docker Compose** - [Download from docker.com](https://docker.com/)
- **Git** - [Download from git-scm.com](https://git-scm.com/)
- **Go 1.22+** (optional) - [Download from golang.org](https://golang.org/) - only needed for backend development

## Quick Start

### 1. Clone the Repository

```bash
git clone --recursive https://github.com/RumenDamyanov/js-chess.git
cd js-chess
```

If you forgot the `--recursive` flag:

```bash
git submodule update --init --recursive
```

### 2. Automated Setup

For existing projects, use the simple setup script:

```bash
./scripts/setup-simple.sh
```

For fresh installations, use the full setup script:

```bash
./scripts/setup-dev.sh
```

The setup script will:
- Verify prerequisites
- Set up git submodules
- Create environment configuration
- Install dependencies for all frameworks
- Build the backend (if Go is available)

**Note**: If the setup script freezes during framework creation, it may be waiting for user input about existing files. Use the simple setup script instead for existing projects.

### 3. Start Development Environment

#### Option A: Docker (Recommended)

Start the entire stack with Docker:

```bash
docker-compose up --build
```

This will start:
- Backend API on port 8080
- All frontend apps on ports 3001-3006

#### Option B: Individual Applications

Start applications individually:

```bash
# Start backend API
npm run start:backend

# Start frontend applications
npm run start:vanilla    # Port 3001
npm run start:vanilla-ts # Port 3002
npm run start:jquery     # Port 3003
npm run start:vue        # Port 3004
npm run start:react      # Port 3005
npm run start:angular    # Port 3006
```

#### Option C: All Frontends at Once

```bash
npm run start:all
```

## Manual Setup

If you prefer to set up manually:

### 1. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` with your preferred settings.

### 2. Backend Setup

```bash
cd backend/go-chess
make build
make run-server
cd ../..
```

### 3. Frontend Applications

#### Vue.js Application

```bash
cd apps/vue
npm create vue@latest . -- --typescript --router --pinia
npm install
npm run dev
cd ../..
```

#### React.js Application

```bash
cd apps/react
npm create vite@latest . -- --template react-ts
npm install
npm run dev
cd ../..
```

#### Angular Application

```bash
cd apps/angular
ng new . --routing --style=css --skip-git
npm install
ng serve
cd ../..
```

## Verification

After setup, verify everything is working:

1. **Backend API**: Visit <http://localhost:8080/health>
2. **Vanilla JS**: Visit <http://localhost:3001>
3. **Vanilla TypeScript**: Visit <http://localhost:3002>
4. **jQuery**: Visit <http://localhost:3003>
5. **Vue.js**: Visit <http://localhost:3004>
6. **React.js**: Visit <http://localhost:3005>
7. **Angular**: Visit <http://localhost:3006>

## Development Workflow

### Making Changes

1. **Backend Changes**: Edit files in `backend/go-chess/`
2. **Frontend Changes**: Edit files in respective `apps/` directories
3. **Shared Code**: Edit files in `shared/` directory

### Testing

```bash
# Test backend
cd backend/go-chess
make test

# Test frontend applications
cd apps/vue && npm run test
cd apps/react && npm run test
cd apps/angular && npm run test
```

### Building for Production

```bash
# Build all applications
npm run build:all

# Build specific applications
npm run build:vue
npm run build:react
npm run build:angular

# Build with Docker
docker-compose build
```

## Troubleshooting

### Common Issues

1. **Setup Script Freezes**

   If the setup script freezes, it's likely waiting for user input about existing files:

   ```bash
   # Kill the frozen process
   pkill -f "setup-dev.sh"

   # Use the simple setup for existing projects
   ./scripts/setup-simple.sh
   ```

2. **Port Already in Use**

   ```bash
   # Find and kill process using port
   lsof -ti:8080 | xargs kill -9
   ```

2. **Docker Build Fails**
   ```bash
   # Clean Docker cache
   docker system prune -a
   docker-compose down --volumes
   ```

3. **Submodule Issues**
   ```bash
   # Reset submodules
   git submodule deinit --all
   git submodule update --init --recursive
   ```

4. **Node.js Version Issues**
   ```bash
   # Use Node Version Manager
   nvm install 18
   nvm use 18
   ```

### Getting Help

- Check the [main README](../README.md)
- Review [API Integration Guide](api-integration.md)
- Visit [go-chess documentation](https://github.com/RumenDamyanov/go-chess/wiki)
- Open an issue on GitHub

## Development Tools

### Recommended VS Code Extensions

- **Go** - Go language support
- **Vue Language Features** - Vue.js support
- **ES7+ React/Redux/React-Native snippets** - React support
- **Angular Language Service** - Angular support
- **Docker** - Docker support
- **GitLens** - Git integration
- **Prettier** - Code formatting
- **ESLint** - Code linting

### Browser Extensions

- **Vue.js devtools** - Vue debugging
- **React Developer Tools** - React debugging
- **Angular DevTools** - Angular debugging

## Performance Tips

1. **Use Docker for consistent environments**
2. **Enable hot reload in development**
3. **Use production builds for testing**
4. **Monitor resource usage**
5. **Use browser dev tools for profiling**

## Next Steps

- Read the [API Integration Guide](api-integration.md)
- Explore the [Deployment Guide](deployment.md)
- Check out individual framework READMEs in `apps/` directories
