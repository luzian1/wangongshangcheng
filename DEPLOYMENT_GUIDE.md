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
1. 在Railway项目页面，点击左侧菜单中的 "Settings"（设置）
2. 在设置页面中，向下滚动找到 "Environment Variables"（环境变量）部分
3. 点击 "New Variable"（新建变量）按钮
4. 分别添加以下环境变量：

**JWT_SECRET**:
- Key: `JWT_SECRET`
- Value: 随机生成的安全密钥（至少32位字符，例如：`mySuperSecretKeyThatIsVeryLongAndRandom123456`）
- 点击 "Add" 或 "Save" 按钮保存

**FRONTEND_URL**:
- Key: `FRONTEND_URL`
- Value: 您的Railway部署URL（例如：`https://your-project-name-production.up.railway.app`）
- 点击 "Add" 或 "Save" 按钮保存

注意：`FRONTEND_URL` 应该替换为您实际的Railway部署URL。如果您还没有部署URL，可以先使用占位符，部署后再回来修改。

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
数据库会在应用首次启动时自动初始化。当应用启动时，它会自动创建所有必需的数据表（用户表、商品表、购物车表、订单表等）。

关于您提到的两个数据库URL：
- `DATABASE_URL` (内部URL): `postgresql://postgres:...@postgres.railway.internal:5432/railway` - 这是应用内部访问数据库的URL
- `DATABASE_PUBLIC_URL` (公共URL): `postgresql://postgres:...@yamabiko.proxy.rlwy.net:34208/railway` - 这是外部访问数据库的URL

您的应用会自动使用内部URL连接数据库，这是正确的配置。应用启动时会自动创建所有必需的表结构。

**重要说明**：
- 部署到Railway时，应用会使用Railway提供的数据库，而不是您本地的数据库
- 本地的 `.env` 文件不会影响部署环境，Railway使用其环境变量
- 数据库表结构定义在 `backend/src/config/db_init.sql` 文件中
- 应用会自动执行此文件中的SQL语句来创建表

如果部署后数据库仍然为空，您可以：
1. 检查Railway日志中是否有数据库连接错误
2. 等待应用完全启动（可能需要几分钟）
3. 如果仍存在问题，可以通过Railway的终端手动初始化：
   - 在Railway项目页面，点击左侧菜单中的 "Terminal"（终端）
   - 运行 `npm run init-db` 命令来手动初始化数据库

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
- 如果出现Node.js版本兼容性问题，请确保使用支持的版本
- 检查是否有缺失的文件或目录

### 6.2 数据库连接失败
- 确认 `DATABASE_URL` 环境变量已正确设置
- 检查数据库是否已成功创建并运行
- 确认SSL配置是否正确
- 检查数据库连接池配置

### 6.3 前端页面无法加载
- 确认前端已正确构建
- 检查后端是否正确提供了静态文件服务
- 确认环境变量 `NODE_ENV` 是否设置为 `production`
- 检查路径配置是否正确

### 6.4 构建错误
- 如果出现依赖版本冲突，Dockerfile中使用了 `--legacy-peer-deps` 参数来解决
- 如果仍有问题，请检查package.json中的依赖版本是否兼容
- 检查Node.js版本是否满足依赖要求

### 6.5 常见错误解决方案
- **"Cannot find module"错误**: 确保所有依赖都已正确安装
- **"Module not found"错误**: 检查导入路径是否正确
- **"Port already in use"错误**: Railway会自动分配端口，确保使用`$PORT`环境变量
- **"Connection refused"错误**: 检查数据库连接字符串是否正确
- **"Permission denied"错误**: 检查文件权限设置

### 6.6 常见问题解答 (FAQ)

**Q: 如何生成JWT_SECRET？**
A: 您可以使用在线工具生成随机字符串，或者在终端中运行以下命令：
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
（需要Node.js环境）

或者使用在线随机字符串生成器生成至少32位的随机字符串。

**Q: FRONTEND_URL应该填写什么？**
A: FRONTEND_URL应该是您的Railway部署URL，通常格式为：`https://your-project-name-production.up.railway.app`
如果您还没有部署，可以先使用占位符，部署后再回来修改。

**Q: 部署后访问网站显示空白页面怎么办？**
A: 请检查：
1. 确认环境变量`NODE_ENV`是否设置为`production`
2. 检查前端是否正确构建
3. 查看Railway日志中是否有错误信息

**Q: API请求返回404错误怎么办？**
A: 请确认：
1. API请求路径是否正确（应以`/api/`开头）
2. 后端服务是否正常运行
3. 检查Railway日志中的错误信息

**Q: 如何查看应用日志？**
A: 在Railway项目页面，点击左侧菜单中的"Logs"即可查看实时日志。

**Q: 如何重新部署？**
A: 在Railway项目页面，点击"Deployments"标签页，然后点击"Deploy"按钮重新部署最新代码。

**Q: 在Railway界面中找不到某些功能按钮怎么办？**
A: Railway的界面可能会更新，如果找不到某个功能，请参考以下常见位置：
- 环境变量设置：左侧菜单 -> "Settings" -> "Environment Variables"
- 日志查看：左侧菜单 -> "Logs"
- 终端访问：左侧菜单 -> "Terminal"
- 部署历史：左侧菜单 -> "Deployments"
- 数据库管理：左侧菜单 -> 您创建的数据库名称
- 项目设置：左侧菜单 -> "Settings"

**Q: 部署时出现数据库连接错误怎么办？**
A: 请确认：
1. 确认已在Railway中添加了PostgreSQL数据库
2. 确认DATABASE_URL环境变量已正确设置
3. 检查Railway日志中的具体错误信息

**Q: 部署时出现数据库连接错误 "ECONNREFUSED" 怎么办？**
A: 这通常是由于DATABASE_URL环境变量未正确设置或数据库尚未完全启动导致的。请检查：
1. 确认已在Railway中添加了PostgreSQL数据库
2. 确认DATABASE_URL环境变量已正确设置
3. 确认数据库已完全启动（可能需要等待几分钟）
4. 应用现在包含重试机制，会在启动时多次尝试连接数据库

## 7. 性能优化建议

- 启用Railway的自动休眠功能以节省资源
- 配置自定义域名以获得更好的用户体验
- 设置适当的缓存策略以提高性能

## 8. 部署检查清单

请参考项目根目录下的 `CHECKLIST.md` 文件，里面有详细的部署步骤检查清单，帮助您顺利完成部署。

## 9. 数据库初始化

首次部署后，您可能需要手动初始化数据库表结构。请参考项目根目录下的 `DATABASE_INIT.md` 文件了解详细步骤。

## 10. 环境变量配置

有关环境变量的详细配置说明，请参考项目根目录下的 `ENVIRONMENT_VARIABLES.md` 文件。


## 11. 监控和维护

- 定期检查应用日志以发现潜在问题
- 监控数据库性能和连接数
- 定期备份重要数据