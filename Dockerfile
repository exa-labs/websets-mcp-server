# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (--ignore-scripts to skip prepare since src/ isn't copied yet)
RUN npm ci --ignore-scripts

# Copy source code
COPY src ./src

# Build TypeScript to dist/
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package files again for production install
COPY package*.json ./

# Install only production dependencies (--ignore-scripts avoids running prepare/build)
RUN npm ci --omit=dev --ignore-scripts

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Expose the default port
ENV PORT=7860
EXPOSE 7860

# Set Node environment to production
ENV NODE_ENV=production

# Health check for container orchestration
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget --spider -q http://localhost:7860/health || exit 1

# Start the server
CMD ["node", "dist/index.js"]
