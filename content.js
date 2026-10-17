// content.js

let popupEl = null;

// 监听来自 background.js 的快捷键指令
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "translateSelection") {
    const selectedText = window.getSelection().toString().trim();
    if (!selectedText) {
      showPopup("", "请先选中文本，然后再按 Alt+Q 翻译");
      return;
    }
    translateAndShow(selectedText);
  }
});

async function translateAndShow(text) {
  showPopup(text, "翻译中…");
  try {
    const res = await chrome.runtime.sendMessage({ action: "translate", text });
    if (res?.success) {
      showPopup(text, res.translated);
    } else {
      showPopup(text, "翻译失败：" + (res?.error || "未知错误"));
    }
  } catch (err) {
    showPopup(text, "插件通信失败，请刷新当前网页后重试");
  }
}

function ensurePopup() {
  if (popupEl) return popupEl;

  popupEl = document.createElement("div");
  popupEl.id = "ext-translate-popup";
  popupEl.innerHTML = `
    <div class="ext-translate-header">
      <span class="ext-translate-title">划词翻译</span>
      <button class="ext-translate-close" aria-label="关闭">×</button>
    </div>
    <div class="ext-translate-original"></div>
    <div class="ext-translate-result"></div>
  `;
  document.body.appendChild(popupEl);

  // 关闭按钮
  popupEl.querySelector(".ext-translate-close").addEventListener("click", hidePopup);

  // 点击外部区域关闭
  document.addEventListener("mousedown", (e) => {
    if (popupEl && popupEl.style.display !== "none" && !popupEl.contains(e.target)) {
      hidePopup();
    }
  });

  // Esc 键关闭
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hidePopup();
    }
  });

  return popupEl;
}

function showPopup(original, result) {
  const el = ensurePopup();
  const origEl = el.querySelector(".ext-translate-original");
  const resEl = el.querySelector(".ext-translate-result");

  if (original) {
    origEl.textContent = original;
    origEl.style.display = "block";
  } else {
    origEl.textContent = "";
    origEl.style.display = "none";
  }

  resEl.textContent = result;

  // 必须先设置为可见，以获取实际高度来进行精准定位
  el.style.display = "block";
  positionPopup();
}

function hidePopup() {
  if (popupEl) {
    popupEl.style.display = "none";
  }
}

function positionPopup() {
  if (!popupEl) return;
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  const popupHeight = popupEl.offsetHeight || 120;
  const popupWidth = popupEl.offsetWidth || 340;

  // 优先显示在选区下方，若下方超出可视视口则显示在上方
  let top = rect.bottom + 8;
  if (top + popupHeight > window.innerHeight) {
    top = rect.top - popupHeight - 8;
  }

  // 视口边界保护
  top = Math.max(8, Math.min(top, window.innerHeight - popupHeight - 8));
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - popupWidth - 16));

  popupEl.style.top = top + "px";
  popupEl.style.left = left + "px";
}