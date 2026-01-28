<template>
  <div class="orders">
    <el-row :gutter="20">
      <el-col :span="24">
        <h2>我的订单</h2>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-table 
          :data="orders" 
          style="width: 100%" 
          v-loading="loading"
          empty-text="暂无订单"
        >
          <el-table-column prop="id" label="订单号" width="100" />
          
          <el-table-column prop="total_amount" label="总金额" width="120">
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
          
          <el-table-column prop="created_at" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          
          <el-table-column label="订单商品" min-width="300">
            <template #default="{ row }">
              <div class="order-items">
                <div 
                  v-for="item in row.items" 
                  :key="item.product_id"
                  class="order-item"
                >
                  <span>{{ item.product_name }}</span>
                  <span>x{{ item.quantity }}</span>
                  <span>¥{{ item.price }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button 
                size="small"
                @click="viewOrder(row.id)"
              >
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-col>
    </el-row>

    <!-- 分页 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24" style="text-align: center;">
        <el-pagination
          @current-change="handlePageChange"
          :current-page="pagination.current_page"
          :page-size="pagination.items_per_page"
          layout="total, prev, pager, next, jumper"
          :total="pagination.total_items"
        />
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { useOrders } from '@/composables/useOrders';

export default {
  name: 'Orders',
  setup() {
    const {
      orders,
      loading,
      pagination,
      getStatusType,
      getStatusText,
      formatDate,
      handlePageChange,
      viewOrder
    } = useOrders();

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
}
</script>

<style scoped lang="scss">
@use '@/styles/orders.scss';
</style>