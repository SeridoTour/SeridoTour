# EXPLICACAO-UPLOAD.md

## 1. Resumo do problema e da solução

**Problema:** O upload de imagens era feito salvando arquivos no disco do servidor (pasta `./storage/reviews-photos`). Isso não escala: em produção com vários servidores, os arquivos ficam presos em uma máquina só; backups ficam complicados; o servidor precisa lidar com arquivos físicos.

**Solução:** Migramos para **Cloudinary** (serviço de gerenciamento de imagens na nuvem). Agora o backend recebe a imagem na memória (RAM), valida o conteúdo real (magic numbers), envia via stream para o Cloudinary e salva só a **URL HTTPS** no banco de dados. O frontend envia tudo em **uma única requisição** `multipart/form-data` (dados + arquivo juntos).

---

## 2. Glossário dos termos técnicos

| Termo | Explicação simples | Exemplo do dia a dia |
|-------|-------------------|----------------------|
| **multipart/form-data** | Formato de requisição HTTP que permite enviar **campos de texto** e **arquivos binários** juntos na mesma mensagem. | Um formulário web onde você preenche nome, e-mail e **anexa uma foto** — tudo vai num único "envelope". |
| **buffer** | Área na memória (RAM) onde ficam os bytes brutos do arquivo enquanto o servidor processa. Não toca o disco. | Como uma **mesa de trabalho temporária**: você põe os papéis (bytes) lá, faz o que precisa, e depois entrega para o destino (Cloudinary). |
| **memoryStorage** | Configuração do Multer que diz "guarde o arquivo na RAM (buffer), não no disco". | Em vez de salvar o anexo numa pasta do computador, você **segura na mão** enquanto decide o que fazer. |
| **magic number** | Sequência de bytes no **início do arquivo** que identifica o tipo real (ex.: JPEG começa com `FF D8 FF`). Não depende da extensão. | A **assinatura** de um documento: olha os primeiros caracteres e sabe se é PDF, Word ou imagem, mesmo se o nome do arquivo mentir. |
| **pipe** | No NestJS, um cano que **transforma ou valida** os dados antes de chegar no controller. Roda automaticamente. | Um **filtro de água**: a água (dados) passa, mas sujeira (arquivo inválido) é barrada antes de chegar na torneira (controller). |
| **guard** | No NestJS, uma barreira que **decide se a requisição pode prosseguir** (ex.: usuário logado? tem role GUIA?). | O **porteiro da balada**: confere a identidade (JWT) e a pulseira (role) antes de deixar entrar. |
| **DTO** (Data Transfer Object) | Classe que define **o formato esperado dos dados** que chegam na API (validação automática com class-validator). | Um **formulário padronizado**: "nome: texto obrigatório, rating: número 1-5, comment: opcional". Se faltar algo, devolve erro. |
| **Cloudinary** | Serviço na nuvem para **upload, transformação e entrega de imagens** via CDN. Guarda o arquivo e te dá uma URL HTTPS. | Como o **Google Fotos para desenvolvedores**: você manda a foto, eles guardam, otimizam e te dão o link para usar no site. |
| **imageUrl** | Campo no banco (string) que guarda **somente a URL pública da imagem no Cloudinary** (ex.: `https://res.cloudinary.com/.../image.jpg`). | O **endereço da foto na internet** — o front só precisa colocar num `<img src="...">` e a imagem aparece. |

---

## 3. Tabela: arquivo → o que mudou → por quê

| Arquivo | O que mudou | Por quê |
|---------|-------------|---------|
| `.env.example` | Adicionadas variáveis `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Credenciais necessárias para o backend autenticar no Cloudinary. |
| `apps/backend/package.json` | Adicionada dependência `cloudinary@^2.11.0` | SDK oficial para falar com a API do Cloudinary (upload via stream). |
| `apps/backend/prisma/schema.prisma` | `Place.imageUrl` (opcional) adicionado; `Review.photoUrl` renomeado para `imageUrl` | Padroniza o nome do campo; guarda só a URL do Cloudinary (não caminho local). |
| `apps/backend/src/app.module.ts` | Importa `CloudinaryModule`; valida variáveis Cloudinary no Joi; remove `ReviewsUploadModule` | Configuração central: carrega credenciais, valida na inicialização, disponibiliza service global. |
| `apps/backend/src/common/upload/image-signature.util.ts` | **Novo arquivo**. Função `detectImageMime(buffer)` lê magic numbers (JPEG/PNG/WEBP) | Validação real do conteúdo: barra arquivo com extensão mentirosa (ex.: `.exe` renomeado para `.jpg`). |
| `apps/backend/src/common/upload/image-upload.config.ts` | **Novo arquivo**. Config Multer com `memoryStorage`, limite 5MB, fileFilter por mime-type declarado | Recebe arquivo na RAM (rápido, sem lixo no disco); primeira barreira pelo content-type do cliente. |
| `apps/backend/src/common/upload/image-validation.pipe.ts` | **Novo arquivo**. Pipe `ImageValidationPipe` valida tamanho + magic numbers antes do controller | Segunda barreira: confere bytes reais (magic numbers) e tamanho; se falha, erro 400 antes do controller. |
| `apps/backend/src/modules/cloudinary/cloudinary.module.ts` | **Novo arquivo**. Module NestJS que exporta `CloudinaryService` | Permite injetar o service em `PlacesModule` e `ReviewsModule` sem repetir configuração. |
| `apps/backend/src/modules/cloudinary/cloudinary.service.ts` | **Novo arquivo**. `uploadImage(file, folder)` envia buffer via stream para Cloudinary e retorna `secure_url` | Upload direto da memória para a nuvem; não cria arquivo temporário no servidor. |
| `apps/backend/src/modules/places/places.controller.ts` | Adiciona `@UseInterceptors(FileInterceptor('image', ...))`, `@UploadedFile(ImageValidationPipe)`, guards GUIA | Recebe imagem no campo `image` do multipart; valida; só GUIA pode criar/editar places. |
| `apps/backend/src/modules/places/places.module.ts` | Importa `CloudinaryModule` | Disponibiliza `CloudinaryService` para o `PlacesService`. |
| `apps/backend/src/modules/places/places.service.ts` | `create()` e `update()` recebem `image?`, fazem upload no Cloudinary se houver, salvam `imageUrl` | Lógica de negócio: primeiro valida dados, depois (se houver imagem) sobe para Cloudinary, salva URL no banco. |
| `apps/backend/src/modules/reviews/config/multer.config.ts` | **Removido** (era diskStorage local) | Substituído pela configuração compartilhada em `common/upload/image-upload.config.ts`. |
| `apps/backend/src/modules/reviews/dto/create-review.dto.ts` | Removido campo `photoUrl` | O frontend agora envia o arquivo direto; o backend faz upload e gera a URL. |
| `apps/backend/src/modules/reviews/dto/upload-photo-response.dto.ts` | **Removido** | Não existe mais endpoint separado de upload de foto. |
| `apps/backend/src/modules/reviews/reviews-upload.controller.ts` | **Removido** | Endpoint `/reviews/photos` (upload separado + serve arquivo local) eliminado. |
| `apps/backend/src/modules/reviews/reviews-upload.module.ts` | **Removido** | Módulo antigo de upload local removido. |
| `apps/backend/src/modules/reviews/reviews.controller.ts` | Adiciona `FileInterceptor('image', ...)`, `ImageValidationPipe`, `MulterExceptionFilter` | Mesmo padrão do Places: uma requisição só, validação em pipe, erro limpo se arquivo inválido. |
| `apps/backend/src/modules/reviews/reviews.module.ts` | Importa `CloudinaryModule`; remove `ReviewsUploadController` | Usa o novo serviço de Cloudinary; controller de upload local removido. |
| `apps/backend/src/modules/reviews/reviews.service.ts` | `create()` recebe `image?`, confere Place existe **antes** de subir imagem, salva `imageUrl` | Ordem segura: valida se o place existe → sobe imagem → cria review. Evita upload órfão. |
| `apps/backend/src/modules/reviews/utils/image-signature.util.ts` | **Removido** | Substituído pela versão compartilhada em `common/upload/image-signature.util.ts`. |
| `apps/backend/src/modules/reviews/utils/safe-filename.util.ts` | **Removido** | Não precisa mais gerar nome seguro de arquivo local (Cloudinary cuida disso). |
| `apps/frontend/src/services/places.ts` | Adicionado `imageUrl?: string | null` no tipo `Place` | Frontend tipa o campo que vem do backend. |
| `apps/frontend/src/views/PlaceDetailsView.vue` | Exibe `place.imageUrl`; reviews usam `review.imageUrl`; `submitReview` usa `FormData` único | Mostra a imagem do place; envia review + foto numa requisição só (antes eram duas). |
| `apps/frontend/src/views/PlaceFormView.vue` | Adiciona input `type="file"`, validação client-side (tamanho/tipo), preview local, envia `FormData` com campo `image` | Guia anexa imagem ao criar/editar place; vê preview antes de enviar; usa multipart/form-data. |

---

## 4. Caminho de uma imagem: do navegador até o Cloudinary e o banco

**Cenário:** Um guia cadastra um novo ponto turístico com foto.

1. **Navegador (Vue):** Usuário preenche formulário e escolhe arquivo no `<input type="file">`.
2. **Navegador (Vue):** Ao clicar "Salvar", o código cria `new FormData()`, adiciona todos os campos de texto (`name`, `description`, etc.) e faz `formData.append('image', arquivo)`.
3. **Rede:** Requisição `POST /places` sai com header `Content-Type: multipart/form-data; boundary=...` — o navegador monta o corpo com as partes separadas pelo boundary.
4. **Backend (NestJS - Guard):** `JwtAuthGuard` confere token JWT válido; `RolesGuard` confere role `GUIA`. Se falhar, para aqui (401/403).
5. **Backend (Multer - Interceptor):** `FileInterceptor('image', imageUploadMulterOptions)` lê o multipart, pega a parte `image`, coloca os bytes em `file.buffer` (RAM), confere `file.mimetype` declarado e tamanho ≤ 5MB. Se falhar, `MulterExceptionFilter` devolve JSON 400.
6. **Backend (Pipe):** `ImageValidationPipe` recebe `file` (ou `undefined` se não enviou). Se há arquivo: confere `file.size` ≤ 5MB **de novo** e roda `detectImageMime(file.buffer)` (magic numbers). Se não for JPEG/PNG/WEBP real → 400. Se ok, devolve o `file` validado.
7. **Backend (Controller):** `create(createPlaceDto, image)` recebe DTO validado + arquivo validado (ou `undefined`).
8. **Backend (Service - PlacesService.create):** Se `image` existe, chama `this.cloudinary.uploadImage(image, 'places')`.
9. **Backend (CloudinaryService.uploadImage):** Abre `cloudinary.uploader.upload_stream({ folder: 'places', resource_type: 'image' }, callback)` e faz `uploadStream.end(file.buffer)`. Os bytes fluem da RAM direto para o Cloudinary via stream (sem arquivo no disco).
10. **Cloudinary (nuvem):** Recebe o stream, processa, guarda no storage/CDN e responde com `UploadApiResponse` contendo `secure_url` (HTTPS).
11. **Backend (Service):** Recebe a `secure_url`, salva no Prisma: `data: { ...createPlaceDto, imageUrl }`.
12. **Banco (PostgreSQL):** Linha na tabela `Place` criada com coluna `imageUrl` preenchida (ex.: `https://res.cloudinary.com/xyz/image/upload/v123/places/abc.jpg`).
13. **Backend → Frontend:** Retorna o place criado (com `imageUrl`). Frontend mostra a imagem com `<img :src="place.imageUrl">`.

---

## 5. Cinco perguntas que um professor poderia fazer (com respostas curtas)

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | **Por que não salvar a imagem direto no banco como BLOB?** | Banco relacional não é feito para binários grandes: incharia o backup, tornaria queries lentas e o PostgreSQL tem limite de 1GB por campo (TOAST). URL no banco + arquivo no Cloudinary é o padrão da indústria. |
| 2 | **Qual a diferença entre o `fileFilter` do Multer e o `ImageValidationPipe`?** | `fileFilter` olha só o `mimetype` **declarado pelo cliente** (pode mentir). `ImageValidationPipe` lê os **bytes reais** (magic numbers) no buffer — é a validação de verdade. |
| 3 | **Por que usar `memoryStorage` em vez de `diskStorage`?** | Evita escrever/ler arquivo temporário no disco (I/O lento, lixo se der erro, não funciona em serverless/containers efêmeros). O buffer na RAM vai direto pro stream do Cloudinary. |
| 4 | **O que acontece se o upload no Cloudinary falhar (ex.: rede cai)?** | O `upload_stream` chama o callback com `error`; o `CloudinaryService` rejeita a Promise com `InternalServerErrorException` (500). A transação do Prisma **não** é commitada (o place/review não é criado). |
| 5 | **Por que o `ReviewsService.create` confere se o `Place` existe **antes** de subir a imagem?** | Para não gastar banda/processamento subindo imagem para um place que não existe. Se o place não existe, lança `NotFoundException` (404) e o upload **não acontece**. |