# Challenge

App de desafio pessoal: você cria seus desafios e mantém a ofensiva (dias seguidos sem falhar). Visual minimalista, tema claro e grafite, feito para Android como PWA instalável.

## Como funciona

- **Um Worker da Cloudflare** serve o app (`public/`, HTML/CSS/JS sem build) e a API (`worker/`).
- **D1** (`challenge`) guarda contas, desafios, dias feitos, amizades e inscrições de notificação. Esquema em `migrations/`.
- **Login**: Google (botão oficial, modo redirect) e e-mail com senha como alternativa.
- **Avisos**: Web Push com chaves VAPID que o próprio Worker gera e guarda no D1 na primeira vez. Um cron a cada 15 min manda:
  - o lembrete no horário de cada desafio;
  - se "Insistir" estiver ligado e ainda faltar desafio: 12h, 22h e 23h30 (tom gentil ou provocador);
  - "Fulano passou você" no ranking da semana e as cutucadas dos amigos.
- **Convite**: cada pessoa tem um link `/i/CODIGO` com prévia para WhatsApp. Quem entra por ele fica amigo de quem convidou, nos dois sentidos.
- O "hoje" de cada pessoa segue o fuso do celular dela (o app manda o fuso em cada pedido).

## Rodar localmente

```bash
npm install
npm run dev      # aplica as migrações no D1 local e sobe em http://localhost:8787
npm test         # testes de datas, ofensiva, textos dos avisos e criptografia do push
npm run typecheck
```

## Deploy

O deploy é automático pelo Workers Builds da Cloudflare a cada push na `main` (comando `npx wrangler deploy`).

Migração nova no banco: crie `migrations/000N_nome.sql` e rode `npm run db:migrate` antes do deploy.

### Login com Google

1. No Google Cloud Console, crie um "ID do cliente OAuth" do tipo **Aplicativo da Web**.
2. Em **Origens JavaScript autorizadas**, coloque o endereço do app (`https://challenge.mpotal.workers.dev`).
3. Em **URIs de redirecionamento autorizados**, coloque `https://challenge.mpotal.workers.dev/api/auth/google`.
4. Cole o ID em `GOOGLE_CLIENT_ID` no `wrangler.jsonc`. Sem ele, o app mostra só o login por e-mail.
