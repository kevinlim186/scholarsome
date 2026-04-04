# syntax=docker/dockerfile:1.3-labs
FROM node:lts-alpine3.18 as builder

WORKDIR /usr/src/app

RUN apk add g++ make py3-pip

COPY package*.json .
RUN npm install --legacy-peer-deps --ignore-scripts --platform=linuxmusl
RUN npm rebuild bcrypt --build-from-source
RUN npm rebuild sharp --build-from-source

COPY . .
RUN node generate-icons.js
RUN npm run generate
RUN npm run build

FROM node:lts-alpine3.18 as production

WORKDIR /usr/src/app

RUN apk add --no-cache g++ make python3

COPY package*.json .
RUN npm install --omit=dev --legacy-peer-deps --ignore-scripts --platform=linuxmusl
RUN npm rebuild bcrypt --build-from-source
RUN npm rebuild sharp --build-from-source
RUN apk del g++ make python3

COPY . .
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
RUN npx prisma generate

CMD [ "npm", "run", "serve:node" ]
