import { clearRouteRecovery, recoverRoute } from '../../../apps/frontend/src/utils/routeRecovery'

describe('FE-NAV | Recuperação de telas após deploy', () => {
  const navigate = jest.fn()
  beforeEach(() => { sessionStorage.clear(); navigate.mockClear() })

  it.each(['/roteiros/new', '/places/new', '/moderacao?status=EM_ANALISE'])(
    'recupera arquivo antigo preservando o destino %s', (path) => {
      expect(recoverRoute(new TypeError('Failed to fetch dynamically imported module: /assets/old.js'), path, navigate)).toBe(true)
      expect(navigate).toHaveBeenCalledWith(path)
    },
  )

  it('não entra em loop se o arquivo continuar indisponível após recarregar', () => {
    const error = new TypeError('Importing a module script failed.')
    recoverRoute(error, '/moderacao', navigate)
    expect(recoverRoute(error, '/moderacao', navigate)).toBe(false)
    expect(navigate).toHaveBeenCalledTimes(1)
    clearRouteRecovery()
    expect(recoverRoute(error, '/moderacao', navigate)).toBe(true)
  })

  it('não recarrega por erro da aplicação ou destino externo', () => {
    expect(recoverRoute(new Error('Request failed with status code 403'), '/places/new', navigate)).toBe(false)
    expect(recoverRoute(new Error('Failed to fetch dynamically imported module'), '//example.com', navigate)).toBe(false)
    expect(navigate).not.toHaveBeenCalled()
  })

  it('não recarrega sem conseguir registrar a tentativa', () => {
    const storage = { getItem: () => { throw new Error('Storage indisponível') }, setItem: jest.fn() }
    expect(recoverRoute(new Error('Unable to preload CSS'), '/places/new', navigate, storage)).toBe(false)
    expect(navigate).not.toHaveBeenCalled()
  })
})
