# 数据库初始化说明

## 自动数据库初始化

当您首次部署应用到Railway后，应用会在启动时自动初始化数据库表结构。无需手动执行任何操作。

## 数据库表结构

初始化脚本会自动创建以下表：
- users: 用户信息表
- products: 商品信息表
- cart: 购物车表
- orders: 订单表
- order_items: 订单详情表

## 手动初始化（仅在必要时）

如果自动初始化失败，您可以手动初始化数据库：

### 方法一：通过Railway终端

1. 在Railway项目页面，点击左侧菜单中的 "Terminal"（终端）
2. 运行以下命令来初始化数据库：
   ```bash
   npm run init-db
   ```

### 方法二：通过Railway CLI（本地）

如果您安装了Railway CLI，可以从本地运行：
```bash
railway run npm run init-db
```

## 注意事项

- 正常情况下，数据库初始化会在应用启动时自动完成
- 初始化脚本使用 `CREATE TABLE IF NOT EXISTS` 语句，因此可以安全地重复运行
- 如果遇到连接错误，请稍等片刻再尝试，因为数据库可能需要一些时间完全启动