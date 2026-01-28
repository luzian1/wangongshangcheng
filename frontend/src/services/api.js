// src/services/api.js
import axios from 'axios';

// 在生产环境中使用相对路径，这样API请求会发送到同源服务器
const isProduction = import.meta.env.PROD;
const API_BASE_URL = isProduction
  ? '/api'  // 生产环境：使用相对路径，请求同源的API
  : import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';  // 开发环境

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器，添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token过期或无效，清除本地存储并重定向到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 这里可以触发路由跳转，但需要在Vue实例中处理
      console.error('认证失败，请重新登录');
    }
    return Promise.reject(error);
  }
);

export default api;