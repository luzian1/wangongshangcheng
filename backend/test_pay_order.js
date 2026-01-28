const axios = require('axios');

// 测试支付订单API
async function testPayOrder() {
  try {
    // 替换为实际的订单ID和JWT令牌
    const orderId = '1'; // 示例订单ID
    const token = 'your_jwt_token_here'; // 示例JWT令牌
    
    console.log('正在测试支付订单API...');
    
    const response = await axios.put(
      `http://localhost:3000/api/orders/${orderId}/pay`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('支付成功:', response.data);
  } catch (error) {
    console.error('支付失败:', error.response?.data || error.message);
  }
}

testPayOrder();