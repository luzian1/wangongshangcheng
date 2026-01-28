const db = require('../config/db');

// 获取所有商品（买家/管理员）
const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let statusFilter = 'active'; // 默认只返回上架商品
    let countQuery = 'SELECT COUNT(*) FROM products WHERE status = $1';
    let selectQuery = 'SELECT p.*, u.username as seller_name FROM products p LEFT JOIN users u ON p.seller_id = u.id WHERE p.status = $1 ORDER BY p.created_at DESC LIMIT $2 OFFSET $3';
    let queryParams = [statusFilter, parseInt(limit), offset];

    // 管理员可以查看所有状态的商品
    if (req.user?.role === 'admin') {
      if (status) {
        // 如果管理员指定了特定状态
        countQuery = 'SELECT COUNT(*) FROM products WHERE status = $1';
        selectQuery = 'SELECT p.*, u.username as seller_name FROM products p LEFT JOIN users u ON p.seller_id = u.id WHERE p.status = $1 ORDER BY p.created_at DESC LIMIT $2 OFFSET $3';
        queryParams = [status, parseInt(limit), offset];
      } else {
        // 如果没有指定状态，管理员可以看到所有状态的商品
        countQuery = 'SELECT COUNT(*) FROM products';
        selectQuery = 'SELECT p.*, u.username as seller_name FROM products p LEFT JOIN users u ON p.seller_id = u.id ORDER BY p.created_at DESC LIMIT $1 OFFSET $2';
        queryParams = [parseInt(limit), offset];
      }
    } else if (status && status !== 'active') {
      // 非管理员不能查看非active状态的商品
      return res.status(403).json({ message: '权限不足，只能查看上架商品' });
    }

    // 获取总数
    const countResult = await db.query(countQuery, queryParams.slice(0, 1));
    const total = parseInt(countResult.rows[0].count);

    // 获取分页数据
    const products = await db.query(selectQuery, queryParams);

    res.json({
      products: products.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取商品列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取当前用户（商家）的所有商品
const getSellerProducts = async (req, res) => {
  try {
    const sellerId = req.user.userId;

    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * parseInt(limit);

    let query = 'SELECT p.*, u.username as seller_name FROM products p LEFT JOIN users u ON p.seller_id = u.id WHERE p.seller_id = $1';
    let countQuery = 'SELECT COUNT(*) FROM products WHERE seller_id = $1';
    const queryParams = [sellerId];
    const countParams = [sellerId];
    let paramIndex = 2;

    // 如果指定了状态过滤
    if (status) {
      query += ` AND p.status = $${paramIndex}`;
      countQuery += ` AND status = $${paramIndex}`;
      queryParams.push(status);
      countParams.push(status);
      paramIndex++;
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    // 获取总数
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // 获取商品列表
    const products = await db.query(query, queryParams);

    res.json({
      products: products.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取商家商品列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 根据ID获取商品详情
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await db.query(
      'SELECT p.*, u.username as seller_name FROM products p LEFT JOIN users u ON p.seller_id = u.id WHERE p.id = $1 AND p.status = $2',
      [id, 'active']
    );

    if (product.rows.length === 0) {
      return res.status(404).json({ message: '商品未找到或已下架' });
    }

    res.json({ product: product.rows[0] });
  } catch (error) {
    console.error('获取商品详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 搜索商品
const searchProducts = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({ message: '搜索关键词不能为空' });
    }

    // 获取总数
    const countResult = await db.query(
      'SELECT COUNT(*) FROM products WHERE status = $1 AND (name ILIKE $2 OR description ILIKE $2)',
      ['active', `%${q}%`]
    );
    const total = parseInt(countResult.rows[0].count);

    // 执行搜索
    const products = await db.query(
      'SELECT p.*, u.username as seller_name FROM products p LEFT JOIN users u ON p.seller_id = u.id WHERE p.status = $1 AND (p.name ILIKE $2 OR p.description ILIKE $2) ORDER BY p.created_at DESC LIMIT $3 OFFSET $4',
      ['active', `%${q}%`, parseInt(limit), offset]
    );

    if (products.rows.length === 0) {
      return res.json({
        products: [],
        pagination: {
          current_page: parseInt(page),
          total_pages: 0,
          total_items: 0,
          items_per_page: parseInt(limit)
        },
        message: '未找到相关商品'
      });
    }

    res.json({
      products: products.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('搜索商品错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 创建商品（商家）
const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock_quantity, image_url } = req.body;
    const sellerId = req.user.userId; // 从token获取

    // 验证必要字段
    if (!name || !price || typeof stock_quantity === 'undefined') {
      return res.status(400).json({ message: '商品名称、价格和库存为必填项' });
    }

    const result = await db.query(
      'INSERT INTO products (name, description, price, stock_quantity, image_url, seller_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, description, price, stock_quantity, image_url, sellerId, 'inactive'] // 新商品默认为下架状态
    );

    res.status(201).json({
      message: '商品创建成功',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('创建商品错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 更新商品（商家）
const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const {
      name,
      description,
      price,
      stock_quantity: stock,
      image_url,
      status
    } = req.body;

    const userId = req.user?.userId;
    const role = req.user?.role;

    // 先查商品和权限
    let productRes;
    if (role === 'admin') {
      productRes = await db.query(
        'SELECT name, description, price, stock_quantity, image_url, status, seller_id FROM products WHERE id = $1',
        [productId]
      );
    } else {
      productRes = await db.query(
        'SELECT name, description, price, stock_quantity, image_url, status FROM products WHERE id = $1 AND seller_id = $2',
        [productId, userId]
      );
    }

    if (productRes.rowCount === 0) {
      return res.status(403).json({ message: '没有修改该商品的权限' });
    }

    const current = productRes.rows[0];

    // 构建固定8个参数，始终包含所有字段：name, description, price, stock_quantity, image_url, status, updated_at, id
    const params = [
      name !== undefined && name !== '' ? name : current.name,
      description !== undefined ? description : current.description,
      price !== undefined ? price : current.price,
      stock !== undefined ? stock : current.stock_quantity,
      image_url !== undefined ? image_url : current.image_url,
      // 只有管理员能改status，商家保持原值
      (status !== undefined && role === 'admin') ? status : current.status,
      new Date(), // updated_at
      productId // id
    ];

    // 使用固定的8参数SQL查询
    const sql = `
      UPDATE products
      SET name = $1, description = $2, price = $3, stock_quantity = $4,
          image_url = $5, status = $6, updated_at = $7
      WHERE id = $8
      RETURNING *
    `;

    const result = await db.query(sql, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: '商品不存在' });
    }

    res.json({
      message: '商品更新成功',
      product: result.rows[0]
    });

  } catch (err) {
    console.error('更新商品错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 下架商品（管理员 - 处理违规商品）
const suspendProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查用户是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '权限不足，只有管理员可以执行此操作' });
    }

    // 获取商品信息以验证商品存在
    const productResult = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: '商品不存在' });
    }

    // 更新商品状态为suspended（违规下架）
    const result = await db.query(
      'UPDATE products SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      ['suspended', id]
    );

    res.json({
      message: '商品已因违规下架',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('下架违规商品错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 恢复商品（管理员 - 恢复误下架的商品）
const restoreProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查用户是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '权限不足，只有管理员可以执行此操作' });
    }

    // 获取商品信息以验证商品存在
    const productResult = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: '商品不存在' });
    }

    // 更新商品状态为inactive（等待商家上架）
    const result = await db.query(
      'UPDATE products SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      ['inactive', id]
    );

    res.json({
      message: '商品已恢复',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('恢复商品错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取系统统计信息（管理员）
const getSystemStats = async (req, res) => {
  try {
    // 检查用户是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '权限不足，只有管理员可以查看系统统计信息' });
    }

    // 获取订单总数
    const totalOrdersResult = await db.query('SELECT COUNT(*) FROM orders');
    const totalOrders = parseInt(totalOrdersResult.rows[0].count);

    // 获取用户总数
    const totalUsersResult = await db.query('SELECT COUNT(*) FROM users');
    const totalUsers = parseInt(totalUsersResult.rows[0].count);

    // 获取商品总数
    const totalProductsResult = await db.query('SELECT COUNT(*) FROM products');
    const totalProducts = parseInt(totalProductsResult.rows[0].count);

    // 获取今日收入
    const todayRevenueResult = await db.query(`
      SELECT COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE DATE(created_at) = CURRENT_DATE
    `);
    const todayRevenue = parseFloat(todayRevenueResult.rows[0].revenue);

    // 获取用户角色统计
    const userRoleStatsResult = await db.query(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `);

    // 获取最近订单
    const recentOrdersResult = await db.query(`
      SELECT id, total_amount, status, created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // 获取商品状态统计
    const productStatusStatsResult = await db.query(`
      SELECT status, COUNT(*) as count
      FROM products
      GROUP BY status
    `);

    res.json({
      stats: {
        total_orders: totalOrders,
        total_users: totalUsers,
        total_products: totalProducts,
        today_revenue: todayRevenue
      },
      user_role_stats: userRoleStatsResult.rows,
      product_status_stats: productStatusStatsResult.rows,
      recent_orders: recentOrdersResult.rows
    });
  } catch (error) {
    console.error('获取系统统计信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 管理员获取所有商品（包括所有状态）
const getAllProductsForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * parseInt(limit);

    let countQuery = 'SELECT COUNT(*) FROM products';
    let selectQuery = 'SELECT p.*, u.username as seller_name FROM products p LEFT JOIN users u ON p.seller_id = u.id';
    let queryParams = [];
    let countParams = [];

    // 如果指定了状态过滤
    if (status) {
      countQuery += ' WHERE status = $1';
      selectQuery += ' WHERE p.status = $1';
      queryParams.push(status);
      countParams.push(status);
    }

    // 计算参数数量以确定LIMIT和OFFSET的参数索引
    const baseParamCount = status ? 1 : 0;
    selectQuery += ' ORDER BY p.created_at DESC LIMIT $' + (baseParamCount + 1) + ' OFFSET $' + (baseParamCount + 2);
    queryParams.push(parseInt(limit), parseInt(offset));

    // 获取总数
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // 获取分页数据
    const products = await db.query(selectQuery, queryParams);

    res.json({
      products: products.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('管理员获取商品列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取商家销售统计数据
const getSellerStats = async (req, res) => {
  try {
    const sellerId = req.user.userId; // 从token获取

    // 获取商品总数
    const totalProductsResult = await db.query(
      'SELECT COUNT(*) FROM products WHERE seller_id = $1',
      [sellerId]
    );
    const totalProducts = parseInt(totalProductsResult.rows[0].count);

    // 获取上架商品数
    const activeProductsResult = await db.query(
      'SELECT COUNT(*) FROM products WHERE seller_id = $1 AND status = $2',
      [sellerId, 'active']
    );
    const activeProducts = parseInt(activeProductsResult.rows[0].count);

    // 获取销售统计数据
    console.log(`正在查询商家ID ${sellerId} 的销售统计信息`);
    const salesStatsResult = await db.query(`
      SELECT
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(oi.quantity * oi.price_at_time), 0) as total_revenue,
        COALESCE(AVG(oi.quantity * oi.price_at_time), 0) as average_order_value
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE p.seller_id = $1 AND (o.status = $2 OR o.status = $3 OR o.status = $4)
    `, [sellerId, 'paid', 'shipped', 'delivered']);
    console.log(`销售统计查询结果:`, salesStatsResult.rows);

    // 确保结果存在
    const salesStats = salesStatsResult.rows[0] || { total_orders: 0, total_revenue: 0, average_order_value: 0 };

    res.json({
      stats: {
        total_products: totalProducts,
        active_products: activeProducts,
        total_orders: parseInt(salesStats.total_orders),
        total_revenue: parseFloat(salesStats.total_revenue),
        average_order_value: parseFloat(salesStats.average_order_value)
      }
    });
  } catch (error) {
    console.error('获取商家统计信息错误:', error);
    console.error('错误详情:', error.message, error.stack);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 管理员批准商品上架
const approveProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查用户是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '权限不足，只有管理员可以执行此操作' });
    }

    // 获取商品信息以验证商品存在
    const productResult = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: '商品不存在' });
    }

    // 检查商品当前状态，只有inactive状态的商品可以被批准上架
    if (productResult.rows[0].status !== 'inactive') {
      return res.status(400).json({ message: '只有待上架的商品可以被批准' });
    }

    // 更新商品状态为active（批准上架）
    const result = await db.query(
      'UPDATE products SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      ['active', id]
    );

    res.json({
      message: '商品已批准上架',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('批准商品上架错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取热门商品（基于销量）
const getPopularProducts = async (req, res) => {
  try {
    const { limit = 4 } = req.query;

    // 获取销量最高的商品
    const popularProductsResult = await db.query(`
      SELECT
        p.*,
        u.username as seller_name,
        COALESCE(SUM(oi.quantity), 0) as total_sold
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('paid', 'shipped', 'delivered')
      LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.status = 'active'
      GROUP BY p.id, u.username
      ORDER BY total_sold DESC, p.created_at DESC
      LIMIT $1
    `, [parseInt(limit)]);

    res.json({
      products: popularProductsResult.rows
    });
  } catch (error) {
    console.error('获取热门商品错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取商家收入统计
const getSellerRevenueStats = async (req, res) => {
  try {
    // 检查用户是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '权限不足，只有管理员可以执行此操作' });
    }

    // 获取所有商家的收入统计
    const revenueStatsResult = await db.query(`
      SELECT
        u.id as seller_id,
        u.username as seller_name,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(oi.quantity * oi.price_at_time), 0) as total_revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN users u ON p.seller_id = u.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('paid', 'shipped', 'delivered')
      GROUP BY u.id, u.username
      ORDER BY total_revenue DESC
    `);

    res.json({
      revenue_stats: revenueStatsResult.rows
    });
  } catch (error) {
    console.error('获取商家收入统计错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
  getAllProducts,
  getSellerProducts,
  getAllProductsForAdmin,
  getProductById,
  searchProducts,
  createProduct,
  updateProduct,
  suspendProduct,
  restoreProduct,
  getSystemStats,
  getSellerStats,
  approveProduct,
  getPopularProducts,
  getSellerRevenueStats
};