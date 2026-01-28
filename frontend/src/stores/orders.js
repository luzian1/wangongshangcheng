// src/stores/orders.js
import { defineStore } from 'pinia';
import { orderService } from '../services/orderService';
import { useCartStore } from './cart';
import { useUserStore } from './user';

export const useOrdersStore = defineStore('orders', {
  state: () => ({
    orders: [],
    currentOrder: null,
    loading: false,
    error: null,
    pagination: {
      current_page: 1,
      total_pages: 1,
      total_items: 0,
      items_per_page: 10
    }
  }),

  getters: {
    allOrders: (state) => state.orders,
    orderById: (state) => (id) => {
      return state.orders.find(order => order.id === parseInt(id));
    }
  },

  actions: {
    async createOrder() {
      this.loading = true;
      this.error = null;

      try {
        const response = await orderService.createOrder();
        const cartStore = useCartStore();
        // 清空本地购物车状态
        await cartStore.clearCart();
        
        // 重新获取订单列表
        await this.fetchOrders();
        
        return { success: true, data: response.data };
      } catch (error) {
        console.error('创建订单失败:', error);
        this.error = error.response?.data?.message || '创建订单失败';
        return { success: false, error: this.error };
      } finally {
        this.loading = false;
      }
    },

    async fetchOrders(params = {}) {
      this.loading = true;
      this.error = null;

      try {
        const response = await orderService.getUserOrders(params);
        this.orders = response.data.orders;
        this.pagination = response.data.pagination;
        
        return { success: true, data: response.data };
      } catch (error) {
        console.error('获取订单列表失败:', error);
        this.error = error.response?.data?.message || '获取订单列表失败';
        return { success: false, error: this.error };
      } finally {
        this.loading = false;
      }
    },

    async fetchOrderById(id) {
      this.loading = true;
      this.error = null;

      try {
        const response = await orderService.getOrderById(id);
        this.currentOrder = response.data.order;
        
        return { success: true, data: response.data };
      } catch (error) {
        console.error('获取订单详情失败:', error);
        this.error = error.response?.data?.message || '获取订单详情失败';
        return { success: false, error: this.error };
      } finally {
        this.loading = false;
      }
    }
  },
});