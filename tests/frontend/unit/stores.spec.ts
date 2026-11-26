import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { useFavoritesStore } from '../../../apps/frontend/src/stores/favorites';
import { usePreferencesStore } from '../../../apps/frontend/src/stores/preferences';
import { useAuthStore } from '../../../apps/frontend/src/stores/auth';
import { api, refreshAccessToken } from '../../../apps/frontend/src/services/api';

jest.mock('../../../apps/frontend/src/services/api', () => ({
  api: { post: jest.fn(), defaults: { baseURL: 'http://api.example.test', headers: { common: {} } } },
  refreshAccessToken: jest.fn(),
}));

function jwt(payload: Record<string, unknown>) {
  const base64url = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `header.${base64url}.assinatura-ficticia`;
}

describe('FE-FAV | Favoritos persistidos', () => {
  it('FE-FAV-01 inicia vazio quando não há dados', () => {
    expect(useFavoritesStore().favorites).toEqual({ places: [], itineraries: [] });
  });
  it('FE-FAV-02 ignora JSON corrompido', () => {
    localStorage.setItem('seridotour:favorites', '{inválido');
    expect(useFavoritesStore().favorites).toEqual({ places: [], itineraries: [] });
  });
  it('FE-FAV-03 filtra IDs inválidos nos dados salvos', () => {
    localStorage.setItem('seridotour:favorites', JSON.stringify({ places: ['p1', 42, null], itineraries: 'inválido' }));
    expect(useFavoritesStore().favorites).toEqual({ places: ['p1'], itineraries: [] });
  });
  it('FE-FAV-04 adiciona, persiste e remove favorito sem afetar roteiros', async () => {
    const store = useFavoritesStore();
    store.toggle('itineraries', 'i1');
    store.toggle('places', 'p1');
    await nextTick();
    expect(store.has('places', 'p1')).toBe(true);
    expect(JSON.parse(localStorage.getItem('seridotour:favorites')!)).toEqual({ places: ['p1'], itineraries: ['i1'] });
    store.toggle('places', 'p1');
    await nextTick();
    expect(store.has('places', 'p1')).toBe(false);
    expect(store.has('itineraries', 'i1')).toBe(true);
    setActivePinia(createPinia());
    expect(useFavoritesStore().favorites).toEqual({ places: [], itineraries: ['i1'] });
  });
});

describe('FE-PREF | Preferência de mapa', () => {
  it('FE-PREF-01 exibe mapa por padrão', () => {
    expect(usePreferencesStore().showMap).toBe(true);
  });
  it('FE-PREF-02 restaura mapa oculto e persiste alteração', async () => {
    localStorage.setItem('seridotour:show-map', 'false');
    const store = usePreferencesStore();
    expect(store.showMap).toBe(false);
    store.showMap = true;
    await nextTick();
    expect(localStorage.getItem('seridotour:show-map')).toBe('true');
  });
});

describe('FE-AUTH | Sessão e perfil', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetAllMocks();
  });
  it('FE-AUTH-01 inicia visitante sem sessão', () => {
    const store = useAuthStore();
    expect(store.isAuthenticated).toBe(false);
    expect(store.isGuia).toBe(false);
  });
  it('FE-AUTH-02 recupera nome Unicode e perfil GUIA do JWT', () => {
    const store = useAuthStore();
    const token = jwt({ sub: 'u1', name: 'João', role: 'GUIA' });
    store.setTokens(token);
    expect(store.user).toMatchObject({ id: 'u1', name: 'João', role: 'GUIA' });
    expect(store.isAuthenticated).toBe(true);
    expect(store.isGuia).toBe(true);
    expect(localStorage.getItem('access_token')).toBe(token);
  });
  it.each(['invalido', 'header.%%%broken.assinatura', jwt({ role: 'USER' }), jwt({ sub: 'u1', exp: 1 })])(
    'FE-AUTH-03 recusa JWT inválido ou expirado %#', (token) => {
      localStorage.setItem('access_token', token);
      expect(useAuthStore().isAuthenticated).toBe(false);
    },
  );
  it('FE-AUTH-04 envia credenciais e guarda e-mail ausente no JWT', async () => {
    const access = jwt({ sub: 'u1', name: 'Ana', role: 'USER' });
    (api.post as jest.Mock).mockResolvedValue({ data: { access_token: access } });
    const store = useAuthStore();
    await store.login({ email: 'ana@example.test', password: 'Senha1!' });
    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'ana@example.test', password: 'Senha1!' });
    expect(store.user?.email).toBe('ana@example.test');
  });
  it('FE-AUTH-05 cadastra e autentica em sequência', async () => {
    const access = jwt({ sub: 'u1', name: 'Ana', role: 'USER' });
    (api.post as jest.Mock).mockResolvedValueOnce({ data: {} }).mockResolvedValueOnce({ data: { access_token: access } });
    const payload = { name: 'Ana', email: 'ana@example.test', password: 'Senha1!' };
    const store = useAuthStore();
    await store.register(payload);
    expect(api.post).toHaveBeenNthCalledWith(1, '/users/cadastrar', payload);
    expect(api.post).toHaveBeenNthCalledWith(2, '/auth/login', { email: payload.email, password: payload.password });
    expect(store.isAuthenticated).toBe(true);
  });
  it('FE-AUTH-06 não tenta renovar sem sessão', async () => {
    await expect(useAuthStore().refreshSession()).resolves.toBe(false);
    expect(refreshAccessToken).not.toHaveBeenCalled();
  });
  it('FE-AUTH-07 renova usando somente access_token, conforme o contrato da API', async () => {
    const store = useAuthStore();
    store.setTokens(jwt({ sub: 'u1', role: 'USER' }));
    const access = jwt({ sub: 'u1', role: 'GUIA' });
    (refreshAccessToken as jest.Mock).mockResolvedValue(access);
    await expect(store.refreshSession()).resolves.toBe(true);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(store.accessToken).toBe(access);
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(store.isGuia).toBe(true);
  });
  it('FE-AUTH-08 limpa sessão se a API recusar a renovação', async () => {
    const store = useAuthStore();
    store.setTokens(jwt({ sub: 'u1', role: 'USER' }));
    (refreshAccessToken as jest.Mock).mockRejectedValue(new Error('Sessão revogada'));
    await expect(store.refreshSession()).resolves.toBe(false);
    expect(store.isAuthenticated).toBe(false);
    expect(localStorage.getItem('access_token')).toBeNull();
  });
  it('FE-AUTH-09 agenda renovação na expiração do access token', async () => {
    const now = Math.floor(Date.now() / 1000) * 1000;
    jest.setSystemTime(now);
    (refreshAccessToken as jest.Mock).mockResolvedValue(jwt({ sub: 'u1', role: 'USER' }));
    useAuthStore().setTokens(jwt({ sub: 'u1', role: 'USER', exp: now / 1000 + 90 }));
    await jest.advanceTimersByTimeAsync(89_999);
    expect(refreshAccessToken).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
  });
  it('FE-AUTH-10 logout solicita revogação, remove tokens e cancela renovação', async () => {
    const store = useAuthStore();
    store.setTokens(jwt({ sub: 'u1', role: 'USER', exp: Math.floor(Date.now() / 1000) + 90 }));
    await store.logout();
    expect(api.post).toHaveBeenCalledWith('/auth/logout');
    expect(store.isAuthenticated).toBe(false);
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(jest.getTimerCount()).toBe(0);
  });
});
