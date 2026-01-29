const express = require('express');
const multer = require('multer');
const path = require('path');
const { uploadImage } = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 在生产环境中使用内存存储，避免文件系统问题
const storage = process.env.NODE_ENV === 'production'
  ? multer.memoryStorage() // 生产环境：使用内存存储
  : multer.diskStorage({ // 开发环境：使用磁盘存储
      destination: function (req, file, cb) {
        let uploadDestination = 'uploads/';
        const fs = require('fs');
        const path = require('path');

        if (!fs.existsSync(uploadDestination)) {
          fs.mkdirSync(uploadDestination, { recursive: true });
        }
        cb(null, uploadDestination);
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