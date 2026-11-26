import { getErrorMessage, imageUrl, initials, normalizeText, formatDate } from '../../../apps/frontend/src/utils/format';

describe('FE-FORMAT | Busca, mensagens e apresentação', () => {
  it.each([['Açude de Caicó', 'acude de caico'], ['SÃO JOSÉ', 'sao jose'], ['', '']])(
    'FE-FORMAT-01 normaliza %s para %s', (input, expected) => {
      expect(normalizeText(input)).toBe(expected);
    },
  );
  it.each([[' Ana Maria Silva ', 'AM'], ['Ana', 'A'], ['', '']])(
    'FE-FORMAT-02 calcula iniciais de %s', (input, expected) => {
      expect(initials(input)).toBe(expected);
    },
  );
  it('FE-FORMAT-03 utiliza mensagem de erro da API', () => {
    expect(getErrorMessage({ isAxiosError: true, response: { data: { message: 'Não autorizado' } } }, 'Falha')).toBe('Não autorizado');
  });
  it('FE-FORMAT-04 reúne mensagens de validação da API', () => {
    expect(getErrorMessage({ isAxiosError: true, response: { data: { message: ['Nome obrigatório.', 'E-mail inválido.'] } } }, 'Falha')).toBe('Nome obrigatório. E-mail inválido.');
  });
  it.each([new Error('interno'), { isAxiosError: true }, { isAxiosError: true, response: { data: { message: 42 } } }])(
    'FE-FORMAT-05 retorna mensagem padrão para erro sem mensagem válida %#', (error) => {
      expect(getErrorMessage(error, 'Tente novamente')).toBe('Tente novamente');
    },
  );
  it.each([undefined, null, '', 'javascript:alert(1)', 'data:image/png;base64,abc', 'foto.jpg'])('FE-FORMAT-06 usa imagem padrão para URL inválida: %s', (value) => {
    expect(imageUrl(value)).toBe('/serido-sunset.png');
  });
  it('FE-FORMAT-07 mantém URL HTTPS e resolve caminho de upload', () => {
    expect(imageUrl('https://images.example.test/foto.jpg')).toBe('https://images.example.test/foto.jpg');
    expect(imageUrl('/uploads/foto.jpg')).toBe('http://localhost:3000/uploads/foto.jpg');
  });
  it('FE-FORMAT-08 formata data em português', () => {
    expect(formatDate('2026-11-26T12:00:00Z')).toMatch(/26.*nov.*2026/);
  });
});
