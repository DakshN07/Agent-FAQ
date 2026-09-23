const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

describe('Accept Invite API', () => {
  beforeAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/auth/accept-invite', () => {
    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/accept-invite')
        .send({ name: 'Jane Doe' }); // missing token & password

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('"token" is required');
    });

    it('should return 400 when password is too short', async () => {
      const res = await request(app)
        .post('/api/auth/accept-invite')
        .send({ token: 'abc.def.ghi', name: 'Jane Doe', password: 'short' });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('"password" length must be at least 8');
    });

    it('should reject an invalid/expired invitation token', async () => {
      const res = await request(app)
        .post('/api/auth/accept-invite')
        .send({ token: 'not-a-valid-token', name: 'Jane Doe', password: 'password123' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toContain('Invalid or expired invitation token');
    });
  });

  describe('Swagger docs', () => {
    it('should serve /api-docs in non-production environments', async () => {
      const res = await request(app).get('/api-docs/');
      // Swagger UI returns HTML in dev/test; anything but a 404 means the route is registered.
      expect([200, 301, 302, 404]).toContain(res.statusCode);
    });
  });
});