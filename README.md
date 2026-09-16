# MAPS-CS - Monitoramento da APS Campos Sales

Sistema de monitoramento de gestantes na Atenção Primária à Saúde.

## 🚀 Getting Started

### Pré-requisitos

- Node.js 20.19+ (ou 22.12+, 24.0+)
- npm ou yarn

### Instalação

1. Clone o repositório
2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente. Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu-secret-key-aqui-gerado-aleatoriamente"
```

Para gerar um `NEXTAUTH_SECRET`, você pode usar:
```bash
openssl rand -base64 32
```

4. Execute as migrations do banco de dados:

```bash
npx prisma migrate deploy
```

5. Crie os usuários enfermeiros iniciais executando o script de seed:

```bash
npm run seed
```

Isso criará dois enfermeiros de exemplo:
- Email: `enfermeiro1@ubs.com` / Senha: `senha123`
- Email: `enfermeiro2@ubs.com` / Senha: `senha123`

⚠️ **IMPORTANTE**: Altere as senhas após o primeiro login!

6. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## 🗄️ Backup e Restore do Banco de Dados

Os backups do banco (PostgreSQL) são gerados via `pg_dump` e ficam em `backups/` com checksum `SHA256`.

Crie um backup:

```bash
npm run db:backup
```

Restaure (usa o dump mais recente):

```bash
npm run db:restore
```

Restaure especificando um arquivo:

```bash
npm run db:restore -- backups/backup_YYYYMMDD_HHMMSS.dump
```

Para restore em um alvo diferente, defina `RESTORE_TARGET_URL` no `.env`.

## 🔐 Sistema de Autenticação

O sistema possui autenticação obrigatória. Apenas enfermeiros podem acessar o sistema.

### Criar Novos Usuários

**Novos usuários só podem ser criados através do script de seed** (`prisma/seed.ts`). Para adicionar um novo enfermeiro:

1. Edite o arquivo `prisma/seed.ts`
2. Adicione um novo `upsert` para o enfermeiro desejado
3. Execute `npm run seed` novamente

Exemplo:
```typescript
const enfermeiro3 = await prisma.enfermeiro.upsert({
  where: { email: "novo.enfermeiro@ubs.com" },
  update: {},
  create: {
    nome: "Novo Enfermeiro",
    email: "novo.enfermeiro@ubs.com",
    senha: await bcrypt.hash("senhaSegura123", 10),
  },
})
```

### Login

Acesse `/login` para fazer login no sistema. Todas as rotas (exceto `/login` e `/api/auth`) são protegidas e requerem autenticação.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
