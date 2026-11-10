# Documentação do SeridóTour

Entrega de Projeto Integrador, organizada conforme os três itens da atividade.

**[Abrir a entrega completa em PDF](Documentacao-Projeto-Integrador.pdf)**

| Pedido da atividade | Entrega atualizada |
| --- | --- |
| 1. Diagrama de casos de uso e descrição de cada caso | [PDF](01-Casos-de-Uso.pdf) · [Descrições em Markdown](CASOS-DE-USO.md) · [Diagrama](diagramas/casos-de-uso.png). Mantém os 13 casos originais. |
| 2. Arquitetura com descrição de cada bloco | [PDF](02-Arquitetura-e-Deploy.pdf) · [Texto em Markdown](ARQUITETURA.md). Inclui visão geral, módulos internos e deploy Vercel/Render/NeonDB, além do Docker local. |
| 3. Estrutura de dados: Classes ou DER | [PDF](03-Estrutura-de-Dados.pdf) · [Texto em Markdown](ESTRUTURA-DE-DADOS.md) · [DER atualizado](diagramas/estrutura-de-dados.png). |

## Organização

- Na raiz de docs ficam os PDFs de entrega, os textos em Markdown e os [integrantes do grupo](Integrantes%20do%20Grupo.txt).
- Em diagramas ficam as imagens PNG, os desenhos vetoriais SVG e os dados de apoio das versões atuais.
- O PDF completo reúne os três PDFs individuais. Os arquivos Markdown e SVG permitem consultar e editar a documentação.

## Imagens da arquitetura

- Visão geral: [PNG](diagramas/arquitetura-sistema.png) · [SVG](diagramas/arquitetura-sistema.svg).
- Módulos da API: [PNG](diagramas/arquitetura-modulos.png) · [SVG](diagramas/arquitetura-modulos.svg).
- Deploy e Docker local: [PNG](diagramas/arquitetura-deploy.png) · [SVG](diagramas/arquitetura-deploy.svg).
- Estrutura de dados: [PNG](diagramas/estrutura-de-dados.png) · [SVG](diagramas/estrutura-de-dados.svg).

## Observações da versão

- Comentário faz parte da avaliação, embora os dois sejam casos separados no desenho original.
- Gerenciar usuários permite apenas listagem. Edição e exclusão de roteiros existem na API, sem controles próprios na tela atual.
- O deploy utiliza Vercel no frontend, Render na API e NeonDB para hospedar o PostgreSQL. A hospedagem no NeonDB foi informada pelo responsável pelo projeto; Vercel e Render foram identificados por fontes públicas em 09/11/2026.
- Este índice contém somente a documentação atual; versões antigas, rascunhos e arquivos duplicados foram removidos.

Base local: main, commit 0dd906a31a582a196f68c03534e222574416b1d7. A auditoria conferiu documentação, código e endpoints públicos de leitura; não substitui testes completos da aplicação.
