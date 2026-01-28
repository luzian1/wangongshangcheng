import { ref, computed, onMounted } from 'vue';
import { useCartStore } from '@/stores/cart';
import { useOrdersStore } from '@/stores/orders';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';

export function useCart() {
  const cartStore = useCartStore();
  const ordersStore = useOrdersStore();
  const router = useRouter();
  
  // 计算属性
  const items = computed(() => cartStore.items);
  const totalAmount = computed(() => cartStore.totalAmount);
  const itemCount = computed(() => cartStore.itemCount);
  const loading = computed(() => cartStore.loading);
  
  const cartItems = computed(() => {
    return items.value.map(item => ({
      ...item,
      total: item.price * item.quantity
    }));
  });

  // 方法
  const fetchCart = async () => {
    await cartStore.fetchCart();
  };

  const updateQuantity = async (cartId, newQuantity) => {
    const item = items.value.find(item => item.cart_id === cartId);
    if (item) {
      const result = await cartStore.updateCartItem(item.product_id, newQuantity);
      if (!result.success) {
        ElMessage.error(result.error || '更新数量失败');
        // 如果更新失败，重新加载购物车以恢复原始数量
        await cartStore.fetchCart();
      }
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await ElMessageBox.confirm(
        '确定要从购物车中移除此商品吗？',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      );

      const result = await cartStore.removeFromCart(productId);
      if (result.success) {
        ElMessage.success('已从购物车移除');
      } else {
        ElMessage.error(result.error || '移除失败');
      }
    } catch {
      // 用户取消操作
    }
  };

  const createOrder = async () => {
    try {
      await ElMessageBox.confirm(
        `确定要提交订单吗？总金额: ¥${totalAmount.value.toFixed(2)}`,
        '提交订单',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      );

      const result = await ordersStore.createOrder();
      if (result.success) {
        ElMessage.success('订单创建成功');
        router.push('/orders');
      } else {
        ElMessage.error(result.error || '创建订单失败');
      }
    } catch {
      // 用户取消操作
    }
  };

  const continueShopping = () => {
    router.push('/products');
  };

  // 组件挂载时加载购物车
  onMounted(() => {
    fetchCart();
  });

  return {
    cartItems,
    totalAmount,
    itemCount,
    loading,
    fetchCart,
    updateQuantity,
    removeFromCart,
    createOrder,
    continueShopping
  };
}