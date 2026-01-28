require('dotenv').config();
const db = require('./config/db');

// 测试数据库连接
const testConnection = async () => {
  try {
    const result = await db.query('SELECT NOW()');
    console.log('数据库连接成功:', result.rows[0]);
    
    // 测试创建表
    const fs = require('fs');
    const path = require('path');
    const sqlFile = path.join(__dirname, 'config', 'db_init.sql');
    const schema = fs.readFileSync(sqlFile, 'utf8');
    
    await db.query(schema);
    console.log('数据库表结构创建/更新完成');
  } catch (error) {
    console.error('数据库连接测试失败:', error);
  }
};

testConnection();