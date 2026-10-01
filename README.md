### SeridóTour — Planejamento de Roteiros Turísticos Regionais

O **SeridóTour** é uma aplicação web *full-stack* desenvolvida para o planejamento, compartilhamento e descoberta de roteiros turísticos no Nordeste brasileiro. O projeto foi iniciado como requisito prático da disciplina de **Desenvolvimento Web Back-end** e atualmente encontra-se em evolução na disciplina de **Projeto Integrador I** do curso de Tecnologia em Sistemas para Internet do IFRN Campus Currais Novos.

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

* Node.js (versões 18 ou 20 recomendadas)

* Docker e Docker Desktop
* Git

#### ⚙️ Variáveis de Ambiente

O projeto usa arquivos de exemplo para facilitar a configuração local:

1. Copie o arquivo `.env.example` para `.env` na raiz do monorepo.
2. Certifique-se de que o arquivo `apps/backend/.env` possui a `DATABASE_URL` corretamente configurada para execução do backend.
3. No front-end (`apps/frontend/.env`), a variável `VITE_API_URL` deve apontar para o seu back-end local (padrão: `http://localhost:3000`).

---

#### 🐳 Opção 1: Rodar tudo com Docker (Recomendado)

Use esta opção se quiser subir banco de dados, backend e frontend simultaneamente em contêineres isolados.

1. Copie o arquivo de exemplo de ambiente, se ainda não existir um `.env` na raiz:
```bash
cp .env.example .env

```


2. Suba a stack completa:
```bash
npm run docker:up

```


3. Acesse os serviços:
* **Frontend:** `http://localhost:5173`
* **Backend:** `http://localhost:3000`
* **Banco PostgreSQL:** `localhost:5433`



Para parar e remover os volumes do ambiente:

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
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/northeasTour?schema=public"

```


3. Instale as dependências gerais do monorepo:
```bash
npm install

```


4. Inicie o backend em modo desenvolvimento:
```bash
npm run start:backend

```


5. Em outro terminal, inicie o frontend:
```bash
npm run start:frontend

```


#### 📝 Observações e Boas Práticas

* Se o Docker estiver em execução, mas algum serviço não subir, confira se as portas `3000`, `5173` e `5433` já não estão sendo utilizadas por outros processos.

* Durante a inicialização via Docker Compose, o backend aguarda o banco de dados ficar saudável para aplicar os comandos `prisma generate` e rodar o seed inicial automaticamente.

* O frontend roda com *hot reload* no Vite, refletindo alterações de interface em tempo real.

* Para produção, evite o comando `prisma db push` e utilize as migrações versionadas criadas pelo Prisma.
