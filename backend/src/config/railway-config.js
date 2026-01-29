// backend/src/config/railway-config.js
// Railway 特定配置

function setupRailwayConfig() {
  console.log('设置 Railway 环境配置...');
  
  // 在 Railway 环境中，确保 NODE_ENV 被设置
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
    console.log('已设置 NODE_ENV=production');
  }
  
  // 检查数据库相关的环境变量
  console.log('检查数据库环境变量...');
  console.log('- DATABASE_URL 存在:', !!process.env.DATABASE_URL);
  console.log('- DATABASE_PUBLIC_URL 存在:', !!process.env.DATABASE_PUBLIC_URL);
  console.log('- PGHOST 存在:', !!process.env.PGHOST);
  console.log('- PGPORT 存在:', !!process.env.PGPORT);
  console.log('- PGDATABASE 存在:', !!process.env.PGDATABASE);
  console.log('- PGUSER 存在:', !!process.env.PGUSER);
  
  // 如果 DATABASE_URL 不存在但其他变量存在，尝试构建 DATABASE_URL
  if (!process.env.DATABASE_URL && process.env.PGHOST && process.env.PGPORT && 
      process.env.PGDATABASE && process.env.PGUSER && process.env.PGPASSWORD) {
    
    const dbUrl = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
    process.env.DATABASE_URL = dbUrl;
    console.log('已从单独的环境变量构建 DATABASE_URL');
  }
  
  // 修正 DATABASE_URL 中的常见格式错误
  if (process.env.DATABASE_URL) {
    // 修正 postgresq1:// -> postgresql://
    if (process.env.DATABASE_URL.includes('postgresq1://')) {
      process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/postgresq1:\/\//g, 'postgresql://');
      console.log('已修正 DATABASE_URL 格式错误');
    }
    
    // 清理多余的空格
    process.env.DATABASE_URL = process.env.DATABASE_URL.trim();
  }
  
  if (process.env.DATABASE_PUBLIC_URL) {
    // 修正 DATABASE_PUBLIC_URL 中的常见格式错误
    if (process.env.DATABASE_PUBLIC_URL.includes('postgresq1://')) {
      process.env.DATABASE_PUBLIC_URL = process.env.DATABASE_PUBLIC_URL.replace(/postgresq1:\/\//g, 'postgresql://');
      console.log('已修正 DATABASE_PUBLIC_URL 格式错误');
    }
    
    // 清理多余的空格
    process.env.DATABASE_PUBLIC_URL = process.env.DATABASE_PUBLIC_URL.trim();
  }
  
  console.log('Railway 环境配置完成');
  console.log('最终 DATABASE_URL 存在:', !!process.env.DATABASE_URL);
}

module.exports = { setupRailwayConfig };