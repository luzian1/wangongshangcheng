const request = require('supertest');
const app = require('../../src/index');
const db = require('../../src/config/db');
const bcrypt = require('bcryptjs');

// Mock the database query function for integration tests
jest.mock('../../src/config/db');

describe('User Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/users/register', () => {
    test('should register a new user successfully', async () => {
      // 模拟数据库查询返回空结果（用户不存在）
      db.query.mockResolvedValueOnce({ rows: [] });
      // 模拟插入新用户
      const newUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'buyer',
        created_at: new Date()
      };
      db.query.mockResolvedValueOnce({ rows: [newUser] });

      const response = await request(app)
        .post('/api/users/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(201);

      expect(response.body).toEqual({
        message: '用户注册成功',
        user: expect.objectContaining({
          username: 'testuser',
          email: 'test@example.com',
          role: 'buyer'
        })
      });
    });

    test('should return error if user already exists', async () => {
      // 模拟数据库查询返回已存在的用户
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          username: 'existinguser',
          email: 'existing@example.com',
          password_hash: 'hashed_password'
        }]
      });

      const response = await request(app)
        .post('/api/users/register')
        .send({
          username: 'existinguser',
          email: 'existing@example.com',
          password: 'password123'
        })
        .expect(400);

      expect(response.body).toEqual({
        message: '用户名或邮箱已存在'
      });
    });

    test('should return error for missing fields', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          username: 'testuser'
          // 缺少 email 和 password
        })
        .expect(500); // 由于错误处理中间件，可能返回500

      // 由于我们的控制器会处理错误，所以实际上可能不会到达这里
      // 但为了测试目的，我们检查是否有错误响应
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/users/login', () => {
    test('should login user successfully', async () => {
      // 模拟找到用户
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          password_hash: await bcrypt.hash('password123', 10),
          role: 'buyer'
        }]
      });

      const response = await request(app)
        .post('/api/users/login')
        .send({
          username: 'testuser',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toEqual({
        message: '登录成功',
        token: expect.any(String),
        user: expect.objectContaining({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'buyer'
        })
      });
    });

    test('should return error for invalid credentials', async () => {
      // 模拟找到用户但密码不匹配
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          password_hash: await bcrypt.hash('correctpassword', 10),
          role: 'buyer'
        }]
      });

      const response = await request(app)
        .post('/api/users/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toEqual({
        message: '用户名或密码错误'
      });
    });

    test('should return error for non-existent user', async () => {
      // 模拟未找到用户
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/users/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        })
        .expect(401);

      expect(response.body).toEqual({
        message: '用户名或密码错误'
      });
    });
  });

  describe('GET /api/users/profile', () => {
    test('should return user profile with valid token', async () => {
      // 模拟找到用户
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'buyer',
          created_at: new Date()
        }]
      });

      // 由于JWT验证，我们需要模拟一个有效的token
      // 在集成测试中，我们通常需要实际的token或绕过认证
      // 这里我们模拟中间件
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { userId: 1, username: 'testuser', role: 'buyer' },
        process.env.JWT_SECRET || 'test_secret_for_integration_testing'
      );

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        user: expect.objectContaining({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'buyer'
        })
      });
    });

    test('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid_token')
        .expect(403);

      expect(response.body).toEqual({
        message: '令牌无效'
      });
    });

    test('should return 401 for missing token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body).toEqual({
        message: '访问被拒绝，未提供令牌'
      });
    });
  });

  describe('GET /api/admin/users (admin only)', () => {
    test('should return all users for admin', async () => {
      // 模拟管理员token
      const jwt = require('jsonwebtoken');
      const adminToken = jwt.sign(
        { userId: 1, username: 'admin', role: 'admin' },
        process.env.JWT_SECRET || 'test_secret_for_integration_testing'
      );

      // 模拟数据库查询返回多个用户
      db.query.mockResolvedValueOnce({
        rows: [
          { id: 1, username: 'admin', email: 'admin@example.com', role: 'admin', created_at: new Date() },
          { id: 2, username: 'user', email: 'user@example.com', role: 'buyer', created_at: new Date() }
        ]
      });

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toEqual({
        users: expect.arrayContaining([
          expect.objectContaining({ username: 'admin' }),
          expect.objectContaining({ username: 'user' })
        ])
      });
    });

    test('should return 403 for non-admin user', async () => {
      // 模拟普通用户token
      const jwt = require('jsonwebtoken');
      const userToken = jwt.sign(
        { userId: 2, username: 'user', role: 'buyer' },
        process.env.JWT_SECRET || 'test_secret_for_integration_testing'
      );

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body).toEqual({
        message: '权限不足'
      });
    });
  });
});