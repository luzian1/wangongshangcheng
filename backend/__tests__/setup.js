// __tests__/setup.js
// 用于测试前的全局设置

// 模拟环境变量
process.env.JWT_SECRET = 'test_secret_for_testing';
process.env.DB_USER = 'test_user';
process.env.DB_HOST = 'localhost';
process.env.DB_NAME = 'test_db';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_PORT = '5432';

// 模拟数据库连接
jest.mock('../src/config/db', () => ({
  query: jest.fn()
}));