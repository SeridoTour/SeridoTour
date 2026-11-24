FROM node:22-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json

RUN npm ci --include=dev --workspace=apps/frontend --include-workspace-root=false

FROM base AS dev

WORKDIR /app

COPY . .

WORKDIR /app/apps/frontend

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM base AS build

WORKDIR /app

COPY . .

WORKDIR /app/apps/frontend

ARG VITE_API_URL
ARG VERCEL_ENV=preview
ENV VITE_API_URL=${VITE_API_URL} VERCEL_ENV=${VERCEL_ENV}
RUN npm run build

FROM nginx:stable-alpine AS prod

COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
