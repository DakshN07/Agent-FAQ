# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source files and build
COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine AS production

# Copy the build output to replace the default nginx contents.
# Adjust the build directory name if necessary (e.g., /app/dist or /app/.next)
# For Next.js static export: COPY --from=builder /app/out /usr/share/nginx/html
# For Create React App: COPY --from=builder /app/build /usr/share/nginx/html

# Assuming Next.js standalone output or static HTML
COPY --from=builder /app/out /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
