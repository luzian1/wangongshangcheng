const { authenticateToken, checkRole } = require('../src/middleware/auth');
const jwt = require('jsonwebtoken');

describe('Authentication Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();

    // 设置环境变量
    process.env.JWT_SECRET = 'test_secret_for_testing';
  });

  describe('authenticateToken', () => {
    test('should return 401 if no token is provided', () => {
      mockReq.headers = {};

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: '访问被拒绝，未提供令牌'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 403 if token is invalid', () => {
      mockReq.headers = { authorization: 'Bearer invalid_token' };

      // Mock jwt.verify to call the callback with an error
      jwt.verify = jest.fn().mockImplementation((token, secret, callback) => {
        callback(new Error('Invalid token'), null);
      });

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: '令牌无效'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should call next with user info if token is valid', () => {
      const mockUser = { userId: 1, username: 'testuser', role: 'buyer' };
      mockReq.headers = { authorization: 'Bearer valid_token' };

      // Mock jwt.verify to return user info
      jwt.verify = jest.fn().mockImplementation((token, secret, callback) => {
        callback(null, mockUser);
      });

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    test('should handle Bearer token format correctly', () => {
      const mockUser = { userId: 1, username: 'testuser', role: 'buyer' };
      mockReq.headers = { authorization: 'Bearer valid_token' };

      // Mock jwt.verify to return user info
      jwt.verify = jest.fn().mockImplementation((token, secret, callback) => {
        callback(null, mockUser);
      });

      authenticateToken(mockReq, mockRes, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('valid_token', 'test_secret_for_testing', expect.any(Function));
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('checkRole', () => {
    test('should call next if user has required role', () => {
      mockReq.user = { role: 'admin' };

      const roleCheckMiddleware = checkRole(['admin', 'seller']);
      roleCheckMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    test('should return 403 if user does not have required role', () => {
      mockReq.user = { role: 'buyer' };

      const roleCheckMiddleware = checkRole(['admin', 'seller']);
      roleCheckMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: '权限不足'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should call next if user role is in allowed roles', () => {
      mockReq.user = { role: 'seller' };

      const roleCheckMiddleware = checkRole(['admin', 'seller', 'buyer']);
      roleCheckMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('should return 403 for empty allowed roles array', () => {
      mockReq.user = { role: 'admin' };

      const roleCheckMiddleware = checkRole([]);
      roleCheckMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: '权限不足'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});