# Greasy Fork 发布信息

## 表单字段

| 字段 | 填入内容 |
| --- | --- |
| 脚本名称 | MediaInfo 媒体信息卡片 |
| 简述 | 把 PT 种子详情页里的 MediaInfo / 原盘 BDInfo 自动整理成与站点同款的「媒体信息」行，折叠隐藏也能读，支持一键复制整理文本。 |
| 语言 | 汉语（中国） |
| 分类 | 其他 |
| 适用网站 | 由脚本 `@match` 自动识别（16 个 PT 站：HDChina / HDHome / HHanClub / OurBits / PTer / KeepFRDS / U2 / TLF / TTG / CHDBits / M-Team / FileList / HTPT / BTN，另有 2 站按站方要求不点名） |
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

`@match` 共 30 条，覆盖 **16 个站点**（下表 / 附加信息里列出 14 个，另有 2 个按站方要求不点名，适配照旧）：HDChina 瓷器、HDHome、HHanClub、OurBits、PTer、KeepFRDS、U2、TLF、TTG、CHDBits、M-Team、FileList、HTPT、BTN。其中 14 个站点同时放行裸域与 `*.域`，U2、TLF 只放行精确子域（不加通配，避免误伤父域）。站点域名一律不写明文，只留首字母 + `***` + 后缀（如 `h***.org`），完整地址见脚本 `@match`。

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

**1.12.0** 认出两种以前整块失效的贴文：一是引用框把「引用」和 `General` 粘成一行（页面上表现为「识别份数 0」，其它字段明明都在），二是中文版 MediaInfo 导出的全中文标签（通用 / 视频 / 音频 / 文本 #1、完整名称、文件大小、1小时 3 分钟、6 声道、是 / 否），现在都能正常出卡片。
完整历史见 <https://github.com/ljp801005-tech/mediainfo-card/releases> 或仓库里的 `docs/CHANGELOG.md`。

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

**English summary**: Extracts MediaInfo **and BDInfo** text (including hidden / collapsed / `<textarea>` / `<br>`-wrapped blocks) from PT torrent detail pages and renders it as a native-looking "media info" row above the description table, with site-sampled fonts and colors, one-click copy of a tidy plain-text summary, floating / inline modes, subtitle folding when a release carries more than five text tracks, and dark-theme support. For BDInfo it shows disc title / label / disc & feature size / playlist with protection / total bitrate instead of file name, encode date and encoder settings. Ships with 16 PT sites out of the box (HDChina, HDHome, HHanClub, OurBits, PTer, KeepFRDS, U2, TLF, TTG, CHDBits, M-Team, FileList, HTPT, BTN and two more that are not listed by request; domain names are masked as `***` on purpose) and handles Gazelle templates, NexusPHP and HTML-only MediaInfo panels; edit `@match` to add your own.
```

## 当前版本

| 项 | 值 |
| --- | --- |
| 版本 | 1.12.0 |
| 脚本 ID | 605024 |
| 线上地址 | https://greasyfork.org/zh-CN/scripts/605024 |
| 新增版本入口 | 脚本页顶部标签「**代码**」（即 `/scripts/605024/versions/new`，不在「管理」页）→ 粘贴 `dist/mediainfo-card.gf.user.js` → 填更新说明 → 发布。若已配置源码同步，代码与附加信息均由 GitHub 自动同步，无需手动操作 |
| 提交后校验 | 从 `https://update.greasyfork.org/scripts/605024/mediainfo-card.user.js` 重新下载 → `node --check` → 与本地 `diff`（只应差自动注入的 `@updateURL` / `@downloadURL`） |
| 效果图 | 仓库 `screenshots/` 下 `13-theme-auto-split.png`（主题判定修复前后）、`14-filelist-image-bg.png`（背景图底色）、`15-multicol-panel.png`（多栏面板重排前后）、`16-about-version-note.png`（关于面板只留一条版本说明）、`17-subtitles-merged.png`（面板缺字幕栏时合成一份后的效果） 、`18-native-panel-hidden.png`（站点自带面板收起后只剩卡片一行） 、`19-prose-kept.png`（简介与原文同块时保留原文，简介打开正常）、`20-update-dot.png`（有新版本时版本号旁的提醒红点） |

## 本次（1.12.0）改动摘要

1. 引用框里的 `General` 段头：NexusPHP 的简介格是 `<fieldset><legend>引用</legend>General…`，`textContent` 读出来第一行是「引用General」；评分只认裸 `General`，整块卡在 5 分（门槛 6）→ 页面「识别份数 0」。现在段头按「可带引用前缀」判断，与 `Video / Audio` 的识别口径一致
2. 中文界面 MediaInfo：中文版导出的段头与字段名全中文（通用 / 视频 / 音频 / 文本 #1 / 菜单，完整名称、文件大小、总体码率、声道数…），标签用全角空格对齐、还夹全角字母（ＩＤ、／、（）），一条英文标签都匹配不上 → 得分 0。新增标签翻译层，值侧还原「1小时 3 分钟 → 1h 3min」「6 声道 → 6 channels」「10 位 → 10 bits」「是 / 否 → Yes / No」等本地化写法
3. 诊断面板的「标签写法」能直接区分三种写法（中文界面 / 原始参数名 / 普通写法），段头带「引用」前缀时也会单独标出来
4. 扩展与脚本版本统一：构建时清掉历史遗留的 `dist/mediainfo-card-extension/`，只保留 `dist/extension/`（manifest 版本仍从 `@version` 生成），避免「加载了旧目录、版本号对不上脚本」
5. 回归：`node --check`、sites 16 站、parse 61 条、version 16 条、extension 自检全过

