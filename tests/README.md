# Entrega do plano e dos códigos de testes

Esta pasta reúne a entrega de testes do NortheasTour / SeridóTour: plano, testes unitários do back-end, testes do front-end com Jest e Cypress e relatórios reais por caso.

## Documentos da entrega

- [Plano de testes](PLANO-DE-TESTES.md): escopo, cenários, dados, critérios e resultados esperados.
- [Relatório geral](reports/RELATORIO-GERAL.md): resultados consolidados, cobertura e problemas encontrados.
- [Relatório do back-end](reports/backend/RELATORIO.md).
- [Relatório Jest do front-end](reports/frontend/RELATORIO.md).
- [Relatório Cypress](reports/cypress/RELATORIO.md).

Os relatórios Markdown e JSON ficam versionados para consulta sem executar os testes. Cada caso apresenta nome, arquivo, resultado e duração; reprovações incluem a mensagem da asserção. Os resumos de cobertura também são versionados. Os comandos substituem os relatórios pela execução mais recente.

## Instalação e execução

Na **raiz do repositório**, em PowerShell, Bash ou outro terminal com Node e npm:

```sh
npm ci
npm test
```

O comando completo executa todas as suítes, mesmo que uma delas falhe, e atualiza o relatório geral ao terminar. Retorna código 1 quando encontra reprovações ou falha de execução. A entrega registra uma reprovação conhecida em `BE-DTO-10`: o DTO de criação permite roteiro sem destinos. O código de produção não foi alterado para corrigir essa regra nesta entrega.

Para executar separadamente:

```sh
npm run test:backend
npm run test:frontend
npm run test:e2e
```

Após execuções separadas, atualize o consolidado com:

```sh
node tests/scripts/summarize.cjs
```

O back-end gera automaticamente o Prisma Client da versão utilizada por `apps/backend`, com URL fictícia apenas para satisfazer a configuração do gerador. Não inicia servidor, conecta ao banco, executa migrações ou carrega seeds.

O Cypress inicia e encerra seu próprio Vite em `http://127.0.0.1:4175`. Deixe essa porta livre. A API fictícia em `http://127.0.0.1:3999` é interceptada pelos testes; não é necessário iniciar serviço nessa porta. Requisições sem fixture recebem erro 500 para revelar dependências não previstas. Na instalação inicial, o Cypress baixa o navegador Electron; se o download estiver bloqueado, libere-o e execute `npm exec --workspace=@northeastour/tests -- cypress install`.

Ambiente em que a entrega foi verificada: Windows x64, Node 24.15.0, npm 11.13.0, Jest 29.7.0 e Cypress 15.21.2 / Electron 138. O lockfile da raiz fixa as versões efetivamente instaladas. O Jest desta pasta usa versão 29 para compatibilidade com `@vue/vue3-jest`; o Jest 30 já configurado em `apps/backend` permanece disponível nos comandos originais daquele workspace.

## Estrutura

```text
tests/
  backend/                   # Testes unitários NestJS e validações
  frontend/
    unit/                    # Stores, serviços, utilitários e componentes Vue
    e2e/                     # Cenários de interface Cypress
    fixtures/                # Respostas fictícias da API
  config/                    # Jest, TypeScript e Babel dos testes
  scripts/                   # Execução e geração de relatórios
  reports/
    RELATORIO-GERAL.md
    backend/                 # RELATORIO.md, results.json e coverage-summary.json
    frontend/                # RELATORIO.md, results.json e coverage-summary.json
    cypress/                 # RELATORIO.md e results.json
  cypress.config.cjs
  PLANO-DE-TESTES.md
```

Os testes anteriores de roteiros, clima e sanitização de logs são reutilizados por `backend/regressoes-existentes.spec.ts`, sem mover nem duplicar os arquivos originais. Todos os novos códigos de teste e configurações estão nesta pasta. Na raiz, foram acrescentados os comandos de execução e o workspace de testes; `build:all` usa `--if-present` para compilar os aplicativos e ignorar o workspace que contém somente testes.

## Cobertura e limites

Jest gera cobertura dos arquivos selecionados nas configurações, com HTML em `tests/reports/backend/coverage/index.html` e `tests/reports/frontend/coverage/index.html`. O HTML e as capturas de falhas do Cypress são artefatos locais ignorados pelo Git; os relatórios por caso e resumos JSON são entregues no repositório.

As porcentagens não representam todos os arquivos da aplicação. Os testes do back-end substituem dependências externas por mocks; os testes Cypress exercitam a interface real com API simulada. Banco real, rede real entre os aplicativos, Cloudinary, assinatura JWT, mapas externos e outros navegadores precisam de uma etapa adicional de integração.

Referências de configuração: [Vue Jest e compatibilidade de versões](https://github.com/vuejs/vue-jest) e [API Node do Cypress para coletar resultados](https://docs.cypress.io/app/references/module-api).
