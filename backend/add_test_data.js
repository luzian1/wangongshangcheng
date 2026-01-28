require('dotenv').config();
const db = require('./src/config/db');

async function addTestData() {
  try {
    console.log('添加测试数据...');

    // 首先添加一个测试用户（卖家）
    const userResult = await db.query(`
      INSERT INTO users (username, email, password_hash, role) 
      VALUES ($1, $2, $3, $4) 
      ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username
      RETURNING id
    `, ['test_seller', 'test_seller@example.com', 'hashed_password', 'seller']);
    
    const sellerId = userResult.rows[0].id;
    console.log('测试用户ID:', sellerId);

    // 添加一个测试商品
    const productResult = await db.query(`
      INSERT INTO products (name, description, price, stock_quantity, seller_id, status) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id
    `, ['测试商品', '这是一个测试商品', 99.99, 10, sellerId, 'active']);
    
    const productId = productResult.rows[0].id;
    console.log('测试商品ID:', productId);

    // 验证数据已添加
    const verifyResult = await db.query(`
      SELECT p.*, u.username as seller_name 
      FROM products p 
      LEFT JOIN users u ON p.seller_id = u.id 
      WHERE p.id = $1
    `, [productId]);
    
    console.log('验证数据:', verifyResult.rows[0]);

    console.log('测试数据添加成功！');
  } catch (error) {
    console.error('添加测试数据失败:', error.message);
  }
}

addTestData();