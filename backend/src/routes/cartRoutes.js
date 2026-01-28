const express = require('express');
const { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeFromCart 
} = require('../controllers/cartController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, getCart);
router.post('/', authenticateToken, addToCart);
router.put('/:productId', authenticateToken, updateCartItem);
router.delete('/:productId', authenticateToken, removeFromCart);

module.exports = router;