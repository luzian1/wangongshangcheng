// 集成测试设置文件
const app = require('../../src/index');
const db = require('../../src/config/db');

// 模拟环境变量
process.env.JWT_SECRET = 'test_secret_for_integration_testing';
process.env.DB_USER = 'test_user';
process.env.DB_HOST = 'localhost';
process.env.DB_NAME = 'test_db';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_PORT = '5432';

// 在所有测试之前执行
beforeAll(() => {
  // 在集成测试中，我们可能需要启动服务器
  // 但通常我们会使用supertest，它会处理服务器启动
});

// 在每个测试之后执行
afterEach(() => {
  // 清理模拟数据或重置状态
  jest.clearAllMocks();
});

// 在所有测试之后执行
afterAll(() => {
  // 关闭数据库连接或服务器（如果需要）
});