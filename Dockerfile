# Stage 1: Build the React Application
FROM node:18-alpine as build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all files and build the project
COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the build output to replace the default nginx contents
COPY --from=build /app/dist /usr/share/nginx/html

# Copy our nginx template (will be processed by envsubst at runtime)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80

# Default backend URL (override via environment variable in Render/docker-compose)
ENV BACKEND_URL=http://backend:5001

CMD ["nginx", "-g", "daemon off;"]
