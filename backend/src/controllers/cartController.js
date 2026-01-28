const db = require('../config/db');

// 获取购物车
const getCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const cartItems = await db.query(`
      SELECT 
        c.id as cart_id,
        c.quantity,
        c.created_at,
        c.updated_at,
        p.id as product_id,
        p.name,
        p.price,
        p.stock_quantity,
        p.image_url,
        p.description
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
    `, [userId]);
    
    // 计算总价
    const total = cartItems.rows.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    res.json({
      cart: {
        items: cartItems.rows,
        total_amount: parseFloat(total.toFixed(2)),
        item_count: cartItems.rows.length
      }
    });
  } catch (error) {
    console.error('获取购物车错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 添加到购物车
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user.userId;
    
    if (!productId || quantity <= 0) {
      return res.status(400).json({ message: '商品ID和数量为必填项，且数量必须大于0' });
    }
    
    // 检查商品是否存在且有库存
    const product = await db.query(
      'SELECT id, name, price, stock_quantity FROM products WHERE id = $1 AND status = $2',
      [productId, 'active']
    );
    
    if (product.rows.length === 0) {
      return res.status(404).json({ message: '商品不存在或已下架' });
    }
    
    if (product.rows[0].stock_quantity < quantity) {
      return res.status(400).json({ message: '库存不足' });
    }
    
    // 检查购物车中是否已有该商品
    const existingCartItem = await db.query(
      'SELECT * FROM cart WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );
    
    let result;
    if (existingCartItem.rows.length > 0) {
      // 如果已存在，则更新数量
      const newQuantity = existingCartItem.rows[0].quantity + quantity;
      
      if (product.rows[0].stock_quantity < newQuantity) {
        return res.status(400).json({ message: '添加后数量超过库存' });
      }
      
      result = await db.query(
        'UPDATE cart SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND product_id = $3 RETURNING *',
        [newQuantity, userId, productId]
      );
    } else {
      // 如果不存在，则创建新记录
      result = await db.query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
        [userId, productId, quantity]
      );
    }
    
    res.status(201).json({
      message: '成功添加到购物车',
      cart_item: result.rows[0]
    });
  } catch (error) {
    console.error('添加到购物车错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 更新购物车项目
const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.userId;
    
    if (quantity <= 0) {
      return res.status(400).json({ message: '数量必须大于0' });
    }
    
    // 检查商品库存
    const product = await db.query(
      'SELECT id, stock_quantity FROM products WHERE id = $1 AND status = $2',
      [productId, 'active']
    );
    
    if (product.rows.length === 0) {
      return res.status(404).json({ message: '商品不存在或已下架' });
    }
    
    if (product.rows[0].stock_quantity < quantity) {
      return res.status(400).json({ message: '库存不足' });
    }
    
    // 更新购物车
    const result = await db.query(
      'UPDATE cart SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND product_id = $3 RETURNING *',
      [quantity, userId, productId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: '购物车中没有该商品' });
    }
    
    res.json({
      message: '购物车项目更新成功',
      cart_item: result.rows[0]
    });
  } catch (error) {
    console.error('更新购物车项目错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 从购物车移除项目
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.userId;
    
    const result = await db.query(
      'DELETE FROM cart WHERE user_id = $1 AND product_id = $2 RETURNING *',
      [userId, productId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: '购物车中没有该商品' });
    }
    
    res.json({ message: '成功从购物车移除商品' });
  } catch (error) {
    console.error('移除购物车项目错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart
};