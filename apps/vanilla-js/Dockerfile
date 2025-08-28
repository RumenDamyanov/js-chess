# Use nginx to serve static files
## Stage 1: build shared SCSS (re-using root package.json context)
FROM node:18-alpine AS styles-build
WORKDIR /build
COPY package*.json ./
RUN npm install --omit=dev || npm install
COPY shared/styles ./shared/styles
COPY apps/vanilla-js/scss ./apps/vanilla-js/scss
RUN npx sass shared/styles/scss/main.scss shared/styles/scss/dist/common-scss.css --no-source-map && \
	npx sass apps/vanilla-js/scss/bundle.scss apps/vanilla-js/scss/dist/app-bundle.css --no-source-map || true

FROM nginx:alpine

# Copy static files to nginx document root
COPY ./apps/vanilla-js/ /usr/share/nginx/html/
## Include SCSS sources & compiled dist (app-bundle.css reference)
COPY ./apps/vanilla-js/scss /usr/share/nginx/html/scss
# Overwrite compiled CSS with freshly built artifacts (if build succeeded)
COPY --from=styles-build /build/apps/vanilla-js/scss/dist /usr/share/nginx/html/scss/dist
COPY --from=styles-build /build/shared/styles/scss/dist /usr/share/nginx/html/shared/styles/scss/dist

# Copy shared styles & assets (helpers, messages, etc.)
COPY ./shared/styles/ /usr/share/nginx/html/shared/styles/
COPY ./shared/assets/ /usr/share/nginx/html/shared/assets/

# Copy custom nginx configuration
COPY ./apps/vanilla-js/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
