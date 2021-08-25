const request = require('supertest');
const { server } = require('../src/server');

describe('Notify', () => {
  it('should get 404 with wrong webhook id', async () => {
    const res = await request(server).get('/notify/1234');
    expect(res.status).toEqual(404);
  });
});
