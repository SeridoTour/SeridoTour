import { API, PLACE_ID, visit } from './helpers';

describe('CY-ITIN | Criação e edição de roteiros', () => {
  const itinerary = { id: 'itinerary-teste', title: 'Fim de semana no Seridó', description: 'Natureza e cultura', duracaoDias: 2, userId: 'user-teste', status: 'RASCUNHO', places: [] };

  function fillForm() {
    cy.get('#itinerary-title').type(itinerary.title);
    cy.get('#itinerary-description').type(itinerary.description);
    cy.get('#itinerary-duration').clear().type('2');
  }
  it('CY-ITIN-01 exige ao menos um destino antes de chamar a API', () => {
    cy.intercept('POST', `${API}/itineraries`, cy.stub().as('saveRequest'));
    visit('/roteiros/new', { role: 'USER' });
    cy.wait('@places');
    fillForm();
    cy.contains('button', 'Salvar roteiro').click();
    cy.get('[role="alert"]').should('contain', 'Selecione pelo menos um local');
    cy.get('@saveRequest').should('not.have.been.called');
  });
  it('CY-ITIN-02 envia dados do formulário e mostra o roteiro salvo', () => {
    cy.intercept('POST', `${API}/itineraries`, { statusCode: 201, body: itinerary }).as('save');
    cy.intercept('GET', `${API}/itineraries/${itinerary.id}`, itinerary).as('details');
    visit('/roteiros/new', { role: 'USER' });
    cy.wait('@places');
    fillForm();
    cy.get(`input[type="checkbox"][value="${PLACE_ID}"]`).check();
    cy.contains('button', 'Salvar roteiro').click();
    cy.wait('@save').its('request.body').should('deep.equal', { title: itinerary.title, description: itinerary.description, duracaoDias: 2, placeIds: [PLACE_ID] });
    cy.wait('@details');
    cy.location('pathname').should('eq', `/roteiros/${itinerary.id}`);
    cy.location('search').should('include', 'saved=1');
    cy.contains('h1', itinerary.title).should('be.visible');
  });
  it('CY-ITIN-03 bloqueia edição de roteiro em análise', () => {
    cy.intercept('GET', `${API}/itineraries/${itinerary.id}`, { ...itinerary, status: 'EM_ANALISE' });
    visit(`/roteiros/${itinerary.id}/edit`, { role: 'USER' });
    cy.get('[role="alert"]').should('contain', 'Este roteiro está em análise');
    cy.get('#itinerary-title').should('not.exist');
  });
  it('CY-ITIN-04 bloqueia edição de roteiro de outro autor', () => {
    cy.intercept('GET', `${API}/itineraries/${itinerary.id}`, { ...itinerary, userId: 'outro-autor' });
    visit(`/roteiros/${itinerary.id}/edit`, { role: 'USER' });
    cy.get('[role="alert"]').should('contain', 'Você só pode editar seus próprios roteiros');
    cy.get('#itinerary-title').should('not.exist');
  });
  it('CY-ITIN-05 apresenta falha ao salvar e mantém os dados preenchidos', () => {
    cy.intercept('POST', `${API}/itineraries`, { statusCode: 500, body: { message: 'Não foi possível gravar o roteiro' } }).as('save');
    visit('/roteiros/new', { role: 'USER' });
    cy.wait('@places');
    fillForm();
    cy.get(`input[type="checkbox"][value="${PLACE_ID}"]`).check();
    cy.contains('button', 'Salvar roteiro').click();
    cy.wait('@save');
    cy.get('[role="alert"]').should('contain', 'Não foi possível gravar o roteiro');
    cy.get('#itinerary-title').should('have.value', itinerary.title);
    cy.contains('button', 'Salvar roteiro').should('not.be.disabled');
  });
});
