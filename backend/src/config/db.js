const { Pool } = require('pg');

// 在生产环境中，我们不使用 dotenv，而是依赖于平台提供的环境变量
if (process.env.NODE_ENV !== 'production') {
  // 在开发环境中，加载 .env 文件
  require('dotenv').config();
}

// 使用 DATABASE_URL 环境变量
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  if (process.env.NODE_ENV === 'production') {
    console.error('错误：生产环境中 DATABASE_URL 环境变量未设置');
    console.error('请在 Railway 中设置 DATABASE_URL 环境变量');
  } else {
    console.error('错误：开发环境中 DATABASE_URL 环境变量未设置');
    console.error('请在 .env 文件中设置 DATABASE_URL');
  }
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