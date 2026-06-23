# Contexto do Projeto

## Etapa atual

Projeto Next.js inicializado e validado. A aplicacao base compila com TypeScript, Tailwind CSS e App Router.

## Insumos analisados

- `README (2).md`: desafio Frontend Mentor "Social media dashboard with theme switcher".
- `style-guide.md`: tokens oficiais de layout, cores e tipografia.
- Imagens fornecidas no chat: layouts mobile e desktop em tema claro e escuro.

## Stack acordada

- Next.js com App Router. Versao instalada no lockfile: 16.2.9.
- TypeScript.
- Tailwind CSS.
- Componentes React modulares e tipados.

## Requisitos de produto

- Dashboard responsiva para mobile a partir de 320px, com referencia visual em 375px.
- Layout desktop alinhado ao design em 1440px.
- Alternancia entre tema claro e escuro.
- Estados de hover para elementos interativos.
- Fidelidade visual aos cards, espacamentos, cores, tipografia e hierarquia das imagens.

## Diretrizes visuais extraidas

- Fonte principal: Inter, pesos 400 e 700.
- Fundo com padrao superior horizontal arredondado no rodape do bloco de topo.
- Tema escuro:
  - Background geral: `hsl(230, 17%, 14%)`.
  - Background superior: `hsl(232, 19%, 15%)`.
  - Cards: `hsl(228, 28%, 20%)`.
  - Texto secundario: `hsl(230, 22%, 74%)`.
  - Texto principal: branco.
- Tema claro:
  - Background geral: branco.
  - Background superior: `hsl(225, 100%, 98%)`.
  - Cards: `hsl(227, 47%, 96%)`.
  - Texto secundario: `hsl(228, 12%, 44%)`.
  - Texto principal: `hsl(230, 17%, 14%)`.
- Cores de marca:
  - Facebook: `hsl(208, 92%, 53%)`.
  - Twitter: `hsl(203, 89%, 53%)`.
  - Instagram: gradiente `hsl(37, 97%, 70%)`, `hsl(5, 77%, 71%)`, `hsl(329, 70%, 58%)`.
  - YouTube: `hsl(348, 97%, 39%)`.
- Indicadores:
  - Crescimento: `hsl(163, 72%, 41%)`.
  - Queda: `hsl(356, 69%, 56%)`.

## Mapeamento visual das imagens

### Desktop

- Container central com largura maxima aproximada de 1110px.
- Header em duas colunas: titulo/subtitulo a esquerda e toggle a direita.
- Grade principal com 4 cards grandes em linha.
- Secao "Overview - Today" com grade de 4 colunas por 2 linhas.
- Cards com raio discreto, fundo uniforme e hover levemente mais claro.
- Topo colorido nos cards principais com barra de aproximadamente 4px.

### Mobile

- Layout em coluna unica.
- Header empilhado, com divisor horizontal entre titulo e toggle.
- Cards principais e cards de overview ocupam toda a largura disponivel.
- Espacamento vertical generoso entre grupos.

## Componentes planejados

- `ThemeProvider` ou controle client-side equivalente para alternar tema.
- `DashboardHeader`: titulo, total de seguidores e toggle de tema.
- `ThemeToggle`: switch acessivel com estado claro/escuro.
- `StatCard`: cards principais de Facebook, Twitter, Instagram e YouTube.
- `OverviewCard`: cards menores de metricas diarias.
- `SocialIcon`: camada simples para renderizar icones oficiais a partir dos assets.
- Dados centralizados em arquivo tipado, por exemplo `data/dashboard.ts`.

## Arquitetura inicial prevista

- `src/app/layout.tsx`: layout raiz, fonte Inter e metadados.
- `src/app/page.tsx`: composicao da dashboard.
- `src/app/globals.css`: tokens CSS, Tailwind base e estilos globais.
- `src/components/dashboard/*`: componentes especificos da dashboard.
- `src/data/dashboard.ts`: dados dos cards.
- `public/images/*`: assets de icones quando disponiveis ou recriados se necessario.

## Decisoes iniciais

- A estrutura Next.js foi criada manualmente no diretorio atual para preservar os arquivos existentes.
- As dependencias foram instaladas com `npm.cmd install`, pois `npm` via PowerShell estava bloqueado pela politica de execucao de scripts.
- `next/font/google` nao sera usado por enquanto porque o build falhou ao tentar buscar a fonte Inter no Google Fonts em ambiente restrito. O projeto mantem `--font-inter` com pilha `Inter, Arial, sans-serif` e pode receber fonte local posteriormente.
- O tema sera tratado via classe no elemento raiz para permitir Tailwind com variantes `dark:`.
- Os dados serao estaticos e tipados, pois o desafio e visual/interativo e nao requer API.
- O layout sera mobile-first, com breakpoints para `md` e `lg`.

## Estrutura criada

- `package.json`: scripts `dev`, `build`, `start` e `lint`.
- `package-lock.json`: lockfile das dependencias instaladas.
- `next.config.ts`: configuracao base do Next.js.
- `tsconfig.json`: TypeScript estrito com alias `@/*`.
- `tailwind.config.ts`: Tailwind com `darkMode: "class"`, fonte e cores sociais iniciais.
- `postcss.config.js`: Tailwind e Autoprefixer.
- `eslint.config.mjs`: ESLint flat config com presets do Next e TypeScript.
- `src/app/layout.tsx`: layout raiz e metadata.
- `src/app/page.tsx`: placeholder inicial da dashboard.
- `src/app/globals.css`: tokens CSS de tema claro/escuro e utilitarios Tailwind.
- `src/components/dashboard/.gitkeep`: pasta reservada para componentes.
- `src/data/.gitkeep`: pasta reservada para dados tipados.

## Validacoes executadas

- `npm.cmd run lint`: aprovado.
- `npm.cmd run build`: aprovado.
- `npm.cmd run dev -- --hostname 127.0.0.1 --port 3000`: servidor iniciado e validado com resposta HTTP 200.

## Pendencias antes da proxima etapa

- Implementar layout base com header, fundo superior e toggle de tema.
- Confirmar se os assets oficiais existem em outro local nao listado; no momento, o repositorio nao contem pasta `images` ou `design`.
- Avaliar inclusao de fonte Inter local caso a fidelidade tipografica exija independencia total do ambiente do usuario.
