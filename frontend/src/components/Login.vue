<template>
  <div class="auth-container">
    <el-row type="flex" justify="center" align="middle" style="min-height: 80vh;">
      <el-col :xs="20" :sm="16" :md="12" :lg="10" :xl="8">
        <el-card class="auth-card">
          <div slot="header" class="auth-header">
            <h2>用户登录</h2>
          </div>
          
          <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" label-width="80px">
            <el-form-item label="用户名" prop="username">
              <el-input 
                v-model="loginForm.username" 
                placeholder="请输入用户名"
                :prefix-icon="User"
              />
            </el-form-item>
            
            <el-form-item label="密码" prop="password">
              <el-input 
                v-model="loginForm.password" 
                type="password" 
                placeholder="请输入密码"
                :prefix-icon="Lock"
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            
            <el-form-item>
              <el-button 
                type="primary" 
                @click="handleLogin" 
                :loading="loading"
                style="width: 100%;"
              >
                登录
              </el-button>
            </el-form-item>
            
            <div class="auth-footer">
              <span>还没有账户？</span>
              <router-link to="/register">立即注册</router-link>
            </div>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref } from 'vue';
import { User, Lock } from '@element-plus/icons-vue';
import { useLogin } from '@/composables/useLogin';
import { ElMessage } from 'element-plus';

export default {
  name: 'Login',
  setup() {
    const loginFormRef = ref(null);
    const {
      loading,
      loginForm,
      loginRules,
      handleLogin
    } = useLogin();

    const handleLoginClick = async () => {
      // 定义验证函数，由composable调用
      const validateForm = async () => {
        if (!loginFormRef.value) {
          ElMessage.error('表单引用未找到，请稍后重试');
          return false;
        }

        try {
          const valid = await loginFormRef.value.validate().catch(() => false);
          return valid;
        } catch (error) {
          console.error('表单验证错误:', error);
          return false;
        }
      };

      await handleLogin(validateForm);
    };

    return {
      User,
      Lock,
      loading,
      loginForm,
      loginRules,
      handleLogin: handleLoginClick,
      loginFormRef
    };
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/login.scss';
</style>