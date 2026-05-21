# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy built artifacts from the builder stage
# For production, we re-install only production dependencies to save space
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app ./

# Use non-root user for security
USER node

# Expose the application port
EXPOSE 3000

# Start the Node.js application using npm start to trigger prestart validation
CMD ["npm", "start"]
