// src/stores/products.js
import { defineStore } from 'pinia';
import { productService } from '../services/productService';

export const useProductsStore = defineStore('products', {
  state: () => ({
    products: [],
    currentProduct: null,
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
    allProducts: (state) => state.products,
    productById: (state) => (id) => {
      return state.products.find(product => product.id === parseInt(id));
    }
  },

  actions: {
    async fetchProducts(params = {}) {
      this.loading = true;
      this.error = null;

      try {
        const response = await productService.getAllProducts(params);
        this.products = response.data.products;
        this.pagination = response.data.pagination;
        return { success: true, data: response.data };
      } catch (error) {
        console.error('获取商品列表失败:', error);
        this.error = error.response?.data?.message || '获取商品列表失败';
        return { success: false, error: this.error };
      } finally {
        this.loading = false;
      }
    },

    async fetchSellerProducts(params = {}) {
      this.loading = true;
      this.error = null;

      try {
        const response = await productService.getSellerProducts(params);
        this.products = response.data.products;
        this.pagination = response.data.pagination;
        return { success: true, data: response.data };
      } catch (error) {
        console.error('获取商家商品列表失败:', error);
        this.error = error.response?.data?.message || '获取商家商品列表失败';
        return { success: false, error: this.error };
      } finally {
        this.loading = false;
      }
    },

    async fetchProductById(id) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await productService.getProductById(id);
        this.currentProduct = response.data.product;
        return { success: true, data: response.data };
      } catch (error) {
        console.error('获取商品详情失败:', error);
        this.error = error.response?.data?.message || '获取商品详情失败';
        return { success: false, error: this.error };
      } finally {
        this.loading = false;
      }
    },

    async searchProducts(query, params = {}) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await productService.searchProducts(query, params);
        this.products = response.data.products;
        this.pagination = response.data.pagination;
        return { success: true, data: response.data };
      } catch (error) {
        console.error('搜索商品失败:', error);
        this.error = error.response?.data?.message || '搜索商品失败';
        return { success: false, error: this.error };
      } finally {
        this.loading = false;
      }
    },

    async createProduct(productData) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await productService.createProduct(productData);
        // 可以选择将新商品添加到列表中或刷新列表
        await this.fetchProducts();
        return { success: true, data: response.data };
      } catch (error) {
        console.error('创建商品失败:', error);
        this.error = error.response?.data?.message || '创建商品失败';
        return { success: false, error: this.error };
      } finally {
        this.loading = false;
      }
    },

    async updateProduct(id, productData) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await productService.updateProduct(id, productData);
        // 更新本地状态
        const index = this.products.findIndex(p => p.id === id);
        if (index !== -1) {
          this.products[index] = response.data.product;
        }
        if (this.currentProduct && this.currentProduct.id === id) {
          this.currentProduct = response.data.product;
        }
        return { success: true, data: response.data };
      } catch (error) {
        console.error('更新商品失败:', error);
        this.error = error.response?.data?.message || '更新商品失败';
        return { success: false, error: this.error };
      } finally {
        this.loading = false;
      }
    }
  },
});