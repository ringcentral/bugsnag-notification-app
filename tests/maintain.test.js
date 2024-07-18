const request = require('supertest');
const { server } = require('../src/server');
const { AuthToken } = require('../src/server/models/authToken');
describe('Maintain', () => {
  it('should return 404 if MAINTAIN_TOKEN is not set', async () => {
    const res = await request(server).get('/maintain/migrate-encrypted-data');
    expect(res.status).toBe(404);
    expect(res.text).toBe('Not found');
  });

  it('should return 401 if maintain_token is invalid', async () => {
    process.env.MAINTAIN_TOKEN = 'maintain_token_xxx';
    const res = await request(server).get('/maintain/migrate-encrypted-data?maintain_token=invalid');
    expect(res.status).toBe(401);
    expect(res.text).toBe('Token invalid');
  });

  it('should return 200 if maintain_token is valid', async () => {
    process.env.MAINTAIN_TOKEN = 'maintain_token_xxx';
    const res = await request(server).get(`/maintain/migrate-encrypted-data?maintain_token=${process.env.MAINTAIN_TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.text).toBe('migrated');
  });

  it('should migrate encrypted data', async () => {
    await AuthToken.create({
      id: '1111',
      data: 'test1',
    });
    await AuthToken.create({
      id: '2222',
    });
    const authToken = await AuthToken.findByPk('2222');
    await authToken.update({
      data: 'test',
    });
    await request(server).get(`/maintain/migrate-encrypted-data?maintain_token=${process.env.MAINTAIN_TOKEN}`);
    const authToken1 = await AuthToken.findByPk('1111');
    const authToken2 = await AuthToken.findByPk('2222');
    expect(authToken1.data).toBe('');
    expect(authToken1.getDecryptedData()).toBe('test1');
    expect(authToken2.data).toBe('');
    expect(authToken2.getDecryptedData()).toBe('test');
    await authToken1.destroy();
    await authToken2.destroy();
  });
});
