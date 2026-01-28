const db = require('./src/config/db');

async function checkUsers() {
  try {
    console.log('检查数据库中的用户...');
    
    const result = await db.query('SELECT id, username, email, role FROM users');
    console.log('找到的用户:', result.rows);
    
    // 特别检查admin用户
    const adminResult = await db.query('SELECT * FROM users WHERE username = $1', ['admin']);
    console.log('管理员用户:', adminResult.rows);
    
  } catch (error) {
    console.error('查询用户时出错:', error);
  }
}

checkUsers();