const path = require('path');
const fs = require('fs');

// 上传图片
const uploadImage = async (req, res) => {
  try {
    // 检查是否上传了文件
    if (!req.file) {
      return res.status(400).json({
        error: '没有上传文件'
      });
    }

    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      // 删除上传的无效文件
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        error: '只允许上传 JPG 和 PNG 格式的图片'
      });
    }

    // 检查文件大小
    if (req.file.size > 5 * 1024 * 1024) { // 5MB
      // 删除上传的超大文件
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        error: '文件大小不能超过 5MB'
      });
    }

    // 读取文件内容并转换为Base64
    const imageData = fs.readFileSync(req.file.path);
    const base64Image = imageData.toString('base64');
    const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;

    // 删除临时文件
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      message: '图片上传成功',
      url: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('上传图片错误:', error);

    // 如果上传过程中出现错误，尝试删除已上传的文件
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('删除上传失败的文件错误:', unlinkError);
      }
    }

    res.status(500).json({
      error: '服务器错误，上传失败'
    });
  }
};

module.exports = {
  uploadImage
};