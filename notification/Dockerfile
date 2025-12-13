FROM node:20 AS builder
WORKDIR /usr/src/app
COPY package*.json tsconfig.json ./
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm install
COPY src ./src
RUN npm run build

FROM node:20
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /usr/src/app/dist ./dist
EXPOSE 4100
CMD ["node", "dist/server.js"]
