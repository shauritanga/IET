# ============================================
# Stage 1: Install dependencies
# ============================================
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --only=production && \
    cp -R node_modules /prod_node_modules && \
    npm ci

# ============================================
# Stage 2: Build the application
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ============================================
# Stage 3: Production image
# ============================================
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init

ENV NODE_ENV=production

WORKDIR /app

RUN addgroup -g 1001 -S nestjs && \
    adduser -S nestjs -u 1001

COPY --from=deps --chown=nestjs:nestjs /prod_node_modules ./node_modules
COPY --from=builder --chown=nestjs:nestjs /app/dist ./dist
COPY --chown=nestjs:nestjs package.json ./

RUN mkdir -p uploads && chown nestjs:nestjs uploads

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/main"]
