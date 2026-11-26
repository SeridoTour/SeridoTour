# Relatório de testes: backend

Execução: 2026-11-26 11:25:31 (America/Sao_Paulo).

Ambiente: Node v24.15.0; win32/x64.

Total: 102; aprovados: 101; reprovados: 1; pendentes: 0.

Situação da execução: **REPROVADA**.

Testes unitários Jest com banco, cache, JWT, bcrypt e serviços externos substituídos por mocks. Não valida banco real ou endpoints HTTP.

| Caso | Arquivo | Resultado | Duração (ms) |
| --- | --- | --- | ---: |
| BE-DTO \| Validação de entradas reais BE-DTO-01 aceita cadastro com senha forte | tests/backend/validation-upload.spec.ts | passed | 7 |
| BE-DTO \| Validação de entradas reais BE-DTO-02 recusa senha fora da política: abc | tests/backend/validation-upload.spec.ts | passed | 2 |
| BE-DTO \| Validação de entradas reais BE-DTO-02 recusa senha fora da política: senha123 | tests/backend/validation-upload.spec.ts | passed | 1 |
| BE-DTO \| Validação de entradas reais BE-DTO-02 recusa senha fora da política: SENHA! | tests/backend/validation-upload.spec.ts | passed | 1 |
| BE-DTO \| Validação de entradas reais BE-DTO-02 recusa senha fora da política: Senha123 | tests/backend/validation-upload.spec.ts | passed | 1 |
| BE-DTO \| Validação de entradas reais BE-DTO-03 recusa e-mail inválido | tests/backend/validation-upload.spec.ts | passed | 1 |
| BE-DTO \| Validação de entradas reais BE-DTO-04 recusa nota inválida: 0 | tests/backend/validation-upload.spec.ts | passed | 1 |
| BE-DTO \| Validação de entradas reais BE-DTO-04 recusa nota inválida: 6 | tests/backend/validation-upload.spec.ts | passed | 1 |
| BE-DTO \| Validação de entradas reais BE-DTO-04 recusa nota inválida: 2.5 | tests/backend/validation-upload.spec.ts | passed | 1 |
| BE-DTO \| Validação de entradas reais BE-DTO-05 aceita limite de nota: 1 | tests/backend/validation-upload.spec.ts | passed | 1 |
| BE-DTO \| Validação de entradas reais BE-DTO-05 aceita limite de nota: 5 | tests/backend/validation-upload.spec.ts | passed | 1 |
| BE-DTO \| Validação de entradas reais BE-DTO-06 transforma parâmetros de paginação de texto para número | tests/backend/validation-upload.spec.ts | passed | 1 |
| BE-DTO \| Validação de entradas reais BE-DTO-07 recusa paginação inválida: {"page":0} | tests/backend/validation-upload.spec.ts | passed | 1 |
| BE-DTO \| Validação de entradas reais BE-DTO-07 recusa paginação inválida: {"limit":-1} | tests/backend/validation-upload.spec.ts | passed | 1 |
| BE-DTO \| Validação de entradas reais BE-DTO-08 recusa coordenadas fora dos limites: {"latitude":91,"longitude":0} | tests/backend/validation-upload.spec.ts | passed | 1 |
| BE-DTO \| Validação de entradas reais BE-DTO-08 recusa coordenadas fora dos limites: {"latitude":0,"longitude":-181} | tests/backend/validation-upload.spec.ts | passed | 1 |
| BE-DTO \| Validação de entradas reais BE-DTO-09 recusa duração de roteiro menor que um dia | tests/backend/validation-upload.spec.ts | passed | 1 |
| BE-DTO \| Validação de entradas reais BE-DTO-10 exige pelo menos um destino no roteiro | tests/backend/validation-upload.spec.ts | failed | 3 |
| BE-UPLOAD \| Conteúdo e tamanho de imagens BE-UPLOAD-01 reconhece assinatura de JPEG | tests/backend/validation-upload.spec.ts | passed | 0 |
| BE-UPLOAD \| Conteúdo e tamanho de imagens BE-UPLOAD-01 reconhece assinatura de PNG | tests/backend/validation-upload.spec.ts | passed | 1 |
| BE-UPLOAD \| Conteúdo e tamanho de imagens BE-UPLOAD-01 reconhece assinatura de WEBP | tests/backend/validation-upload.spec.ts | passed | 0 |
| BE-UPLOAD \| Conteúdo e tamanho de imagens BE-UPLOAD-02 recusa conteúdo inválido: vazio | tests/backend/validation-upload.spec.ts | passed | 10 |
| BE-UPLOAD \| Conteúdo e tamanho de imagens BE-UPLOAD-02 recusa conteúdo inválido: truncado | tests/backend/validation-upload.spec.ts | passed | 1 |
| BE-UPLOAD \| Conteúdo e tamanho de imagens BE-UPLOAD-02 recusa conteúdo inválido: texto disfarçado | tests/backend/validation-upload.spec.ts | passed | 1 |
| BE-UPLOAD \| Conteúdo e tamanho de imagens BE-UPLOAD-03 permite não enviar a imagem opcional | tests/backend/validation-upload.spec.ts | passed | 1 |
| BE-UPLOAD \| Conteúdo e tamanho de imagens BE-UPLOAD-04 aceita exatamente o tamanho máximo | tests/backend/validation-upload.spec.ts | passed | 1 |
| BE-UPLOAD \| Conteúdo e tamanho de imagens BE-UPLOAD-05 bloqueia imagem acima de 5 MB | tests/backend/validation-upload.spec.ts | passed | 1 |
| BE-PLACE \| Destinos turísticos BE-PLACE-01 cria destino sem imagem e invalida cache | tests/backend/places-reviews.spec.ts | passed | 3 |
| BE-PLACE \| Destinos turísticos BE-PLACE-02 salva a URL retornada pelo upload | tests/backend/places-reviews.spec.ts | passed | 1 |
| BE-PLACE \| Destinos turísticos BE-PLACE-03 não grava nem limpa cache quando o upload falha | tests/backend/places-reviews.spec.ts | passed | 8 |
| BE-PLACE \| Destinos turísticos BE-PLACE-04 pagina e filtra categoria ignorando maiúsculas | tests/backend/places-reviews.spec.ts | passed | 1 |
| BE-PLACE \| Destinos turísticos BE-PLACE-05 retorna página vazia com os padrões de paginação | tests/backend/places-reviews.spec.ts | passed | 1 |
| BE-PLACE \| Destinos turísticos BE-PLACE-06 informa destino inexistente | tests/backend/places-reviews.spec.ts | passed | 1 |
| BE-PLACE \| Destinos turísticos BE-PLACE-07 preserva a imagem anterior na edição sem arquivo | tests/backend/places-reviews.spec.ts | passed | 1 |
| BE-PLACE \| Destinos turísticos BE-PLACE-08 substitui imagem na edição com arquivo | tests/backend/places-reviews.spec.ts | passed | 1 |
| BE-PLACE \| Destinos turísticos BE-PLACE-09 remove destino e invalida cache | tests/backend/places-reviews.spec.ts | passed | 1 |
| BE-PLACE \| Destinos turísticos BE-PLACE-10 impede update de destino inexistente | tests/backend/places-reviews.spec.ts | passed | 0 |
| BE-PLACE \| Destinos turísticos BE-PLACE-10 impede remove de destino inexistente | tests/backend/places-reviews.spec.ts | passed | 0 |
| BE-REVIEW \| Avaliações BE-REVIEW-01 verifica o destino antes de enviar imagem | tests/backend/places-reviews.spec.ts | passed | 1 |
| BE-REVIEW \| Avaliações BE-REVIEW-02 associa avaliação ao autor autenticado e limpa cache | tests/backend/places-reviews.spec.ts | passed | 1 |
| BE-REVIEW \| Avaliações BE-REVIEW-03 associa imagem à avaliação | tests/backend/places-reviews.spec.ts | passed | 0 |
| BE-REVIEW \| Avaliações BE-REVIEW-04 lista somente avaliações do destino em ordem recente | tests/backend/places-reviews.spec.ts | passed | 0 |
| ItinerariesService — máquina de estados listagens lista apenas roteiros publicados para turistas | tests/backend/regressoes-existentes.spec.ts | passed | 1 |
| ItinerariesService — máquina de estados listagens lista todos os roteiros para guias | tests/backend/regressoes-existentes.spec.ts | passed | 1 |
| ItinerariesService — máquina de estados listagens a listagem pública filtra somente publicados | tests/backend/regressoes-existentes.spec.ts | passed | 0 |
| ItinerariesService — máquina de estados edição retorna 409 ao tentar editar roteiro em análise | tests/backend/regressoes-existentes.spec.ts | passed | 1 |
| ItinerariesService — máquina de estados edição permite editar roteiro em rascunho do próprio autor | tests/backend/regressoes-existentes.spec.ts | passed | 0 |
| ItinerariesService — máquina de estados edição bloqueia edição de roteiro de outro autor | tests/backend/regressoes-existentes.spec.ts | passed | 0 |
| ItinerariesService — máquina de estados transições envia rascunho para análise | tests/backend/regressoes-existentes.spec.ts | passed | 0 |
| ItinerariesService — máquina de estados transições reenvia roteiro rejeitado para análise | tests/backend/regressoes-existentes.spec.ts | passed | 1 |
| ItinerariesService — máquina de estados transições impede envio para análise de roteiro já publicado | tests/backend/regressoes-existentes.spec.ts | passed | 0 |
| ItinerariesService — máquina de estados transições publica roteiro em análise | tests/backend/regressoes-existentes.spec.ts | passed | 0 |
| ItinerariesService — máquina de estados transições impede publicar roteiro que não está em análise | tests/backend/regressoes-existentes.spec.ts | passed | 1 |
| ItinerariesService — máquina de estados transições rejeita roteiro em análise com motivo | tests/backend/regressoes-existentes.spec.ts | passed | 0 |
| ItinerariesService — máquina de estados transições despublica roteiro publicado | tests/backend/regressoes-existentes.spec.ts | passed | 0 |
| WeatherService deve retornar dados normalizados em caso de sucesso | tests/backend/regressoes-existentes.spec.ts | passed | 12 |
| WeatherService não deve lançar exceção e deve retornar success:false em caso de timeout | tests/backend/regressoes-existentes.spec.ts | passed | 82 |
| WeatherService não deve lançar exceção e deve retornar success:false em caso de erro 404 | tests/backend/regressoes-existentes.spec.ts | passed | 3 |
| WeatherService não deve lançar exceção e deve retornar success:false em caso de falha de conexão | tests/backend/regressoes-existentes.spec.ts | passed | 2 |
| sanitizeForLog deve redigir campos sensíveis conhecidos | tests/backend/regressoes-existentes.spec.ts | passed | 1 |
| sanitizeForLog deve funcionar recursivamente em arrays e objetos aninhados | tests/backend/regressoes-existentes.spec.ts | passed | 0 |
| sanitizeForLog não deve quebrar com valores nulos ou undefined | tests/backend/regressoes-existentes.spec.ts | passed | 1 |
| BE-AUTH \| Autenticação BE-AUTH-01 aceita senha válida e remove a senha da resposta | tests/backend/auth-users.spec.ts | passed | 2 |
| BE-AUTH \| Autenticação BE-AUTH-02 recusa senha incorreta | tests/backend/auth-users.spec.ts | passed | 0 |
| BE-AUTH \| Autenticação BE-AUTH-03 propaga usuário inexistente sem comparar senha | tests/backend/auth-users.spec.ts | passed | 1 |
| BE-AUTH \| Autenticação BE-AUTH-04 assina identidade e persiste o token antes de retornar | tests/backend/auth-users.spec.ts | passed | 1 |
| BE-AUTH \| Autenticação BE-AUTH-05 não entrega o token quando a persistência falha | tests/backend/auth-users.spec.ts | passed | 11 |
| BE-USER \| Cadastro e consulta de usuários BE-USER-01 impede e-mail duplicado antes de gravar | tests/backend/auth-users.spec.ts | passed | 1 |
| BE-USER \| Cadastro e consulta de usuários BE-USER-02 impede nome de usuário duplicado | tests/backend/auth-users.spec.ts | passed | 5 |
| BE-USER \| Cadastro e consulta de usuários BE-USER-03 cadastra USER com código undefined e guarda somente hash | tests/backend/auth-users.spec.ts | passed | 1 |
| BE-USER \| Cadastro e consulta de usuários BE-USER-03 cadastra USER com código codigo-incorreto e guarda somente hash | tests/backend/auth-users.spec.ts | passed | 1 |
| BE-USER \| Cadastro e consulta de usuários BE-USER-04 atribui GUIA somente com o código configurado | tests/backend/auth-users.spec.ts | passed | 1 |
| BE-USER \| Cadastro e consulta de usuários BE-USER-05 findOne informa usuário inexistente | tests/backend/auth-users.spec.ts | passed | 0 |
| BE-USER \| Cadastro e consulta de usuários BE-USER-05 findById informa usuário inexistente | tests/backend/auth-users.spec.ts | passed | 1 |
| BE-USER \| Cadastro e consulta de usuários BE-USER-06 findOne consulta pela chave correta | tests/backend/auth-users.spec.ts | passed | 12 |
| BE-USER \| Cadastro e consulta de usuários BE-USER-06 findById consulta pela chave correta | tests/backend/auth-users.spec.ts | passed | 0 |
| BE-TOKEN \| Persistência e renovação BE-TOKEN-01 cria token quando o usuário ainda não tem sessão | tests/backend/token-roles.spec.ts | passed | 1 |
| BE-TOKEN \| Persistência e renovação BE-TOKEN-02 substitui o token da sessão existente | tests/backend/token-roles.spec.ts | passed | 1 |
| BE-TOKEN \| Persistência e renovação BE-TOKEN-03 renova a sessão do titular do token | tests/backend/token-roles.spec.ts | passed | 1 |
| BE-TOKEN \| Persistência e renovação BE-TOKEN-04 retorna 401 para token desconhecido | tests/backend/token-roles.spec.ts | passed | 1 |
| BE-ROLE \| Autorização por perfil BE-ROLE-01 permite rota sem restrição de perfil | tests/backend/token-roles.spec.ts | passed | 1 |
| BE-ROLE \| Autorização por perfil BE-ROLE-02 permite GUIA em rota de guia | tests/backend/token-roles.spec.ts | passed | 1 |
| BE-ROLE \| Autorização por perfil BE-ROLE-03 bloqueia USER em rota de guia | tests/backend/token-roles.spec.ts | passed | 0 |
| BE-ITIN \| Roteiros, autoria e moderação BE-ITIN-01 cria rascunho com autor e destinos associados | tests/backend/itineraries.spec.ts | passed | 2 |
| BE-ITIN \| Roteiros, autoria e moderação BE-ITIN-02 recusa criação por usuário inexistente | tests/backend/itineraries.spec.ts | passed | 0 |
| BE-ITIN \| Roteiros, autoria e moderação BE-ITIN-03 lista somente os roteiros do autor na consulta pessoal | tests/backend/itineraries.spec.ts | passed | 1 |
| BE-ITIN \| Roteiros, autoria e moderação BE-ITIN-04 bloqueia leitura de rascunho alheio | tests/backend/itineraries.spec.ts | passed | 0 |
| BE-ITIN \| Roteiros, autoria e moderação BE-ITIN-05 permite leitura de roteiro publicado por outro turista | tests/backend/itineraries.spec.ts | passed | 0 |
| BE-ITIN \| Roteiros, autoria e moderação BE-ITIN-06 esconde roteiro RASCUNHO na consulta pública | tests/backend/itineraries.spec.ts | passed | 1 |
| BE-ITIN \| Roteiros, autoria e moderação BE-ITIN-06 esconde roteiro REJEITADO na consulta pública | tests/backend/itineraries.spec.ts | passed | 0 |
| BE-ITIN \| Roteiros, autoria e moderação BE-ITIN-06 esconde roteiro EM_ANALISE na consulta pública | tests/backend/itineraries.spec.ts | passed | 1 |
| BE-ITIN \| Roteiros, autoria e moderação BE-ITIN-07 retorna detalhe público de roteiro publicado | tests/backend/itineraries.spec.ts | passed | 0 |
| BE-ITIN \| Roteiros, autoria e moderação BE-ITIN-08 informa roteiro inexistente | tests/backend/itineraries.spec.ts | passed | 1 |
| BE-ITIN \| Roteiros, autoria e moderação BE-ITIN-09 substitui a seleção de locais na edição | tests/backend/itineraries.spec.ts | passed | 1 |
| BE-ITIN \| Roteiros, autoria e moderação BE-ITIN-10 impede guia de enviar roteiro de outro autor para análise | tests/backend/itineraries.spec.ts | passed | 1 |
| BE-ITIN \| Roteiros, autoria e moderação BE-ITIN-11 impede reenviar roteiro já em análise | tests/backend/itineraries.spec.ts | passed | 1 |
| BE-ITIN \| Roteiros, autoria e moderação BE-ITIN-12 impede transição reject a partir de rascunho | tests/backend/itineraries.spec.ts | passed | 1 |
| BE-ITIN \| Roteiros, autoria e moderação BE-ITIN-12 impede transição unpublish a partir de rascunho | tests/backend/itineraries.spec.ts | passed | 1 |
| BE-ITIN \| Roteiros, autoria e moderação BE-ITIN-13 normaliza motivo de rejeição   Ajustar descrição   | tests/backend/itineraries.spec.ts | passed | 1 |
| BE-ITIN \| Roteiros, autoria e moderação BE-ITIN-13 normaliza motivo de rejeição     | tests/backend/itineraries.spec.ts | passed | 0 |
| BE-ITIN \| Roteiros, autoria e moderação BE-ITIN-13 normaliza motivo de rejeição undefined | tests/backend/itineraries.spec.ts | passed | 1 |
| BE-ITIN \| Roteiros, autoria e moderação BE-ITIN-14 remove roteiro existente e limpa cache | tests/backend/itineraries.spec.ts | passed | 4 |

## BE-DTO | Validação de entradas reais BE-DTO-10 exige pelo menos um destino no roteiro

```text
Error: expect(received).toContain(expected) // indexOf

Expected value: "placeIds"
Received array: []
    at Object.<anonymous> (C:\Users\Karas\Documents\Projetos\Pessoais\NortheasTour\tests\backend\validation-upload.spec.ts:53:66)
```
