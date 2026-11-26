# Relatório geral de testes

Consolidado em 2026-11-26 16:33:26 (America/Sao_Paulo). Cada relatório conserva a data da sua execução.

| Suíte | Total | Aprovados | Reprovados | Pendentes | Linhas cobertas¹ | Relatório por caso |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| backend | 121 | 121 | 0 | 0 | 96.41% | [Abrir](backend/RELATORIO.md) |
| frontend | 64 | 64 | 0 | 0 | 98.23% | [Abrir](frontend/RELATORIO.md) |
| cypress | 23 | 23 | 0 | 0 | não medida | [Abrir](cypress/RELATORIO.md) |

**Total: 208 casos; 208 aprovados; 0 reprovados; 0 pendentes.**

¹ Cobertura somente dos arquivos selecionados em `config/jest.*.cjs`; não representa toda a aplicação. Resumos de cobertura versionados em cada suíte; HTML completo gerado localmente em `coverage/index.html`.

## Resultados que exigem atenção

Nenhuma reprovação registrada nos relatórios disponíveis.

## Observações da análise

- A integração beta usa `ArrayNotEmpty` para recusar roteiros sem destinos na criação e na edição. UUIDs válidos v4/v5 são aceitos em roteiros e avaliações, incluindo os IDs do catálogo importado.
- A sessão mantém access_token com rotação/revogação. Cadastro padrão cria USER; GUIA exige código válido e DEPLOYMENT_ENV=preview. Produção recusa o código e o papel forjado. Access e refresh separados continuam como evolução pendente.

## Limites da execução

- Jest do back-end usa mocks de Prisma, cache, bcrypt, JWT e provedores. Não mede comportamento do PostgreSQL, constraints, autenticação HTTP ou uploads reais.
- Jest do front-end utiliza jsdom, Vue Test Utils e Pinia. A API de dialog é simulada no setup.
- Cypress executa a aplicação Vue no Electron headless com API interceptada. Os JWTs são fictícios e não validam assinatura. Não cobre integração real entre front-end e back-end, mapas externos, navegadores adicionais ou auditoria completa de acessibilidade.
- O ensaio separado `npm run verify:migrations` cobre PostgreSQL descartável, HTTP real e imagens de execução; seus resultados constam na auditoria final e não entram nas contagens unitárias desta tabela.
- A suíte completa retorna código de saída 1 enquanto houver reprovação. Nenhum caso é marcado como aprovado quando falha.

## Como reproduzir

Na raiz do repositório: `npm ci` e `npm test`. Comandos separados e escopo dos casos: [README](../README.md) e [plano](../PLANO-DE-TESTES.md).
