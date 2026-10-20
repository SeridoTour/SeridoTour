// Detecta o tipo real da imagem lendo os "magic numbers" (assinatura binária)
// dos primeiros bytes do arquivo.
// A assinatura barra a maioria dos disfarces simples (ex.: .txt renomeado para .jpg),
// mas não é garantia absoluta: alguém pode colocar bytes válidos no início de um arquivo ruim.
// Por isso é uma camada de defesa junto com limite de tamanho, login e processamento do Cloudinary.
// Retorna 'image/jpeg', 'image/png', 'image/webp' ou null se não reconhecer.

export function detectImageMime(buffer: Buffer): string | null {
  // Precisa de pelo menos 12 bytes para conferir WEBP (RIFF + WEBP)
  if (!buffer || buffer.length < 12) return null;

  // JPEG: começa com FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 8 bytes fixos: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WEBP: bytes 0-3 = "RIFF" (52 49 46 46) E bytes 8-11 = "WEBP" (57 45 42 50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null; // não é nenhum dos formatos suportados
}