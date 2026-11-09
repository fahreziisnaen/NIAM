# Stage 1: Build dependencies & production assets
FROM node:20-alpine AS builder

WORKDIR /app

ARG INTERNAL_BACKEND_URL=http://backend:8000
ENV INTERNAL_BACKEND_URL=${INTERNAL_BACKEND_URL}

# Install dependencies based on lockfile
COPY package*.json ./
RUN npm ci

# Copy application source
COPY . .

# Build Next.js application
RUN npm run build

# Stage 2: Production runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV INTERNAL_BACKEND_URL=http://backend:8000

# Copy build artifacts and dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./

EXPOSE 3000

CMD ["npm", "run", "start", "--", "-p", "3000"]
