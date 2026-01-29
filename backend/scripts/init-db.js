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

    // 检查是否已有用户数据，如果没有则添加管理员用户
    const userCount = await db.query('SELECT COUNT(*) FROM users');

    if (parseInt(userCount.rows[0].count) === 0) {
      console.log('数据库中没有用户，添加管理员用户...');

      // 添加管理员用户
      const bcrypt = require('bcryptjs');
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('123456', saltRounds);

      await db.query(`
        INSERT INTO users (username, email, password_hash, role) VALUES
        ($1, $2, $3, $4)
      `, ['潘子豪', '111111@qq.com', hashedPassword, 'admin']);

      console.log('管理员用户添加成功！');
      console.log('用户名: 潘子豪');
      console.log('邮箱: 111111@qq.com');
      console.log('密码: 123456');
    } else {
      console.log('数据库中已有用户，跳过添加管理员用户');
    }

    // 检查是否已有商品数据，如果没有则添加示例商品
    const productCount = await db.query('SELECT COUNT(*) FROM products');

    if (parseInt(productCount.rows[0].count) === 0) {
      console.log('数据库中没有商品，添加示例商品...');

      // 获取管理员用户ID作为卖家ID
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
    } else {
      console.log('数据库中已有商品，跳过添加示例商品');
    }
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