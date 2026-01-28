# 数据库初始化说明

## 部署后手动初始化数据库

当您首次部署应用到Railway后，可能需要手动初始化数据库表结构。

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

## 数据库表结构

初始化脚本会创建以下表：
- users: 用户信息表
- products: 商品信息表
- cart: 购物车表
- orders: 订单表
- order_items: 订单详情表

## 注意事项

- 数据库初始化只需要在首次部署时执行
- 初始化脚本使用 `CREATE TABLE IF NOT EXISTS` 语句，因此可以安全地重复运行
- 如果遇到连接错误，请稍等片刻再尝试，因为数据库可能需要一些时间完全启动