FROM node:24-alpine

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/app/package.json apps/app/
COPY apps/admin/package.json apps/admin/
COPY packages/config/package.json packages/config/
COPY packages/contracts/package.json packages/contracts/
COPY packages/utils/package.json packages/utils/

RUN pnpm install --frozen-lockfile --prod --filter @festivapp/api...

COPY packages packages
COPY apps/api apps/api

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV STORAGE_DIR=/data/files

EXPOSE 3000
VOLUME /data/files

WORKDIR /app/apps/api

CMD ["node", "src/index.ts"]
