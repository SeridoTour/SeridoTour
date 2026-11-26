# Relatório de testes: cypress

Execução: 2026-11-26 10:18:55 (America/Sao_Paulo).

Ambiente: Node v24.15.0; win32/x64.

Total: 19; aprovados: 19; reprovados: 0; pendentes: 0.

Situação da execução: **APROVADA**.

Fluxos de interface em Electron headless, com a aplicação Vue real servida pelo Vite. API interceptada com fixtures e tokens fictícios; não valida integração com NestJS, PostgreSQL ou provedores externos.

| Caso | Arquivo | Resultado | Duração (ms) |
| --- | --- | --- | ---: |
| CY-AUTH \| Entrada, cadastro e rotas protegidas › CY-AUTH-01 encaminha visitante ao login preservando destino | frontend/e2e/auth.cy.js | passed | 719 |
| CY-AUTH \| Entrada, cadastro e rotas protegidas › CY-AUTH-02 exibe erro de credenciais sem sair do login | frontend/e2e/auth.cy.js | passed | 1376 |
| CY-AUTH \| Entrada, cadastro e rotas protegidas › CY-AUTH-03 autentica usando a resposta atual do back-end e retorna ao destino | frontend/e2e/auth.cy.js | passed | 1262 |
| CY-AUTH \| Entrada, cadastro e rotas protegidas › CY-AUTH-04 impede turista de acessar cadastro exclusivo de guia | frontend/e2e/auth.cy.js | passed | 806 |
| CY-AUTH \| Entrada, cadastro e rotas protegidas › CY-AUTH-05 cadastra usuário antes de autenticar | frontend/e2e/auth.cy.js | passed | 1581 |
| CY-AUTH \| Entrada, cadastro e rotas protegidas › CY-AUTH-06 recusa sessão expirada em rota protegida | frontend/e2e/auth.cy.js | passed | 266 |
| CY-AUTH \| Entrada, cadastro e rotas protegidas › CY-AUTH-07 permite guia acessar cadastro de destino | frontend/e2e/auth.cy.js | passed | 296 |
| CY-DEST \| Exploração de destinos › CY-DEST-01 apresenta os destinos retornados pela API | frontend/e2e/destinations.cy.js | passed | 611 |
| CY-DEST \| Exploração de destinos › CY-DEST-02 filtra por categoria e restaura todos | frontend/e2e/destinations.cy.js | passed | 476 |
| CY-DEST \| Exploração de destinos › CY-DEST-03 busca cidade sem exigir acentos | frontend/e2e/destinations.cy.js | passed | 582 |
| CY-DEST \| Exploração de destinos › CY-DEST-04 mostra estado vazio quando a busca não encontra destinos | frontend/e2e/destinations.cy.js | passed | 273 |
| CY-DEST \| Exploração de destinos › CY-DEST-05 informa falha de API e permite tentar novamente | frontend/e2e/destinations.cy.js | passed | 392 |
| CY-DEST \| Exploração de destinos › CY-DEST-06 mantém favorito após recarregar a página | frontend/e2e/destinations.cy.js | passed | 832 |
| CY-DEST \| Exploração de destinos › CY-DEST-07 pagina destinos e redefine a página ao filtrar | frontend/e2e/destinations.cy.js | passed | 591 |
| CY-ITIN \| Criação e edição de roteiros › CY-ITIN-01 exige ao menos um destino antes de chamar a API | frontend/e2e/itineraries.cy.js | passed | 1515 |
| CY-ITIN \| Criação e edição de roteiros › CY-ITIN-02 envia dados do formulário e mostra o roteiro salvo | frontend/e2e/itineraries.cy.js | passed | 1743 |
| CY-ITIN \| Criação e edição de roteiros › CY-ITIN-03 bloqueia edição de roteiro em análise | frontend/e2e/itineraries.cy.js | passed | 324 |
| CY-ITIN \| Criação e edição de roteiros › CY-ITIN-04 bloqueia edição de roteiro de outro autor | frontend/e2e/itineraries.cy.js | passed | 253 |
| CY-ITIN \| Criação e edição de roteiros › CY-ITIN-05 apresenta falha ao salvar e mantém os dados preenchidos | frontend/e2e/itineraries.cy.js | passed | 1463 |
