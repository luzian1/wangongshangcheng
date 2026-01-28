const express = require('express');
const { suspendProduct, restoreProduct, getSystemStats, approveProduct, getSellerRevenueStats } = require('../controllers/productController');
const { getAllUsers, deleteUser } = require('../controllers/userController');
const { getAllOrders, updateOrderStatus } = require('../controllers/orderController');
const { authenticateToken, checkRole } = require('../middleware/auth');

const router = express.Router();

// 管理员功能路由
router.put('/products/:id/suspend', authenticateToken, checkRole(['admin']), suspendProduct);
router.put('/products/:id/restore', authenticateToken, checkRole(['admin']), restoreProduct);
router.put('/products/:id/approve', authenticateToken, checkRole(['admin']), approveProduct);
router.get('/stats', authenticateToken, checkRole(['admin']), getSystemStats);
router.get('/revenue-stats', authenticateToken, checkRole(['admin']), getSellerRevenueStats);

// 用户管理路由
router.get('/users', authenticateToken, checkRole(['admin']), getAllUsers);
router.delete('/users/:id', authenticateToken, checkRole(['admin']), deleteUser);

// 订单管理路由
router.get('/orders', authenticateToken, checkRole(['admin']), getAllOrders);
router.put('/orders/:id/status', authenticateToken, checkRole(['admin']), updateOrderStatus);

module.exports = router;