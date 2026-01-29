// backend/src/config/db-config.js
// 专门用于Railway环境的数据库配置

function getDatabaseConfig() {
  // 检查是否在生产环境（Railway）
  const isProduction = process.env.NODE_ENV === 'production';

  // 优先级顺序：DATABASE_URL > DATABASE_PUBLIC_URL > fallback
  let databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;

  if (isProduction && databaseUrl) {
    // 在Railway生产环境中，使用提供的数据库URL
    databaseUrl = databaseUrl.trim();

    // 修复常见的格式问题
    if (databaseUrl.startsWith('postgresq1://')) {
      // 修正Railway可能的拼写错误
      databaseUrl = databaseUrl.replace('postgresq1://', 'postgresql://');
      console.log('已修正数据库URL格式 (postgresq1 -> postgresql)');
    }

    // 移除可能的多余空格和特殊字符
    databaseUrl = databaseUrl.replace(/\s+/g, '');

    console.log(`使用数据库URL: ${databaseUrl.replace(/:[^:@]+@/, ':***@')}`); // 隐藏密码

    return {
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false // 对于Railway，通常需要此设置
      },
      // 调整连接池设置以适应Railway环境
      max: 5, // 减少最大连接数以适应Railway限制
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // 增加连接超时时间
      keepAlive: true
    };
  } else {
    // 开发环境配置
    console.log('使用开发环境数据库配置');
    return {
      connectionString: process.env.DATABASE_URL ||
        `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'mall_db'}`,
      ssl: false
    };
  }
}

module.exports = { getDatabaseConfig };