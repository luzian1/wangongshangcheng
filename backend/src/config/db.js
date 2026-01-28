const { Pool } = require('pg');

// 在生产环境中，我们不使用 dotenv，而是依赖于平台提供的环境变量
if (process.env.NODE_ENV === 'production') {
  // 在生产环境中，只使用系统环境变量
} else {
  // 在开发环境中，加载 .env 文件
  require('dotenv').config();
}

// 使用 DATABASE_URL 环境变量
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('错误：DATABASE_URL 环境变量未设置');
  process.exit(1);
}

const pool = new Pool({
  connectionString: connectionString,
  // 在 Railway 上需要 SSL 连接
  max: 10, // 连接池大小
  idleTimeoutMillis: 30000, // 空闲连接超时
  connectionTimeoutMillis: 2000, // 连接超时
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = pool;