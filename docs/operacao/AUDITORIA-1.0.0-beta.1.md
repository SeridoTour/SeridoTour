# Auditoria de integração — 1.0.0-beta.1

Data: 26/11/2026, America/Sao_Paulo. Destino: `codex/preview-geoparque`, para revisão antes de promover código à `main`. Esta execução não publica em produção nem aplica mudanças nos bancos remotos.

## Resultado

A branch de testes foi integrada à preview, preservando as correções de segurança, catálogo, migrações e isolamento já existentes. As suítes foram atualizadas para o contrato atual da aplicação. A versão é **1.0.0-beta.1** no monorepo, backend, frontend, workspace de testes e respectivos registros do lockfile.

Beta representa uma versão utilizável para homologação dos fluxos principais, com pendências conhecidas e validação do responsável ainda necessária. Não representa aprovação automática para produção nem uma declaração de ausência de vulnerabilidades.

## Git e resolução da mesclagem

- Foram buscadas todas as branches remotas, pois o fetch local estava limitado à `main`.
- `git pull --ff-only origin codex/preview-geoparque` confirmou a preview atualizada na base `9758c87199906db0d9a100e9b1f155c971dea8d9`.
- A `main` local foi avançada por fast-forward até `d726c3c41a26c454a28597318a202b728b2dc07d`, sem push para ela. Esse commit já estava incorporado à preview.
- Origem dos testes: `codex/testes-relatorios`, commit `4a02a27d9d0f9e35bf76c89279346638cf52f9e0`.
- Os conflitos ficaram em `package.json` e `package-lock.json`. Foram mantidos o startup sem alterações automáticas no banco, Prisma 6.19.3, comandos de manutenção protegidos e dependências corrigidas da preview. O workspace de testes foi acrescentado e o lockfile regenerado, sem restaurar o Prisma 7 ou o seed no startup da base antiga.
- A integração mantém as duas linhas de histórico por merge. Somente a branch de preview recebe o resultado; a promoção para `main` fica para depois da revisão solicitada.

## Alterações desta integração

1. **Execução unificada:** `npm test`, `test:backend`, `test:frontend` e `test:e2e` usam o workspace `tests`. O backend descobre também todos os testes originais em `apps/backend/src/**/*.spec.ts`; o arquivo intermediário que apenas importava três suítes foi removido, evitando duplicações e preservando as regressões de segurança mais recentes.
2. **Roteiros vazios corrigidos:** a criação usa `ArrayNotEmpty`. A edição permite omitir destinos, mas rejeita uma lista explicitamente vazia. O caso originalmente reprovado BE-DTO-10 agora passa.
3. **Geossítios compatíveis com a API:** os DTOs de roteiros e avaliações aceitam UUIDs válidos, incluindo v4 dos registros antigos e v5 do catálogo importado. Antes, os IDs v5 eram recusados pela validação v4. Um local sintético com UUID v5 passou a integrar o ensaio HTTP com PostgreSQL real.
4. **Testes ajustados à segurança vigente:** emissão de JWT com identificador único; armazenamento por digest; consumo do token na renovação; cadastro somente USER; ausência de código público para obter GUIA; renovação compatível usando access_token e logout com revogação. Não foram reintroduzidos os comportamentos inseguros esperados pela base antiga de testes.
5. **Dois cenários Cypress adicionais:** após 401, renovar e repetir a chamada com o novo token; em renovação recusada, limpar a sessão e voltar ao login. Exercitam o interceptor Axios real com API simulada.
6. **CI ampliado:** frontend unitário e Cypress foram adicionados ao pipeline existente, junto aos testes de backend, proteções de scripts, auditorias, imagens da API e ensaio de migrações. Os relatórios são disponibilizados como artefato mesmo em falha; o limite do job passou a 30 minutos.
7. **Documentação e relatórios:** plano, instruções e gerador de consolidado foram corrigidos para refletir a versão integrada. Markdown, resultados individuais e cobertura foram regenerados com a execução atual. O exemplo de ambiente não oferece mais a variável legada `CODIGO_GUIA`.

## Validação local realizada

| Verificação | Resultado |
| --- | --- |
| Instalação pelo lockfile | `npm ci --include=dev` concluído |
| Backend unitário/regressões | 116 casos aprovados, 13 suítes |
| Frontend unitário | 58 casos aprovados, 4 suítes |
| Cypress/Electron | 21 casos aprovados, 3 arquivos, sem casos pendentes |
| Proteções de scripts | 11 casos aprovados; destinos de produção/remotos incorretos recusados |
| HTTP com PostgreSQL 18 descartável | 6 casos aprovados, incluindo fluxo com UUID v5 |
| Build backend | Aprovado; artefato `dist/src/main.js` |
| Frontend em modo Preview | Typecheck e build aprovados, URL da API de desenvolvimento explícita |
| Migrações | Banco vazio, atualização de cópia sintética, segunda execução sem mudanças, schema reconciliado e rollback para legado incompatível |
| Seed local | Duas execuções sem duplicar: um usuário, dois locais, um rascunho e zero avaliações |
| Imagem backend de produção | Construída; execução como usuário não root, `/health` 200 e dados preservados no startup |
| Imagem do runtime nativo/Render | Construída; prune sem ferramentas de build, não root, `/health` 200 e startup sem mutação |
| Imagem frontend/Nginx | Construída; `/`, `/login`, `/mapa` e favicon 200; fallback SPA, noindex e API de desenvolvimento conferidos |
| Consistência de versão | Quatro manifests e lockfile em `1.0.0-beta.1` |

Total de casos automatizados dessas suítes: **212 aprovados** (195 no consolidado, 11 proteções e 6 HTTP). As asserções adicionais dos ensaios de migração/imagens não foram somadas como casos unitários. O Docker Desktop foi iniciado para executar os ensaios; os containers descartáveis criados pelos runners foram removidos ao final. Nenhum container ou volume de dados existente foi apagado.

Cobertura de linhas: **96,29% no conjunto backend selecionado** e **98,23% no conjunto frontend selecionado**. Não são porcentagens de toda a aplicação. Os unitários usam mocks; Cypress utiliza interface real com API simulada; o ensaio HTTP utiliza NestJS, JWT e PostgreSQL reais, com uploads simulados. Nenhum ensaio enviou mídias ao Cloudinary ou criou contas nos bancos remotos.

Relatórios reproduzíveis: [consolidado](../../tests/reports/RELATORIO-GERAL.md), [backend](../../tests/reports/backend/RELATORIO.md), [frontend](../../tests/reports/frontend/RELATORIO.md), [Cypress](../../tests/reports/cypress/RELATORIO.md). O plano detalhado está em [PLANO-DE-TESTES.md](../../tests/PLANO-DE-TESTES.md).

## Auditoria de dependências

Na instalação desta integração, `npm audit` completo informa **26 alertas: quatro altos, 22 moderados e nenhum crítico**. Estão na árvore de desenvolvimento/build/testes, incluindo Prisma CLI/config e ferramentas Jest/Vue Test Utils. A integração dos testes acrescentou dependências de desenvolvimento; não foi usado `npm audit fix --force`, nem feita mudança de major do Prisma para mascarar os alertas.

Os comandos `npm audit --omit=dev --omit=optional --audit-level=moderate` e `npm audit --workspace=apps/frontend --audit-level=moderate` passaram com **zero alertas**. As instalações efetivas das imagens de runtime backend e do workspace frontend também reportaram zero. O runtime é verificado para não incluir CLI Prisma, Nest CLI, Jest ou TypeScript. Isso não inclui auditoria completa das imagens do sistema operacional ou garantia contra vulnerabilidades ainda não publicadas.

## Escopo preservado e limitações

Consulta de leitura ao Neon nesta auditoria, após os ensaios locais:

| Banco | Usuários | Locais | Com foto | Roteiros | Avaliações |
| --- | ---: | ---: | ---: | ---: | ---: |
| production | 12 | 6 | 0 | 8 | 5 |
| development-seridotour | 2 | 27 | 21 | 0 | 1 |

- A identidade visual, os 21 geossítios/fotos/créditos, o cache separado por URL/ID, a revogação de sessão, a concessão administrativa de GUIA e a quinta migração vieram da preview e foram preservados. A carga de dados não é parte desta mesclagem de Git.
- O banco de desenvolvimento continua `development-seridotour`, separado de `production`. Os scripts de teste/migração local foram executados sem `PREVIEW_SOURCE_ENV`, usando somente PostgreSQL descartável.
- A conta Cloudinary ainda é compartilhada por autorização anterior do responsável; o prefixo separa arquivos, não permissões. Nenhum upload ou exclusão foi executado nesta integração.
- O perfil ainda tem controles de alteração de dados/senha/foto indisponíveis no backend, sinalizados/desabilitados na interface. A autorização anterior limitou esse trabalho ao frontend; esta integração não acrescenta essas rotas.
- O OpenWeather de desenvolvimento depende de configuração própria. Falhas do provedor são tratadas, mas testes com mocks não comprovam disponibilidade externa.
- A renovação continua compatível com o contrato de access_token. Um protocolo separado de access/refresh com expiração e rotação próprias permanece uma evolução, sem alterar silenciosamente o contrato nesta release.
- Paginação acima de 100 itens, observabilidade, CSP, limites de memória/readiness, compensação do upload comum e política de reavaliação após edição de conteúdo publicado continuam itens de evolução. Testes aprovados não resolvem automaticamente essas decisões.

## Condições para promover depois da revisão

1. Conferir o [preview protegido](https://seridotour-git-codex-preview-d143e9-serafims-projects-395240b2.vercel.app/), o deployment vinculado ao commit final e o [CI da branch](https://github.com/SeridoTour/SeridoTour/actions). Os resultados locais acima foram obtidos antes do push; a confirmação dos serviços remotos deve acompanhar o fechamento da tarefa.
2. Resolver o destino das **15 fotografias com reutilização ainda pendente** antes de publicá-las fora do preview. Substituir/remover essas fotos ou obter autorização; o aviso no preview não equivale a permissão de uso em produção. As seis demais têm licença aberta/domínio público e exigem respeitar os créditos aplicáveis.
3. Fazer backup e ensaio de restauração de produção, conferir o esquema/histórico real e testar a migração complementar em uma cópia atual antes do apply. Não aplicar scripts de preview em produção: eles recusam esse destino deliberadamente.
4. Configurar explicitamente o serviço de produção com sua conexão, origem CORS e segredos. O start deve executar somente a API compilada. Não usar `verify-preview-env.cjs` ou o Blueprint exclusivo do preview no serviço de produção. Migração é uma etapa controlada, anterior ao startup; seed/reset não fazem parte do deploy.
5. Definir a transição das sessões existentes: a nova validação exige digest da sessão no banco; tokens legados em texto não serão aceitos. Planejar reautenticação e teste de login, renovação e logout após o corte.
6. Revisar separadamente o plano de limpeza/carga de produção. Mesclar código não transfere os 27 locais, fotos ou duas contas do desenvolvimento. Não copiar a branch de desenvolvimento inteira sobre produção nem executar a limpeza original sem a revisão combinada.
7. Depois da aprovação funcional, promover a branch por PR para `main`, aplicar a sequência controlada de banco/API/frontend e executar smoke tests reais. Em falha, interromper a promoção e usar o plano de rollback compatível com banco e sessões.

**Conclusão da auditoria:** candidata beta validada localmente para revisão no preview. A promoção para produção continua condicionada à revisão funcional, às pendências de mídia e ao plano operacional; esta execução não autoriza nem realiza essa promoção.
