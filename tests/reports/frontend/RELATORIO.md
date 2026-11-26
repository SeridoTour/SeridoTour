# Relatório de testes: frontend

Execução: 2026-11-26 12:25:22 (America/Sao_Paulo).

Ambiente: Node v24.15.0; win32/x64.

Total: 58; aprovados: 58; reprovados: 0; pendentes: 0.

Situação da execução: **APROVADA**.

Testes Jest de stores Pinia, serviços, utilitários e componentes Vue em jsdom. Não valida renderização em navegador real.

| Caso | Arquivo | Resultado | Duração (ms) |
| --- | --- | --- | ---: |
| FE-FAV \| Favoritos persistidos FE-FAV-01 inicia vazio quando não há dados | tests/frontend/unit/stores.spec.ts | passed | 11 |
| FE-FAV \| Favoritos persistidos FE-FAV-02 ignora JSON corrompido | tests/frontend/unit/stores.spec.ts | passed | 2 |
| FE-FAV \| Favoritos persistidos FE-FAV-03 filtra IDs inválidos nos dados salvos | tests/frontend/unit/stores.spec.ts | passed | 3 |
| FE-FAV \| Favoritos persistidos FE-FAV-04 adiciona, persiste e remove favorito sem afetar roteiros | tests/frontend/unit/stores.spec.ts | passed | 12 |
| FE-PREF \| Preferência de mapa FE-PREF-01 exibe mapa por padrão | tests/frontend/unit/stores.spec.ts | passed | 2 |
| FE-PREF \| Preferência de mapa FE-PREF-02 restaura mapa oculto e persiste alteração | tests/frontend/unit/stores.spec.ts | passed | 3 |
| FE-AUTH \| Sessão e perfil FE-AUTH-01 inicia visitante sem sessão | tests/frontend/unit/stores.spec.ts | passed | 3 |
| FE-AUTH \| Sessão e perfil FE-AUTH-02 recupera nome Unicode e perfil GUIA do JWT | tests/frontend/unit/stores.spec.ts | passed | 7 |
| FE-AUTH \| Sessão e perfil FE-AUTH-03 recusa JWT inválido ou expirado 0 | tests/frontend/unit/stores.spec.ts | passed | 3 |
| FE-AUTH \| Sessão e perfil FE-AUTH-03 recusa JWT inválido ou expirado 1 | tests/frontend/unit/stores.spec.ts | passed | 3 |
| FE-AUTH \| Sessão e perfil FE-AUTH-03 recusa JWT inválido ou expirado 2 | tests/frontend/unit/stores.spec.ts | passed | 2 |
| FE-AUTH \| Sessão e perfil FE-AUTH-03 recusa JWT inválido ou expirado 3 | tests/frontend/unit/stores.spec.ts | passed | 7 |
| FE-AUTH \| Sessão e perfil FE-AUTH-04 envia credenciais e guarda e-mail ausente no JWT | tests/frontend/unit/stores.spec.ts | passed | 5 |
| FE-AUTH \| Sessão e perfil FE-AUTH-05 cadastra e autentica em sequência | tests/frontend/unit/stores.spec.ts | passed | 3 |
| FE-AUTH \| Sessão e perfil FE-AUTH-06 não tenta renovar sem sessão | tests/frontend/unit/stores.spec.ts | passed | 2 |
| FE-AUTH \| Sessão e perfil FE-AUTH-07 renova usando somente access_token, conforme o contrato da API | tests/frontend/unit/stores.spec.ts | passed | 3 |
| FE-AUTH \| Sessão e perfil FE-AUTH-08 limpa sessão se a API recusar a renovação | tests/frontend/unit/stores.spec.ts | passed | 2 |
| FE-AUTH \| Sessão e perfil FE-AUTH-09 agenda renovação na expiração do access token | tests/frontend/unit/stores.spec.ts | passed | 9 |
| FE-AUTH \| Sessão e perfil FE-AUTH-10 logout solicita revogação, remove tokens e cancela renovação | tests/frontend/unit/stores.spec.ts | passed | 5 |
| FE-COMP \| Componentes Vue reais FE-COMP-01 exibe nota acessível e arredonda estrelas preenchidas | tests/frontend/unit/components.spec.ts | passed | 50 |
| FE-COMP \| Componentes Vue reais FE-COMP-02 abre e fecha modal ao mudar propriedade open | tests/frontend/unit/components.spec.ts | passed | 18 |
| FE-COMP \| Componentes Vue reais FE-COMP-03 emite confirmação e cancelamento | tests/frontend/unit/components.spec.ts | passed | 16 |
| FE-COMP \| Componentes Vue reais FE-COMP-04 bloqueia botões e Escape durante processamento | tests/frontend/unit/components.spec.ts | passed | 6 |
| FE-COMP \| Componentes Vue reais FE-COMP-05 Escape emite fechamento quando o modal está livre | tests/frontend/unit/components.spec.ts | passed | 6 |
| FE-COMP \| Componentes Vue reais FE-COMP-06 cartão apresenta destino, link e seleção por foco | tests/frontend/unit/components.spec.ts | passed | 39 |
| FE-API \| Contratos dos serviços HTTP FE-API-01 envia os parâmetros de paginação de destinos | tests/frontend/unit/services.spec.ts | passed | 3 |
| FE-API \| Contratos dos serviços HTTP FE-API-02 extrai os destinos da resposta paginada | tests/frontend/unit/services.spec.ts | passed | 2 |
| FE-API \| Contratos dos serviços HTTP FE-API-03 salva multipart de destino com id undefined | tests/frontend/unit/services.spec.ts | passed | 4 |
| FE-API \| Contratos dos serviços HTTP FE-API-03 salva multipart de destino com id p1 | tests/frontend/unit/services.spec.ts | passed | 1 |
| FE-API \| Contratos dos serviços HTTP FE-API-04 consulta escopo public | tests/frontend/unit/services.spec.ts | passed | 1 |
| FE-API \| Contratos dos serviços HTTP FE-API-04 consulta escopo mine | tests/frontend/unit/services.spec.ts | passed | 1 |
| FE-API \| Contratos dos serviços HTTP FE-API-04 consulta escopo all | tests/frontend/unit/services.spec.ts | passed | 2 |
| FE-API \| Contratos dos serviços HTTP FE-API-05 consulta detalhe público=false | tests/frontend/unit/services.spec.ts | passed | 1 |
| FE-API \| Contratos dos serviços HTTP FE-API-05 consulta detalhe público=true | tests/frontend/unit/services.spec.ts | passed | 1 |
| FE-API \| Contratos dos serviços HTTP FE-API-06 salva roteiro com id undefined | tests/frontend/unit/services.spec.ts | passed | 1 |
| FE-API \| Contratos dos serviços HTTP FE-API-06 salva roteiro com id i1 | tests/frontend/unit/services.spec.ts | passed | 1 |
| FE-API \| Contratos dos serviços HTTP FE-API-07 envia motivo da rejeição e não acrescenta corpo na publicação | tests/frontend/unit/services.spec.ts | passed | 1 |
| FE-API \| Contratos dos serviços HTTP FE-API-08 encaminha falhas HTTP ao consumidor | tests/frontend/unit/services.spec.ts | passed | 12 |
| FE-API \| Contratos dos serviços HTTP FE-API-09 remove destino e roteiro pelos endpoints correspondentes | tests/frontend/unit/services.spec.ts | passed | 0 |
| FE-FORMAT \| Busca, mensagens e apresentação FE-FORMAT-01 normaliza Açude de Caicó para acude de caico | tests/frontend/unit/format.spec.ts | passed | 1 |
| FE-FORMAT \| Busca, mensagens e apresentação FE-FORMAT-01 normaliza SÃO JOSÉ para sao jose | tests/frontend/unit/format.spec.ts | passed | 0 |
| FE-FORMAT \| Busca, mensagens e apresentação FE-FORMAT-01 normaliza  para  | tests/frontend/unit/format.spec.ts | passed | 0 |
| FE-FORMAT \| Busca, mensagens e apresentação FE-FORMAT-02 calcula iniciais de  Ana Maria Silva  | tests/frontend/unit/format.spec.ts | passed | 0 |
| FE-FORMAT \| Busca, mensagens e apresentação FE-FORMAT-02 calcula iniciais de Ana | tests/frontend/unit/format.spec.ts | passed | 0 |
| FE-FORMAT \| Busca, mensagens e apresentação FE-FORMAT-02 calcula iniciais de  | tests/frontend/unit/format.spec.ts | passed | 1 |
| FE-FORMAT \| Busca, mensagens e apresentação FE-FORMAT-03 utiliza mensagem de erro da API | tests/frontend/unit/format.spec.ts | passed | 1 |
| FE-FORMAT \| Busca, mensagens e apresentação FE-FORMAT-04 reúne mensagens de validação da API | tests/frontend/unit/format.spec.ts | passed | 0 |
| FE-FORMAT \| Busca, mensagens e apresentação FE-FORMAT-05 retorna mensagem padrão para erro sem mensagem válida 0 | tests/frontend/unit/format.spec.ts | passed | 0 |
| FE-FORMAT \| Busca, mensagens e apresentação FE-FORMAT-05 retorna mensagem padrão para erro sem mensagem válida 1 | tests/frontend/unit/format.spec.ts | passed | 1 |
| FE-FORMAT \| Busca, mensagens e apresentação FE-FORMAT-05 retorna mensagem padrão para erro sem mensagem válida 2 | tests/frontend/unit/format.spec.ts | passed | 0 |
| FE-FORMAT \| Busca, mensagens e apresentação FE-FORMAT-06 usa imagem padrão para URL inválida: undefined | tests/frontend/unit/format.spec.ts | passed | 1 |
| FE-FORMAT \| Busca, mensagens e apresentação FE-FORMAT-06 usa imagem padrão para URL inválida: null | tests/frontend/unit/format.spec.ts | passed | 0 |
| FE-FORMAT \| Busca, mensagens e apresentação FE-FORMAT-06 usa imagem padrão para URL inválida:  | tests/frontend/unit/format.spec.ts | passed | 1 |
| FE-FORMAT \| Busca, mensagens e apresentação FE-FORMAT-06 usa imagem padrão para URL inválida: javascript:alert(1) | tests/frontend/unit/format.spec.ts | passed | 0 |
| FE-FORMAT \| Busca, mensagens e apresentação FE-FORMAT-06 usa imagem padrão para URL inválida: data:image/png;base64,abc | tests/frontend/unit/format.spec.ts | passed | 1 |
| FE-FORMAT \| Busca, mensagens e apresentação FE-FORMAT-06 usa imagem padrão para URL inválida: foto.jpg | tests/frontend/unit/format.spec.ts | passed | 0 |
| FE-FORMAT \| Busca, mensagens e apresentação FE-FORMAT-07 mantém URL HTTPS e resolve caminho de upload | tests/frontend/unit/format.spec.ts | passed | 1 |
| FE-FORMAT \| Busca, mensagens e apresentação FE-FORMAT-08 formata data em português | tests/frontend/unit/format.spec.ts | passed | 25 |
