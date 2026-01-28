<template>
  <div class="auth-container">
    <el-row type="flex" justify="center" align="middle" style="min-height: 80vh;">
      <el-col :xs="20" :sm="16" :md="12" :lg="10" :xl="8">
        <el-card class="auth-card">
          <div slot="header" class="auth-header">
            <h2>用户注册</h2>
          </div>
          
          <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef" label-width="80px">
            <el-form-item label="用户名" prop="username">
              <el-input 
                v-model="registerForm.username" 
                placeholder="请输入用户名"
                :prefix-icon="User"
              />
            </el-form-item>
            
            <el-form-item label="邮箱" prop="email">
              <el-input 
                v-model="registerForm.email" 
                placeholder="请输入邮箱"
                :prefix-icon="Message"
              />
            </el-form-item>
            
            <el-form-item label="密码" prop="password">
              <el-input 
                v-model="registerForm.password" 
                type="password" 
                placeholder="请输入密码"
                :prefix-icon="Lock"
              />
            </el-form-item>
            
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input 
                v-model="registerForm.confirmPassword" 
                type="password" 
                placeholder="请再次输入密码"
                :prefix-icon="Lock"
                @keyup.enter="handleRegister"
              />
            </el-form-item>
            
            <el-form-item label="角色" prop="role">
              <el-radio-group v-model="registerForm.role">
                <el-radio label="buyer">买家</el-radio>
                <el-radio label="seller">商家</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item>
              <el-button 
                type="primary" 
                @click="handleRegister" 
                :loading="loading"
                style="width: 100%;"
              >
                注册
              </el-button>
            </el-form-item>
            
            <div class="auth-footer">
              <span>已有账户？</span>
              <router-link to="/login">立即登录</router-link>
            </div>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref } from 'vue';
import { User, Message, Lock } from '@element-plus/icons-vue';
import { useRegister } from '@/composables/useRegister';
import { ElMessage } from 'element-plus';

export default {
  name: 'Register',
  setup() {
    const registerFormRef = ref(null);
    const {
      loading,
      registerForm,
      registerRules,
      handleRegister
    } = useRegister();

    const handleRegisterClick = async () => {
      // 定义验证函数，由composable调用
      const validateForm = async () => {
        if (!registerFormRef.value) {
          ElMessage.error('表单引用未找到，请稍后重试');
          return false;
        }

        try {
          const valid = await registerFormRef.value.validate().catch(() => false);
          return valid;
        } catch (error) {
          console.error('表单验证错误:', error);
          return false;
        }
      };

      await handleRegister(validateForm);
    };

    return {
      User,
      Message,
      Lock,
      loading,
      registerForm,
      registerRules,
      handleRegister: handleRegisterClick,
      registerFormRef
    };
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/register.scss';
</style>