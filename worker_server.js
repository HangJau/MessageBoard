// 主逻辑
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  try {  
      // 1. 鉴权验证
      const authError = validateAuth(request)
      if (authError) return authError

      let userKey = request.headers.get('X-User-Key');

      if (request.method === 'GET'){
          
          const data = await getMessages(userKey);
          
          return new Response(JSON.stringify(data), {
              headers: { 'Content-Type': 'application/json' }
          });

      }else if (request.method === 'POST') {
          // POST处理逻辑（确保有Content-Type检查）
          const contentType = request.headers.get('Content-Type');
          if (!contentType?.includes('application/json')) {
              return new Response("Require JSON content", { status: 400 });
          }

          // 处理POST留言
          const { message } = await request.json();
          
          await saveMessage(userKey, message);
          return new Response(JSON.stringify({ status: "success" }), {
              headers: { 'Content-Type': 'application/json' }
          })

      }else {
          return new Response("Method not allowed", { status: 405 });
      };
  
  } catch (err) {
      return new Response(JSON.stringify({
          error: err.message,
          stack: err.stack
      }), {
          status: 500,
          headers: { 'Content-Type': 'application/json'}
      });
  }
}

// 鉴权函数（直接使用环境变量）
function validateAuth(request) {
  const userKey = request.headers.get('X-User-Key')
  const sharedToken = request.headers.get('X-Shared-Token')

  // 从Worker环境变量读取密钥
  const validUserKeys = [he, her] // 直接引用环境变量
  const validSharedToken = shared_token // 直接引用环境变量

  if (!validUserKeys.includes(userKey) || sharedToken !== validSharedToken) {
    return new Response("Unauthorized", { status: 401 })
  }
  return null
}

// 存储留言到KV
async function saveMessage(senderKey, message) {

  // 验证消息内容
  if (typeof message !== 'string' || message.trim() === '') {
      throw new Error('消息内容不能为空');
  }

  const key = 'couple_messages'; // 保持共用存储空间
  
  // 更健壮的数据初始化
  let data = await MESSAGES.get(key, 'json');
  if (!data) {
      data = { msgs: [] };
      console.log("又被重置了");
  }

  if (!Array.isArray(data.msgs)) {
      data.msgs = [];
    }

  // 统一使用boy/girl标识
  const sender = senderKey === he ? "boy" : "girl";

  // 添加新留言
  data.msgs.push({
      sender: sender,
      message,
      time: Date.now()
  });
  
  // 记录日志
  console.log(`${sender} 发送了新留言: ${message.substring(0, 10)}...`);

  // 保持历史记录限制
  if (data.msgs.length > 20) {
    data.msgs = data.msgs.slice(-20);
  }

  await MESSAGES.put(key, JSON.stringify(data));
};

// 从KV获取留言
async function getMessages(senderKey) {

  // 健壮的数据获取
  let data;
  try {
      data = await MESSAGES.get('couple_messages', 'json') || { msgs: [] };
      if (!Array.isArray(data.msgs)) {
      data.msgs = [];
      }
      
  } catch (err) {
      console.error("KV读取失败:", err);
      data = { msgs: [] };
  }

  // 根据身份过滤留言
  const targetSender = senderKey === he ? "girl" : "boy"; // 获取对方的消息
  const filtered = data.msgs.filter(msg => msg.sender === targetSender);
  
  // 获取最新消息
  const latest = filtered.reduce((latest, current) => {
      return (!latest || current.time > latest.time) ? current : latest;
  }, null);

  // 记录日志
  console.log(`用户 ${senderKey === he ? "he" : "her"} 获取到 ${latest ? "1" : "0"} 条留言`);

  // return {
  //     history: latest ? [{
  //       sender: latest.sender,
  //       message: latest.message,
  //       time: latest.time
  //     }] : []
  // };

  return {
      msgs: latest ? [latest] : []
  };

}
