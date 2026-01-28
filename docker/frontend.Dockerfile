# 使用官方 Node.js 运行时作为基础镜像
FROM node:22-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json (如果存在)
COPY frontend/package*.json ./

# 安装依赖
RUN npm install

# 复制前端源代码
COPY frontend/src ./src
COPY frontend/public ./public
COPY frontend/vite.config.js ./
COPY frontend/index.html ./

# 构建应用
RUN npm run build

# 安装 serve 来运行静态文件
RUN npm install -g serve

# 暴露端口
EXPOSE 5173

# 启动应用
CMD ["serve", "-s", "dist"]