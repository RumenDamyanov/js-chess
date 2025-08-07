# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY ./apps/angular/package*.json ./

# Install dependencies
RUN npm install

# Copy source code (excluding node_modules)
COPY ./apps/angular/src ./src
COPY ./apps/angular/angular.json ./
COPY ./apps/angular/tsconfig*.json ./
COPY ./apps/angular/nginx.conf ./nginx.conf

# Copy shared styles (this will replace any symlink)
COPY ./shared/styles ./src/styles

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built files from build stage to nginx static directory
COPY --from=build /app/dist/chess-angular/ /usr/share/nginx/html/

# Copy custom nginx configuration from build stage
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
