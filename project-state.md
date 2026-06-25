# Estado do Projeto

## Status geral

Etapa de integracao social para producao concluida no codigo. O projeto agora inicia OAuth real, troca `code` por tokens, criptografa tokens, usa Prisma/PostgreSQL quando `DATABASE_URL` existe, mantem fallback local apenas para desenvolvimento, renova tokens de X e YouTube, salva snapshots de metricas e alimenta `/dashboard` com dados reais em `SOCIAL_DATA_MODE=api`.

## Checklist

| Item | Status | Observacoes |
| --- | --- | --- |
| Leitura de `SOCIAL_DATA_MODE=api` | Concluido | Modo API exige `TOKEN_ENCRYPTION_KEY` e nao cai para mock silencioso. |
| OAuth start real | Concluido | `meta`, `x` e `youtube` geram `state`; X tambem gera PKCE. |
| OAuth callback real | Concluido | Callbacks validam `state`, trocam `code`, salvam tokens e disparam primeira coleta. |
| Persistencia Prisma/PostgreSQL | Concluido | Adicionados `prisma/schema.prisma`, `src/lib/db.ts` e `PrismaSocialTokenStore`. |
| Fallback local de desenvolvimento | Concluido | `LocalFileSocialTokenStore` permanece apenas quando nao ha `DATABASE_URL`. |
| Criptografia de tokens | Concluido | AES-256-GCM; access/refresh tokens criptografados antes de persistir. |
| Refresh token automatico | Concluido parcial | Implementado para X e YouTube; Meta exige reconexao quando token expira sem refresh token. |
| YouTube real | Concluido | `channels.list` e tentativa de YouTube Analytics. |
| X/Twitter real | Concluido | Usuario autenticado/public metrics com refresh automatico. |
| Meta/Facebook real | Concluido | Salva Page e coleta dados basicos + tentativa de Page Insights. |
| Instagram real | Concluido | Salva conta profissional vinculada e coleta dados basicos + tentativa de Insights. |
| Snapshots de metricas | Concluido | `SocialMetricSnapshot` usado para cache de dashboard. |
| Dashboard em modo API | Concluido | Le snapshots/dados reais, exibe CTA se nao ha conexoes e aviso se houver falha parcial. |
| `/api/social/summary` | Concluido | Retorna JSON seguro sem tokens e sem erro bruto. |
| `/api/social/sync` | Concluido | Forca coleta por provider, aplica rate limit e retorna status resumido. |
| `/connections` | Concluido | Exibe conectado, desconectado, expirado, permissao pendente, erro, reconectar, desconectar e testar conexao. |
| Documentacao | Concluido | `context.md` e `project-state.md` atualizados. |

## Comandos executados

- `npm.cmd install prisma @prisma/client`: executado; instalou Prisma 7 inicialmente.
- `npx.cmd prisma generate`: falhou com Prisma 7 porque a versao mudou a configuracao de datasource.
- `npm.cmd install prisma@6 @prisma/client@6`: aprovado; fixou Prisma 6.19.3.
- `npx.cmd prisma generate`: primeira tentativa falhou por bloqueio de rede ao baixar engine; segunda tentativa com permissao externa passou.
- `npx.cmd prisma validate`: falhou sem `DATABASE_URL`; passou com `DATABASE_URL=postgresql://user:pass@localhost:5432/social_media_dashboard` ficticia para validar schema.
- `npm.cmd run lint`: aprovado.
- `npm.cmd run build`: aprovado.

## Resultado do build

Rotas geradas:

- `/`
- `/login`
- `/dashboard`
- `/connections`
- `/api/auth/social/[provider]/start`
- `/api/auth/social/[provider]/callback`
- `/api/auth/social/[provider]/disconnect`
- `/api/social/summary`
- `/api/social/sync`

## Pendencias

- Aplicar o schema Prisma em um PostgreSQL real com `DATABASE_URL` configurado.
- Validar OAuth ponta a ponta com credenciais reais de Meta, X Developer Portal e Google Cloud.
- Testar manualmente contas reais:
  - YouTube com canal autenticado.
  - X com plano/API liberando `public_metrics`.
  - Meta com Page disponivel.
  - Instagram Business/Creator vinculado a Page.
- Implementar revogacao remota no disconnect por provider quando desejado.
- Adicionar autenticacao interna/multiusuario e preencher `userId`.

## Resultado dos testes manuais possiveis aqui

- `SOCIAL_DATA_MODE=mock`: validado indiretamente por build/prerender sem credenciais.
- `SOCIAL_DATA_MODE=api`: fluxo implementado, mas nao validado contra APIs reais porque este ambiente nao possui `.env.local` com credenciais OAuth, `TOKEN_ENCRYPTION_KEY` real e `DATABASE_URL` para PostgreSQL.

## Proxima etapa recomendada para deploy

1. Criar PostgreSQL e configurar `DATABASE_URL`.
2. Definir `TOKEN_ENCRYPTION_KEY` longo e secreto.
3. Criar apps OAuth nas plataformas e configurar redirect URIs de producao.
4. Rodar `npx.cmd prisma migrate deploy` usando a migration `20260625110000_init_social`.
5. Rodar `npx.cmd prisma generate`, `npm.cmd run lint` e `npm.cmd run build` no ambiente de CI/deploy.
6. Fazer uma sincronizacao manual em `/connections` para cada provider conectado.
