const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

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

// 安全中间件
app.use(helmet());

// CORS配置 - 生产环境和开发环境不同
let corsOptions;
if (isProduction) {
  // 生产环境：只允许部署的前端域名
  corsOptions = {
    origin: process.env.FRONTEND_URL || '*', // 部署时设置实际的前端URL
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
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 提供上传文件的静态服务
app.use('/uploads', express.static(uploadDir));

// 在生产环境中提供前端静态文件
if (isProduction) {
  // 服务构建后的前端文件
  const frontendDistPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
  if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));

    // 处理SPA路由 - 将所有非API请求重定向到index.html
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/') ||
          req.path.startsWith('/uploads/') ||
          req.path.startsWith('/assets/')) {
        // API请求或静态资源请求，返回404
        res.status(404).json({ message: '接口不存在' });
      } else {
        // 前端路由，返回index.html
        res.sendFile(path.join(frontendDistPath, 'index.html'));
      }
    });
  } else {
    console.warn('警告: 前端构建目录不存在，无法提供前端服务');
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
    // 生产环境下返回前端页面或重定向到前端
    const frontendDistPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
    if (fs.existsSync(frontendDistPath)) {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    } else {
      res.json({ message: '简易在线商城API服务运行中' });
    }
  } else {
    res.json({ message: '简易在线商城API服务运行中' });
  }
});

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
  console.log('数据库连接字符串存在:', !!process.env.DATABASE_URL);

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
        hint: error.hint
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

// 只有在直接运行此文件时才启动服务器
if (require.main === module) {
  // 启动服务器前先初始化数据库
  initializeDatabase()
    .then(() => {
      console.log('数据库初始化成功');

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
      process.exit(1);
    });
}

// 导出app实例以供测试使用和其他用途
module.exports = app;