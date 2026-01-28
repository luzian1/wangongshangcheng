const { Pool } = require('pg');
require('dotenv').config();

// 优先使用 Railway 提供的 DATABASE_URL，否则使用本地配置
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const pool = new Pool({
  connectionString: connectionString,
  // 在 Railway 上需要 SSL 连接
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = pool;