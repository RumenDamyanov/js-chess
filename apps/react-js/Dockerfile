# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY ./apps/react-js/package*.json ./

# Install dependencies
RUN npm install

# Copy source code (excluding node_modules)
COPY ./apps/react-js/src ./src
COPY ./apps/react-js/vite.config.js ./
COPY ./apps/react-js/index.html ./
COPY ./apps/react-js/nginx.conf ./nginx.conf

# Copy shared styles (this will replace any symlink)
COPY ./shared/styles ./src/styles

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration from build stage
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
