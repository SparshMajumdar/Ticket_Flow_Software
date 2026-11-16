# SupportFlow Precision Enterprise - Production Web Application Container
FROM nginx:alpine

# Metadata
LABEL maintainer="SupportFlow Engineering"
LABEL description="Customer Support Ticket Management System Frontend"

# Copy frontend distribution assets to Nginx html directory
COPY frontend/ /usr/share/nginx/html/

# Expose standard web traffic port
EXPOSE 80

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:80/index.html || exit 1

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]

