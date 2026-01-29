// scripts/create-admin.js
const db = require('../src/config/db');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  // 使用指定的管理员信息
  const adminUsername = process.env.ADMIN_USERNAME || '潘子豪';
  const adminEmail = process.env.ADMIN_EMAIL || '111111@qq.com';
  const adminPassword = process.env.ADMIN_PASSWORD || '123456';

  try {
    // 检查管理员用户是否已存在
    const existingAdmin = await db.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [adminUsername, adminEmail]
    );

    if (existingAdmin.rows.length > 0) {
      console.log('管理员用户已存在:', existingAdmin.rows[0].username);
      return;
    }

    // 加密密码
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // 创建管理员用户
    const result = await db.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [adminUsername, adminEmail, hashedPassword, 'admin']
    );

    console.log('管理员用户创建成功:', result.rows[0]);
    console.log('用户名:', adminUsername);
    console.log('邮箱:', adminEmail);
    console.log('密码: 123456 (请注意：这只是显示默认值，实际存储已加密)');
  } catch (error) {
    console.error('创建管理员用户失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本，则执行创建
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('管理员用户创建完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('管理员用户创建失败:', error);
      process.exit(1);
    });
}

module.exports = { createAdminUser };