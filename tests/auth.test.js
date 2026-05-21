const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

describe('Auth API', () => {
  beforeAll(async () => {
    // wait for DB connection attempt to resolve
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/auth/register', () => {
    it('should return 400 if validation fails (missing fields)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser' });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('\"email\" is required');
    });

    it('should return 400 if email is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', email: 'invalidemail', password: 'password123' });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toContain('\"email\" must be a valid email');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 if validation fails', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' }); // missing password
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toContain('\"password\" is required');
    });
  });
});
