import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Authentication & Authorization Suite', () => {
  it('should reject login request with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@petroflow.com',
        password: 'WrongPassword999!',
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should successfully authenticate registered administrator and return token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@petroflow.com',
        password: 'Admin@123',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.role).toBe('ADMIN');
  });

  it('should block unauthenticated access to protected endpoints', async () => {
    const res = await request(app).get('/api/stations');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
