// scripts/init-db.js
// 数据库初始化脚本
const db = require('../src/config/db');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  // 从SQL文件读取初始化脚本
  const sqlFilePath = path.join(__dirname, '..', 'src', 'config', 'db_init.sql');
  const dbInitSql = fs.readFileSync(sqlFilePath, 'utf8');

  try {
    console.log('正在初始化数据库...');
    await db.query(dbInitSql);
    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
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