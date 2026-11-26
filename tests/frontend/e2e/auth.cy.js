import { API, accessToken, visit } from './helpers';

describe('CY-AUTH | Entrada, cadastro e rotas protegidas', () => {
  it('CY-AUTH-01 encaminha visitante ao login preservando destino', () => {
    visit('/roteiros/new');
    cy.location('pathname').should('eq', '/login');
    cy.location('search').should('eq', '?redirect=/roteiros/new');
  });
  it('CY-AUTH-02 exibe erro de credenciais sem sair do login', () => {
    cy.intercept('POST', `${API}/auth/login`, { statusCode: 401, body: { message: 'Credenciais inválidas' } }).as('login');
    visit('/login');
    cy.get('input[placeholder="E-mail"]').type('ana@example.test');
    cy.get('input[placeholder="Senha"]').type('Senha1!');
    cy.get('button[type="submit"]').click();
    cy.wait('@login').its('request.body').should('deep.equal', { email: 'ana@example.test', password: 'Senha1!' });
    cy.get('.error-message').should('contain', 'Credenciais inválidas');
    cy.location('pathname').should('eq', '/login');
    cy.get('button[type="submit"]').should('not.be.disabled');
  });
  it('CY-AUTH-03 autentica usando a resposta atual do back-end e retorna ao destino', () => {
    // O back-end atual retorna somente access_token.
    cy.intercept('POST', `${API}/auth/login`, { access_token: accessToken() }).as('login');
    visit('/login?redirect=/roteiros/new');
    cy.get('input[placeholder="E-mail"]').type('ana@example.test');
    cy.get('input[placeholder="Senha"]').type('Senha1!');
    cy.get('button[type="submit"]').click();
    cy.wait('@login');
    cy.location('pathname').should('eq', '/roteiros/new');
    cy.contains('h1', 'Criar novo roteiro').should('be.visible');
    cy.window().its('localStorage').invoke('getItem', 'access_token').should('be.a', 'string');
  });
  it('CY-AUTH-04 impede turista de acessar cadastro exclusivo de guia', () => {
    visit('/places/new', { role: 'USER' });
    cy.location('pathname').should('eq', '/');
    cy.contains('h1', 'Destinos para descobrir').should('be.visible');
    cy.get('#place-name').should('not.exist');
  });
  it('CY-AUTH-05 cadastra usuário antes de autenticar', () => {
    cy.intercept('POST', `${API}/users/cadastrar`, { statusCode: 201, body: { name: 'Ana Teste', email: 'ana@example.test', role: 'USER' } }).as('register');
    cy.intercept('POST', `${API}/auth/login`, { access_token: accessToken() }).as('login');
    cy.intercept('GET', `${API}/itineraries/meus`, []).as('mine');
    visit('/login');
    cy.contains('button', 'Cadastre-se').click();
    cy.get('input[placeholder="E-mail"]').type('ana@example.test');
    cy.get('input[placeholder="Senha"]').type('Senha1!');
    cy.get('input[placeholder="Seu nome completo"]').type('Ana Teste');
    cy.get('button[type="submit"]').click();
    cy.wait('@register').its('request.body').should('deep.equal', { name: 'Ana Teste', email: 'ana@example.test', password: 'Senha1!' });
    cy.wait('@login');
    cy.wait('@mine');
    cy.location('pathname').should('eq', '/roteiros');
  });
  it('CY-AUTH-06 recusa sessão expirada em rota protegida', () => {
    visit('/roteiros/new', { token: accessToken('USER', 1) });
    cy.location('pathname').should('eq', '/login');
  });
  it('CY-AUTH-07 permite guia acessar cadastro de destino', () => {
    visit('/places/new', { role: 'GUIA' });
    cy.location('pathname').should('eq', '/places/new');
    cy.get('form').should('exist');
    cy.contains('button', 'Salvar').should('be.visible');
  });
});
