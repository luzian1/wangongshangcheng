<template>
  <div class="product-detail" v-if="currentProduct">
    <el-row :gutter="30">
      <el-col :span="12">
        <div class="product-image">
          <img
            :src="currentProduct.image_url || '/placeholder-image.jpg'"
            :alt="currentProduct.name"
            style="width: 100%; height: 400px; object-fit: cover;"
          >
        </div>
      </el-col>

      <el-col :span="12">
        <div class="product-info">
          <h1>{{ currentProduct.name }}</h1>
          <div class="product-meta">
            <span class="product-price">¥{{ currentProduct.price }}</span>
            <span class="product-stock" :class="{ 'out-of-stock': currentProduct.stock_quantity <= 0 }">
              {{ currentProduct.stock_quantity > 0 ? `库存: ${currentProduct.stock_quantity}` : '缺货' }}
            </span>
          </div>

          <div class="seller-info">
            <p><strong>商家:</strong> {{ currentProduct.seller_name || '未知' }}</p>
          </div>

          <div class="product-description">
            <h3>商品描述</h3>
            <p>{{ currentProduct.description || '暂无描述' }}</p>
          </div>

          <div class="product-actions" v-if="currentProduct.stock_quantity > 0">
            <el-input-number
              v-if="user?.role === 'buyer'"
              v-model="quantity"
              :min="1"
              :max="currentProduct.stock_quantity"
              style="margin-right: 15px;"
            />
            <el-button
              v-if="user?.role === 'buyer'"
              type="primary"
              size="large"
              @click="addToCart(currentProduct.id)"
              :disabled="quantity <= 0"
            >
              加入购物车
            </el-button>
            <el-button
              v-else-if="user?.role === 'admin'"
              type="danger"
              size="large"
              @click="suspendProduct(currentProduct.id)"
            >
              下架商品
            </el-button>
            <el-button
              v-else-if="user?.role === 'seller' && currentProduct.seller_id === user.id"
              type="warning"
              size="large"
              @click="editProduct(currentProduct.id)"
            >
              编辑商品
            </el-button>
          </div>

          <div class="out-of-stock-message" v-else>
            <el-alert
              title="该商品暂时缺货"
              type="warning"
              :closable="false"
              show-icon
            />
          </div>
        </div>
      </el-col>
    </el-row>
  </div>

  <div v-else class="loading-container" v-loading="loading">
    <div v-if="!loading && !currentProduct" class="error-message">
      <el-alert
        title="商品不存在或已下架"
        type="error"
        :closable="false"
        show-icon
      />
      <el-button @click="$router.push('/products')" type="primary" style="margin-top: 20px;">返回商品列表</el-button>
    </div>
  </div>
</template>

<script>
import { useProductDetail } from '@/composables/useProductDetail';
import { useRouter } from 'vue-router';

export default {
  name: 'ProductDetail',
  setup() {
    const {
      quantity,
      currentProduct,
      loading,
      user,
      loadProduct,
      addToCart,
      suspendProduct,
      editProduct
    } = useProductDetail();

    const router = useRouter();

    const handleEditProduct = (productId) => {
      if (currentProduct.value && currentProduct.value.seller_id === user.value.id) {
        router.push(`/seller/products/${productId}/edit`);
      } else {
        // 这里需要使用ElMessage，但由于在setup中，我们稍后在方法中处理
      }
    };

    return {
      quantity,
      currentProduct,
      loading,
      user,
      loadProduct,
      addToCart,
      suspendProduct,
      editProduct: handleEditProduct
    };
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/product-detail.scss';
</style>