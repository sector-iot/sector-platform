# Build stage
FROM node:20-alpine AS base

RUN npm install turbo -g

FROM base AS builder

# Set working directory
WORKDIR /app

COPY . .
# Prune monorepo for server app
RUN turbo prune server --docker

FROM base as installer

WORKDIR /app

# Copy pruned files
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/full/ .

RUN npm ci
RUN turbo run build

FROM base AS runner

WORKDIR /app

# Copy built files and dependencies
COPY --from=installer /app/apps/server/dist ./dist
COPY --from=installer /app/apps/server/package.json ./
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/packages/database ./packages/database


# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
