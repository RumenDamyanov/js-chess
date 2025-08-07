# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY ./apps/vanilla-ts/package.json ./
RUN npm install

# Copy source code and build
COPY ./apps/vanilla-ts/src ./src
COPY ./apps/vanilla-ts/tsconfig.json ./
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy static files (index.html, styles, etc.)
COPY ./apps/vanilla-ts/index.html /usr/share/nginx/html/
COPY ./apps/vanilla-ts/css /usr/share/nginx/html/css

# Copy built JavaScript from build stage
COPY --from=builder /app/dist /usr/share/nginx/html/dist

# Copy shared styles (overwrite the symlink)
COPY ./shared/styles/ /usr/share/nginx/html/shared/

# Copy custom nginx configuration
COPY ./apps/vanilla-ts/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
