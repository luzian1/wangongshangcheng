<template>
  <div class="create-product">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>添加新商品</span>
        </div>
      </template>

      <el-form
        :model="productForm"
        :rules="rules"
        ref="productFormRef"
        label-width="120px"
        style="max-width: 600px;"
      >
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="productForm.name" placeholder="请输入商品名称" />
        </el-form-item>

        <el-form-item label="商品描述" prop="description">
          <el-input
            v-model="productForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入商品描述"
          />
        </el-form-item>

        <el-form-item label="价格" prop="price">
          <el-input-number
            v-model="productForm.price"
            :min="0.01"
            :step="0.01"
            :precision="2"
            placeholder="请输入价格"
            style="width: 100%;"
          />
        </el-form-item>

        <el-form-item label="库存数量" prop="stock_quantity">
          <el-input-number
            v-model="productForm.stock_quantity"
            :min="0"
            placeholder="请输入库存数量"
            style="width: 100%;"
          />
        </el-form-item>

        <el-form-item label="商品图片" prop="image_url">
          <!-- 图片预览 -->
          <div v-if="productForm.image_url" class="image-preview">
            <img :src="productForm.image_url" alt="商品图片预览" style="max-width: 200px; max-height: 200px; margin-bottom: 10px;" />
          </div>

          <!-- 文件上传 -->
          <el-upload
            class="image-uploader"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleImageSuccess"
            :before-upload="beforeImageUpload"
            name="image"
          >
            <el-button size="small" type="primary">上传图片</el-button>
            <template #tip>
              <div class="el-upload__tip">
                只能上传jpg/png文件，且不超过5MB
              </div>
            </template>
          </el-upload>

          <!-- 或者使用链接 -->
          <el-input
            v-model="productForm.image_url"
            placeholder="或输入图片链接"
            style="margin-top: 10px;"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmitForm" :loading="submitting">
            {{ submitting ? '提交中...' : '创建商品' }}
          </el-button>
          <el-button @click="$router.push('/seller/products')">返回商品列表</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useCreateProduct } from '@/composables/useCreateProduct';

export default {
  name: 'CreateProduct',
  setup() {
    const productFormRef = ref(null);
    const {
      productForm,
      rules,
      submitting,
      uploadUrl,
      uploadHeaders,
      handleImageSuccess,
      beforeImageUpload,
      submitForm
    } = useCreateProduct();

    const handleSubmitForm = async () => {
      // 定义验证函数，由composable调用
      const validateForm = async () => {
        if (!productFormRef.value) {
          ElMessage.error('表单引用未找到，请稍后重试');
          return false;
        }

        try {
          const valid = await productFormRef.value.validate().catch(() => false);
          return valid;
        } catch (error) {
          console.error('表单验证错误:', error);
          return false;
        }
      };

      await submitForm(validateForm);
    };

    return {
      productForm,
      rules,
      submitting,
      uploadUrl,
      uploadHeaders,
      handleImageSuccess,
      beforeImageUpload,
      handleSubmitForm,
      productFormRef
    };
  }
}
</script>

<style scoped>
.create-product {
  padding: 20px 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>