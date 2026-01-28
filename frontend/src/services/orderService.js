// src/services/orderService.js
import api from './api';

export const orderService = {
  // 创建订单（买家）
  createOrder: () => {
    return api.post('/orders');
  },

  // 获取当前用户的订单（买家）
  getUserOrders: (params) => {
    return api.get('/orders', { params });
  },

  // 获取订单详情（买家）
  getOrderById: (orderId) => {
    return api.get(`/orders/${orderId}`);
  },

  // 支付订单（买家）
  payOrder: (orderId) => {
    return api.put(`/orders/${orderId}/pay`);
  },

  // 获取所有订单（管理员）
  getAllOrders: (params) => {
    return api.get('/admin/orders', { params });
  },

  // 更新订单状态（管理员）
  updateOrderStatus: (orderId, data) => {
    return api.put(`/admin/orders/${orderId}/status`, data);
  },

  // 获取卖家的订单
  getSellerOrders: (params) => {
    return api.get('/orders/seller', { params });
  }
};