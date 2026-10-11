/**
 * Lista de chaves consideradas sensíveis. Qualquer campo (em qualquer nível
 * do objeto) cujo nome bata com um destes termos (case-insensitive) tem
 * seu valor substituído por "***REDACTED***" antes de ir para o log.
 *
 * Ajuste esta lista conforme novos campos sensíveis surgirem no domínio
 * da aplicação (ex: "cpf", "cartao", "endereco" caso passem a existir).
 */
const SENSITIVE_KEYS = [
  'password',
  'senha',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'apikey',
  'api_key',
  'secret',
  'openweather_api_key',
  'cookie',
  'credit_card',
  'cartao',
  'cvv',
];

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[_-]/g, '');
  return SENSITIVE_KEYS.some((sensitive) =>
    normalized.includes(sensitive.replace(/[_-]/g, '')),
  );
}

/**
 * Retorna uma cópia "segura" de um objeto (body, headers, params, query),
 * redigindo recursivamente qualquer campo sensível. Usar sempre antes de
 * mandar dados de requisição/erro para o logger.
 */
export function sanitizeForLog(input: unknown, depth = 0): unknown {
  if (depth > 5 || input === null || input === undefined) {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeForLog(item, depth + 1));
  }

  if (typeof input === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(
      input as Record<string, unknown>,
    )) {
      result[key] = isSensitiveKey(key)
        ? '***REDACTED***'
        : sanitizeForLog(value, depth + 1);
    }
    return result;
  }

  return input;
}
