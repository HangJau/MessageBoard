// 名称: 刹那心动-碎碎念
// 描述: 留存Ta的刹那心动
// author: Hangjau

// 配置信息
const config = {
    workerUrl: "*.woker.dev", // worker URL or 绑定的域名
    userKey: "userKey", // 与Worker中配置的he/her一致
    sharedToken: "sharedToken", // worker中配置的sharedToken
    myName: "小帅", // 自己的昵称
    partnerName: "小妹", // 对方的昵称
    title: "💌Ta的刹那心动💌", // 组件名称
    
    themeColor: "#FF6B8B",  // 主色调
    secondaryColor: "#4A90E2" // 辅助色
}
  
// 主入口
let widget = await createWidget();
if (config.runsInWidget) {
  Script.setWidget(widget);

} else {
  await widget.presentMedium();
}

Script.complete();

async function createWidget() {
  const widget = new ListWidget();
  // 温馨渐变背景
  const gradient = new LinearGradient();
  gradient.colors = [
    new Color("#FFF5F7", 1),
    new Color("#FFEEF2", 1)
  ];
  gradient.locations = [0, 1];
  widget.backgroundGradient = gradient;
  
  try {
    // 获取数据
    const data = await fetchData();
    const latestMsg = getLatestMessage(data);
    
    // 标题 (点击刷新)
    const header = widget.addStack();
    header.url = `scriptable:///run?scriptName=${encodeURIComponent(Script.name())}`;
    header.addSpacer();
    const title = header.addText(config.title);
    title.font = Font.boldSystemFont(16);
    title.textColor = new Color(config.themeColor);
    header.addSpacer();
    
    widget.addSpacer(10);
    
    // 显示最新留言
    if (latestMsg) {
      const isMe = latestMsg.sender === config.userKey;
      const name = isMe ? config.myName : config.partnerName;
      
      // 留言卡片
      const card = widget.addStack();
      card.backgroundColor = new Color(isMe ? config.themeColor : config.secondaryColor, 0.15);
      card.cornerRadius = 12;
      card.setPadding(7, 9, 7, 9);
      
      const content = card.addText(`${latestMsg.message}`);
      content.font = Font.mediumSystemFont(15);
      content.textColor = new Color("#333333");
      content.lineLimit = 0;
      
      widget.addSpacer(8);
      
      // 落款信息
      const footer = widget.addStack();
      footer.addSpacer();
      const sign = footer.addText(`— ${name} · ${formatTime(latestMsg.time)}`);
      sign.font = Font.italicSystemFont(12);
      sign.textColor = new Color(isMe ? config.themeColor : config.secondaryColor);
      footer.addSpacer();
    } else {
      // 无留言时的提示
      const tip = widget.addText("此处没有碎碎念，你的刹那心动可以唤醒Ta");
      tip.font = Font.italicSystemFont(14);
      tip.textColor = new Color(config.themeColor);
      tip.centerAlignText();
    }
    
    // 底部操作提示
    widget.addSpacer();
    const hint = widget.addText("轻触发送碎碎念");
    hint.font = Font.mediumSystemFont(10);
    hint.textColor = new Color("#CC6699", 0.7);
    hint.centerAlignText();
    
    // 默认点击行为
    widget.url = `scriptable:///run?scriptName=${encodeURIComponent(Script.name())}&action=write`;
    
  } catch (error) {
    widget.addText("💔 加载失败").textColor = Color.red();
    widget.addText(error.message).font = Font.regularSystemFont(12);
  }
  
  return widget;
}

// 获取最新一条留言
function getLatestMessage(data) {
  if (!data?.msgs?.length) return null;
  
  // 取第一条
  return data.msgs[0];
}

// 获取数据
async function fetchData() {
  const req = new Request(config.workerUrl);
  req.method = "GET";
  req.headers = {
    "X-User-Key": config.userKey,
    "X-Shared-Token": config.sharedToken
  };
  return await req.loadJSON();
}

// 格式化时间
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {year:'numeric', month:'2-digit', day:'2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-');
}

// 写留言功能 (保持不变)
if (args.queryParameters?.action === "write") {
  const alert = new Alert();
  alert.title = "💌 写给 " + config.partnerName;
  alert.message = "输入你的碎碎念...";
  alert.addTextField();
  alert.addAction("发送");
  alert.addCancelAction("取消");
  
  const choice = await alert.present();
  if (choice === 0 && alert.textFieldValue(0).trim()) {
    await sendMessage(alert.textFieldValue(0));
    const confirm = new Alert();
    confirm.title = "✓ 发送成功";
    confirm.message = `${config.partnerName}很快就会感受到啦~`;
    await confirm.present();
  }
}

async function sendMessage(text) {
  const req = new Request(config.workerUrl);
  req.method = "POST";
  req.headers = {
    "Content-Type": "application/json",
    "X-User-Key": config.userKey,
    "X-Shared-Token": config.sharedToken
  };
  req.body = JSON.stringify({
    message: text
  });
  await req.loadJSON();
}
