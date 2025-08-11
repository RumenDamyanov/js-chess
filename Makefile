# JS Chess - Frontend Showcase Makefile
# A collection of convenient commands for managing the Docker-based development environment

# Default target
.DEFAULT_GOAL := help

# Colors for output
GREEN  := \033[0;32m
YELLOW := \033[0;33m
RED    := \033[0;31m
BLUE   := \033[0;34m
RESET  := \033[0m

# Project configuration
PROJECT_NAME := js-chess
COMPOSE_FILE := docker-compose.yml
BACKEND_IMAGE := chess-backend

# NOTE: Angular / React / Vue are currently marked WIP and intentionally excluded
# from default aggregate build / start / health targets to speed up development.
# To re-enable, add the services back to ACTIVE_SERVICES (and related port lists)
# or invoke their individual targets (e.g., make start-angular, make build-react).
ACTIVE_SERVICES := chess-backend chess-jquery chess-vanilla chess-vanilla-ts chess-landing
WIP_SERVICES := chess-angular chess-react chess-vue # (disabled from aggregate commands)
FRONTEND_IMAGES := chess-jquery chess-vanilla chess-vanilla-ts chess-landing

##@ General Commands

.PHONY: help
help: ## Display this help message
	@echo "$(BLUE)JS Chess - Frontend Showcase$(RESET)"
	@echo "$(YELLOW)Available commands:$(RESET)"
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

.PHONY: status
status: ## Show status of all containers
	@echo "$(BLUE)Container Status:$(RESET)"
	@docker-compose ps

.PHONY: logs
logs: ## Show logs from all containers
	@docker-compose logs --tail=50 -f

.PHONY: logs-backend
logs-backend: ## Show backend logs only
	@docker-compose logs -f chess-backend

.PHONY: logs-frontend
logs-frontend: ## Show active frontend logs (WIP: angular/react/vue excluded)
	@docker-compose logs -f chess-jquery chess-vanilla chess-vanilla-ts chess-landing

##@ Development Commands

.PHONY: up
up: ## Start active (non-WIP) containers in detached mode
	@echo "$(GREEN)Starting active containers (excluding angular/react/vue)...$(RESET)"
	@docker-compose up -d $(ACTIVE_SERVICES)
	@echo "$(GREEN)✅ Active containers started!$(RESET)"
	@echo "$(YELLOW)Access URLs:$(RESET)"
	@echo "  Landing Page:        http://localhost:3000"
	@echo "  Vanilla JS:          http://localhost:3001"
	@echo "  Vanilla TypeScript:  http://localhost:3002"
	@echo "  jQuery:              http://localhost:3003"
	@echo "  (WIP) Vue.js:        http://localhost:3004  # disabled"
	@echo "  (WIP) React.js:      http://localhost:3005  # disabled"
	@echo "  (WIP) Angular:       http://localhost:3006  # disabled"
	@echo "  Backend API:         http://localhost:8080"

.PHONY: start
start: up ## Alias for 'up' command

.PHONY: dev
dev: ## Start active containers (build if needed) and stream logs (WIP excluded)
	@echo "$(GREEN)Starting development environment (excluding angular/react/vue)...$(RESET)"
	@docker-compose up --build $(ACTIVE_SERVICES)

.PHONY: down
down: ## Stop and remove all containers
	@echo "$(YELLOW)Stopping all containers...$(RESET)"
	@docker-compose down
	@echo "$(GREEN)✅ All containers stopped$(RESET)"

.PHONY: stop
stop: down ## Alias for 'down' command

.PHONY: restart-backend
restart-backend: ## Restart only the backend container
	@echo "$(YELLOW)Restarting backend...$(RESET)"
	@docker-compose restart chess-backend
	@echo "$(GREEN)✅ Backend restarted$(RESET)"

.PHONY: restart-frontend
restart-frontend: ## Restart active frontend containers (WIP excluded)
	@echo "$(YELLOW)Restarting active frontend containers...$(RESET)"
	@docker-compose restart chess-jquery chess-vanilla chess-vanilla-ts chess-landing
	@echo "$(GREEN)✅ Active frontend containers restarted$(RESET)"

##@ Build Commands

.PHONY: build
build: ## Build active containers only (backend + non-WIP frontends)
	@echo "$(GREEN)Building active containers (excluding angular/react/vue)...$(RESET)"
	@docker-compose build $(ACTIVE_SERVICES)
	@echo "$(GREEN)✅ Active containers built$(RESET)"

.PHONY: build-backend
build-backend: ## Build only the backend container
	@echo "$(GREEN)Building backend...$(RESET)"
	@docker-compose build chess-backend
	@echo "$(GREEN)✅ Backend built$(RESET)"

.PHONY: build-frontend
build-frontend: ## Build active frontend containers (WIP excluded)
	@echo "$(GREEN)Building active frontend containers (excluding angular/react/vue)...$(RESET)"
	@docker-compose build $(FRONTEND_IMAGES)
	@echo "$(GREEN)✅ Active frontend containers built$(RESET)"

.PHONY: build-angular
build-angular: ## Build only Angular container
	@docker-compose build chess-angular

.PHONY: build-react
build-react: ## Build only React container
	@docker-compose build chess-react

.PHONY: build-vue
build-vue: ## Build only Vue container
	@docker-compose build chess-vue

.PHONY: build-jquery
build-jquery: ## Build only jQuery container
	@docker-compose build chess-jquery

.PHONY: build-vanilla
build-vanilla: ## Build only Vanilla JS container
	@docker-compose build chess-vanilla

.PHONY: build-vanilla-ts
build-vanilla-ts: ## Build only Vanilla TypeScript container
	@docker-compose build chess-vanilla-ts

.PHONY: build-landing
build-landing: ## Build only Landing page container
	@docker-compose build chess-landing

##@ Design System / Shared Assets

.PHONY: build-shared-styles
build-shared-styles: ## (No-op placeholder) Process shared CSS design tokens if a build step is added later
	@echo "Shared styles currently require no build. Add preprocessing (e.g., PostCSS/Sass) here in future."

.PHONY: rebuild
rebuild: ## Complete rebuild of active containers only (WIP excluded)
	@echo "$(YELLOW)Performing complete rebuild (excluding angular/react/vue)...$(RESET)"
	@docker-compose down --rmi local --volumes --remove-orphans
	@docker-compose build --no-cache $(ACTIVE_SERVICES)
	@docker-compose up -d $(ACTIVE_SERVICES)
	@echo "$(GREEN)✅ Complete rebuild (active set) finished$(RESET)"
	@echo "$(YELLOW)Access URLs:$(RESET)"
	@echo "  Landing Page:        http://localhost:3000"
	@echo "  Vanilla JS:          http://localhost:3001"
	@echo "  Vanilla TS:          http://localhost:3002"
	@echo "  jQuery:              http://localhost:3003"
	@echo "  (WIP) Vue.js:        http://localhost:3004  # disabled"
	@echo "  (WIP) React.js:      http://localhost:3005  # disabled"
	@echo "  (WIP) Angular:       http://localhost:3006  # disabled"
	@echo "  Backend API:         http://localhost:8080"

.PHONY: restart
restart: ## Soft rebuild (active containers only, cache enabled)
	@echo "$(YELLOW)Performing soft restart of active containers (excluding angular/react/vue)...$(RESET)"
	@docker-compose down
	@docker-compose build $(ACTIVE_SERVICES)
	@docker-compose up -d $(ACTIVE_SERVICES)
	@echo "$(GREEN)✅ Active containers restarted$(RESET)"

##@ Cleanup Commands

.PHONY: clean
clean: ## Stop containers and remove images
	@echo "$(YELLOW)Cleaning up containers and images...$(RESET)"
	@docker-compose down --rmi local --volumes --remove-orphans
	@echo "$(GREEN)✅ Cleanup completed$(RESET)"

.PHONY: clean-all
clean-all: ## Remove all containers, images, volumes, and networks
	@echo "$(RED)WARNING: This will remove ALL Docker containers, images, volumes, and networks!$(RESET)"
	@echo "$(YELLOW)Press Ctrl+C to cancel, or wait 5 seconds to continue...$(RESET)"
	@sleep 5
	@docker system prune -af --volumes
	@echo "$(GREEN)✅ Complete cleanup finished$(RESET)"

.PHONY: prune
prune: ## Remove unused Docker resources
	@echo "$(YELLOW)Pruning unused Docker resources...$(RESET)"
	@docker system prune -f
	@docker volume prune -f
	@echo "$(GREEN)✅ Pruning completed$(RESET)"

.PHONY: clean-volumes
clean-volumes: ## Remove all Docker volumes
	@echo "$(YELLOW)Removing Docker volumes...$(RESET)"
	@docker-compose down -v
	@docker volume prune -f
	@echo "$(GREEN)✅ Volumes removed$(RESET)"

##@ Individual Container Management

.PHONY: start-backend
start-backend: ## Start only the backend container
	@docker-compose up -d chess-backend
	@echo "$(GREEN)✅ Backend started on http://localhost:8080$(RESET)"

.PHONY: start-angular
start-angular: ## Start only Angular container
	@docker-compose up -d chess-angular
	@echo "$(GREEN)✅ Angular started on http://localhost:3006$(RESET)"

.PHONY: start-react
start-react: ## Start only React container
	@docker-compose up -d chess-react
	@echo "$(GREEN)✅ React started on http://localhost:3005$(RESET)"

.PHONY: start-vue
start-vue: ## Start only Vue container
	@docker-compose up -d chess-vue
	@echo "$(GREEN)✅ Vue.js started on http://localhost:3004$(RESET)"

.PHONY: start-jquery
start-jquery: ## Start only jQuery container
	@docker-compose up -d chess-jquery
	@echo "$(GREEN)✅ jQuery started on http://localhost:3003$(RESET)"

.PHONY: start-vanilla-ts
start-vanilla-ts: ## Start only Vanilla TypeScript container
	@docker-compose up -d chess-vanilla-ts
	@echo "$(GREEN)✅ Vanilla TypeScript started on http://localhost:3002$(RESET)"

.PHONY: start-vanilla
start-vanilla: ## Start only Vanilla JS container
	@docker-compose up -d chess-vanilla
	@echo "$(GREEN)✅ Vanilla JS started on http://localhost:3001$(RESET)"

.PHONY: start-landing
start-landing: ## Start only Landing page container
	@docker-compose up -d chess-landing
	@echo "$(GREEN)✅ Landing page started on http://localhost:3000$(RESET)"

##@ Development Tools

.PHONY: shell-backend
shell-backend: ## Open shell in backend container
	@docker-compose exec chess-backend sh

.PHONY: shell-angular
shell-angular: ## Open shell in Angular container
	@docker-compose exec chess-angular sh

.PHONY: shell-react
shell-react: ## Open shell in React container
	@docker-compose exec chess-react sh

.PHONY: shell-vue
shell-vue: ## Open shell in Vue container
	@docker-compose exec chess-vue sh

.PHONY: test-api
test-api: ## Test backend API endpoints
	@echo "$(BLUE)Testing backend API...$(RESET)"
	@echo "$(YELLOW)Creating new game...$(RESET)"
	@curl -s -X POST http://localhost:8080/api/games -H "Content-Type: application/json" | jq '.' || echo "jq not installed, showing raw output"
	@echo ""
	@echo "$(YELLOW)Getting API health...$(RESET)"
	@curl -s http://localhost:8080/health || echo "Backend not responding"

.PHONY: test-frontend
test-frontend: ## Test active frontend endpoints (WIP excluded)
	@echo "$(BLUE)Testing active frontend endpoints...$(RESET)"
	@for port in 3000 3001 3002 3003; do \
		echo "$(YELLOW)Testing http://localhost:$$port$(RESET)"; \

.PHONY: validate-ci
validate-ci: ## Run local CI validation checks
	@echo "$(BLUE)Running local CI validation...$(RESET)"
	@./scripts/validate-ci.sh

.PHONY: ci-test
ci-test: validate-ci test-api test-frontend ## Run complete CI test suite locally
		curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:$$port || echo "Port $$port not responding"; \
	done

##@ Database and Backend Management

.PHONY: backup-games
backup-games: ## Backup game data (if persistent storage exists)
	@echo "$(BLUE)Creating backup of game data...$(RESET)"
	@mkdir -p backups
	@docker-compose exec chess-backend cp -r /app/data backups/games-$(shell date +%Y%m%d-%H%M%S) 2>/dev/null || echo "No persistent data found"

.PHONY: reset-games
reset-games: ## Reset all game data
	@echo "$(YELLOW)Resetting game data...$(RESET)"
	@docker-compose restart chess-backend
	@echo "$(GREEN)✅ Game data reset$(RESET)"

##@ Monitoring and Debugging

.PHONY: watch
watch: ## Watch container status in real-time
	@watch -n 2 'docker-compose ps'

.PHONY: stats
stats: ## Show container resource usage
	@docker stats $(shell docker-compose ps -q)

.PHONY: inspect
inspect: ## Show detailed container information
	@echo "$(BLUE)Container Information:$(RESET)"
	@docker-compose ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}"

.PHONY: health
health: ## Check health of active services (WIP excluded)
	@echo "$(BLUE)Service Health Check (active only):$(RESET)"
	@echo "$(YELLOW)Backend API:$(RESET)"
	@curl -s http://localhost:8080/health && echo " ✅" || echo " ❌"
	@echo "$(YELLOW)Frontend Services:$(RESET)"
	@for port in 3000 3001 3002 3003; do \
		printf "  Port $$port: "; \
		curl -s -o /dev/null -w "%{http_code}" http://localhost:$$port && echo " ✅" || echo " ❌"; \
	done

##@ Installation and Setup

.PHONY: install
install: ## Initial setup - build and start active services only
	@echo "$(GREEN)Setting up JS Chess development environment (active services only)...$(RESET)"
	@echo "$(YELLOW)Step 1: Building active containers...$(RESET)"
	@make build
	@echo "$(YELLOW)Step 2: Starting active services...$(RESET)"
	@make up
	@echo "$(YELLOW)Step 3: Running health check...$(RESET)"
	@sleep 10
	@make health
	@echo "$(GREEN)✅ Installation complete (active set)!$(RESET)"
	@echo "$(BLUE)Visit http://localhost:3000 to get started$(RESET)"

.PHONY: update
update: ## Update and rebuild everything
	@echo "$(YELLOW)Updating project...$(RESET)"
	@git pull
	@git submodule update --recursive --remote
	@make rebuild

.PHONY: setup
setup: install ## Alias for install command

##@ Quick Access URLs

.PHONY: open
open: ## Open active applications in browser (macOS, WIP excluded)
	@echo "$(GREEN)Opening active applications in browser...$(RESET)"
	@open http://localhost:3000  # Landing page
	@open http://localhost:3001  # Vanilla JS
	@open http://localhost:3002  # Vanilla TypeScript
	@open http://localhost:3003  # jQuery
	@echo "(Skipping WIP angular/react/vue)"

.PHONY: urls
urls: ## Display active application URLs (WIP excluded)
	@echo "$(BLUE)Application URLs (active set):$(RESET)"
	@echo "  $(YELLOW)Landing Page:$(RESET)        http://localhost:3000"
	@echo "  $(YELLOW)Vanilla JS:$(RESET)          http://localhost:3001"
	@echo "  $(YELLOW)Vanilla TypeScript:$(RESET)  http://localhost:3002"
	@echo "  $(YELLOW)jQuery:$(RESET)              http://localhost:3003"
	@echo "  $(YELLOW)(WIP) Vue.js:$(RESET)        http://localhost:3004 (disabled)"
	@echo "  $(YELLOW)(WIP) React.js:$(RESET)      http://localhost:3005 (disabled)"
	@echo "  $(YELLOW)(WIP) Angular:$(RESET)       http://localhost:3006 (disabled)"
	@echo "  $(YELLOW)Backend API:$(RESET)         http://localhost:8080"
	@echo "  $(YELLOW)API Docs:$(RESET)            http://localhost:8080/swagger"

# Help formatting
.PHONY: help-detailed
help-detailed: ## Show detailed help with examples
	@echo "$(BLUE)JS Chess - Frontend Showcase$(RESET)"
	@echo "$(YELLOW)Detailed Command Reference:$(RESET)"
	@echo ""
	@echo "$(GREEN)🚀 Quick Start:$(RESET)"
	@echo "  make install    # First-time setup"
	@echo "  make up         # Start everything"
	@echo "  make logs       # View logs"
	@echo "  make down       # Stop everything"
	@echo ""
	@echo "$(GREEN)🔧 Development:$(RESET)"
	@echo "  make dev        # Start with logs"
	@echo "  make restart    # Restart all containers"
	@echo "  make build      # Rebuild containers"
	@echo "  make health     # Check service health"
	@echo ""
	@echo "$(GREEN)🧹 Cleanup:$(RESET)"
	@echo "  make clean      # Remove containers and images"
	@echo "  make prune      # Clean unused Docker resources"
	@echo "  make clean-all  # Nuclear option - remove everything"
	@echo ""
	@echo "$(GREEN)🎯 Individual Services:$(RESET)"
	@echo "  make start-backend   # Backend only"
	@echo "  make start-angular   # Angular only"
	@echo "  make build-react     # Build React only"
	@echo ""
	@echo "$(GREEN)🔍 Debugging:$(RESET)"
	@echo "  make shell-backend   # Shell into backend"
	@echo "  make test-api        # Test API endpoints"
	@echo "  make stats           # Resource usage"
