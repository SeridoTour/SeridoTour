# Frontend do SeridóTour

## Hotfix do mapa e favicon

**Branch:** `hotfix/mapa-zoom-favicon`

**Data:** 19/11/2026

- A tela `/mapa` ocupa a altura disponível da janela, sem rolagem vertical da página.
- A rodinha do mouse aproxima e afasta o mapa. O cartão do destino fica sobre o mapa,
  sem aumentar a altura da tela.
- Ao navegar para outra tela, a rolagem normal da página continua disponível. Os mapas
  incorporados às outras telas mantêm seu comportamento anterior.
- O ícone da aba usa a marca do SeridóTour em SVG e ICO, com versões de 16, 32 e 48 pixels.
- Verificados no navegador: zoom nos dois sentidos, altura do mapa, navegação e favicons
  em 1440 × 900, 1366 × 768, 390 × 844, 844 × 390 e 320 × 568, com dados simulados.

## Relatório da refatoração visual

**Branch:** `feature/frontend-refactor`

**Base:** `main`, commit `994ceaca31f1a696b13e2f6499e500b94b52f681`

**Data:** 19/11/2026

A interface foi adaptada às referências fornecidas, usando a identidade do login existente:
fundos em areia, painéis claros, terracota, navegação lateral em marrom, ícones lineares
e elementos de paisagem do Seridó. O nome SeridóTour foi mantido em toda a interface.

O trabalho ficou restrito ao frontend. Nenhum endpoint, regra de negócio, schema ou
migração do backend foi alterado.

### Telas e navegação

| Área | Rota | O que foi entregue |
| --- | --- | --- |
| Exploração de destinos | `/` | Cartões com foto, busca por nome/cidade/descrição, filtros de categoria, paginação dos resultados carregados e mapa com seleção de local. |
| Mapa | `/mapa` | Visão ampliada que reutiliza a exploração e o componente de mapa. |
| Detalhes do local | `/places/:id` | Capa, visão geral, fotos disponíveis, avaliações com autor/data, nota média calculada, mapa, compartilhamento e link para Google Maps. |
| Cadastro e edição de local | `/places/new`, `/places/:id/edit` | Formulário, seleção no mapa, coordenadas editáveis, arrastar/selecionar imagem, prévia, validação e envio multipart. |
| Meus roteiros | `/roteiros` | Busca, filtro por situação, autoria, envio para análise e acesso à edição. O guia também consegue enviar seu próprio rascunho. |
| Roteiros publicados | `/roteiros-publicos` | Consulta pública com cartões e favoritos; reutiliza a tela de listagem. |
| Criação e edição de roteiro | `/roteiros/new`, `/roteiros/:id/edit` | Formulário único com destinos, busca, resumo da seleção e duração. A edição de roteiros em análise fica bloqueada. |
| Detalhes do roteiro | `/roteiros/:id`, `/roteiros-publicos/:id` | Descrição, situação, destinos, mapa e ações permitidas para autor/guia. |
| Moderação | `/moderacao` | Fila real de roteiros, filtros por situação/categoria/autor, ordenação alfabética, contadores, publicação, rejeição com motivo e despublicação. |
| Usuários | `/users` | Consulta com busca e filtro por perfil, sem controles de edição que a API ainda não oferece. |
| Favoritos | `/favoritos` | Locais e roteiros públicos salvos neste navegador, com persistência após recarregar a página. |
| Perfil | `/perfil` | Informações da sessão, abas de segurança e preferências. Edição pessoal, foto e troca de senha estão identificadas como indisponíveis. A preferência de exibição do mapa funciona localmente. |

As URLs existentes foram preservadas. Os nomes internos das rotas foram padronizados
em inglês com `kebab-case`.

### O que foi preservado

- Template e CSS de `LoginView.vue`, incluindo a foto já existente. No script, foram
  ajustados apenas a tipagem do cadastro e o nome da rota de manutenção.
- Conteúdo e identidade da manutenção. O arquivo passou de
  `TelaManutencaoView.vue` para `MaintenanceView.vue`, sem alteração de conteúdo.
- Permissões USER/GUIA e os contratos HTTP existentes.
- A imagem `public/serido-sunset.png`; nenhuma imagem de referência foi adicionada
  como captura de tela da interface.

### Organização e limpeza

- Telas e componentes usam `PascalCase.vue`, com nomes em inglês.
- Serviços, stores, constantes e utilitários seguem os nomes e as responsabilidades
  de cada domínio; tipos compartilhados ficam em `src/types/tourism.ts`.
- A paleta e os estilos comuns ficam em `src/assets/main.css`.
- Menu, cabeçalho, cartões, mapa, estrelas, avaliações, upload e diálogo de confirmação
  foram extraídos para componentes reutilizados.
- As ações de roteiro ficam em um único componente, compartilhado pela listagem,
  pelo detalhe e pela moderação.
- Listagem pública e pessoal reutilizam `ItinerariesView.vue`; criação e edição
  reutilizam seus respectivos formulários.
- Foram removidos `NavigationMenu.vue`, `DashboardView.vue`, `AdminPanelView.vue`
  e `stores/counter.ts`, que foram substituídos ou não tinham uso no router.
- As telas antigas `RoteirosView.vue`, `RoteirosPublicosView.vue`,
  `RoteiroFormView.vue` e `RoteiroDetailsView.vue` foram substituídas pelas telas
  padronizadas `ItinerariesView.vue`, `ItineraryFormView.vue` e
  `ItineraryDetailsView.vue`.
- Não foram adicionadas dependências npm.

### Adaptação das referências ao sistema disponível

- A API aceita **uma imagem por local/avaliação**, em JPG, PNG ou WEBP de até **5 MB**.
  O formulário segue esse contrato, em vez de mostrar uma galeria múltipla de 10 MB.
- O cadastro trabalha com nome, descrição simples, cidade, categoria e coordenadas.
  Não foram criados controles de endereço, tags, formatação rica ou publicação de
  local sem suporte de persistência.
- A moderação atua sobre roteiros. Não há aprovação fictícia de locais ou usuários.
- As contagens e notas são calculadas a partir dos registros recebidos; não foram
  inseridas estatísticas, avaliações, datas de conta ou notificações de demonstração.
- Quando não há imagem, a paisagem já existente é usada como ilustração.
- Fotos de perfil, alteração de dados e senha continuam indisponíveis, conforme
  o escopo somente frontend.
- Favoritos e a preferência de mapa são locais ao navegador e não sincronizam
  entre dispositivos ou contas.

### Validação realizada

- `npm run build:frontend`: aprovado, incluindo a checagem efetiva do projeto Vue/TypeScript.
- `npm run typecheck --workspace=apps/frontend`: comando disponível para checar os tipos separadamente.
- `git diff --check`: aprovado.
- **12 cenários de navegador aprovados**, com API interceptada e dados fictícios:
  exploração/busca/filtros, detalhes/favoritos, consulta pública/mapa,
  login/manutenção/proteção de rotas, criação/edição de roteiro, avaliação/upload
  inválido, perfil/preferências, cadastro de local, envio pelo guia autor,
  moderação/cancelamento/publicação, usuários e navegação móvel.
- Conferência visual em **1600 × 1000** e **390 × 844**, com capturas de desktop e celular.
- Nenhum erro de execução do navegador nos cenários finais; nenhuma rolagem
  horizontal indevida nas páginas móveis verificadas.
- Comparação confirmou que template/CSS do login e conteúdo da manutenção foram preservados.

Os testes acima verificam o frontend e os contratos das requisições com respostas
simuladas. Não representam validação completa com PostgreSQL, Cloudinary ou contas
reais; nenhum dado foi gravado em produção.

### Dependências que permanecem no backend

O contrato de renovação de sessão e o cache de consultas de locais/avaliações,
identificados na auditoria anterior, não foram alterados. Também continuam dependendo
de implementação própria as funções de edição do perfil, troca de senha e avatar.

O catálogo e o seletor de locais carregam até 100 registros por consulta. A paginação
da exploração organiza esses registros carregados; uma busca completa em catálogos
maiores requer integração com paginação/busca do servidor.

## Executar

Na raiz do monorepo:

```sh
npm ci
npm run start:frontend
```

Configure `apps/frontend/.env` com a URL da API:

```env
VITE_API_URL=http://localhost:3000
```

Para verificar e gerar o build:

```sh
npm run typecheck --workspace=apps/frontend
npm run build:frontend
```
