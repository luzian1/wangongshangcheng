// src/services/adminService.js
import api from './api';

export const adminService = {
  // 获取系统统计信息
  getSystemStats: () => {
    return api.get('/admin/stats');
  },

  // 获取所有用户
  getAllUsers: () => {
    return api.get('/admin/users');
  },

  // 删除用户
  deleteUser: (userId) => {
    return api.delete(`/admin/users/${userId}`);
  },

  // 获取所有订单
  getAllOrders: (params) => {
    return api.get('/admin/orders', { params });
  },

  // 更新订单状态
  updateOrderStatus: (orderId, data) => {
    return api.put(`/admin/orders/${orderId}/status`, data);
  },

  // 下架商品
  suspendProduct: (productId) => {
    return api.put(`/admin/products/${productId}/suspend`);
  },

  // 恢复商品
  restoreProduct: (productId) => {
    return api.put(`/admin/products/${productId}/restore`);
  },

  // 批准商品上架
  approveProduct: (productId) => {
    return api.put(`/admin/products/${productId}/approve`);
  },

  // 获取商家收入统计
  getSellerRevenueStats: () => {
    return api.get('/admin/revenue-stats');
  }
};