/**
 * O `mimetype` enviado no multipart/form-data é uma informação DECLARADA
 * pelo cliente e pode ser falsificada. Para validar de fato que o
 * conteúdo é uma imagem, conferimos a assinatura binária (magic numbers)
 * dos primeiros bytes do arquivo.
 */
const SIGNATURES: { mime: string; bytes: number[] }[] = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  // WEBP: 'RIFF'....'WEBP' — verificamos o cabeçalho RIFF nos 4 primeiros bytes
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] },
];

export function isValidImageSignature(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 4) return false;

  return SIGNATURES.some((sig) =>
    sig.bytes.every((byte, index) => buffer[index] === byte),
  );
}
