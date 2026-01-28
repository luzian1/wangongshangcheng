const request = require('supertest');
const app = require('../../src/index');
const db = require('../../src/config/db');
const bcrypt = require('bcryptjs');

// Mock the database query function for system tests
jest.mock('../../src/config/db');

describe('User Flow System Tests', () => {
  let buyerToken, sellerToken, adminToken;
  let productId;
  let orderId;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 简化的购物流程测试
  test('should complete a basic purchase flow', async () => {
    // 1. 买家注册
    db.query.mockResolvedValueOnce({ rows: [] }); // 检查用户是否存在 - 返回空（不存在）
    db.query.mockResolvedValueOnce({ 
      rows: [{
        id: 1,
        username: 'testbuyer',
        email: 'buyer@example.com',
        role: 'buyer',
        created_at: new Date()
      }] 
    }); // 创建新用户

    let response = await request(app)
      .post('/api/users/register')
      .send({
        username: 'testbuyer',
        email: 'buyer@example.com',
        password: 'password123'
      })
      .expect(201);

    expect(response.body.message).toBe('用户注册成功');
    expect(response.body.user.username).toBe('testbuyer');

    // 2. 买家登录并获取token
    db.query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        username: 'testbuyer',
        email: 'buyer@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        role: 'buyer'
      }]
    });

    response = await request(app)
      .post('/api/users/login')
      .send({
        username: 'testbuyer',
        password: 'password123'
      })
      .expect(200);

    expect(response.body.message).toBe('登录成功');
    buyerToken = response.body.token;
    expect(buyerToken).toBeDefined();

    // 3. 商家注册
    db.query.mockResolvedValueOnce({ rows: [] }); // 检查用户是否存在 - 返回空（不存在）
    db.query.mockResolvedValueOnce({ 
      rows: [{
        id: 2,
        username: 'testseller',
        email: 'seller@example.com',
        role: 'seller',
        created_at: new Date()
      }] 
    }); // 创建新用户

    response = await request(app)
      .post('/api/users/register')
      .send({
        username: 'testseller',
        email: 'seller@example.com',
        password: 'password123',
        role: 'seller'
      })
      .expect(201);

    expect(response.body.message).toBe('用户注册成功');
    expect(response.body.user.username).toBe('testseller');

    // 4. 商家登录并获取token
    db.query.mockResolvedValueOnce({
      rows: [{
        id: 2,
        username: 'testseller',
        email: 'seller@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        role: 'seller'
      }]
    });

    response = await request(app)
      .post('/api/users/login')
      .send({
        username: 'testseller',
        password: 'password123'
      })
      .expect(200);

    expect(response.body.message).toBe('登录成功');
    sellerToken = response.body.token;
    expect(sellerToken).toBeDefined();

    // 5. 商家创建商品
    db.query.mockResolvedValueOnce({ 
      rows: [{
        id: 1,
        name: 'Test Product',
        description: 'Test Product Description',
        price: '29.99',
        stock_quantity: 10,
        seller_id: 2,
        status: 'inactive', // 新商品默认为下架状态
        created_at: new Date()
      }] 
    });

    response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        name: 'Test Product',
        description: 'Test Product Description',
        price: 29.99,
        stock_quantity: 10
      })
      .expect(201);

    expect(response.body.message).toBe('商品创建成功');
    productId = response.body.product.id;
    expect(productId).toBeDefined();
    expect(response.body.product.status).toBe('inactive'); // 验证默认状态

    // 6. 管理员批准商品上架
    // 模拟管理员token
    const jwt = require('jsonwebtoken');
    adminToken = jwt.sign(
      { userId: 3, username: 'admin', role: 'admin' },
      process.env.JWT_SECRET || 'test_secret_for_integration_testing'
    );

    // 模拟查询商品存在
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, status: 'inactive' }] });
    // 模拟更新商品状态
    db.query.mockResolvedValueOnce({ 
      rows: [{
        id: 1,
        name: 'Test Product',
        status: 'active'
      }] 
    });

    response = await request(app)
      .put(`/api/admin/products/${productId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.message).toBe('商品已批准上架');

    // 7. 买家将商品添加到购物车 - 使用正确的API参数
    // 检查购物车中是否已存在商品
    db.query.mockResolvedValueOnce({ rows: [] });
    // 添加到购物车
    db.query.mockResolvedValueOnce({ 
      rows: [{
        id: 1,
        user_id: 1,
        product_id: 1,
        quantity: 2
      }] 
    });

    response = await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        productId: productId, // 注意：参数名应该是productId，而不是product_id
        quantity: 2
      })
      .expect(201); // 正确的状态码是201

    expect(response.body.message).toBe('成功添加到购物车'); // 正确的消息

    // 8. 买家查看购物车
    db.query.mockResolvedValueOnce({ 
      rows: [{
        cart_id: 1,
        product_id: 1,
        name: 'Test Product',
        price: 29.99,
        stock_quantity: 10,
        quantity: 2,
        created_at: new Date()
      }] 
    });

    response = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);

    expect(response.body.cart).toBeDefined();
    expect(response.body.cart.items).toBeDefined();
    expect(response.body.cart.items.length).toBeGreaterThan(0);

    // 9. 买家下单
    // 查询购物车
    db.query.mockResolvedValueOnce({ 
      rows: [{
        product_id: 1,
        quantity: 2,
        name: 'Test Product',
        price: 29.99,
        stock_quantity: 10
      }] 
    });
    // 检查商品库存
    db.query.mockResolvedValueOnce({ 
      rows: [{ stock_quantity: 10 }] 
    });
    // 插入订单
    db.query.mockResolvedValueOnce({ 
      rows: [{ id: 1 }] 
    });
    // 插入订单项
    db.query.mockResolvedValueOnce({ rows: [] });
    // 更新商品库存
    db.query.mockResolvedValueOnce({ rows: [] });
    // 清空购物车
    db.query.mockResolvedValueOnce({ rows: [] });
    // 查询完整订单信息
    db.query.mockResolvedValueOnce({ 
      rows: [{
        id: 1,
        total_amount: '59.98',
        status: 'pending',
        created_at: new Date(),
        items: []
      }] 
    });

    response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(201);

    expect(response.body.message).toBe('订单创建成功');
    orderId = response.body.order.id;
    expect(orderId).toBeDefined();

    // 10. 买家查看订单
    db.query.mockResolvedValueOnce({ 
      rows: [{
        id: 1,
        total_amount: '59.98',
        status: 'pending',
        created_at: new Date(),
        items: []
      }] 
    });
    db.query.mockResolvedValueOnce({ rows: [{ count: '1' }] }); // COUNT查询

    response = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);

    expect(response.body.orders).toBeDefined();
    expect(response.body.orders.length).toBeGreaterThan(0);
  });

  // 测试管理员管理功能
  test('should allow admin to manage users', async () => {
    // 模拟管理员token
    const jwt = require('jsonwebtoken');
    adminToken = jwt.sign(
      { userId: 1, username: 'admin', role: 'admin' },
      process.env.JWT_SECRET || 'test_secret_for_integration_testing'
    );

    // 测试管理员获取所有用户
    db.query.mockResolvedValueOnce({ 
      rows: [
        { id: 1, username: 'admin', email: 'admin@example.com', role: 'admin', created_at: new Date() },
        { id: 2, username: 'user', email: 'user@example.com', role: 'buyer', created_at: new Date() }
      ] 
    });

    let response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.users).toBeDefined();
    expect(response.body.users.length).toBeGreaterThan(0);
    expect(response.body.users[0]).toHaveProperty('username');
  });
});