# Plano de testes — NortheasTour / SeridóTour

## Objetivo e estratégia

Verificar regras de negócio do back-end NestJS, comportamento do front-end Vue 3 e fluxos de navegação, entregando códigos executáveis e evidência individual de execução.

| Camada | Ferramentas | Tipo | Isolamento |
| --- | --- | --- | --- |
| Back-end | Jest, ts-jest, class-validator e Nest Testing | Unitário de serviços, autorização, DTOs e upload | Prisma, cache, bcrypt, assinatura JWT, upload e HTTP externo simulados |
| Front-end | Jest, Vue Test Utils, jsdom e Pinia | Unitário de stores, utilitários e serviços; teste de componente Vue | Cliente HTTP simulado; armazenamento local jsdom; API de dialog simulada |
| Front-end no navegador | Cypress / Electron headless e Vite | Fluxos funcionais de interface | Aplicação real; API interceptada e fixtures locais; tokens fictícios |

Os testes devem incluir cenários positivos, negativos e limites. Asserções verificam respostas, alterações observáveis e ausência de gravações ou uploads quando a operação deve ser bloqueada. Não são feitos snapshots de implementação.

## Pré-condições e dados

- Dependências instaladas a partir do `package-lock.json` da raiz com `npm ci`.
- Prisma Client gerado automaticamente pelo executor do back-end, sem banco real.
- Porta 4175 disponível para o Vite utilizado pelo Cypress.
- Navegador Electron do Cypress instalado; sem necessidade de credenciais pessoais.
- Dados fictícios: Ana (`ana@example.test`), perfis `USER` e `GUIA`, código de guia de teste e JWTs sem assinatura real.
- Destinos: Açude do Seridó / Caicó / Natureza e Museu do Sertão / Currais Novos / Histórico. UUIDs v4 fixos nas fixtures.
- Roteiros em `RASCUNHO`, `EM_ANALISE`, `PUBLICADO` e `REJEITADO`; notas 1 e 5 válidas; 0, 6 e 2,5 inválidas.
- Cada caso começa com mocks ou localStorage reinicializados; a persistência só é preservada dentro de casos que a verificam.

## 1. Back-end — códigos e resultados esperados

| Código / arquivo | Cenários | Resultado esperado |
| --- | --- | --- |
| BE-AUTH-01 a 05 — `backend/auth-users.spec.ts` | Senha correta, senha incorreta, usuário ausente, emissão e persistência de token, falha de persistência | Retirar senha da resposta; rejeitar credenciais inválidas; assinar identidade correta; não retornar sucesso se a gravação falhar |
| BE-USER-01 a 06 — `backend/auth-users.spec.ts` | E-mail e nome duplicados; código de guia ausente, incorreto ou correto; consultas por ID/e-mail | Bloquear duplicidades; armazenar hash; selecionar USER ou GUIA conforme o código; informar ausência do usuário |
| BE-TOKEN-01 a 04 — `backend/token-roles.spec.ts` | Primeiro token, substituição, renovação e token desconhecido | Criar ou atualizar sessão do titular; renovar via autenticação; retornar 401 para token desconhecido |
| BE-ROLE-01 a 03 — `backend/token-roles.spec.ts` | Rota livre, GUIA autorizado e USER não autorizado | Liberar acesso permitido e negar acesso restrito |
| BE-PLACE-01 a 03 — `backend/places-reviews.spec.ts` | Cadastro sem imagem, com imagem e upload indisponível | Persistir dados/URL e invalidar cache após sucesso; não gravar em falha de upload |
| BE-PLACE-04 a 06 — mesmo arquivo | Página 2, categoria, resultado vazio e ID inexistente | Calcular offset e total de páginas; filtrar categoria sem distinguir maiúsculas; informar ausência |
| BE-PLACE-07 a 10 — mesmo arquivo | Edição com/sem imagem, exclusão e destino inexistente | Preservar ou trocar imagem; invalidar cache; impedir gravação e upload para destino ausente |
| BE-REVIEW-01 a 04 — mesmo arquivo | Destino inexistente, criação sem/com imagem e listagem | Validar destino antes do upload; vincular autor; limpar cache; listar apenas avaliações do destino por data decrescente |
| BE-ITIN-01 a 05 — `backend/itineraries.spec.ts` | Cadastro de rascunho, autor inexistente, lista pessoal, leitura de rascunho alheio e leitura de publicado | Associar locais e autor; impedir criação/leitura indevida; filtrar a lista pessoal |
| BE-ITIN-06 a 08 — mesmo arquivo | Consulta pública por status e ID ausente | Exibir somente publicados; devolver ausência para rascunho, rejeitado e em análise |
| BE-ITIN-09 a 14 — mesmo arquivo | Substituição de destinos, envio por outro autor, reenvio em análise, transições inválidas, motivo da rejeição e exclusão | Atualizar seleção; bloquear transições inválidas sem gravar; normalizar motivo; invalidar cache após sucesso |
| BE-DTO-01 a 03 — `backend/validation-upload.spec.ts` | Cadastro válido, senhas fracas e e-mail inválido | Aceitar dados válidos e rejeitar os campos incompatíveis com a política |
| BE-DTO-04 a 05 — mesmo arquivo | Notas 0, 6, 2,5, 1 e 5 | Aceitar somente inteiros de 1 a 5 |
| BE-DTO-06 a 08 — mesmo arquivo | Conversão de paginação, página/limite inválidos e coordenadas além dos limites | Converter query de texto em número; rejeitar valores menores que 1 e coordenadas inválidas |
| BE-DTO-09 a 10 — mesmo arquivo | Duração zero e lista de locais vazia | Rejeitar duração menor que 1 e roteiro sem destinos; BE-DTO-10 registra divergência existente |
| BE-UPLOAD-01 a 05 — mesmo arquivo | Assinaturas JPEG/PNG/WEBP, arquivo vazio/disfarçado, imagem opcional, exatamente 5 MB e acima do limite | Reconhecer assinaturas; rejeitar conteúdo inválido e excesso de tamanho; permitir ausência e tamanho no limite |
| Regressões existentes — `backend/regressoes-existentes.spec.ts` | Listagens, edição e transições de roteiros; clima com sucesso, timeout, 404 e conexão recusada; sanitização recursiva de logs | Manter as regras anteriormente testadas, tratar falhas do provedor e ocultar campos sensíveis |

Permissões exclusivas de guia para moderação também dependem dos guards dos endpoints. A suíte verifica o guard e o serviço separadamente; não comprova a composição HTTP dos decorators e guards nos controllers.

## 2. Front-end — Jest e resultados esperados

| Código / arquivo | Cenários | Resultado esperado |
| --- | --- | --- |
| FE-FORMAT-01 a 02 — `frontend/unit/format.spec.ts` | Busca sem acentos/maiúsculas e iniciais com espaços | Normalizar busca; gerar até duas iniciais |
| FE-FORMAT-03 a 05 — mesmo arquivo | Erros da API em texto/lista e erro desconhecido | Exibir mensagem recebida ou fallback adequado |
| FE-FORMAT-06 a 08 — mesmo arquivo | URL ausente/inválida/HTTPS/relativa e data em português | Usar imagem padrão ou URL esperada; formatar data em pt-BR |
| FE-FAV-01 a 04 — `frontend/unit/stores.spec.ts` | Estado inicial, JSON inválido, IDs inválidos, adicionar/remover e reinicializar store | Recuperar armazenamento inválido; persistir favoritos sem misturar destinos e roteiros |
| FE-PREF-01 a 02 — mesmo arquivo | Mapa visível por padrão e preferência salva | Restaurar e persistir alteração da preferência |
| FE-AUTH-01 a 03 — mesmo arquivo | Visitante, JWT com nome Unicode, perfil e tokens inválidos/expirados | Expor identidade/perfil válidos; recusar sessão inválida |
| FE-AUTH-04 a 05 — mesmo arquivo | Login e cadastro seguido de login | Enviar payload correto; guardar sessão e e-mail |
| FE-AUTH-06 a 10 — mesmo arquivo | Renovação sem token, resposta com dois tokens, resposta incompleta, agendamento e logout | Evitar chamada sem token; atualizar sessão válida; limpar sessão em resposta incompleta; renovar 30 s antes de expirar; cancelar no logout |
| FE-API-01 a 03 — `frontend/unit/services.spec.ts` | Paginação, extração de lista e multipart com/sem ID | Usar parâmetros e método GET/POST/PATCH corretos |
| FE-API-04 a 09 — mesmo arquivo | Escopos de roteiro, detalhe público/privado, salvar, transições, falha e exclusão | Selecionar endpoints corretos; enviar motivo; propagar erro ao consumidor |
| FE-COMP-01 — `frontend/unit/components.spec.ts` | Nota 3,6 | Informar nota em aria-label e preencher quatro estrelas |
| FE-COMP-02 a 05 — mesmo arquivo | Abrir/fechar modal, confirmar, cancelar, processamento e Escape | Sincronizar abertura; emitir eventos; impedir botões e cancelamento durante processamento |
| FE-COMP-06 — mesmo arquivo | Cartão de destino, foco, link e favorito | Apresentar dados; navegar ao ID correto; emitir seleção; alternar estado acessível e store |

## 3. Front-end — Cypress e resultados esperados

| Código | Ação / entrada | Resultado esperado |
| --- | --- | --- |
| CY-AUTH-01 | Visitante abre `/roteiros/new` | Login com parâmetro de retorno para a rota original |
| CY-AUTH-02 | API responde 401 ao login | Mensagem de credenciais inválidas; manter login; liberar botão |
| CY-AUTH-03 | Login retorna somente access_token, como a API atual | Concluir login inicial e retornar à criação de roteiro |
| CY-AUTH-04 | USER abre `/places/new` | Redirecionar para a página inicial |
| CY-AUTH-05 | Enviar cadastro válido | Cadastrar, autenticar e abrir roteiros pessoais |
| CY-AUTH-06 | Abrir rota protegida com JWT expirado | Redirecionar para login |
| CY-AUTH-07 | GUIA abre `/places/new` | Exibir formulário de cadastro |
| CY-DEST-01 | API retorna dois destinos | Exibir dois cartões com os nomes esperados |
| CY-DEST-02 | Escolher Histórico e depois Todos | Filtrar um destino e restaurar a lista |
| CY-DEST-03 | Buscar `caico` | Encontrar Açude do Seridó, em Caicó |
| CY-DEST-04 | Buscar termo inexistente | Exibir estado vazio sem cartões |
| CY-DEST-05 | API falha com 503 e se recupera | Exibir erro e recarregar ao tentar novamente |
| CY-DEST-06 | Adicionar favorito e recarregar | Manter favorito e permitir removê-lo |
| CY-DEST-07 | Carregar sete destinos, paginar e filtrar | Mostrar seis/um cartões; reiniciar página ao filtrar |
| CY-ITIN-01 | Salvar roteiro sem escolher local | Exibir erro e não chamar a API de criação |
| CY-ITIN-02 | Preencher roteiro e selecionar local | Enviar payload correto, navegar ao detalhe e mostrar título |
| CY-ITIN-03 | Abrir edição de roteiro em análise | Exibir bloqueio e ocultar formulário |
| CY-ITIN-04 | Abrir edição de roteiro alheio como USER | Exibir bloqueio de autoria e ocultar formulário |
| CY-ITIN-05 | API falha ao salvar roteiro | Mostrar erro, preservar formulário e liberar botão |

Arquivos: `frontend/e2e/auth.cy.js`, `destinations.cy.js` e `itineraries.cy.js`.

## Execução, evidências e critérios de saída

1. Executar `npm test` na raiz. Para investigar uma camada, usar os comandos individuais descritos no [README](README.md).
2. Registrar em `reports/<suíte>/results.json` e `RELATORIO.md` cada caso, resultado, duração e falha. Atualizar `reports/RELATORIO-GERAL.md` com o consolidado.
3. Examinar cobertura dos arquivos selecionados, declarando esse recorte. Porcentagem de cobertura não substitui validação dos cenários de negócio.
4. Considerar a execução bem-sucedida somente se todos os casos passarem, sem falha de carregamento e sem pendências. O runner completo propaga código de saída de falha.
5. Classificar a reprovação conhecida como defeito de validação: o front-end exige destino e o back-end aceita lista vazia. A entrega de testes está concluída com esse defeito registrado; o critério de aprovação funcional da aplicação permanece pendente até sua correção.

Cada variação de `it.each` é um caso individual nos relatórios. Não há testes desabilitados para ocultar reprovações.

## Próximas etapas de cobertura

Integração HTTP com NestJS e banco isolado; alinhamento e teste integrado de renovação de sessão; upload real em ambiente de testes; validação de constraints e migrações; cenários completos de moderação por guia; testes dos mapas; execução em outros navegadores; auditoria de acessibilidade e desempenho. Essas etapas não foram executadas nesta entrega.
