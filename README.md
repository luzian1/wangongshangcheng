# 简易在线商城 - Railway部署指南

这是一个全栈电商项目，包含买家、商家和管理员三种角色。前端使用Vue3，后端使用Node.js + Express + PostgreSQL。

## 部署到Railway

### 1. 准备工作
- 确保代码已推送至GitHub仓库
- 注册并登录 [Railway](https://railway.app) 账号

### 2. 部署步骤
1. 在Railway创建新项目，选择"Deploy from GitHub repo"
2. 选择您的mall仓库
3. 部署开始后，点击左侧菜单中的"Settings"
4. 向下滚动找到"Environment Variables"部分，点击"New Variable"按钮添加以下环境变量：
   - `JWT_SECRET`: 随机生成的安全密钥（至少32位字符，例如：`mySuperSecretKeyThatIsVeryLongAndRandom123456`）
   - `FRONTEND_URL`: 部署后的URL（例如：`https://your-project-name-production.up.railway.app`）
5. 添加PostgreSQL数据库（Railway会自动配置连接）：
   - 点击左侧菜单中的"New" -> "Database" -> "PostgreSQL"
   - 选择"Provision"创建数据库
6. 点击部署

### 3. 访问应用
- 网页版：`https://your-project-name-production.up.railway.app`
- API接口：`https://your-project-name-production.up.railway.app/api/*`

### 4. 数据库说明
- 数据库会在应用首次启动时自动初始化
- 应用会自动创建所有必需的数据表（用户表、商品表、购物车表、订单表等）
- 部署到Railway时，应用会使用Railway提供的数据库，而不是本地数据库
- 本地的 `.env` 文件不会影响部署环境，Railway使用其环境变量
- 如果部署后数据库仍然为空，可通过Railway终端运行 `npm run init-db` 手动初始化
- 如果出现 "ECONNREFUSED" 错误，请确认DATABASE_URL环境变量已正确设置

### 5. 微信小程序配置
在微信小程序后台配置合法域名：
- 请求域名：`https://your-project-name-production.up.railway.app`

## 技术栈
- 前端：Vue3, Vite, Element Plus, Pinia, Vue Router
- 后端：Node.js, Express, PostgreSQL
- 部署：Docker, Railway

## 功能特性
- 买家：商品浏览、搜索、购物车、订单管理
- 商家：商品管理、销售数据概览
- 管理员：系统监控、用户管理、商品审核