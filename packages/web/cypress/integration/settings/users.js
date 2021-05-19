/// <reference types="cypress" />

const user = require('../../fixtures/valid_user.json')

context('Settings > Users', () => {
  before(() => {
    cy.login(user)
  })

  beforeEach(() => {
    Cypress.Cookies.preserveOnce('ory_kratos_session')
    cy.visit('/account/users')
  })

  it('should get all users', () => {
    cy.get('table').should('contain', user.email)
  })
})
