// scripts/init-db.js
// 数据库初始化脚本
const db = require('../src/config/db');
const fs = require('fs');
const path = require('path');

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