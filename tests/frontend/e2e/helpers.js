// Intercepta somente o host fictício da API para não atingir os módulos do Vite.
export const API = 'http://127.0.0.1:3999';
export const PLACE_ID = '11111111-1111-4111-8111-111111111111';

export function accessToken(role = 'USER', exp = Math.floor(Date.now() / 1000) + 3600) {
  const payload = { sub: 'user-teste', name: 'Ana Teste', role, exp };
  return `e30.${btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}.ficticio`;
}

export function visit(path, { role, token } = {}) {
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.clear();
      win.localStorage.setItem('seridotour:show-map', 'false');
      if (role || token) win.localStorage.setItem('access_token', token || accessToken(role));
    },
  });
}
