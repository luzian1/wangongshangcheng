<template>
  <div class="edit-product">
    <el-page-header @back="goBack" content="编辑商品" />
    
    <el-card style="margin-top: 20px;">
      <el-form :model="productForm" :rules="productRules" ref="productFormRef" label-width="100px">
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="productForm.name" placeholder="请输入商品名称" />
        </el-form-item>

        <el-form-item label="商品描述" prop="description">
          <el-input
            v-model="productForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入商品描述"
          />
        </el-form-item>

        <el-form-item label="价格" prop="price">
          <el-input-number
            v-model="productForm.price"
            :precision="2"
            :step="0.01"
            :min="0"
            style="width: 100%;"
          />
        </el-form-item>

        <el-form-item label="库存" prop="stock_quantity">
          <el-input-number
            v-model="productForm.stock_quantity"
            :min="0"
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

        <el-form-item label="状态" prop="status">
          <el-select v-model="productForm.status" placeholder="请选择商品状态" style="width: 100%;">
            <el-option label="上架" value="active"></el-option>
            <el-option label="下架" value="inactive"></el-option>
            <el-option v-if="userRole === 'admin'" label="违规" value="suspended"></el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <div style="margin-top: 20px; text-align: center;">
        <el-button type="primary" @click="handleSubmitForm" :loading="submitting">更新商品</el-button>
        <el-button @click="goBack">取消</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useEditProduct } from '@/composables/useEditProduct';

export default {
  name: 'EditProduct',
  setup() {
    const productFormRef = ref(null);
    const {
      productId,
      submitting,
      productForm,
      productRules,
      uploadUrl,
      userRole,
      uploadHeaders,
      loading,
      loadProduct,
      submitForm,
      handleImageSuccess,
      beforeImageUpload,
      goBack
    } = useEditProduct();

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
      productFormRef,
      productId,
      submitting,
      productForm,
      productRules,
      uploadUrl,
      userRole,
      uploadHeaders,
      loading,
      loadProduct,
      handleSubmitForm,
      handleImageSuccess,
      beforeImageUpload,
      goBack
    };
  }
}
</script>

<style scoped>
.edit-product {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px 0;
}
</style>