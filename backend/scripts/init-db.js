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