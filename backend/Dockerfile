# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps flag
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production runtime
FROM node:20

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev --legacy-peer-deps

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the application
CMD ["node", "dist/main"]
