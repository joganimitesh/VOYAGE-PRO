#!/bin/sh
# Replace PORT placeholder in nginx config with the actual PORT env var
# Default to 80 if PORT is not set
PORT=${PORT:-80}
sed -i "s/listen 80;/listen ${PORT};/" /etc/nginx/conf.d/default.conf
echo "Nginx listening on port ${PORT}"
exec nginx -g "daemon off;"
