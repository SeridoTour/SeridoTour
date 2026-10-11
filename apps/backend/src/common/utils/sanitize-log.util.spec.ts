import { sanitizeForLog } from './sanitize-log.util';

describe('sanitizeForLog', () => {
  it('deve redigir campos sensíveis conhecidos', () => {
    const input = {
      username: 'joao',
      password: '123456',
      headers: {
        authorization: 'Bearer abc.def.ghi',
        'content-type': 'application/json',
      },
      apiKey: 'chave-secreta',
    };

    const result = sanitizeForLog(input) as any;

    expect(result.username).toBe('joao');
    expect(result.password).toBe('***REDACTED***');
    expect(result.headers.authorization).toBe('***REDACTED***');
    expect(result.headers['content-type']).toBe('application/json');
    expect(result.apiKey).toBe('***REDACTED***');
  });

  it('deve funcionar recursivamente em arrays e objetos aninhados', () => {
    const input = {
      usuarios: [
        { nome: 'Ana', senha: 'abc123' },
        { nome: 'Bia', senha: 'def456' },
      ],
    };

    const result = sanitizeForLog(input) as any;

    expect(result.usuarios[0].nome).toBe('Ana');
    expect(result.usuarios[0].senha).toBe('***REDACTED***');
    expect(result.usuarios[1].senha).toBe('***REDACTED***');
  });

  it('não deve quebrar com valores nulos ou undefined', () => {
    expect(sanitizeForLog(null)).toBeNull();
    expect(sanitizeForLog(undefined)).toBeUndefined();
  });
});
