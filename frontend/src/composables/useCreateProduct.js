import { reactive, toRefs, computed } from 'vue';
import { useProductsStore } from '@/stores/products';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';

export function useCreateProduct() {
  const router = useRouter();
  const productsStore = useProductsStore();
  
  const state = reactive({
    productForm: {
      name: '',
      description: '',
      price: 0,
      stock_quantity: 0,
      image_url: ''
    },
    rules: {
      name: [
        { required: true, message: '请输入商品名称', trigger: 'blur' },
        { min: 1, max: 100, message: '商品名称长度应在1-100之间', trigger: 'blur' }
      ],
      price: [
        { required: true, message: '请输入价格', trigger: 'blur' },
        { type: 'number', min: 0.01, message: '价格必须大于0', trigger: 'blur' }
      ],
      stock_quantity: [
        { required: true, message: '请输入库存数量', trigger: 'blur' },
        { type: 'number', min: 0, message: '库存数量不能小于0', trigger: 'blur' }
      ]
    },
    submitting: false,
  });

  const uploadUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/upload/image`; // 图片上传地址

  const uploadHeaders = computed(() => {
    return {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    };
  });

  const handleImageSuccess = (response, file) => {
    // 上传成功后更新图片URL
    if (response && response.url) {
      state.productForm.image_url = response.url;
      ElMessage.success('图片上传成功');
    } else {
      ElMessage.error('图片上传失败');
    }
  };

  const beforeImageUpload = (file) => {
    // 验证文件格式
    const isJPG = file.type === 'image/jpeg';
    const isPNG = file.type === 'image/png';
    const isLt5M = file.size / 1024 / 1024 < 5;

    if (!isJPG && !isPNG) {
      ElMessage.error('上传图片只能是 JPG 或 PNG 格式!');
      return false;
    }
    if (!isLt5M) {
      ElMessage.error('上传图片大小不能超过 5MB!');
      return false;
    }
    return true;
  };

  const submitForm = async (validateForm) => {
    try {
      const valid = await validateForm();
      if (valid) {
        state.submitting = true;
        try {
          const result = await productsStore.createProduct(state.productForm);
          if (result.success) {
            ElMessage.success('商品创建成功！商品已提交审核，等待管理员批准后上架。');
            router.push('/seller/products');
          } else {
            ElMessage.error(result.error || '商品创建失败');
          }
        } catch (error) {
          console.error('创建商品失败:', error);
          ElMessage.error('创建商品失败: ' + (error.message || '未知错误'));
        } finally {
          state.submitting = false;
        }
      } else {
        ElMessage.error('请填写正确的商品信息');
        return false;
      }
    } catch (error) {
      // 验证失败
      console.error('表单验证错误:', error);
      ElMessage.error('请填写正确的商品信息');
      return false;
    }
  };

  return {
    ...toRefs(state),
    uploadUrl,
    uploadHeaders,
    handleImageSuccess,
    beforeImageUpload,
    submitForm
  };
}