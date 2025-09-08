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
COPY ./apps/vanilla-ts/nginx.conf ./nginx.conf
RUN npm run build

# Production stage
FROM node:18-alpine AS styles-build
WORKDIR /build
COPY package*.json ./
RUN npm install --omit=dev || npm install
COPY shared/styles ./shared/styles
COPY apps/vanilla-ts/scss ./apps/vanilla-ts/scss
RUN npx sass shared/styles/scss/main.scss shared/styles/scss/dist/common-scss.css --no-source-map && \
	npx sass apps/vanilla-ts/scss/bundle.scss apps/vanilla-ts/scss/dist/app-bundle.css --no-source-map || true

FROM nginx:alpine

# Copy static files (index.html, styles, etc.)
COPY ./apps/vanilla-ts/index.html /usr/share/nginx/html/
COPY ./apps/vanilla-ts/css /usr/share/nginx/html/css
## Copy SCSS sources + compiled bundle (ensures scss/dist/app-bundle.css is available for index.html)
COPY ./apps/vanilla-ts/scss /usr/share/nginx/html/scss
COPY --from=styles-build /build/apps/vanilla-ts/scss/dist /usr/share/nginx/html/scss/dist
COPY --from=styles-build /build/shared/styles/scss/dist /usr/share/nginx/html/shared/styles/scss/dist

# Copy built JavaScript from build stage
COPY --from=builder /app/dist /usr/share/nginx/html/dist

# Copy shared styles & assets (helpers/messages)
COPY ./shared/styles/ /usr/share/nginx/html/shared/styles/
COPY ./shared/assets/ /usr/share/nginx/html/shared/assets/

# Copy custom nginx configuration from build stage
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
