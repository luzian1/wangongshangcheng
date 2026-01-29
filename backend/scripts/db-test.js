// scripts/db-test.js
// 数据库连接测试脚本
const db = require('../src/config/db');

async function testDatabaseConnection() {
  console.log('开始测试数据库连接...');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DATABASE_URL 存在:', !!process.env.DATABASE_URL);
  
  if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL 格式检查:', process.env.DATABASE_URL.startsWith('postgresql://'));
    console.log('DATABASE_URL 长度:', process.env.DATABASE_URL.length);
  }

  try {
    console.log('正在尝试连接数据库...');
    const result = await db.query('SELECT NOW()');
    console.log('✅ 数据库连接成功!');
    console.log('时间戳:', result.rows[0]);
    
    // 检查现有表
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log(`📊 共找到 ${tablesResult.rowCount} 个表:`);
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // 检查我们的核心表是否存在
    const coreTables = ['users', 'products', 'cart', 'orders', 'order_items'];
    for (const tableName of coreTables) {
      const existsResult = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        ) AS table_exists
      `, [tableName]);
      
      console.log(`${existsResult.rows[0].table_exists ? '✅' : '❌'} 表 ${tableName} 存在`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:');
    console.error('错误消息:', error.message);
    console.error('错误代码:', error.code);
    console.error('详细信息:', error.detail);
    console.error('提示:', error.hint);
    return false;
  } finally {
    // 关闭连接池
    await db.end();
  }
}

// 如果直接运行此脚本，则执行测试
if (require.main === module) {
  testDatabaseConnection()
    .then(success => {
      console.log('\n数据库测试', success ? '成功' : '失败');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('测试过程中发生错误:', error);
      process.exit(1);
    });
}

module.exports = { testDatabaseConnection };