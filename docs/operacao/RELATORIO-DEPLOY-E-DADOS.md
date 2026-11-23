# Deploy, preview e dados do SeridóTour

## Configuração efetiva do preview — 23/11/2026

A infraestrutura de preview foi criada e validada após autenticação nos painéis. O acesso administrativo foi feito pelo navegador; as tentativas anteriores sem acesso, registradas abaixo, foram superadas. A aplicação permanece **em preparação para a revisão dos dados**, com as rotas de dados bloqueadas. A configuração de hospedagem não representa conclusão da limpeza, da carga ou dos critérios funcionais do sistema.

| Camada | Configuração desta retomada |
| --- | --- |
| Git | Branch publicada `codex/preview-geoparque`, base `afbe08d`. Commit `d5b632b` prepara o isolamento; `b2d2042` fixa a instalação do frontend pelo lockfile. `main` não recebeu commits. |
| API | [seridotour-api-preview.onrender.com](https://seridotour-api-preview.onrender.com/health), serviço Render `srv-dc26ci7f3r2c73c90b9g`, Node 22, Free, Virginia, repositório `SeridoTour/SeridoTour`, branch de preview. Serviço novo, fora do ambiente Production do projeto existente. Commit `b2d2042` confirmado como Live no [deployment dep-dc26f76q1p3s738sqh5g](https://dashboard.render.com/web/srv-dc26ci7f3r2c73c90b9g/deploys/dep-dc26f76q1p3s738sqh5g). |
| Frontend | [Preview estável da branch](https://seridotour-git-codex-preview-d143e9-serafims-projects-395240b2.vercel.app/). Deployment validado `4tteGzDBRiZ1zcetiNHtRHweVB1M`, commit `b2d2042`, ambiente Preview, status Ready. |
| Vercel | Projeto `seridotour`, ID `prj_3eAUthkNvjqD29J4uuAQ5zWQ12bO`, equipe `serafims-projects-395240b2`. Root `apps/frontend`, Vite, build `npm run build`, saída `dist`, Node 24 do projeto preservado. |
| Banco | Projeto Neon `sweet-dew-14074573`, branch **development-seridotour** `br-quiet-sea-atieyvt5`, endpoint `ep-tiny-bonus-at29rygs`, base `northeastour`. Conexão exclusiva configurada no serviço novo. |
| Mídia | O responsável autorizou reutilizar as credenciais Cloudinary de produção. Elas foram copiadas somente para o serviço novo, sem alterar as originais. Novos uploads usam `seridotour/development-seridotour/places` e `/reviews`; a conta Cloudinary é compartilhada, portanto o prefixo é organização de arquivos, não uma separação de permissões. Nenhum upload ou remoção foi realizado. |

### Isolamento aplicado

- `DATABASE_URL` é validada antes do startup por `scripts/verify-preview-env.cjs`: apenas o hostname direto ou pooled de `ep-tiny-bonus-at29rygs`, base `northeastour` e SSL são aceitos. O comando também confere o nome do serviço/branch quando o Render os informa, origem CORS e pasta Cloudinary. Nenhum valor secreto é impresso pela validação.
- O Render usa build `npm ci --include=dev && npm run prisma:generate --workspace=apps/backend && npm run build:backend`; start `node scripts/verify-preview-env.cjs && npm run start:prod --workspace=apps/backend`; health check `/health`. Não há migração, seed ou `db push` nesses comandos. Prisma Client 6.19.3 e o artefato `dist/src/main.js` foram confirmados no build remoto.
- `DEPLOYMENT_ENV=preview` e `PREVIEW_DATA_REVIEWED=false` mantêm todas as rotas de dados em `503 PREVIEW_NOT_READY`; apenas GET/HEAD de `/health` passam. O middleware também envia `X-Robots-Tag: noindex, nofollow, noarchive` e `Cache-Control: no-store`.
- JWT e código de guia foram gerados para este serviço. `NODE_ENV=production`, Swagger desabilitado, access token `15m`, refresh configurado como `7d`. Isso não corrige o fluxo de refresh descrito na análise inicial.
- Na Vercel foi criada outra `VITE_API_URL`, tipo Config, apenas no escopo **Preview / codex/preview-geoparque**, com valor `https://seridotour-api-preview.onrender.com`. A variável original Production and Preview foi preservada; a regra específica da branch a sobrescreve neste preview, conforme a [precedência documentada pela Vercel](https://vercel.com/docs/environment-variables#preview-environment-variables).
- O build Vite de Preview exige URL explícita HTTPS e recusa `northeastour.onrender.com` e localhost. O primeiro deployment automático foi bloqueado por essa trava enquanto a variável ainda era herdada; após salvar o override, os builds passaram. O HTML de Preview contém meta robots `noindex, nofollow, noarchive`.
- A instalação da Vercel foi fixada somente no `vercel.json` desta branch: `cd ../.. && npm ci --include=dev --workspace=apps/frontend --include-workspace-root=false`. Os overrides globais do projeto foram apenas consultados. O rewrite SPA foi mantido.
- A proteção de acesso já existente foi confirmada: Vercel Authentication / Standard Protection, sem links compartilháveis ou exceção adicionada. O acesso sem sessão recebe redirecionamento; o usuário autenticado consegue abrir a página.
- `CORS_ORIGIN` permite somente a origem estável da branch acima. Utilizar esse endereço para validar a integração; os endereços individuais de cada deployment não foram acrescentados à lista de CORS.

### Validação desta configuração

| Verificação | Resultado |
| --- | --- |
| API `/health` | 200, banco/memória/disco `up`; header de não indexação presente. |
| API `/places` e `/users` | 503 com `PREVIEW_NOT_READY`; nenhum dado da cópia retornado. |
| CORS | Origem estável do preview recebe `Access-Control-Allow-Origin` exato; `https://seridotour.vercel.app` não recebe permissão na API de preview. |
| Interface real | Home e acesso direto a `/mapa` carregaram e exibiram “Preview em preparação. A revisão dos dados ainda não foi concluída.”, proveniente da API de desenvolvimento. Sem mocks. A validação do mapa com catálogo aguarda a liberação dos dados. |
| Banco antes/depois | Mesmas contagens: 12 usuários, 11 tokens, seis locais, oito roteiros, quatro avaliações. Somente SELECTs foram executados no Neon nesta retomada. |
| Local | Dois testes do comando de startup e três testes do middleware passaram; builds backend e frontend passaram. Builds negativos de Preview sem URL e com API de produção foram bloqueados; build positivo incluiu robots. Instalação isolada do workspace frontend pelo lockfile passou. |
| Produção | Frontend continuou no deployment `SMS22w41shzMYjXU35wfTpLTUyHo`, commit `afbe08d`; API de produção consultada continuou no commit `994ceac`, serviço `srv-d98ekffavr4c739dma50`. Nenhuma configuração, senha, dado, implantação ou arquivo existente de mídia de produção foi alterado. |

### Operação e pendências

O serviço Render foi criado pelo formulário de repositório Git público, com os comandos do YAML. **Não foi associado a um Blueprint.** O formulário avisa que auto-deploy para essa modalidade depende de Blueprint; o push posterior gerou frontend na Vercel, mas não gerou um segundo deploy automático no Render. Usar `Manual Deploy → Deploy latest commit` somente em `seridotour-api-preview`, conferindo branch e SHA. A configuração `render.preview.yaml` permanece como referência para uma futura associação controlada; não aplicá-la ao serviço de produção.

Manter `PREVIEW_DATA_REVIEWED=false` até revisar e executar a limpeza exclusivamente na branch Neon de desenvolvimento, validar as duas contas e corrigir os problemas de segurança pertinentes. Só então mudar essa variável no serviço **de preview** e realizar novo deploy. Não foi solicitada nem executada a etapa destrutiva nesta retomada; o plano detalhado abaixo continua pendente. O catálogo proposto também não foi importado.

OpenWeather continua sem chave de desenvolvimento. O upload real com Cloudinary não foi exercitado enquanto a API está bloqueada. Os logs de instalação reportaram alertas de dependências (Render: 51, incluindo dois críticos; frontend: 16); a revisão/atualização dessas dependências, os problemas de cache/autenticação e a reconciliação de migrações continuam no diagnóstico e não foram tratados como resolvidos por este deploy. Nenhum `npm audit fix --force` foi executado.

O arquivo temporário usado para transferir a conexão Neon foi removido. Nenhuma credencial foi adicionada ao Git ou a este relatório.

Capturas da API Live, do frontend Ready e da rota do mapa foram salvas localmente em `C:/Users/Karas/Documents/ChatGPT/Atividade/output/seridotour-preview/`. Os dois provedores ficaram no commit de código `b2d2042`; a atualização posterior deste relatório não modifica os artefatos implantados.

## Registro da análise e do plano anteriores

As seções seguintes preservam o diagnóstico e a preparação anteriores a esta configuração. Menções a falta de acesso aos painéis, ausência de push ou inexistência de preview refletem aquele momento; o estado atual está descrito acima.

Verificação em 23/11/2026. Base: `main` em `afbe08da5a87e0b8c1fbc9eaea7cf15cb8111258`. Preparação local em `codex/preview-geoparque`.

## Resultado e limite da análise

O frontend e a API públicos estão disponíveis. O problema mais imediato é o cache da API: consultas diferentes de locais recebem a mesma página. Há também problemas de autenticação, migrações e reprodução do deploy que devem ser resolvidos antes de usar a carga como validação final do sistema.

A orientação mais recente é preparar um preview completo e testar nele antes de alterar produção. Nenhuma exclusão, alteração de senha ou carga foi executada em produção. As consultas ao Neon foram de leitura, sem recuperar hashes de senha nem valores dos tokens.

Foram examinados código, configuração versionada, endpoints públicos, navegador sem mocks e metadados/esquema do Neon. Ainda não há acesso administrativo ao Render e à Vercel para confirmar comandos, logs, variáveis, plano, região e SHA efetivamente implantado. Um serviço responder não comprova que seu Dockerfile versionado foi utilizado.

## Frontend: situação verificada

| Item | Evidência | Encaminhamento |
| --- | --- | --- |
| Endereço atual | `https://seridotour.vercel.app/` e `/mapa` responderam 200. O endereço antigo `https://northeas-tour-frontend.vercel.app/` redireciona com 307 para o atual. | Atualizar links da documentação e configurações externas para o domínio atual. |
| Integração | O bundle público utiliza `https://northeastour.onrender.com`. | No preview, recompilar com a URL exclusiva da API de desenvolvimento. |
| Navegação SPA | Rewrite de `apps/frontend/vercel.json` existe e a rota direta `/mapa` funciona. | Manter o rewrite e testá-lo nos previews. |
| CORS | A API permite a origem `https://seridotour.vercel.app`. | Acrescentar apenas a origem de preview na API de desenvolvimento. A origem antiga não está permitida, mas redireciona para a atual. |
| Segurança HTTP | HSTS presente; CSP ausente na resposta examinada. | Definir CSP compatível com imagens, API e tiles do Leaflet, primeiro em modo de relatório. |
| Catálogo | Uma visita real exibiu um cartão; o banco tem seis locais. Sem erros no console nessa visita. | Corrigir cache da API antes de atribuir isso ao layout ou à paginação do cliente. |
| Escala | `placesService.getAll()` solicita apenas os primeiros 100 locais. | Implementar paginação e busca no servidor quando o catálogo crescer. |

As variáveis `VITE_*` entram no JavaScript durante o build e ficam públicas. Alterar uma variável exige novo deployment; nunca colocar segredos nelas. Fontes: [Vite na Vercel](https://vercel.com/docs/frameworks/frontend/vite), [variáveis de ambiente](https://vercel.com/docs/environment-variables).

O Docker alternativo do frontend precisa receber `VITE_API_URL` no build e configurar `try_files $uri $uri/ /index.html` no Nginx. Esse risco é do caminho Docker; o rewrite atual da Vercel está funcionando.

## Backend: prioridades e correções propostas

| Prioridade | Problema e evidência | Como corrigir e validar |
| --- | --- | --- |
| P0 | `PlacesController` usa `@CacheKey('places_list')`. Em produção, `?limit=1&page=1` retornou MISS; `?limit=2&page=2` retornou HIT com a mesma página 1 e limite 1. `?limit=100` repetiu o resultado. | Remover a chave fixa e usar URL completa ou chave explícita com filtros/paginação. Invalidar nas mutações. Testar duas páginas, dois limites e atualização sem reiniciar. |
| P0 | `ReviewsController` usa `@CacheKey('reviews_place')`, compartilhada entre IDs. Os comentários no código afirmam uma composição automática que o decorator não implementa. | Usar chave com `placeId` ou remover esse cache inicialmente. Testar dois locais com avaliações distintas. |
| P0 | `UsersService.listUsers()` retorna `findMany()` sem `select`, incluindo o campo de senha. O tipo DTO não remove campos em execução. | Selecionar somente campos públicos. Confirmar no JSON autenticado que nenhum hash é retornado. Não foi feito login nesta auditoria. |
| P0 | `JwtStrategy.validate()` aceita o conteúdo do JWT sem consultar a existência atual do usuário. Apagar linhas de `Token` não revoga JWTs já emitidos. | Consultar usuário e permissões atuais; implementar revogação/versionamento de sessão e expiração. Para corte imediato de todas as sessões, planejar rotação do segredo e redeploy coordenado. Testar token de usuário excluído e de conta com senha redefinida. |
| P1 | O fluxo de refresh salva o access token em `Token.hash`, sem hash real/expiração própria; geração de refresh está comentada. | Separar access e refresh, armazenar digest do refresh, expiração e revogação; rotacionar no uso e invalidar no logout. Centralizar refresh no cliente para evitar concorrência. |
| P1 | O cadastro promove a GUIA por um código compartilhado; exemplos versionados contêm valores que parecem credenciais. | Usar convite individual ou concessão administrativa. Revisar/rotacionar valores que tenham sido utilizados de verdade, inclusive Cloudinary/JWT; manter apenas placeholders no exemplo. Não reproduzir os valores em relatórios. |
| P1 | Histórico de migrações incompleto em relação ao esquema atual, inclusive no banco consultado. | Reconciliar em clone e criar baseline/migrações verificáveis. Testar criação de banco vazio e atualização de cópia existente. Não usar reset nem `db push` para resolver produção. |
| P1 | Prisma 7 na raiz e Prisma 6 no backend, com schema/configuração no formato da versão 6. | Unificar inicialmente na versão compatível do backend e no lockfile. Migrar para outra major em tarefa própria. Executar CLI no workspace correto. |
| P1 | Docker backend inicia `dist/main`, enquanto o script de produção usa `dist/src/main`. O estágio final executa a CLI da raiz. | Usar o artefato realmente gerado; gerar Prisma com a versão correta durante o build e incluir dependências necessárias. Validar imagem executando e respondendo `/health`. |
| P1 | Instalações Docker usam `npm install` sem copiar lockfile; inicialização local executa `db push` e seed. O seed cria locais/roteiros/avaliações novamente. | Usar `npm ci`, separar build/start/migração/carga. Seed de demonstração restrito a desenvolvimento. Produção inicia somente o servidor compilado. |
| P2 | Não há pipeline de CI versionado. O E2E existente é um teste padrão insuficiente, com problemas de configuração já identificados. | Pipeline com instalação pelo lockfile, typecheck/build, testes relevantes e banco descartável. Cobrir login, papéis, catálogo, cache por ID/query, upload e moderação. |
| P2 | Upload guarda só `imageUrl`; não há identificação do arquivo nem compensação. `Place` não tem fonte externa única ou crédito de imagem. | Guardar `publicId`, fonte, autor/licença e identificador estável de catálogo. Compensar uploads novos em falha de persistência. Não remover imagens antigas automaticamente na limpeza de usuários. |

O `/health` público retornou 200 e status `ok`. É necessário confirmar no painel do Render se ele é usado como health check. Separar liveness de readiness, ajustar limites de memória ao plano e registrar erros estruturados sem segredos. Não há medição suficiente para concluir SLA, capacidade ou necessidade de migrar de provedor. Referências: [health checks no Render](https://render.com/docs/health-checks), [cache no NestJS](https://docs.nestjs.com/techniques/caching), [migrações em produção no Prisma](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production).

## Organização sugerida

Manter o monorepo e as hospedagens atuais. Não há evidência que justifique microserviços ou Kubernetes. Separar responsabilidades sem criar camadas que apenas repassem chamadas:

- `apps/frontend`: páginas, componentes compartilhados, serviços HTTP e estado. Adotar os nomes atuais de forma consistente; unificar a marca visível SeridóTour em uma tarefa delimitada.
- `apps/backend`: módulos de domínio, DTOs explícitos, autorização no servidor e tratamento de erros comum.
- `apps/backend/prisma`: schema, migrações completas e seed apenas de demonstração.
- `docs/operacao`: runbook de deploy, prévia dos dados e relatório. Scripts de manutenção, quando implementados, devem ficar fora do caminho de startup.
- Scripts separados para `build`, `start:prod`, migração controlada, carga idempotente e reset local. Trocar `docker:down` por parada sem `-v`; deixar remoção de volumes em comando de reset explícito.

O fluxo recomendado é branch de trabalho → CI → preview → validação → PR para main → migração compatível → backend → frontend → smoke test. A promoção leva código e dados revisados; não deve sobrescrever o banco de produção com toda a cópia do preview.

## Preview completo

| Camada | Produção atual | Desenvolvimento proposto |
| --- | --- | --- |
| Git | `main` | `codex/preview-geoparque`, criada localmente; ainda sem commit/push desta preparação. |
| Frontend | Vercel, `seridotour.vercel.app` | Deployment de preview ligado à branch, com `VITE_API_URL` da API de desenvolvimento. |
| API | Render, `northeastour.onrender.com` | Serviço separado ligado à branch, com banco, JWT e CORS exclusivos. |
| Banco | Neon `production` | Branch `development-seridotour` criada a partir de produção, com endpoint próprio. |
| Mídia | Cloudinary | Pasta/identificação própria de desenvolvimento; exclusões não podem atingir arquivos de produção. |

**Status atualizado após conectar o Neon:** a branch Git local e a branch Neon foram criadas. O erro anterior de autenticação foi superado com a conexão disponível; a configuração de suspensão de 300 segundos não foi repetida, pois a conta a recusou. Não houve alteração de plano.

O banco de desenvolvimento está na branch `development-seridotour` (`br-quiet-sea-atieyvt5`), filha de `br-sweet-breeze-atba91kg`, com endpoint próprio `ep-tiny-bonus-at29rygs`, compute fixo de 0,25 CU e política de suspensão padrão da conta (valor retornado pela API: 0). Ela foi renomeada de `development-geoparque` a pedido do responsável, sem trocar seu ID ou endpoint. A comparação de esquema com produção não encontrou diferenças. Uma consulta na base `northeastour` da branch nova confirmou 12 usuários, seis locais, oito roteiros e quatro avaliações. A cópia ainda contém os dados originais; não publicar sua API antes da limpeza revisada.

Faltam conectar/configurar os projetos Vercel/Render. Não há URL de preview publicada. Nenhuma variável local de conexão foi criada ou sobrescrita; obter a conexão exclusiva da branch nova ao configurar a API e manter seu valor fora do Git e dos logs. O isolamento de escritas entre branches é documentado pelo [Neon](https://neon.com/docs/introduction/branching).

### Configuração preparada para publicação

O arquivo `render.preview.yaml`, na raiz do repositório, define somente o novo serviço `seridotour-api-preview`. Não vincular esse arquivo ao serviço de produção nem substituí-lo pelo serviço existente. Ele usa Node 22, plano gratuito, região Virginia, branch `codex/preview-geoparque`, build com o lockfile e startup pelo artefato compilado. Não há seed, `db push`, migração ou criação de banco no build/start. A região proposta acompanha o Neon em US East; a disponibilidade do plano precisa ser confirmada na conta Render.

Variáveis a fornecer no serviço novo: `DATABASE_URL` da base `northeastour`, branch `br-quiet-sea-atieyvt5`, endpoint `ep-tiny-bonus-at29rygs`; `CORS_ORIGIN` igual à origem final do preview; e as três credenciais Cloudinary de desenvolvimento. JWT e código de guia serão gerados exclusivamente para esse serviço. Nenhum segredo está no YAML. O clima permanecerá indisponível até receber uma chave OpenWeather de desenvolvimento.

`CLOUDINARY_FOLDER_PREFIX=seridotour/development-seridotour` separa os uploads novos em subpastas `places` e `reviews`. O serviço de upload passou a respeitar esse prefixo opcional; sem a variável, mantém as pastas existentes. Para isolamento também de credenciais, usar um ambiente Cloudinary de desenvolvimento e não copiar o segredo do serviço de produção.

Na Vercel, configurar `VITE_API_URL` somente no escopo **Preview** e restrito à branch `codex/preview-geoparque`, com a URL que o Render efetivamente atribuir. Manter as variáveis de Production intactas. O frontend usa `apps/frontend`, build `npm run build`, saída `dist` e o rewrite SPA já existente; conferir os overrides e instalação do monorepo no projeto real antes de publicar.

Publicar a branch somente depois de conferir essas configurações: um push pode gerar preview automático com variáveis herdadas, inclusive uma URL de API de produção. Não foi feito commit/push desta preparação, criação de serviço Render ou deployment Vercel. A tentativa de acesso aos painéis pelo navegador falhou antes de qualquer interação, com erro `failed to write kernel assets`; ambos os plugins continuam sem conexão confirmada.

Na última retomada, o responsável confirmou que conectou Render e Vercel nos plugins do Codex. Porém, a descoberta de ferramentas desta conversa continua sem operações dos dois provedores e o diretório retorna `installed: false` para ambos. Não há tokens de CLI disponíveis. O acesso visual foi reiniciado e falhou novamente antes de abrir os painéis. Isso impede executar e validar o deploy nesta sessão, sem concluir que a conexão feita pelo responsável falhou. O nome `development-seridotour` foi confirmado por nova consulta ao Neon; nenhuma escrita foi feita na branch `production`.

Validação local: geração do Prisma Client 6.19.3, build do backend e build/typecheck do frontend passaram. A geração foi feita com URL local fictícia, sem conexão ao Neon. O arquivo compilado esperado `apps/backend/dist/src/main.js` foi confirmado. A verificação de HTTP, CORS e integração em ambiente publicado continua pendente dos acessos.

Passos de montagem:

1. A branch Neon já foi criada e verificada. Usar a base `northeastour`, não `neondb`, que está vazia. Manter o endpoint exclusivo acima e conferir consumo/suspensão no plano da conta.
2. Criar API de desenvolvimento usando somente a conexão da branch nova, `NODE_ENV=production`, segredo JWT próprio, Cloudinary separado e CORS limitado ao preview. Usar o mesmo modo de build de produção, com dados isolados.
3. Configurar as variáveis de **Preview** na Vercel. Evitar fallback silencioso para a API de produção. Verificar escopo da variável e novo build. [Monorepos na Vercel](https://vercel.com/docs/monorepos).
4. Antes de abrir o preview, eliminar da cópia usuários/tokens reais e redefinir as duas contas de teste conforme a prévia revisada. Proteger o acesso ao preview e impedir indexação com `X-Robots-Tag`; isso não substitui autenticação.
5. Rodar limpeza/carga somente na branch nova, validar interface e API, revisar resultados e então planejar a promoção. Toda rotina deve abortar se o destino for a branch `production` durante essa etapa.

Uma branch de código sozinha não isola o banco. Um preview que mantém `VITE_API_URL` ou `DATABASE_URL` de produção continua fazendo operações em produção.

## Banco: inventário de leitura

Projeto Neon `northeastour` (`sweet-dew-14074573`), branch `production` (`br-sweet-breeze-atba91kg`), base `northeastour`. A ligação ao projeto é consistente com o catálogo público; confirmar a conexão ativa no Render antes de qualquer alteração futura em produção.

O projeto informa PostgreSQL 18, retenção de histórico de 21.600 segundos (6 horas) e branch de produção sem proteção. Esse histórico não substitui um backup verificado antes da limpeza. Configurar proteção e retenção adequada após conferir limites do plano.

| Objeto | Atual | Exclusão proposta | Restante após limpeza, antes da carga |
| --- | ---: | ---: | ---: |
| Usuários | 12 | 10 | 2 |
| Tokens armazenados | 11 | 11, para encerrar sessões existentes das contas de teste também | 0 antes dos novos logins |
| Roteiros | 8 | 8 | 0 |
| Vínculos roteiro/local | 16 | 16, por cascade ao excluir roteiro | 0 |
| Avaliações | 4 | 3 | 1 |
| Locais | 6 | 0 | 6, mais geossítios aprovados |

Manter exatamente `Turistateste@gmail.com` (USER) e `GuiaTeste@gmail.com` (GUIA), com a senha fornecida pelo responsável, sem gravá-la no repositório. As duas contas já existem com esses papéis. Existe ainda `guiateste@gmail.com`, uma terceira conta distinta, incluída nas dez exclusões propostas. Não fundir conteúdo dela silenciosamente. A autenticação atual é sensível a maiúsculas/minúsculas; normalização futura exige migração das duplicatas e índice compatível.

Os seis locais atuais são Cimento Elo e Cruzeiro (Currais Novos), Pium, Praia de Maiami, Praia de Ponta Negra e Praia do amor (estes cadastrados como Natal). Todos estão sem imagem. Alguns nomes, cidades e coordenadas precisam de revisão editorial. Não corrigir ou apagar por suposição; a exclusão autorizada foi de usuários e seus roteiros/avaliações.

As chaves de usuário em Token, Review e Itinerary usam DELETE RESTRICT. A associação `_ItineraryToPlace` tem cascade. O banco registra quatro migrações aplicadas, mas já contém colunas/relacionamentos que os arquivos dessas migrações não criam: indício concreto de divergência do histórico, a reconciliar em clone.

## Plano de limpeza para revisão e ensaio no preview

1. Confirmar destino, bloquear escritas concorrentes e obter backup/snapshot com caminho de restauração validado. Não tratar o preview que será editado como único backup.
2. Recalcular números no início. Abortá-los se diferirem da prévia revisada; não usar exclusão ampla sem critérios.
3. Em transação, localizar as duas contas por e-mail exato, preservar seus IDs e confirmar papéis. Gerar hashes bcrypt com salt independente para a senha fornecida, fora dos logs e dos arquivos versionados.
4. Excluir tokens das contas removidas e sessões antigas das duas contas mantidas; excluir as três avaliações e os oito roteiros dos demais usuários; excluir os dez usuários. Os 16 vínculos são removidos pela FK. Preservar a avaliação da conta mantida e os seis locais.
5. Assertar exatamente dois usuários com os papéis esperados, nenhuma referência órfã e contagens esperadas. Qualquer divergência causa rollback. Não usar `TRUNCATE CASCADE`.
6. Validar revogação de JWT no backend: apagar tokens no banco não basta no código atual. O preview deve ter segredo próprio; a solução de revogação precisa ser implantada antes do corte em produção.
7. Testar os dois logins, permissões positivas/negativas e navegação real. A rotina de catálogo deve poder rodar duas vezes sem duplicar registros.

O usuário escolheu executar depois de revisar dados e plano. A etapa destrutiva continua aguardando essa revisão e a montagem do ambiente isolado; não foi aplicada nem ensaiada em produção.

## Carga do Geoparque e imagens

A proposta inicial reúne os 21 nomes do catálogo, distribuídos entre Cerro Corá, Lagoa Nova, Currais Novos, Acari, Carnaúba dos Dantas e Parelhas. Fontes: [Geoparque Seridó](https://geoparqueserido.com.br/), [inventário e mapa publicado pela UERN](https://portal.uern.br/eduern/wp-content/uploads/2024/08/Uern_55_anos.pdf). Há grafias e municípios divergentes entre materiais; Pico do Totoró e Marmitas do Rio Carnaúba devem ter a nomenclatura final confirmada. Não substituir coordenadas por centro da cidade.

O arquivo [geossitios-proposta.json](geossitios-proposta.json) é uma **prévia editorial, sem importação automática**. Campos desconhecidos ficam nulos. Dois registros têm coordenadas de fontes identificadas: Cânions dos Apertados e Açude Gargalheiras. Essas coordenadas são referências do geossítio, não instruções de acesso ou garantia de segurança da visita. As descrições são propostas curtas; não há notas, avaliações ou depoimentos inventados.

Para Cânions, a referência é o [cadastro GEOSSIT/SGB 1917](https://www.sgb.gov.br/geossit/geossitios/ver/1917), com WGS84. O conteúdo estava disponível no índice de busca, mas a abertura direta retornou 404 nesta checagem; revalidar o documento antes da carga. Gargalheiras usa a coordenada em graus/minutos/segundos do [inventário SGB](https://rigeo.sgb.gov.br/jspui/bitstream/doc/17155/1/serido.pdf); confirmar datum e ponto no mapa antes de publicar.

Foi verificada uma candidata de foto para Gargalheiras: [foto de Fabiobarros no Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Acude_gargalheiras_-_acari_-_rn.jpg), licenciada em CC BY-SA 4.0. Exige crédito, link de licença e indicação de alterações; adaptações devem respeitar a condição de compartilhamento. As fotos do site oficial ainda não têm autorização de reutilização confirmada. Não basta serem públicas na internet.

Antes da carga: conferir coordenadas/município, aprovar descrição/categoria, selecionar foto com direito de uso e crédito, prever exibição do crédito na interface e manter identificador externo estável. O schema atual só guarda uma imagem por local; galeria exige modelo próprio e interface correspondente.

Usar upload organizado no Cloudinary, guardar URL e identificador, e depois persistir o catálogo em transação. Em falha, compensar somente uploads novos da operação. O campo `sourceKey` da proposta ainda não existe no banco; será preciso criar uma chave única por migração reconciliada ou manter um mapeamento explícito para IDs existentes. `name` não é único e não serve sozinho como chave de upsert.

## Critérios de aceite

- Preview acessível com frontend/API/banco isolados, origem CORS correta e nenhum segredo no bundle.
- URLs diretas funcionam; mapa responsivo mantém zoom pela roda; favicon presente.
- Cache não mistura páginas, filtros ou avaliações de locais distintos.
- Duas contas com os papéis esperados, nenhuma senha no JSON e JWT antigo recusado conforme a política definida.
- Contagens da limpeza conferidas; locais atuais preservados; catálogo novo sem duplicatas em reexecução.
- Imagens corretas, créditos/licenças visíveis e nenhum depoimento artificial.
- Build e migrações reproduzíveis a partir do Git, health check configurado e restauração ensaiada.

## Entregue nesta etapa

Relatório, prévia editorial, branch Git local, banco Neon separado e configuração Render pronta para preparar o preview. O código de upload recebeu suporte a uma pasta de desenvolvimento. Senhas, dados e serviços de produção não foram alterados. No Neon foram criados somente a branch de desenvolvimento e seu endpoint. A próxima execução depende de conectar Render/Vercel, configurar e validar frontend/API do preview e revisar o conjunto exato a importar; a proposta de 21 locais ainda não é um lote pronto para produção.
