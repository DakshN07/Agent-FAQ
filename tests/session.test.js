const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

/**
 * Full end-to-end session tests (access + refresh token rotation, logout,
 * password change). Require a real MongoDB, so they are skipped locally when
 * none is reachable — CI provides one via the mongodb-github-action.
 */
describe('Session lifecycle (access/refresh tokens)', () => {
  let connected = false;

  beforeAll(async () => {
    try {
      await mongoose.connect(
        process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agent-faq-test'
      );
      connected = true;
      await mongoose.connection.db.dropDatabase();
    } catch {
      connected = false;
    }
  });

  afterAll(async () => {
    if (connected) await mongoose.connection.close();
  });

  // supertest returns set-cookie as an array; take the token, drop attrs.
  const cookieString = (res) =>
    (res.headers['set-cookie'] || [])
      .map((c) => c.split(';')[0])
      .join('; ');

  const credentials = {
    username: `session_${Date.now()}`,
    email: `session_${Date.now()}@example.com`,
    password: 'correct-horse-battery-staple',
  };

  it('registers, logs in, and authenticates with the access token', async () => {
    if (!connected) return pending('MongoDB not available; skipping session tests');

    const reg = await request(app).post('/api/auth/register').send(credentials);
    expect(reg.statusCode).toBe(201);
    expect(reg.body.token).toBeTruthy();
    expect(cookieString(reg)).toContain('rf='); // httpOnly refresh cookie set

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${reg.body.token}`);
    expect(me.statusCode).toBe(200);
    expect(me.body.email).toBe(credentials.email);
  });

  it('rotates the refresh token and rejects a replayed token', async () => {
    if (!connected) return pending('MongoDB not available; skipping session tests');

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password });
    expect(login.statusCode).toBe(200);
    const originalCookie = cookieString(login);

    const r1 = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', originalCookie)
      .send({});
    expect(r1.statusCode).toBe(200);
    expect(r1.body.token).toBeTruthy();

    // Reusing the ORIGINAL refresh token must now fail (rotation).
    const replay = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', originalCookie)
      .send({});
    expect(replay.statusCode).toBe(401);
  });

  it('revokes the session on logout', async () => {
    if (!connected) return pending('MongoDB not available; skipping session tests');

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password });
    expect(login.statusCode).toBe(200);
    const cookie = cookieString(login);

    const logout = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie)
      .send({});
    expect(logout.statusCode).toBe(200);

    const afterLogout = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookie)
      .send({});
    expect(afterLogout.statusCode).toBe(401);
  });

  it('changes the password and invalidates the old one', async () => {
    if (!connected) return pending('MongoDB not available; skipping session tests');

    const badPw = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'wrong-password' });
    expect(badPw.statusCode).toBe(401);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password });
    expect(login.statusCode).toBe(200);

    const newPassword = 'a-new-password-123';
    const change = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ currentPassword: credentials.password, newPassword });
    expect(change.statusCode).toBe(200);

    const oldLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password });
    expect(oldLogin.statusCode).toBe(401);

    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: newPassword });
    expect(newLogin.statusCode).toBe(200);
  });
});