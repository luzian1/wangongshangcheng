// src/services/productService.js
import api from './api';

export const productService = {
  // 获取所有商品（买家 - 仅active商品）
  getAllProducts: (params) => {
    return api.get('/products', { params });
  },

  // 获取商品详情
  getProductById: (productId) => {
    return api.get(`/products/${productId}`);
  },

  // 获取商家自己的商品
  getSellerProducts: (params) => {
    return api.get('/products/my', { params });
  },

  // 获取所有商品（管理员 - 包括所有状态）
  getAllProductsForAdmin: (params) => {
    return api.get('/products/admin', { params });
  },

  // 创建商品（商家）
  createProduct: (data) => {
    return api.post('/products', data);
  },

  // 更新商品（商家/管理员）
  updateProduct: (productId, data) => {
    return api.put(`/products/${productId}`, data);
  },

  // 获取商家销售统计数据
  getSellerStats: () => {
    return api.get('/products/stats');
  },

  // 获取热门商品
  getPopularProducts: (params) => {
    return api.get('/products/popular', { params });
  }
};