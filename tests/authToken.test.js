const { AuthToken } = require('../src/server/models/authToken');

describe('authToken', () => {
  it('should create auth token with encrypted data', async () => {
    const authToken = await AuthToken.create({
      id: '123',
      data: 'test',
    });
    expect(authToken.encryptedData).not.toBe('');
    expect(authToken.data).toBe('');

    const savedAuthToken = await AuthToken.findByPk('123');
    expect(savedAuthToken.data).toBe('');
    expect(savedAuthToken.getDecryptedData()).toBe('test');
    expect(savedAuthToken.encryptedData).not.toBe('');
    await savedAuthToken.destroy();
  });

  it('should create auth token without data', async () => {
    const authToken = await AuthToken.create({
      id: '123',
    });
    expect(authToken.encryptedData).toBe(undefined);
    expect(authToken.data).toBe(undefined);

    const savedAuthToken = await AuthToken.findByPk('123');
    expect(savedAuthToken.data).toBe(null);
    expect(savedAuthToken.getDecryptedData()).toBe(null);
    expect(savedAuthToken.encryptedData).toBe(null);
    await savedAuthToken.destroy();
  });

  it('should get decoded data successfully', async () => {
    const authToken = await AuthToken.create({
      id: '123',
      encryptedData: 'cfe2148b1b5236137f58348954930ba6',
    });
    expect(authToken.getDecryptedData()).toBe('test');
    await authToken.destroy();
  });

  it('should remove auth token data successfully', async () => {
    const authToken = await AuthToken.create({
      id: '123',
      data: 'test',
    });
    authToken.removeData();
    await authToken.save();

    const savedAuthToken = await AuthToken.findByPk('123');
    expect(savedAuthToken.data).toBe('');
    expect(savedAuthToken.encryptedData).toBe('');
    expect(savedAuthToken.getDecryptedData()).toBe('');
    await savedAuthToken.destroy();
  });
});
