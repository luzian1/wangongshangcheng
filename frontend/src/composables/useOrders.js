import { computed } from 'vue';
import { useOrdersStore } from '@/stores/orders';
import { useRouter } from 'vue-router';

export function useOrders() {
  const ordersStore = useOrdersStore();
  const router = useRouter();
  
  // 计算属性
  const orders = computed(() => ordersStore.orders);
  const loading = computed(() => ordersStore.loading);
  const pagination = computed(() => ordersStore.pagination);

  // 方法
  const getStatusType = (status) => {
    switch(status) {
      case 'pending':
        return 'info';
      case 'paid':
        return 'warning';
      case 'shipped':
        return 'primary';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'info';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'pending':
        return '待支付';
      case 'paid':
        return '已支付';
      case 'shipped':
        return '已发货';
      case 'delivered':
        return '已收货';
      case 'cancelled':
        return '已取消';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  const handlePageChange = async (page) => {
    await ordersStore.fetchOrders({ page });
  };

  const viewOrder = (orderId) => {
    router.push(`/orders/${orderId}`);
  };

  // 组件挂载时的初始化逻辑
  (async () => {
    await ordersStore.fetchOrders();
  })();

  return {
    orders,
    loading,
    pagination,
    getStatusType,
    getStatusText,
    formatDate,
    handlePageChange,
    viewOrder
  };
}