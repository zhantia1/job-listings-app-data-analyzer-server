const request = require('supertest');
const { app } = require('../../src/index');

describe('Server Integration Test', () => {
  let server;

  beforeAll(() => {
    server = app.listen(3003); // Start the server on a different port for testing
  });

  afterAll((done) => {
    server.close(done); // Close the server after all tests have run
  });

  it('responds with 200 status', async () => {
    const response = await request(server).get('/health-check');
    expect(response.status).toBe(200);
  });
});