# Finza

Next.js (App Router) + MySQL (Sequelize) + Auth.js.

## Desarrollo

1. Copiá `.env.example` a `.env.local`.
2. Completá `DATABASE_URL` (MySQL local, schema `finza`) y `AUTH_SECRET` (`openssl rand -base64 32`).
3. Creá las tablas de auth:

```bash
npm run db:migrate
```

En Workbench, refrescá `finza`: deberías ver `users`, `accounts`, `sessions` y `verification_tokens`. El resto de tablas se agrega con una migración nueva cuando armemos cada feature.

4. Arrancá el servidor:

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000), creá cuenta en `/register` y entrá en `/login`.
