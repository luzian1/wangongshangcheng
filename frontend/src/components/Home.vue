<template>
  <div class="home">
    <el-row :gutter="20">
      <el-col :span="24">
        <div class="banner">
          <h2 v-if="!userRole || userRole === 'buyer'">欢迎来到简易在线商城</h2>
          <h2 v-else-if="userRole === 'seller'">欢迎来到商家中心</h2>
          <h2 v-else-if="userRole === 'admin'">欢迎来到管理控制台</h2>
          <p v-if="!userRole || userRole === 'buyer'">发现优质商品，享受便捷购物体验</p>
          <p v-else-if="userRole === 'seller'">管理您的商品，查看销售数据，提升您的业务</p>
          <p v-else-if="userRole === 'admin'">监控系统状态，管理用户和商品，维护平台秩序</p>
        </div>
      </el-col>
    </el-row>

    <!-- 对于买家显示轮播图 -->
    <template v-if="!userRole || userRole === 'buyer'">
      <!-- 轮播图部分 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="24">
          <div class="swiper-section">
            <swiper
              :modules="modules"
              :slides-per-view="3"
              :centered-slides="true"
              :space-between="20"
              :loop="true"
              :loopAdditionalSlides="1"
              :speed="800"
              :autoplay="{
                delay: 2500,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }"
              :effect="'slide'"
              :grab-cursor="true"
              :pagination="{
                clickable: true,
                dynamicBullets: true
              }"
              :navigation="true"
              @swiper="onSwiper"
              @slide-change="onSlideChange"
              class="mySwiper"
              :breakpoints="{
                640: {
                  slidesPerView: 1,
                  spaceBetween: 10,
                },
                768: {
                  slidesPerView: 2,
                  spaceBetween: 20,
                },
                1024: {
                  slidesPerView: 3,
                  spaceBetween: 30,
                },
              }"
            >
              <swiper-slide v-for="(product, index) in hotProductsExtended" :key="getSlideKey(product.id, index)" :class="{ 'swiper-slide-active': activeIndex === index }">
                <div class="swiper-slide-content" :class="{ 'active-slide': activeIndex === index }">
                  <img
                    :src="product.image_url || '/placeholder-image.jpg'"
                    :alt="product.name"
                    class="swiper-image"
                    @click="goToProductDetail(getOriginalProductId(product.id))"
                  >
                  <div class="swiper-overlay">
                    <h3>{{ product.name }}</h3>
                    <p>{{ product.description?.substring(0, 100) + '...' || '' }}</p>
                    <div class="swiper-price">¥{{ product.price }}</div>
                    <el-button
                      type="primary"
                      @click.stop="addToCart(getOriginalProductId(product.id))"
                      :disabled="product.stock_quantity <= 0"
                    >
                      {{ product.stock_quantity > 0 ? '立即购买' : '缺货' }}
                    </el-button>
                  </div>
                </div>
              </swiper-slide>
            </swiper>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 40px;">
        <el-col :span="24">
          <div class="search-section">
            <el-input
              v-model="searchQuery"
              placeholder="搜索商品..."
              size="large"
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

      <el-row :gutter="20" style="margin-top: 40px;">
        <el-col :span="24">
          <div class="section-title">
            <h3>热门商品</h3>
            <el-divider />
          </div>
          <el-skeleton :loading="loading" :count="6" animated>
            <template #template>
              <el-row :gutter="20">
                <el-col :span="6" v-for="i in 4" :key="i" style="margin-bottom: 20px;">
                  <el-skeleton-item variant="image" style="width: 100%; height: 250px; border-radius: 8px;" />
                  <div style="padding: 15px 0;">
                    <el-skeleton-item variant="h3" style="width: 80%; height: 24px; margin-bottom: 10px;" />
                    <el-skeleton-item variant="text" style="width: 60%; height: 18px;" />
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                      <el-skeleton-item variant="text" style="width: 30%; height: 22px;" />
                      <el-skeleton-item variant="button" style="width: 80px; height: 32px;" />
                    </div>
                  </div>
                </el-col>
              </el-row>
            </template>
            <template #default>
              <el-row :gutter="20">
                <el-col
                  :span="6"
                  v-for="product in products.slice(0, 4)"
                  :key="product.id"
                  style="margin-bottom: 20px;"
                >
                  <el-card
                    :body-style="{ padding: '0' }"
                    class="product-card"
                    @click="goToProductDetail(product.id)"
                  >
                    <div class="product-image">
                      <img
                        :src="product.image_url || '/placeholder-image.jpg'"
                        :alt="product.name"
                        style="width: 100%; height: 250px; object-fit: cover; border-top-left-radius: 4px; border-top-right-radius: 4px;"
                      >
                    </div>
                    <div class="product-info">
                      <h4 class="product-name">{{ product.name }}</h4>
                      <p class="product-description">{{ product.description?.substring(0, 50) + '...' || '' }}</p>
                      <div class="product-footer">
                        <span class="product-price">¥{{ product.price }}</span>
                        <el-button
                          type="primary"
                          size="small"
                          @click.stop="addToCart(product.id)"
                          :disabled="product.stock_quantity <= 0"
                        >
                          {{ product.stock_quantity > 0 ? '加入购物车' : '缺货' }}
                        </el-button>
                      </div>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </template>
          </el-skeleton>
        </el-col>
      </el-row>
    </template>

    <!-- 对于商家显示快捷操作 -->
    <template v-else-if="userRole === 'seller'">
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="24">
          <div class="welcome-section">
            <h3>快速开始</h3>
            <p>开始管理您的商品和业务</p>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="6" v-for="action in sellerQuickActions" :key="action.title">
          <el-card class="action-card" @click="action.handler">
            <div class="action-content">
              <div class="action-icon">
                <el-icon :size="40" color="#409EFF">
                  <component :is="action.icon" />
                </el-icon>
              </div>
              <div class="action-info">
                <h4>{{ action.title }}</h4>
                <p>{{ action.description }}</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </template>

    <!-- 对于管理员显示系统概览 -->
    <template v-else-if="userRole === 'admin'">
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="24">
          <div class="welcome-section">
            <h3>系统概览</h3>
            <p>监控平台运行状态和关键指标</p>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="6" v-for="stat in adminStats" :key="stat.title">
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
        <el-col :span="24">
          <div class="admin-actions">
            <el-button type="primary" size="large" @click="$router.push('/admin/panel')" style="margin-right: 15px;">
              管理面板
            </el-button>
            <el-button type="success" size="large" @click="$router.push('/admin/panel')">
              查看违规商品
            </el-button>
          </div>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { Search, Plus, List, DataAnalysis, Monitor } from '@element-plus/icons-vue';
import { useHome } from '@/composables/useHome';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Autoplay, Pagination, Navigation, Controller } from 'swiper/modules';

// 导入 Swiper 样式
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

export default {
  name: 'Home',
  components: {
    Swiper,
    SwiperSlide,
  },
  setup() {
    const {
      searchQuery,
      sellerQuickActions,
      adminStats,
      products,
      loading,
      user,
      isAuthenticated,
      userRole,
      performSearch,
      addToCart,
      goToProductDetail,
      loadAdminStats,
      hotProducts // 新增热门商品数据
    } = useHome();

    // Swiper 模块
    const modules = [Autoplay, Pagination, Navigation, Controller];

    // 当前激活的索引
    const activeIndex = ref(0);

    // 创建循环序列，实现 123->234->341->412->123 的循环效果
    const hotProductsExtended = computed(() => {
      if (!hotProducts.value || hotProducts.value.length === 0) return [];

      const products = [...hotProducts.value];
      const totalProducts = products.length;

      if (totalProducts === 0) return [];

      // 如果是4个商品，创建循环序列
      if (totalProducts === 4) {
        // 为了实现 ABC -> BCD -> CDA -> DAB -> ABC 的循环
        // 我们需要创建一个包含所有可能三元组的序列
        // 在Swiper中，为了实现无缝循环，我们需要确保有足够的幻灯片
        // 让我们创建一个扩展序列，使循环更平滑
        const extended = [];

        // 复制原始商品三次，以确保循环效果
        // 这样可以实现更自然的循环过渡
        for (let copy = 0; copy < 3; copy++) {
          for (let i = 0; i < totalProducts; i++) {
            extended.push({
              ...products[i],
              id: `${products[i].id}-copy-${copy}`,
              originalIndex: i
            });
          }
        }

        return extended;
      }

      return products;
    });

    const getSlideKey = (id, index) => {
      return `slide-${id}-${index}`;
    };

    // 从扩展ID中提取原始商品ID
    const getOriginalProductId = (extendedId) => {
      // 如果ID包含"-copy-"后缀，则提取原始ID
      if (typeof extendedId === 'string' && extendedId.includes('-copy-')) {
        // 提取"-copy-"之前的原始ID部分
        return parseInt(extendedId.split('-copy-')[0]);
      }
      return extendedId;
    };

    // Swiper 事件处理
    const onSwiper = (swiper) => {
      console.log(swiper);
      window.swiperInstance = swiper; // 保存Swiper实例以便手动控制
    };

    const onSlideChange = (swiper) => {
      // 在循环模式下，实际的索引可能超出原数组范围
      // 需要计算出在原数组中的实际索引
      if (hotProducts.value && hotProducts.value.length > 0) {
        const realIndex = swiper.realIndex % hotProducts.value.length;
        activeIndex.value = realIndex;
      } else {
        activeIndex.value = swiper.activeIndex;
      }
      console.log('slide change', swiper.activeIndex, 'real index:', swiper.realIndex);
    };


    return {
      Search,
      Plus,
      List,
      DataAnalysis,
      Monitor,
      Swiper,
      SwiperSlide,
      modules,
      onSwiper,
      onSlideChange,
      activeIndex,
      searchQuery,
      sellerQuickActions,
      adminStats,
      products,
      loading,
      user,
      isAuthenticated,
      userRole,
      performSearch,
      addToCart,
      goToProductDetail,
      loadAdminStats,
      hotProducts,
      hotProductsExtended,
      getSlideKey,
      getOriginalProductId
    };
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/home.scss';
</style>