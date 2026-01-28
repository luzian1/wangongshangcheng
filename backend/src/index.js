const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

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

// 导出app实例以供测试使用
module.exports = app;

// 只有在直接运行此文件时才启动服务器
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
    console.log(`运行环境: ${process.env.NODE_ENV || 'development'}`);
    if (process.env.NODE_ENV === 'production') {
      console.log(`前端服务: 静态文件托管已启用`);
    }
  });
}