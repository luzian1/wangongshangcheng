const request = require('supertest');
const app = require('../../src/index');
const db = require('../../src/config/db');
const bcrypt = require('bcryptjs');

// Mock the database query function for system tests
jest.mock('../../src/config/db');

describe('Basic System Tests', () => {
  let buyerToken, sellerToken;
  let productId;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should register and login user successfully', async () => {
    // 1. 用户注册
    db.query.mockResolvedValueOnce({ rows: [] }); // 检查用户是否存在 - 返回空（不存在）
    db.query.mockResolvedValueOnce({ 
      rows: [{
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'buyer',
        created_at: new Date()
      }] 
    }); // 创建新用户

    let response = await request(app)
      .post('/api/users/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      })
      .expect(201);

    expect(response.body.message).toBe('用户注册成功');
    expect(response.body.user.username).toBe('testuser');

    // 2. 用户登录
    db.query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        role: 'buyer'
      }]
    });

    response = await request(app)
      .post('/api/users/login')
      .send({
        username: 'testuser',
        password: 'password123'
      })
      .expect(200);

    expect(response.body.message).toBe('登录成功');
    buyerToken = response.body.token;
    expect(buyerToken).toBeDefined();

    // 3. 获取用户资料
    db.query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'buyer',
        created_at: new Date()
      }]
    });

    response = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);

    expect(response.body.user).toBeDefined();
    expect(response.body.user.username).toBe('testuser');
  });

  test('should allow seller to create product', async () => {
    // 1. 商家注册
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

    let response = await request(app)
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

    // 2. 商家登录
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

    // 3. 商家创建商品
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
  });

  test('should allow buyer to add product to cart', async () => {
    // 1. 买家登录
    db.query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        username: 'testbuyer',
        email: 'buyer@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        role: 'buyer'
      }]
    });

    let response = await request(app)
      .post('/api/users/login')
      .send({
        username: 'testbuyer',
        password: 'password123'
      })
      .expect(200);

    const buyerToken = response.body.token;
    expect(buyerToken).toBeDefined();

    // 2. 检查购物车中是否已存在商品
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
        productId: 1, // 使用正确的参数名
        quantity: 2
      })
      .expect(201); // 正确的状态码是201

    expect(response.body.message).toBe('成功添加到购物车'); // 正确的消息

    // 3. 买家查看购物车
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
  });
});