Fit & Fails
===============

Rede social saudável (e divertida) para acompanhar hidratação, tempo de tela, exercícios e o feed Fit x Fails. O projeto já vem preparado para rodar localmente, via Docker Compose ou em um cluster Kubernetes (OCI OKE).

## Stack principal

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + PWA (manifesto e service worker simples).
- **Backend**: Node.js + TypeScript + Express organizado em camadas (controllers / services / repositories).
- **Banco**: PostgreSQL + Prisma ORM (migrations).
- **Infra**: Dockerfiles separados, `docker-compose.yml` para dev e manifests em `k8s/` (namespace, Deployments, Services, ConfigMap e Secrets).

## Organização das pastas

- `backend/` – API Express, Prisma, documentação OpenAPI e Dockerfile.
- `frontend/` – App React/Vite com Tailwind, contextos, widgets e Dockerfile.
- `db/` – anotações sobre migrations (veja o README local).
- `k8s/` – manifestos para deploy em OCI OKE ou clusters compatíveis.

---

## Pré-requisitos

- Node.js 20+
- npm 9+
- Docker / Docker Compose (opcional, para execução containerizada)
- Acesso a um cluster Kubernetes (opcional, para deploy)

## Configuração local (sem Docker)

1. Instale dependências:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
2. Copie variáveis e ajuste o que for necessário:
   ```bash
   cd backend
   cp .env.example .env
   # edite DATABASE_URL e JWT_SECRET conforme necessário
   ```
3. Execute o PostgreSQL localmente (pode ser via Docker rápido):
   ```bash
   docker run --name fitandfails-db -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=fitandfails -d postgres:15
   ```
4. Rode migrations Prisma:
   ```bash
   cd backend
   npx prisma migrate dev --name init
   ```
5. Suba backend e frontend em terminais separados:
   ```bash
   # backend
   cd backend
   npm run dev

   # frontend
   cd frontend
   npm run dev -- --host 0.0.0.0 --port 3000
   ```
6. Acesse o app em `http://localhost:3000`. A API fica em `http://localhost:4000` com documentação em `http://localhost:4000/docs`.

## Desenvolvimento via Docker Compose

1. Garanta que `backend/.env` existe (veja exemplo).
2. Na raiz do projeto:
   ```bash
   docker-compose up --build
   ```
3. Instale dependências dentro dos containers (primeira execução):
   ```bash
   docker-compose exec backend npm install
   docker-compose exec frontend npm install
   ```
4. Rode migrations:
   ```bash
   docker-compose exec backend npx prisma migrate dev --name init
   ```
5. Endpoints:
   - Frontend: `http://localhost:3000`
   - Backend/API: `http://localhost:4000`
   - Swagger: `http://localhost:4000/docs`

## Construindo as imagens Docker

```bash
# backend
docker build -t fit-and-fails-backend:latest ./backend

# frontend
docker build -t fit-and-fails-frontend:latest ./frontend
```

Envie para seu registry (ex.: OCI Registry, GHCR, etc.) antes de aplicar no Kubernetes. **Observação importante:** o frontend lê `import.meta.env.VITE_API_URL` em build time; se não especificar nada ele usa `/api` (ideal para produção atrás do mesmo Nginx). Para builds que apontam para uma API diferente (por exemplo a VM de testes 192.168.86.129), informe `--build-arg VITE_API_URL=http://192.168.86.129:4000`.

## Ambientes suportados

| Ambiente           | Endereço                       | Observações                                                                 |
|--------------------|--------------------------------|------------------------------------------------------------------------------|
| **Testes (VM)**    | http://192.168.86.129:3000     | Use `docker-compose.yml`. O backend responde em `http://192.168.86.129:4000`.|
| **Produção (VM)**  | http://72.61.50.39/            | `docker-compose.prod.yml` expõe frontend em :80 e backend em :4000.         |
| **Produção (DNS)** | https://fitfails.cloud/        | DNS aponta para a VM anterior; TLS finaliza fora do Docker. Frontend chama `/api` e o Nginx interno faz proxy para o backend. |

Para publicar a versão usada em produção:

```bash
# Backend
docker build -t elieltondevopsengineer/fit-and-fails-backend:v9 ./backend
docker push elieltondevopsengineer/fit-and-fails-backend:v9

# Frontend (usa proxy interno /api)
docker build -t elieltondevopsengineer/fit-and-fails-frontend:v14 \
  --build-arg VITE_API_URL=/api \
  ./frontend
docker push elieltondevopsengineer/fit-and-fails-frontend:v14

# No servidor de produção
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Lembre de definir o arquivo `.env` com `POSTGRES_PASSWORD`, `JWT_SECRET`, `FRONTEND_URL` (incluindo `https://fitfails.cloud`) e `VITE_API_URL` somente quando precisar mudar o endpoint padrão.

## Kubernetes (OCI OKE)

1. Ajuste/gerar secrets:
   - Copie `k8s/secret.example.yaml` para `k8s/secret.yaml`, substitua os valores base64 (`echo -n "valor" | base64`).
   - Atualize `DATABASE_URL` para apontar para o serviço `fit-and-fails-postgres`.
2. Crie namespace e aplique manifests:
   ```bash
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/configmap.yaml -n fit-and-fails
   kubectl apply -f k8s/secret.yaml -n fit-and-fails
   kubectl apply -f k8s/postgres.yaml -n fit-and-fails
   kubectl apply -f k8s/backend.yaml -n fit-and-fails
   kubectl apply -f k8s/frontend.yaml -n fit-and-fails
   # opcional: ingress para expor frontend + API no mesmo host
   kubectl apply -f k8s/ingress.yaml -n fit-and-fails
   ```
3. Execute migrations dentro do pod do backend:
   ```bash
   kubectl exec -it deploy/fit-and-fails-backend -n fit-and-fails -- npx prisma migrate deploy
   ```
4. Exponha o frontend:
   - O `Service` está como `LoadBalancer`. Consulte o IP público via `kubectl get svc -n fit-and-fails`.
   - Se usar o Ingress incluso, aponte seu DNS para o endereço provisionado e atualize `VITE_API_URL` no ConfigMap para `https://seu-dominio/api`.

## Principais variáveis de ambiente

| Variável             | Descrição                                      |
|----------------------|------------------------------------------------|
| `DATABASE_URL`       | String de conexão PostgreSQL (usada pelo Prisma) |
| `JWT_SECRET`         | Segredo usado para assinar tokens JWT          |
| `PORT`               | Porta HTTP da API (default 4000)               |
| `WATER_DEFAULT_GOAL` | Meta diária padrão em ml                       |
| `FRONTEND_URL`       | URL pública do frontend (para CORS/notificações) |
| `VITE_API_URL`       | URL base da API usada pelo frontend            |
| `NOTIFICATION_PORT`  | Porta do microserviço de notificações (default 4100) |
| `PUSH_ENABLED`       | Define se o envio de push está ativo           |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | Credenciais do service account FCM usadas pelo serviço de notificações |

## Serviço de notificações

Existe um microserviço separado em `notification/` (Node.js + TypeScript) que escuta os eventos do Postgres via `LISTEN/NOTIFY` e dispara push (FCM) para Android/iOS/Web:

- Endpoints expostos: `POST /devices` (registrar token FCM com `userId`, `token`, `platform`, `appVersion?`), `POST /test` (envia push de teste para um usuário) e `GET /health`.
- Dispara push em dois gatilhos: novos posts (`Post`) são enviados para todos os dispositivos menos o autor; novos likes (`Like`) são enviados para o dono do post.
- A tabela auxiliar `notification_devices` é criada automaticamente na base. Triggers são instalados em `Post` e `Like` para publicar eventos nos canais `post_created` e `like_created`.
- Configure as variáveis `FIREBASE_*` para uso real. Se estiverem vazias, o serviço sobe mas apenas registra tokens e ouve eventos sem tentar enviar push.

## Funcionalidades entregues

- Autenticação JWT (cadastro + login) com salvamento seguro de senhas.
- Feed social com likes, postagens de água, tempo de tela, exercícios, “shame” e boas refeições.
- Módulo de hidratação com meta diária configurável, logs, barra de progresso e disparo automático de post ao atingir 100%.
- Módulo de tempo de tela semanal com comparação vs semana anterior e geração de post de conquista.
- Registro de exercícios com diferentes modalidades, compartilhamento opcional e destaque para treinos longos.
- PWA ready (manifest + service worker), layout responsivo mobile-first e navegação com sidebar / bottom nav.
- OpenAPI/Swagger atualizado em `backend/openapi.yaml`.
- Notificações simuladas via `notificationService` (console) para integrar push futuramente.

## Próximos passos sugeridos

- Conectar um serviço real de notificações (Firebase, OneSignal ou Web Push).
- Adicionar upload real de mídia (S3, OCI Object Storage, etc.).
- Implementar comentários no feed e/ou ranking gamificado.
- Automatizar CI/CD para build/push das imagens antes do deploy no OKE.

Divirta-se construindo a rede social saudável mais espirituosa da internet! 💧📱💪
