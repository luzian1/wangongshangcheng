# 多阶段构建：第一阶段 - 构建前端
FROM node:18-alpine AS frontend-build

WORKDIR /app

# 复制前端package文件并安装依赖
COPY frontend/package*.json ./
RUN npm install

# 复制前端源代码
COPY frontend/ .

# 构建前端应用
RUN npm run build

# 第二阶段 - 构建后端
FROM node:18-alpine AS backend-build

WORKDIR /app

# 复制后端package文件并安装依赖
COPY backend/package*.json ./
RUN npm install

# 复制后端源代码
COPY backend/ .

# 从第一阶段复制构建好的前端文件
COPY --from=frontend-build /app/dist ./frontend/dist

# 暴露端口
EXPOSE $PORT

# 启动应用
CMD ["npm", "start"]