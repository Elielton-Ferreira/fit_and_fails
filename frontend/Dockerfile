FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# Permite injetar a URL da API em tempo de build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.25-alpine
WORKDIR /usr/share/nginx/html
COPY --from=builder /usr/src/app/dist ./
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
