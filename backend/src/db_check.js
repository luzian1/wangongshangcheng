const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function testConnection() {
  try {
    console.log('尝试连接到PostgreSQL服务器...');
    console.log('连接参数:', {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      password: process.env.DB_PASSWORD ? '[HIDDEN]' : '[NOT SET]',
      port: process.env.DB_PORT,
    });
    
    await client.connect();
    console.log('✓ 成功连接到PostgreSQL服务器');
    
    // 检查数据库是否存在
    console.log(`检查数据库 ${process.env.DB_NAME} 是否存在...`);
    const dbResult = await client.query(`SELECT datname FROM pg_database WHERE datname = '${process.env.DB_NAME}'`);
    if (dbResult.rows.length > 0) {
      console.log(`✓ 数据库 ${process.env.DB_NAME} 存在`);
      
      // 连接到目标数据库并检查表
      const targetClient = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
      });
      
      await targetClient.connect();
      console.log(`✓ 成功连接到数据库 ${process.env.DB_NAME}`);
      
      const tableResult = await targetClient.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
      );
      console.log('数据库中的表:', tableResult.rows);
      
      await targetClient.end();
    } else {
      console.log(`✗ 数据库 ${process.env.DB_NAME} 不存在`);
    }
  } catch (err) {
    console.error('✗ 连接失败:', err.message);
  } finally {
    await client.end();
  }
}

testConnection();