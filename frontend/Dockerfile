# syntax=docker/dockerfile:1
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

FROM node:18-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
# Docker sets HOSTNAME to the container id by default, and the Next.js
# standalone server binds to $HOSTNAME — without this override it listens
# only on the container's own IP, not 127.0.0.1 (breaks the healthcheck)
# or 0.0.0.0 (breaks routing from voltmate-nginx).
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
