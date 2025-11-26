# Banco de Dados

O projeto utiliza PostgreSQL + Prisma. Os arquivos de schema e migrations ficam em `backend/prisma`.

## Variáveis úteis

- `DATABASE_URL`: string de conexão completa usada pelo Prisma.
- `SHADOW_DATABASE_URL`: opcional para executar `prisma migrate dev`.

## Comandos Prisma

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma studio
```

## Executar migrations no Kubernetes

1. Descubra o nome do pod do backend:
   ```bash
   kubectl get pods -n fit-and-fails
   ```
2. Execute o comando dentro do pod:
   ```bash
   kubectl exec -it <backend-pod> -n fit-and-fails -- npx prisma migrate deploy
   ```

Em ambientes de CI/CD, execute `npx prisma migrate deploy` antes de publicar novas imagens.
