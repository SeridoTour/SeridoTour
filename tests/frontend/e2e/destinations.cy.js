import { API, visit } from './helpers';

describe('CY-DEST | Exploração de destinos', () => {
  it('CY-DEST-01 apresenta os destinos retornados pela API', () => {
    visit('/');
    cy.wait('@places');
    cy.get('section[aria-label="Destinos"] .destination-card').should('have.length', 2);
    cy.contains('h2', 'Açude do Seridó').should('be.visible');
    cy.contains('h2', 'Museu do Sertão').should('be.visible');
  });
  it('CY-DEST-02 filtra por categoria e restaura todos', () => {
    visit('/');
    cy.wait('@places');
    cy.get('[aria-label="Filtrar destinos por categoria"]').contains('button', 'Histórico').click();
    cy.get('.destination-card').should('have.length', 1).and('contain', 'Museu do Sertão');
    cy.get('[aria-label="Filtrar destinos por categoria"]').contains('button', 'Todos').click();
    cy.get('.destination-card').should('have.length', 2);
  });
  it('CY-DEST-03 busca cidade sem exigir acentos', () => {
    visit('/');
    cy.wait('@places');
    cy.get('input[aria-label="Buscar destinos ou cidades"]').type('caico{enter}');
    cy.location('search').should('include', 'q=caico');
    cy.get('.destination-card').should('have.length', 1).and('contain', 'Açude do Seridó');
  });
  it('CY-DEST-04 mostra estado vazio quando a busca não encontra destinos', () => {
    visit('/?q=inexistente');
    cy.wait('@places');
    cy.contains('h2', 'Nenhum destino encontrado').should('be.visible');
    cy.get('.destination-card').should('not.exist');
  });
  it('CY-DEST-05 informa falha de API e permite tentar novamente', () => {
    cy.intercept('GET', `${API}/places?*`, { statusCode: 503, body: { message: 'Destinos temporariamente indisponíveis' } }).as('unavailable');
    visit('/');
    cy.wait('@unavailable');
    cy.get('[role="alert"]').should('contain', 'Destinos temporariamente indisponíveis');
    cy.intercept('GET', `${API}/places?*`, { fixture: 'places.json' }).as('recovered');
    cy.contains('button', 'Tentar novamente').click();
    cy.wait('@recovered');
    cy.get('.destination-card').should('have.length', 2);
    cy.get('[role="alert"]').should('not.exist');
  });
  it('CY-DEST-06 mantém favorito após recarregar a página', () => {
    visit('/');
    cy.wait('@places');
    cy.get('button[aria-label="Adicionar aos favoritos: Açude do Seridó"]').click().should('have.attr', 'aria-pressed', 'true');
    cy.reload();
    cy.wait('@places');
    cy.get('button[aria-label="Remover dos favoritos: Açude do Seridó"]').should('have.attr', 'aria-pressed', 'true').click().should('have.attr', 'aria-pressed', 'false');
  });
  it('CY-DEST-07 pagina destinos e redefine a página ao filtrar', () => {
    cy.fixture('places.json').then((response) => {
      const data = Array.from({ length: 7 }, (_, index) => ({ ...response.data[0], id: `place-${index}`, name: `Destino ${index + 1}`, category: index === 6 ? 'Histórico' : 'Natureza' }));
      cy.intercept('GET', `${API}/places?*`, { ...response, data, meta: { total: 7, page: 1, limit: 100, totalPages: 1 } });
    });
    visit('/');
    cy.get('.destination-card').should('have.length', 6);
    cy.get('[aria-label="Páginas de destinos"]').contains('button', 'Próxima').click();
    cy.get('.destination-card').should('have.length', 1).and('contain', 'Destino 7');
    cy.get('[aria-label="Filtrar destinos por categoria"]').contains('button', 'Natureza').click();
    cy.get('.destination-card').should('have.length', 6);
    cy.get('[aria-label="Páginas de destinos"]').should('not.exist');
  });
});
