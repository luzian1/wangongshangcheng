const express = require('express');
const {
  getAllProducts,
  getSellerProducts,
  getAllProductsForAdmin,
  getProductById,
  searchProducts,
  createProduct,
  updateProduct,
  getSellerStats,
  getPopularProducts
} = require('../controllers/productController');
const { authenticateToken, checkRole } = require('../middleware/auth');

const router = express.Router();

// 买家相关路由
router.get('/', getAllProducts);

// 搜索商品
router.get('/search', searchProducts);

// 热门商品
router.get('/popular', getPopularProducts);

// 商家相关路由 - 所有静态路由必须在动态路由之前
router.get('/my', authenticateToken, checkRole(['seller']), getSellerProducts); // 商家获取自己的商品
router.get('/stats', authenticateToken, checkRole(['seller']), getSellerStats); // 商家获取销售统计数据

// 管理员相关路由
router.get('/admin', authenticateToken, checkRole(['admin']), getAllProductsForAdmin); // 管理员获取所有商品（包括非active状态）

// 通用动态路由 - 必须在所有静态路由之后
router.get('/:id', getProductById);

// 商家相关路由
router.post('/', authenticateToken, checkRole(['seller']), createProduct); // 商家创建商品
router.put('/:id', authenticateToken, updateProduct); // 商家或管理员更新商品（权限在控制器中处理）

module.exports = router;