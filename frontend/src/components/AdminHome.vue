<template>
  <div class="admin-home">
    <el-row :gutter="20">
      <el-col :span="24">
        <h2>欢迎来到管理控制台</h2>
        <p>监控系统状态，管理用户和商品，维护平台秩序</p>
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
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近订单</span>
              <el-button type="primary" @click="$router.push('/admin/panel')">查看全部</el-button>
            </div>
          </template>

          <el-table :data="recentOrders" style="width: 100%" v-loading="ordersLoading">
            <el-table-column prop="id" label="订单号" width="100" />
            <el-table-column prop="username" label="用户" width="120" />
            <el-table-column prop="total_amount" label="金额">
              <template #default="{ row }">
                <span class="amount">¥{{ row.total_amount }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag
                  :type="getOrderStatusType(row.status)"
                  disable-transitions
                >
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
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>系统概览</span>
            </div>
          </template>

          <div class="system-overview">
            <div class="overview-item">
              <span class="label">用户统计:</span>
              <div class="stats">
                <div v-for="stat in userStats" :key="stat.role" class="stat-row">
                  <span class="role">{{ getRoleDisplayName(stat.role) }}:</span>
                  <span class="count">{{ stat.count }}</span>
                </div>
              </div>
            </div>

            <div class="overview-item" style="margin-top: 20px;">
              <span class="label">商品状态:</span>
              <div class="stats">
                <div v-for="stat in productStats" :key="stat.status" class="stat-row">
                  <span class="status">{{ getStatusText(stat.status) }}:</span>
                  <span class="count">{{ stat.count }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>违规商品</span>
              <el-button type="primary" @click="$router.push('/admin/panel')">管理违规商品</el-button>
            </div>
          </template>

          <el-table :data="suspendedProducts" style="width: 100%" v-loading="productsLoading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="商品名称" show-overflow-tooltip />
            <el-table-column prop="seller_name" label="商家" width="120" />
            <el-table-column prop="price" label="价格" width="100">
              <template #default="{ row }">
                <span class="price">¥{{ row.price }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag type="danger">违规</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="违规时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button size="small" type="success" @click="restoreProduct(row)">
                  恢复
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { adminService } from '@/services/adminService';
import { productService } from '@/services/productService';
import { orderService } from '@/services/orderService';
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  name: 'AdminHome',
  data() {
    return {
      stats: [
        { title: '总订单数', value: 0, description: '平台总订单数量' },
        { title: '总用户数', value: 0, description: '注册用户总数' },
        { title: '商品总数', value: 0, description: '上架商品总数' },
        { title: '今日收入', value: '¥0', description: '今日订单总收入' }
      ],
      recentOrders: [],
      suspendedProducts: [],
      userStats: [],
      productStats: [],
      ordersLoading: false,
      productsLoading: false
    };
  },
  async created() {
    await this.loadData();
  },
  methods: {
    async loadData() {
      await Promise.all([
        this.loadStats(),
        this.loadRecentOrders(),
        this.loadSuspendedProducts(),
        this.loadUserStats(),
        this.loadProductStats()
      ]);
    },
    async loadStats() {
      try {
        const response = await adminService.getSystemStats();
        const data = response.data;

        // 更新统计数据
        this.stats[0].value = data.stats.total_orders;
        this.stats[1].value = data.stats.total_users;
        this.stats[2].value = data.stats.total_products;
        this.stats[3].value = `¥${data.stats.today_revenue}`;
      } catch (error) {
        console.error('获取系统统计数据失败:', error);
        ElMessage.error('获取系统统计数据失败');
      }
    },
    async loadRecentOrders() {
      this.ordersLoading = true;
      try {
        const response = await orderService.getAllOrders({
          page: 1,
          limit: 5
        });
        this.recentOrders = response.data.orders.map(order => ({
          ...order,
          username: order.username || '未知用户'
        }));
      } catch (error) {
        console.error('获取最近订单失败:', error);
        ElMessage.error('获取最近订单失败');
      } finally {
        this.ordersLoading = false;
      }
    },
    async loadSuspendedProducts() {
      this.productsLoading = true;
      try {
        const response = await productService.getAllProductsForAdmin({
          page: 1,
          limit: 5,
          status: 'suspended'
        });
        this.suspendedProducts = response.data.products;
      } catch (error) {
        console.error('获取违规商品失败:', error);
        ElMessage.error('获取违规商品失败');
      } finally {
        this.productsLoading = false;
      }
    },
    async loadUserStats() {
      try {
        const response = await adminService.getSystemStats();
        this.userStats = response.data.user_role_stats.map(stat => ({
          role: stat.role,
          count: stat.count
        }));
      } catch (error) {
        console.error('获取用户统计失败:', error);
        ElMessage.error('获取用户统计失败');
      }
    },
    async loadProductStats() {
      try {
        const response = await adminService.getSystemStats();
        this.productStats = response.data.product_status_stats.map(stat => ({
          status: stat.status,
          count: stat.count
        }));
      } catch (error) {
        console.error('获取商品统计失败:', error);
        ElMessage.error('获取商品统计失败');
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
    getStatusText(status) {
      switch(status) {
        case 'active':
          return '上架';
        case 'inactive':
          return '下架';
        case 'suspended':
          return '违规';
        default:
          return status;
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN');
    },
    async restoreProduct(product) {
      try {
        await ElMessageBox.confirm(
          `确定要恢复商品 "${product.name}" 吗？该商品将被恢复为待上架状态，由商家决定是否重新上架。`,
          '确认恢复',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }
        );

        await adminService.restoreProduct(product.id);
        ElMessage.success('商品已恢复');
        await this.loadSuspendedProducts(); // 重新加载违规商品列表
      } catch {
        // 用户取消操作
      }
    }
  }
}
</script>

<style scoped>
.admin-home {
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

.price {
  font-weight: bold;
  color: #e74c3c;
}

.system-overview {
  padding: 10px 0;
}

.overview-item .label {
  font-weight: bold;
  display: block;
  margin-bottom: 10px;
  color: #333;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 3px 0;
  font-size: 0.9em;
}

.stat-row .role,
.stat-row .status {
  color: #666;
}

.stat-row .count {
  font-weight: bold;
  color: #333;
}
</style>