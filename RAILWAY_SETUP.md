# Railway 部署和数据库连接说明

## 重要：服务链接配置

如果你的应用在Railway上无法连接到数据库，请按以下步骤操作：

### 1. 检查服务链接

确保你的数据库服务已正确链接到应用服务：

1. 登录到Railway控制台
2. 进入你的项目
3. 在左侧导航栏中，你应该能看到你的应用服务和数据库服务
4. 确保它们在同一个项目中

### 2. 验证环境变量

在Railway项目中：

1. 点击你的**应用服务**（不是数据库服务）
2. 转到 "Settings"（设置）选项卡
3. 向下滚动到 "Environment Variables"（环境变量）部分
4. 确认以下变量存在：
   - `DATABASE_URL` - 从数据库服务自动注入
   - `DATABASE_PUBLIC_URL` - 公共访问URL
   - `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` - 数据库连接参数

### 3. 如果环境变量未自动注入

如果上述环境变量没有自动出现在你的应用服务中：

1. 点击你的**应用服务**
2. 转到 "Plugins"（插件）选项卡
3. 点击 "Add Plugin"（添加插件）
4. 选择你的数据库服务
5. 这将把数据库的环境变量注入到你的应用服务中

### 4. 重新部署

在链接服务并验证环境变量后：

1. 返回到 "Deployments"（部署）选项卡
2. 点击 "Deploy"（部署）按钮重新部署应用

### 5. 验证部署

部署后检查日志，你应该看到类似以下的成功信息：
```
检查数据库环境变量...
- DATABASE_URL 存在: true
- DATABASE_PUBLIC_URL 存在: true
...
最终数据库URL: postgresql://***@postgres.railway.internal:5432/railway
数据库连接成功!
```

## 故障排除

如果仍然遇到问题：

1. **检查服务是否在同一项目中**：数据库和应用必须在同一个Railway项目中才能自动链接

2. **手动验证数据库连接**：
   - 在Railway终端中运行：`npm run db-test`

3. **检查数据库服务状态**：
   - 确认数据库服务正在运行且状态为 "Healthy"

4. **查看完整日志**：
   - 在部署日志中查找详细的错误信息

## 关于 DATABASE_URL 和 DATABASE_PUBLIC_URL

- `DATABASE_URL`：内部URL，用于同一Railway项目内的服务间通信（推荐使用）
- `DATABASE_PUBLIC_URL`：公共URL，用于外部访问

应用会优先使用 `DATABASE_URL`，如果没有找到，则尝试使用 `DATABASE_PUBLIC_URL`。

## 常见错误及解决方案

**错误：`ECONNREFUSED 127.0.0.1:5432`**
- 原因：应用没有检测到数据库环境变量，尝试连接本地数据库
- 解决方案：确保数据库服务已链接到应用服务

**错误：`FATAL: password authentication failed`**
- 原因：数据库凭证不匹配
- 解决方案：重新链接数据库服务到应用服务

**错误：`no pg_hba.conf entry for host`**
- 原因：IP地址不在允许列表中
- 解决方案：使用内部URL（DATABASE_URL）而非公共URL