import { ref, computed, onMounted } from 'vue';
import { useProductsStore } from '@/stores/products';
import { useCartStore } from '@/stores/cart';
import { useUserStore } from '@/stores/user';
import { mapState } from 'pinia';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';

export function useHome() {
  const router = useRouter();
  const productsStore = useProductsStore();
  const cartStore = useCartStore();
  const userStore = useUserStore();

  const searchQuery = ref('');

  // 定义卖家快捷操作
  const sellerQuickActions = [
    {
      title: '添加商品',
      description: '发布新的商品到平台',
      icon: 'Plus',
      handler: () => router.push('/seller/products/new')
    },
    {
      title: '管理商品',
      description: '查看和编辑您的商品',
      icon: 'List',
      handler: () => router.push('/seller/products')
    },
    {
      title: '销售报告',
      description: '查看您的销售数据',
      icon: 'DataAnalysis',
      handler: () => ElMessage.info('销售报告功能即将推出')
    },
    {
      title: '店铺设置',
      description: '管理您的店铺信息',
      icon: 'Monitor',
      handler: () => ElMessage.info('店铺设置功能即将推出')
    }
  ];

  // 定义管理员统计数据
  const adminStats = ref([
    { title: '总用户数', value: 0, description: '平台注册用户总数' },
    { title: '总商品数', value: 0, description: '平台上架商品总数' },
    { title: '总订单数', value: 0, description: '平台订单总数' },
    { title: '今日收入', value: '¥0', description: '今日订单总收入' }
  ]);

  // 计算属性
  const products = computed(() => productsStore.products);
  const loading = computed(() => productsStore.loading);
  const user = computed(() => userStore.user);
  const isAuthenticated = computed(() => userStore.isAuthenticated);
  const userRole = computed(() => user.value?.role || null);

  // 获取热门商品（模拟数据，实际项目中应从API获取）
  const hotProducts = computed(() => {
    // 只有买家才显示热门商品
    if (!userRole.value || userRole.value === 'buyer') {
      // 从所有商品中取前4个作为热门商品，如果没有商品则使用默认数据
      if (products.value && products.value.length > 0) {
        return products.value.slice(0, 4);
      } else {
        // 默认热门商品数据（当没有加载到商品时）
        return [
          {
            id: 1,
            name: '热门商品 1',
            description: '这是一款非常受欢迎的商品，具有高质量和优秀的设计。',
            price: 99.99,
            image_url: '/placeholder-image.jpg',
            stock_quantity: 10
          },
          {
            id: 2,
            name: '热门商品 2',
            description: '这款商品因其独特功能而备受欢迎，是您的理想选择。',
            price: 149.99,
            image_url: '/placeholder-image.jpg',
            stock_quantity: 5
          },
          {
            id: 3,
            name: '热门商品 3',
            description: '限时热销商品，品质卓越，数量有限，快来抢购！',
            price: 199.99,
            image_url: '/placeholder-image.jpg',
            stock_quantity: 8
          },
          {
            id: 4,
            name: '热门商品 4',
            description: '最新上架商品，功能强大，性价比极高。',
            price: 179.99,
            image_url: '/placeholder-image.jpg',
            stock_quantity: 15
          }
        ];
      }
    }
    return [];
  });

  // 方法
  const performSearch = async () => {
    if (searchQuery.value.trim()) {
      await productsStore.searchProducts(searchQuery.value);
      router.push(`/products?search=${encodeURIComponent(searchQuery.value)}`);
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

  const loadAdminStats = async () => {
    try {
      const { adminService } = await import('@/services/adminService');
      const response = await adminService.getSystemStats();
      const data = response.data;

      adminStats.value[0].value = data.stats.total_users;
      adminStats.value[1].value = data.stats.total_products;
      adminStats.value[2].value = data.stats.total_orders;
      adminStats.value[3].value = `¥${data.stats.today_revenue}`;
    } catch (error) {
      console.error('加载管理员统计数据失败:', error);
      // 设置默认值
      adminStats.value[0].value = '0';
      adminStats.value[1].value = '0';
      adminStats.value[2].value = '0';
      adminStats.value[3].value = '¥0';
    }
  };

  // 组件挂载时的初始化逻辑
  onMounted(async () => {
    // 只有买家才加载商品数据
    if (!userRole.value || userRole.value === 'buyer') {
      await productsStore.fetchProducts({ limit: 10 });
    }

    // 如果是管理员，加载系统统计
    if (userRole.value === 'admin') {
      await loadAdminStats();
    }
  });

  return {
    searchQuery,
    sellerQuickActions,
    adminStats,
    products,
    loading,
    user,
    isAuthenticated,
    userRole,
    performSearch,
    addToCart,
    goToProductDetail,
    loadAdminStats,
    hotProducts
  };
}