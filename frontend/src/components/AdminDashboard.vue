<template>
  <div class="admin-dashboard">
    <el-row :gutter="20">
      <el-col :span="24">
        <h2>系统监控面板</h2>
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
              <span>最近订单</span>
            </div>
          </template>

          <el-table :data="recentOrders" style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="订单号" width="100" />
            <el-table-column prop="total_amount" label="金额">
              <template #default="{ row }">
                <span class="amount">¥{{ row.total_amount }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag
                  :type="getStatusType(row.status)"
                  disable-transitions
                >
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>商家收入统计</span>
            </div>
          </template>

          <el-table :data="revenueStats" style="width: 100%" v-loading="loading">
            <el-table-column prop="seller_name" label="商家" />
            <el-table-column prop="total_orders" label="订单数" width="100" />
            <el-table-column prop="total_revenue" label="总收入">
              <template #default="{ row }">
                <span class="amount">¥{{ row.total_revenue }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>用户统计</span>
            </div>
          </template>

          <el-table :data="userStats" style="width: 100%">
            <el-table-column prop="role" label="用户类型" />
            <el-table-column prop="count" label="数量" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { adminService } from '@/services/adminService';
import { productService } from '@/services/productService';
import { ElMessage } from 'element-plus';

export default {
  name: 'AdminDashboard',
  data() {
    return {
      stats: [
        { title: '总订单数', value: 0, description: '平台总订单数量' },
        { title: '总用户数', value: 0, description: '注册用户总数' },
        { title: '商品总数', value: 0, description: '平台商品总数' },
        { title: '待审核商品', value: 0, description: '等待审核的商品数' }
      ],
      recentOrders: [],
      userStats: [],
      revenueStats: [],
      loading: false
    };
  },
  async created() {
    await this.loadDashboardData();
  },
  methods: {
    async loadDashboardData() {
      this.loading = true;
      try {
        const [statsResponse, pendingProductsResponse, revenueStatsResponse] = await Promise.all([
          adminService.getSystemStats(),
          productService.getAllProductsForAdmin({ page: 1, limit: 1, status: 'inactive' }),
          adminService.getSellerRevenueStats()
        ]);

        const data = statsResponse.data;

        // 更新统计数据
        this.stats[0].value = data.stats.total_orders;
        this.stats[1].value = data.stats.total_users;
        this.stats[2].value = data.stats.total_products;
        this.stats[3].value = pendingProductsResponse.data.pagination.total_items; // 待审核商品数

        // 更新最近订单
        this.recentOrders = data.recent_orders;

        // 更新用户统计
        this.userStats = data.user_role_stats.map(stat => ({
          role: this.getRoleDisplayName(stat.role),
          count: stat.count
        }));

        // 更新商家收入统计
        this.revenueStats = revenueStatsResponse.data.revenue_stats;
      } catch (error) {
        console.error('获取系统统计数据失败:', error);
        ElMessage.error('获取系统统计数据失败');
      } finally {
        this.loading = false;
      }
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
    getRoleDisplayName(role) {
      switch(role) {
        case 'buyer':
          return '买家';
        case 'seller':
          return '商家';
        case 'admin':
          return '管理员';
        default:
          return role;
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
.admin-dashboard {
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

.amount {
  font-weight: bold;
  color: #e74c3c;
}
</style>