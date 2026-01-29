// scripts/add-sample-data.js
const db = require('../src/config/db');

async function addSampleData() {
  try {
    // 检查是否已有商品数据
    const productCount = await db.query('SELECT COUNT(*) FROM products');

    if (parseInt(productCount.rows[0].count) > 0) {
      console.log('数据库中已有商品数据，跳过添加示例商品');
      return;
    }

    console.log('开始添加示例商品...');

    // 获取管理员用户ID作为卖家ID（假设管理员是第一个用户）
    const adminUser = await db.query('SELECT id FROM users WHERE role = $1 ORDER BY id LIMIT 1', ['admin']);
    const sellerId = adminUser.rows.length > 0 ? adminUser.rows[0].id : 1;

    // 添加示例商品（使用Base64格式的占位图片）
    await db.query(`
      INSERT INTO products (name, description, price, stock_quantity, image_url, seller_id, status) VALUES
      ('iPhone 15 Pro', '最新款苹果手机，性能强劲', 7999.00, 50, $1, $2, 'active'),
      ('MacBook Air M2', '轻薄便携笔记本电脑', 8999.00, 30, $3, $2, 'active'),
      ('AirPods Pro', '无线降噪耳机', 1999.00, 100, $4, $2, 'active'),
      ('iPad Pro', '专业平板电脑', 6999.00, 25, $5, $2, 'active'),
      ('Apple Watch Series 9', '智能手表', 2999.00, 40, $6, $2, 'active')
    `, [
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // Base64透明像素
      sellerId,
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    ]);

    console.log('示例商品添加成功！');
    console.log('- 添加了5个商品');
  } catch (error) {
    console.error('添加示例商品失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本，则执行添加
if (require.main === module) {
  addSampleData()
    .then(() => {
      console.log('示例商品添加完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('示例商品添加失败:', error);
      process.exit(1);
    });
}

module.exports = { addSampleData };