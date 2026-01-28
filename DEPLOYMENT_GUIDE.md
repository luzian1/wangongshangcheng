# 部署到Railway的详细步骤

## 1. 准备工作

### 1.1 确保代码已提交到GitHub
- 确保您的代码已经完整提交到GitHub仓库
- 检查所有必要的文件都已包含在仓库中

### 1.2 检查项目结构
确保您的项目结构如下：
```
mall/
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── index.js
│   │   └── ...
│   └── ...
├── frontend/
│   ├── package.json
│   ├── src/
│   │   └── ...
│   └── ...
├── Procfile
├── Dockerfile
├── railway.app.json
├── .env.example
└── README.md
```

## 2. Railway部署步骤

### 2.1 创建Railway账号
1. 访问 [Railway](https://railway.app) 并注册账号
2. 登录到您的Railway账户

### 2.2 创建新项目
1. 点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 选择您的mall项目仓库
4. 点击 "Deploy Now"

### 2.3 配置环境变量
1. 在Railway项目页面，点击 "Settings" -> "Environment Variables"
2. 添加以下环境变量：

```
JWT_SECRET = 随机生成的安全密钥（至少32位字符）
FRONTEND_URL = https://your-project-name-production.up.railway.app
```

注意：`FRONTEND_URL` 应该替换为您实际的Railway部署URL。

### 2.4 添加PostgreSQL数据库
1. 在Railway项目页面，点击 "New" -> "Database" -> "PostgreSQL"
2. 选择 "Provision" 创建数据库
3. Railway会自动将数据库连接信息设置为 `DATABASE_URL` 环境变量

## 3. 部署后的配置

### 3.1 初始化数据库
1. 部署完成后，您需要初始化数据库表结构
2. 在Railway项目页面，点击 "Settings" -> "Variables"
3. 确认 `DATABASE_URL` 已经正确设置

### 3.2 数据库初始化脚本
如果需要手动初始化数据库，可以通过Railway的Web Terminal执行SQL脚本：
1. 在Railway项目页面，点击 "Overview"
2. 点击 "Launch Web Terminal"
3. 连接到数据库并执行 `backend/src/config/db_init.sql` 中的SQL语句

## 4. 访问您的应用

部署完成后，您可以通过以下方式访问应用：
- 网页版：`https://your-project-name-production.up.railway.app`
- API接口：`https://your-project-name-production.up.railway.app/api/*`

## 5. 微信小程序配置

为了支持微信小程序访问，您需要在微信小程序后台配置合法域名：
- 请求域名：`https://your-project-name-production.up.railway.app`
- Socket合法域名：`wss://your-project-name-production.up.railway.app`

## 6. 故障排除

### 6.1 部署失败
- 检查Dockerfile语法是否正确
- 确认package.json中的依赖项是否正确
- 查看Railway的部署日志以获取详细错误信息

### 6.2 数据库连接失败
- 确认 `DATABASE_URL` 环境变量已正确设置
- 检查数据库是否已成功创建并运行
- 确认SSL配置是否正确

### 6.3 前端页面无法加载
- 确认前端已正确构建
- 检查后端是否正确提供了静态文件服务
- 确认环境变量 `NODE_ENV` 是否设置为 `production`

## 7. 性能优化建议

- 启用Railway的自动休眠功能以节省资源
- 配置自定义域名以获得更好的用户体验
- 设置适当的缓存策略以提高性能

## 8. 监控和维护

- 定期检查应用日志以发现潜在问题
- 监控数据库性能和连接数
- 定期备份重要数据