# --- Stage 1: install deps -----------------------------------------------
FROM oven/bun:1.1-alpine AS deps
WORKDIR /app
COPY package.json ./
COPY tsconfig.json ./
# Lockfile is optional — if absent, install resolves fresh
RUN if [ -f bun.lockb ]; then bun install --frozen-lockfile --production; else bun install --production; fi

# --- Stage 2: runtime -----------------------------------------------------
FROM oven/bun:1.1-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3110
ENV DATA_DIR=/data

COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src ./src

# Persistent storage volume
RUN mkdir -p /data
VOLUME ["/data"]

EXPOSE 3110

# Healthcheck against /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3110/voice-uploads/api/health > /dev/null || exit 1

CMD ["bun", "run", "src/server.ts"]
