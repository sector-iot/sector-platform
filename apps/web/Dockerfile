# Build stage
FROM node:20-alpine AS base

RUN npm install turbo -g

FROM base AS builder

# Set working directory
WORKDIR /app

COPY . .
# Prune monorepo for server app
RUN turbo prune web --docker

FROM base as installer

WORKDIR /app

# Copy pruned files
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/full/ .

RUN npm ci
RUN turbo run build

FROM base AS runner

WORKDIR /app

 
# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
 
# Expose port
EXPOSE 3000
# Start the application
CMD node apps/web/server.js
