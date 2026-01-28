<template>
  <div class="cart">
    <el-row :gutter="20">
      <el-col :span="24">
        <h2>购物车</h2>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-table
          :data="cartItems"
          style="width: 100%"
          v-loading="loading"
          empty-text="购物车为空"
        >
          <el-table-column prop="name" label="商品" width="300">
            <template #default="{ row }">
              <div class="product-cell">
                <img
                  :src="row.image_url || '/placeholder-image.jpg'"
                  :alt="row.name"
                  style="width: 80px; height: 80px; object-fit: cover; margin-right: 15px;"
                >
                <div>
                  <div class="product-name">{{ row.name }}</div>
                  <div class="product-description">{{ row.description?.substring(0, 50) + '...' || '' }}</div>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="price" label="单价" width="150">
            <template #default="{ row }">
              <span class="price">¥{{ row.price }}</span>
            </template>
          </el-table-column>

          <el-table-column label="数量" width="200">
            <template #default="{ row }">
              <div class="quantity-control">
                <el-input-number
                  v-model="row.quantity"
                  :min="1"
                  :max="row.stock_quantity"
                  size="small"
                  @change="updateQuantity(row.cart_id, $event)"
                />
                <div class="stock-info">库存: {{ row.stock_quantity }}</div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="total" label="小计" width="150">
            <template #default="{ row }">
              <span class="total-price">¥{{ (row.price * row.quantity).toFixed(2) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button
                type="danger"
                size="small"
                @click="removeFromCart(row.product_id)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 30px;" v-if="cartItems.length > 0">
      <el-col :span="24">
        <div class="cart-summary">
          <div class="summary-info">
            <div class="total-items">商品总数: {{ itemCount }}</div>
            <div class="total-amount">总计: <span class="amount">¥{{ totalAmount.toFixed(2) }}</span></div>
          </div>
          <div class="summary-actions">
            <el-button
              type="primary"
              @click="continueShopping"
              :disabled="loading"
            >
              继续购物
            </el-button>
            <el-button
              type="success"
              size="large"
              @click="createOrder"
              :disabled="loading"
            >
              提交订单
            </el-button>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { useCart } from '@/composables/useCart';

export default {
  name: 'Cart',
  setup() {
    const {
      cartItems,
      totalAmount,
      itemCount,
      loading,
      updateQuantity,
      removeFromCart,
      createOrder,
      continueShopping
    } = useCart();

    return {
      cartItems,
      totalAmount,
      itemCount,
      loading,
      updateQuantity,
      removeFromCart,
      createOrder,
      continueShopping
    };
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/cart.scss';
</style>