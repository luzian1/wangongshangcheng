<template>
  <div class="order-detail" v-if="currentOrder">
    <el-page-header
      @back="router.go(-1)"
      content="订单详情"
    />

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>订单信息</span>
            </div>
          </template>
          
          <div class="order-info">
            <p><strong>订单号:</strong> {{ currentOrder.id }}</p>
            <p><strong>订单状态:</strong>
              <el-tag
                :type="getStatusType(currentOrder.status)"
                disable-transitions
              >
                {{ getStatusText(currentOrder.status) }}
              </el-tag>
            </p>
            <p><strong>创建时间:</strong> {{ formatDate(currentOrder.created_at) }}</p>
            <p><strong>更新时间:</strong> {{ formatDate(currentOrder.updated_at) }}</p>

            <!-- 支付按钮 -->
            <div v-if="currentOrder.status === 'pending'" style="margin-top: 15px;">
              <el-button type="success" @click="payOrder" :loading="paying">
                立即支付 ¥{{ currentOrder.total_amount }}
              </el-button>
            </div>
          </div>
        </el-card>

        <el-card style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span>订单商品</span>
            </div>
          </template>
          
          <el-table :data="currentOrder.items" style="width: 100%">
            <el-table-column prop="product_name" label="商品名称" />
            <el-table-column prop="quantity" label="数量" width="100" />
            <el-table-column prop="price" label="单价" width="100">
              <template #default="{ row }">
                <span class="price">¥{{ row.price }}</span>
              </template>
            </el-table-column>
            <el-table-column label="小计" width="100">
              <template #default="{ row }">
                <span class="price">¥{{ (row.price * row.quantity).toFixed(2) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>订单总计</span>
            </div>
          </template>
          
          <div class="order-total">
            <p><strong>商品总计:</strong></p>
            <p class="total-price">¥{{ currentOrder.total_amount }}</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
  
  <div v-else class="loading-container" v-loading="loading">
    <div v-if="!loading && !currentOrder" class="error-message">
      <el-alert
        title="订单不存在"
        type="error"
        :closable="false"
        show-icon
      />
      <el-button @click="$router.push('/orders')" type="primary" style="margin-top: 20px;">返回订单列表</el-button>
    </div>
  </div>
</template>

<script>
import { useOrdersStore } from '@/stores/orders';
import { mapState } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { orderService } from '@/services/orderService';

export default {
  name: 'OrderDetail',
  setup() {
    const route = useRoute();
    const router = useRouter();
    return {
      route,
      router
    };
  },
  data() {
    return {
      paying: false
    };
  },
  computed: {
    ...mapState(useOrdersStore, ['currentOrder', 'loading'])
  },
  async created() {
    await this.loadOrder();
  },
  methods: {
    async loadOrder() {
      const orderId = this.route.params.id;
      await useOrdersStore().fetchOrderById(orderId);
    },
    getStatusType(status) {
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
    },
    getStatusText(status) {
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
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN');
    },
    async payOrder() {
      if (!this.currentOrder) {
        this.$message.error('订单信息不存在');
        return;
      }

      console.log('开始支付流程，订单ID:', this.currentOrder.id);
      console.log('当前订单状态:', this.currentOrder.status);

      // 获取当前认证令牌
      const token = localStorage.getItem('token');
      console.log('认证令牌存在:', !!token);

      if (!token) {
        this.$message.error('未登录或登录已过期，请重新登录');
        // 可以在这里重定向到登录页面
        return;
      }

      this.paying = true;

      try {
        console.log('发送支付请求...');
        const response = await orderService.payOrder(this.currentOrder.id);
        console.log('支付请求成功:', response);
        this.$message.success('订单支付成功');
        // 刷新订单详情
        await this.loadOrder();
      } catch (error) {
        console.error('支付请求失败:', error);
        console.error('错误响应:', error.response);
        const errorMessage = error.response?.data?.message || error.message || '支付失败';
        this.$message.error(errorMessage);
      } finally {
        this.paying = false;
      }
    }
  },
  watch: {
    // 当路由参数变化时重新加载订单
    '$route.params.id'() {
      this.loadOrder();
    }
  }
}
</script>

<style scoped>
.order-detail {
  padding: 20px 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-info p {
  margin: 8px 0;
  display: flex;
}

.order-info p > strong {
  width: 100px;
  display: inline-block;
}

.price {
  font-weight: bold;
  color: #e74c3c;
}

.order-total {
  text-align: center;
}

.total-price {
  font-size: 1.8em;
  font-weight: bold;
  color: #e74c3c;
  margin-top: 10px;
}

.loading-container {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-message {
  text-align: center;
}
</style>