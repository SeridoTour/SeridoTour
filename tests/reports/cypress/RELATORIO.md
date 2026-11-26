# Relatório de testes: cypress

Execução: 2026-11-26 16:02:44 (America/Sao_Paulo).

Ambiente: Node v24.15.0; win32/x64.

Total: 23; aprovados: 23; reprovados: 0; pendentes: 0.

Situação da execução: **APROVADA**.

Fluxos de interface em Electron headless, com a aplicação Vue real servida pelo Vite. API interceptada com fixtures e tokens fictícios; não valida integração com NestJS, PostgreSQL ou provedores externos.

| Caso | Arquivo | Resultado | Duração (ms) |
| --- | --- | --- | ---: |
| CY-AUTH \| Entrada, cadastro e rotas protegidas › CY-AUTH-01 encaminha visitante ao login preservando destino | frontend/e2e/auth.cy.js | passed | 771 |
| CY-AUTH \| Entrada, cadastro e rotas protegidas › CY-AUTH-02 exibe erro de credenciais sem sair do login | frontend/e2e/auth.cy.js | passed | 1309 |
| CY-AUTH \| Entrada, cadastro e rotas protegidas › CY-AUTH-03 autentica usando a resposta atual do back-end e retorna ao destino | frontend/e2e/auth.cy.js | passed | 1065 |
| CY-AUTH \| Entrada, cadastro e rotas protegidas › CY-AUTH-04 impede turista de acessar cadastro exclusivo de guia | frontend/e2e/auth.cy.js | passed | 688 |
| CY-AUTH \| Entrada, cadastro e rotas protegidas › CY-AUTH-05 cadastra usuário antes de autenticar | frontend/e2e/auth.cy.js | passed | 1457 |
| CY-AUTH \| Entrada, cadastro e rotas protegidas › CY-AUTH-10 cadastra guia enviando o código somente quando selecionado | frontend/e2e/auth.cy.js | passed | 2052 |
| CY-AUTH \| Entrada, cadastro e rotas protegidas › CY-AUTH-11 mantém o formulário quando o código é recusado | frontend/e2e/auth.cy.js | passed | 1795 |
| CY-AUTH \| Entrada, cadastro e rotas protegidas › CY-AUTH-06 recusa sessão expirada em rota protegida | frontend/e2e/auth.cy.js | passed | 302 |
| CY-AUTH \| Entrada, cadastro e rotas protegidas › CY-AUTH-07 permite guia acessar cadastro de destino | frontend/e2e/auth.cy.js | passed | 388 |
| CY-AUTH \| Entrada, cadastro e rotas protegidas › CY-AUTH-08 renova após 401 e repete a consulta com o token novo | frontend/e2e/auth.cy.js | passed | 413 |
| CY-AUTH \| Entrada, cadastro e rotas protegidas › CY-AUTH-09 encerra sessão revogada e retorna ao login | frontend/e2e/auth.cy.js | passed | 593 |
| CY-DEST \| Exploração de destinos › CY-DEST-01 apresenta os destinos retornados pela API | frontend/e2e/destinations.cy.js | passed | 755 |
| CY-DEST \| Exploração de destinos › CY-DEST-02 filtra por categoria e restaura todos | frontend/e2e/destinations.cy.js | passed | 555 |
| CY-DEST \| Exploração de destinos › CY-DEST-03 busca cidade sem exigir acentos | frontend/e2e/destinations.cy.js | passed | 707 |
| CY-DEST \| Exploração de destinos › CY-DEST-04 mostra estado vazio quando a busca não encontra destinos | frontend/e2e/destinations.cy.js | passed | 487 |
| CY-DEST \| Exploração de destinos › CY-DEST-05 informa falha de API e permite tentar novamente | frontend/e2e/destinations.cy.js | passed | 443 |
| CY-DEST \| Exploração de destinos › CY-DEST-06 mantém favorito após recarregar a página | frontend/e2e/destinations.cy.js | passed | 870 |
| CY-DEST \| Exploração de destinos › CY-DEST-07 pagina destinos e redefine a página ao filtrar | frontend/e2e/destinations.cy.js | passed | 761 |
| CY-ITIN \| Criação e edição de roteiros › CY-ITIN-01 exige ao menos um destino antes de chamar a API | frontend/e2e/itineraries.cy.js | passed | 1701 |
| CY-ITIN \| Criação e edição de roteiros › CY-ITIN-02 envia dados do formulário e mostra o roteiro salvo | frontend/e2e/itineraries.cy.js | passed | 1668 |
| CY-ITIN \| Criação e edição de roteiros › CY-ITIN-03 bloqueia edição de roteiro em análise | frontend/e2e/itineraries.cy.js | passed | 303 |
| CY-ITIN \| Criação e edição de roteiros › CY-ITIN-04 bloqueia edição de roteiro de outro autor | frontend/e2e/itineraries.cy.js | passed | 310 |
| CY-ITIN \| Criação e edição de roteiros › CY-ITIN-05 apresenta falha ao salvar e mantém os dados preenchidos | frontend/e2e/itineraries.cy.js | passed | 1489 |
