# MediaInfo 媒体信息卡片

把 PT 种子详情页里那一大坨 MediaInfo 英文原文、以及原盘的 BDInfo 碟报，自动整理成和站点同款的「媒体信息」行——一眼看清码率、分辨率、音轨、字幕，还能一键复制成整理好的文本。

适用于 **17 个 PT 站**（HDSky / HDHome / HHanClub / OurBits / PTer / KeepFRDS / SpringSunday / Audiences / U2 / EastGame / TTG / CHDBits / M-Team / FileList / HTPT / BTN），Tampermonkey / Violentmonkey 均可。

![效果图](screenshots/01-bdinfo-quote.png)

> 上图：原盘 BDInfo 被包在「引用」框里、一行一个 `<div>`、空格写成 `&nbsp;`，卡片照样能读出碟名、体积、播放列表、时长、码率与每条音轨 / 字幕，并作为独立一行落在「简介」上方。

## 它做什么

脚本会自动找到页面上的 MediaInfo 或 BDInfo（**包括 `display:none` 折叠起来的、`<textarea>` 里的、用 `<br>` 逐行排版的、被塞进同源 iframe / shadow root 的**），解析成结构化字段，作为独立一行插在「简介」上方，不必展开简介也能看到：

- **位置**：表格里独立的一行，左侧有和「字幕」「简介」同款的「媒体信息」标签格
- **样式**：没有白底卡片、没有阴影、没有彩色色条，字体 / 字号 / 正文色 / 字段名色 / 分隔线全部从站点自身样式采样，看起来就是站点原生的表格行
- **内容（重编码）**：文件名 / 日期 / 体积 / 时长 / 帧率 / 参数 / 分辨率 / 视频 / 音频 / 字幕
- **内容（原盘 BDInfo）**：碟名 / 标签 / 体积（正片·整盘）/ 播放列表 / 时长 / 总码率 / 帧率 / 分辨率 / 视频 / 音频 / 字幕（原盘只有 `Disc Label` 时，碟名直接用标签值，不会空着）
- 短字段并排、长字段独占一行，列数随可用宽度自适应

## 功能

| 功能 | 说明 |
| --- | --- |
| 自动识别 | 按内容特征打分判断，不依赖具体模板类名；折叠、隐藏、`textarea`、`<br>` 排版都能读取 |
| 两种源都认 | MediaInfo（重编码、WEB-DL）与原盘 BDInfo 碟报都能解析；BDInfo 的「一行一字段短格式」与「DISC INFO / PLAYLIST REPORT / VIDEO / AUDIO / SUBTITLES 分段长格式」都支持，换行被站点吞掉、整段粘成一行也能还原 |
| 单位换算 | `Disc Size` / `Size` 的字节数换算成 GiB 并区分「正片 / 整盘」，`Length` 的 `1:48:56.863` 转成 `1h 48min 56s`，`Protection` 并入播放列表（如 `00001.MPLS（AACS 加密）`） |
| 一键复制 | 输出「文件名／日期／体积／…／字幕」的纯文本（原盘为「碟名／标签／体积／播放列表／…」），可直接贴到论坛或聊天 |
| 融入站点 | 内嵌时从「简介」行采样字体、字号、正文色、次要色、边框色，深色站点自动跟随 |
| 悬浮 / 内嵌 | 默认智能选择，找不到「简介」行则右下角悬浮（可拖拽，位置会记住） |
| 多份切换 | 一页有多份 MediaInfo / BDInfo 时用 `‹ 1/2 ›` 切换 |
| 参数折叠 | 编码参数默认只显示关键项，可展开全部 |
| 字幕折叠 | 字幕超过 5 条时只列出中 / 英文字幕，其余收进「+ 更多（N）」；「复制」与「原文」始终完整 |
| 诊断 | 字段为空时点「复制诊断信息」，一次列出抓到的文本、页面标记与每个字段的解析结果 |
| 快捷键 | `Alt + M` 显示 / 隐藏 |

## 安装

**方式一：从 GitHub 安装（推荐，之后由本仓库更新）**

1. 浏览器装好 [Tampermonkey](https://www.tampermonkey.net/)；
2. 打开 [mediainfo-card.user.js](https://github.com/ljp801005-tech/mediainfo-card/blob/main/mediainfo-card.user.js)，点右上角 **Raw**，油猴会弹出安装页；
   也可以直接用这个地址：`https://raw.githubusercontent.com/ljp801005-tech/mediainfo-card/main/mediainfo-card.user.js`
3. 安装后打开任意种子详情页即可看到「媒体信息」行。

**方式二：从 Greasy Fork 安装**

[greasyfork.org/zh-CN/scripts/605024](https://greasyfork.org/zh-CN/scripts/605024)

> 两条渠道的内容一致，但**更新源跟着安装来源走**：从 GitHub 装的由本仓库 `@updateURL` 更新，从 Greasy Fork 装的由 Greasy Fork 更新。

## 更新机制

脚本元数据里已经写好：

```
// @updateURL    https://raw.githubusercontent.com/ljp801005-tech/mediainfo-card/main/mediainfo-card.user.js
// @downloadURL  https://raw.githubusercontent.com/ljp801005-tech/mediainfo-card/main/mediainfo-card.user.js
```

所以日常发版就是「改文件 → 递增 `@version` → push 到 `main`」：

1. Tampermonkey 默认每 24 小时检查一次更新，也可在扩展面板点「检查脚本更新」；油猴菜单里也有「检查更新」。
2. `raw.githubusercontent.com` 有几分钟 CDN 缓存，刚 push 完立刻检查可能仍拿旧文件，等几分钟再来。
3. 版本号必须递增，否则油猴认为没有更新（`@version` 是唯一判断依据）。

带 tag 的发布（可选，便于留档与直链下载）：

```bash
git tag v1.7.4 && git push origin v1.7.4
```

推送 tag 后 GitHub Actions 会自动创建 Release，并把 `mediainfo-card.user.js` 挂到附件里，可用固定地址下载：
`https://github.com/ljp801005-tech/mediainfo-card/releases/latest/download/mediainfo-card.user.js`

## 适用站点

`@match` 已放行下面这些站点（裸域与 `*.域` 都写了，子域也能用），并且排除 `/edit.php`、`/upload.php`、`/takeupload.php` 与 `action=edit/upload` 这类发种 / 编辑页——那几页要往输入框里贴原文，卡片会挡表单。

| 站点 | 域名 | 模板 | 卡片落位 |
| --- | --- | --- | --- |
| HDSky 天空 | `hdwing.org` / `hdsky.me` | NexusPHP | 表格行（克隆「简介」行） |
| HDHome 家园 | `hdhome.org` | NexusPHP | 表格行 |
| HHanClub 憨憨 | `hhanclub.net` | NexusPHP | 表格行（简介折叠则悬浮） |
| OurBits 我堡 | `ourbits.club` | NexusPHP | 表格行 |
| PTer 猫站 | `pterclub.net` | NexusPHP | 表格行 |
| KeepFRDS 朋友 | `pt.keepfrds.com` | NexusPHP | 表格行 |
| SpringSunday 春天 | `springsunday.net` | NexusPHP | 表格行 |
| Audiences 观众 | `audiences.me` | NexusPHP | 表格行 |
| U2 分享园 | `u2.dmhy.org` | NexusPHP | 表格行 |
| EastGame | `pt.eastgame.org` | NexusPHP | 表格行 |
| TTG | `totheglory.im` | NexusPHP | 表格行 |
| CHDBits | `ptchdbits.co` | NexusPHP | 表格行 |
| M-Team 馒头 | `kp.m-team.cc` | Angular + ng-zorro | 简介卡片前 / 卡片内（`.markdown-body`） |
| FileList | `filelist.io` | 自有模板 | 简介面板前（`.panel-body`） |
| HTPT | `www.htpt.cc` | NexusPHP | 表格行 |
| BTN 广播 | `broadcasthe.net` | Gazelle | 同款 `.box` 插在简介盒前（`.torrent_description`） |

![M-Team 式 div 布局（无表格行）下的内嵌效果](screenshots/06-mteam-inline.png)

> 上图：M-Team 这类没有表格行的站点，卡片落在「简介」区块里、原始 MediaInfo 之上，仍然沿用站点的字体与配色。

落位按站点模板分档，命中哪档都会写进诊断信息：
0. **Gazelle 板块**：BTN 这类 Gazelle 站，简介是一个 `div.box`（`.head` 标题条 + `.body` 正文），卡片就做成同款盒子（标题条写 Media Info）插在简介盒之前，宽度与站点其它板块一致；
1. **表格行**：找到「简介」所在的 `<tr>`，克隆它的标签格 + 内容格插一行，列宽、边框、背景全部沿用站点样式；
2. **简介区块前**：没有表格行时，找 ID / 类名像「简介 / 描述」的容器（含各站专属线索，如 M-Team 的 `.markdown-body`、FileList 的 `.panel-body`、BTN 的 `.torrent_description`），插在它前面；
3. **区块前**：都认不出时，从 MediaInfo 所在节点往上找第一个「有兄弟」的块级祖先，把卡片立成它前面的一段——这样卡片仍然贴着简介区，而不是被迫悬浮。

还有一种「没有原文」的情况：简介里贴的是工具渲染好的 HTML 面板（FileList 上的 PTGen 模板就是这种，只有 Video / Audio / Subtitle 三栏表格，整页找不到 `Complete name` / `General` 段头）。
脚本会把面板里的「标签 + 值」和「#1 + 轨道描述」反推回 MediaInfo 文本再解析：

- **落位**：卡片插在三栏面板的**共同容器之前**、整块占一行，宽度与正文一致（不会挤进 flex 栏里只占 Video 那一格）；
- **收起原文**：切到内嵌时整组三栏一起收，右边不会留下半截；
- **补字段**：面板里没有文件名 / 体积 / 日期，脚本按 DOM 相邻关系（`<b>Size</b><br>13.21 GB`、`<b>Uploaded at</b><br>13/11/2026`）和 tooltip 里的 `.mkv` 名补上，补缺不覆盖；
- **不抢原文**：候选里有真正的 `Video` / `General` 段时完全不启用这条兜底；解析下来一个媒体字段都没有时也不会渲染一屏「—」。
- **看得见**：内嵌卡片是透明的，落位后会**逐字段**实测文字色与页面底色的亮度差（跳过「—」占位），任一字段看不清就按页面底色反选主题；页面底色由「在页面上取几个点、逐层找背景色投票」实测，量不出来时按页面主文字色反推，仍不确定就给卡片自己上底色。
- **主题开关优先**：手动选了亮色 / 暗色时，站点配色只跟随字体、不改文字色；此时若透明卡片仍然读不出来（深色站点 + 亮色主题这种组合），就给卡片加一层与主题一致的不透明底色 —— 亮色=白底深字，暗色=深底浅字，绝不留「字和底一个色」。

改站点：① 头部补两行 `@match`（裸域 + `*.域`）；② `SITES` 里登记一行名字（诊断与「关于」面板会显示站点名）；③ 结构特殊时在该行的 `desc` 里补一条容器线索。容器完全认不出时，也可以往 `CONFIG.extraSelectors` 加选择器。

## 常用配置

脚本内 `CONFIG` 对象集中了可调项：

| 配置 | 默认 | 说明 |
| --- | --- | --- |
| `mode` | `auto` | `auto` 智能（简介可见则内嵌，折叠则悬浮）/ `float` / `inline` |
| `theme` | `auto` | 自动 / 亮色 / 暗色 |
| `followSiteStyle` | `true` | 内嵌时跟随站点配色 |
| `maxInfo` | `12` | 一页最多处理几份 |
| `paramLimit` | `8` | 「参数」默认显示几项 |
| `subtitleCollapseThreshold` | `5` | 字幕超过几条开始折叠（0 = 关闭） |
| `subtitleKeepLangs` | `['zh','en']` | 折叠时保留的语言组 |
| `excludePaths` | `/edit.php`、`/upload.php`、`/takeupload.php` | 不生效的路径 |
| `excludeQueries` | `action=edit`、`action=upload`、`action=takeupload` | 不生效的查询串 |

## 目录结构

```
mediainfo-card/
├── mediainfo-card.user.js       # 脚本本体（唯一维护源）
├── README.md
├── LICENSE
├── screenshots/                 # 效果图
├── docs/
│   ├── mediainfo-card-发帖说明.md   # 面向论坛发帖的完整说明
│   ├── greasyfork-附加信息.md       # Greasy Fork 的「附加信息」正文
│   ├── greasyfork-发布信息.md       # Greasy Fork 表单字段与发版记录
│   └── 更新流程.md                  # 改代码 → 发版 → 双渠道同步
├── scripts/
│   └── build-gf.mjs             # 生成剥离 GitHub updateURL 的 GF 版
├── tests/
│   └── sites.test.cjs           # 站点登记表 ↔ @match 自检（CI 会跑）
└── .github/workflows/
    ├── ci.yml                   # 语法与元数据校验
    └── release.yml              # push tag 自动建 Release
```

## 开发与发版

```bash
node --check mediainfo-card.user.js     # 语法检查
node tests/sites.test.cjs               # 站点登记表 ↔ @match 自检
node scripts/build-gf.mjs               # 需要发 Greasy Fork 时生成 dist 版本
git add -A && git commit -m "feat: xxx" && git push
git tag v1.8.0 && git push origin v1.8.0   # 可选：留档 + Release 附件
```

细节见 [docs/更新流程.md](docs/更新流程.md)。

## 常见问题

**页面上明明有 MediaInfo，却没有卡片？**
点卡片工具栏的「诊断」（没有卡片时从油猴菜单打开「关于 / 版本」→「复制诊断信息」），把内容贴到 [Issues](https://github.com/ljp801005-tech/mediainfo-card/issues)。诊断里会列出站点、落位方式、可读根节点、页面标记、textarea / pre / iframe 数量与得分最高的容器。

**卡片跑到右下角悬浮了？**
说明三级落位都没命中（页面把简介放在更奇怪的结构里）。诊断里的「落位」一行会写明原因；把那行连同「选中容器」一起发来，就能针对该站补一条容器线索。

**原盘只有「标签」没有「碟名」？**
BDInfo 0.7.5.x 导出的 `DISC INFO` 只有 `Disc Label`、没有 `Disc Title`，1.7.3 起会用标签值填到碟名行，同一串名字只显示一次。

**改了代码，油猴没提示更新？**
检查 `@version` 是否递增；`raw.githubusercontent.com` 有 CDN 缓存，等几分钟；或直接重新点一次 Raw 安装。

## 更新记录

| 版本 | 说明 |
| --- | --- |
| 1.10.0 | 修「多栏 HTML 面板只认出体积、其余全是 —」（Audiences 一类模板）：表头行放栏名、内容按栏排在后面，段头全挤在开头导致字段错位；现在按 DOM 把栏名与栏内容重新对齐，支持 `<br>` 换行、标签与值拆行、紧凑轨道行（`English E-AC-3 2.0ch @ 224kb/s`）；顺带修文件名被 File size 骗走 |
| 1.9.9 | 移除 OpenCD（open.cd）支持：`@match` 与站点登记表都不再包含该站，当前 17 站 / 32 条 `@match`；其余站点逻辑未改 |
| 1.9.8 | 修「正文底色是背景图画出来的站点判错深浅」（FileList 官方 blue 皮肤）：body 浅灰 #b3b4ab、正文区深色由 content-bg-blue.png 绘制，旧逻辑量不出纯色底就退到 body 浅灰 → 判成浅色主题、字段值看不见。现在祖先链遇到 background-image 立即止步，整页采样也不再退到 body；量不出纯色底时用「同一位置站点自己的文字色」推断深浅（写成浅色字 ⇒ 底是深的） |
| 1.9.7 | 再修「主题=自动时字段看不见」：深浅判定不再整页取点投票，改为只量卡片正后方（卡片矩形内 9 个点、elementsFromPoint 跳过卡片自身、逐层找不透明底色后按亮度分桶取多数），深色页里夹着海报 / iframe / 白底面板也不会被带偏；对比度校正的底色按「卡片后方实测 → 祖先链 → 整页投票 → 文字色反推」降级；站点采样配色要先跟实测底色对一次，对不上就丢弃 |
| 1.9.6 | 修主题开关：手动选亮色 / 暗色后不再被站点配色覆盖（原来深色站点上切亮色等于没切），透明卡片读不出来时给卡片自己上底色；深浅判定改为实测页面主体底色（页面取点投票），逐字段校验对比度；字段名 / 字段值颜色规则提升优先级 |
| 1.9.5 | 修「卡片在、字段却像空的」：内嵌卡片透明时，若前景色与页面底色接近（FileList 上的深灰字压深灰底），字段其实都在但一个字看不见。落位后实测亮度差，不够就按页面底色反选主题；底色来自背景图时给卡片自己上底色；诊断新增「配色」一行 |
| 1.9.4 | 修 FileList 这类「只有 HTML 面板」的页面：卡片不再挤进三栏布局（改为插在三栏之前整块占一行）、收起原文时整组面板一起收、文件名 / 日期 / 体积按 DOM「标签 + 值」和 tooltip 补全、解析不出字段时不再显示一屏「—」 |
| 1.9.3 | 新增「HTML 面板反解」：整页没有 MediaInfo 原文、只有 Video / Audio / Subtitle 三栏 HTML 面板时，反推字段照常出卡片；诊断新增「HTML 面板反解」一行 |
| 1.9.2 | 适配 BroadcasTheNet（`broadcasthe.net`，BTN）：Gazelle 模板，新增「同款 box 插在简介盒前」落位，卡片嵌进页面就像站点自带的「Media Info」板块；配色改从简介正文采样；收起原文时连整块简介盒一起收 |
| 1.8.0 | 适配 16 个 PT 站（共 17 个域名组），新增「区块前插入」落位，M-Team / FileList 这类无表格行的模板也能内嵌；站点适配器接管落位、配色采样与诊断 |
| 1.7.4 | 迁到 GitHub 托管，接入 raw 自动更新（`@updateURL` / `@downloadURL` / `@homepageURL` / `@supportURL`） |
| 1.7.3 | 原盘只有 `Disc Label` 时用它兜底「碟名」，不再留空；诊断一次列出全部字段 |
| 1.7.2 | 修复「识别份数 0、卡片完全不出现」：`&nbsp;` / 全角空格摊平，扫描范围补同源 iframe 与 shadow root，新增整页兜底解析 |
| 1.7.1 | 修复 BDInfo 长格式在换行被吞掉时视频 / 音频 / 字幕全空：按分段标题、表头、行首编解码名还原换行 |
| 1.7.0 | 新增 BDInfo（原盘）解析，支持短格式与分段长格式 |
| 1.6.3 | 「日期」只认 MediaInfo 自己的字段，源里没有就留空，不用种子发布时间顶替 |
| 1.6.2 | 段头识别支持「引用 / 代码 / 原文」等 BBCode 前缀 |
| 1.6.1 | 文件名 / 日期 / 体积的整页兜底；新增「复制诊断信息」 |
| 1.6.0 | 修复 General 段被拆开时文件名 / 体积为空 |
| 1.5.0 | 字幕超过 5 条时折叠小语种 |
| 1.4.x | 内嵌样式融入站点；排除编辑 / 发种页 |
| 1.3.0 | 字段自适应分列 |
| 1.2.0 | 卡片改为独立表格行，放在「简介」上方 |
| 1.1.0 | 适配折叠区块、`<br>` 排版、异步加载与深浅主题 |
| 1.0.0 | 首版 |

## License

[MIT](LICENSE)
