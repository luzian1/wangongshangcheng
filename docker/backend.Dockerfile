# 使用官方 Node.js 运行时作为基础镜像
FROM node:22-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json (如果存在)
COPY backend/package*.json ./

# 安装依赖
RUN npm install

# 复制后端源代码
COPY backend/src ./src

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]