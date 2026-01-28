// 模拟支付请求测试
const jwt = require('jsonwebtoken');
require('dotenv').config();

// 模拟一个有效的JWT令牌（仅用于测试目的）
const mockToken = jwt.sign(
  { userId: 1, role: 'buyer' }, 
  process.env.JWT_SECRET || 'fallback_secret_key',
  { expiresIn: '1h' }
);

console.log('模拟令牌:', mockToken);
console.log('注意：这是一个测试令牌，实际应用中需要使用真实的登录流程获取令牌');