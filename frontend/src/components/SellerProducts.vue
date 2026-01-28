<template>
  <div class="seller-products">
    <el-row :gutter="20">
      <el-col :span="24">
        <div class="page-header">
          <h2>商品管理</h2>
          <el-button 
            type="primary" 
            @click="showCreateForm = true"
          >
            添加商品
          </el-button>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-table 
          :data="products" 
          style="width: 100%" 
          v-loading="loading"
          empty-text="暂无商品"
        >
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="商品名称" />
          <el-table-column prop="price" label="价格" width="100">
            <template #default="{ row }">
              <span class="price">¥{{ row.price }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="stock_quantity" label="库存" width="100" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag 
                :type="getStatusType(row.status)"
                disable-transitions
              >
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button 
                size="small"
                @click="editProduct(row)"
              >
                编辑
              </el-button>
              <el-button 
                size="small"
                type="danger"
                @click="deleteProduct(row.id)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-col>
    </el-row>

    <!-- 添加/编辑商品对话框 -->
    <el-dialog 
      :title="isEditing ? '编辑商品' : '添加商品'" 
      v-model="showCreateForm" 
      width="500px"
    >
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
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showCreateForm = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitProductForm" :loading="submitting">
            {{ isEditing ? '更新' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useSellerProducts } from '@/composables/useSellerProducts';

export default {
  name: 'SellerProducts',
  setup() {
    const productFormRef = ref(null);
    const {
      showCreateForm,
      isEditing,
      submitting,
      productForm,
      productRules,
      currentProductId,
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
    } = useSellerProducts();

    const handleSubmitProductForm = async () => {
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

      await submitProductForm(validateForm);
    };

    return {
      productFormRef,
      showCreateForm,
      isEditing,
      submitting,
      productForm,
      productRules,
      currentProductId,
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
      handleSubmitProductForm,
      handleImageSuccess,
      beforeImageUpload,
      resetForm
    };
  }
}
</script>

<style scoped>
.seller-products {
  padding: 20px 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  font-weight: bold;
  color: #e74c3c;
}

.dialog-footer {
  text-align: right;
}
</style>