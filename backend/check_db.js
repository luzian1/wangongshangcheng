const fs = require('fs');
const path = require('path');

// 检查数据库文件
const dbFiles = [
  'F:\\文件\\luzian\\database\\init.sql',
  'F:\\文件\\luzian\\database\\migrations',
  'F:\\文件\\luzian\\database\\seed'
];

console.log('检查数据库相关文件...');
dbFiles.forEach(file => {
  try {
    const stats = fs.statSync(file);
    console.log(`${file} - ${stats.isDirectory() ? '目录' : '文件'}, 大小: ${stats.size} 字节`);
  } catch (err) {
    console.log(`${file} - 不存在或无法访问`);
  }
});

// 检查后端控制器
const controllerPath = 'F:\\文件\\luzian\\backend\\src\\controllers\\orderController.js';
try {
  const controllerContent = fs.readFileSync(controllerPath, 'utf8');
  console.log('\n检查订单控制器...');
  if (controllerContent.includes('status = $3') && controllerContent.includes("'pending'")) {
    console.log('✓ 订单创建时设置了状态为pending');
  } else {
    console.log('✗ 订单创建时可能没有设置状态');
  }
  
  if (controllerContent.includes('console.log') && controllerContent.includes('支付请求')) {
    console.log('✓ 已添加调试日志');
  } else {
    console.log('✗ 调试日志未添加');
  }
} catch (err) {
  console.log(`无法读取控制器文件: ${err.message}`);
}