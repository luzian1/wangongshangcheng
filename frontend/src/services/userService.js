// src/services/userService.js
import api from './api';

export const userService = {
  // 用户登录
  login: (credentials) => {
    return api.post('/users/login', credentials);
  },

  // 用户注册
  register: (userData) => {
    return api.post('/users/register', userData);
  },

  // 获取用户资料
  getProfile: () => {
    return api.get('/users/profile');
  },

  // 获取所有用户（管理员）
  getAllUsers: () => {
    return api.get('/admin/users');
  },

  // 删除用户（管理员）
  deleteUser: (userId) => {
    return api.delete(`/admin/users/${userId}`);
  }
};