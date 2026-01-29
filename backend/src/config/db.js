const { Pool } = require('pg');
require('dotenv').config();
const { getDatabaseConfig } = require('./db-config');

// 获取数据库配置
const dbConfig = getDatabaseConfig();
const pool = new Pool(dbConfig);

// 添加连接事件监听器以更好地调试连接问题
pool.on('connect', () => {
  console.log('数据库连接已建立');
});

pool.on('error', (err) => {
  console.error('数据库连接错误:', err);
});

pool.on('remove', () => {
  console.log('数据库连接已移除');
});

module.exports = pool;