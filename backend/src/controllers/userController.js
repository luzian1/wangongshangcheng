const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = process.env;

// 注册
const register = async (req, res) => {
  try {
    const { username, email, password, role = 'buyer' } = req.body;

    // 检查用户是否已存在
    const existingUser = await db.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: '用户名或邮箱已存在' });
    }

    // 密码加密
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 创建新用户
    const newUser = await db.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, created_at',
      [username, email, passwordHash, role]
    );

    res.status(201).json({
      message: '用户注册成功',
      user: newUser.rows[0]
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 登录
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 查找用户
    const userResult = await db.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const user = userResult.rows[0];

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取用户资料
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // 从token中间件获取

    const userResult = await db.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({ user: userResult.rows[0] });
  } catch (error) {
    console.error('获取用户资料错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取所有用户（管理员）
const getAllUsers = async (req, res) => {
  try {
    // 检查用户是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '权限不足，只有管理员可以执行此操作' });
    }

    const result = await db.query(
      'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({
      users: result.rows
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 删除用户（管理员）
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查用户是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '权限不足，只有管理员可以执行此操作' });
    }

    // 不允许删除管理员账户
    const user = await db.query('SELECT role FROM users WHERE id = $1', [id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    if (user.rows[0].role === 'admin') {
      return res.status(400).json({ message: '不能删除管理员账户' });
    }

    // 检查用户是否有相关订单
    const ordersResult = await db.query('SELECT COUNT(*) FROM orders WHERE user_id = $1', [id]);
    const orderCount = parseInt(ordersResult.rows[0].count);

    if (orderCount > 0) {
      // 如果用户有订单，先删除相关订单和订单项
      await db.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = $1)', [id]);
      await db.query('DELETE FROM orders WHERE user_id = $1', [id]);
    }

    // 检查用户是否有购物车项
    await db.query('DELETE FROM cart WHERE user_id = $1', [id]);

    // 检查用户是否是商家，如果是，需要处理其商品
    if (user.rows[0].role === 'seller') {
      // 删除商家的商品的所有订单项（如果商品被订购过）
      await db.query(`
        DELETE FROM order_items
        WHERE product_id IN (
          SELECT id FROM products WHERE seller_id = $1
        )
      `, [id]);

      // 删除商家的商品的购物车项
      await db.query(`
        DELETE FROM cart
        WHERE product_id IN (
          SELECT id FROM products WHERE seller_id = $1
        )
      `, [id]);

      // 删除商家的商品
      await db.query('DELETE FROM products WHERE seller_id = $1', [id]);
    }

    // 删除用户
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  getAllUsers,
  deleteUser
};