const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(helmet()); // 安全头部
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL,  // 网页版部署地址
    'https://webview.weixin.qq.com', // 微信小程序 webview
    'https://servicewechat.com'      // 微信小程序
  ].filter(Boolean),
  credentials: true
})); // 跨域
app.use((req, res, next) => {
  // 允许跨源资源加载
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  next();
}); // 设置跨源策略
app.use(express.json()); // 解析JSON

// 创建上传目录（如果不存在）
const uploadDir = path.join(__dirname, '..', 'uploads');
const fs = require('fs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 提供上传文件的静态服务
app.use('/uploads', cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173']
}), (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
}, express.static(uploadDir));

// 路由
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// 基础健康检查路由
app.get('/', (req, res) => {
  res.json({ message: '简易在线商城API服务运行中' });
});

// 404处理
app.use((req, res) => {
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
  });
}