# 数据库连接配置说明

## 1. Railway数据库配置

### 1.1 自动配置
当您在Railway上添加PostgreSQL数据库时，Railway会自动：
- 创建数据库实例
- 生成连接URL
- 将连接信息设置为 `DATABASE_URL` 环境变量
- 自动连接到您的应用

### 1.2 环境变量说明
Railway会自动设置以下环境变量：
- `DATABASE_URL`: 完整的数据库连接字符串
- `PGHOST`: 数据库主机地址
- `PGPORT`: 数据库端口
- `PGDATABASE`: 数据库名称
- `PGUSER`: 数据库用户名
- `PGPASSWORD`: 数据库密码

## 2. 代码中的数据库连接配置

### 2.1 当前配置说明
在 `backend/src/config/db.js` 文件中，我们已经配置了：

```javascript
const { Pool } = require('pg');
require('dotenv').config();

// 优先使用 Railway 提供的 DATABASE_URL，否则使用本地配置
const connectionString = process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const pool = new Pool({
  connectionString: connectionString,
  // 在 Railway 上需要 SSL 连接
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = pool;
```

### 2.2 配置要点
- 代码会优先使用 `DATABASE_URL` 环境变量
- 在生产环境中自动启用SSL连接
- 在开发环境中回退到本地配置

## 3. 数据库初始化

### 3.1 自动初始化
在生产环境中，应用启动时会自动执行数据库初始化。
如果需要手动初始化，可以执行 `backend/src/config/db_init.sql` 中的SQL语句。

### 3.2 初始化SQL脚本
数据库表结构定义在 `backend/src/config/db_init.sql` 文件中，包含：
- users 表：用户信息
- products 表：商品信息
- cart 表：购物车信息
- orders 表：订单信息
- order_items 表：订单详情

## 4. 数据库连接故障排除

### 4.1 连接失败
如果遇到数据库连接问题，请检查：
1. 确认已在Railway项目中添加了PostgreSQL数据库
2. 确认 `DATABASE_URL` 环境变量已正确设置
3. 检查SSL配置是否正确（生产环境必须启用）

### 4.2 权限问题
确保数据库用户具有以下权限：
- 读取和写入所有相关表的权限
- 创建和删除表的权限（如果需要自动初始化）

## 5. 数据库性能优化

### 5.1 连接池配置
当前使用pg.Pool默认配置，在高并发场景下可以考虑调整：
- `connectionLimit`: 最大连接数
- `idleTimeoutMillis`: 空闲连接超时时间

### 5.2 索引优化
数据库已包含以下关键索引：
- `idx_products_seller_id`: 商品卖家索引
- `idx_products_status`: 商品状态索引
- `idx_orders_user_id`: 订单用户索引
- `idx_orders_status`: 订单状态索引
- `idx_cart_user_id`: 购物车用户索引

## 6. 数据库安全

### 6.1 SSL连接
- 生产环境中强制使用SSL连接
- 防止数据传输过程中被窃取

### 6.2 SQL注入防护
- 使用参数化查询防止SQL注入
- 所有用户输入都会经过验证和清理

## 7. 数据库备份和恢复

### 7.1 自动备份
Railway会自动为PostgreSQL数据库创建备份。

### 7.2 手动备份
如需手动备份，可通过Railway的Web Terminal或连接到数据库后使用pg_dump命令。

## 8. 监控数据库性能

### 8.1 连接数监控
监控数据库连接数，确保不超过数据库限制。

### 8.2 查询性能
定期检查慢查询日志，优化性能瓶颈。