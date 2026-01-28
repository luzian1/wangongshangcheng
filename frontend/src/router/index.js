import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/components/Home.vue'
import Products from '@/components/Products.vue'
import ProductDetail from '@/components/ProductDetail.vue'
import Cart from '@/components/Cart.vue'
import Login from '@/components/Login.vue'
import Register from '@/components/Register.vue'
import Orders from '@/components/Orders.vue'
import OrderDetail from '@/components/OrderDetail.vue'
import SellerProducts from '@/components/SellerProducts.vue'
import SellerDashboard from '@/components/SellerDashboard.vue'
import SellerHome from '@/components/SellerHome.vue'
import CreateProduct from '@/components/CreateProduct.vue'
import EditProduct from '@/components/EditProduct.vue'
import AdminDashboard from '@/components/AdminDashboard.vue'
import AdminPanel from '@/components/AdminPanel.vue'
import AdminHome from '@/components/AdminHome.vue'

// 角色守卫函数
function roleGuard(requiredRole) {
  return (to, from, next) => {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    
    if (!token) {
      next('/login')
      return
    }
    
    if (user.role === requiredRole) {
      next()
    } else {
      // 如果没有权限，重定向到首页
      next('/')
    }
  }
}

// 重定向函数，根据用户角色重定向到适当的仪表板
function redirectToDashboard(to, from, next) {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  
  if (!token) {
    next('/login')
    return
  }
  
  switch(user.role) {
    case 'admin':
      next('/admin/panel')
      break
    case 'seller':
      next('/seller/dashboard')
      break
    case 'buyer':
      next('/')
      break
    default:
      next('/')
  }
}

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    beforeEnter: (to, from, next) => {
      const token = localStorage.getItem('token')
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      
      if (token && user.role) {
        // 如果用户已登录，根据角色重定向到适当的首页
        switch(user.role) {
          case 'admin':
            next('/admin/home')
            break
          case 'seller':
            next('/seller/home')
            break
          case 'buyer':
            next() // 买家访问默认首页
            break
          default:
            next()
        }
      } else {
        // 如果用户未登录，任何人都可以访问默认首页
        next()
      }
    }
  },
  {
    path: '/products',
    name: 'Products',
    component: Products
  },
  {
    path: '/products/:id',
    name: 'ProductDetail',
    component: ProductDetail,
    props: true
  },
  {
    path: '/cart',
    name: 'Cart',
    component: Cart,
    beforeEnter: roleGuard('buyer')  // 只有买家可以访问购物车
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/orders',
    name: 'Orders',
    component: Orders,
    beforeEnter: roleGuard('buyer')  // 只有买家可以访问购物车
  },
  {
    path: '/orders/:id',
    name: 'OrderDetail',
    component: OrderDetail,
    props: true,
    beforeEnter: roleGuard('buyer')  // 只有买家可以查看订单详情
  },
  {
    path: '/seller/products',
    name: 'SellerProducts',
    component: SellerProducts,
    beforeEnter: roleGuard('seller')  // 只有商家可以访问商品管理
  },
  {
    path: '/seller/products/new',
    name: 'CreateProduct',
    component: CreateProduct,
    beforeEnter: roleGuard('seller')  // 只有商家可以访问
  },
  {
    path: '/seller/products/:id/edit',
    name: 'EditProduct',
    component: EditProduct,
    beforeEnter: roleGuard('seller'),  // 只有商家可以访问
    props: true
  },
  {
    path: '/seller/dashboard',
    name: 'SellerDashboard',
    component: SellerDashboard,
    beforeEnter: roleGuard('seller')  // 只有商家可以访问
  },
  {
    path: '/seller/home',
    name: 'SellerHome',
    component: SellerHome,
    beforeEnter: roleGuard('seller')  // 只有商家可以访问
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: AdminDashboard,
    beforeEnter: roleGuard('admin')  // 只有管理员可以访问
  },
  {
    path: '/admin/panel',
    name: 'AdminPanel',
    component: AdminPanel,
    beforeEnter: roleGuard('admin')  // 只有管理员可以访问
  },
  {
    path: '/admin/home',
    name: 'AdminHome',
    component: AdminHome,
    beforeEnter: roleGuard('admin')  // 只有管理员可以访问
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    beforeEnter: redirectToDashboard,  // 根据角色重定向到适当的仪表板
    component: Home // 这个组件实际上不会被使用，因为会在beforeEnter中重定向
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router