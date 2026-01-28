// src/stores/user.js
import { defineStore } from 'pinia';
import { userService } from '../services/userService';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: false,
  }),

  getters: {
    currentUser: (state) => state.user,
    isLoggedIn: (state) => !!state.token,
    userRole: (state) => state.user?.role || null,
  },

  actions: {
    async login(credentials) {
      try {
        const response = await userService.login(credentials);
        const { token, user } = response.data;

        this.token = token;
        this.user = user;
        this.isAuthenticated = true;

        // 保存token到本地存储
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        return { success: true, data: response.data };
      } catch (error) {
        console.error('登录失败:', error);
        return { success: false, error: error.response?.data?.message || '登录失败' };
      }
    },

    async register(userData) {
      try {
        const response = await userService.register(userData);
        return { success: true, data: response.data };
      } catch (error) {
        console.error('注册失败:', error);
        return { success: false, error: error.response?.data?.message || '注册失败' };
      }
    },

    async fetchProfile() {
      if (!this.token) {
        return { success: false, error: '未认证' };
      }

      try {
        const response = await userService.getProfile();
        this.user = response.data.user;
        this.isAuthenticated = true;
        return { success: true, data: response.data };
      } catch (error) {
        console.error('获取用户资料失败:', error);
        this.logout();
        return { success: false, error: error.response?.data?.message || '获取用户资料失败' };
      }
    },

    logout() {
      this.user = null;
      this.token = null;
      this.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },

    initializeAuth() {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');

      if (token && user) {
        this.token = token;
        this.user = JSON.parse(user);
        this.isAuthenticated = true;
      }
    }
  },
});