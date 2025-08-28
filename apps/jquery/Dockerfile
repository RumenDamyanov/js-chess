FROM node:18-alpine AS styles-build
WORKDIR /build
COPY package*.json ./
RUN npm install --omit=dev || npm install
COPY shared/styles ./shared/styles
COPY apps/jquery/scss ./apps/jquery/scss
RUN npx sass shared/styles/scss/main.scss shared/styles/scss/dist/common-scss.css --no-source-map && \
	npx sass apps/jquery/scss/bundle.scss apps/jquery/scss/dist/app-bundle.css --no-source-map || true

FROM nginx:alpine

# Copy static files
COPY ./apps/jquery/ /usr/share/nginx/html

# Copy shared styles & assets (helpers, messages, etc.)
COPY ./shared/styles/ /usr/share/nginx/html/shared/styles/
COPY --from=styles-build /build/apps/jquery/scss/dist /usr/share/nginx/html/scss/dist
COPY --from=styles-build /build/shared/styles/scss/dist /usr/share/nginx/html/shared/styles/scss/dist
COPY ./shared/assets/ /usr/share/nginx/html/shared/assets/

# Copy custom nginx configuration
COPY ./apps/jquery/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
