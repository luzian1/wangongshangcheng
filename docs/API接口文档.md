# API 接口文档

## 概述

本项目提供了一套完整的 RESTful API 接口，支持买家、商家和管理员三种角色的功能。

## 基础信息

- 基础URL: `http://localhost:3000/api`
- 请求格式: JSON
- 响应格式: JSON
- 认证方式: JWT Bearer Token

## 通用响应格式

```json
{
  "message": "响应消息",
  "data": {},
  "pagination": {}
}
```

## 用户接口

### 注册
- **POST** `/api/users/register`
- **描述**: 用户注册
- **请求参数**:
  - `username`: 用户名
  - `email`: 邮箱
  - `password`: 密码
  - `role`: 角色 (buyer/seller/admin, 默认为buyer)

### 登录
- **POST** `/api/users/login`
- **描述**: 用户登录
- **请求参数**:
  - `username`: 用户名
  - `password`: 密码
- **响应**:
  - `token`: JWT 认证令牌
  - `user`: 用户信息

### 获取用户资料
- **GET** `/api/users/profile`
- **描述**: 获取当前登录用户资料
- **认证**: JWT Token

## 商品接口

### 获取商品列表
- **GET** `/api/products`
- **描述**: 获取商品列表（买家）
- **参数**:
  - `page`: 页码
  - `limit`: 每页数量
  - `status`: 状态（仅对管理员有效）

### 获取商品详情
- **GET** `/api/products/:id`
- **描述**: 获取商品详情
- **参数**:
  - `id`: 商品ID

### 商家获取自己的商品
- **GET** `/api/products/my`
- **描述**: 商家获取自己的商品
- **认证**: JWT Token
- **参数**:
  - `page`: 页码
  - `limit`: 每页数量
  - `status`: 状态

### 创建商品
- **POST** `/api/products`
- **描述**: 商家创建商品
- **认证**: JWT Token (商家)
- **请求参数**:
  - `name`: 商品名称
  - `description`: 商品描述
  - `price`: 价格
  - `stock_quantity`: 库存数量
  - `image_url`: 图片URL

### 更新商品
- **PUT** `/api/products/:id`
- **描述**: 更新商品信息
- **认证**: JWT Token (商家/管理员)
- **参数**:
  - `id`: 商品ID

### 管理员获取所有商品
- **GET** `/api/products/admin`
- **描述**: 管理员获取所有商品（包括非active状态）
- **认证**: JWT Token (管理员)
- **参数**:
  - `page`: 页码
  - `limit`: 每页数量
  - `status`: 状态

## 购物车接口

### 获取购物车
- **GET** `/api/cart`
- **描述**: 获取当前用户的购物车
- **认证**: JWT Token (买家)

### 添加商品到购物车
- **POST** `/api/cart`
- **描述**: 添加商品到购物车
- **认证**: JWT Token (买家)
- **请求参数**:
  - `product_id`: 商品ID
  - `quantity`: 数量

### 更新购物车项
- **PUT** `/api/cart/:id`
- **描述**: 更新购物车中的商品数量
- **认证**: JWT Token (买家)
- **参数**:
  - `id`: 购物车项ID

### 删除购物车项
- **DELETE** `/api/cart/:id`
- **描述**: 从购物车中删除商品
- **认证**: JWT Token (买家)
- **参数**:
  - `id`: 购物车项ID

## 订单接口

### 创建订单
- **POST** `/api/orders`
- **描述**: 创建订单
- **认证**: JWT Token (买家)

### 获取当前用户订单
- **GET** `/api/orders`
- **描述**: 获取当前用户的订单列表
- **认证**: JWT Token (买家)

### 获取订单详情
- **GET** `/api/orders/:id`
- **描述**: 获取订单详情
- **认证**: JWT Token (买家)

### 管理员获取所有订单
- **GET** `/api/admin/orders`
- **描述**: 管理员获取所有订单
- **认证**: JWT Token (管理员)

### 管理员更新订单状态
- **PUT** `/api/admin/orders/:id/status`
- **描述**: 管理员更新订单状态
- **认证**: JWT Token (管理员)
- **参数**:
  - `id`: 订单ID
  - `status`: 新状态

## 管理员接口

### 获取系统统计
- **GET** `/api/admin/stats`
- **描述**: 获取系统统计信息
- **认证**: JWT Token (管理员)

### 下架违规商品
- **PUT** `/api/admin/products/:id/suspend`
- **描述**: 将商品设置为违规下架状态
- **认证**: JWT Token (管理员)
- **参数**:
  - `id`: 商品ID

### 恢复商品
- **PUT** `/api/admin/products/:id/restore`
- **描述**: 恢复被下架的商品
- **认证**: JWT Token (管理员)
- **参数**:
  - `id`: 商品ID

### 批准商品上架
- **PUT** `/api/admin/products/:id/approve`
- **描述**: 管理员批准商品上架
- **认证**: JWT Token (管理员)
- **参数**:
  - `id`: 商品ID

### 获取所有用户
- **GET** `/api/admin/users`
- **描述**: 获取所有用户信息
- **认证**: JWT Token (管理员)

### 删除用户
- **DELETE** `/api/admin/users/:id`
- **描述**: 删除用户
- **认证**: JWT Token (管理员)
- **参数**:
  - `id`: 用户ID