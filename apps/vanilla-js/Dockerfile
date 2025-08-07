# Use nginx to serve static files
FROM nginx:alpine

# Copy static files to nginx document root
COPY ./apps/vanilla-js/ /usr/share/nginx/html/

# Copy shared styles (overwrite the symlink)
COPY ./shared/styles/ /usr/share/nginx/html/shared/

# Copy custom nginx configuration
COPY ./apps/vanilla-js/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
