# Production image: builds once, runs `next start`. Migrations run on boot.
FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Build-time placeholders only; real values come from the runtime environment.
RUN APP_SECRET=build-time-placeholder-secret DATABASE_URL=postgresql://build:build@localhost:5432/build npm run build

FROM base AS run
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
RUN useradd --system --uid 1001 lampstand
COPY --from=build --chown=lampstand /app ./
COPY --chmod=755 scripts/docker-entrypoint.sh /usr/local/bin/lampstand-entrypoint
EXPOSE 3000
ENTRYPOINT ["lampstand-entrypoint"]
CMD ["sh", "-c", "npx prisma migrate deploy && if [ \"$SEED_DEMO_IF_EMPTY\" = \"true\" ]; then npx tsx --conditions=react-server scripts/seed-if-empty.ts; fi && npm run start -- -p ${PORT}"]
