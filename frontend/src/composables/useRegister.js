import { reactive, toRefs } from 'vue';
import { useUserStore } from '@/stores/user';
import { mapActions } from 'pinia';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';

export function useRegister() {
  const router = useRouter();
  const userStore = useUserStore();
  
  // 自定义验证规则：确认密码
  const validateConfirmPassword = (rule, value, callback, password) => {
    if (value !== password) {
      callback(new Error('两次输入的密码不一致'));
    } else {
      callback();
    }
  };

  const state = reactive({
    loading: false,
    registerForm: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'buyer',
    },
    registerRules: {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 15, message: '用户名长度在3到15个字符', trigger: 'blur' },
      ],
      email: [
        { required: true, message: '请输入邮箱地址', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' },
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
      ],
      confirmPassword: [
        { required: true, message: '请再次输入密码', trigger: 'blur' },
        { 
          validator: (rule, value, callback) => validateConfirmPassword(rule, value, callback, state.registerForm.password), 
          trigger: 'blur' 
        },
      ],
      role: [
        { required: true, message: '请选择角色', trigger: 'change' },
      ],
    },
  });

  const handleRegister = async (validateForm) => {
    state.loading = true;
    try {
      // 调用传入的验证函数
      const valid = await validateForm();
      if (valid) {
        // 准备注册数据
        const registerData = {
          username: state.registerForm.username,
          email: state.registerForm.email,
          password: state.registerForm.password,
          role: state.registerForm.role,
        };

        const result = await userStore.register(registerData);
        if (result.success) {
          ElMessage.success('注册成功，请登录');
          router.push('/login');
        } else {
          ElMessage.error(result.error || '注册失败');
        }
      } else {
        ElMessage.error('请填写正确的表单信息');
      }
    } catch (error) {
      console.error('注册验证错误:', error);
      ElMessage.error('表单验证失败');
    } finally {
      state.loading = false;
    }
  };

  return {
    ...toRefs(state),
    handleRegister
  };
}