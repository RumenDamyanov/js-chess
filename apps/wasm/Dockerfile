# Multi-stage build for WebAssembly chess demo
FROM golang:1.23-alpine AS wasm-builder

# Install necessary tools including SVG support
RUN apk add --no-cache git ca-certificates rsvg-convert

# Set working directory
WORKDIR /app

# Copy the go-chess source
COPY ./backend/go-chess /go-chess

# Copy and prepare piece assets
COPY ./shared/assets/images/pieces/ /app/pieces/
WORKDIR /app/pieces

# Convert SVGs to PNGs using rsvg-convert for the Go WASM code
RUN for svg in *.svg; do \
        png="${svg%.svg}.png"; \
        rsvg-convert -w 80 -h 80 "$svg" -o "$png"; \
    done && \
    ls -la *.png

# Build the WASM binary
WORKDIR /go-chess
RUN GOOS=js GOARCH=wasm go build -o /app/chess.wasm ./examples/gui

# Copy the WASM JavaScript support file
RUN cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" /app/

# Production stage with Nginx
FROM nginx:alpine

# Copy the built WASM files
COPY --from=wasm-builder /app/chess.wasm /usr/share/nginx/html/
COPY --from=wasm-builder /app/wasm_exec.js /usr/share/nginx/html/

# Copy the HTML and assets
COPY ./apps/wasm/index.html /usr/share/nginx/html/

# Copy shared styles and assets
COPY ./shared/styles/ /usr/share/nginx/html/shared/styles/
COPY ./shared/assets/ /usr/share/nginx/html/shared/assets/

# Copy piece assets (both SVG and generated PNG) to the location expected by the Go WASM code
COPY --from=wasm-builder /app/pieces/ /usr/share/nginx/html/examples/gui/assets/pieces/

# Copy Nginx configuration
COPY ./apps/wasm/nginx.conf /etc/nginx/conf.d/default.conf

# Add WASM MIME type to nginx configuration
RUN sed -i '/application\/octet-stream/a \ \ \ \ application/wasm wasm;' /etc/nginx/mime.types

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
