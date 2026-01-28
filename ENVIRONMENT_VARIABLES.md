# 环境变量配置说明

## 生产环境 (Railway)

在Railway部署时，需要设置以下环境变量：

### 必需变量
- `DATABASE_URL` / `RAILWAY_DATABASE_URL` / `POSTGRES_URL` - 数据库连接URL（由Railway自动设置，应用会尝试这些变量名，按顺序查找第一个存在的）
- `JWT_SECRET` - JWT密钥（至少32位随机字符）
- `FRONTEND_URL` - 前端访问URL（例如：https://your-project-name-production.up.railway.app）

### 可选变量
- `NODE_ENV` - 环境类型（production/dev，默认为production）
- `PORT` - 端口号（由Railway自动设置）

## 开发环境 (本地)

在本地开发时，需要在 `.env` 文件中设置：

```
DATABASE_URL=postgresql://用户名:密码@localhost:5432/数据库名
JWT_SECRET=your-local-development-secret-key
FRONTEND_URL=http://localhost:5173
PORT=3000
```

## 重要说明

1. **生产环境**：应用将忽略本地的 `.env` 文件，只使用Railway提供的环境变量
2. **开发环境**：应用将加载 `.env` 文件中的变量
3. **DATABASE_URL**：这是最重要的变量，应用启动时会检查此变量是否存在
4. **JWT_SECRET**：用于用户认证，必须设置且保持安全