import { reactive, toRefs } from 'vue';
import { useUserStore } from '@/stores/user';
import { mapActions } from 'pinia';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';

export function useLogin() {
  const router = useRouter();
  const userStore = useUserStore();
  
  const state = reactive({
    loading: false,
    loginForm: {
      username: '',
      password: '',
    },
    loginRules: {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
      ],
    },
  });

  const handleLogin = async (validateForm) => {
    state.loading = true;
    try {
      // 调用传入的验证函数
      const valid = await validateForm();
      if (valid) {
        const result = await userStore.login(state.loginForm);
        if (result.success) {
          ElMessage.success('登录成功');
          // 登录成功后重定向到首页或其他页面
          router.push('/');
        } else {
          ElMessage.error(result.error || '登录失败');
        }
      } else {
        ElMessage.error('请填写正确的表单信息');
      }
    } catch (error) {
      console.error('登录验证错误:', error);
      ElMessage.error('表单验证失败');
    } finally {
      state.loading = false;
    }
  };

  return {
    ...toRefs(state),
    handleLogin
  };
}