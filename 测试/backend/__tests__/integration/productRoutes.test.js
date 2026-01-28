const request = require('supertest');
const app = require('../../src/index');
const db = require('../../src/config/db');

// Mock the database query function for integration tests
jest.mock('../../src/config/db');

describe('Product Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    test('should return paginated active products', async () => {
      // 模拟数据库查询返回总数和产品列表
      const mockProducts = [
        {
          id: 1,
          name: 'Test Product 1',
          description: 'Test Description 1',
          price: '19.99',
          stock_quantity: 10,
          image_url: 'http://example.com/image1.jpg',
          seller_id: 1,
          seller_name: 'seller1',
          status: 'active',
          created_at: new Date()
        }
      ];
      
      db.query.mockResolvedValueOnce({ rows: [{ count: '1' }] }); // COUNT查询
      db.query.mockResolvedValueOnce({ rows: mockProducts }); // 实际查询

      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body).toEqual({
        products: expect.arrayContaining([
          expect.objectContaining({
            name: 'Test Product 1',
            description: 'Test Description 1',
            price: '19.99'
          })
        ]),
        pagination: expect.objectContaining({
          current_page: 1,
          total_items: 1
        })
      });
    });

    test('should return empty products list when no products exist', async () => {
      // 模拟数据库查询返回总数和空产品列表
      db.query.mockResolvedValueOnce({ rows: [{ count: '0' }] }); // COUNT查询
      db.query.mockResolvedValueOnce({ rows: [] }); // 实际查询

      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body).toEqual({
        products: [],
        pagination: expect.objectContaining({
          current_page: 1,
          total_items: 0
        })
      });
    });
  });

  describe('GET /api/products/:id', () => {
    test('should return a specific product', async () => {
      const mockProduct = {
        id: 1,
        name: 'Test Product',
        description: 'Test Description',
        price: '19.99',
        stock_quantity: 10,
        image_url: 'http://example.com/image.jpg',
        seller_id: 1,
        seller_name: 'seller1',
        status: 'active',
        created_at: new Date()
      };
      
      db.query.mockResolvedValueOnce({ rows: [mockProduct] });

      const response = await request(app)
        .get('/api/products/1')
        .expect(200);

      expect(response.body).toEqual({
        product: expect.objectContaining({
          name: 'Test Product',
          price: '19.99'
        })
      });
    });

    test('should return 404 for non-existent product', async () => {
      // 模拟数据库查询返回空结果
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/products/999')
        .expect(404);

      expect(response.body).toEqual({ message: '商品未找到或已下架' });
    });
  });

  describe('POST /api/products (seller only)', () => {
    test('should create a new product for seller', async () => {
      // 模拟卖家token
      const jwt = require('jsonwebtoken');
      const sellerToken = jwt.sign(
        { userId: 1, username: 'seller', role: 'seller' },
        process.env.JWT_SECRET || 'test_secret_for_integration_testing'
      );

      // 模拟插入新产品
      const newProduct = {
        id: 1,
        name: 'New Product',
        description: 'New Product Description',
        price: '29.99',
        stock_quantity: 5,
        image_url: 'http://example.com/new_image.jpg',
        seller_id: 1,
        status: 'inactive', // 新商品默认为下架状态
        created_at: new Date()
      };
      db.query.mockResolvedValueOnce({ rows: [newProduct] });

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          name: 'New Product',
          description: 'New Product Description',
          price: 29.99,
          stock_quantity: 5
        })
        .expect(201);

      expect(response.body).toEqual({
        message: '商品创建成功',
        product: expect.objectContaining({
          name: 'New Product',
          description: 'New Product Description',
          price: '29.99',
          status: 'inactive' // 验证默认状态
        })
      });
    });

    test('should return 403 for non-seller user', async () => {
      // 模拟普通用户token
      const jwt = require('jsonwebtoken');
      const userToken = jwt.sign(
        { userId: 2, username: 'user', role: 'buyer' },
        process.env.JWT_SECRET || 'test_secret_for_integration_testing'
      );

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'New Product',
          description: 'New Product Description',
          price: 29.99,
          stock_quantity: 5
        })
        .expect(403);

      expect(response.body).toEqual({
        message: '权限不足'
      });
    });
  });
});