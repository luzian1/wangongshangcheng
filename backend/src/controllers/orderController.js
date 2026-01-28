const db = require('../config/db');

// 创建订单
const createOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // 获取用户购物车中的商品
    const cartItems = await db.query(`
      SELECT 
        c.product_id,
        c.quantity,
        p.name,
        p.price,
        p.stock_quantity
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
    `, [userId]);
    
    if (cartItems.rows.length === 0) {
      return res.status(400).json({ message: '购物车为空，无法创建订单' });
    }
    
    // 检查库存并计算总价
    let totalAmount = 0;
    for (const item of cartItems.rows) {
      if (item.stock_quantity < item.quantity) {
        return res.status(400).json({ message: `商品 "${item.name}" 库存不足` });
      }
      totalAmount += item.price * item.quantity;
    }
    
    // 开始事务
    await db.query('BEGIN');
    
    // 创建订单
    const orderResult = await db.query(
      'INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING id',
      [userId, totalAmount, 'pending']
    );
    
    const orderId = orderResult.rows[0].id;
    
    // 创建订单详情并减少库存
    for (const item of cartItems.rows) {
      // 创建订单详情
      await db.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES ($1, $2, $3, $4)',
        [orderId, item.product_id, item.quantity, item.price]
      );
      
      // 减少库存
      await db.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }
    
    // 清空购物车
    await db.query('DELETE FROM cart WHERE user_id = $1', [userId]);
    
    // 提交事务
    await db.query('COMMIT');
    
    // 获取完整订单信息
    const orderDetails = await db.query(
      `SELECT 
        o.id,
        o.total_amount,
        o.status,
        o.created_at,
        json_agg(
          json_build_object(
            'product_id', oi.product_id,
            'quantity', oi.quantity,
            'price', oi.price_at_time,
            'product_name', p.name
          )
        ) as items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.id = $1
      GROUP BY o.id`,
      [orderId]
    );
    
    res.status(201).json({
      message: '订单创建成功',
      order: orderDetails.rows[0]
    });
  } catch (error) {
    // 回滚事务
    await db.query('ROLLBACK');
    console.error('创建订单错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取用户订单列表
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // 获取总数
    const countResult = await db.query(
      'SELECT COUNT(*) FROM orders WHERE user_id = $1',
      [userId]
    );
    const total = parseInt(countResult.rows[0].count);
    
    // 获取订单列表
    const orders = await db.query(
      `SELECT 
        o.id,
        o.total_amount,
        o.status,
        o.created_at,
        json_agg(
          json_build_object(
            'product_id', oi.product_id,
            'quantity', oi.quantity,
            'price', oi.price_at_time,
            'product_name', p.name
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), offset]
    );
    
    res.json({
      orders: orders.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取用户订单错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取订单详情
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const order = await db.query(
      `SELECT 
        o.id,
        o.total_amount,
        o.status,
        o.created_at,
        o.updated_at,
        json_agg(
          json_build_object(
            'product_id', oi.product_id,
            'quantity', oi.quantity,
            'price', oi.price_at_time,
            'product_name', p.name,
            'product_description', p.description
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = $1 AND o.user_id = $2
      GROUP BY o.id`,
      [id, userId]
    );
    
    if (order.rows.length === 0) {
      return res.status(404).json({ message: '订单不存在' });
    }
    
    res.json({ order: order.rows[0] });
  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取所有订单（管理员）
const getAllOrders = async (req, res) => {
  try {
    // 检查用户是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '权限不足，只有管理员可以执行此操作' });
    }

    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // 获取总数
    const countResult = await db.query('SELECT COUNT(*) FROM orders');
    const total = parseInt(countResult.rows[0].count);

    // 获取订单列表，包含用户信息
    const orders = await db.query(
      `SELECT
        o.id,
        o.user_id,
        o.total_amount,
        o.status,
        o.created_at,
        o.updated_at,
        u.username as username,
        COALESCE(
          json_agg(
            json_build_object(
              'product_id', oi.product_id,
              'quantity', oi.quantity,
              'price', oi.price_at_time,
              'product_name', p.name
            )
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'::json
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN users u ON o.user_id = u.id
      GROUP BY o.id, u.username, u.id
      ORDER BY o.created_at DESC
      LIMIT $1 OFFSET $2`,
      [parseInt(limit), offset]
    );

    res.json({
      orders: orders.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取所有订单错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 支付订单（买家）
const payOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    console.log(`支付请求 - 订单ID: ${id}, 用户ID: ${userId}`);

    // 首先验证订单是否属于当前用户且状态为待支付
    const orderResult = await db.query(
      'SELECT id, user_id, status, total_amount FROM orders WHERE id = $1 AND user_id = $2 AND status = $3',
      [id, userId, 'pending']
    );

    console.log(`查询结果数量: ${orderResult.rows.length}`);

    if (orderResult.rows.length === 0) {
      // 检查订单是否存在但不属于当前用户或状态不是待支付
      const checkOrderResult = await db.query(
        'SELECT id, user_id, status FROM orders WHERE id = $1',
        [id]
      );

      console.log(`检查订单结果数量: ${checkOrderResult.rows.length}`);

      if (checkOrderResult.rows.length === 0) {
        console.log(`订单不存在: ${id}`);
        return res.status(404).json({ message: '订单不存在' });
      }

      const order = checkOrderResult.rows[0];
      console.log(`订单用户ID: ${order.user_id}, 当前用户ID: ${userId}, 订单状态: ${order.status}`);

      if (order.user_id !== userId) {
        console.log(`权限不足 - 订单属于其他用户`);
        return res.status(403).json({ message: '无权访问此订单' });
      }

      console.log(`订单状态不允许支付 - 当前状态: ${order.status}`);
      return res.status(400).json({ message: '订单状态不允许支付' });
    }

    console.log(`找到待支付订单，准备更新状态`);

    // 更新订单状态为已支付
    const result = await db.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      ['paid', id]
    );

    console.log(`更新结果数量: ${result.rows.length}`);

    if (result.rows.length === 0) {
      // 这种情况理论上不应该发生，但为了安全起见进行检查
      console.log(`订单状态更新失败`);
      return res.status(500).json({ message: '订单状态更新失败' });
    }

    console.log(`订单支付成功，订单ID: ${result.rows[0].id}`);
    res.json({
      message: '订单支付成功',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('支付订单错误:', error);
    res.status(500).json({ message: '服务器错误: ' + error.message });
  }
};

// 获取卖家的订单
const getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.user.userId;

    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // 获取与卖家商品相关的订单总数
    const countResult = await db.query(`
      SELECT COUNT(DISTINCT o.id) as count
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE p.seller_id = $1
    `, [sellerId]);

    const total = parseInt(countResult.rows[0].count);

    // 获取与卖家商品相关的订单列表
    const orders = await db.query(`
      SELECT
        o.id,
        o.user_id,
        o.total_amount,
        o.status,
        o.created_at,
        o.updated_at,
        u.username as user_name,
        COALESCE(
          json_agg(
            json_build_object(
              'product_id', oi.product_id,
              'quantity', oi.quantity,
              'price', oi.price_at_time,
              'product_name', p.name
            )
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'::json
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE p.seller_id = $1
      GROUP BY o.id, u.username, u.id
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
    `, [sellerId, parseInt(limit), offset]);

    res.json({
      orders: orders.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取卖家订单错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 更新订单状态（管理员）
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 检查用户是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '权限不足，只有管理员可以执行此操作' });
    }

    // 验证状态值
    const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: '无效的订单状态' });
    }

    const result = await db.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '订单不存在' });
    }

    res.json({
      message: '订单状态更新成功',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('更新订单状态错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  payOrder,
  updateOrderStatus,
  getSellerOrders
};