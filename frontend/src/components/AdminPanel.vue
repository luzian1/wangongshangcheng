<template>
  <div class="admin-panel">
    <el-row :gutter="20">
      <el-col :span="24">
        <h2>管理员面板</h2>
      </el-col>
    </el-row>

    <!-- 统计卡片 -->
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

    <!-- 管理功能选项卡 -->
    <el-tabs type="border-card" style="margin-top: 20px;">
      <!-- 待审核商品 -->
      <el-tab-pane label="待审核商品">
        <el-table
          :data="pendingProducts"
          style="width: 100%"
          v-loading="productLoading"
          empty-text="暂无待审核商品"
        >
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="商品名称" show-overflow-tooltip />
          <el-table-column prop="price" label="价格" width="100">
            <template #default="{ row }">
              <span class="price">¥{{ row.price }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="stock_quantity" label="库存" width="100" />
          <el-table-column prop="seller_name" label="商家" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button
                size="small"
                type="success"
                @click="approveProduct(row)"
              >
                批准上架
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 违规商品管理 -->
      <el-tab-pane label="违规商品">
        <el-table
          :data="suspendedProducts"
          style="width: 100%"
          v-loading="productLoading"
          empty-text="暂无违规商品"
        >
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="商品名称" show-overflow-tooltip />
          <el-table-column prop="price" label="价格" width="100">
            <template #default="{ row }">
              <span class="price">¥{{ row.price }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="stock_quantity" label="库存" width="100" />
          <el-table-column prop="seller_name" label="商家" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="上架时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button
                size="small"
                type="success"
                @click="restoreProduct(row)"
              >
                恢复商品
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 订单管理 -->
      <el-tab-pane label="订单管理">
        <el-table
          :data="orders"
          style="width: 100%"
          v-loading="orderLoading"
          empty-text="暂无订单数据"
        >
          <el-table-column prop="id" label="订单号" width="100" />
          <el-table-column prop="username" label="用户" width="120" />
          <el-table-column prop="total_amount" label="总金额">
            <template #default="{ row }">
              <span class="amount">¥{{ row.total_amount }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getOrderStatusType(row.status)">
                {{ getOrderStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button
                size="small"
                @click="updateOrderStatus(row)"
              >
                修改状态
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 收入统计 -->
      <el-tab-pane label="收入统计">
        <el-table
          :data="revenueStats"
          style="width: 100%"
          v-loading="productLoading"
          empty-text="暂无收入统计数据"
        >
          <el-table-column prop="seller_name" label="商家" width="200" />
          <el-table-column prop="total_orders" label="订单数" width="100" />
          <el-table-column prop="total_revenue" label="总收入">
            <template #default="{ row }">
              <span class="amount">¥{{ row.total_revenue }}</span>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 用户管理 -->
      <el-tab-pane label="用户管理">
        <el-table
          :data="users"
          style="width: 100%"
          v-loading="userLoading"
          empty-text="暂无用户数据"
        >
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="username" label="用户名" />
          <el-table-column prop="email" label="邮箱" />
          <el-table-column prop="role" label="角色">
            <template #default="{ row }">
              <el-tag :type="getRoleType(row.role)">
                {{ getRoleDisplayName(row.role) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="注册时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button
                size="small"
                type="danger"
                @click="deleteUser(row.id)"
                :disabled="row.role === 'admin'"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 所有商品 -->
      <el-tab-pane label="所有商品">
        <el-table
          :data="allProducts"
          style="width: 100%"
          v-loading="productLoading"
          empty-text="暂无商品"
        >
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="商品名称" show-overflow-tooltip />
          <el-table-column prop="price" label="价格" width="100">
            <template #default="{ row }">
              <span class="price">¥{{ row.price }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="stock_quantity" label="库存" width="100" />
          <el-table-column prop="seller_name" label="商家" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button
                size="small"
                v-if="row.status === 'active'"
                type="danger"
                @click="suspendProduct(row)"
              >
                下架
              </el-button>
              <el-button
                size="small"
                v-else-if="row.status === 'suspended'"
                type="success"
                @click="restoreProduct(row)"
              >
                恢复
              </el-button>
              <el-button
                size="small"
                v-else-if="row.status === 'inactive'"
                type="primary"
                @click="approveProduct(row)"
              >
                批准
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { adminService } from '@/services/adminService';
import { userService } from '@/services/userService';
import { productService } from '@/services/productService';
import { orderService } from '@/services/orderService';
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  name: 'AdminPanel',
  data() {
    return {
      stats: [
        { title: '待审核商品', value: 0, description: '等待审核的商品数' },
        { title: '违规商品', value: 0, description: '违规下架的商品数' },
        { title: '今日订单', value: 0, description: '今日新增订单数' },
        { title: '今日收入', value: '¥0', description: '今日订单总收入' }
      ],
      users: [],
      suspendedProducts: [],
      pendingProducts: [],
      allProducts: [],
      orders: [],
      revenueStats: [],
      userLoading: false,
      productLoading: false,
      orderLoading: false
    };
  },
  async created() {
    await this.loadAllData();
  },
  methods: {
    async loadAllData() {
      await Promise.all([
        this.loadStats(),
        this.loadUsers(),
        this.loadAllProducts(),
        this.loadPendingProducts(),
        this.loadSuspendedProducts(),
        this.loadOrders(),
        this.loadRevenueStats()
      ]);
    },
    async loadStats() {
      try {
        // 获取系统基本统计信息
        const statsResponse = await adminService.getSystemStats();
        const statsData = statsResponse.data;

        // 获取待审核商品数量
        const pendingProductsResponse = await productService.getAllProductsForAdmin({ page: 1, limit: 1, status: 'inactive' });
        const pendingCount = pendingProductsResponse.data.pagination.total_items;

        // 获取违规商品数量
        const suspendedProductsResponse = await productService.getAllProductsForAdmin({ page: 1, limit: 1, status: 'suspended' });
        const suspendedCount = suspendedProductsResponse.data.pagination.total_items;

        // 获取今日订单数量
        // 通过获取所有订单并筛选今日订单
        const allOrdersResponse = await orderService.getAllOrders({ page: 1, limit: 100 });
        const today = new Date().toISOString().split('T')[0]; // 今天的日期
        const todayOrdersCount = allOrdersResponse.data.orders.filter(order => {
          const orderDate = new Date(order.created_at).toISOString().split('T')[0];
          return orderDate === today;
        }).length;

        // 更新统计数据
        this.stats[0].value = pendingCount;
        this.stats[1].value = suspendedCount;
        this.stats[2].value = todayOrdersCount;
        this.stats[3].value = `¥${statsData.stats.today_revenue}`;
      } catch (error) {
        console.error('获取统计信息失败:', error);
        ElMessage.error('获取统计信息失败');
      }
    },
    async loadUsers() {
      this.userLoading = true;
      try {
        const response = await userService.getAllUsers();
        this.users = response.data.users;
      } catch (error) {
        console.error('获取用户列表失败:', error);
        ElMessage.error('获取用户列表失败');
      } finally {
        this.userLoading = false;
      }
    },
    async loadAllProducts() {
      this.productLoading = true;
      try {
        // 获取所有商品
        const response = await productService.getAllProductsForAdmin({
          page: 1,
          limit: 100
        });
        this.allProducts = response.data.products;
      } catch (error) {
        console.error('获取所有商品列表失败:', error);
        ElMessage.error('获取所有商品列表失败');
      } finally {
        this.productLoading = false;
      }
    },
    async loadPendingProducts() {
      this.productLoading = true;
      try {
        // 获取所有待审核的商品（状态为inactive的商品）
        const response = await productService.getAllProductsForAdmin({
          page: 1,
          limit: 100,
          status: 'inactive' // 只获取待上架的商品
        });
        this.pendingProducts = response.data.products;
      } catch (error) {
        console.error('获取待审核商品列表失败:', error);
        ElMessage.error('获取待审核商品列表失败');
      } finally {
        this.productLoading = false;
      }
    },
    async loadSuspendedProducts() {
      this.productLoading = true;
      try {
        // 获取所有被下架的商品
        const response = await productService.getAllProductsForAdmin({
          page: 1,
          limit: 100,
          status: 'suspended' // 只获取被下架的商品
        });
        this.suspendedProducts = response.data.products;
      } catch (error) {
        console.error('获取违规商品列表失败:', error);
        ElMessage.error('获取违规商品列表失败');
      } finally {
        this.productLoading = false;
      }
    },
    async loadOrders() {
      this.orderLoading = true;
      try {
        const response = await orderService.getAllOrders({ page: 1, limit: 100 }); // 获取所有订单
        this.orders = response.data.orders.map(order => ({
          ...order,
          username: order.username || '未知用户'
        }));
      } catch (error) {
        console.error('获取订单列表失败:', error);
        ElMessage.error('获取订单列表失败');
      } finally {
        this.orderLoading = false;
      }
    },
    async deleteUser(userId) {
      try {
        await ElMessageBox.confirm(
          '确定要删除这个用户吗？此操作不可恢复。',
          '警告',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }
        );

        await userService.deleteUser(userId);
        ElMessage.success('用户删除成功');
        await this.loadUsers(); // 重新加载用户列表
      } catch {
        // 用户取消操作
      }
    },
    async suspendProduct(product) {
      try {
        await ElMessageBox.confirm(
          `确定要下架商品 "${product.name}" 吗？该商品将对买家不可见。`,
          '确认下架',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }
        );

        await adminService.suspendProduct(product.id); // 使用管理员服务下架商品
        ElMessage.success('商品已下架');
        await this.loadAllProducts(); // 重新加载所有商品列表
        await this.loadSuspendedProducts(); // 同时更新违规商品列表
      } catch {
        // 用户取消操作
      }
    },
    async approveProduct(product) {
      try {
        await ElMessageBox.confirm(
          `确定要批准商品 "${product.name}" 上架吗？该商品将对所有买家可见。`,
          '确认批准',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }
        );

        await adminService.approveProduct(product.id); // 使用管理员服务批准商品
        ElMessage.success('商品已批准上架');
        await this.loadPendingProducts(); // 重新加载待审核商品列表
        await this.loadAllProducts(); // 同时更新所有商品列表
      } catch {
        // 用户取消操作
      }
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

        await adminService.restoreProduct(product.id); // 使用管理员服务恢复商品
        ElMessage.success('商品已恢复');
        await this.loadSuspendedProducts(); // 重新加载违规商品列表
        await this.loadAllProducts(); // 同时更新所有商品列表
      } catch {
        // 用户取消操作
      }
    },
    async updateOrderStatus(order) {
      const statusOptions = [
        { label: '待支付', value: 'pending' },
        { label: '已支付', value: 'paid' },
        { label: '已发货', value: 'shipped' },
        { label: '已收货', value: 'delivered' },
        { label: '已取消', value: 'cancelled' }
      ];

      try {
        const { value } = await ElMessageBox.prompt(
          '请选择新的订单状态',
          '修改订单状态',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            inputType: 'select',
            inputValue: order.status,
            inputOptions: statusOptions
          }
        );

        await orderService.updateOrderStatus(order.id, { status: value });
        ElMessage.success('订单状态更新成功');
        await this.loadOrders(); // 重新加载订单列表
      } catch {
        // 用户取消操作或验证失败
      }
    },
    async loadRevenueStats() {
      this.productLoading = true;
      try {
        const response = await adminService.getSellerRevenueStats();
        this.revenueStats = response.data.revenue_stats;
      } catch (error) {
        console.error('获取收入统计失败:', error);
        ElMessage.error('获取收入统计失败');
      } finally {
        this.productLoading = false;
      }
    },
    getRoleType(role) {
      switch(role) {
        case 'admin':
          return 'danger';
        case 'seller':
          return 'warning';
        case 'buyer':
          return 'info';
        default:
          return 'info';
      }
    },
    getRoleDisplayName(role) {
      switch(role) {
        case 'admin':
          return '管理员';
        case 'seller':
          return '商家';
        case 'buyer':
          return '买家';
        default:
          return role;
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
.admin-panel {
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

.price, .amount {
  font-weight: bold;
  color: #e74c3c;
}
</style>