// background.js

// 监听快捷键命令
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "translate-selection") {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await chrome.tabs.sendMessage(tab.id, { action: "translateSelection" });
      }
    } catch (err) {
      console.warn("未能向当前标签页发送消息（可能是受保护的页面或插件加载前打开的页面）:", err);
    }
  }
});

// 在 Background Service Worker 中处理翻译请求，规避页面 CSP 拦截
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "translate") {
    handleTranslate(message.text)
      .then(sendResponse)
      .catch((err) => {
        sendResponse({ success: false, error: err.message || "请求异常" });
      });
    return true; // 保持异步消息通道打开
  }
});

async function handleTranslate(text) {
  // 简易语言判断：包含中文则中译英，其余默认英/外译中
  const hasChinese = /[\u4e00-\u9fa5]/.test(text);
  const langpair = hasChinese ? "zh-CN|en" : "en|zh-CN";

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.responseStatus === 200) {
      const translated = decodeEntities(data.responseData.translatedText);
      return { success: true, translated };
    } else {
      return {
        success: false,
        error: data.responseDetails || "翻译服务返回错误"
      };
    }
  } catch (err) {
    return {
      success: false,
      error: "网络请求失败，请检查网络连接"
    };
  }
}

// 解码常见的 HTML 实体编码
function decodeEntities(str) {
  if (!str) return "";
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ");
}