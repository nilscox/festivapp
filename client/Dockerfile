FROM node:lts-slim as build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY ./package.json ./pnpm-lock.yaml /app

COPY package.json pnpm-lock.yaml .
RUN pnpm install --frozen-lockfile

COPY . /app

ARG PUBLIC_DIR
ENV PUBLIC_DIR $PUBLIC_DIR

ARG VITE_LANGUAGE
ENV VITE_LANGUAGE $VITE_LANGUAGE

ARG VITE_ANALYTICS_URL
ENV VITE_ANALYTICS_URL $VITE_ANALYTICS_URL

ARG VITE_ANALYTICS_SITE_ID
ENV VITE_ANALYTICS_SITE_ID $VITE_ANALYTICS_SITE_ID

RUN pnpm build

FROM nginx:latest

RUN apt-get update

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 3000
COPY nginx.conf /etc/nginx/conf.d/default.conf
