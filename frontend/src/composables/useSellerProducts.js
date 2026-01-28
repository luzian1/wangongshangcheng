import { reactive, toRefs, computed, onMounted } from 'vue';
import { useProductsStore } from '@/stores/products';
import { mapState } from 'pinia';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRouter } from 'vue-router';

export function useSellerProducts() {
  const router = useRouter();
  const productsStore = useProductsStore();
  
  const state = reactive({
    showCreateForm: false,
    isEditing: false,
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
    currentProductId: null,
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

  const products = computed(() => productsStore.products);
  const loading = computed(() => productsStore.loading);

  const getStatusType = (status) => {
    switch(status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'info';
      case 'suspended':
        return 'danger';
      default:
        return 'info';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'active':
        return '上架';
      case 'inactive':
        return '待审核';
      case 'suspended':
        return '违规';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  const editProduct = (product) => {
    state.isEditing = true;
    state.currentProductId = product.id;
    // 只复制需要编辑的字段，避免将额外字段（如seller_name等）复制到表单中
    state.productForm = {
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock_quantity: product.stock_quantity,
      image_url: product.image_url || '',
      status: product.status
    };
    state.showCreateForm = true;
  };

  const deleteProduct = async (productId) => {
    try {
      await ElMessageBox.confirm(
        '确定要删除这个商品吗？此操作不可恢复。',
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      );

      // 在实际项目中，这里应该调用API删除商品
      // 由于我们的API中没有直接的删除商品接口，我们将其状态设为inactive
      const result = await productsStore.updateProduct(productId, { status: 'inactive' });
      if (result.success) {
        ElMessage.success('商品已下架');
        await productsStore.fetchSellerProducts();
      } else {
        ElMessage.error(result.error || '操作失败');
      }
    } catch {
      // 用户取消操作
    }
  };

  const submitProductForm = async (validateForm) => {
    state.submitting = true;
    try {
      const valid = await validateForm();
      if (valid) {
        let result;
        if (state.isEditing) {
          result = await productsStore.updateProduct(state.currentProductId, state.productForm);
        } else {
          result = await productsStore.createProduct(state.productForm);
        }

        if (result.success) {
          ElMessage.success(state.isEditing ? '商品更新成功' : '商品创建成功');
          state.showCreateForm = false;
          resetForm();
          await productsStore.fetchSellerProducts();
        } else {
          ElMessage.error(result.error || '操作失败');
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

  const resetForm = () => {
    state.productForm = {
      name: '',
      description: '',
      price: 0,
      stock_quantity: 0,
      image_url: '',
      status: 'active'
    };
    state.isEditing = false;
    state.currentProductId = null;
  };

  // 组件挂载时获取商家商品
  onMounted(async () => {
    await productsStore.fetchSellerProducts();
  });

  return {
    ...toRefs(state),
    uploadUrl,
    userRole,
    uploadHeaders,
    products,
    loading,
    getStatusType,
    getStatusText,
    formatDate,
    editProduct,
    deleteProduct,
    submitProductForm,
    handleImageSuccess,
    beforeImageUpload,
    resetForm
  };
}