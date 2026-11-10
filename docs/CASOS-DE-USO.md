# Casos de uso — SeridóTour

Esta documentação detalha os 13 casos de uso do [diagrama](diagramas/casos-de-uso.png), mantendo seus nomes e sua numeração. A linguagem apresenta o que cada pessoa faz no sistema e o resultado esperado.

**Disciplina:** Projeto Integrador — Tecnologia em Sistemas para Internet / IFRN Campus Currais Novos.  
**Revisão:** 09/11/2026.  
**Base:** código do projeto, commit `0dd906a31a582a196f68c03534e222574416b1d7`.

## Atores

| Ator | Participação |
| --- | --- |
| Visitante | Pessoa sem sessão iniciada. Pode se cadastrar, entrar e consultar as informações públicas. |
| Turista | Pessoa autenticada que cria seus roteiros, acompanha a publicação e registra avaliações com comentários. |
| Guia/Administrador | Pessoa autenticada com perfil de guia. Também pode criar roteiros e avaliações, além de manter locais, consultar usuários e moderar roteiros. |

O nome Guia/Administrador representa o mesmo perfil de guia do sistema. As consultas públicas também estão disponíveis para turistas e guias.

## Descrição dos casos de uso

### CU-01 — Realizar cadastro

**Ator:** Visitante.  
**Objetivo:** Criar uma conta para utilizar os recursos do sistema.  
**Pré-condição:** Não estar autenticado e informar nome, e-mail e senha na opção de cadastro.

**Fluxo principal:**

1. Informar nome, e-mail e senha; o código de guia é opcional.
2. O sistema valida os dados e verifica se nome ou e-mail já estão em uso.
3. A senha é protegida e a conta é salva como turista ou guia, conforme o código informado.
4. Após o cadastro, o sistema tenta realizar o login automaticamente.

**Alternativas:** Dados inválidos ou nome/e-mail já cadastrado impedem o cadastro. Sem código de guia válido, a conta recebe o perfil de turista.

**Resultado:** Conta criada e disponível para acesso ao sistema.

### CU-02 — Realizar login

**Ator:** Visitante com conta cadastrada.  
**Objetivo:** Entrar no sistema e acessar as funções do seu perfil.  
**Pré-condição:** Possuir uma conta e informar e-mail e senha.

**Fluxo principal:**

1. Acessar a tela de entrada e informar as credenciais.
2. O sistema localiza a conta e confere a senha.
3. Se os dados estiverem corretos, o sistema inicia a sessão.
4. O usuário passa a acessar as funcionalidades permitidas para seu perfil.

**Alternativas:** E-mail inexistente ou senha incorreta impedem o acesso. Se a sessão expirar, pode ser necessário entrar novamente.

**Resultado:** Usuário autenticado como turista ou guia/administrador.

### CU-03 — Visualizar locais turísticos

**Ator:** Visitante, Turista ou Guia/Administrador.  
**Objetivo:** Conhecer os pontos turísticos cadastrados.  
**Pré-condição:** Acessar a página inicial do sistema.

**Fluxo principal:**

1. O sistema carrega os locais cadastrados e suas coordenadas.
2. Os locais são apresentados em cartões e marcadores no mapa.
3. O usuário escolhe um cartão ou marcador.
4. O sistema exibe nome, descrição, cidade, categoria, localização e imagem, quando houver.

**Alternativas:** Se não existirem locais, o sistema informa a ausência de registros. Um local removido não pode ter seus detalhes consultados.

**Resultado:** Informações do local apresentadas ao usuário.

### CU-04 — Visualizar avaliações

**Ator:** Visitante, Turista ou Guia/Administrador.  
**Objetivo:** Consultar as experiências e notas de outras pessoas.  
**Pré-condição:** Selecionar um ponto turístico.

**Fluxo principal:**

1. Abrir a página de detalhes do local.
2. O sistema busca as avaliações vinculadas a esse ponto turístico.
3. As avaliações são exibidas da mais recente para a mais antiga.
4. O usuário visualiza nota, comentário, autor e imagem, quando houver.

**Alternativas:** Se o local ainda não tiver avaliações, o sistema apresenta uma mensagem informativa.

**Resultado:** Avaliações consultadas sem alterar os registros.

### CU-05 — Visualizar comentários

**Ator:** Visitante, Turista ou Guia/Administrador.  
**Objetivo:** Ler o relato escrito por quem avaliou um local.  
**Pré-condição:** Abrir a seção de avaliações de um ponto turístico.

**Fluxo principal:**

1. O usuário acessa os detalhes do local.
2. O sistema carrega as avaliações e os comentários associados.
3. O texto de cada comentário é apresentado junto à nota e ao autor.

**Alternativas:** Sem avaliações registradas, não há comentários para apresentar.

**Resultado:** Comentário lido pelo usuário.

**Observação:** No projeto, o comentário faz parte da avaliação. Não existe uma publicação separada apenas para comentários.

### CU-06 — Criar roteiro turístico

**Ator:** Turista ou Guia/Administrador.  
**Objetivo:** Organizar locais turísticos em um roteiro de viagem.  
**Pré-condição:** Estar autenticado e ter pontos turísticos disponíveis.

**Fluxo principal:**

1. Escolher a opção de criar roteiro.
2. Informar título, descrição e duração em dias.
3. Selecionar pelo menos um dos locais cadastrados.
4. O sistema valida os dados e salva o roteiro como rascunho, vinculado ao autor.

**Alternativas:** A tela impede o envio sem locais selecionados. Campos obrigatórios ausentes ou duração inválida impedem a criação.

**Resultado:** Roteiro criado como rascunho, ainda sem publicação pública.

### CU-07 — Adicionar locais existentes ao roteiro

**Ator:** Turista autor do roteiro ou Guia/Administrador.  
**Objetivo:** Definir os pontos turísticos que compõem o roteiro.  
**Pré-condição:** Estar autenticado e selecionar locais já cadastrados.

**Fluxo principal:**

1. O sistema apresenta os locais disponíveis no formulário de criação.
2. O usuário marca os pontos que deseja visitar.
3. A seleção é enviada junto aos dados do roteiro.
4. O sistema associa os locais escolhidos ao roteiro.

**Alternativas:** Se um local deixar de existir antes de salvar, a associação pode falhar. Um roteiro em análise não pode ser alterado.

**Resultado:** Locais existentes vinculados ao roteiro.

**Observação:** A seleção está disponível na criação. A alteração posterior dos locais existe na API, mas ainda não possui uma tela própria.

### CU-08 — Visualizar seus roteiros

**Ator:** Turista ou Guia/Administrador.  
**Objetivo:** Consultar os roteiros criados e acompanhar sua situação.  
**Pré-condição:** Estar autenticado no sistema.

**Fluxo principal:**

1. Acessar a página de roteiros.
2. Para o turista, o sistema lista os roteiros de sua autoria.
3. A lista apresenta título, duração, locais e situação do roteiro.
4. Ao abrir um roteiro, o usuário consulta os detalhes e o motivo de rejeição, se houver.

**Alternativas:** Se não houver roteiros, o sistema informa a ausência de registros. O turista não pode consultar roteiros privados de outro autor.

**Resultado:** Roteiros e suas situações apresentados ao usuário.

**Observação:** A tela do guia apresenta todos os roteiros para gestão e revisão. A consulta exclusiva dos roteiros de sua autoria também está disponível pela API.

### CU-09 — Criar avaliações

**Ator:** Turista ou Guia/Administrador.  
**Objetivo:** Registrar sua experiência em um ponto turístico.  
**Pré-condição:** Estar autenticado e selecionar um local existente.

**Fluxo principal:**

1. Abrir os detalhes do local e preencher o formulário de avaliação.
2. Escolher uma nota de 1 a 5 e escrever um comentário.
3. Anexar uma imagem, se desejar, e enviar a avaliação.
4. O sistema valida os dados, armazena a imagem quando enviada e salva a avaliação com o autor.

**Alternativas:** Nota inválida, comentário vazio ou imagem não permitida impedem o registro. A imagem pode ser JPEG, PNG ou WEBP, com até 5 MB.

**Resultado:** Avaliação registrada e disponível para consulta pública.

### CU-10 — Criar comentários

**Ator:** Turista ou Guia/Administrador.  
**Objetivo:** Descrever a experiência vivida no local avaliado.  
**Pré-condição:** Estar autenticado e preencher uma avaliação do local.

**Fluxo principal:**

1. Escrever o relato no campo de comentário da avaliação.
2. Informar também a nota do local.
3. Enviar o formulário de avaliação.
4. O sistema salva o comentário junto à nota e à identificação do autor.

**Alternativas:** A interface não permite comentário vazio ou composto somente por espaços. Sem nota válida, o registro também não é salvo.

**Resultado:** Comentário publicado como parte de uma avaliação.

**Observação:** Este caso e "Criar avaliações" são executados no mesmo formulário.

### CU-11 — Gerenciar locais turísticos

**Ator:** Guia/Administrador.  
**Objetivo:** Manter o cadastro dos pontos turísticos.  
**Pré-condição:** Estar autenticado com o perfil de guia.

**Fluxo principal:**

1. Escolher a opção de cadastrar ou abrir um local existente.
2. Para cadastrar, informar nome, descrição, cidade e categoria e marcar a posição no mapa; a imagem é opcional.
3. Para editar, alterar os dados e salvar; para excluir, confirmar a operação.
4. O sistema verifica a permissão, valida os dados e realiza a operação.

**Alternativas:** Turistas não podem executar essas ações. Dados ou imagens inválidos impedem a gravação; a exclusão pode falhar se existirem vínculos no banco.

**Resultado:** Local cadastrado, atualizado ou excluído.

### CU-12 — Gerenciar usuários

**Ator:** Guia/Administrador.  
**Objetivo:** Consultar as contas cadastradas no sistema.  
**Pré-condição:** Estar autenticado com o perfil de guia.

**Fluxo principal:**

1. Acessar a página de usuários cadastrados.
2. O sistema verifica a permissão do guia.
3. A lista apresenta nome, e-mail, perfil e data de cadastro.
4. O guia consulta as informações necessárias.

**Alternativas:** Usuários sem o perfil de guia não podem acessar a listagem. Se ocorrer uma falha, o sistema informa o erro.

**Resultado:** Usuários consultados, sem alteração dos cadastros.

**Observação:** Na versão atual, este gerenciamento permite somente listar usuários. Editar ou excluir contas ainda não está disponível.

### CU-13 — Gerenciar roteiros turísticos

**Ator:** Guia/Administrador.  
**Objetivo:** Acompanhar os roteiros e controlar sua publicação.  
**Pré-condição:** Estar autenticado com o perfil de guia.

**Fluxo principal:**

1. Acessar a página de roteiros e consultar os registros de todos os autores.
2. Abrir um roteiro para verificar descrição, locais, duração, autor e situação.
3. Aguardar o envio para análise pelo próprio autor: um roteiro novo começa como rascunho e só o autor pode solicitar sua revisão.
4. Se estiver em análise, decidir entre publicar e rejeitar. Na rejeição, o guia pode informar um motivo.
5. O sistema salva a decisão. Somente os roteiros publicados ficam disponíveis para consulta pública.
6. Se necessário, despublicar um roteiro publicado. Ele volta a ser rascunho e sai da consulta pública.

**Alternativas:** Somente roteiros em análise podem ser publicados ou rejeitados. A edição fica bloqueada enquanto o roteiro está em análise, tanto para o autor quanto para o guia. Um roteiro rejeitado pode ser corrigido e reenviado pelo próprio autor. Cancelar uma confirmação ou o diálogo de rejeição não altera o roteiro.

**Resultado:** Situação do roteiro atualizada conforme a decisão do guia, preservando seu autor e os locais associados.

**Observação:** Editar e excluir roteiros também são operações disponíveis pela API para o guia, mas ainda não têm controles próprios nessa tela. O guia pode editar roteiros de qualquer autor; o turista pode editar os seus, respeitando o bloqueio durante a análise.

## Detalhe da publicação de roteiros

O envio e a revisão detalham o gerenciamento do CU-13 e o acompanhamento do CU-08:

| Situação atual | Ação | Quem pode fazer | Nova situação |
| --- | --- | --- | --- |
| Rascunho | Enviar para análise | Próprio autor | Em análise |
| Rejeitado | Corrigir e reenviar para análise | Próprio autor | Em análise |
| Em análise | Publicar | Guia/Administrador | Publicado |
| Em análise | Rejeitar, com motivo opcional | Guia/Administrador | Rejeitado |
| Publicado | Despublicar | Guia/Administrador | Rascunho |

Enquanto estiver em análise, o roteiro não pode ser editado. Somente os publicados aparecem na consulta pública, disponível para visitantes, turistas e guias. Essa consulta complementa a visualização dos roteiros de autoria do usuário.

## Relação entre avaliação e comentário

O diagrama mantém os casos de avaliações e comentários separados para explicar as funções. Na aplicação, o comentário faz parte da avaliação: a pessoa informa uma nota e um relato no mesmo formulário. Por isso, CU-09 e CU-10 acontecem juntos, assim como a consulta descrita em CU-04 e CU-05.

Os dados usados nas versões em PDF estão disponíveis em [casos-de-uso.json](diagramas/casos-de-uso.json).
