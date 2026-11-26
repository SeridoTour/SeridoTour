# Relatório geral de testes

Consolidado em 2026-11-26 11:25:33 (America/Sao_Paulo). Cada relatório conserva a data da sua execução.

| Suíte | Total | Aprovados | Reprovados | Pendentes | Linhas cobertas¹ | Relatório por caso |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| backend | 102 | 101 | 1 | 0 | 95.4% | [Abrir](backend/RELATORIO.md) |
| frontend | 58 | 58 | 0 | 0 | 98.21% | [Abrir](frontend/RELATORIO.md) |
| cypress | 19 | 19 | 0 | 0 | não medida | [Abrir](cypress/RELATORIO.md) |

**Total: 179 casos; 178 aprovados; 1 reprovados; 0 pendentes.**

¹ Cobertura somente dos arquivos selecionados em `config/jest.*.cjs`; não representa toda a aplicação. Resumos de cobertura versionados em cada suíte; HTML completo gerado localmente em `coverage/index.html`.

## Resultados que exigem atenção

- **BE-DTO | Validação de entradas reais BE-DTO-10 exige pelo menos um destino no roteiro** — tests/backend/validation-upload.spec.ts. Consulte a evidência no relatório da suíte.

## Observações da análise

- A validação de `CreateItineraryDto.placeIds` usa `IsNotEmpty`, que aceita `[]`. O caso BE-DTO-10 exige pelo menos um destino, conforme a mensagem do DTO e a regra do formulário. A correção sugerida é usar `ArrayNotEmpty` no DTO de criação e verificar sua herança no DTO de edição.
- O login do back-end retorna somente `access_token`; a store e o interceptor do front-end esperam também `refresh_token`. FE-AUTH-08 demonstra que a store encerra a sessão quando a renovação responde somente com access_token. CY-AUTH-03 reproduz a resposta real no login inicial. A renovação entre as duas aplicações ainda requer alinhar o contrato; não houve teste integrado com servidores reais.

## Limites da execução

- Jest do back-end usa mocks de Prisma, cache, bcrypt, JWT e provedores. Não mede comportamento do PostgreSQL, constraints, autenticação HTTP ou uploads reais.
- Jest do front-end utiliza jsdom, Vue Test Utils e Pinia. A API de dialog é simulada no setup.
- Cypress executa a aplicação Vue no Electron headless com API interceptada. Os JWTs são fictícios e não validam assinatura. Não cobre integração real entre front-end e back-end, mapas externos, navegadores adicionais ou auditoria completa de acessibilidade.
- A suíte completa retorna código de saída 1 enquanto houver reprovação. Nenhum caso é marcado como aprovado quando falha.

## Como reproduzir

Na raiz do repositório: `npm ci` e `npm test`. Comandos separados e escopo dos casos: [README](../README.md) e [plano](../PLANO-DE-TESTES.md).
