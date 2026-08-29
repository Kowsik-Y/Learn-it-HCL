FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable pnpm

# Install dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Copy source and generate Prisma client
COPY . .
RUN npx prisma generate

# Build the Next.js application
RUN pnpm build

# ── Runner ──────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable pnpm

# Copy built assets and dependencies
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["pnpm", "start"]
