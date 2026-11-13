# Greasy Fork 发布信息

## 表单字段

| 字段 | 填入内容 |
| --- | --- |
| 脚本名称 | MediaInfo 媒体信息卡片 |
| 简述 | 把 PT 种子详情页里的 MediaInfo / 原盘 BDInfo 自动整理成与站点同款的「媒体信息」行，折叠隐藏也能读，支持一键复制整理文本。 |
| 语言 | 汉语（中国） |
| 分类 | 其他 |
| 适用网站 | 由脚本 `@match` 自动识别（17 个 PT 站：HDSky / HDHome / HHanClub / OurBits / PTer / KeepFRDS / SpringSunday / Audiences / U2 / EastGame / OpenCD / TTG / CHDBits / M-Team / FileList / HTPT） |
| 许可证 | MIT（写在脚本元数据 `@license` 里） |

## 附加信息（Markdown，可直接粘贴到「附加信息」框）

```markdown
把 PT 种子详情页里那一大坨 MediaInfo 英文原文、以及原盘的 BDInfo 碟报，整理成和站点同款的「媒体信息」行——一眼看清码率、分辨率、音轨、字幕，还能一键复制成整理好的文本。

## 它做什么

脚本会自动找到页面上的 MediaInfo 或 BDInfo（**包括 `display:none` 折叠起来的、`<textarea>` 里的、用 `<br>` 逐行排版的**），解析成结构化字段，作为独立一行插在「简介」上方，不必展开简介也能看到：

- 位置：表格里独立的一行，左侧有和「字幕」「简介」同款的「媒体信息」标签格
- 样式：没有白底卡片、没有阴影、没有彩色色条，字体/字号/正文色/字段名色/分隔线全部从站点自身样式采样，看起来就是站点原生的表格行
- 内容（重编码）：文件名 / 日期 / 体积 / 时长 / 帧率 / 参数 / 分辨率 / 视频 / 音频 / 字幕
- 内容（原盘 BDInfo）：碟名 / 标签 / 体积（正片·整盘）/ 播放列表 / 时长 / 总码率 / 帧率 / 分辨率 / 视频 / 音频 / 字幕
- 短字段并排、长字段独占一行，列数随可用宽度自适应

## 功能

- **自动识别**：按内容特征打分判断，不依赖具体模板类名；折叠、隐藏、`textarea`、`<br>` 排版都能读取
- **两种源都认**：MediaInfo（重编码、WEB-DL）与原盘 BDInfo 碟报都能解析；BDInfo 的「一行一字段短格式」和 BDInfo 导出的「DISC INFO / PLAYLIST REPORT / VIDEO / AUDIO / SUBTITLES 分段长格式」都支持
- **原盘信息换算**：`Disc Size` / `Size` 的字节数自动换算成 GiB 并区分「正片 / 整盘」，`Length` 的 `1:48:56.863` 转成 `1h 48min 56s`，`Protection` 并入播放列表显示（如 `00001.MPLS（AACS 加密）`）
- **结构化展示**：字段顺序、全角对齐标签与常见整理格式一致
- **一键复制**：输出 `文件名／日期／体积／时长／…／字幕` 的纯文本（原盘为 `碟名／标签／体积／播放列表／…`），可直接贴到论坛或聊天
- **融入站点样式**：内嵌时从「简介」行采样字体、字号、正文色、次要色、边框色，深色站点自动跟随
- **悬浮 / 内嵌**：默认智能选择，找不到「简介」行则右下角悬浮（可拖拽，位置会记住）
- **多份切换**：一页有多份 MediaInfo / BDInfo 时用 `‹ 1/2 ›` 切换
- **查看原文**：一键展开原文
- **参数折叠**：编码参数默认只显示关键项，可展开全部
- **字幕折叠**：字幕轨道超过 5 条时，卡片只列出中 / 英文字幕，其余收进「+ 更多（N）」，点击即可展开全部；「复制」与「原文」始终包含完整字幕
- **快捷键**：`Alt + M` 显示 / 隐藏
- **菜单集成**：显隐、切悬浮/内嵌、恢复智能定位、重置位置、重新扫描、关于/版本
- **版本面板**：点标题行右侧 `v1.8.0` 查看版本、范围、当前配置与更新记录

## 适用范围

`@match` 已放行 17 个域名组，覆盖 HDSky（hdwing.org / hdsky.me）、HDHome、HHanClub、OurBits、PTer、KeepFRDS、SpringSunday、Audiences、U2、EastGame、OpenCD、TTG、CHDBits、M-Team、FileList、HTPT；要看具体清单与落位规则，见「附加信息」文档的《适用范围》一节。

要加站点：头部补两行 `@match`（裸域 + `*.域`），再在 `SITES` 里登记一行名字，结构特殊时在同一行的 `desc` 里补一条容器线索。

发种 / 编辑页（`upload.php`、`edit.php`）默认不启用，通过 `@exclude` 与 `CONFIG.excludePaths` 双重排除。

## 配置项（脚本内 `CONFIG`）

| 配置 | 默认值 | 说明 |
| --- | --- | --- |
| `mode` | `'auto'` | `auto` 智能 / `float` 始终悬浮 / `inline` 始终内嵌 |
| `theme` | `'auto'` | 自动 / `light` / `dark` |
| `insertPosition` | `'above-intro'` | 作为独立行放到「简介」上方；`before-mediainfo` 为旧行为 |
| `inlineMinCol` | `340` | 内嵌时每列最小宽度，调大列数变少 |
| `gridMinCol` | `300` | 悬浮卡片每列最小宽度 |
| `followSiteStyle` | `true` | 是否采样站点配色/字体来融入页面 |
| `paramLimit` | `8` | 「参数」默认显示几项 |
| `subtitleCollapseThreshold` | `5` | 字幕超过几条时折叠；设为 `0` 关闭折叠 |
| `subtitleKeepLangs` | `['zh', 'en']` | 折叠时保留的语言分组，可自行增删 |
| `excludePaths` | `['/edit.php', '/upload.php']` | 这些路径完全不启用脚本 |
| `maxInfo` | `12` | 单页最多处理几份 MediaInfo |
| `onlyTorrentDetail` | `false` | `true` 时只在详情页 URL 运行 |
| `extraSelectors` | 若干 PT 常见容器 | 站点容器特殊时补选择器 |
| `descriptionSelectors` | 若干简介容器 | 非表格布局时定位简介区块 |
| `excludeHosts` | `[]` | 不想生效的域名 |

## 工作原理（简述）

1. **识别**：遍历元素，对文本按「是否像 MediaInfo / BDInfo」打分（`General` 段头、`Complete name`、`File size`、`Encoding settings`、`Disc Title` / `Disc Size` / `.MPLS` / `Total Bitrate`、已整理好的中文格式等），分数够高才算；再按「有没有视频段 / 有没有 General 段 / 是不是原盘」排序挑容器，避免只抓到半截
2. **补齐**：选中的文本缺少 `General` 段（文件名 / 体积 / 日期）时，先沿上层节点找回，再退到整页文本里捞一次（原盘 BDInfo 没有文件名 / 日期概念，不做这套兜底）
3. **解析**：分段解析 `General/Video/Audio/Text`，格式化为中文整理格式（码率、声道、语种、字幕标题去重等）；没有压制命令行时用编码配置兜底「参数」
4. **原盘解析**：BDInfo 先按 `Key: value` 收字段，再按 `VIDEO / AUDIO / SUBTITLES` 大段解析列对齐表格，两路归一成同样的「 / 分隔字段串」；换行被站点吞掉、整段粘成一行时按已知键位还原后再解析
5. **渲染**：字幕过多时在显示层折叠小语种（解析结果不改动，复制与原文仍完整）
6. **落位**：找到「简介」所在行，克隆其标签格与内容格，构造一行「媒体信息」插在上方；非表格布局插到简介容器之前；都找不到则悬浮
7. **配色**：从内容格取字体/字号/正文色，标签格取次要色，表格边框取分隔线色（校验与底色的对比度），写入 CSS 变量
8. **异步兼容**：`MutationObserver` + 延迟重扫，异步渲染或点开「展开 MediaInfo」后自动更新

## 更新记录

- **v1.8.0** 适配 16 个 PT 站（HDSky / HDHome / HHanClub / OurBits / PTer / KeepFRDS / SpringSunday / Audiences / U2 / EastGame / OpenCD / TTG / CHDBits / M-Team / FileList / HTPT）；新增「区块前插入」落位，无表格行的模板也能内嵌；诊断与「关于」面板新增站点 / 落位信息
- **v1.7.4** 迁到 GitHub 托管并接入自动更新：仓库 <https://github.com/ljp801005-tech/mediainfo-card>，`@updateURL` / `@downloadURL` 指向 `main` 分支 raw 地址，功能与 1.7.3 一致
- **v1.7.3** 修掉原盘「**碟名永远为空**」：BDInfo 0.7.5.x 导出的 `DISC INFO` 只有 `Disc Label`、没有 `Disc Title`，之前只认 `Disc Title`，所以碟名一栏一直空着；现在没有 `Disc Title` 时用 `Disc Label` 顶到碟名行（同一串名字只显示一次，「复制整理文本」也不再留下「标签: —」），只有 `Disc Label` 的碟报同样能判定成原盘；诊断信息改为把时长、总码率、帧率、分辨率、视频、音频条数、字幕条数一次全列出来
- **v1.7.2** 修掉「**一份都没识别到、卡片完全不出现**」：站点把简介里的空格写成 `&nbsp;`（或全角空格），或者把简介放进同源 iframe / shadow root 时，原来的识别门槛会把整段判成「不像」而直接跳过；现在先把 `&nbsp;` 与全角空格摊平再评分，扫描范围补上同源 iframe 与 shadow root，并新增整页兜底解析；诊断里的「未识别到」也改为列出可读根节点、页面标记、`textarea`/`pre`/`iframe`/`shadowRoot` 数量与得分最高的容器，一眼能看出问题在哪
- **v1.7.1** 修掉 BDInfo **长格式**（`DISC INFO` / `PLAYLIST REPORT` / `VIDEO` / `AUDIO` / `SUBTITLES` 分段表格）在换行被站点吞掉时**视频、音频、字幕全空**的问题：按分段标题、表头行、行首编解码名把换行还原；表格分列不再把括号里的双空格当分隔符（音频内核不再显示成 `48 kHz / / 1509 kbps`）；整段粘连的文本不再因「没有换行」被评分扣分而直接落选
- **v1.7.0** 新增 **BDInfo（原盘）** 解析：`Disc Title` / `Disc Label` / `Disc Size` / `Playlist` / `Length` / `Total Bitrate` 与 `Video`、`Audio`、`Subtitle` 各轨道都能识别，卡片对应换成「碟名 / 标签 / 体积（正片·整盘）/ 播放列表 / 时长 / 总码率 / 帧率 / 分辨率 / 视频 / 音频 / 字幕」；兼容 PT 常见的短格式与 BDInfo 导出的分段表格长格式，换行被吞掉、整段粘成一行也能还原；字节数自动换算 GiB，`Protection` 并入播放列表
- **v1.6.3** 日期只认 MediaInfo 自己的字段（`Encoded date` / `Tagged date` / `Released date`）：源里没写就留空显示「—」，**不会拿种子发布时间来顶**；同时去掉中文「发布日期 / 发布日」标签，避免在中文站上误取种子发布日；诊断信息新增「日期来源」一行
- **v1.6.2** 段头识别支持 BBCode 前缀：帖子把 MediaInfo 贴进引用块后段头会变成「引用 Video」「引用: Audio」，之前这种写法整个段认不出来（表现为分辨率、视频、音频全空），现在能正常解析；卡片改为按「解析结果」判断是否需要重绘，页面异步补齐 MediaInfo 后会自动从「—」变成真实值
- **v1.6.1** 文件名 / 日期 / 体积的兜底不再依赖「General」段头：只要页面上出现过 `Complete name` / `File size` / `Encoded date`（含站点种子信息表里的「文件大小」「文件名」），就补进卡片；修掉「`<br>` 换行的 MediaInfo 被误判成已分行、标签粘连成 `…319Complete name : x` 导致兜底失效」的问题；版本面板新增「复制诊断信息」，一键复制「抓到什么、缺什么」
- **v1.6.0** 修复部分种子只显示视频 / 音频、文件名与体积为空的问题：站点把 `General` 段拆到相邻节点或另一行时，脚本会自动把文件名、体积、日期找回来；「参数」在没有 `Encoding settings` 的 WEB-DL / 蓝光源上改用 `Format profile` / `Format settings` / 位深兜底，不再整行空白；「时长」不再丢掉秒数（`45 min 25 s` 显示为 `45min 25s`）
- **v1.5.0** 字幕轨道超过 5 条时只保留中 / 英文字幕，其余折叠为「+ 更多（N）」（点击展开全部）；新增 `subtitleCollapseThreshold` / `subtitleKeepLangs` 配置
- **v1.4.2** 编辑种子页 `/edit.php` 与发种上传页 `/upload.php` 不再启用（这两页的 MediaInfo 是贴进输入框提交的，卡片会挡表单、也会误识别）
- **v1.4.1** 补全元数据：新增英文描述 `@description:en` 与 `@license MIT`（Greasy Fork 发布要求）
- **v1.4.0** 内嵌样式改为融入站点：去掉白底/阴影/圆角与彩色色条，字体字号配色从「简介」行采样，工具栏收进标题行，左侧加原生「媒体信息」行标签
- **v1.3.0** 字段按宽度自适应分列，短字段并排、长字段跨行，与简介内容列对齐
- **v1.2.0** 修正位置：作为独立表格行放到「简介」上方，不再被折叠进简介内容
- **v1.1.0** 限定 hdwing.org；适配折叠/隐藏区块、`<br>` 排版、异步加载与深浅主题
- **v1.0.0** 首版

## 常见问题

**装好了但页面没反应？** 先确认地址在站点清单里（没列的站需自行加 `@match`），再确认这一页确实有 MediaInfo 文本。有卡片但字段为空或位置不对时点「诊断」，里面会写明站点、落位方式与每个字段的解析结果。

**卡片跑到右下角，没插在简介上方？** 说明没找到「简介」所在的行，可在 `CONFIG.descriptionSelectors` 补上站点简介容器选择器。

**字幕只显示了几条，其它字幕去哪了？** 字幕超过 5 条时会自动折叠小语种以免卡片过长，点字幕最后的「+ 更多（N）」即可展开全部；「复制」和「原文」里始终是完整字幕。不想折叠就把 `subtitleCollapseThreshold` 设为 `0`。

**颜色 / 字体和站点还是有点不一样？** 内嵌样式是从「简介」行采样的，若站点用图片或特殊皮肤可能取不到合适值，把 `followSiteStyle` 设为 `false` 即用脚本自带样式。

**日期显示成「—」？** 说明这段 MediaInfo 里没有 `Encoded date`（常见于 WEB-DL、以及只写了 `Writing application` 的源）。这是**预期行为**：卡片里的「日期」始终是压制／封装日期，脚本不会用站点上的种子发布日、添加时间来填充，两者含义不同。想核对的话点版本号 →「复制诊断信息」，里面有一行「文本含 Encoded date」。

**文件名 / 体积显示成「—」，但分辨率和音视频都正常？** 说明脚本抓到的这段文本里没有 `General` 段（帖子只贴了 `Video`、`Audio`），或者站点把这段拆到了别的节点。v1.6.1 会按标签在整个页面（含隐藏域、`textarea`、种子信息表）里找回 `Complete name` / `File size` / `Encoded date`。仍然为空时点标题行右侧版本号 →「复制诊断信息」，把内容发出来即可定位。

**「参数」显示的是 `High@L5 · CABAC · 5 Ref Frames` 这种？** 这是 WEB-DL / 原盘类资源：没有重编码，自然没有 x264/x265 的命令行参数，脚本改用编码配置兜底显示。只有压制组重编码的种子才会出现 `crf=20`、`preset=slow` 这类真实参数。

**原盘 BDInfo 也支持吗？卡片字段怎么和 MediaInfo 不一样？** 支持（v1.7.0 起）。原盘没有「文件名 / 编码日期 / 编码参数」这些概念，硬套只会得到三行「—」，所以卡片自动换成原盘自己的字段：碟名、标签、体积（正片·整盘）、播放列表、总码率等，取不到的字段整行不显示。想看原文点「原文」，原始碟报一字不改。

**体积显示的是 `22.65 GiB`，帖子里写的是 `24,324,173,767 bytes`，对不上？** 脚本按 1024 进制把字节数换算成 GiB（`24,324,173,767 B ≈ 22.65 GiB`），帖子里的 `21.97 GB` 之类是按 1000 进制或商家口径算的，两者本来就不同。要精确值看「原文」。

## 已知限制

- 只识别**文本形式**的 MediaInfo / BDInfo，截图或图片无法识别；BDInfo 只取主播放列表（`Playlist` / 第一个 `Name: xxx.MPLS`）的音视频，多盘、多版本（剧场版 / 加长版）需分别贴
- 原盘的多条中文字幕在 BDInfo 里通常都只写 `Chinese`，脚本无法据此区分简 / 繁，只能按码率区分
- 位置优化主要针对表格布局的详情页，div 布局已兼容但不对齐到「简介」标签列
- 站点改版导致容器变化时，可能需要更新 `extraSelectors` / `descriptionSelectors`
- 需要页面本身能读到 MediaInfo 文本（登录后才显示的内容需先登录）

## 许可证

MIT，可自由修改与再分发。

---

**English summary**: Extracts MediaInfo **and BDInfo** text (including hidden / collapsed / `<textarea>` / `<br>`-wrapped blocks) from PT torrent detail pages and renders it as a native-looking "media info" row above the description table, with site-sampled fonts and colors, one-click copy of a tidy plain-text summary, floating / inline modes, subtitle folding when a release carries more than five text tracks, and dark-theme support. For BDInfo it shows disc title / label / disc & feature size / playlist with protection / total bitrate instead of file name, encode date and encoder settings. Currently scoped to hdwing.org — edit `@match` to use it on other PT sites.
```

## 当前版本

| 项 | 值 |
| --- | --- |
| 版本 | 1.7.0 |
| 脚本 ID | 605024 |
| 线上地址 | https://greasyfork.org/zh-CN/scripts/605024 |
| 新增版本入口 | 脚本页 →「管理」→ 新建版本，粘贴本地 `mediainfo-card.user.js`，版本号与 `@version` 一致（1.7.0） |
| 提交后校验 | 从 `https://update.greasyfork.org/scripts/605024/mediainfo-card.user.js` 重新下载 → `node --check` → 与本地 `diff`（只应差自动注入的 `@updateURL` / `@downloadURL`） |
| 效果图 | `preview-mediainfo-card-v1.7.0-BDInfo.png`（原盘 BDInfo 效果），脚本页附件同名替换 |

## 本次（1.7.0）改动摘要

1. 新增 BDInfo 短格式 / 长格式解析，原盘字段组独立（碟名 / 标签 / 体积 / 播放列表 / 总码率）
2. 识别链路补上 BDInfo 打分、容器候选、`<br>` 换行丢失还原
3. 诊断信息新增「格式」与 BDInfo 字段检查行
4. 单测：BDInfo 20 项 + 既有回归 47 / 29 / 14 / 29 项全部通过
