FROM node:22-alpine AS base

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json

ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
RUN npm ci --include=dev --workspace=apps/backend --include-workspace-root=false

FROM base AS dev

WORKDIR /app

COPY . .

WORKDIR /app/apps/backend

EXPOSE 3000

CMD ["sh", "-c", "npm run prisma:generate && npm run start:dev:docker"]

FROM base AS build

WORKDIR /app

COPY . .

WORKDIR /app/apps/backend

RUN npm run prisma:generate && npm run build && mkdir -p /app/node_modules/.prisma /app/apps/backend/node_modules/.prisma

FROM node:22-alpine AS prod

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json

ENV NODE_ENV=production PRISMA_SKIP_POSTINSTALL_GENERATE=true
RUN npm ci --omit=dev --workspace=apps/backend --include-workspace-root=false && npm cache clean --force

COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=build /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=build /app/apps/backend/node_modules/.prisma /app/apps/backend/node_modules/.prisma

WORKDIR /app/apps/backend

EXPOSE 3000

USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "dist/src/main.js"]
