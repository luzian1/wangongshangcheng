const express = require('express');
const multer = require('multer');
const path = require('path');
const { uploadImage } = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 动态确定上传目录
let uploadDestination = 'uploads/';
if (process.env.NODE_ENV === 'production') {
  uploadDestination = '/tmp/uploads';
  // 验证目录是否存在，如果不存在则使用项目目录
  const fs = require('fs');
  const pathModule = require('path');
  if (!fs.existsSync(uploadDestination)) {
    uploadDestination = pathModule.join(__dirname, '..', '..', 'uploads');
  }
}

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDestination); // 指定上传目录
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名，防止冲突
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件过滤器，只允许图片文件
const fileFilter = (req, file, cb) => {
  // 检查文件类型是否为图片
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true); // 接受文件
  } else {
    cb(new Error('只允许上传 JPG 和 PNG 格式的图片!'), false); // 拒绝文件
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制文件大小为5MB
  },
  fileFilter: fileFilter
});

// 上传图片接口
router.post('/image', authenticateToken, upload.single('image'), uploadImage);

module.exports = router;