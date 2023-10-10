FROM node:18.16.1-alpine as build-stage

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./

RUN npm i -g pnpm && pnpm i

EXPOSE 8000

CMD ["pnpm", "start"]