# Workboard

Monorepo com backend **NestJS** e frontend **Next.js**, ambos em **TypeScript**, gerenciado com **pnpm workspaces** e **Turborepo**.

## Estrutura

```
workboard/
├── apps/
│   ├── api/        # Backend NestJS        → http://localhost:3333/api
│   └── web/        # Frontend Next.js      → http://localhost:3000
├── packages/       # Pacotes compartilhados (tipos, utilitários)
├── docs/
│   ├── guia-nextjs-react.md   # Guia para iniciantes em React/Next.js
│   └── ai/                    # Artefatos usados pela IA
│       ├── context/           # Contexto de domínio
│       ├── decisions/         # ADRs (decisões de arquitetura)
│       └── prompts/           # Prompts reutilizáveis
├── AGENTS.md       # Regras para agentes de IA
├── turbo.json
└── pnpm-workspace.yaml
```

## Pré-requisitos

- **Node.js 22+** (há um `.nvmrc`; com nvm: `nvm use`)
- **pnpm**, habilitado via Corepack (já vem com o Node):

```bash
corepack enable
```

A versão do pnpm é definida no campo `packageManager` do `package.json` e baixada automaticamente.

## Primeiros passos

1. Instale as dependências:

```bash
pnpm install
```

2. Crie os arquivos de ambiente a partir dos exemplos:

```bash
cp apps/api/.env.example apps/api/.env && cp apps/web/.env.example apps/web/.env.local
```

3. Suba front e back juntos em modo desenvolvimento:

```bash
pnpm dev
```

- Web: http://localhost:3000 (a página inicial mostra a resposta da API)
- API: http://localhost:3333/api

## Comandos

Todos executados na raiz:

| Comando       | O que faz                                    |
| ------------- | -------------------------------------------- |
| `pnpm dev`    | Sobe API e Web em modo watch                 |
| `pnpm build`  | Gera o build de produção de todos os apps    |
| `pnpm lint`   | Roda os linters (Oxlint na API, ESLint no Web) |
| `pnpm test`   | Roda os testes unitários (Vitest na API e no Web) |
| `pnpm test:e2e` | Roda os testes end-to-end (Vitest + Supertest na API, Playwright no Web) |
| `pnpm format` | Formata o código com Prettier                |

Para rodar algo em um app específico, use `--filter`:

```bash
pnpm --filter @workboard/api dev
```

```bash
pnpm --filter @workboard/web add zod
```

## Testes

| App | Unitários | End-to-end |
| --- | --- | --- |
| api | Vitest — `src/**/*.spec.ts` | Vitest + Supertest — `test/*.e2e-spec.ts` |
| web | Vitest + React Testing Library — `src/**/*.test.tsx` | Playwright — `e2e/*.spec.ts` |

Antes do primeiro E2E do front, baixe o navegador usado pelo Playwright (uma vez por máquina):

```bash
pnpm --filter @workboard/web exec playwright install chromium
```

O Playwright sobe o Next.js sozinho (ou reaproveita um `pnpm dev` já rodando). Para testar a integração com a API, deixe a API rodando:

```bash
pnpm --filter @workboard/web test:e2e
```

Modo watch dos unitários do front:

```bash
pnpm --filter @workboard/web test:watch
```

## Variáveis de ambiente

| App   | Variável     | Padrão                        | Descrição                    |
| ----- | ------------ | ----------------------------- | ---------------------------- |
| api   | `PORT`       | `3333`                        | Porta HTTP da API            |
| api   | `WEB_ORIGIN` | `http://localhost:3000`       | Origem liberada no CORS      |
| web   | `API_URL`    | `http://localhost:3333/api`   | URL base da API (lado servidor) |

## Repositório remoto e credenciais

Remoto: `https://github.com/Gustavohqo/workboard.git` (`origin`).

O token do GitHub não fica em texto puro: o repositório usa o helper `git-credential-netrc` (vem com o git) lendo `~/.authinfo.gpg`, um arquivo criptografado com sua chave GPG. Para configurar em uma máquina nova:

1. Instale o helper (vem na documentação do git):

```bash
install -m 755 /usr/share/doc/git/contrib/credential/netrc/git-credential-netrc.perl ~/.local/bin/git-credential-netrc
```

2. Aponte o git para ele (configuração local do repositório):

```bash
git config --local credential.https://github.com.helper "$HOME/.local/bin/git-credential-netrc -f $HOME/.authinfo.gpg"
```

3. Se não tiver chave GPG, crie uma (será pedida uma senha):

```bash
gpg --quick-generate-key "Seu Nome <seu@email.com>" default default 2y
```

4. Gere um *fine-grained personal access token* no GitHub (Settings → Developer settings), com acesso só a este repositório e permissão **Contents: Read and write**. Depois grave-o criptografado — o token é digitado sem eco e nunca vai para o disco em texto puro nem para o histórico do shell (sintaxe zsh):

```bash
read -rs "TOKEN?Token do GitHub: " && printf 'machine github.com login SEU_USUARIO password %s\n' "$TOKEN" | gpg --encrypt --recipient seu@email.com --output ~/.authinfo.gpg && unset TOKEN && chmod 600 ~/.authinfo.gpg
```

5. Teste o acesso:

```bash
git ls-remote origin
```

## Trabalhando com IA

Leia o [AGENTS.md](AGENTS.md) — ele define as regras que os agentes de IA seguem neste projeto. O histórico de uso da IA é registrado localmente em `HISTORY.md` (ignorado pelo git).

Novo em React/Next.js? Comece por [docs/guia-nextjs-react.md](docs/guia-nextjs-react.md).
