const db = require('./src/config/db');

async function testProductQuery() {
  try {
    console.log('测试查询商品列表...');
    
    // 查询所有商品
    const result = await db.query('SELECT COUNT(*) FROM products');
    console.log('商品总数:', result.rows[0].count);
    
    // 尝试查询商品列表（模拟getAllProducts函数的查询）
    const products = await db.query(`
      SELECT p.*, u.username as seller_name 
      FROM products p 
      LEFT JOIN users u ON p.seller_id = u.id 
      WHERE p.status = $1 
      ORDER BY p.created_at DESC 
      LIMIT $2 OFFSET $3
    `, ['active', 10, 0]);
    
    console.log('查询成功！返回了', products.rows.length, '个商品');
    if (products.rows.length > 0) {
      console.log('第一个商品:', products.rows[0]);
    }
    
    console.log('数据库连接和查询正常工作');
  } catch (error) {
    console.error('查询失败:', error.message);
  }
}

testProductQuery();