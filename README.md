# 选词翻译

一个用于Chrome上对网页进行选词翻译的插件。

---

## 使用方法

访问

```web
chrome://extensions
```

随后，开启右上角的开发者模式

点击左上角“加载未打包的扩展程序”

选择本仓库

然后打开拓展

最后选中文字，按下“alt+b”即可翻译

---

## 自定义键位

修改manifest.json中

```json
"commands": {
    "translate-selection": {
        "suggested_key": {
            "default": "Alt+B",
            "mac": "Alt+B"
        },
        "description": "翻译当前选中的文本为中文"
    }
}
```

更改default中的按键就可以

如果你是mac设备，请更改mac这个key对应的设置
