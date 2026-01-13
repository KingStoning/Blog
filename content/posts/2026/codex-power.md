---
title: codex-在power中怎么用
description: 
date: {{date:YYYY-MM-DD}}
updated: {{date:YYYY-MM-DD}}
image: https://raw.githubusercontent.com/KingStoning/Blog/main/assets/note-bdec8279/207f977bc330004464998cc04f238fdd.jpg
type: story
categories: [技术]
tags: [随想]
---

如何使用我们yescode的codex?
我这里分为windows Linux 的
## windows powershell
### 安装node.js环境
我们在PowerShell 中输入以下命令来看看你有没有安装它
```
node -v
````
![](https://raw.githubusercontent.com/KingStoning/Blog/main/assets/note-bdec8279/207f977bc330004464998cc04f238fdd.jpg)
1) 如上图这样就是没有安装
情况 A：如果报错说 “无法将 node 识别为...”

这意味着你电脑里还没装 Node.js。

1. **下载**：去 [Node.js 官网 (nodejs.org)](https://nodejs.org/) 下载左边的 **LTS 版本**（长期支持版）。
2. **安装**：下载后一路“下一步”安装即可。
3. **重启**：安装完后，**必须关闭并重新打开** PowerShell 窗口，然后再次输入 `node -v` 确认显示版本号。
### 输入我们的指令
然后在仪表盘上面,我们复制PowerShell指令,粘贴到powershell *注意不是cmd*

打开PowerShell后,直接粘贴,即可

这个时候我们就配置成功了(≧∀≦)ゞ

输入

```
codex "你好，请用Python写一个Hello World程序"
```


![500](https://raw.githubusercontent.com/KingStoning/Blog/main/assets/note-bdec8279/b1507a367c7e2dabc44d101da9f9d0ad.jpg)

