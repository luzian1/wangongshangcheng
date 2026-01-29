const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// 设置 Railway 环境配置
if (process.env.NODE_ENV === 'production') {
  const { setupRailwayConfig } = require('./config/railway-config');
  setupRailwayConfig();
}

// 引入数据库连接池
const db = require('./config/db');

const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// 生产环境检测
const isProduction = process.env.NODE_ENV === 'production';

// 安全中间件 - 配置CSP以允许必要的连接
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"], // 只允许连接到自身域名
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
    },
  },
}));

// CORS配置 - 生产环境和开发环境不同
let corsOptions;
if (isProduction) {
  // 生产环境：允许当前部署的前端域名
  corsOptions = {
    origin: process.env.FRONTEND_URL || true, // 如果设置了FRONTEND_URL则使用它，否则允许所有来源
    credentials: true
  };
} else {
  // 开发环境：允许本地开发服务器
  corsOptions = {
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      process.env.FRONTEND_URL,
      'https://webview.weixin.qq.com', // 微信小程序 webview
      'https://servicewechat.com'      // 微信小程序
    ].filter(Boolean),
    credentials: true
  };
}
app.use(cors(corsOptions));

// 设置跨源策略
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  next();
});

// 解析JSON
app.use(express.json());

// 创建上传目录（如果不存在）
let uploadDir = path.join(__dirname, '..', 'uploads');

// 在生产环境中，可能需要使用不同的路径
if (process.env.NODE_ENV === 'production') {
  // 尝试使用 /tmp 目录（大多数云平台都支持）
  uploadDir = '/tmp/uploads';

  // 如果 /tmp 不可用，回退到项目目录
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  } catch (err) {
    console.warn('无法使用 /tmp/uploads，回退到项目目录:', err.message);
    uploadDir = path.join(__dirname, '..', 'uploads');
  }
}

if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    console.error('无法创建上传目录:', err.message);
  }
}

console.log('上传目录:', uploadDir);

// 提供上传文件的静态服务
app.use('/uploads', express.static(uploadDir));

// 在生产环境中提供前端静态文件
if (isProduction) {
  // 服务构建后的前端文件
  // 根据Dockerfile，前端构建文件位于 /app/frontend/dist
  // 但由于运行时环境，我们需要尝试多个可能的路径
  let frontendDistPath = path.join(__dirname, '..', '..', 'frontend', 'dist'); // 相对于 src/index.js 的路径
  console.log('检查前端构建目录 (相对路径):', frontendDistPath);

  // 如果相对路径不存在，尝试绝对路径
  if (!fs.existsSync(frontendDistPath)) {
    frontendDistPath = '/app/frontend/dist'; // Dockerfile中设定的路径
    console.log('相对路径不存在，尝试绝对路径:', frontendDistPath);
  }

  // 如果绝对路径也不存在，尝试当前工作目录
  if (!fs.existsSync(frontendDistPath)) {
    frontendDistPath = path.join(process.cwd(), 'frontend', 'dist');
    console.log('绝对路径不存在，尝试当前工作目录路径:', frontendDistPath);
  }

  console.log('最终检查前端构建目录:', frontendDistPath);
  console.log('前端构建目录是否存在:', fs.existsSync(frontendDistPath));

  if (fs.existsSync(frontendDistPath)) {
    console.log('正在提供前端静态文件...');
    app.use(express.static(frontendDistPath));
  } else {
    console.warn('警告: 前端构建目录不存在，无法提供前端服务');
    console.warn('前端目录路径:', frontendDistPath);

    // 列出当前目录内容以进行调试
    const parentDir = process.cwd(); // 当前工作目录
    try {
      const dirContents = fs.readdirSync(parentDir);
      console.log('当前工作目录内容:', dirContents);

      // 检查 /app 目录
      if (fs.existsSync('/app')) {
        const appDirContents = fs.readdirSync('/app');
        console.log('/app 目录内容:', appDirContents);

        const appFrontendDir = path.join('/app', 'frontend', 'dist');
        if (fs.existsSync(appFrontendDir)) {
          const appFrontendContents = fs.readdirSync(appFrontendDir);
          console.log('/app/frontend/dist 目录内容:', appFrontendContents);
        }
      }
    } catch (err) {
      console.error('无法读取目录内容:', err);
    }
  }
}

// API路由
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// 基础健康检查路由
app.get('/', (req, res) => {
  if (isProduction) {
    // 生产环境下返回前端页面
    // 尝试多个可能的路径
    let frontendDistPath = path.join(__dirname, '..', '..', 'frontend', 'dist');

    if (!fs.existsSync(frontendDistPath)) {
      frontendDistPath = '/app/frontend/dist';
    }

    if (!fs.existsSync(frontendDistPath)) {
      frontendDistPath = path.join(process.cwd(), 'frontend', 'dist');
    }

    if (fs.existsSync(frontendDistPath)) {
      console.log('根路径：发送前端index.html文件');
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    } else {
      console.log('根路径：前端构建目录不存在，返回API消息');
      res.json({ message: '简易在线商城API服务运行中' });
    }
  } else {
    res.json({ message: '简易在线商城API服务运行中' });
  }
});

// 在生产环境中处理SPA路由 - 将所有非API请求重定向到前端index.html
if (isProduction) {
  // 尝试多个可能的路径
  let frontendDistPath = path.join(__dirname, '..', '..', 'frontend', 'dist');

  if (!fs.existsSync(frontendDistPath)) {
    frontendDistPath = '/app/frontend/dist';
  }

  if (!fs.existsSync(frontendDistPath)) {
    frontendDistPath = path.join(process.cwd(), 'frontend', 'dist');
  }

  if (fs.existsSync(frontendDistPath)) {
    // 处理SPA路由 - 将所有非API请求重定向到index.html
    app.get(/^(?!\/api\/|\/uploads\/|\/assets\/).*$/, (req, res) => {
      console.log('发送前端index.html文件');
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
  }
}

// 404处理
app.use((req, res) => {
  if (isProduction && !req.path.startsWith('/api/')) {
    // 生产环境下，非API请求尝试返回前端页面
    const frontendDistPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
    if (fs.existsSync(frontendDistPath)) {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
      return;
    }
  }

  res.status(404).json({ message: '接口不存在' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器内部错误' });
});

// 数据库初始化函数
async function initializeDatabase() {
  // 从db_init.sql文件读取SQL内容
  const dbInitSql = `
    -- 创建用户表
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'buyer', -- 'buyer', 'seller', 'admin'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 创建商品表
    CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        image_url VARCHAR(500),
        seller_id INTEGER REFERENCES users(id),
        status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 创建购物车表
    CREATE TABLE IF NOT EXISTS cart (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id) -- 确保同一用户对同一商品只有一条记录
    );

    -- 创建订单表
    CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        total_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'shipped', 'delivered', 'cancelled'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 创建订单详情表
    CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        price_at_time DECIMAL(10, 2) NOT NULL -- 记录下单时的价格
    );

    -- 创建索引以提高查询性能
    CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
    CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id);
  `;

  // 尝试连接数据库，带重试机制
  let retries = 10; // 增加重试次数
  const retryDelay = 5000; // 增加重试间隔到5秒

  console.log('开始数据库初始化流程...');
  console.log('当前环境:', process.env.NODE_ENV || 'development');
  console.log('DATABASE_URL 存在:', !!process.env.DATABASE_URL);
  console.log('DATABASE_PUBLIC_URL 存在:', !!process.env.DATABASE_PUBLIC_URL);
  console.log('PGHOST 存在:', !!process.env.PGHOST);
  console.log('PGPORT 存在:', !!process.env.PGPORT);
  console.log('PGDATABASE 存在:', !!process.env.PGDATABASE);
  console.log('PGUSER 存在:', !!process.env.PGUSER);
  console.log('PGPASSWORD 存在:', !!process.env.PGPASSWORD);

  while (retries > 0) {
    try {
      console.log(`正在尝试连接数据库... (剩余重试次数: ${retries})`);

      // 测试数据库连接
      const result = await db.query('SELECT NOW()');
      console.log('数据库连接成功!', result.rows);

      console.log('正在初始化数据库表结构...');
      await db.query(dbInitSql);
      console.log('数据库初始化完成');

      // 验证表是否创建成功
      const tablesResult = await db.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('users', 'products', 'cart', 'orders', 'order_items')
      `);

      console.log(`成功创建了 ${tablesResult.rowCount} 个表:`,
        tablesResult.rows.map(row => row.table_name).join(', '));

      return; // 成功则退出函数
    } catch (error) {
      retries--;
      console.error(`数据库连接失败:`, error.message);
      console.error(`错误详情:`, {
        code: error.code,
        detail: error.detail,
        hint: error.hint,
        stack: error.stack
      });

      if (retries === 0) {
        console.error('数据库初始化失败，超出最大重试次数');
        throw error;
      }

      console.log(`等待 ${retryDelay/1000} 秒后重试...`);
      // 等待一段时间再重试
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

// 创建管理员用户函数
async function createAdminUserIfNotExists() {
  try {
    // 检查管理员用户是否已存在
    const existingAdmin = await db.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      ['潘子豪', '111111@qq.com']
    );

    if (existingAdmin.rows.length > 0) {
      console.log('管理员用户已存在，跳过创建');
      return;
    }

    // 加密密码
    const bcrypt = require('bcryptjs');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('123456', saltRounds);

    // 创建管理员用户
    const result = await db.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      ['潘子豪', '111111@qq.com', hashedPassword, 'admin']
    );

    console.log('管理员用户创建成功:', result.rows[0]);
    console.log('用户名: 潘子豪');
    console.log('邮箱: 111111@qq.com');
    console.log('密码: 123456');
  } catch (error) {
    console.error('创建管理员用户失败:', error);
    throw error;
  }
}

// 只有在直接运行此文件时才启动服务器
if (require.main === module) {
  // 启动服务器前先初始化数据库
  initializeDatabase()
    .then(async () => {
      console.log('数据库初始化成功');

      // 创建管理员用户（如果不存在）
      await createAdminUserIfNotExists();

      const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`服务器运行在端口 ${PORT}`);
        console.log(`运行环境: ${process.env.NODE_ENV || 'development'}`);
        if (process.env.NODE_ENV === 'production') {
          console.log(`前端服务: 静态文件托管已启用`);
        }
      });

      // 处理关闭信号
      process.on('SIGTERM', () => {
        console.log('收到SIGTERM信号，正在关闭服务器...');
        server.close(() => {
          console.log('服务器已关闭');
        });
      });

      process.on('SIGINT', () => {
        console.log('收到SIGINT信号，正在关闭服务器...');
        server.close(() => {
          console.log('服务器已关闭');
        });
      });
    })
    .catch((error) => {
      console.error('数据库初始化失败，应用程序退出:', error);

      // 提供更具体的错误信息
      if (!process.env.DATABASE_URL && !process.env.DATABASE_PUBLIC_URL) {
        console.error('\n🔍 检测到数据库连接问题:');
        console.error('💡 解决方案:');
        console.error('   1. 登录Railway控制台');
        console.error('   2. 确认数据库服务和应用服务在同一项目中');
        console.error('   3. 在应用服务的"Plugins"选项卡中添加数据库服务');
        console.error('   4. 重新部署应用');
        console.error('📋 详细步骤请参阅项目根目录的 RAILWAY_SETUP.md 文件');
      }

      process.exit(1);
    });
}

// 导出app实例以供测试使用和其他用途
module.exports = app;