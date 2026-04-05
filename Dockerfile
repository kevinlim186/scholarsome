# syntax=docker/dockerfile:1.3-labs
FROM node:lts-alpine3.18 as builder

WORKDIR /usr/src/app

# Install build dependencies and app dependencies in one layer to save space
RUN apk add --no-cache g++ make python3
COPY package*.json .
RUN npm install --legacy-peer-deps --ignore-scripts --platform=linuxmusl && \
    npm rebuild bcrypt sharp --build-from-source && \
    npm cache clean --force

COPY . .
RUN node generate-icons.js && \
    npm run generate && \
    npm run build && \
    npm prune --omit=dev --legacy-peer-deps && \
    npm cache clean --force

FROM node:lts-alpine3.18 as production

WORKDIR /usr/src/app

RUN apk add --no-cache g++ make python3
COPY package*.json .
COPY --from=builder /usr/src/app/node_modules ./node_modules
# Rebuild native modules in production environment
RUN npm rebuild bcrypt sharp --build-from-source && \
    apk del g++ make python3 && \
    npm cache clean --force

COPY . .
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
RUN npx prisma generate

CMD [ "npm", "run", "serve:node" ]
