FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# Configura timezone para America/Sao_Paulo em ambientes Alpine
ENV TZ=America/Sao_Paulo
RUN apk add --no-cache tzdata \
  && cp /usr/share/zoneinfo/$TZ /etc/localtime \
  && echo $TZ > /etc/timezone

# Permite injetar a URL da API em tempo de build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.25-alpine
WORKDIR /usr/share/nginx/html

# Ajusta timezone também na imagem final usada em produção
ENV TZ=America/Sao_Paulo
RUN apk add --no-cache tzdata \
  && cp /usr/share/zoneinfo/$TZ /etc/localtime \
  && echo $TZ > /etc/timezone
COPY --from=builder /usr/src/app/dist ./
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
