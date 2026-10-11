export class UploadPhotoResponseDto {
  /** Identificador único do arquivo (nome seguro gerado no servidor) */
  fileId!: string;

  /**
   * URL pública para acesso ao arquivo, servida por uma rota controlada
   * (ex.: GET /reviews/photos/:fileId), nunca o caminho físico em disco.
   */
  url!: string;

  sizeInBytes!: number;
  mimeType!: string;
}
