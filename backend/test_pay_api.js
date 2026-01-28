// 使用fetch测试支付API端点
require('dotenv').config();

async function testPayOrderAPI() {
  // 使用从数据库检查中获取的信息
  // 订单ID 3 属于用户ID 1，状态是 'pending'
  const orderId = 3;  // 一个状态为pending的订单
  const userId = 1;   // 订单所有者
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJidXllciIsImlhdCI6MTc2NjY0MzQ4MiwiZXhwIjoxNzY2NjQ3MDgyfQ.BoEOhAXN-BjZekknrbw4S_IumURGCTDAjl4GrvsrLpY'; // 测试令牌

  console.log(`测试支付订单 API - 订单ID: ${orderId}, 用户ID: ${userId}`);

  try {
    const response = await fetch(`http://localhost:3000/api/orders/${orderId}/pay`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    const result = await response.json();
    
    console.log('状态码:', response.status);
    console.log('响应数据:', result);
  } catch (error) {
    console.log('请求失败:', error.message);
  }
}

testPayOrderAPI();