import { randomUUID } from 'crypto';
import { extname } from 'path';

/**
 * Gera um nome de arquivo seguro e único, descartando completamente
 * o nome original enviado pelo cliente (evita path traversal, caracteres
 * especiais, colisões de nome e vazamento de informação do cliente).
 *
 * Mantém apenas a extensão (validada contra uma allowlist) para que o
 * arquivo continue sendo reconhecível pelo sistema operacional / CDN.
 */
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

export function buildSafeFilename(originalName: string): string {
  const ext = extname(originalName).toLowerCase();
  const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '.jpg';
  const uniqueName = `${Date.now()}-${randomUUID()}${safeExt}`;
  return uniqueName;
}
