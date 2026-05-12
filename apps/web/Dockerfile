# syntax=docker/dockerfile:1.7

# ── Stage 1: build the SPA ───────────────────────────────────────────────────
FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

# Copy workspace manifests first to leverage Docker layer cache
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/

# Install all workspace deps (frozen lockfile for reproducible builds)
RUN pnpm install --frozen-lockfile

# Now copy the actual sources
COPY packages/shared packages/shared
COPY apps/web apps/web

# Vite bakes VITE_* vars at build time. They must be passed as build args.
# VITE_API_URL is intentionally NOT set: the SPA uses '/api' (relative) and
# nginx handles the proxy, so the same image works in any environment.
ARG VITE_INSFORGE_URL
ARG VITE_INSFORGE_ANON_KEY
ENV VITE_INSFORGE_URL=$VITE_INSFORGE_URL
ENV VITE_INSFORGE_ANON_KEY=$VITE_INSFORGE_ANON_KEY

RUN pnpm --filter @puppies/web build

# ── Stage 2: nginx runtime ───────────────────────────────────────────────────
FROM nginx:alpine AS runtime

# Replace default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built SPA
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
