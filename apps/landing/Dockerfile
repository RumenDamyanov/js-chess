# Use nginx to serve static files
FROM node:18-alpine AS styles-build
WORKDIR /build
COPY package*.json ./
RUN npm install --omit=dev || npm install
COPY shared/styles ./shared/styles
RUN npx sass shared/styles/scss/main.scss shared/styles/scss/dist/common-scss.css --no-source-map || true

FROM nginx:alpine

# Copy static files to nginx document root
COPY ./apps/landing/ /usr/share/nginx/html/

# Copy shared styles (including compiled SCSS dist directory)
COPY ./shared/styles/ /usr/share/nginx/html/shared/styles/
COPY --from=styles-build /build/shared/styles/scss/dist /usr/share/nginx/html/shared/styles/scss/dist

# Copy shared assets (JavaScript and images)
COPY ./shared/assets/ /usr/share/nginx/html/shared/assets/

# Copy custom nginx configuration if needed
COPY ./apps/landing/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
