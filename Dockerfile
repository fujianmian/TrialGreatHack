# Stage 1: build
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./
COPY package.json package-lock.json ./
COPY patches ./patches
RUN npm install
COPY . .
RUN npm run build

# Stage 2: runtime
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose port 3000 (ECS container port)
EXPOSE 3000

# Start Next.js in production mode
CMD ["npx", "next", "start", "-p", "3000", "-H", "0.0.0.0"]