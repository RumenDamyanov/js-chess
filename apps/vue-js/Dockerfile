# Build stage
FROM node:18-alpine AS build-stage

WORKDIR /app

# Copy package files
COPY ./apps/vue-js/package*.json ./

# Install dependencies
RUN npm install

# Copy source code (excluding node_modules)
COPY ./apps/vue-js/src ./src
COPY ./apps/vue-js/public ./public
COPY ./apps/vue-js/vite.config.js ./
COPY ./apps/vue-js/index.html ./
COPY ./apps/vue-js/nginx.conf ./nginx.conf

## Copy entire app shared directory (CSS + theme script)
COPY ./apps/vue-js/shared ./shared

# Copy shared JS/assets required by imports (helpers.js, pgn-core.js, etc.)
COPY ./shared/assets ./shared/assets

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine AS production-stage

# Copy built app from build stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy shared assets (debug.js, helpers, etc.) for runtime script injection
COPY --from=build-stage /app/shared/assets /usr/share/nginx/html/shared/assets

# Copy nginx configuration from build stage
COPY --from=build-stage /app/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
