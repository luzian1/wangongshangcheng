// src/services/cartService.js
import api from './api';

export const cartService = {
  // 获取购物车
  getCart: () => {
    return api.get('/cart');
  },

  // 添加到购物车
  addToCart: (productId, quantity = 1) => {
    return api.post('/cart', { productId, quantity });
  },

  // 更新购物车项目
  updateCartItem: (productId, quantity) => {
    return api.put(`/cart/${productId}`, { quantity });
  },

  // 从购物车移除项目
  removeFromCart: (productId) => {
    return api.delete(`/cart/${productId}`);
  }
};