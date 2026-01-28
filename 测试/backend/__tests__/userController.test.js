const { register, login, getProfile, getAllUsers, deleteUser } = require('../src/controllers/userController');
const db = require('../src/config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 模拟数据库查询结果
const mockQuery = db.query;

describe('User Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    test('should register a new user successfully', async () => {
      const req = {
        body: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // 模拟数据库查询返回空结果（用户不存在）
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // 模拟插入新用户
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'buyer',
          created_at: new Date()
        }]
      });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: '用户注册成功',
        user: expect.objectContaining({
          username: 'testuser',
          email: 'test@example.com',
          role: 'buyer'
        })
      });
    });

    test('should return error if user already exists', async () => {
      const req = {
        body: {
          username: 'existinguser',
          email: 'existing@example.com',
          password: 'password123'
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // 模拟数据库查询返回已存在的用户
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          username: 'existinguser',
          email: 'existing@example.com',
          password_hash: 'hashed_password'
        }]
      });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: '用户名或邮箱已存在'
      });
    });

    test('should handle registration error', async () => {
      const req = {
        body: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // 模拟数据库查询错误
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: '服务器错误'
      });
    });
  });

  describe('login', () => {
    test('should login user successfully', async () => {
      const req = {
        body: {
          username: 'testuser',
          password: 'password123'
        }
      };
      
      const res = {
        json: jest.fn()
      };

      // 模拟找到用户
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          password_hash: await bcrypt.hash('password123', 10),
          role: 'buyer'
        }]
      });

      // Mock jwt.sign
      const mockToken = 'mocked_jwt_token';
      jwt.sign = jest.fn().mockReturnValue(mockToken);

      await login(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: '登录成功',
        token: mockToken,
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'buyer'
        }
      });
    });

    test('should return error for invalid credentials', async () => {
      const req = {
        body: {
          username: 'testuser',
          password: 'wrongpassword'
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // 模拟找到用户但密码不匹配
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          password_hash: await bcrypt.hash('correctpassword', 10),
          role: 'buyer'
        }]
      });

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: '用户名或密码错误'
      });
    });

    test('should return error for non-existent user', async () => {
      const req = {
        body: {
          username: 'nonexistent',
          password: 'password123'
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // 模拟未找到用户
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: '用户名或密码错误'
      });
    });
  });

  describe('getProfile', () => {
    test('should return user profile', async () => {
      const req = {
        user: { userId: 1 }
      };
      
      const res = {
        json: jest.fn()
      };

      // 模拟找到用户
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'buyer',
          created_at: new Date()
        }]
      });

      await getProfile(req, res);

      expect(res.json).toHaveBeenCalledWith({
        user: expect.objectContaining({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'buyer'
        })
      });
    });

    test('should return error for non-existent user', async () => {
      const req = {
        user: { userId: 999 }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // 模拟未找到用户
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: '用户不存在'
      });
    });
  });

  describe('getAllUsers', () => {
    test('should return all users for admin', async () => {
      const req = {
        user: { userId: 1, role: 'admin' }
      };
      
      const res = {
        json: jest.fn()
      };

      // 模拟找到多个用户
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 1, username: 'admin', email: 'admin@example.com', role: 'admin', created_at: new Date() },
          { id: 2, username: 'user', email: 'user@example.com', role: 'buyer', created_at: new Date() }
        ]
      });

      await getAllUsers(req, res);

      expect(res.json).toHaveBeenCalledWith({
        users: expect.arrayContaining([
          expect.objectContaining({ username: 'admin' }),
          expect.objectContaining({ username: 'user' })
        ])
      });
    });

    test('should return error if user is not admin', async () => {
      const req = {
        user: { userId: 2, role: 'buyer' }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: '权限不足，只有管理员可以执行此操作'
      });
    });
  });

  describe('deleteUser', () => {
    test('should delete user successfully', async () => {
      const req = {
        user: { userId: 1, role: 'admin' },
        params: { id: 2 }
      };
      
      const res = {
        json: jest.fn()
      };

      // 模拟用户角色查询
      mockQuery.mockResolvedValueOnce({ rows: [{ role: 'buyer' }] });
      // 模拟无订单
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      // 模拟删除购物车项
      mockQuery.mockResolvedValueOnce({ rowCount: 0 });
      // 模拟删除用户
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 2 }] });

      await deleteUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: '用户删除成功'
      });
    });

    test('should return error if user is not admin', async () => {
      const req = {
        user: { userId: 2, role: 'buyer' },
        params: { id: 3 }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: '权限不足，只有管理员可以执行此操作'
      });
    });

    test('should return error if trying to delete admin', async () => {
      const req = {
        user: { userId: 1, role: 'admin' },
        params: { id: 2 }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // 模拟用户角色为admin
      mockQuery.mockResolvedValueOnce({ rows: [{ role: 'admin' }] });

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: '不能删除管理员账户'
      });
    });
  });
});