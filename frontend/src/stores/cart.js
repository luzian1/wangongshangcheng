// src/stores/cart.js
import { defineStore } from 'pinia';
import { useUserStore } from './user';
import { cartService } from '../services/cartService';

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    totalAmount: 0,
    itemCount: 0,
    loading: false,
    error: null
  }),

  getters: {
    cartItems: (state) => state.items,
    cartTotal: (state) => state.totalAmount,
    cartItemCount: (state) => state.itemCount,
    isInCart: (state) => (productId) => {
      return state.items.some(item => item.product_id === productId);
    }
  },

  actions: {
    async fetchCart() {
      const userStore = useUserStore();
      if (!userStore.token) {
        // 如果未登录，初始化空购物车
        this.items = [];
        this.totalAmount = 0;
        this.itemCount = 0;
        return { success: true, data: { cart: { items: [], total_amount: 0, item_count: 0 } } };
      }

      this.loading = true;
      this.error = null;

      try {
        const response = await cartService.getCart();
        const cartData = response.data.cart;

        this.items = cartData.items;
        this.totalAmount = cartData.total_amount;
        this.itemCount = cartData.item_count;

        return { success: true, data: response.data };
      } catch (error) {
        console.error('获取购物车失败:', error);
        this.error = error.response?.data?.message || '获取购物车失败';
        return { success: false, error: this.error };
      } finally {
        this.loading = false;
      }
    },

    async addToCart(productId, quantity = 1) {
      this.loading = true;
      this.error = null;

      try {
        const response = await cartService.addToCart(productId, quantity);
        
        // 重新获取购物车以更新状态
        await this.fetchCart();
        
        return { success: true, data: response.data };
      } catch (error) {
        console.error('添加到购物车失败:', error);
        this.error = error.response?.data?.message || '添加到购物车失败';
        return { success: false, error: this.error };
      } finally {
        this.loading = false;
      }
    },

    async updateCartItem(productId, quantity) {
      this.loading = true;
      this.error = null;

      try {
        const response = await cartService.updateCartItem(productId, quantity);
        
        // 重新获取购物车以更新状态
        await this.fetchCart();
        
        return { success: true, data: response.data };
      } catch (error) {
        console.error('更新购物车项目失败:', error);
        this.error = error.response?.data?.message || '更新购物车项目失败';
        return { success: false, error: this.error };
      } finally {
        this.loading = false;
      }
    },

    async removeFromCart(productId) {
      this.loading = true;
      this.error = null;

      try {
        const response = await cartService.removeFromCart(productId);
        
        // 重新获取购物车以更新状态
        await this.fetchCart();
        
        return { success: true, data: response.data };
      } catch (error) {
        console.error('从购物车移除失败:', error);
        this.error = error.response?.data?.message || '从购物车移除失败';
        return { success: false, error: this.error };
      } finally {
        this.loading = false;
      }
    },

    async clearCart() {
      this.items = [];
      this.totalAmount = 0;
      this.itemCount = 0;
    }
  }
});