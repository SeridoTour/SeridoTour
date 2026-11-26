import { API } from './helpers';

beforeEach(() => {
  cy.intercept({ hostname: '127.0.0.1', port: 3999 }, { statusCode: 500, body: { message: 'Requisição sem fixture: configure a resposta no teste.' } });
  cy.intercept('GET', `${API}/places?*`, { fixture: 'places.json' }).as('places');
});
