require('dotenv').config();
const db = require('./src/config/db');

// 检查数据库表和数据
async function checkDatabase() {
  try {
    console.log('检查数据库表结构...');
    
    // 检查订单表是否存在
    const ordersTableCheck = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'orders'
    `);
    
    console.log('订单表结构:', ordersTableCheck.rows);
    
    // 检查订单表中的数据
    const ordersData = await db.query('SELECT * FROM orders LIMIT 10');
    console.log('订单表数据:', ordersData.rows);
    
    // 检查订单详情表
    const orderItemsData = await db.query('SELECT * FROM order_items LIMIT 10');
    console.log('订单详情表数据:', orderItemsData.rows);
    
    console.log('数据库检查完成');
  } catch (error) {
    console.error('数据库检查失败:', error.message);
  }
}

checkDatabase();