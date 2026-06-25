# Contexto do Projeto

## Etapa atual

Projeto Next.js com App Router, TypeScript e Tailwind CSS. O dashboard visual do desafio Frontend Mentor foi preservado. A camada social agora possui OAuth real, persistencia Prisma/PostgreSQL para producao, criptografia de tokens, refresh automatico quando o provider entrega refresh token, snapshots de metricas e fallback mock apenas quando `SOCIAL_DATA_MODE=mock`.

## Stack acordada

- Next.js com App Router. Versao instalada no lockfile: 16.2.9.
- TypeScript.
- Tailwind CSS.
- Prisma 6 com PostgreSQL para persistencia de producao.
- Componentes React modulares e tipados.
- Route Handlers em `src/app/api` para OAuth e APIs internas.
- Funcoes server-only em `src/lib/social` para tokens, providers, snapshots e agregacao.

## Arquitetura de conexoes sociais

- `src/app/page.tsx`: pagina inicial de login/conexao social.
- `src/app/login/page.tsx`: rota explicita para a mesma experiencia de login.
- `src/app/dashboard/page.tsx`: dashboard com os cards de metricas.
- `src/app/connections/page.tsx`: pagina de gerenciamento de conexoes.
- `src/app/api/auth/social/[provider]/start/route.ts`: inicia OAuth para `meta`, `x` e `youtube`.
- `src/app/api/auth/social/[provider]/callback/route.ts`: valida `state`, troca `code` por tokens reais, salva tokens criptografados e dispara a primeira coleta.
- `src/app/api/auth/social/[provider]/disconnect/route.ts`: remove tokens e snapshots locais do provider.
- `src/app/api/social/summary/route.ts`: retorna resumo seguro do dashboard, sem tokens.
- `src/app/api/social/sync/route.ts`: forca sincronizacao manual, aceita `provider`, aplica rate limit simples e retorna status resumido.

## Persistencia de producao

- `prisma/schema.prisma` define `SocialAccount` e `SocialMetricSnapshot`.
- `src/lib/db.ts` cria um Prisma Client singleton server-side.
- `src/lib/social/token-store.ts` escolhe automaticamente:
  - `PrismaSocialTokenStore` quando `DATABASE_URL` existe.
  - `LocalFileSocialTokenStore` apenas quando nao ha `DATABASE_URL`, para desenvolvimento local.
- `SocialAccount.userId` esta preparado como opcional para uma futura camada multiusuario.
- `.social-tokens.json` e `.social-metric-snapshots.json` continuam ignorados pelo Git e nao devem ser usados em producao.

## Criptografia dos tokens

- `src/lib/social/token-crypto.ts` usa AES-256-GCM com IV aleatorio de 12 bytes e chave derivada de `TOKEN_ENCRYPTION_KEY`.
- Access token e refresh token sao criptografados antes de persistir.
- Tokens nunca sao enviados para componentes client, rotas JSON ou logs.
- `TOKEN_ENCRYPTION_KEY` e obrigatorio quando `SOCIAL_DATA_MODE=api`; o erro e explicito se estiver ausente.

## OAuth real

- Meta usa `/api/auth/social/meta/start` e `/callback`, valida `state`, busca Pages, salva `facebook` com Page Access Token e salva `instagram` quando ha conta Business/Creator vinculada.
- X usa OAuth 2.0 Authorization Code Flow com PKCE, cookies HttpOnly para `state` e `code_verifier`, escopos `users.read tweet.read offline.access` e salva refresh token quando retornado.
- YouTube usa Google OAuth com `access_type=offline` e `prompt=consent`, busca o canal autenticado e salva o canal como conexao `youtube`.

## Refresh token

- `src/lib/social/oauth/refresh-token.ts` renova tokens de X e YouTube quando `expiresAt` esta expirado ou a menos de 5 minutos de expirar.
- O novo access token e criptografado e salvo.
- Se o refresh falha ou nao existe refresh token, a conexao e marcada como `expired`.
- Meta/Facebook/Instagram usam o token de Page retornado pela Meta; quando expirar sem refresh token, a UI pede reconexao.

## Snapshots de metricas

- Providers coletam dados reais e salvam `SocialMetricSnapshot`.
- `/dashboard` le snapshot recente para evitar chamada externa a cada render.
- O cache server-side/snapshot usa janela curta de 5 minutos.
- `/api/social/sync` permite sincronizacao manual, mas evita nova coleta se sincronizou ha menos de 1 minuto.
- Falha em uma rede nao derruba o dashboard inteiro; dados de outras redes continuam aparecendo.

## Providers e metricas reais

- Facebook: busca Page basica (`id`, `name`, `followers_count`, `fan_count`, `link`) e tenta Page Insights (`page_impressions`, `page_views_total`) quando permitido.
- Instagram: busca conta profissional (`username`, `followers_count`, `media_count`) e tenta insights (`impressions`, `reach`, `profile_views`) quando permitido.
- X/Twitter: renova token se necessario, busca usuario com `public_metrics` e usa `followers_count`, `following_count` e `tweet_count`.
- YouTube: renova token se necessario, usa `channels.list` com `snippet,statistics` e tenta YouTube Analytics para `views`, `likes` e `comments`.

Metricas dependentes de permissao, revisao de app ou plano de API retornam `null`; a UI mostra `--` e registra status parcial sem inventar dados.

## Estrategia de dados

- `SOCIAL_DATA_MODE=mock`: usa `src/data/mock-dashboard.ts` e nao chama APIs externas.
- `SOCIAL_DATA_MODE=api`: usa conexoes reais e snapshots; se nao houver conexoes, retorna dashboard vazio com CTA para `/connections`.
- Nao ha fallback mock silencioso quando existe conexao real e a API falha.
- `totalFollowers` soma apenas numeros reais disponiveis.

## Variaveis de ambiente

`.env.example` contem:

- `SOCIAL_DATA_MODE=api`
- `APP_BASE_URL`
- `DATABASE_URL`
- `TOKEN_ENCRYPTION_KEY`
- Credenciais OAuth de Meta, X/Twitter e Google/YouTube.

Segredos nao usam `NEXT_PUBLIC_*`.

## Limitacoes conhecidas por plataforma

- Meta/Facebook/Instagram: permissoes como `read_insights`, `instagram_manage_insights`, `business_management` e acesso a Page/conta profissional podem exigir revisao do app.
- Instagram: insights completos exigem conta Business/Creator vinculada a uma Page.
- X/Twitter: metricas e endpoints podem depender do plano da API.
- YouTube: analytics detalhado depende do escopo e da YouTube Analytics API; o provider usa estatisticas basicas quando Analytics nao esta disponivel.

## Validacoes executadas

- `npm.cmd install prisma @prisma/client`: executado inicialmente, depois ajustado.
- `npm.cmd install prisma@6 @prisma/client@6`: aprovado.
- `npx.cmd prisma generate`: aprovado apos permissao de rede para baixar o engine.
- `npx.cmd prisma validate`: aprovado com `DATABASE_URL` ficticia para validacao de schema.
- `npm.cmd run lint`: aprovado.
- `npm.cmd run build`: aprovado.

## Proxima etapa recomendada

Configurar `DATABASE_URL`, `TOKEN_ENCRYPTION_KEY` e credenciais reais em `.env.local`, aplicar o schema em um PostgreSQL de desenvolvimento/producao e validar os fluxos OAuth ponta a ponta com contas reais.
