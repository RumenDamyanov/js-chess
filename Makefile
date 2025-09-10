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

# NOTE: All frameworks are now active and included in aggregate targets.
# This includes React, Angular, and the new UI5 TypeScript implementations.
# Individual targets are available for granular control if needed.
ACTIVE_SERVICES := chess-backend chess-landing chess-jquery chess-vanilla chess-vanilla-ts chess-vue chess-react-ts chess-angular chess-wasm chess-ui5
FRONTEND_IMAGES := chess-landing chess-jquery chess-vanilla chess-vanilla-ts chess-vue chess-react-ts chess-angular chess-wasm chess-ui5

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
logs-frontend: ## Show all frontend logs
	@docker-compose logs -f chess-landing chess-jquery chess-vanilla chess-vanilla-ts chess-vue chess-react-ts chess-angular chess-wasm chess-ui5

##@ Development Commands

.PHONY: up
up: ## Start all containers in detached mode
	@echo "$(GREEN)Starting all containers...$(RESET)"
	@docker-compose up -d $(ACTIVE_SERVICES)
	@echo "$(GREEN)✅ All containers started!$(RESET)"
	@echo "$(YELLOW)Access URLs:$(RESET)"
	@echo "  Landing Page:        http://localhost:3000"
	@echo "  Vanilla JS:          http://localhost:3001"
	@echo "  Vanilla TypeScript:  http://localhost:3002"
	@echo "  jQuery:              http://localhost:3003"
	@echo "  Vue.js:              http://localhost:3004"
	@echo "  React (TS):          http://localhost:3005"
	@echo "  Angular:             http://localhost:3006"
	@echo "  WebAssembly:         http://localhost:3007"
	@echo "  UI5 TypeScript:      http://localhost:3008"
	@echo "  Backend API:         http://localhost:8080"

.PHONY: start
start: up ## Alias for 'up' command

.PHONY: dev
dev: ## Start all containers (build if needed) and stream logs
	@echo "$(GREEN)Starting development environment...$(RESET)"
	@docker-compose up --build $(ACTIVE_SERVICES)

.PHONY: dev-volumes
dev-volumes: ## Start containers with volume mounts for live SCSS editing (experimental)
	@echo "$(YELLOW)Starting with volume mounts for live SCSS development...$(RESET)"
	@echo "$(BLUE)Note: This mounts SCSS source files - changes will require manual sync$(RESET)"
	@docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d $(ACTIVE_SERVICES) 2>/dev/null || \
		(echo "$(RED)docker-compose.dev.yml not found, using standard mode$(RESET)"; $(MAKE) dev)
	@echo "$(GREEN)✅ Development containers with volumes started$(RESET)"

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
restart-frontend: ## Restart all frontend containers
	@echo "$(YELLOW)Restarting all frontend containers...$(RESET)"
	@docker-compose restart chess-landing chess-jquery chess-vanilla chess-vanilla-ts chess-vue chess-react-ts chess-angular chess-wasm chess-ui5
	@echo "$(GREEN)✅ All frontend containers restarted$(RESET)"

##@ Build Commands

.PHONY: build
build: build-shared-styles ## Build all containers
	@echo "$(GREEN)Building all containers...$(RESET)"
	@docker-compose build $(ACTIVE_SERVICES)
	@echo "$(GREEN)✅ Active containers built$(RESET)"

.PHONY: build-backend
build-backend: ## Build only the backend container
	@echo "$(GREEN)Building backend...$(RESET)"
	@docker-compose build chess-backend
	@echo "$(GREEN)✅ Backend built$(RESET)"

.PHONY: build-frontend
build-frontend: build-shared-styles ## Build all frontend containers
	@echo "$(GREEN)Building all frontend containers...$(RESET)"
	@docker-compose build $(FRONTEND_IMAGES)
	@echo "$(GREEN)✅ All frontend containers built$(RESET)"

.PHONY: build-angular
build-angular: ## Build only Angular container
	@docker-compose build chess-angular

# (Deprecated legacy react-js build target removed; use 'make rebuild-react')

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

.PHONY: build-wasm
build-wasm: ## Build only WebAssembly container
	@docker-compose build chess-wasm

.PHONY: build-ui5
build-ui5: ## Build only UI5 TypeScript container
	@docker-compose build chess-ui5

##@ Design System / Shared Assets

.PHONY: build-shared-styles
build-shared-styles: ## Compile shared SCSS → CSS bundle (shared/styles/scss/dist)
	@echo "Building shared SCSS bundle..."
	@npm run --silent build:styles || (echo "SCSS build failed" && exit 1)
	@echo "✅ Shared SCSS compiled"

.PHONY: watch-shared-styles
watch-shared-styles: ## Watch shared SCSS and rebuild on changes
	@echo "Watching SCSS (Ctrl+C to stop)..."
	@npm run watch:styles

.PHONY: rebuild
rebuild: ## Complete rebuild of all containers
	@echo "$(YELLOW)Performing complete rebuild of all containers...$(RESET)"
	@$(MAKE) build-shared-styles
	@docker-compose down --rmi local --volumes --remove-orphans
	@docker-compose build --no-cache $(ACTIVE_SERVICES)
	@docker-compose up -d $(ACTIVE_SERVICES)
	@echo "$(GREEN)✅ Complete rebuild finished$(RESET)"
	@echo "$(YELLOW)Access URLs:$(RESET)"
	@echo "  Landing Page:        http://localhost:3000"
	@echo "  Vanilla (JS):          http://localhost:3001"
	@echo "  Vanilla (TS):          http://localhost:3002"
	@echo "  jQuery:              http://localhost:3003"
	@echo "  Vue.js:              http://localhost:3004"
	@echo "  React (TS):          http://localhost:3005"
	@echo "  Angular:             http://localhost:3006"
	@echo "  WebAssembly:         http://localhost:3007"
	@echo "  UI5 (TS):      http://localhost:3008"
	@echo "  Backend API:         http://localhost:8080"

# Parameterized rebuild for individual services
# Usage: make rebuild-app APP=react-ts
.PHONY: rebuild-app
rebuild-app: ## Rebuild specific app container (usage: make rebuild-app APP=react-ts)
	@if [ -z "$(APP)" ]; then \
		echo "$(RED)Error: APP parameter is required$(RESET)"; \
		echo "$(YELLOW)Usage: make rebuild-app APP=<app-name>$(RESET)"; \
		echo "$(YELLOW)Available apps:$(RESET)"; \
		echo "  backend, landing, jquery, vanilla, vanilla-ts, vue, react-ts, angular, wasm, ui5"; \
		exit 1; \
	fi
	@$(MAKE) _rebuild-single-app-$(APP)

# Individual app rebuild targets
.PHONY: _rebuild-single-app-backend
_rebuild-single-app-backend:
	@echo "$(YELLOW)Rebuilding Backend API (chess-backend)...$(RESET)"
	@docker-compose stop chess-backend
	@docker rmi js-chess-chess-backend 2>/dev/null || true
	@docker-compose build --no-cache chess-backend
	@docker-compose up -d chess-backend
	@echo "$(GREEN)✅ Backend API rebuilt successfully$(RESET)"
	@echo "$(YELLOW)Access URL: http://localhost:8080$(RESET)"

.PHONY: _rebuild-single-app-react-ts
_rebuild-single-app-react-ts:
	@echo "$(YELLOW)Rebuilding React TS App (chess-react-ts)...$(RESET)"
	@$(MAKE) build-shared-styles
	@docker-compose stop chess-react-ts 2>/dev/null || true
	@docker rmi js-chess-chess-react-ts 2>/dev/null || true
	@docker-compose build --no-cache chess-react-ts
	@docker-compose up -d chess-react-ts
	@echo "$(GREEN)✅ React TS App rebuilt successfully$(RESET)"
	@echo "$(YELLOW)Access URL: http://localhost:3005$(RESET)"

.PHONY: _rebuild-single-app-angular
_rebuild-single-app-angular:
	@echo "$(YELLOW)Rebuilding Angular App (chess-angular)...$(RESET)"
	@$(MAKE) build-shared-styles
	@docker-compose stop chess-angular
	@docker rmi js-chess-chess-angular 2>/dev/null || true
	@docker-compose build --no-cache chess-angular
	@docker-compose up -d chess-angular
	@echo "$(GREEN)✅ Angular App rebuilt successfully$(RESET)"
	@echo "$(YELLOW)Access URL: http://localhost:3006$(RESET)"

.PHONY: _rebuild-single-app-vue
_rebuild-single-app-vue:
	@echo "$(YELLOW)Rebuilding Vue.js App (chess-vue)...$(RESET)"
	@$(MAKE) build-shared-styles
	@docker-compose stop chess-vue
	@docker rmi js-chess-chess-vue 2>/dev/null || true
	@docker-compose build --no-cache chess-vue
	@docker-compose up -d chess-vue
	@echo "$(GREEN)✅ Vue.js App rebuilt successfully$(RESET)"
	@echo "$(YELLOW)Access URL: http://localhost:3004$(RESET)"

.PHONY: _rebuild-single-app-vanilla
_rebuild-single-app-vanilla:
	@echo "$(YELLOW)Rebuilding Vanilla JavaScript (chess-vanilla)...$(RESET)"
	@$(MAKE) build-shared-styles
	@docker-compose stop chess-vanilla
	@docker rmi js-chess-chess-vanilla 2>/dev/null || true
	@docker-compose build --no-cache chess-vanilla
	@docker-compose up -d chess-vanilla
	@echo "$(GREEN)✅ Vanilla JavaScript rebuilt successfully$(RESET)"
	@echo "$(YELLOW)Access URL: http://localhost:3001$(RESET)"

.PHONY: _rebuild-single-app-vanilla-ts
_rebuild-single-app-vanilla-ts:
	@echo "$(YELLOW)Rebuilding Vanilla TypeScript (chess-vanilla-ts)...$(RESET)"
	@$(MAKE) build-shared-styles
	@docker-compose stop chess-vanilla-ts
	@docker rmi js-chess-chess-vanilla-ts 2>/dev/null || true
	@docker-compose build --no-cache chess-vanilla-ts
	@docker-compose up -d chess-vanilla-ts
	@echo "$(GREEN)✅ Vanilla TypeScript rebuilt successfully$(RESET)"
	@echo "$(YELLOW)Access URL: http://localhost:3002$(RESET)"

.PHONY: _rebuild-single-app-jquery
_rebuild-single-app-jquery:
	@echo "$(YELLOW)Rebuilding jQuery App (chess-jquery)...$(RESET)"
	@$(MAKE) build-shared-styles
	@docker-compose stop chess-jquery
	@docker rmi js-chess-chess-jquery 2>/dev/null || true
	@docker-compose build --no-cache chess-jquery
	@docker-compose up -d chess-jquery
	@echo "$(GREEN)✅ jQuery App rebuilt successfully$(RESET)"
	@echo "$(YELLOW)Access URL: http://localhost:3003$(RESET)"

.PHONY: _rebuild-single-app-wasm
_rebuild-single-app-wasm:
	@echo "$(YELLOW)Rebuilding WebAssembly App (chess-wasm)...$(RESET)"
	@$(MAKE) build-shared-styles
	@docker-compose stop chess-wasm
	@docker rmi js-chess-chess-wasm 2>/dev/null || true
	@docker-compose build --no-cache chess-wasm
	@docker-compose up -d chess-wasm
	@echo "$(GREEN)✅ WebAssembly App rebuilt successfully$(RESET)"
	@echo "$(YELLOW)Access URL: http://localhost:3007$(RESET)"

.PHONY: _rebuild-single-app-ui5
_rebuild-single-app-ui5:
	@echo "$(YELLOW)Rebuilding UI5 TypeScript App (chess-ui5)...$(RESET)"
	@$(MAKE) build-shared-styles
	@docker-compose stop chess-ui5
	@docker rmi js-chess-chess-ui5 2>/dev/null || true
	@docker-compose build --no-cache chess-ui5
	@docker-compose up -d chess-ui5
	@echo "$(GREEN)✅ UI5 TypeScript App rebuilt successfully$(RESET)"
	@echo "$(YELLOW)Access URL: http://localhost:3008$(RESET)"

.PHONY: _rebuild-single-app-landing
_rebuild-single-app-landing:
	@echo "$(YELLOW)Rebuilding Landing Page (chess-landing)...$(RESET)"
	@$(MAKE) build-shared-styles
	@docker-compose stop chess-landing
	@docker rmi js-chess-chess-landing 2>/dev/null || true
	@docker-compose build --no-cache chess-landing
	@docker-compose up -d chess-landing
	@echo "$(GREEN)✅ Landing Page rebuilt successfully$(RESET)"
	@echo "$(YELLOW)Access URL: http://localhost:3000$(RESET)"

.PHONY: restart
restart: ## Soft rebuild (all containers, cache enabled)
	@echo "$(YELLOW)Performing soft restart of all containers...$(RESET)"
	@$(MAKE) build-shared-styles
	@docker-compose down
	@docker-compose build $(ACTIVE_SERVICES)
	@docker-compose up -d $(ACTIVE_SERVICES)
	@echo "$(GREEN)✅ All containers restarted$(RESET)"

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

# Quick rebuild aliases for common apps
.PHONY: rebuild-react
rebuild-react: ## Quick rebuild of React TS app
	@$(MAKE) rebuild-app APP=react-ts

.PHONY: rebuild-angular
rebuild-angular: ## Quick rebuild of Angular app
	@$(MAKE) rebuild-app APP=angular

.PHONY: rebuild-vue
rebuild-vue: ## Quick rebuild of Vue app
	@$(MAKE) rebuild-app APP=vue

.PHONY: rebuild-backend
rebuild-backend: ## Quick rebuild of backend
	@$(MAKE) rebuild-app APP=backend

.PHONY: rebuild-vanilla
rebuild-vanilla: ## Quick rebuild of Vanilla JS app
	@$(MAKE) rebuild-app APP=vanilla

.PHONY: rebuild-vanilla-ts
rebuild-vanilla-ts: ## Quick rebuild of Vanilla TypeScript app
	@$(MAKE) rebuild-app APP=vanilla-ts

.PHONY: rebuild-jquery
rebuild-jquery: ## Quick rebuild of jQuery app
	@$(MAKE) rebuild-app APP=jquery

.PHONY: rebuild-wasm
rebuild-wasm: ## Quick rebuild of WebAssembly app
	@$(MAKE) rebuild-app APP=wasm

.PHONY: rebuild-ui5
rebuild-ui5: ## Quick rebuild of UI5 TypeScript app
	@$(MAKE) rebuild-app APP=ui5

.PHONY: rebuild-landing
rebuild-landing: ## Quick rebuild of Landing page
	@$(MAKE) rebuild-app APP=landing

.PHONY: start-backend
start-backend: ## Start only the backend container
	@docker-compose up -d chess-backend
	@echo "$(GREEN)✅ Backend started on http://localhost:8080$(RESET)"

.PHONY: start-angular
start-angular: ## Start only Angular container
	@docker-compose up -d chess-angular
	@echo "$(GREEN)✅ Angular started on http://localhost:3006$(RESET)"

.PHONY: start-react
start-react: ## Start only React TS container
	@docker-compose up -d chess-react-ts
	@echo "$(GREEN)✅ React TS started on http://localhost:3005$(RESET)"

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

.PHONY: start-wasm
start-wasm: ## Start only WebAssembly container
	@docker-compose up -d chess-wasm
	@echo "$(GREEN)✅ WebAssembly started on http://localhost:3007$(RESET)"

.PHONY: start-ui5
start-ui5: ## Start only UI5 TypeScript container
	@docker-compose up -d chess-ui5
	@echo "$(GREEN)✅ UI5 TypeScript started on http://localhost:3008$(RESET)"

##@ Development Tools

.PHONY: dev-fe
dev-fe: build-shared-styles sync-styles ## Development: rebuild SCSS only and sync to running containers
	@echo "$(GREEN)✅ Frontend styles rebuilt and synced to running containers$(RESET)"
	@echo "$(YELLOW)Active containers should now reflect SCSS changes$(RESET)"

.PHONY: sync-styles
sync-styles: ## Sync compiled CSS to running frontend containers (no rebuild)
	@echo "$(BLUE)Syncing CSS changes to running containers...$(RESET)"
	@for service in chess-vanilla chess-vanilla-ts chess-jquery chess-vue chess-landing; do \
		if docker-compose ps $$service | grep -q "Up"; then \
			echo "$(YELLOW)Syncing to $$service...$(RESET)"; \
			docker cp shared/styles/scss/dist/common-scss.css $$service:/usr/share/nginx/html/shared/styles/scss/dist/ 2>/dev/null || echo "  Common CSS sync skipped (container may not be ready)"; \
			case $$service in \
				chess-vanilla) \
					docker cp apps/vanilla-js/scss/dist/app-bundle.css $$service:/usr/share/nginx/html/scss/dist/ 2>/dev/null || echo "  App CSS sync skipped"; \
					;; \
				chess-vanilla-ts) \
					docker cp apps/vanilla-ts/scss/dist/app-bundle.css $$service:/usr/share/nginx/html/scss/dist/ 2>/dev/null || echo "  App CSS sync skipped"; \
					;; \
				chess-jquery) \
					docker cp apps/jquery/scss/dist/app-bundle.css $$service:/usr/share/nginx/html/scss/dist/ 2>/dev/null || echo "  App CSS sync skipped"; \
					;; \
				chess-vue) \
					docker cp apps/vue-js/src/styles/app-bundle.css $$service:/usr/share/nginx/html/assets/ 2>/dev/null || echo "  App CSS sync skipped"; \
					;; \
			esac; \
		else \
			echo "$(YELLOW)Skipping $$service (not running)$(RESET)"; \
		fi; \
	done
	@echo "$(GREEN)✅ CSS sync completed$(RESET)"

.PHONY: dev-watch
dev-watch: ## Watch SCSS changes and auto-sync to running containers
	@echo "$(BLUE)Watching SCSS files for changes (Ctrl+C to stop)...$(RESET)"
	@echo "$(YELLOW)Changes will be automatically synced to running containers$(RESET)"
	@while true; do \
		inotifywait -r -e modify,create,delete shared/styles/scss apps/*/scss 2>/dev/null || sleep 2; \
		echo "$(BLUE)SCSS change detected, rebuilding...$(RESET)"; \
		$(MAKE) dev-fe; \
	done

.PHONY: shell-backend
shell-backend: ## Open shell in backend container
	@docker-compose exec chess-backend sh

.PHONY: shell-angular
shell-angular: ## Open shell in Angular container
	@docker-compose exec chess-angular sh

.PHONY: shell-react
shell-react: ## Open shell in React TS container
	@docker-compose exec chess-react-ts sh

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
test-frontend: ## Test all frontend endpoints
	@echo "$(BLUE)Testing all frontend endpoints...$(RESET)"
	@for port in 3000 3001 3002 3003 3004 3005 3006 3007 3008; do \
		echo "$(YELLOW)Testing http://localhost:$$port$(RESET)"; \
		curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:$$port || echo "Port $$port not responding"; \
	done

.PHONY: validate-ci
validate-ci: ## Run local CI validation checks
	@echo "$(BLUE)Running local CI validation...$(RESET)"
	@./scripts/validate-ci.sh

.PHONY: ci-test
ci-test: validate-ci test-api test-frontend ## Run complete CI test suite locally
	@echo "$(GREEN)CI test suite completed (frontend + API checks).$(RESET)"

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
health: ## Check health of all services
	@echo "$(BLUE)Service Health Check:$(RESET)"
	@echo "$(YELLOW)Backend API:$(RESET)"
	@curl -s http://localhost:8080/health && echo " ✅" || echo " ❌"
	@echo "$(YELLOW)Frontend Services:$(RESET)"
	@for port in 3000 3001 3002 3003 3004 3005 3006 3007 3008; do \
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
open: ## Open all applications in browser (macOS)
	@echo "$(GREEN)Opening all applications in browser...$(RESET)"
	@open http://localhost:3000  # Landing page
	@open http://localhost:3001  # Vanilla JS
	@open http://localhost:3002  # Vanilla TypeScript
	@open http://localhost:3003  # jQuery
	@open http://localhost:3004  # Vue.js
	@open http://localhost:3005  # React TS
	@open http://localhost:3006  # Angular
	@open http://localhost:3007  # WebAssembly
	@open http://localhost:3008  # UI5 TypeScript

.PHONY: urls
urls: ## Display all application URLs
	@echo "$(BLUE)Application URLs:$(RESET)"
	@echo "  $(YELLOW)Landing Page:$(RESET)        http://localhost:3000"
	@echo "  $(YELLOW)Vanilla JS:$(RESET)          http://localhost:3001"
	@echo "  $(YELLOW)Vanilla TypeScript:$(RESET)  http://localhost:3002"
	@echo "  $(YELLOW)jQuery:$(RESET)              http://localhost:3003"
	@echo "  $(YELLOW)Vue.js:$(RESET)              http://localhost:3004"
	@echo "  $(YELLOW)React (TS):$(RESET)          http://localhost:3005"
	@echo "  $(YELLOW)Angular:$(RESET)             http://localhost:3006"
	@echo "  $(YELLOW)WebAssembly:$(RESET)         http://localhost:3007"
	@echo "  $(YELLOW)UI5 TypeScript:$(RESET)      http://localhost:3008"
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
	@echo "  make dev            # Start with logs"
	@echo "  make dev-volumes     # Start with live SCSS volume mounts"
	@echo "  make dev-fe          # Rebuild SCSS only + sync to running containers"
	@echo "  make dev-watch       # Watch SCSS changes and auto-sync"
	@echo "  make sync-styles     # Sync compiled CSS to running containers"
	@echo "  make restart         # Restart all containers"
	@echo "  make build           # Rebuild containers"
	@echo "  make rebuild         # Complete rebuild of all containers"
	@echo "  make rebuild-app APP=react-ts  # Rebuild specific app"
	@echo "  make rebuild-react   # Quick rebuild React TS app"
	@echo "  make health          # Check service health"
	@echo ""
	@echo "$(GREEN)🧹 Cleanup:$(RESET)"
	@echo "  make clean      # Remove containers and images"
	@echo "  make prune      # Clean unused Docker resources"
	@echo "  make clean-all  # Nuclear option - remove everything"
	@echo ""
	@echo "$(GREEN)🎯 Individual Services:$(RESET)"
	@echo "  make start-backend   # Backend only"
	@echo "  make start-angular   # Angular only"
	@echo "  make rebuild-react   # Rebuild React TS only"
	@echo ""
	@echo "$(GREEN)🔍 Debugging:$(RESET)"
	@echo "  make shell-backend   # Shell into backend"
	@echo "  make test-api        # Test API endpoints"
	@echo "  make stats           # Resource usage"
