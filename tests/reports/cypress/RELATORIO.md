# Relatório de testes: cypress

Execução: 2026-11-26 12:28:36 (America/Sao_Paulo).

Ambiente: Node v24.15.0; win32/x64.

Total: 21; aprovados: 21; reprovados: 0; pendentes: 0.

Situação da execução: **APROVADA**.

Fluxos de interface em Electron headless, com a aplicação Vue real servida pelo Vite. API interceptada com fixtures e tokens fictícios; não valida integração com NestJS, PostgreSQL ou provedores externos.

| Caso | Arquivo | Resultado | Duração (ms) |
| --- | --- | --- | ---: |
| CY-AUTH \| Entrada, cadastro e rotas protegidas › CY-AUTH-01 encaminha visitante ao login preservando destino | frontend/e2e/auth.cy.js | passed | 943 |
| CY-AUTH \| Entrada, cadastro e rotas protegidas › CY-AUTH-02 exibe erro de credenciais sem sair do login | frontend/e2e/auth.cy.js | passed | 1385 |
| CY-AUTH \| Entrada, cadastro e rotas protegidas › CY-AUTH-03 autentica usando a resposta atual do back-end e retorna ao destino | frontend/e2e/auth.cy.js | passed | 1329 |
| CY-AUTH \| Entrada, cadastro e rotas protegidas › CY-AUTH-04 impede turista de acessar cadastro exclusivo de guia | frontend/e2e/auth.cy.js | passed | 745 |
| CY-AUTH \| Entrada, cadastro e rotas protegidas › CY-AUTH-05 cadastra usuário antes de autenticar | frontend/e2e/auth.cy.js | passed | 1560 |
| CY-AUTH \| Entrada, cadastro e rotas protegidas › CY-AUTH-06 recusa sessão expirada em rota protegida | frontend/e2e/auth.cy.js | passed | 312 |
| CY-AUTH \| Entrada, cadastro e rotas protegidas › CY-AUTH-07 permite guia acessar cadastro de destino | frontend/e2e/auth.cy.js | passed | 413 |
| CY-AUTH \| Entrada, cadastro e rotas protegidas › CY-AUTH-08 renova após 401 e repete a consulta com o token novo | frontend/e2e/auth.cy.js | passed | 514 |
| CY-AUTH \| Entrada, cadastro e rotas protegidas › CY-AUTH-09 encerra sessão revogada e retorna ao login | frontend/e2e/auth.cy.js | passed | 618 |
| CY-DEST \| Exploração de destinos › CY-DEST-01 apresenta os destinos retornados pela API | frontend/e2e/destinations.cy.js | passed | 847 |
| CY-DEST \| Exploração de destinos › CY-DEST-02 filtra por categoria e restaura todos | frontend/e2e/destinations.cy.js | passed | 588 |
| CY-DEST \| Exploração de destinos › CY-DEST-03 busca cidade sem exigir acentos | frontend/e2e/destinations.cy.js | passed | 615 |
| CY-DEST \| Exploração de destinos › CY-DEST-04 mostra estado vazio quando a busca não encontra destinos | frontend/e2e/destinations.cy.js | passed | 344 |
| CY-DEST \| Exploração de destinos › CY-DEST-05 informa falha de API e permite tentar novamente | frontend/e2e/destinations.cy.js | passed | 538 |
| CY-DEST \| Exploração de destinos › CY-DEST-06 mantém favorito após recarregar a página | frontend/e2e/destinations.cy.js | passed | 980 |
| CY-DEST \| Exploração de destinos › CY-DEST-07 pagina destinos e redefine a página ao filtrar | frontend/e2e/destinations.cy.js | passed | 663 |
| CY-ITIN \| Criação e edição de roteiros › CY-ITIN-01 exige ao menos um destino antes de chamar a API | frontend/e2e/itineraries.cy.js | passed | 1888 |
| CY-ITIN \| Criação e edição de roteiros › CY-ITIN-02 envia dados do formulário e mostra o roteiro salvo | frontend/e2e/itineraries.cy.js | passed | 2209 |
| CY-ITIN \| Criação e edição de roteiros › CY-ITIN-03 bloqueia edição de roteiro em análise | frontend/e2e/itineraries.cy.js | passed | 451 |
| CY-ITIN \| Criação e edição de roteiros › CY-ITIN-04 bloqueia edição de roteiro de outro autor | frontend/e2e/itineraries.cy.js | passed | 591 |
| CY-ITIN \| Criação e edição de roteiros › CY-ITIN-05 apresenta falha ao salvar e mantém os dados preenchidos | frontend/e2e/itineraries.cy.js | passed | 1765 |
