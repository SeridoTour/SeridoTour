const recoveryKey = 'seridotour:route-recovery'

// Uma aba antiga pode referenciar arquivos removidos por um novo deploy.
export function recoverRoute(
  error: unknown,
  path: string,
  navigate = (target: string) => window.location.assign(target),
  storage: Pick<Storage, 'getItem' | 'setItem'> = sessionStorage,
): boolean {
  if (
    !(error instanceof Error) ||
    !/Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i.test(error.message) ||
    !/^\/(?!\/)/.test(path)
  ) return false

  try {
    // Mantém o destino e a sessão, com uma única tentativa para evitar loops.
    if (storage.getItem(recoveryKey) === path) return false
    storage.setItem(recoveryKey, path)
  } catch {
    return false
  }
  navigate(path)
  return true
}

export function clearRouteRecovery() {
  try {
    sessionStorage.removeItem(recoveryKey)
  } catch {
    // Navegação normal continua disponível sem acesso ao armazenamento.
  }
}
