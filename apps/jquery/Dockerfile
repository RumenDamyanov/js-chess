FROM nginx:alpine

# Copy static files
COPY ./apps/jquery/ /usr/share/nginx/html

# Copy shared styles & assets (helpers, messages, etc.)
COPY ./shared/styles/ /usr/share/nginx/html/shared/styles/
COPY ./shared/assets/ /usr/share/nginx/html/shared/assets/

# Copy custom nginx configuration
COPY ./apps/jquery/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
