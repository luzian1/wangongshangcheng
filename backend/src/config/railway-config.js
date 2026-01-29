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
  console.log('- PGPASSWORD 存在:', !!process.env.PGPASSWORD);

  // 如果没有检测到任何数据库连接信息，尝试从Railway的标准变量中构建
  if (!process.env.DATABASE_URL && !process.env.DATABASE_PUBLIC_URL) {
    console.log('未检测到数据库URL，尝试从标准变量构建...');

    // 尝试使用Railway内部数据库URL（推荐用于同一项目内的服务通信）
    if (process.env.PGHOST && process.env.PGPORT && process.env.PGDATABASE &&
        process.env.PGUSER && process.env.PGPASSWORD) {

      const internalDbUrl = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
      process.env.DATABASE_URL = internalDbUrl;
      console.log('已构建内部数据库URL');
    }
    // 如果内部URL不可用，尝试使用公共URL作为备选
    else if (process.env.RAILWAY_PRIVATE_NETWORK) {
      // 如果在Railway私有网络中，尝试使用默认的内部连接
      console.log('在Railway私有网络中，使用默认内部连接设置');
    }
  }

  // 如果仍然没有数据库URL，尝试从DATABASE_PUBLIC_URL构建（如果存在）
  if (!process.env.DATABASE_URL && process.env.DATABASE_PUBLIC_URL) {
    process.env.DATABASE_URL = process.env.DATABASE_PUBLIC_URL;
    console.log('使用DATABASE_PUBLIC_URL作为DATABASE_URL');
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

  // 输出最终的数据库URL（隐藏密码）
  if (process.env.DATABASE_URL) {
    const maskedUrl = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@');
    console.log('最终数据库URL:', maskedUrl);
  }
}

module.exports = { setupRailwayConfig };