const express = require('express');
const { createOrder, getUserOrders, getOrderById, payOrder, getSellerOrders } = require('../controllers/orderController');
const { authenticateToken, checkRole } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, createOrder);
router.get('/', authenticateToken, getUserOrders);
router.get('/seller', authenticateToken, checkRole(['seller']), getSellerOrders); // 卖家获取自己的订单
router.get('/:id', authenticateToken, getOrderById);
router.put('/:id/pay', authenticateToken, payOrder);

module.exports = router;