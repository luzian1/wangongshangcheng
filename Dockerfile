# 多阶段构建：第一阶段 - 构建前端
FROM node:20-alpine AS frontend-build

WORKDIR /app

# 复制前端package文件并安装依赖
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

# 复制前端源代码
COPY frontend/ .

# 构建前端应用
RUN npm run build

# 第二阶段 - 构建后端
FROM node:20-alpine AS backend-build

# 设置工作目录为app根目录，这样可以保持与代码中的相对路径一致
WORKDIR /app

# 复制后端package文件并安装依赖
COPY backend/package*.json ./
RUN npm install --legacy-peer-deps

# 复制后端源代码
COPY backend/ .

# 从第一阶段复制构建好的前端文件到正确位置
COPY --from=frontend-build /app/dist ./frontend/dist

# 设置环境变量
ENV NODE_ENV=production

EXPOSE $PORT

# 启动应用 - 从根目录启动，因为后端代码引用了相对路径到frontend/dist
CMD ["sh", "-c", "cd /app && npm start"]