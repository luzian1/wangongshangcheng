import { reactive, toRefs, computed, onMounted } from 'vue';
import { useProductsStore } from '@/stores/products';
import { mapState } from 'pinia';
import { ElMessage } from 'element-plus';
import { useRouter, useRoute } from 'vue-router';

export function useEditProduct() {
  const router = useRouter();
  const route = useRoute();
  const productsStore = useProductsStore();
  
  const state = reactive({
    productId: null,
    submitting: false,
    productForm: {
      name: '',
      description: '',
      price: 0,
      stock_quantity: 0,
      image_url: '',
      status: 'active'
    },
    productRules: {
      name: [
        { required: true, message: '请输入商品名称', trigger: 'blur' },
        { min: 1, max: 255, message: '商品名称长度在1到255个字符', trigger: 'blur' }
      ],
      price: [
        { required: true, message: '请输入价格', trigger: 'blur' },
        { type: 'number', min: 0.01, message: '价格必须大于0', trigger: 'blur' }
      ],
      stock_quantity: [
        { required: true, message: '请输入库存', trigger: 'blur' },
        { type: 'number', min: 0, message: '库存必须大于等于0', trigger: 'blur' }
      ]
    },
  });

  const uploadUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/upload/image`; // 图片上传地址

  const userRole = computed(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role || '';
  });

  const uploadHeaders = computed(() => {
    return {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    };
  });

  const loading = computed(() => productsStore.loading);

  const loadProduct = async () => {
    try {
      state.productId = route.params.id;
      const result = await productsStore.fetchProductById(state.productId);
      if (result.success) {
        // 只复制需要编辑的字段，避免将额外字段（如seller_name等）复制到表单中
        const product = result.data.product;
        state.productForm = {
          name: product.name,
          description: product.description || '',
          price: product.price,
          stock_quantity: product.stock_quantity,
          image_url: product.image_url || '',
          status: product.status
        };
      } else {
        ElMessage.error(result.error || '获取商品信息失败');
        goBack();
      }
    } catch (error) {
      console.error('加载商品信息失败:', error);
      ElMessage.error('加载商品信息失败');
      goBack();
    }
  };

  const submitForm = async (validateForm) => {
    state.submitting = true;
    try {
      const valid = await validateForm();
      if (valid) {
        const result = await productsStore.updateProduct(state.productId, state.productForm);
        if (result.success) {
          ElMessage.success('商品更新成功');
          goBack();
        } else {
          ElMessage.error(result.error || '更新失败');
        }
      } else {
        ElMessage.error('请填写正确的表单信息');
      }
    } catch (error) {
      console.error('表单验证错误:', error);
      ElMessage.error('请检查表单数据');
    } finally {
      state.submitting = false;
    }
  };

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

  const goBack = () => {
    router.go(-1);
  };

  // 组件挂载时加载商品信息
  onMounted(async () => {
    await loadProduct();
  });

  return {
    ...toRefs(state),
    uploadUrl,
    userRole,
    uploadHeaders,
    loading,
    loadProduct,
    submitForm,
    handleImageSuccess,
    beforeImageUpload,
    goBack
  };
}