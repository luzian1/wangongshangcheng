import { ref, computed, onMounted, watch } from 'vue';
import { useProductsStore } from '@/stores/products';
import { useCartStore } from '@/stores/cart';
import { useUserStore } from '@/stores/user';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminService } from '@/services/adminService';

export function useProductDetail() {
  const route = useRoute();
  const productsStore = useProductsStore();
  const cartStore = useCartStore();
  const userStore = useUserStore();
  
  const quantity = ref(1);

  // 计算属性
  const currentProduct = computed(() => productsStore.currentProduct);
  const loading = computed(() => productsStore.loading);
  const user = computed(() => userStore.user);

  // 方法
  const loadProduct = async () => {
    const productId = route.params.id;
    await productsStore.fetchProductById(productId);
  };

  const addToCart = async (productId) => {
    const result = await cartStore.addToCart(productId, quantity.value);
    if (result.success) {
      ElMessage.success('已添加到购物车');
      // 更新本地商品库存
      if (currentProduct.value) {
        // 注意：这里不应该直接修改store中的数据
        // 更好的做法是重新获取商品信息或在store中处理
      }
    } else {
      ElMessage.error(result.error || '添加失败');
    }
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

      // 管理员下架商品需要使用adminService
      const response = await adminService.suspendProduct(productId);
      if (response) {
        ElMessage.success('商品已下架');
        await loadProduct(); // 重新加载商品信息
      } else {
        ElMessage.error('操作失败');
      }
    } catch {
      // 用户取消操作
    }
  };

  const editProduct = async (productId) => {
    // 检查当前用户是否是该商品的卖家
    if (currentProduct.value && currentProduct.value.seller_id === user.value.id) {
      // 这里需要使用router，但由于在composable中，我们需要以参数形式传入
      // 或者返回一个函数让组件来处理路由
    } else {
      ElMessage.error('无权限编辑此商品');
    }
  };

  // 监听路由变化
  watch(
    () => route.params.id,
    () => {
      loadProduct();
    }
  );

  // 组件挂载时加载产品
  onMounted(() => {
    loadProduct();
  });

  return {
    quantity,
    currentProduct,
    loading,
    user,
    loadProduct,
    addToCart,
    suspendProduct,
    editProduct
  };
}