FROM node:20 AS builder
WORKDIR /usr/src/app
COPY package*.json tsconfig*.json ./
RUN npm install
COPY prisma ./prisma
COPY src ./src
COPY openapi.yaml ./openapi.yaml
RUN npx prisma generate
RUN npm run build

FROM node:20
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/openapi.yaml ./openapi.yaml
COPY prisma ./prisma
RUN npx prisma generate
EXPOSE 4000
CMD ["node", "dist/main.js"]
