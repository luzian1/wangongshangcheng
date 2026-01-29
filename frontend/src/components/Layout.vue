<template>
  <div class="layout">
    <el-container>
      <el-header>
        <div class="header-content">
          <h1 class="logo">皖工购物网</h1>
          <div class="nav-links">
            <router-link to="/" class="nav-link">首页</router-link>
            <router-link to="/products" class="nav-link">商品</router-link>

            <!-- 买家功能 -->
            <template v-if="userRole === 'buyer'">
              <router-link to="/cart" class="nav-link">购物车 ({{ cartItemCount }})</router-link>
              <router-link to="/orders" class="nav-link">我的订单</router-link>
            </template>

            <!-- 商家功能 -->
            <template v-else-if="userRole === 'seller'">
              <router-link to="/seller/dashboard" class="nav-link">商家中心</router-link>
              <router-link to="/seller/products" class="nav-link">商品管理</router-link>
            </template>

            <!-- 管理员功能 -->
            <template v-else-if="userRole === 'admin'">
              <router-link to="/admin/panel" class="nav-link">管理面板</router-link>
            </template>

            <div v-if="!isLoggedIn" class="auth-links">
              <router-link to="/login" class="nav-link">登录</router-link>
              <router-link to="/register" class="nav-link">注册</router-link>
            </div>
            <div v-else class="user-info">
              <span>欢迎, {{ currentUser.username }} ({{ getRoleDisplayName(userRole) }})</span>
              <el-button type="text" @click="logout" class="logout-btn">退出</el-button>
            </div>
          </div>
        </div>
      </el-header>

      <el-main>
        <router-view />
      </el-main>

      <el-footer>
        <div class="footer-content">
          <p>© 2025 皖工购物网系统. 保留所有权利.</p>
        </div>
      </el-footer>
    </el-container>
  </div>
</template>

<script>
import { useUserStore } from '@/stores/user';
import { useCartStore } from '@/stores/cart';
import { mapState, mapActions } from 'pinia';

export default {
  name: 'Layout',
  computed: {
    ...mapState(useUserStore, ['user', 'isAuthenticated']),
    ...mapState(useCartStore, ['itemCount']),
    currentUser() {
      return useUserStore().user;
    },
    isLoggedIn() {
      return useUserStore().isAuthenticated;
    },
    userRole() {
      return useUserStore().user?.role || '';
    },
    cartItemCount() {
      return useCartStore().itemCount;
    }
  },
  methods: {
    ...mapActions(useUserStore, ['logout']),
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
    }
  },
  async mounted() {
    // 初始化认证状态
    useUserStore().initializeAuth();
    // 如果已登录且是买家，获取购物车
    if (this.isLoggedIn && this.userRole === 'buyer') {
      await useCartStore().fetchCart();
    }
  }
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
}

.el-header {
  background-color: #409EFF;
  padding: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  color: white;
}

.logo {
  margin: 0;
  font-size: 1.5em;
}

.nav-links {
  display: flex;
  align-items: center;
}

.nav-link {
  color: white;
  text-decoration: none;
  margin-left: 20px;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.nav-link:hover,
.nav-link.router-link-active {
  background-color: rgba(255, 255, 255, 0.2);
}

.auth-links {
  display: flex;
}

.user-info {
  display: flex;
  align-items: center;
}

.logout-btn {
  color: white !important;
  margin-left: 15px;
}

.el-main {
  padding: 20px;
}

.el-footer {
  background-color: #f5f5f5;
  padding: 20px;
  text-align: center;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
}
</style>