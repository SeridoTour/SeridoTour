### SeridóTour — Planejamento de Roteiros Turísticos Regionais

O **SeridóTour** é uma aplicação web *full-stack* desenvolvida para o planejamento, compartilhamento e descoberta de roteiros turísticos no Nordeste brasileiro. O projeto foi iniciado como requisito prático da disciplina de **Desenvolvimento Web Back-end** e atualmente encontra-se em evolução na disciplina de **Projeto Integrador I** do curso de Tecnologia em Sistemas para Internet do IFRN Campus Currais Novos.

#### Documentação do Projeto Integrador

O [índice da documentação](docs/README.md) reúne os 13 casos de uso detalhados, a arquitetura com deploy e o DER atualizado. A [entrega completa em PDF](docs/Documentacao-Projeto-Integrador.pdf) contém os três itens da atividade.

#### 👥 Equipe e Responsabilidades

A equipe atua de forma paralela em frentes específicas para garantir a entrega de ponta a ponta (E2E):

* **Manoel Serafim** - (Dev Core & Regras de Negócio)

* **João Emanuel** - (Dev Segurança & Auth)

* **Cauã Macêdo** - (Dev Integrações & Recursos Extras)

* **Romulo Cesar** - (Dev Front-end & UX/UI):

* **Felipe** - (Dev Front-end & UX/UI): 


#### 🚀 Arquitetura e Tecnologias

O projeto adota uma arquitetura **Monorepo** utilizando Workspaces nativos do npm para centralizar e facilitar a gestão de todo o ecossistema.

* **Back-end:** NestJS, Prisma ORM e PostgreSQL.


* **Front-end:** Vue 3 (Composition API), Vite, Vue Router, Pinia, Tailwind CSS e Leaflet.js (Mapas).


* **Infraestrutura:** Docker e Docker Compose.


* **Segurança:** Autenticação JWT com Refresh Tokens e restrição baseada em papéis (USER vs. ADMIN/GUIA).


#### 🏛️ Regras de Negócio e Fluxo de Estado

O sistema implementa regras estritas de domínio, com destaque para a máquina de estados obrigatória do recurso **Roteiro (Itinerary)**:

* **Ciclo de Vida:** Rascunho (Draft) ➡️ Em Análise (Under Review) ➡️ Publicado (Published) ou Rejeitado (Rejected).

* **Filtro de Visibilidade:** Apenas roteiros com o status "Publicado" são listados publicamente para outros turistas.

* **Bloqueio de Edição (Conflito):** Se um autor tentar realizar modificações (PUT/PATCH) em um roteiro que se encontra "Em Análise", a API intercepta a requisição e retorna um erro `HTTP 409 Conflict`.

---

#### 📦 Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

* Node.js 22.12 ou superior, até a versão 24 (Render/CI usam 22)

* Docker e Docker Desktop
* Git

#### ⚙️ Variáveis de Ambiente

O projeto usa arquivos de exemplo para facilitar a configuração local:

1. Copie o arquivo `.env.example` para `.env` na raiz do monorepo.
2. Substitua os placeholders por valores locais. Para executar o backend fora do Docker, configure `apps/backend/.env` e exporte a mesma `DATABASE_URL` no terminal que executará migrações. Os scripts de migração não carregam uma URL remota de um `.env` por suposição.
3. No front-end (`apps/frontend/.env`), a variável `VITE_API_URL` deve apontar para o seu back-end local (padrão: `http://localhost:3000`).

---

#### 🐳 Opção 1: Rodar tudo com Docker (Recomendado)

Use esta opção se quiser subir banco de dados, backend e frontend simultaneamente em contêineres isolados.

1. Copie o arquivo de exemplo de ambiente, se ainda não existir um `.env` na raiz:
```bash
cp .env.example .env

```


2. Crie o banco local e aplique as migrações explicitamente:
```bash
docker compose up -d postgres
docker compose run --rm backend node /app/scripts/migrate-local.cjs
```

3. Suba a stack completa:
```bash
npm run docker:up

```


4. Acesse os serviços:
* **Frontend:** `http://localhost:5173`
* **Backend:** `http://localhost:3000`
* **Banco PostgreSQL:** `localhost:5433`



Para parar os serviços preservando os volumes:

```bash
npm run docker:down

```

#### 🖥️ Opção 2: Banco no Docker e resto local

Use esta opção se quiser manter apenas o PostgreSQL em contêiner e executar o backend e frontend manualmente na sua máquina.

1. Suba somente o banco de dados:
```bash
docker compose up -d postgres

```


2. Confirme se o backend local está apontando para o banco do Docker. O arquivo `apps/backend/.env` deve conter:
```env
DATABASE_URL="postgresql://seridotour:SENHA_LOCAL@localhost:5433/seridotour_local?schema=public"

```


3. Instale as dependências gerais do monorepo:
```bash
npm ci --include=dev
npm run prisma:generate

```


4. Exporte explicitamente essa `DATABASE_URL` no terminal, aplique as migrações e inicie o backend:
```bash
npm run db:migrate:local
npm run start:backend

```


5. Em outro terminal, inicie o frontend:
```bash
npm run start:frontend

```


#### 📝 Observações e Boas Práticas

* Se o Docker estiver em execução, mas algum serviço não subir, confira se as portas `3000`, `5173` e `5433` já não estão sendo utilizadas por outros processos.

* A inicialização não executa migração, `db push` ou seed. O Compose usa PostgreSQL 18 em um projeto/volume novos (`seridotour-local-v2`), sem reutilizar o volume antigo do PostgreSQL 15.
* O seed é opcional e restrito a `seridotour_demo` ou `seridotour_test_*` em servidor local. Exige `LOCAL_DEMO_PASSWORD` com pelo menos 12 caracteres e IDs fixos: repetir não duplica dados. Não cria avaliações fictícias. O banco normal `seridotour_local` recusa seed.
* `npm run docker:reset-local` remove explicitamente os volumes do projeto local atual. `docker:down` apenas para os serviços.
* `npm run verify:migrations` cria PostgreSQL descartável para testar banco vazio, cópia de schema, proteção de dados legados, seed idempotente e API com banco real. Não utiliza banco remoto nem credenciais de cloud no CI.
* Procedimento de migração do preview: [operação e dados](docs/operacao/RELATORIO-DEPLOY-E-DADOS.md). A URL de produção é recusada pelo script de preview.
* O cadastro público cria somente turistas. Concessão/revogação de GUIA no preview é uma operação do responsável pelo banco, fora da API pública, pelo comando `scripts/manage-preview-guide.cjs` descrito no relatório. O código compartilhado não é mais aceito.
* `build:preview` instala, gera o client e compila antes de retirar ferramentas de build e dependências opcionais do runtime. Execute esse comando no ambiente de build descartável do preview; o desenvolvimento local continua usando `build:backend`/`build:frontend`.

* O frontend roda com *hot reload* no Vite, refletindo alterações de interface em tempo real.

* Para produção, evite o comando `prisma db push` e utilize as migrações versionadas criadas pelo Prisma.
