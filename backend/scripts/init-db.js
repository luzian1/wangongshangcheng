// scripts/init-db.js
// 数据库初始化脚本
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 在生产环境中，我们不使用 dotenv，而是依赖于平台提供的环境变量
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// 在生产环境中，Railway可能使用不同的环境变量名
let connectionString;
if (process.env.NODE_ENV === 'production') {
  // 尝试多种可能的环境变量名
  connectionString = process.env.DATABASE_URL ||
                   process.env.RAILWAY_DATABASE_URL ||
                   process.env.POSTGRES_URL;
} else {
  // 开发环境中使用 DATABASE_URL
  connectionString = process.env.DATABASE_URL;
}

if (!connectionString) {
  if (process.env.NODE_ENV === 'production') {
    console.error('错误：生产环境中数据库连接URL环境变量未设置');
    console.error('可能的环境变量名：DATABASE_URL, RAILWAY_DATABASE_URL, POSTGRES_URL');
    console.error('当前可用的环境变量：');
    Object.keys(process.env).filter(key => key.includes('DATABASE') || key.includes('POSTGRES')).forEach(key => {
      console.error(`  ${key}: ${process.env[key] ? '[SET]' : '[NOT SET]'}`);
    });
  } else {
    console.error('错误：开发环境中 DATABASE_URL 环境变量未设置');
    console.error('请在 .env 文件中设置 DATABASE_URL');
  }
  process.exit(1);
}

const db = new Pool({
  connectionString: connectionString,
  max: 10, // 连接池大小
  idleTimeoutMillis: 30000, // 空闲连接超时
  connectionTimeoutMillis: 2000, // 连接超时
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initializeDatabase() {
  // 从SQL文件读取初始化脚本
  const sqlFilePath = path.join(__dirname, '..', 'src', 'config', 'db_init.sql');
  const dbInitSql = fs.readFileSync(sqlFilePath, 'utf8');

  // 尝试连接数据库，带重试机制
  let retries = 5;
  while (retries > 0) {
    try {
      console.log('正在尝试连接数据库...');
      // 测试数据库连接
      await db.query('SELECT NOW()');
      console.log('数据库连接成功');

      console.log('正在初始化数据库...');
      await db.query(dbInitSql);
      console.log('数据库初始化完成');
      return; // 成功则退出函数
    } catch (error) {
      retries--;
      console.error(`数据库连接失败 (剩余重试次数: ${retries}):`, error.message);
      if (retries === 0) {
        console.error('数据库初始化失败，超出最大重试次数');
        throw error;
      }
      // 等待一段时间再重试
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// 如果直接运行此脚本，则执行初始化
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('数据库初始化成功');
      process.exit(0);
    })
    .catch((error) => {
      console.error('数据库初始化失败:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };