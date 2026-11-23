const fs = require('node:fs/promises');
const assert = require('node:assert/strict');
const base = 'https://seridotour-api-preview.onrender.com';

async function main() {
  assert.ok(process.env.PREVIEW_TEST_ACCOUNTS_FILE);
  const accounts = JSON.parse(await fs.readFile(process.env.PREVIEW_TEST_ACCOUNTS_FILE, 'utf8'));
  assert.deepEqual(accounts.map(({ email, role }) => ({ email, role })), [
    { email: 'Turistateste@gmail.com', role: 'USER' },
    { email: 'GuiaTeste@gmail.com', role: 'GUIA' },
  ]);
  const knownTokens = [];
  const call = (route, token, body, method = 'GET') => fetch(base + route, {
    method, redirect: 'error', signal: AbortSignal.timeout(25000),
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  try {
    assert.equal((await call('/health')).status, 200);
    assert.equal((await call('/users')).status, 401);
    for (const account of accounts) {
      const login = await call('/auth/login', null, { email: account.email, password: account.password }, 'POST');
      assert.equal(login.status, 201, 'Falha de login da conta de teste.');
      const first = (await login.json()).access_token;
      assert.ok(first);
      knownTokens.push(first);
      assert.equal((await call('/users', first)).status, account.role === 'GUIA' ? 200 : 403);
      const refresh = await call('/token/refresh', null, { tokenAnterior: first }, 'PUT');
      assert.equal(refresh.status, 200);
      const second = (await refresh.json()).access_token;
      assert.ok(second && second !== first);
      knownTokens.push(second);
      assert.equal((await call('/users', first)).status, 401);
      assert.equal((await call('/token/refresh', null, { tokenAnterior: first }, 'PUT')).status, 401);
      if (account.role === 'GUIA') {
        const response = await call('/users', second);
        assert.equal(response.status, 200);
        const users = await response.json();
        assert.equal(users.length, 2);
        assert.ok(users.every(user => !('password' in user) && !('hash' in user)));
        assert.deepEqual(users.map(user => user.email).sort(), accounts.map(user => user.email).sort());
      } else {
        assert.equal((await call('/places', second, {}, 'POST')).status, 403);
      }
      assert.equal((await call('/auth/logout', second, {}, 'POST')).status, 201);
      assert.equal((await call('/users', second)).status, 401);
      console.log(JSON.stringify({ role: account.role, login: true, refresh: true, replayRejected: true, logoutRevoked: true }));
    }
    const first = await (await call('/places?limit=1&page=1')).json();
    const second = await (await call('/places?limit=2&page=2')).json();
    const all = await (await call('/places?limit=100')).json();
    assert.equal(first.meta.limit, 1);
    assert.equal(first.data.length, 1);
    assert.equal(second.meta.page, 2);
    assert.equal(second.meta.limit, 2);
    assert.equal(second.data.length, 2);
    assert.equal(all.data.length, 6);
    assert.deepEqual(second.data.map(place => place.id), all.data.slice(2, 4).map(place => place.id));
    let reviews = 0;
    for (const place of all.data) {
      const entries = await (await call(`/reviews/place/${encodeURIComponent(place.id)}`)).json();
      assert.ok(entries.every(review => review.placeId === place.id));
      reviews += entries.length;
    }
    assert.equal(reviews, 1);
    console.log(JSON.stringify({ places: 6, reviews: 1, paginationIsolated: true, reviewsIsolated: true }));
  } finally {
    // Somente tokens emitidos por este teste; não deixar sessões de ensaio ativas.
    for (const token of knownTokens) {
      await call('/auth/logout', token, {}, 'POST').catch(() => {});
    }
  }
}
main().catch(() => { console.error('Smoke test do preview falhou; valores de credenciais e tokens foram omitidos.'); process.exitCode = 1; });
