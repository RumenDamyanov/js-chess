FROM nginx:alpine

# Copy static files
COPY ./apps/jquery/ /usr/share/nginx/html

# Copy shared styles (ensure nested 'styles' folder to match index.html paths)
COPY ./shared/styles/ /usr/share/nginx/html/shared/styles/

# Copy custom nginx configuration
COPY ./apps/jquery/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
