<template>
  <div class="products">
    <el-row :gutter="20">
      <el-col :span="24">
        <div class="page-header">
          <h2>商品列表</h2>
          <el-input
            v-model="searchQuery"
            placeholder="搜索商品..."
            style="width: 300px;"
            @keyup.enter="performSearch"
            :suffix-icon="Search"
          >
            <template #append>
              <el-button @click="performSearch" type="primary" :icon="Search">搜索</el-button>
            </template>
          </el-input>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-skeleton :loading="loading" :count="6" animated>
          <template #template>
            <el-col :span="6" v-for="i in 8" :key="i" style="margin-bottom: 20px;">
              <el-skeleton-item variant="image" style="width: 100%; height: 200px;" />
              <div style="padding: 10px;">
                <el-skeleton-item variant="h3" style="width: 70%;" />
                <el-skeleton-item variant="text" style="width: 40%; margin-top: 10px;" />
              </div>
            </el-col>
          </template>
          <template #default>
            <el-row :gutter="20">
              <el-col 
                :span="6" 
                v-for="product in products" 
                :key="product.id"
                style="margin-bottom: 20px;"
              >
                <el-card 
                  :body-style="{ padding: '10px' }" 
                  class="product-card"
                  @click="goToProductDetail(product.id)"
                >
                  <div class="product-image">
                    <img 
                      :src="product.image_url || '/placeholder-image.jpg'" 
                      :alt="product.name"
                      style="width: 100%; height: 200px; object-fit: cover;"
                    >
                  </div>
                  <div class="product-info">
                    <h4 class="product-name">{{ product.name }}</h4>
                    <p class="product-description">{{ product.description?.substring(0, 50) + '...' || '' }}</p>
                    <div class="product-footer">
                      <span class="product-price">¥{{ product.price }}</span>
                      <el-button
                        v-if="user?.role === 'buyer'"
                        type="primary"
                        size="small"
                        @click.stop="addToCart(product.id)"
                        :disabled="product.stock_quantity <= 0"
                      >
                        {{ product.stock_quantity > 0 ? '加入购物车' : '缺货' }}
                      </el-button>
                      <el-button
                        v-else-if="user?.role === 'admin'"
                        type="danger"
                        size="small"
                        @click.stop="suspendProduct(product.id)"
                        :disabled="product.status === 'suspended'"
                      >
                        {{ product.status === 'suspended' ? '已下架' : '下架' }}
                      </el-button>
                      <el-button
                        v-else-if="user?.role === 'seller' && product.seller_id === user.id"
                        type="warning"
                        size="small"
                        @click.stop="editProduct(product.id)"
                      >
                        编辑
                      </el-button>
                      <el-button
                        v-else-if="user?.role === 'seller' && product.seller_id !== user.id"
                        type="info"
                        size="small"
                        disabled
                      >
                        他人的商品
                      </el-button>
                    </div>
                    <div class="seller-info">
                      <small>商家: {{ product.seller_name || '未知' }}</small>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </template>
        </el-skeleton>
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

    <!-- 热门商品推荐 -->
    <el-row :gutter="20" style="margin-top: 40px;">
      <el-col :span="24">
        <h3>热门商品推荐</h3>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col
        :span="6"
        v-for="recommendedProduct in recommendedProducts"
        :key="recommendedProduct.id"
        style="margin-bottom: 20px;"
      >
        <el-card
          :body-style="{ padding: '10px' }"
          class="product-card"
          @click="goToProductDetail(recommendedProduct.id)"
        >
          <div class="product-image">
            <img
              :src="recommendedProduct.image_url || '/placeholder-image.jpg'"
              :alt="recommendedProduct.name"
              style="width: 100%; height: 200px; object-fit: cover;"
            >
          </div>
          <div class="product-info">
            <h4 class="product-name">{{ recommendedProduct.name }}</h4>
            <p class="product-description">{{ recommendedProduct.description?.substring(0, 50) + '...' || '' }}</p>
            <div class="product-footer">
              <span class="product-price">¥{{ recommendedProduct.price }}</span>
              <el-button
                v-if="user?.role === 'buyer'"
                type="primary"
                size="small"
                @click.stop="addToCart(recommendedProduct.id)"
                :disabled="recommendedProduct.stock_quantity <= 0"
              >
                {{ recommendedProduct.stock_quantity > 0 ? '加入购物车' : '缺货' }}
              </el-button>
              <el-button
                v-else-if="user?.role === 'admin'"
                type="info"
                size="small"
                disabled
              >
                管理员
              </el-button>
              <el-button
                v-else-if="user?.role === 'seller'"
                type="warning"
                size="small"
                disabled
              >
                商家
              </el-button>
            </div>
            <div class="seller-info">
              <small>商家: {{ recommendedProduct.seller_name || '未知' }}</small>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { Search } from '@element-plus/icons-vue';
import { useProducts } from '@/composables/useProducts';

export default {
  name: 'Products',
  setup() {
    const {
      searchQuery,
      currentPage,
      recommendedProducts,
      products,
      loading,
      pagination,
      user,
      performSearch,
      handlePageChange,
      addToCart,
      goToProductDetail,
      suspendProduct,
      loadRecommendedProducts,
      editProduct
    } = useProducts();

    return {
      Search,
      searchQuery,
      currentPage,
      recommendedProducts,
      products,
      loading,
      pagination,
      user,
      performSearch,
      handlePageChange,
      addToCart,
      goToProductDetail,
      suspendProduct,
      loadRecommendedProducts,
      editProduct
    };
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/products.scss';
</style>