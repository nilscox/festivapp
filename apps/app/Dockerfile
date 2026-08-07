FROM node:24-alpine AS build

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/app/package.json apps/app/
COPY apps/admin/package.json apps/admin/
COPY packages/config/package.json packages/config/
COPY packages/contracts/package.json packages/contracts/
COPY packages/utils/package.json packages/utils/

RUN pnpm install --frozen-lockfile --filter @festivapp/app...

COPY packages packages
COPY apps/app apps/app

ARG GIT_SHA

RUN pnpm --filter @festivapp/app build

FROM nginx:alpine

ENV API_URL=http://api:3000
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1
ENV NGINX_ENVSUBST_FILTER=API_URL|NGINX_LOCAL_RESOLVERS

COPY apps/app/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/apps/app/dist /usr/share/nginx/html

EXPOSE 80
