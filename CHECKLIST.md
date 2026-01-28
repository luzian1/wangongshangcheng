# Railway部署快速检查清单

## 部署前检查
- [ ] 代码已完整提交到GitHub仓库
- [ ] 确认项目包含以下文件：
  - [ ] `backend/` 目录
  - [ ] `frontend/` 目录
  - [ ] `Dockerfile`
  - [ ] `Procfile`
  - [ ] `railway.app.json`

## 部署步骤
- [ ] 登录Railway账户
- [ ] 创建新项目并连接到GitHub仓库
- [ ] 等待初始部署完成
- [ ] 添加环境变量：
  - [ ] `JWT_SECRET` (至少32位随机字符)
  - [ ] `FRONTEND_URL` (部署后的URL)
- [ ] 添加PostgreSQL数据库
- [ ] 重新部署以应用环境变量

## 部署后验证
- [ ] 访问网站确认前端正常加载
- [ ] 测试API接口是否正常工作
- [ ] 注册新用户测试用户功能
- [ ] 检查数据库连接是否正常
- [ ] 验证数据库表是否已自动创建（用户表、商品表等）
- [ ] 如果数据库表未自动创建，可通过Railway终端运行 `npm run init-db` 手动初始化
- [ ] 验证微信小程序访问是否正常

## 常见问题排查
- [ ] 检查Railway日志中是否有错误信息
- [ ] 确认环境变量已正确设置
- [ ] 验证数据库连接是否正常
- [ ] 确认前端构建是否成功

## 常见问题解答
**Q: 我看到两个数据库URL，DATABASE_URL和DATABASE_PUBLIC_URL，哪个是正确的？**
A: 这是正常的。DATABASE_URL是应用内部访问数据库的URL，DATABASE_PUBLIC_URL是外部访问的URL。应用会自动使用正确的URL连接数据库。

**Q: 部署后数据库是空的，没有任何表，怎么办？**
A: 应用会在启动时自动创建所有必需的表。如果表没有自动创建，可能是应用启动过程中出现问题。请检查日志，然后通过Railway终端运行 `npm run init-db` 手动初始化数据库。

**Q: 应用启动后多久数据库表才会被创建？**
A: 数据库表会在应用启动过程中立即创建，通常在几秒钟内完成。如果超过几分钟仍未创建，请检查应用日志。

**Q: 部署后应用使用的是Railway的数据库还是我本地的数据库？**
A: 部署到Railway后，应用会使用Railway提供的数据库，而不是您本地的数据库。本地的 `.env` 文件不会影响部署环境。

**Q: 本地的 .env 文件会影响部署环境吗？**
A: 不会。部署到Railway时，应用使用Railway的环境变量，本地的 `.env` 文件不会被使用。

**Q: 部署时出现 "DATABASE_URL 环境变量未设置" 错误怎么办？**
A: 这表示应用无法找到DATABASE_URL环境变量，请检查：
1. 确认已在Railway中添加了PostgreSQL数据库
2. 确认DATABASE_URL环境变量已自动设置
3. 检查Railway日志确认数据库已完全启动后再访问应用

**Q: 部署时出现 "ECONNREFUSED" 数据库连接错误怎么办？**
A: 这表示应用无法连接到数据库，请检查：
1. 确认已在Railway中添加了PostgreSQL数据库
2. 确认DATABASE_URL环境变量已正确设置
3. 等待数据库完全启动后再尝试部署
4. 应用现在包含重试机制，会在启动时多次尝试连接数据库

## 访问地址
- 网页版：`https://your-project-name-production.up.railway.app`
- API接口：`https://your-project-name-production.up.railway.app/api/*`
- 日志查看：Railway项目页面 -> "Logs"
- 终端访问：Railway项目页面 -> "Terminal"