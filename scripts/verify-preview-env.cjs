// Executado somente pelo serviço Render de preview, antes de iniciar a API.
const errors = [];
const env = process.env;

if (env.DEPLOYMENT_ENV !== 'preview') {
  errors.push('DEPLOYMENT_ENV deve ser preview.');
}
if (env.RENDER_SERVICE_NAME && env.RENDER_SERVICE_NAME !== 'seridotour-api-preview') {
  errors.push('Este comando pertence somente ao serviço seridotour-api-preview.');
}
if (env.RENDER_GIT_BRANCH && env.RENDER_GIT_BRANCH !== 'codex/preview-geoparque') {
  errors.push('A branch do serviço deve ser codex/preview-geoparque.');
}

try {
  const database = new URL(env.DATABASE_URL);
  const allowedHosts = [
    'ep-tiny-bonus-at29rygs.c-9.us-east-1.aws.neon.tech',
    'ep-tiny-bonus-at29rygs-pooler.c-9.us-east-1.aws.neon.tech',
  ];
  if (
    !['postgres:', 'postgresql:'].includes(database.protocol) ||
    !allowedHosts.includes(database.hostname) ||
    database.pathname !== '/northeastour' ||
    (database.port && database.port !== '5432') ||
    !['require', 'verify-full'].includes(database.searchParams.get('sslmode'))
  ) {
    errors.push('DATABASE_URL deve usar SSL e a base northeastour do endpoint development-seridotour.');
  }
} catch {
  errors.push('DATABASE_URL ausente ou inválida.');
}

const origins = (env.CORS_ORIGIN || '').split(',').map((origin) => origin.trim());
for (const origin of origins) {
  try {
    const url = new URL(origin);
    if (
      url.protocol !== 'https:' || url.origin !== origin ||
      !url.hostname.endsWith('.vercel.app') ||
      ['seridotour.vercel.app', 'northeas-tour-frontend.vercel.app'].includes(url.hostname)
    ) {
      errors.push('CORS_ORIGIN deve conter somente origens HTTPS exatas do preview Vercel.');
    }
  } catch {
    errors.push('CORS_ORIGIN ausente ou inválida.');
  }
}

if (env.CLOUDINARY_FOLDER_PREFIX !== 'seridotour/development-seridotour') {
  errors.push('CLOUDINARY_FOLDER_PREFIX deve apontar para a pasta exclusiva de desenvolvimento.');
}
if (!['false', 'true'].includes(env.PREVIEW_DATA_REVIEWED)) {
  errors.push('PREVIEW_DATA_REVIEWED deve ser false até a limpeza revisada dos dados.');
}

if (errors.length) {
  // Nunca imprimir valores de variáveis: DATABASE_URL contém credenciais.
  console.error('Inicialização do preview bloqueada:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('Destino do preview validado: development-seridotour / northeastour.');
