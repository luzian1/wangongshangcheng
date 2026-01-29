# 皖工购物网后端测试说明

## 项目概述

本项目是皖工购物网的后端部分，使用 Node.js、Express 和 PostgreSQL 构建。为确保代码质量和系统稳定性，项目包含全面的测试套件。

## 测试类型

### 1. 单元测试
- 测试单个函数、方法或类的功能
- 覆盖控制器、中间件、数据库配置等模块
- 使用 Jest 进行测试执行

### 2. 集成测试
- 测试多个组件之间的交互
- 测试 API 端点和路由功能
- 使用 Supertest 进行 HTTP 请求测试

### 3. 系统测试
- 测试整个系统的端到端功能
- 验证完整的业务流程
- 模拟真实用户操作场景

## 测试文件结构

```
__tests__/
├── setup.js                    # 测试环境设置
├── userController.test.js      # 用户控制器单元测试
├── db.test.js                  # 数据库配置单元测试
├── authMiddleware.test.js      # 认证中间件单元测试
├── integration/                # 集成测试
│   ├── userRoutes.test.js      # 用户路由集成测试
│   └── productRoutes.test.js   # 产品路由集成测试
└── system/                     # 系统测试
    ├── userFlow.test.js        # 用户流程系统测试
    └── basicFlow.test.js       # 基础流程系统测试
```

## 运行测试

### 安装依赖

```bash
npm install
```

### 运行所有测试

```bash
npm test
```

### 运行特定测试

```bash
# 运行单元测试
npx jest __tests__/

# 运行集成测试
npx jest __tests__/integration/

# 运行系统测试
npx jest __tests__/system/

# 运行特定测试文件
npx jest __tests__/userController.test.js
```

### 监听模式运行测试

```bash
npm run test:watch
```

### 生成覆盖率报告

```bash
npm run test:coverage
```

## 测试覆盖率

项目目标是达到至少 80% 的测试覆盖率，关键业务逻辑需要 100% 覆盖。

## 测试策略

### 单元测试重点
- 验证控制器方法的输入输出
- 测试错误处理逻辑
- 验证中间件功能
- 数据库查询方法的正确性

### 集成测试重点
- API 端点的正确响应
- 路由中间件的正确应用
- 认证和授权功能
- 数据库交互的正确性

### 系统测试重点
- 完整的业务流程
- 用户注册到下单的流程
- 管理员功能
- 商家功能

## 环境配置

测试使用模拟数据和模拟数据库连接，不会影响实际数据库。

## 维护说明

- 每次功能更新后需要更新相应的测试
- 定期审查和重构测试代码
- 确保测试与实际实现保持同步
- 保持高测试覆盖率