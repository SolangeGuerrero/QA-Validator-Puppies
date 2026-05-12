# syntax=docker/dockerfile:1.7

# ── Stage 1: build (compile TS, generate Prisma client, build canvas) ────────
FROM node:20-bookworm-slim AS build
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Native build deps for `canvas` (Cairo/Pango/JPEG/GIF/SVG)
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential pkg-config python3 \
      libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Workspace manifests first for layer caching
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/

RUN pnpm install --frozen-lockfile

# Copy sources
COPY packages/shared packages/shared
COPY apps/api apps/api

# Generate Prisma client + compile TypeScript
RUN pnpm --filter @puppies/api exec prisma generate \
 && pnpm --filter @puppies/api build

# Prune dev dependencies for the runtime image
RUN pnpm --filter @puppies/api prune --prod || true

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS runtime
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Runtime libs for canvas (no headers, no compilers) + poppler-utils (pdftoppm
# is required for the deterministic PDF→PNG converter) + wget for healthcheck.
RUN apt-get update && apt-get install -y --no-install-recommends \
      libcairo2 libpango-1.0-0 libpangocairo-1.0-0 \
      libjpeg62-turbo libgif7 librsvg2-2 \
      poppler-utils \
      wget ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3001
WORKDIR /app

# Copy workspace metadata + node_modules + built artifacts
COPY --from=build /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules

# Run as non-root for safety
RUN groupadd -r purina && useradd -r -g purina purina && chown -R purina:purina /app
USER purina

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q --spider http://localhost:3001/health || exit 1

WORKDIR /app/apps/api
CMD ["node", "dist/index.js"]
