<template>
  <div class="seller-home">
    <el-row :gutter="20">
      <el-col :span="24">
        <h2>欢迎来到商家中心</h2>
        <p>管理您的商品，查看销售数据，提升您的业务</p>
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
              <span>最近商品</span>
              <el-button type="primary" @click="$router.push('/seller/products')">管理商品</el-button>
            </div>
          </template>

          <el-table :data="recentProducts" style="width: 100%" v-loading="productsLoading">
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
            <el-table-column prop="created_at" label="创建时间" width="180">
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
              <span>快捷操作</span>
            </div>
          </template>

          <div class="quick-actions">
            <el-button type="primary" size="large" @click="$router.push('/seller/products/new')" style="width: 100%; margin-bottom: 15px;">
              <el-icon><Plus /></el-icon>
              添加新商品
            </el-button>
            <el-button type="success" size="large" @click="$router.push('/seller/products')" style="width: 100%; margin-bottom: 15px;">
              <el-icon><List /></el-icon>
              管理商品
            </el-button>
            <el-button type="info" size="large" @click="viewSalesReport" style="width: 100%;">
              <el-icon><DataAnalysis /></el-icon>
              查看销售报告
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { productService } from '@/services/productService';
import { ElMessage } from 'element-plus';
import { Plus, List, DataAnalysis } from '@element-plus/icons-vue';

export default {
  name: 'SellerHome',
  components: {
    Plus,
    List,
    DataAnalysis
  },
  data() {
    return {
      stats: [
        { title: '商品总数', value: 0, description: '我发布的商品数量' },
        { title: '上架商品', value: 0, description: '当前上架的商品数' },
        { title: '待审核商品', value: 0, description: '等待审核的商品数' },
        { title: '违规商品', value: 0, description: '被平台下架的商品数' }
      ],
      recentProducts: [],
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
        this.loadRecentProducts()
      ]);
    },
    async loadStats() {
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
    async loadRecentProducts() {
      this.productsLoading = true;
      try {
        const response = await productService.getSellerProducts({
          page: 1,
          limit: 5  // 只显示最近的5个商品
        });
        this.recentProducts = response.data.products;
      } catch (error) {
        console.error('获取最近商品失败:', error);
        ElMessage.error('获取最近商品失败');
      } finally {
        this.productsLoading = false;
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
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN');
    },
    viewSalesReport() {
      ElMessage.info('销售报告功能即将推出');
    }
  }
}
</script>

<style scoped>
.seller-home {
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

.quick-actions {
  display: flex;
  flex-direction: column;
}
</style>