# Multi-stage build for React TS app
FROM node:20-alpine AS builder
WORKDIR /app

# Copy shared & root dependencies
COPY shared/ ./shared/
COPY package*.json ./
RUN npm ci
RUN npm run build:shared-styles

# Copy app package and install deps
COPY apps/react-ts/package*.json ./apps/react-ts/
WORKDIR /app/apps/react-ts
RUN npm ci

# Copy source
COPY apps/react-ts/ ./

# Build
RUN npm run build

FROM nginx:alpine
COPY apps/react-ts/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/react-ts/dist /usr/share/nginx/html
COPY --from=builder /app/shared/assets /usr/share/nginx/html/shared/assets
COPY --from=builder /app/shared/styles/scss/dist /usr/share/nginx/html/shared/styles/scss/dist
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
