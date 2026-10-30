# Workboard

Monorepo com backend **NestJS** e frontend **Next.js**, ambos em **TypeScript**, gerenciado com **pnpm workspaces** e **Turborepo**.

## Caso 01 — Quadro de trabalho com histórico

- **Caso:** Caso 01 — Quadro de trabalho com histórico (`docs/ai/context/escopo.md`, regras RN01–RN22).
- **Foco escolhido:** as regras de negócio no backend — limite de tarefas em `em_andamento`, desfazer pelo histórico e a garantia de que uma ação que falha não altera nem o quadro nem o histórico. A tela Next.js usa a mesma API e serve para ver o fluxo, mas não foi o foco.
- **Tempo dedicado:** quase 4 horas.
- **Colunas:** `a_fazer`, `em_andamento` e `concluido` no escopo; na API e no código, `todo`, `in_progress` e `done` (ADR 0007).

### Como acompanhar a demonstração

Siga os [Primeiros passos](#primeiros-passos) abaixo (Node 22+, pnpm via Corepack, `pnpm install` e os arquivos `.env`). Depois:

1. Suba API e web juntos:

```bash
pnpm dev
```

2. Abra http://localhost:3000 e teste o fluxo na tela:
   - Clique em **+ Nova tarefa**, digite um título e pressione Enter. A tarefa entra em **A fazer** (RN01).
   - Com o cartão focado, use ← e → para movê-lo para a coluna vizinha (RN02).
   - Tente mover uma terceira tarefa para **Em andamento** com o limite em 2: a ação é recusada e o quadro não muda (RN17).
   - Abra a engrenagem para mudar o limite. A mudança é recusada enquanto houver tarefa em andamento (RN21).
   - Só o cartão da última ação que mudou o quadro mostra o selo **Pode desfazer** (RN22). Clique em **Desfazer** nele e veja a tarefa voltar à coluna anterior (RN10).

3. Ou faça a mesma sequência direto na API (com a API rodando em http://localhost:3333/api). Cada resposta traz o `board` atual e um `outcome` (`changed`, `unchanged` ou `failed`):

```bash
curl -s -X POST localhost:3333/api/tasks -H 'Content-Type: application/json' -d '{"title":"Escrever README"}'
```

```bash
curl -s -X POST localhost:3333/api/tasks -H 'Content-Type: application/json' -d '{"title":"   "}'
```

Título só com espaços: `400`, `VALIDATION_ERROR`, quadro intacto (RN18).

```bash
curl -s -X POST localhost:3333/api/tasks -H 'Content-Type: application/json' -d '{"title":"Revisar testes"}'
```

```bash
curl -s -X POST localhost:3333/api/tasks -H 'Content-Type: application/json' -d '{"title":"Terceira"}'
```

```bash
curl -s -X PATCH localhost:3333/api/tasks/1/column -H 'Content-Type: application/json' -d '{"column":"in_progress"}'
```

```bash
curl -s -X PATCH localhost:3333/api/tasks/2/column -H 'Content-Type: application/json' -d '{"column":"in_progress"}'
```

```bash
curl -s -X PATCH localhost:3333/api/tasks/3/column -H 'Content-Type: application/json' -d '{"column":"in_progress"}'
```

Com o limite padrão de 2, a terceira movimentação retorna `409` com `WIP_LIMIT_REACHED` (RN17).

```bash
curl -s -X PUT localhost:3333/api/board/settings -H 'Content-Type: application/json' -d '{"wipLimit":3}'
```

Há tarefas em `in_progress`, então a troca do limite retorna `409` com `WIP_LIMIT_LOCKED` (RN21).

```bash
curl -s -X POST localhost:3333/api/board/undo
```

Desfaz a última ação que mudou o quadro: a tarefa 2 volta para `todo` (RN08, RN10).

```bash
curl -s localhost:3333/api/board
```

O estado atual, com `undoTaskId` apontando para a tarefa 1 (RN22). Tudo fica em memória: reiniciar a API zera o quadro (escopo, seção 4).

### Testes que ajudam a entender a solução

Os testes estão em `apps/api/src/board/board.service.spec.ts`, que descreve as regras de negócio. Três casos mostram bem a lógica:

1. **Valor no limite (RN17).** Com o limite em 2 e duas tarefas em `in_progress`, mover uma terceira deve falhar com `WIP_LIMIT_REACHED`, e o `board` retornado deve ser igual ao de antes. Erro que ele pega: uma comparação `>` no lugar de `>=`, que deixaria a terceira tarefa entrar, ou uma falha que mexe no quadro antes de recusar a ação.
2. **Interação entre desfazer e indicador (RN11 e RN22).** Criam-se as tarefas 1 e 2, a 1 vai para `done` e um desfazer é feito. O resultado esperado é `undoTaskId` igual a `"2"`, a tarefa da nova entrada no topo, e um segundo desfazer deve voltar mais um passo. Erro que ele pega: o desfazer gravar entrada no histórico, o que faria o indicador parar na mesma tarefa e o segundo desfazer repetir o primeiro.
3. **Entrada inválida do limite (RN19).** O `it.each` testa `0`, `-1`, `1.5`, `'3'` e `null`. Todos devem retornar `VALIDATION_ERROR` e manter o limite em 2. O caso `'3'` é o mais útil: uma string com cara de número não pode ser aceita por conversão silenciosa. Erro que ele pega: validação que deixa passar tipos errados ou que altera a configuração mesmo quando recusa a entrada.

Comandos de teste:

```bash
pnpm test
```

```bash
pnpm test:e2e
```

`pnpm test` roda os unitários de API e web; `pnpm test:e2e` roda os testes HTTP da API e o Playwright do web (ele sobe o Next.js sozinho, e a API precisa estar de pé).

### Duas decisões

**1. Ids em sequência sem zeros, ordenados por tamanho e depois por texto (ADR 0003).** A primeira sugestão da IA foi um contador de seis dígitos com zeros à esquerda (`000001`), para que a ordenação de texto funcionasse sem comparador próprio. Quis conferir o que acontece quando o contador ultrapassa a largura. Perguntei à IA e ela mostrou que `"1000000"` vem antes de `"999999"` em texto puro, e que manter a ordem exigiria reescrever todos os ids e o histórico. Concluí que, para um quadro em memória, era melhor um comparador que ordena por tamanho e depois por texto: não há limite prático, nenhum id muda e o comparador é testado com ids gerados fora de ordem (`compareTaskIds`, "sorts generated ids in creation order"). A consequência aceita é que desfazer uma criação deixa lacunas nos ids, e o id não é reaproveitado.

**2. Ação como transação no serviço, sem reverter a entrada antes do tempo (ADR 0005).** Quis decidir a ordem do desfazer. A alternativa natural era remover a entrada do topo do histórico e depois reverter a tarefa, o que é mais curto. Investiguei o caso de falha: se a reversão falhar depois da remoção, a ação desaparece do histórico e o quadro fica com um estado que não corresponde a ele. Escolhi a ordem inversa: ler o topo, reverter, e só então remover. O teste "keeps the task and history when reverting fails (RN16)" força uma falha em `revert` e confirma que quadro e histórico continuam iguais. A mesma regra vale para criar e mover: a tarefa só muda depois de a entrada ser empilhada, e se o empilhamento falhar a tarefa é desfeita.

Mais detalhes em [NEXT_STEPS.md](NEXT_STEPS.md), que lista decisões que podem voltar a ser necessárias.

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
