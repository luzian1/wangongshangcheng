<template>
  <div class="seller-dashboard">
    <el-row :gutter="20">
      <el-col :span="24">
        <h2>商家中心</h2>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="6" v-for="stat in stats" :key="stat.title">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-title">{{ stat.title }}</div>
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-description">{{ stat.description }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>我的商品</span>
              <el-button type="primary" @click="$router.push('/seller/products')">管理商品</el-button>
            </div>
          </template>

          <el-table :data="myProducts" style="width: 100%" v-loading="productsLoading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="商品名称" show-overflow-tooltip />
            <el-table-column prop="price" label="价格" width="100">
              <template #default="{ row }">
                <span class="price">¥{{ row.price }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="stock_quantity" label="库存" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>销售统计</span>
            </div>
          </template>

          <el-row :gutter="10" v-if="salesStats.totalOrders > 0">
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value">{{ salesStats.totalOrders }}</div>
                <div class="stat-label">总订单数</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value">¥{{ salesStats.totalRevenue }}</div>
                <div class="stat-label">总销售额</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value">¥{{ salesStats.averageOrderValue }}</div>
                <div class="stat-label">平均订单金额</div>
              </div>
            </el-col>
          </el-row>
          <p v-else>暂无销售数据</p>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近订单</span>
            </div>
          </template>

          <div v-if="recentOrders.length > 0">
            <el-table :data="recentOrders" style="width: 100%">
              <el-table-column prop="id" label="订单号" width="100" />
              <el-table-column prop="user_name" label="买家" width="120" />
              <el-table-column prop="total_amount" label="金额">
                <template #default="{ row }">
                  <span class="price">¥{{ row.total_amount }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getOrderStatusType(row.status)">
                    {{ getOrderStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="created_at" label="时间" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.created_at) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
          <p v-else>暂无订单数据</p>
        </el-card>
      </el-col>
    </el-row>

  </div>
</template>

<script>
import { productService } from '@/services/productService';
import { orderService } from '@/services/orderService';
import { ElMessage } from 'element-plus';

export default {
  name: 'SellerDashboard',
  data() {
    return {
      stats: [
        { title: '商品总数', value: 0, description: '我发布的商品数量' },
        { title: '上架商品', value: 0, description: '当前上架的商品数' },
        { title: '待审核商品', value: 0, description: '等待审核的商品数' },
        { title: '违规商品', value: 0, description: '被平台下架的商品数' }
      ],
      myProducts: [],
      productsLoading: false,
      recentOrders: [],
      salesStats: {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0
      }
    };
  },
  async created() {
    await this.loadDashboardData();
  },
  methods: {
    async loadDashboardData() {
      await Promise.all([
        this.loadProductStats(),
        this.loadMyProducts(),
        this.loadSalesStats(),
        this.loadRecentOrders()
      ]);
    },
    async loadProductStats() {
      try {
        const response = await productService.getSellerProducts({
          page: 1,
          limit: 100  // 获取所有商品用于统计
        });
        const products = response.data.products;

        // 计算统计数据
        this.stats[0].value = products.length;
        this.stats[1].value = products.filter(p => p.status === 'active').length;
        this.stats[2].value = products.filter(p => p.status === 'inactive').length;
        this.stats[3].value = products.filter(p => p.status === 'suspended').length;
      } catch (error) {
        console.error('获取商品统计失败:', error);
        ElMessage.error('获取商品统计失败');
      }
    },
    async loadSalesStats() {
      try {
        const response = await productService.getSellerStats();
        const stats = response.data.stats;

        this.salesStats.totalOrders = stats.total_orders;
        this.salesStats.totalRevenue = stats.total_revenue;
        this.salesStats.averageOrderValue = stats.average_order_value;
      } catch (error) {
        console.error('获取销售统计失败:', error);
        ElMessage.error('获取销售统计失败');
      }
    },
    async loadMyProducts() {
      this.productsLoading = true;
      try {
        const response = await productService.getSellerProducts({
          page: 1,
          limit: 5  // 只显示前5个商品
        });
        this.myProducts = response.data.products;
      } catch (error) {
        console.error('获取商品列表失败:', error);
        ElMessage.error('获取商品列表失败');
      } finally {
        this.productsLoading = false;
      }
    },
    async loadRecentOrders() {
      try {
        const response = await orderService.getSellerOrders({
          page: 1,
          limit: 5  // 只获取最近的5个订单
        });
        this.recentOrders = response.data.orders;
      } catch (error) {
        console.error('获取最近订单失败:', error);
        // ElMessage.error('获取最近订单失败');
      }
    },
    getStatusType(status) {
      switch(status) {
        case 'active':
          return 'success';
        case 'inactive':
          return 'info';
        case 'suspended':
          return 'danger';
        default:
          return 'info';
      }
    },
    getStatusText(status) {
      switch(status) {
        case 'active':
          return '上架';
        case 'inactive':
          return '待审核';
        case 'suspended':
          return '违规';
        default:
          return status;
      }
    },
    getOrderStatusType(status) {
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
    getOrderStatusText(status) {
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
    }
  }
}
</script>

<style scoped>
.seller-dashboard {
  padding: 20px 0;
}

.stat-card {
  text-align: center;
  cursor: default;
}

.stat-content {
  padding: 20px 0;
}

.stat-title {
  font-size: 1em;
  color: #666;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 2em;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.stat-description {
  font-size: 0.9em;
  color: #999;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  font-weight: bold;
  color: #e74c3c;
}

.stat-item {
  text-align: center;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 1.5em;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9em;
  color: #666;
}

.sales-chart {
  text-align: center;
  padding: 40px 0;
  color: #999;
}
</style>