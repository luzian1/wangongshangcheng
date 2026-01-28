import { ref, computed, onMounted } from 'vue';
import { useProductsStore } from '@/stores/products';
import { useCartStore } from '@/stores/cart';
import { useUserStore } from '@/stores/user';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminService } from '@/services/adminService';
import { productService } from '@/services/productService';

export function useProducts() {
  const productsStore = useProductsStore();
  const cartStore = useCartStore();
  const userStore = useUserStore();
  const router = useRouter();
  const route = useRoute();
  
  const searchQuery = ref('');
  const currentPage = ref(1);
  const recommendedProducts = ref([]);

  // 计算属性
  const products = computed(() => productsStore.products);
  const loading = computed(() => productsStore.loading);
  const pagination = computed(() => productsStore.pagination);
  const user = computed(() => userStore.user);

  // 方法
  const performSearch = async () => {
    currentPage.value = 1;
    if (searchQuery.value.trim()) {
      await productsStore.searchProducts(searchQuery.value, { page: currentPage.value });
      router.push(`/products?search=${encodeURIComponent(searchQuery.value)}`);
    } else {
      // 如果搜索框为空，则获取所有商品
      await productsStore.fetchProducts({ page: currentPage.value });
      router.push('/products');
    }
  };

  const handlePageChange = async (page) => {
    currentPage.value = page;
    if (searchQuery.value) {
      await productsStore.searchProducts(searchQuery.value, { page });
    } else {
      await productsStore.fetchProducts({ page });
    }
  };

  const addToCart = async (productId) => {
    const result = await cartStore.addToCart(productId);
    if (result.success) {
      ElMessage.success('已添加到购物车');
    } else {
      ElMessage.error(result.error || '添加失败');
    }
  };

  const goToProductDetail = (productId) => {
    router.push(`/products/${productId}`);
  };

  const suspendProduct = async (productId) => {
    try {
      await ElMessageBox.confirm(
        '确定要下架这个商品吗？该商品将对买家不可见。',
        '确认下架',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      );

      const response = await adminService.suspendProduct(productId);
      if (response) {
        ElMessage.success('商品已下架');
        // 重新获取商品列表以更新显示
        if (searchQuery.value) {
          await productsStore.searchProducts(searchQuery.value, { page: currentPage.value });
        } else {
          await productsStore.fetchProducts({ page: currentPage.value });
        }
      } else {
        ElMessage.error('操作失败');
      }
    } catch {
      // 用户取消操作
    }
  };

  const loadRecommendedProducts = async () => {
    try {
      // 获取热门商品作为推荐
      const response = await productService.getPopularProducts({ limit: 4 });
      recommendedProducts.value = response.data.products;
    } catch (error) {
      console.error('获取推荐商品失败:', error);
      // 如果获取热门商品失败，获取最新商品作为备选
      try {
        await productsStore.fetchProducts({ page: 1, limit: 4 });
        recommendedProducts.value = productsStore.products.slice(0, 4);
      } catch (fallbackError) {
        console.error('获取备选推荐商品也失败:', fallbackError);
      }
    }
  };

  const editProduct = (productId) => {
    // 在这里我们假设路由会处理权限检查，或者我们可以先获取商品信息来检查权限
    router.push(`/seller/products/${productId}/edit`);
  };

  // 组件挂载时的初始化逻辑
  onMounted(async () => {
    // 检查URL参数，如果有搜索参数则执行搜索，否则获取所有商品
    if (route.query.search) {
      searchQuery.value = route.query.search;
      await productsStore.searchProducts(searchQuery.value);
    } else {
      await productsStore.fetchProducts({ page: currentPage.value });
    }

    // 获取推荐商品（这里我们获取销量最高的商品作为推荐）
    await loadRecommendedProducts();
  });

  return {
    searchQuery,
    currentPage,
    recommendedProducts,
    products,
    loading,
    pagination,
    user,
    performSearch,
    handlePageChange,
    addToCart,
    goToProductDetail,
    suspendProduct,
    loadRecommendedProducts,
    editProduct
  };
}