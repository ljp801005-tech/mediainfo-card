// ==UserScript==
// @name         MediaInfo 媒体信息卡片
// @name:en      MediaInfo Card for PT Torrent Pages
// @namespace    workbuddy/mediainfo-card
// @version      1.7.4
// @description  自动识别页面上的 MediaInfo 与 BDInfo（原盘）贴文（含隐藏/折叠区块），生成结构化媒体信息卡片：文件名/碟名/日期/体积/时长/帧率/参数/分辨率/视频/音频/字幕。支持悬浮拖拽、内嵌页面、复制整理文本、查看原始、多份信息切换、深浅色自适应。
// @description:en  Detects MediaInfo and BDInfo text on the page (including hidden or collapsed blocks) and renders it as a structured card: file name, disc title, date, size, duration, frame rate, encoding settings, resolution, video, audio and subtitles. Supports floating/inline placement, drag to move, copy as clean text, raw view, multiple entries and light/dark themes.
// @author       WorkBuddy
// @license      MIT
// @match        *://hdwing.org/*
// @match        *://*.hdwing.org/*
// @exclude      *://hdwing.org/edit.php*
// @exclude      *://*.hdwing.org/edit.php*
// @exclude      *://hdwing.org/upload.php*
// @exclude      *://*.hdwing.org/upload.php*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// @noframes
// @homepageURL  https://github.com/ljp801005-tech/mediainfo-card
// @supportURL   https://github.com/ljp801005-tech/mediainfo-card/issues
// @updateURL    https://raw.githubusercontent.com/ljp801005-tech/mediainfo-card/main/mediainfo-card.user.js
// @downloadURL  https://raw.githubusercontent.com/ljp801005-tech/mediainfo-card/main/mediainfo-card.user.js
// ==/UserScript==

/*
 * 适用范围：仅 https://hdwing.org/（含子域）的种子详情页等页面
 *           编辑种子页 /edit.php、发种上传页 /upload.php 不启用
 *           （元数据 @exclude + CONFIG.excludePaths 双重排除）
 *
 * 使用说明
 * 1) 在 Tampermonkey 新建脚本，粘贴本文件内容保存即可；或把本文件拖入扩展页安装。
 *    @match 已锁定 hdwing.org，其他任何站点都不会加载本脚本；要换站只需改 @match。
 *    @exclude 已排除 /edit.php 与 /upload.php：这两页是发种/编辑表单，MediaInfo 要贴进
 *    输入框，卡片插进去会挡住表单，也会把待提交的内容误识别成已有信息。
 *    要再加排除页：补 @exclude 一行，或往 CONFIG.excludePaths 里加路径（如 '/comment.php'）。
 * 2) 只有页面文本里真的出现 MediaInfo 特征时才会渲染，其它页面零副作用。
 *    若想进一步限定「只在种子详情页」运行，把 CONFIG.onlyTorrentDetail 改成 true。
 * 3) 默认卡片作为独立一行插在「简介」上方（截图里的表格布局），不占用简介内容、不会被折叠；
 *    简介内容被站点脚本收起时卡片照样可见。用 CONFIG.insertPosition 可改位置，工具栏也能切悬浮。
 *    内嵌样式会「融入站点」：字体、字号、正文色、次要色、分隔线都从「简介」行采样
 *    （CONFIG.followSiteStyle），所以卡片不再是页面上一块突兀的白板。悬浮时拖动标题栏可移动并记住位置。
 * 4) 快捷键 Alt + M 显示/隐藏；油猴菜单里有切换模式、重置位置、重新扫描、版本信息。
 * 5) 字幕轨道过多时会自动折叠：只列出中 / 英文字幕，其余收进「+ 更多（N）」；
 *    阈值和保留语言见 CONFIG.subtitleCollapseThreshold / subtitleKeepLangs。
 * 6) 站点容器太特殊时，往 CONFIG.extraSelectors 里补选择器即可。
 *
 * 版本与发版
 * - 版本号以元数据 @version 为唯一来源，脚本运行时从 GM_info 读取；卡片右下角显示 vX.Y.Z，
 *   点击可查看更新记录和当前生效配置，油猴菜单里也有「关于 / 版本」。
 * - 以后改功能时：① 递增 @version；② 在下方 RELEASE_NOTES 里加一条记录。保存后 Tampermonkey
 *   会因为版本号变化提示脚本已更新（手动粘贴安装的脚本，重新粘贴一次即可）。
 * - 本脚本已托管在 GitHub：https://github.com/ljp801005-tech/mediainfo-card
 *   @updateURL / @downloadURL 指向仓库 main 分支的 raw 地址，改动 push 上去、并把 @version
 *   递增，已安装的用户（Tampermonkey 默认 24 小时检查一次，也可手动「检查脚本更新」）就会拿到新版。
 *   注意 raw.githubusercontent.com 有几分钟 CDN 缓存，刚 push 完可能还取到旧文件，属正常。
 * - 同一份文件也会同步发到 Greasy Fork（脚本 ID 605024）；GF 会写入它自己的 updateURL，
 *   所以「装的是哪一份」决定从哪更新：从 GitHub 链接装的走 GitHub，从 GF 装的走 GF。
 *
 * 更新记录
 *   1.7.4  迁到 GitHub 托管并接入 raw 自动更新（@updateURL/@downloadURL/@homepageURL/@supportURL）
 *   1.7.3  原盘只有 Disc Label 时用它兜底碟名；诊断一次列出全部字段
 *   1.6.3  「日期」只认 MediaInfo 自己的字段（Encoded date / Tagged date / Released date），不再取中文「发布日期」类标签，源里没有就留空显示「—」；诊断信息新增「日期来源」一行
 *   1.6.2  段头支持「引用 / 代码 / 原文」等 BBCode 前缀（引用 Video 不再漏判）；卡片按解析结果判断是否重绘
 *   1.6.1  文件名 / 体积 / 日期改为「不依赖 General 段头」的整页标签兜底，并把站点信息表的中文标签（文件大小等）纳入兜底；新增「诊断」复制排查信息
 *   1.6.0  修复 General 段被拆到别的节点时文件名 / 体积 / 日期为空；「参数」在没有压制命令行时改用编码配置兜底；时长不再丢秒
 *   1.5.0  字幕轨道超过 5 条时只保留中 / 英文字幕，其余折叠为「+ 更多（N）」
 *   1.4.2  编辑种子页 /edit.php 与发种上传页 /upload.php 不启用（@exclude + CONFIG.excludePaths 双重排除）
 *   1.4.1  补全元数据：新增英文描述 @description:en 与 @license MIT（Greasy Fork 发布必需）
 *   1.4.0  内嵌样式改为融入站点：去掉白底/阴影/圆角与彩色色条，字体字号配色从「简介」行采样，工具栏收进标题行
 *   1.3.0  美化版式：字段按宽度自适应分列，短字段并排、长字段跨行，卡片与简介内容列对齐
 *   1.2.0  修正卡片位置：作为独立表格行放到「简介」上方，不再被折叠进简介内容
 *   1.1.0  仅 hdwing.org 生效；适配详情页折叠/隐藏区块、<br> 排版、异步加载与深浅主题；新增版本信息
 *   1.0.0  首版：自动识别 MediaInfo 并生成结构化卡片，支持悬浮/内嵌、复制整理文本、多份切换
 */

(function () {
  'use strict';

  /* ============================ 配置 ============================ */

  const store = {
    get(k, d) {
      try {
        const v = typeof GM_getValue === 'function'
          ? GM_getValue(k, d)
          : localStorage.getItem('MI_CARD_' + k);
        return v === undefined || v === null || v === '' ? d : v;
      } catch (e) { return d; }
    },
    set(k, v) {
      try {
        if (typeof GM_setValue === 'function') GM_setValue(k, v);
        else localStorage.setItem('MI_CARD_' + k, String(v));
      } catch (e) { /* ignore */ }
    }
  };

  // 版本号以元数据 @version 为唯一来源：Tampermonkey 通过 GM_info 提供，无需在代码里重复维护
  const VERSION = (typeof GM_info !== 'undefined' && GM_info && GM_info.script && GM_info.script.version)
    ? GM_info.script.version
    : '1.7.4';
  const RELEASE_NOTES = [
    { v: '1.7.4', d: '脚本迁到 GitHub 托管（https://github.com/ljp801005-tech/mediainfo-card），元数据新增 @homepageURL / @supportURL / @updateURL / @downloadURL，从 GitHub 安装的版本以后由 Git 仓库直接推送更新；功能与 1.7.3 一致' },
    { v: '1.7.3', d: '修复「碟名」永远为空：BDInfo 0.7.5.x 导出的 DISC INFO 只写 Disc Label、不写 Disc Title，之前只认 Disc Title 所以碟名一栏空着。现在没有 Disc Title 时用 Disc Label 顶到碟名行（同一串名字只显示一次，「复制整理文本」也不再残留「标签: —」）；只有 Disc Label 的贴文也能判定为原盘公告；诊断信息改为把碟名/标签/体积/播放列表/时长/总码率/帧率/分辨率/视频/音频条数/字幕条数一次全列出来' },
    { v: '1.7.2', d: '修复「识别份数 0、完全不出卡片」：扫描范围扩到同源 iframe 与 shadow root（简介被模板或美化脚本放进这些位置时，主文档根本读不到），并新增整页兜底解析；「未识别到」时的诊断改为列出可读根节点、页面标记、textarea/pre/iframe/shadowRoot 数量与得分最高的容器，便于一次定位' },
    { v: '1.7.1', d: '修复 BDInfo 长格式（DISC INFO / PLAYLIST REPORT / VIDEO / AUDIO / SUBTITLES 分段表格）在换行被站点吞掉时视频、音频、字幕全空的问题：按分段标题、表头、行首编解码名把换行还原；表格分列不再把括号里的双空格当分隔符（音频内核不再出现「48 kHz / / 1509 kbps」）；粘连文本不再因缺少换行而被评分扣分导致整段落选' },
    { v: '1.7.0', d: '新增 BDInfo（原盘）解析：Disc Title / Disc Label / Disc Size / Playlist / Length / Total Bitrate 与 Video、Audio、Subtitle 各轨道都能识别，自动分成「碟名 / 标签 / 体积（正片·整盘）/ 播放列表 / 时长 / 总码率 / 帧率 / 分辨率 / 视频 / 音频 / 字幕」；同时兼容 PT 常见的「一行一字段短格式」和 BDInfo 导出的「分段列表长格式」，换行被吞掉、整段粘成一行也能还原' },
    { v: '1.6.3', d: '「日期」严格取自 MediaInfo（Encoded date / Tagged date / Released date），源里没有就留空显示「—」，不会用站点发布时间顶替；去掉中文「发布日期 / 发布日」标签，避免误取种子发布日；诊断信息新增「日期来源」一行' },
    { v: '1.6.2', d: '段头识别支持 BBCode 前缀：「引用 Video」「引用: Audio」这类写法不再漏判（之前会导致分辨率、视频、音频全空）；卡片改为按解析结果判断是否需要重绘，页面异步补齐 MediaInfo 后会自动从「—」变成真实值' },
    { v: '1.6.1', d: '文件名 / 日期 / 体积拿到不依赖「General」段头的整页兜底：只要页面上出现过 Complete name / File size / Encoded date（含站点信息表的中文「文件大小」），一律补进卡片；新增「诊断」按钮，可一键复制排查信息' },
    { v: '1.6.0', d: '修复部分种子只有视频 / 音频信息、文件名与体积为空的问题（General 段被站点拆到其它节点时自动找回）；「参数」在没有 Encoding settings 时改用 Format profile / settings 兜底；时长不再丢秒' },
    { v: '1.5.0', d: '字幕轨道超过 5 条时，只列出中 / 英文字幕，其余折叠为「+ 更多（N）」，点击可展开全部' },
    { v: '1.4.2', d: '/edit.php 与 /upload.php 不再启用（@exclude + CONFIG.excludePaths 双重排除）' },
    { v: '1.4.1', d: '补全元数据：新增英文描述 @description:en 与 @license MIT，满足 Greasy Fork 发布要求' },
    { v: '1.4.0', d: '内嵌样式改为融入站点：去掉白底/阴影/圆角与彩色色条，字体字号与配色从「简介」行采样，工具栏收进标题行' },
    { v: '1.3.0', d: '美化版式：字段按宽度自适应分列，短字段并排、长字段跨行，卡片与简介内容列对齐' },
    { v: '1.2.0', d: '修正卡片位置：作为独立表格行放到「简介」上方，不再被折叠进简介内容' },
    { v: '1.1.0', d: '仅 hdwing.org 生效；适配详情页折叠/隐藏区块、<br> 排版、异步加载与深浅主题；新增版本信息' },
    { v: '1.0.0', d: '首版：自动识别 MediaInfo 生成结构化卡片，支持悬浮/内嵌、复制整理文本、多份切换' }
  ];
  const MODE_LABEL = { auto: '智能', float: '悬浮', inline: '内嵌' };
  const THEME_LABEL = { auto: '自动', light: '亮色', dark: '暗色' };

  const CONFIG = {
    // 'auto' = 智能（原区块可见则内嵌，折叠/隐藏则悬浮）；'float' = 始终悬浮；'inline' = 始终插到原区块前
    mode: store.get('mi_mode', 'auto'),
    theme: store.get('mi_theme', 'auto'), // 'auto' | 'light' | 'dark'
    paramLimit: 8,        // 「参数」一行最多显示几个关键参数，点「+ 全部」看全部
    maxInfo: 12,          // 一个页面最多处理几份 MediaInfo（详情页多版本种子时可用 ‹ › 切换）
    // 字幕轨道超过这个数量时，卡片只列出中 / 英文字幕，其余收进「+ 更多（N）」，点开可看全部
    // 设为 0 可关闭折叠；解析与「复制整理文本」始终保留完整字幕，不受影响
    subtitleCollapseThreshold: 5,
    subtitleKeepLangs: ['zh', 'en'], // 折叠时保留的语言分组，可加 'ja' 之类
    onlyTorrentDetail: false, // true = 只在种子详情页 URL 运行（列表页/论坛页跳过）
    // 'above-intro' = 作为独立一行放到「简介」上方（hdwing.org 表格布局，推荐）
    // 'before-mediainfo' = 插在原 MediaInfo 元素之前（会落在简介文字里，一般不用）
    insertPosition: 'above-intro',
    gridMinCol: 300,      // 悬浮卡片自适应列宽：单列最小宽度
    inlineMinCol: 340,    // 内嵌时分栏宽度：内嵌占满整列，340 表示约 900px 宽时排 2 列
    followSiteStyle: true, // 内嵌时从「简介」行采样站点的字体、字号、正文色、次要色、分隔线色，做到融入页面
    descriptionSelectors: [ // 非表格布局时，用来定位「简介 / 描述」区块
      '#kdescr', '#descr', '#description', '#torrent-description', '#torrent_descr',
      '.description', '.descr', '.torrent-description', '.torrent-descr',
      '[id*="descr" i]', '[class*="descr" i]', '[class*="description" i]',
      '[id*="intro" i]', '[class*="intro" i]', '.info-content', '.detail-content', 'blockquote'
    ],
    extraSelectors: [     // PT 站常见 MediaInfo 容器，逐个容错查找
      '.mediainfo', '#mediainfo', '[class*="mediainfo" i]', '[id*="mediainfo" i]',
      '.codemain', '.codetop + div', '#kdescr pre', '#descr pre', '.bbcode pre',
      '.torrent-info pre', '.torrent-detail pre', '[class*="collapse" i] pre',
      'textarea[id*="info" i]', 'textarea[class*="info" i]'
    ],
    excludeHosts: [],     // 例：['example.com']
    // 这些路径不运行。默认排除 hdwing.org 的编辑种子页 /edit.php 与发种上传页 /upload.php：
    // 这两页的 MediaInfo 是要贴进输入框提交的，卡片插进去会挡住表单，也会把待提交内容误识别成已有信息。
    // @exclude 已挡一层，这里是兜底（管理器对通配支持不佳时仍然生效）。
    excludePaths: ['/edit.php', '/upload.php']
  };

  // 常见 PT 详情页 URL：torrents.php?id= / details.php?id= / /torrents/123 / /t/123 / /detail/123
  const DETAIL_URL_RE = /((^|\/)(torrents?|details?)\.php\?|\/(torrents?|details?|t|d)\/\d+|\/(torrent|detail)[/_-]?\d+|\/(torrent|detail)\/|[?&](id|tid|torrent_?id)=\d+)/i;

  const ROWS = [
    { k: 'fileName',   label: '文件名',   g: 'file' },
    { k: 'date',       label: '日　期',   g: 'file' },
    { k: 'size',       label: '体　积',   g: 'file' },
    { k: 'duration',   label: '时　长',   g: 'video' },
    { k: 'fps',        label: '帧　率',   g: 'video' },
    { k: 'params',     label: '参　数',   g: 'video', expandable: true },
    { k: 'resolution', label: '分辨率',   g: 'video' },
    { k: 'video',      label: '视　频',   g: 'video' },
    { k: 'audio',      label: '音　频',   g: 'audio' },
    { k: 'subtitle',   label: '字　幕',   g: 'subtitle' }
  ];

  // BDInfo（原盘）没有「文件名 / 编码日期 / 编码参数」，换成原盘自己的字段。
  // optional 的行取不到就整行不显示，避免一屏「—」。
  const BD_ROWS = [
    { k: 'discTitle',  label: '碟　名',   g: 'file', optional: true },
    { k: 'discLabel',  label: '标　签',   g: 'file', optional: true },
    { k: 'size',       label: '体　积',   g: 'file' },
    { k: 'playlist',   label: '播放列表', g: 'file', optional: true },
    { k: 'duration',   label: '时　长',   g: 'video' },
    { k: 'bitrate',    label: '总码率',   g: 'video' },
    { k: 'fps',        label: '帧　率',   g: 'video' },
    { k: 'resolution', label: '分辨率',   g: 'video' },
    { k: 'video',      label: '视　频',   g: 'video' },
    { k: 'audio',      label: '音　频',   g: 'audio' },
    { k: 'subtitle',   label: '字　幕',   g: 'subtitle' }
  ];

  const LANG_CN = {
    filipino: '菲律宾语', tagalog: '他加禄语', chinese: '中文', mandarin: '普通话',
    cantonese: '粤语', english: '英语', japanese: '日语', korean: '韩语',
    thai: '泰语', german: '德语', french: '法语', spanish: '西班牙语',
    italian: '意大利语', russian: '俄语', portuguese: '葡萄牙语', hindi: '印地语',
    vietnamese: '越南语', indonesian: '印尼语', arabic: '阿拉伯语', turkish: '土耳其语',
    dutch: '荷兰语', polish: '波兰语', swedish: '瑞典语', danish: '丹麦语',
    norwegian: '挪威语', finnish: '芬兰语', hebrew: '希伯来语', ukrainian: '乌克兰语',
    czech: '捷克语', greek: '希腊语', malay: '马来语', latin: '拉丁语'
  };

  const AUDIO_FMT = {
    'flac': 'FLAC', 'aac': 'AAC', 'aac lc': 'AAC', 'ac-3': 'DD', 'ac3': 'DD',
    'e-ac-3': 'DD+', 'eac3': 'DD+', 'dts': 'DTS', 'dts-hd master audio': 'DTS-HD MA',
    'dts-hd high resolution audio': 'DTS-HD HRA', 'mlp fba': 'TrueHD',
    'truehd': 'TrueHD', 'opus': 'Opus', 'vorbis': 'Vorbis', 'mp3': 'MP3',
    'pcm': 'PCM', 'lpcm': 'LPCM', 'alac': 'ALAC', 'wma': 'WMA'
  };

  const SUB_FMT = {
    'pgs': 'SUP', 's_hdmv/pgs': 'SUP', 's_text/utf8': 'SRT', 'utf-8': 'SRT',
    's_text/ass': 'ASS', 'ass': 'ASS', 'ssa': 'SSA', 'subrip': 'SRT',
    'vobsub': 'VOB SUB', 'webvtt': 'VTT', 's_text/webvtt': 'VTT', 'timed text': 'TTXT'
  };

  // 关键参数按此顺序优先展示
  const PARAM_KEYS = [
    'me', 'subme', 'rc', 'crf', 'bitrate', 'preset', 'tune', 'ref', 'bframes',
    'aq-mode', 'aq-strength', 'deblock', 'keyint', 'min-keyint', 'psy-rd',
    'qcomp', 'vbv-maxrate', 'vbv-bufsize', 'cabac', 'trellis', 'merange',
    'analyse', 'partitions', 'direct', 'weightp', 'b-adapt', 'b-pyramid',
    'open-gop', 'level', 'sar', 'output-depth', 'colorprim', 'transfer',
    'colormatrix', 'hdr10', 'repeat-headers', 'frame-threads', 'wpp', 'ctu',
    'rd', 'rdoq-level', 'limit-refs', 'no-sao', 'threads', 'lookahead'
  ];

  const CSS = `
.mi-root {
  all: initial !important;
  display: block !important;
  box-sizing: border-box !important;
  font-family: var(--mi-font, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Segoe UI", Roboto, sans-serif) !important;
  font-size: var(--mi-fs, 13px) !important;
  line-height: 1.65 !important;
  color: var(--mi-fg) !important;
  text-align: left !important;
  letter-spacing: normal !important;
  --mi-fg: #26303f; --mi-sub: #78849a; --mi-surface: #fff;
  --mi-line: rgba(38, 48, 63, .13); --mi-hover: rgba(38, 48, 63, .06);
  --mi-accent: #3b6fa8; --mi-key-w: 4.3em;
}
.mi-root.mi-dark {
  --mi-fg: #e6ebf3; --mi-sub: #97a2b5; --mi-surface: #1c222c;
  --mi-line: rgba(230, 235, 243, .13); --mi-hover: rgba(230, 235, 243, .08);
  --mi-accent: #7aa7d9;
}
.mi-root *, .mi-root *::before, .mi-root *::after { box-sizing: border-box !important; }
.mi-float {
  position: fixed !important;
  right: 20px !important; bottom: 20px !important;
  width: 392px !important; max-width: calc(100vw - 32px) !important;
  z-index: 2147483000 !important;
}
.mi-inline { position: static !important; width: 100% !important; margin: 0 !important; }

/* 悬浮 = 独立卡片；内嵌 = 透明融入站点表格 */
.mi-float .mi-box {
  background: var(--mi-surface) !important;
  border: 1px solid var(--mi-line) !important;
  border-radius: 10px !important;
  box-shadow: 0 10px 28px rgba(15, 23, 42, .16) !important;
  overflow: hidden !important;
}
.mi-inline .mi-box {
  background: transparent !important;
  border: 0 !important; border-radius: 0 !important;
  box-shadow: none !important; overflow: visible !important;
}
.mi-head {
  display: flex !important; align-items: center !important; flex-wrap: wrap !important;
  gap: 2px 4px !important;
  padding: 0 0 6px !important;
  border-bottom: 1px solid var(--mi-line) !important;
  user-select: none !important;
}
.mi-float .mi-head {
  padding: 8px 8px 8px 12px !important;
  border-bottom: 1px solid var(--mi-line) !important;
  flex-wrap: nowrap !important;
  cursor: move !important;
}
.mi-title {
  font-size: .95em !important; font-weight: 600 !important;
  color: var(--mi-sub) !important; letter-spacing: .2px !important;
  flex: 1 1 auto !important; min-width: 0 !important;
  white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important;
}
.mi-headacts { display: flex !important; align-items: center !important; gap: 0 !important; flex: none !important; }
.mi-pager { font-size: .9em !important; color: var(--mi-sub) !important; padding: 0 3px !important; white-space: nowrap !important; }
.mi-btn {
  all: unset !important;
  display: inline-flex !important; align-items: center !important; justify-content: center !important;
  height: 22px !important; padding: 0 6px !important;
  border-radius: 4px !important; cursor: pointer !important;
  font-size: .92em !important; color: var(--mi-sub) !important;
  font-family: inherit !important; line-height: 1 !important;
  white-space: nowrap !important;
  transition: color .12s, background .12s !important;
}
.mi-btn:hover { color: var(--mi-fg) !important; background: var(--mi-hover) !important; }
.mi-btn.mi-on { color: var(--mi-accent) !important; background: var(--mi-hover) !important; }
.mi-body { padding: 7px 0 0 !important; }
.mi-float .mi-body { padding: 8px 12px 11px !important; }
.mi-grid {
  display: grid !important;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--mi-min-col, 300px)), 1fr)) !important;
  column-gap: 28px !important; row-gap: 1px !important;
  align-items: start !important; min-width: 0 !important;
}
.mi-inline .mi-grid { --mi-min-col: ${CONFIG.inlineMinCol}px; }
.mi-row {
  display: grid !important;
  grid-template-columns: var(--mi-key-w) minmax(0, 1fr) !important;
  gap: 8px !important; padding: 3px 0 !important;
  align-items: start !important; min-width: 0 !important;
}
.mi-float .mi-row { padding: 5px 0 !important; gap: 10px !important; }
.mi-row-wide { grid-column: 1 / -1 !important; }
.mi-key {
  color: var(--mi-sub) !important; font-size: .96em !important;
  letter-spacing: .2px !important; white-space: nowrap !important;
  padding-top: .08em !important;
}
.mi-val {
  color: var(--mi-fg) !important; font-size: 1em !important;
  min-width: 0 !important; word-break: break-word !important;
  font-variant-numeric: tabular-nums !important;
}
.mi-val-line + .mi-val-line { margin-top: 1px !important; }
.mi-val.mi-empty { color: var(--mi-sub) !important; opacity: .6 !important; }
.mi-val.mi-mono { font-variant-numeric: tabular-nums !important; }
.mi-more {
  all: unset !important; cursor: pointer !important; font-size: .9em !important;
  color: var(--mi-accent) !important; margin-left: 6px !important; white-space: nowrap !important;
  font-family: inherit !important;
}
.mi-more:hover { text-decoration: underline !important; }
/* 字幕折叠入口独占一行，与上面的字幕条目左对齐 */
.mi-more-sub {
  display: block !important; margin: 3px 0 0 !important;
  font-size: .92em !important;
}
.mi-float .mi-scroll { max-height: min(58vh, 460px) !important; overflow-y: auto !important; }
.mi-float .mi-scroll::-webkit-scrollbar { width: 6px !important; }
.mi-float .mi-scroll::-webkit-scrollbar-thumb { background: var(--mi-line) !important; border-radius: 3px !important; }
.mi-foot {
  display: flex !important; align-items: center !important; flex-wrap: wrap !important;
  gap: 0 !important;
  padding: 3px 8px 3px 10px !important;
  border-top: 1px solid var(--mi-line) !important;
}
.mi-raw {
  margin: 8px 0 0 !important; padding: 8px 10px !important;
  background: var(--mi-hover) !important; border: 1px solid var(--mi-line) !important;
  border-radius: 6px !important;
  max-height: 210px !important; overflow: auto !important;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace !important;
  font-size: 11px !important; line-height: 1.5 !important; color: var(--mi-sub) !important;
  white-space: pre !important; word-break: normal !important;
}
.mi-td {
  padding: 4px 12px 8px !important;
  border: 0 !important; background: none !important;
  vertical-align: top !important;
}
.mi-label-cell { white-space: nowrap !important; }
.mi-ver {
  all: unset !important;
  font-family: inherit !important; font-size: .86em !important;
  color: var(--mi-sub) !important; opacity: .8 !important;
  padding: 0 3px !important; cursor: pointer !important; white-space: nowrap !important;
}
.mi-ver:hover { opacity: 1 !important; color: var(--mi-fg) !important; }
.mi-about {
  padding: 8px 0 4px !important;
  border-bottom: 1px solid var(--mi-line) !important;
  font-size: .96em !important; color: var(--mi-fg) !important;
}
.mi-float .mi-about { padding: 8px 12px 6px !important; }
.mi-about-row { display: flex !important; gap: 8px !important; padding: 1px 0 !important; }
.mi-about-row > span:first-child { flex: 0 0 3.2em !important; color: var(--mi-sub) !important; }
.mi-about-sub { margin-top: 7px !important; font-size: .92em !important; color: var(--mi-sub) !important; }
.mi-about-list {
  margin: 3px 0 6px !important; padding-left: 18px !important;
  color: var(--mi-sub) !important; font-size: .92em !important; line-height: 1.55 !important;
}
.mi-about-list li { margin: 2px 0 !important; }
.mi-about-tools { display: flex !important; align-items: center !important; gap: 8px !important; margin-top: 4px !important; flex-wrap: wrap !important; }
.mi-about-tip { font-size: .9em !important; color: var(--mi-sub) !important; }
.mi-fab {
  all: initial !important;
  position: fixed !important; right: 20px !important; bottom: 20px !important;
  width: 40px !important; height: 40px !important; border-radius: 50% !important;
  background: #46536b !important;
  color: #fff !important; font: 600 12px/40px -apple-system, "PingFang SC", sans-serif !important;
  text-align: center !important; cursor: pointer !important;
  box-shadow: 0 4px 14px rgba(15, 23, 42, .28) !important;
  z-index: 2147483000 !important; user-select: none !important;
}
.mi-fab:hover { filter: brightness(1.1) !important; }
@media (max-width: 480px) {
  .mi-float { right: 8px !important; bottom: 8px !important; width: calc(100vw - 16px) !important; }
}
`;

  /* ============================ 文本工具 ============================ */

  function normalizeText(raw) {
    return String(raw || '')
      .replace(/\r\n?/g, '\n')
      .replace(/\u00a0/g, ' ')
      .replace(/\t/g, '  ');
  }

  // 站点的「引用 / 代码」框经常把空格写成 &nbsp;（\u00a0），全角空格 \u3000 也常见。
  // 正则里写的是普通空格，不先摊平就会出现「文本明明在页面上、得分却是 0」的怪现象。
  function flatText(s) {
    return String(s == null ? '' : s)
      .replace(/\u00a0/g, ' ')
      .replace(/[\u2000-\u200a\u202f\u205f\u3000]/g, ' ');
  }

  // 判断一段文本是否像 MediaInfo，返回一个分数
  function scoreMediaInfo(text) {
    if (!text || text.length < 100 || text.length > 90000) return 0;
    text = flatText(text);
    let s = 0;
    if (/(^|\n)\s*General\s*(\n|$)/i.test(text)) s += 3;
    if (/\bComplete name\s*:/i.test(text) || /\bFile name\s*:/i.test(text)) s += 3;
    if (/\bFile size\s*:/i.test(text)) s += 2;
    if (/(^|\n)\s*Video\s*(\n|$)/i.test(text)) s += 2;
    if (/\b(Display aspect ratio|Frame rate|Encoding settings|Writing library)\s*:/i.test(text)) s += 2;
    if (/\bFormat\s*:\s*(Matroska|AVC|HEVC|MPEG-4|FLAC|AAC)/i.test(text)) s += 1;
    if (/\bBit rate\s*:/i.test(text)) s += 1;
    // BDInfo（原盘）贴文完全没有 General / Complete name，必须单独给分，否则根本进不了候选
    const bd = isBDInfo(text);
    if (bd) s += 8;
    // 已经是整理好的中文格式
    if (/文\s*件\s*名\s*[：:]/.test(text) && /体\s*积\s*[：:]/.test(text) && /分\s*辨\s*率\s*[：:]/.test(text)) s += 10;
    const kv = text.split('\n').filter(l => /^.{2,45}\s*[:：]\s*\S/.test(l.trim())).length;
    // 粘连成一行的 BDInfo 没有换行，kv 自然是 0，不能因此扣分（否则整段被判定为「不像」而落选）
    if (kv < 4 && !bd) s -= 5;
    if (text.length > 30000) s -= 3;
    return s;
  }

  function splitMulti(text) {
    // 引用块里的段头可能写成「引用 General」，拆分时也要认；
    // BDInfo 的块头是「Disc Title:」，同一段里贴了两份信息时也能切开。
    const src = '(?=^[ \\t\\u3000]*(?:引用|引自|代码|原文|quote|code)?[ \\t\\u3000]*[:：]?[ \\t\\u3000]*' +
      '(?:General[ \\t\\u3000]*(?:\\n|$)|Disc Title[ \\t\\u3000]*[:：]))';
    const parts = text.split(new RegExp(src, 'gim'))
      .map(t => t.trim()).filter(t => scoreMediaInfo(t) >= 6);
    return parts.length > 1 ? parts : [text];
  }

  function pick(fields, names) {
    for (const n of names) {
      const hit = fields.find(f => f[0].toLowerCase() === n.toLowerCase());
      if (hit && hit[1]) return hit[1];
    }
    for (const n of names) {
      const hit = fields.find(f => f[0].toLowerCase().indexOf(n.toLowerCase()) === 0);
      if (hit && hit[1]) return hit[1];
    }
    return '';
  }

  // 段头识别：MediaInfo 贴进 BBCode 引用块后，段头前会带「引用」「引用:」这类前缀
  // （页面上就长成「引用 Video」）。不剥掉前缀时 Video / Audio 段整个认不出来，
  // 表现为分辨率、视频、音频全空。
  const HEAD_PREFIX = '(?:引用|引自|代码|原文|quote|code)?';
  const HEAD_RE = new RegExp('^' + HEAD_PREFIX + '[\\s\\u3000]*[:：]?[\\s\\u3000]*(General|Video|Audio|Text|Menu|Chapters|Other|Image)(?:\\s*#\\s*\\d+)?$', 'i');
  function sectionHead(line) {
    const s = String(line || '').trim();
    if (!s || s.length > 40) return '';
    const m = s.match(HEAD_RE);
    return m ? m[1] : '';
  }

  // 文本里是否存在某个段头（允许「引用」前缀），比逐行 sectionHead 快
  const headLineRe = name =>
    new RegExp('(^|\\n)[ \\t\\u3000]*' + HEAD_PREFIX + '[ \\t\\u3000]*[:：]?[ \\t\\u3000]*' + name + '\\s*#?\\s*\\d*[ \\t\\u3000]*(\\n|$)', 'i');
  const HAS_GENERAL = headLineRe('General');
  const HAS_VIDEO = headLineRe('Video');
  const HAS_AUDIO = headLineRe('Audio');
  function hasHead(text, name) {
    if (name === 'General') return HAS_GENERAL.test(text);
    if (name === 'Video') return HAS_VIDEO.test(text);
    if (name === 'Audio') return HAS_AUDIO.test(text);
    return headLineRe(name).test(text);
  }

  function parseSections(text) {
    const sections = [];
    let cur = { name: 'General', fields: [] };
    for (const rawLine of text.split('\n')) {
      const line = rawLine.trim();
      if (!line || /^[-=_*]{4,}$/.test(line)) continue;
      const head = sectionHead(line);
      if (head) {
        if (cur.fields.length) sections.push(cur);
        cur = { name: head, fields: [] };
        continue;
      }
      const m = line.match(/^(.{2,60}?)\s*[:：]\s*(.*)$/);
      if (m) cur.fields.push([m[1].trim(), m[2].trim()]);
      else if (cur.fields.length && line.length < 300) cur.fields[cur.fields.length - 1][1] += ' ' + line;
    }
    if (cur.fields.length) sections.push(cur);
    return sections;
  }

  function parseChinese(text) {
    const out = {};
    let last = null;
    const keyRe = /^\s*(文\s*件\s*名|日\s*期|体\s*积|时\s*长|帧\s*率|参\s*数|分\s*辨\s*率|视\s*频|音\s*频|字\s*幕)\s*[：:]\s*(.*)$/;
    for (const line of text.split('\n')) {
      const m = line.match(keyRe);
      if (m) {
        const k = m[1].replace(/[\s\u3000]/g, '');
        const v = m[2].trim();
        if (k === '音频' || k === '字幕') { (out[k] = out[k] || []).push(v); last = { k, arr: true }; }
        else { out[k] = v; last = { k, arr: false }; }
      } else if (last && last.arr && line.trim() && !/^[-=]{3,}$/.test(line.trim())) {
        out[last.k].push(line.trim());
      }
    }
    return {
      fileName: out['文件名'] || '', date: out['日期'] || '', size: out['体积'] || '',
      duration: out['时长'] || '', fps: out['帧率'] || '', params: out['参数'] || '',
      paramsFull: out['参数'] || '', resolution: out['分辨率'] || '',
      video: out['视频'] ? [out['视频']] : [],
      audio: out['音频'] || [], subtitle: out['字幕'] || [],
      _zh: true
    };
  }

  function fmtDate(v) {
    if (!v) return '';
    const m = v.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (!m) return v.replace(/\s+UTC.*/i, '').trim();
    return m[1] + '-' + m[2].padStart(2, '0') + '-' + m[3].padStart(2, '0');
  }

  function fmtDuration(v) {
    if (!v) return '';
    const h = v.match(/(\d+)\s*h(?:ou?r)?\b/i);
    const m = v.match(/(\d+)\s*min/i);
    const s = v.match(/(\d+)\s*s(?:ec)?\b/i);
    const parts = [];
    if (h) parts.push(h[1] + 'h');
    if (m) parts.push(m[1] + 'min');
    if (s) parts.push(s[1] + 's'); // 「45 min 25 s」要保留 25s，不能只剩 45min
    return parts.join(' ') || v;
  }

  function fmtBitrate(v) {
    if (!v) return '';
    return v.replace(/\s+/g, ' ').trim()
      .replace(/(\d)\s*(Gb)\/s\b/gi, '$1 Gbps')
      .replace(/(\d)\s*(Mb)\/s\b/gi, '$1 Mbps')
      .replace(/(\d)\s*(kb|Kb)\/s\b/gi, '$1 Kbps')
      .replace(/(\d)\s+(\d{3})\b/g, '$1$2');
  }

  function fmtFps(v) {
    if (!v) return '';
    return v.replace(/\s*FPS\b/i, ' fps').replace(/\s{2,}/g, ' ').trim();
  }

  function num(v) { return (v || '').replace(/[^\d]/g, ''); }

  function fmtChannels(v) {
    if (!v) return '';
    const m = v.match(/(\d+)\s*channels?/i);
    if (!m) return v.replace(/\s*channels?/i, '').trim();
    const map = { 1: '1.0', 2: '2.0', 3: '2.1', 4: '4.0', 5: '5.0', 6: '5.1', 7: '6.1', 8: '7.1', 10: '7.1.2' };
    return map[+m[1]] || (m[1] + 'ch');
  }

  function mapFmt(v, table) {
    if (!v) return '';
    const k = v.trim().toLowerCase();
    if (table[k]) return table[k];
    for (const key in table) if (k.indexOf(key) === 0 || k.indexOf(key) > 0) return table[key];
    return v.split('/')[0].trim().slice(0, 24);
  }

  function extractParams(settings, limit) {
    if (!settings) return { short: '', full: '', count: 0 };
    const tokens = settings.split(/\s*\/\s*|\s+/)
      .map(t => t.replace(/^--?/, '').trim())
      .filter(t => /^[A-Za-z][A-Za-z0-9._-]*=/.test(t));
    const seen = new Set();
    const ordered = [];
    const keyOf = t => t.split('=')[0].toLowerCase();
    for (const key of PARAM_KEYS) {
      const hit = tokens.find(t => keyOf(t) === key && !seen.has(keyOf(t)));
      if (hit) { seen.add(keyOf(hit)); ordered.push(hit); }
    }
    for (const t of tokens) { const k = keyOf(t); if (!seen.has(k)) { seen.add(k); ordered.push(t); } }
    return { short: ordered.slice(0, limit).join(' '), full: ordered.join(' '), count: ordered.length };
  }

  // WEB-DL / 蓝光源没有重编码，MediaInfo 不会带 Encoding settings（x264/x265 命令行），
  // 这时用 Format profile / settings / 位深等通用描述兜底，避免「参数」整行空白。
  function fallbackParams(fields) {
    const parts = [];
    const profile = pick(fields, ['Format profile']);
    if (profile) parts.push(profile);
    const settings = pick(fields, ['Format settings']);
    if (settings) {
      settings.split(/\s*\/\s*/).forEach(s => { const v = s.trim(); if (v) parts.push(v); });
    }
    const depth = pick(fields, ['Bit depth']);
    if (depth) parts.push(depth.replace(/(\d)\s*bits?\b/i, '$1 bit'));
    const prim = pick(fields, ['Color primaries']);
    if (prim && /^BT\.(709|2020)$/i.test(prim)) parts.push(prim);
    return parts.join(' · ');
  }

  function videoCodec(fields) {
    const fmt = pick(fields, ['Format', 'Codec ID', 'Format profile']);
    const lib = pick(fields, ['Writing library', 'Encoded by', 'Encoding library', 'Encoder']);
    const settings = pick(fields, ['Encoding settings']);
    const blob = lib + ' ' + settings;
    if (/x264/i.test(blob)) return 'x264';
    if (/x265/i.test(blob)) return 'x265';
    if (/nvenc/i.test(blob)) return 'NVENC';
    if (/AVC|H\.264|V_MPEG4\/ISO\/AVC/i.test(fmt)) return 'H.264';
    if (/HEVC|H\.265|V_MPEGH\/ISO\/HEVC/i.test(fmt)) return 'H.265';
    if (/AV1/i.test(fmt)) return 'AV1';
    if (/VP9/i.test(fmt)) return 'VP9';
    if (/MPEG-2/i.test(fmt)) return 'MPEG-2';
    return mapFmt(fmt, {}) || 'Video';
  }

  function fmtAudioTrack(fields) {
    const lang = pick(fields, ['Language', 'Language/String']);
    const fmt = pick(fields, ['Format', 'Format profile', 'Codec ID']);
    const ch = pick(fields, ['Channel(s)', 'Channels', 'Channel layout']);
    const br = pick(fields, ['Bit rate', 'Nominal bit rate', 'Bit rate mode/String']);
    const title = pick(fields, ['Title', 'Comment']);
    const codec = mapFmt(fmt, AUDIO_FMT) || 'Audio';
    const parts = [];
    if (lang) parts.push(lang);
    parts.push(codec);
    const chLabel = fmtChannels(ch);
    if (chLabel) parts.push(chLabel);
    const brLabel = fmtBitrate(br);
    if (brLabel) parts.push('@ ' + brLabel);
    let line = parts.join(' ');
    const notes = [];
    const cn = LANG_CN[(lang || '').toLowerCase()];
    if (cn) notes.push(cn);
    if (title && /简|繁|中|SUP|commentary|SDH|原|国|粤/i.test(title)) notes.push(title);
    if (notes.length) line += ' (' + notes.join(' / ') + ')';
    return line.trim();
  }

  function fmtTextTrack(fields) {
    const lang = pick(fields, ['Language', 'Language/String']);
    const fmt = pick(fields, ['Format', 'Codec ID']);
    const title = pick(fields, ['Title', 'Comment']);
    const codec = mapFmt(fmt, SUB_FMT) || (fmt || 'SUB').slice(0, 20);
    let line = [lang, codec].filter(Boolean).join(' ');
    // 标题本身已含语言和格式时不再重复，避免 "Chinese SRT (Chinese (Simplified) SRT)"
    if (title) {
      const t = title.toLowerCase();
      const dup = !!lang && t.indexOf(lang.toLowerCase()) >= 0 &&
        !!codec && t.indexOf(codec.toLowerCase().split(/[\s/]/)[0]) >= 0;
      line = dup ? title : (line + ' (' + title + ')');
    }
    if (/^yes$/i.test(pick(fields, ['Forced']))) line += ' [强制]';
    return line.trim() || codec;
  }

  // 判断一条字幕属于「中文 / 英文 / 其它」。MediaInfo 里语言可能写在 Language 字段、
  // Title 字段，或整理文本直接写成中文，所以统一对已格式化的一行做匹配。
  function subtitleLangGroup(line) {
    const s = String(line || '').toLowerCase();
    if (/\bchinese\b|\bzho\b|\bchi\b|\bzh\b|\bmandarin\b|\bcantonese\b|zh[-_](cn|hk|tw|sg|hans|hant)|中文|简体|繁体|繁體|简中|繁中|中字|粤语|粵語|国语|國語|普通话|普通話|双语|雙語/.test(s)) return 'zh';
    if (/\benglish\b|\beng\b|\ben\b|en[-_](us|gb)|英文|英语|英語/.test(s)) return 'en';
    return 'other';
  }

  /* ============================ BDInfo（原盘）解析 ============================ */
  //
  // PT 站的原盘贴文有两种写法，都要认：
  //  A. 短格式（最常见，一行一个字段，值内部用「 / 」分隔；Audio / Subtitle 可重复多行）：
  //       Disc Title: ONE LIFE
  //       Disc Label: ONE_LIFE-CMCT
  //       Disc Size: 24,324,173,767 bytes
  //       Playlist: 00001.MPLS
  //       Size: 23,719,065,600 bytes
  //       Length: 1:48:56.863
  //       Total Bitrate: 29.03 Mbps
  //       Video: MPEG-4 AVC Video / 23309 kbps / 1080p / 23.976 fps / 16:9 / High Profile 4.1
  //       Audio: English / Dolby TrueHD Audio / 5.1 / 96 kHz / 2568 kbps / 16-bit (AC3 Embedded: ...)
  //       Subtitle: Chinese / 30.338 kbps
  //  B. 长格式（BDInfo 直接导出）：DISC INFO / PLAYLIST REPORT / VIDEO / AUDIO / SUBTITLES 分段，
  //     每段是列对齐表格（Codec / Language / Bitrate / Description）。
  //
  // 两种都先归一成「 / 分隔的字段串」，再走同一套格式化，卡片与「复制整理文本」结果一致。

  // 键名只允许单空格，值必须紧跟冒号。这样长格式表格行（列之间是多个空格、描述里带冒号）
  // 不会被误当成「键: 值」。
  const BD_KEY_LINE = /^([A-Za-z][A-Za-z0-9_.\/#()+-]*(?: [A-Za-z0-9_.\/#()+-]+){0,5})[ \t\u3000]*[:：][ \t\u3000]*(\S.*)$/;
  const BD_KEY_ALT = 'Disc (?:Title|Label|Size)|Total Bitrate|Playlist|Protection|Subtitles?|Length|Extras|BDInfo|Video|Audio|Size|Name';

  function isBDInfo(text) {
    if (!text || text.length < 60) return false;
    // NBSP 版贴文：Disc&nbsp;Size: 这种写法必须先把空格摊平，否则一条都匹配不上
    const t = flatText(text);
    // 这里刻意不加 \b：换行被吞掉时前后字段会直接粘在一起（…bytesProtection:、
    // 1:48:56.863Total Bitrate:、29.03 MbpsVideo:），加词边界就整段认不出来了
    let s = 0;
    // Disc Label 也算数：BDInfo 0.7.5.x 的 DISC INFO 常常只有 Disc Label，没有 Disc Title
    if (/Disc (?:Title|Label)[ \t]*[:：][ \t]*\S/i.test(t)) s += 2;
    if (/Disc Size[ \t]*[:：][ \t]*[\d,][\d,.\s]*bytes?/i.test(t)) s += 2;
    if (/Playlist[ \t]*[:：][ \t]*\S*\.MPLS/i.test(t)) s += 2;
    if (/Total Bitrate[ \t]*[:：][ \t]*[\d.]+\s*Mbps/i.test(t)) s += 1;
    if (/Video[ \t]*[:：][^\n]{0,90}?\/[ \t]*\d+\s*kbps/i.test(t)) s += 2;
    return s >= 3;
  }

  // 页面把 <br> 吃掉后整段会粘成一行（…ONE_LIFEDisc Label: …），按已知键位补回换行。
  // 键名整体参与匹配（先列长的），所以「Disc Size」里的 Size 不会被单独切开。
  const BD_KEY_NL = new RegExp('(\\n)[ \\t\\u3000]*(?:' + BD_KEY_ALT + ')[ \\t\\u3000]*[:：]', 'i');
  const BD_UNGLUE = new RegExp('(' + BD_KEY_ALT + ')([ \\t\\u3000]*[:：])', 'g');

  // BDInfo 长格式（DISC INFO / PLAYLIST REPORT / VIDEO / AUDIO / SUBTITLES 分段表格）在换行被
  // 吞掉后，整段会粘成「…48 kHz /  1509 kbps / 16-bit)DTS-HD Master Audio Japanese 1565 kbps…」，
  // 表格行全挤在一行里，按行解析自然一个字段都取不到。下面按结构把换行补回来：
  //   1) 分段标题 DISC INFO: / PLAYLIST REPORT: / VIDEO: / AUDIO: / SUBTITLES:
  //   2) 表头行 Codec…Description 与分隔线 -----
  //   3) 每行行首的编解码名（只在上一种是 ) 、数字、kbps 或分隔线之后才切，避免把
  //      短格式「Video: MPEG-4 AVC Video / …」的取值切成两行）
  const BD_SECTION_ALT = 'DISC INFO|PLAYLIST REPORT|QUICK SUMMARY|FILES?|CHAPTERS?|VIDEO|AUDIO|SUBTITLES?|TEXTS?';
  const BD_ROW_START = 'DTS-HD Master Audio|DTS-HD High-Res Audio|DTS-HD HRA|DTS Express Audio|' +
    'DTS-ES Audio|DTS Audio|Dolby TrueHD Audio|Dolby Digital Plus Audio|Dolby Digital Audio|' +
    'Dolby Atmos Audio|LPCM Audio|MPEG-4 MVC Video|MPEG-4 AVC Video|MPEG-2 Video|VC-1 Video|' +
    'HEVC Video|AVC Video|Presentation Graphics|TextST';
  const BD_UNGLUE_SEC = new RegExp('([^\\n])((?:' + BD_SECTION_ALT + ')[ \\t\\u3000]*[:：])', 'gi');
  const BD_SPLIT_HEAD = /([:：][ \t]*)((?:Codec|Language)[ \t]{2,}[^\n]*?Description)/gi;
  const BD_SPLIT_DASH = /([^\n])(-{3,}[ \t]+-{3,}[^\n]*)/g;
  // 只在上一种以 ) / kbps / 分隔线收尾时切（数字不算：短格式里「MPEG-4 AVC Video」的 4 会被当成行尾，
  // 一切就变成「MPEG-4」+「AVC Video」，视频字段只剩 MPEG-4）
  const BD_SPLIT_ROW = new RegExp('(kbps|\\)|-{2,})([ \\t]*)(' + BD_ROW_START + ')', 'gi');

  function bdLines(text) {
    const t = normalizeText(text);
    if (BD_KEY_NL.test(t)) return t.split('\n');
    const hasTable = /-{3,}[ \t]+-{3,}/.test(t);   // 有分隔线的才是分段表格，短格式不参与行切分
    let out = t.replace(BD_UNGLUE, '\n$1$2')
      .replace(BD_UNGLUE_SEC, '$1\n$2');
    if (hasTable) {
      out = out.replace(BD_SPLIT_HEAD, '$1\n$2')
        .replace(BD_SPLIT_DASH, '$1\n$2')
        .replace(BD_SPLIT_ROW, '$1\n$3');
    }
    return out.replace(/^[ \t\u3000]*\n+/, '')
      .replace(/\n{2,}/g, '\n')
      .split('\n');
  }

  // BDInfo 的表格靠「2 个以上空格」分列，但描述里的 (DTS Core: 5.1 / 48 kHz /  1509 kbps)
  // 也含双空格，直接 split 会把括号切开，拼回去就成了「48 kHz / / 1509 kbps」。
  // 这里只在括号外分列。
  function bdCols(s) {
    const out = [];
    let buf = '', depth = 0, sp = 0;
    for (const ch of String(s || '')) {
      if (ch === '(' || ch === '（') depth++;
      else if ((ch === ')' || ch === '）') && depth > 0) depth--;
      if (depth === 0 && (ch === ' ' || ch === '\t')) { sp += ch === '\t' ? 2 : 1; buf += ch; continue; }
      if (depth === 0 && sp >= 2 && buf.trim()) { out.push(buf.trim()); buf = ''; }
      sp = 0;
      buf += ch;
    }
    if (buf.trim()) out.push(buf.trim());
    return out.filter(Boolean);
  }

  // 按「 / 」拆字段，但要保护括号里的斜杠：
  // 16-bit (AC3 Embedded: 5.1 / 48 kHz / 640 kbps / DN -31dB) 必须保持完整
  function bdSplitSlash(s) {
    const out = [];
    let buf = '';
    let depth = 0;
    for (const ch of String(s || '')) {
      if (ch === '(' || ch === '（') depth++;
      else if ((ch === ')' || ch === '）') && depth > 0) depth--;
      if (ch === '/' && depth === 0) { out.push(buf.trim()); buf = ''; continue; }
      buf += ch;
    }
    if (buf.trim()) out.push(buf.trim());
    return out.filter(Boolean);
  }

  function bdBytes(v) {
    const n = +String(v || '').replace(/[^\d]/g, '');
    if (!n) return '';
    const units = [['TiB', 1099511627776], ['GiB', 1073741824], ['MiB', 1048576], ['KiB', 1024]];
    for (const u of units) if (n >= u[1]) return (n / u[1]).toFixed(2) + ' ' + u[0];
    return n + ' B';
  }

  // 1:48:56.863 → 1h 48min 56s
  function bdDuration(v) {
    const s = String(v || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
    const m = s.match(/^(\d+):(\d{1,2}):(\d{1,2})(?:\.\d+)?$/);
    if (!m) return s;
    const h = +m[1], mi = +m[2], sec = +m[3];
    const out = [];
    if (h) out.push(h + 'h');
    if (h || mi) out.push(mi + 'min');
    out.push(sec + 's');
    return out.join(' ');
  }

  function bdLangName(v) {
    const raw = String(v || '').trim();
    const key = raw.toLowerCase().replace(/\s*\(.*$/, '').trim();
    return LANG_CN[key] || raw;
  }
  function bdIsLang(v) {
    const key = String(v || '').trim().toLowerCase().replace(/\s*\(.*$/, '').trim();
    return !!key && !!LANG_CN[key] && key.indexOf('/') < 0;
  }

  const BD_CODEC_MAP = [
    [/MVC/i, 'H.264 MVC'], [/MPEG-4 AVC|AVC/i, 'H.264'], [/HEVC|H\.?265/i, 'H.265'],
    [/VC-1/i, 'VC-1'], [/MPEG-2/i, 'MPEG-2'], [/AV1/i, 'AV1'], [/VP9/i, 'VP9']
  ];

  // Video: MPEG-4 AVC Video / 23309 kbps / 1080p / 23.976 fps / 16:9 / High Profile 4.1
  function bdVideo(value) {
    const parts = bdSplitSlash(value);
    const codecRaw = parts.shift() || '';
    const o = { codec: '', br: '', res: '', fps: '', aspect: '', profile: '' };
    for (const [re, name] of BD_CODEC_MAP) if (!o.codec && re.test(codecRaw)) o.codec = name;
    if (!o.codec) o.codec = codecRaw.replace(/\s*Video$/i, '').trim().slice(0, 24);
    for (const p of parts) {
      if (!o.br && /kbps|Mbps/i.test(p)) { o.br = fmtBitrate(p); continue; }
      if (!o.res && /\d{3,4}\s*[pP]\b/.test(p)) { o.res = p; continue; }
      if (!o.res && /\d{3,4}\s*[x×]\s*\d{3,4}/i.test(p)) { o.res = p; continue; }
      if (!o.fps && /fps/i.test(p)) { o.fps = fmtFps(p); continue; }
      if (!o.aspect && /^\d+(\.\d+)?\s*:\s*\d+(\.\d+)?$/.test(p)) { o.aspect = p.replace(/\s+/g, ''); continue; }
      if (!o.profile && /profile|level|@L/i.test(p)) { o.profile = p; continue; }
    }
    return o;
  }

  function bdAudioCodec(name) {
    const s = String(name || '').replace(/\s*Audio$/i, '').trim();
    if (/TrueHD/i.test(s)) return 'TrueHD';
    if (/Dolby Digital Plus|E-AC-3|DDP/i.test(s)) return 'DD+';
    if (/Dolby Digital|AC-3/i.test(s)) return 'DD';
    if (/DTS-HD Master/i.test(s)) return 'DTS-HD MA';
    if (/DTS-HD High/i.test(s)) return 'DTS-HD HRA';
    if (/DTS Express/i.test(s)) return 'DTS Express';
    if (/DTS[- ]?X/i.test(s)) return 'DTS:X';
    if (/DTS/i.test(s)) return 'DTS';
    if (/LPCM/i.test(s)) return 'LPCM';
    if (/PCM/i.test(s)) return 'PCM';
    if (/FLAC/i.test(s)) return 'FLAC';
    if (/AAC/i.test(s)) return 'AAC';
    if (/MPEG-2/i.test(s)) return 'MP2';
    if (/MPEG-1/i.test(s)) return 'MP1';
    return s.slice(0, 20) || 'Audio';
  }

  // "AC3 Embedded: 5.1 / …" → "AC3 核 5.1 / …"
  function bdNote(s) {
    return String(s || '')
      .replace(/^([A-Za-z0-9][A-Za-z0-9+ .-]*?)[ \t]+Embedded[ \t]*[:：][ \t]*/i, '$1 核 ')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  }

  // Audio: English / Dolby TrueHD Audio / 5.1 / 96 kHz / 2568 kbps / 16-bit (AC3 Embedded: …)
  function bdAudio(value) {
    const parts = bdSplitSlash(value);
    let lang = '', codecRaw = '', ch = '', br = '', rate = '', depth = '', note = '';
    for (const p of parts) {
      const pm = p.match(/^(.*?)\s*[（(]([^（()）]*)[)）]\s*$/);
      const head = pm ? pm[1].trim() : p;
      if (pm && pm[2]) note = note ? note + ' ' + pm[2] : pm[2];
      if (!head) continue;
      if (!br && /kbps|Mbps/i.test(head)) { br = fmtBitrate(head); continue; }
      if (!rate && /kHz/i.test(head)) { rate = head; continue; }
      if (!depth && /\d\s*-?\s*bits?\b/i.test(head)) { depth = head.replace(/(\d)\s*-?\s*bits?\b/i, '$1-bit'); continue; }
      if (!ch && /^\d(\.\d){0,2}$/.test(head)) { ch = head; continue; }
      if (!lang && bdIsLang(head)) { lang = head; continue; }
      if (!codecRaw && /Audio|AC-3|E-AC-3|DTS|LPCM|PCM|TrueHD|Atmos|FLAC|AAC|MPEG|Opus|Vorbis/i.test(head)) { codecRaw = head; continue; }
    }
    if (!codecRaw && !lang && !br) return '';
    const head = [];
    if (lang) head.push(bdLangName(lang));
    head.push(bdAudioCodec(codecRaw) + (ch ? ' ' + ch : ''));
    if (br) head.push('@ ' + br);
    let line = head.join(' ');
    const extras = [rate, depth].filter(Boolean);
    if (extras.length) line += ' · ' + extras.join(' / ');
    if (note) line += '（' + bdNote(note) + '）';
    return line.trim();
  }

  // Subtitle: Chinese / 30.338 kbps
  function bdSub(value) {
    const parts = bdSplitSlash(value);
    let lang = '', codec = '', br = '';
    for (const p of parts) {
      if (!br && /kbps|Mbps/i.test(p)) { br = fmtBitrate(p); continue; }
      if (!lang && bdIsLang(p)) { lang = p; continue; }
      if (!codec && /[A-Za-z]{2,}/.test(p)) codec = p;
    }
    const codecName = /Presentation Graphics|PGS|Graphics/i.test(codec) ? 'SUP' : codec.replace(/\s*Subtitle$/i, '').slice(0, 16);
    const head = [lang ? bdLangName(lang) : '', codecName].filter(Boolean).join(' ');
    if (!head && !br) return '';
    return (head || 'SUB') + (br ? (head ? ' · ' : '') + br : '');
  }

  function parseBDInfo(text) {
    const lines = bdLines(text);

    // ---- 短格式：Key: value ----
    const kv = [];
    for (const line of lines) {
      const s = line.trim();
      if (!s) continue;
      const m = s.match(BD_KEY_LINE);
      if (m) kv.push([m[1].trim().toLowerCase(), m[2].trim()]);
    }
    const one = keys => {
      for (const k of keys) { const h = kv.find(x => x[0] === k && x[1]); if (h) return h[1]; }
      return '';
    };
    const many = keys => kv.filter(x => keys.indexOf(x[0]) >= 0 && x[1]).map(x => x[1]);

    // ---- 长格式：VIDEO / AUDIO / SUBTITLES 分段表格 ----
    const tables = { video: [], audio: [], subtitle: [] };
    let sec = '';
    for (const raw of lines) {
      const s = raw.trim();
      const sm = s.match(/^(VIDEO|AUDIO|SUBTITLES?|TEXTS?)[ \t]*[:：]?$/i);
      if (sm) {
        sec = sm[1].toLowerCase().replace(/s$/, '');
        if (sec !== 'video' && sec !== 'audio') sec = 'subtitle';
        continue;
      }
      if (/^(DISC INFO|PLAYLIST REPORT|QUICK SUMMARY|BDINFO|REPORT|FILES?|CHAPTERS?|EXTRAS?)[ \t]*[:：]?$/i.test(s)) { sec = ''; continue; }
      if (!sec || !s) continue;
      if (/^[-=*~+_\s]{3,}$/.test(s)) continue;
      if (/^(Codec|Language|Bitrate|Description|Chapters?)[ \t]/i.test(s) && /\s{2,}/.test(raw)) continue;
      const cols = bdCols(s);
      if (cols.length < 2) continue;
      tables[sec].push(cols.join(' / '));
      if (tables[sec].length > 60) sec = '';
    }

    const videoRaw = one(['video']) || tables.video[0] || '';
    const audioRaw = many(['audio']).concat(tables.audio);
    const subRaw = many(['subtitle', 'subtitles', 'text']).concat(tables.subtitle);

    const v = bdVideo(videoRaw);
    const audioLines = audioRaw.map(bdAudio).filter(Boolean);
    const subLines = subRaw.map(bdSub).filter(Boolean);

    // BDInfo 0.7.5.x 导出的 DISC INFO 只有 Disc Label，没有 Disc Title（很多站的原盘公告都是这样）。
    // 之前只认 Disc Title，碟名一栏就永远空着。这里用标签兜底，并把「标签」行清空，
    // 让同一串名字只出现在卡片一处，而不是上下两行重复。
    const discTitleRaw = one(['disc title']);
    const discLabelRaw = one(['disc label']);
    const discTitle = discTitleRaw || discLabelRaw;
    const discLabel = discTitleRaw ? discLabelRaw : '';
    const discSize = bdBytes(one(['disc size']));
    const featureSize = bdBytes(one(['size']));
    const totalBitrate = fmtBitrate(one(['total bitrate']));
    const protection = one(['protection']);
    const playlistRaw = one(['playlist', 'name']);

    const sizeLines = [];
    if (featureSize) sizeLines.push('正片 ' + featureSize);
    if (discSize && discSize !== featureSize) sizeLines.push('整盘 ' + discSize);
    if (!sizeLines.length && featureSize) sizeLines.push(featureSize);

    const playlist = playlistRaw
      ? playlistRaw.replace(/\s+/g, '') + (protection ? '（' + protection + ' 加密）' : '')
      : '';

    const videoLine = v.codec
      ? v.codec + (v.br ? ' @ ' + v.br : '') + (v.profile ? ' · ' + v.profile : '')
      : '';

    return {
      fileName: '',
      date: '',
      size: sizeLines,
      duration: bdDuration(one(['length'])),
      bitrate: totalBitrate,
      fps: v.fps,
      params: '', paramsFull: '', paramCount: 0,
      resolution: [v.res, v.aspect].filter(Boolean).join(' · '),
      video: videoLine ? [videoLine] : [],
      audio: audioLines,
      subtitle: subLines,
      discTitle: discTitle,
      discLabel: discLabel,
      // 碟名来自哪一行：title = 原文有 Disc Title；label = 由 Disc Label 兜底（诊断时用）
      discTitleFrom: discTitleRaw ? 'title' : (discLabelRaw ? 'label' : ''),
      playlist: playlist,
      rows: BD_ROWS,
      raw: normalizeText(text),
      _zh: false,
      _bd: true
    };
  }

  function parseInfo(text) {
    const t = normalizeText(text);
    // 原盘 BDInfo：没有 General 段，字段名也和 MediaInfo 完全不同，单独走一条解析
    if (isBDInfo(t) && !HAS_GENERAL.test(t)) {
      const bd = parseBDInfo(t);
      bd.raw = t;
      return bd;
    }
    if (/文\s*件\s*名\s*[：:]/.test(t) && !/(^|\n)\s*General\s*(\n|$)/i.test(t)) {
      const info = parseChinese(t);
      info.raw = t;
      return info;
    }

    const sections = parseSections(t);
    const gen = (sections.find(s => /^General/i.test(s.name)) || { fields: [] }).fields;
    const videos = sections.filter(s => /^Video/i.test(s.name));
    const audios = sections.filter(s => /^Audio/i.test(s.name));
    const texts = sections.filter(s => /^Text/i.test(s.name));

    const complete = pick(gen, ['Complete name', 'File name', 'Movie name', 'File']) || '';
    const fileName = complete.split(/[\\/]/).pop().trim();
    const dateRaw = pick(gen, ['Encoded date', 'Tagged date', 'File last modification date', 'Released date', 'Recorded date', 'Original release date']);
    const vf = videos.length ? videos[0].fields : [];
    const settings = pick(vf, ['Encoding settings']) || pick(gen, ['Encoding settings']);
    const par = extractParams(settings, CONFIG.paramLimit);
    const fbParams = par.short ? '' : fallbackParams(vf);
    const width = num(pick(vf, ['Width']));
    const height = num(pick(vf, ['Height']));
    const dar = pick(vf, ['Display aspect ratio']) || '';
    const resolution = (width && height)
      ? width + ' x ' + height + (dar ? ' (' + dar.replace(/\s+/g, '') + ')' : '')
      : '';

    let vbr = pick(vf, ['Bit rate', 'Nominal bit rate', 'Overall bit rate']) || pick(gen, ['Overall bit rate']);
    const codec = videoCodec(vf);
    const videoLine = [codec, fmtBitrate(vbr) ? '@ ' + fmtBitrate(vbr) : ''].filter(Boolean).join(' ');

    const audioLines = audios.map(s => fmtAudioTrack(s.fields)).filter(Boolean);
    const subtitleLines = texts.map(s => fmtTextTrack(s.fields)).filter(Boolean);

    const info = {
      fileName: fileName,
      date: fmtDate(dateRaw),
      size: pick(gen, ['File size', 'Stream size']),
      duration: fmtDuration(pick(gen, ['Duration']) || pick(vf, ['Duration'])),
      fps: fmtFps(pick(vf, ['Frame rate', 'Original frame rate', 'Frame rate/String'])),
      params: par.short || fbParams,
      paramsFull: par.full || fbParams,
      paramCount: par.count,
      resolution: resolution,
      video: videoLine ? [videoLine] : [],
      audio: audioLines,
      subtitle: subtitleLines,
      raw: t,
      _zh: false
    };
    return info;
  }

  // 生成与示例一致的「整理文本」，供复制使用
  function infoToText(info) {
    const lines = [];
    const rows = info.rows || ROWS;
    for (const r of rows) {
      let v = info[r.k];
      if (Array.isArray(v)) v = v.filter(Boolean);
      else v = v ? [v] : [];
      if (!v.length) {
        // 可选行（碟名 / 标签 / 播放列表）取不到就整行不写，别留一堆「标签: —」
        if (!r.optional) lines.push(r.label + ': —');
        continue;
      }
      v.forEach((line, i) => {
        if (i === 0) lines.push(r.label + ': ' + line);
        else lines.push(line);
      });
    }
    return lines.join('\n');
  }

  /* ============================ 页面扫描 ============================ */

  // PT 站常把 MediaInfo 用 <br> 或「每行一个 div」呈现，textContent 会丢掉换行，这里补回来
  let cloneCount = 0;
  // 文本里已经出现「段头独占一行」才算换行真的还在。原来只看换行数量，
  // 页面其它地方的换行会让 br 版 MediaInfo 被误判成「已多行」，标签于是粘成一串
  // （…319Complete name : xxx），整页兜底也跟着失效。
  const HAD_STRUCTURE = new RegExp('(^|\\n)[ \\t\\u3000]*' + HEAD_PREFIX +
    '[ \\t\\u3000]*[:：]?[ \\t\\u3000]*(General|Video|Audio|Text)\\s*#?\\s*\\d*[ \\t\\u3000]*(\\n|$)', 'i');
  // BDInfo 版：要求「键在小写换行之后」，用来证明换行确实还在（整段粘成一行时不会误判）。
  // 长格式还要认 DISC INFO: / PLAYLIST REPORT: / SUBTITLES: 这类分段标题和表头行。
  const HAD_BD_STRUCTURE = new RegExp('(\\n)[ \\t\\u3000]*(Disc (?:Title|Label|Size)|Playlist|Total Bitrate|Length|' +
    'Subtitles?|Audio|DISC INFO|PLAYLIST REPORT|QUICK SUMMARY|VIDEO|AUDIO|SUBTITLES|[A-Z][A-Za-z ]*[ \\t]{2,}Bitrate)[ \\t\\u3000]*[:：]?', 'i');
  function readText(node) {
    if (!node) return '';
    if (node.tagName === 'TEXTAREA' || node.tagName === 'INPUT') return node.value || '';
    // &nbsp; 先摊平成普通空格：引用框里的 BDInfo 全靠这个才能被下面的正则认出来
    const txt = flatText(node.textContent || '');
    if (!txt) return '';
    // 一个换行都没有、但文本很长：多半是 <br> 版（textContent 把换行吃掉了）。
    // 这时不能再走「子元素少就直接用原文」的省事分支，否则整段粘连的 BDInfo 表格无从解析。
    const noNL = txt.indexOf('\n') < 0 && txt.length > 120;
    if (HAD_STRUCTURE.test(txt) || HAD_BD_STRUCTURE.test(txt) || (!noNL && node.children.length < 6) || cloneCount > 160) return txt;
    cloneCount++;
    try {
      const clone = node.cloneNode(true);
      clone.querySelectorAll('script,style,noscript').forEach(n => n.remove());
      clone.querySelectorAll('br').forEach(b => b.replaceWith('\n'));
      // 节点可能来自 iframe / shadow root，文本节点必须用它自己的 ownerDocument 创建
      const doc = clone.ownerDocument || document;
      // 只给块级元素补换行：行内元素（span/font）补了会把「Complete name」这类标签拆成两行
      clone.querySelectorAll('div,p,li,tr,td,th,pre,section').forEach(b => b.appendChild(doc.createTextNode('\n')));
      return flatText(clone.textContent || txt);
    } catch (e) { return txt; }
  }

  // 整页文本：强制做一次 br / 块级换行还原，并把卡片自己注入的节点剔掉，
  // 供「按标签兜底」使用（不受 readText 的省事分支影响）
  // 简介有可能不在主文档里：有的模板塞进同源 iframe，有的被美化脚本放进 shadow root。
  // 这两种情况下 document.body.textContent / querySelectorAll 一律看不到内容，
  // 结果就是「识别份数 0」。这里把所有可读的根都收集起来。
  function collectRoots() {
    if (!document.body) return [document];
    const roots = [document];
    const seen = new Set([document]);
    const stack = [document.body];
    let guard = 0;
    while (stack.length && guard++ < 3000) {
      const node = stack.pop();
      if (!node.querySelectorAll) continue;
      let list;
      try { list = node.querySelectorAll('*'); } catch (e) { continue; }
      for (const n of list) {
        if (n.shadowRoot && !seen.has(n.shadowRoot)) {
          seen.add(n.shadowRoot);
          roots.push(n.shadowRoot);
          stack.push(n.shadowRoot);
        }
        if (n.tagName === 'IFRAME' || n.tagName === 'FRAME') {
          let d = null;
          try { d = n.contentDocument; } catch (e) { d = null; }   // 跨域会抛，直接跳过
          if (d && d.body && !seen.has(d)) {
            seen.add(d);
            roots.push(d);
            stack.push(d.body);
          }
        }
      }
    }
    return roots;
  }

  // 取某个根（文档 / shadow root）的文本，强制还原 <br> 与块级换行
  function rootText(root) {
    const src = root.body || root;
    if (!src) return '';
    try {
      const clone = src.cloneNode(true);
      clone.querySelectorAll('script,style,noscript,svg,iframe,object,.mi-root,[data-mi-host]').forEach(n => n.remove());
      clone.querySelectorAll('br').forEach(b => b.replaceWith('\n'));
      const doc = clone.ownerDocument || document;
      clone.querySelectorAll('div,p,li,tr,td,th,pre,section,h1,h2,h3,h4,h5,h6,fieldset,blockquote')
        .forEach(b => b.appendChild(doc.createTextNode('\n')));
      return clone.textContent || '';
    } catch (e) { return src.textContent || ''; }
  }

  // 整页文本：主文档 + 同源 iframe + shadow root，剔掉卡片自己注入的节点
  function pageText() {
    let out = '';
    try { out = collectRoots().map(rootText).join('\n'); } catch (e) { out = document.body ? document.body.textContent || '' : ''; }
    return flatText(out);
  }

  // 命中的节点可能来自 iframe / shadow root，落位时要映射回主文档里的承载元素
  function anchorOf(node) {
    try {
      const r = node.getRootNode && node.getRootNode();
      if (!r) return node;
      if (r.host) return r.host;                        // shadow root → 宿主元素
      if (r !== document && r.documentElement) {        // iframe → 承载它的 frame 元素
        for (const f of document.querySelectorAll('iframe,frame')) {
          try { if (f.contentDocument === r) return f; } catch (e) { /* ignore */ }
        }
        return document.body;
      }
    } catch (e) { /* ignore */ }
    return node;
  }

  // 候选全空时找「最小且含关键标签」的容器当落位点
  function tightAnchor() {
    const key = /\b(Disc Label|Disc Size|Complete name|File size|Total Bitrate|File size)\b/i;
    let best = null, bestLen = Infinity;
    for (const root of collectRoots()) {
      const src = root.body || root;
      if (!src || !src.querySelectorAll) continue;
      let list;
      try { list = src.querySelectorAll('div,pre,td,section,article,fieldset,blockquote,p'); } catch (e) { continue; }
      for (const n of list) {
        const t = n.textContent || '';
        if (t.length < 100 || t.length > 20000 || !key.test(t)) continue;
        if (t.length < bestLen) { bestLen = t.length; best = anchorOf(n); }
      }
    }
    return best;
  }

  // 最后一道兜底：候选为空，但整页文本确实像 MediaInfo / BDInfo，就直接拿整页文本解析。
  // 文本太长时截取包含段头的片段，避免超长文本被评分函数直接判 0。
  function fallbackFromPage() {
    let txt = pageText();
    if (!txt || txt.length < 100) return null;
    if (txt.length > 60000) {
      const m = /(DISC INFO|^(?:\s*)General)\b/im.exec(txt);
      const i = m ? m.index : 0;
      txt = txt.slice(Math.max(0, i - 200), i + 60000);
    }
    const sc = scoreMediaInfo(txt);
    if (sc < 6) return null;
    return { el: tightAnchor() || document.body, text: normalizeText(txt), score: sc, len: txt.length };
  }

  // 诊断用：列出得分最高的容器，含「进不了候选」的那些
  function rankBlocks(limit) {
    const out = [];
    let guard = 0;
    for (const root of collectRoots()) {
      const src = root.body || root;
      if (!src || !src.querySelectorAll) continue;
      let list;
      try { list = src.querySelectorAll('div,pre,td,section,article,fieldset,blockquote,p'); } catch (e) { continue; }
      for (const n of list) {
        if (guard++ > 6000) break;
        const t = n.textContent || '';
        if (t.length < 100) continue;
        const sc = scoreMediaInfo(t);
        if (sc <= 0) continue;
        out.push({
          sc: sc, len: t.length,
          tag: n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') +
            (typeof n.className === 'string' && n.className ? '.' + n.className.trim().split(/\s+/)[0] : ''),
          prev: t.replace(/\s+/g, ' ').slice(0, 56)
        });
      }
    }
    out.sort((a, b) => (b.sc - a.sc) || (a.len - b.len));
    return out.slice(0, limit).map(b => '  ' + b.sc + ' 分 / ' + b.len + ' 字 / ' + b.tag + ' :: ' + b.prev);
  }

  // 从一段文本里切出 MediaInfo 的 General 段。有的模板把 General（文件名 / 体积 / 日期）
  // 和 Video、Audio 段拆在相邻节点里，只抓到后半段时可以用它补回来。
  function grabGeneralBlock(text) {
    if (!text) return '';
    const lines = text.split('\n');
    const start = lines.findIndex(l => sectionHead(l) === 'General');
    if (start < 0) return '';
    const out = [];
    for (let i = start; i < lines.length && out.length < 40; i++) {
      const head = i > start ? sectionHead(lines[i]) : '';
      if (head && head !== 'General') break;
      out.push(lines[i]);
    }
    const block = out.join('\n').trim();
    return /\b(Complete name|File name|File size|Encoded date)\s*:/i.test(block) ? block : '';
  }

  // 整页标签兜底：不依赖「General」段头，也不依赖容器选择。只要页面上（含隐藏 input、
  // textarea、站点自己的种子信息表）出现过这些标签，就把值取回来。
  // 1.6.0 的兜底仍然要求有一行单独写着 General，页面把段头吞掉 / 段头在别的节点里就失效，
  // 这正是「文件名、体积还是空」的原因，所以这里改成按标签直接找。
  const PAGE_LABELS = {
    name: ['Complete name', 'File name', 'Movie name', 'File', '文件名', '文件名称'],
    size: ['File size', '文件大小', '文件尺寸', '体\\s*积', '大小'],
    // 日期只认 MediaInfo 自己的字段。刻意不放「发布日期 / 发布日 / 发布时间」这类中文标签：
    // 中文站上它们指的是种子发布日，与压制日期不是一回事；取不到就留空，不用站点时间顶替。
    date: ['Encoded date', 'Tagged date', 'Released date', 'Original release date', 'Recorded date', 'File last modification date']
  };
  function pageLabelScan() {
    const buf = [];
    const push = t => { if (t && t.length && t.length < 500000) buf.push(t); };
    cloneCount = 0;
    push(pageText());
    document.querySelectorAll('textarea').forEach(n => push(n.value || ''));
    document.querySelectorAll('pre').forEach(n => push(readText(n)));
    document.querySelectorAll('input[type="hidden"]').forEach(n => push(n.value || ''));
    const all = buf.join('\n');

    // 收集某个标签的所有取值，交给校验函数挑第一个像样的，避免「大小」误中分辨率之类。
    // 英文标签不强制前置分隔符：有的模板把上一行内容直接粘在前面（…319Complete name : x）
    const values = labels => {
      const out = [];
      for (const l of labels) {
        const head = /^[A-Za-z]/.test(l) ? '' : '(?:^|[\\s\\u3000])';
        const re = new RegExp(head + '(' + l + ')[\\s\\u3000]*[:：][\\s\\u3000]*(\\S[^\\n]{0,300})', 'gi');
        let m, guard = 0;
        while ((m = re.exec(all)) && guard++ < 24) {
          const v = m[2].trim().replace(/^["“'‘]|["”'’]$/g, '').trim();
          if (v) out.push(v);
        }
      }
      return out;
    };
    const firstMatch = (labels, test) => values(labels).find(v => test(v)) || '';

    const isSize = v => /^(约\s*)?[\d.,]+\s*(B|bytes?|KiB|MiB|GiB|TiB|KB|MB|GB|TB)\b/i.test(v);
    const isName = v => /\.(mkv|mp4|m4v|ts|m2ts|avi|iso|wmv|flv|mov|rmvb|rm|mpg|mpeg|webm|divx)\b/i.test(v);
    const isDate = v => /\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(v);

    // 标签都找不到时，退一步看页面标题 / 一级标题：NexusPHP 详情页标题常直接是发布名
    let titleName = '';
    if (!firstMatch(PAGE_LABELS.name, isName)) {
      const cands = [document.title || ''];
      document.querySelectorAll('h1, h2, #top, .torrent-title, .title, title').forEach(n => cands.push(n.textContent || ''));
      const re = /[^\s/|:：<>()（）\[\]]{2,}\.(mkv|mp4|m4v|ts|m2ts|avi|iso|wmv|flv|mov|rmvb|mpg|mpeg|webm)\b/i;
      for (const c of cands) {
        const m = c.match(re);
        if (m) { titleName = m[0].trim(); break; }
      }
    }

    return {
      name: firstMatch(PAGE_LABELS.name, isName) || titleName,
      size: firstMatch(PAGE_LABELS.size, isSize),
      date: firstMatch(PAGE_LABELS.date, isDate),
      hasGeneral: /(^|\n)[ \t]*General[ \t]*(\n|$)/i.test(all),
      hasCompleteName: /\b(Complete name|File name)\s*[:：]/i.test(all),
      hasFileSize: /\bFile size\s*[:：]/i.test(all),
      textLen: all.length
    };
  }

  // 沿祖先往上找 General 段（最多 4 层），用于补齐被拆开的 MediaInfo
  function generalWithin(node) {
    let cur = node && node.parentElement;
    for (let i = 0; i < 4 && cur && cur !== document.body && cur !== document.documentElement; i++) {
      cloneCount = 0;
      const block = grabGeneralBlock(readText(cur));
      if (block) return block;
      cur = cur.parentElement;
    }
    return '';
  }

  function collectInfos() {
    if (!document.body) return [];
    const roots = collectRoots();
    // 快速门槛要看「所有可读根」的文本：简介在 iframe / shadow root 里时，
    // 主文档 body 上根本没有这些关键词，原来的门槛会把整页直接跳过。
    const quick = flatText(roots.map(r => { const s = r.body || r; return s ? (s.textContent || '') : ''; }).join(' '));
    const quickOk = /Complete name|File size|Encoding settings|Display aspect ratio|Disc Title|Disc Label|Disc Size|Total Bitrate|\.MPLS|DISC INFO|\bGeneral\b|文\s*件\s*名|体\s*积/i.test(quick);
    const skipTag = /^(SCRIPT|STYLE|NOSCRIPT|SVG|IFRAME|INPUT|SELECT|OPTION|CANVAS|VIDEO|AUDIO|IMG|TABLE|UL|OL)$/;
    const candidates = [];
    const add = (n, txt, bonus) => {
      if (!n || !txt || txt.length < 100 || txt.length > 80000) return;
      const score = scoreMediaInfo(txt) + (bonus || 0);
      if (score >= 6) candidates.push({ el: n, text: normalizeText(txt), score: score, len: txt.length });
    };

    if (quickOk) {
      cloneCount = 0;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
        acceptNode(node) {
          if (node.classList && (node.classList.contains('mi-root') || node.classList.contains('mi-fab'))) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      let node;
      while ((node = walker.nextNode())) {
        if (skipTag.test(node.tagName)) continue;
        add(node, readText(node), 0);
      }
    }

    // 同源 iframe / shadow root：主文档查不到内容时，简介往往在这里（+1 分，优先于主文档的半截文本）
    for (const root of roots) {
      if (root === document) continue;
      const src = root.body || root;
      if (!src) continue;
      const doc = src.ownerDocument || document;
      cloneCount = 0;
      let walker;
      try {
        walker = doc.createTreeWalker(src, NodeFilter.SHOW_ELEMENT, null);
      } catch (e) { continue; }
      let node, guard = 0;
      while ((node = walker.nextNode()) && guard++ < 6000) {
        if (skipTag.test(node.tagName)) continue;
        add(anchorOf(node), readText(node), 1);
      }
    }

    // 折叠/隐藏区块：hidden input、textarea、以及各 PT 模板的特有容器
    document.querySelectorAll('input[type="hidden"], textarea').forEach(n => add(n, n.value || '', 0));
    for (const sel of CONFIG.extraSelectors) {
      try {
        document.querySelectorAll(sel).forEach(n => add(n, readText(n), 1));
      } catch (e) { /* 单个非法选择器忽略，不影响其他选择器 */ }
    }
    if (!candidates.length) return [];

    // 排序：先保证「有视频段」（卡片主力信息），再优先自带 General 段的候选，
    // 最后取更具体的容器。原来纯按长度排序会让只含 Video/Audio 的片段压过完整文本，
    // 导致文件名 / 体积 / 日期全空。
    const shape = t =>
      (hasHead(t, 'Video') ? 4 : 0) +
      (HAS_GENERAL.test(t) ? 2 : 0) +
      (HAS_AUDIO.test(t) ? 1 : 0) +
      (isBDInfo(t) ? 3 : 0);
    for (const c of candidates) c.shape = shape(c.text);
    candidates.sort((a, b) => (b.shape - a.shape) || (a.len - b.len) || (b.score - a.score));
    const chosen = [];
    const seenText = new Set();
    for (const c of candidates) {
      if (chosen.length >= CONFIG.maxInfo) break;
      if (chosen.some(x => x.el.contains(c.el) || c.el.contains(x.el))) continue;
      const sig = c.text.slice(0, 160);
      if (seenText.has(sig)) continue;
      seenText.add(sig);
      chosen.push(c);
    }

    // 补全：选中的文本没有 General 段时，从同区块上层节点把 General 段找回来
    for (const c of chosen) {
      if (hasHead(c.text, 'General')) continue;
      const block = generalWithin(c.el);
      if (block) {
        c.text = block + '\n' + c.text;
        c.len = c.text.length;
      }
    }
    return chosen;
  }

  /* ============================ UI ============================ */

  let root = null;
  let fab = null;
  let lastSig = '';
  const state = {
    infos: [], index: 0, hidden: false, collapsed: false,
    showRaw: false, showAllParams: false, showAllSubtitles: false, showAbout: false,
    mode: CONFIG.mode, theme: CONFIG.theme
  };

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = String(text);
    return n;
  }

  function btn(label, title, onClick, on) {
    const b = el('button', 'mi-btn' + (on ? ' mi-on' : ''), label);
    b.type = 'button';
    b.title = title || '';
    b.addEventListener('click', e => { e.stopPropagation(); onClick(e); });
    return b;
  }

  function injectCSS() {
    if (typeof GM_addStyle === 'function') { GM_addStyle(CSS); return; }
    const s = el('style');
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  function colorLum(css) {
    const m = (css || '').match(/[\d.]+/g);
    if (!m || m.length < 3) return null;
    if (m.length >= 4 && +m[3] < 0.4) return null;
    return (0.299 * +m[0] + 0.587 * +m[1] + 0.114 * +m[2]) / 255;
  }

  /* --------- 站点配色采样：让内嵌卡片用站点的字体 / 字号 / 颜色，视觉上不外挂 --------- */

  function parseColor(css) {
    const m = String(css || '').match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/i);
    if (!m) return null;
    const p = [+m[1], +m[2], +m[3]];
    if (p.some(v => isNaN(v))) return null;
    return { r: p[0], g: p[1], b: p[2], a: m[4] === undefined ? 1 : +m[4] };
  }

  function rgbaStr(c, a) {
    return 'rgba(' + Math.round(c.r) + ', ' + Math.round(c.g) + ', ' + Math.round(c.b) + ', ' +
      (a === undefined ? c.a : a) + ')';
  }

  function rgbStr(c) {
    return 'rgb(' + Math.round(c.r) + ', ' + Math.round(c.g) + ', ' + Math.round(c.b) + ')';
  }

  function mixColor(a, b, t) {
    return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t, a: 1 };
  }

  function lumOf(c) { return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255; }

  // 从「简介」行采样站点的排版与配色；拿不到就返回 null（回落到内置样式）
  function sampleSitePalette(anchor) {
    try {
      const row = findIntroRow(anchor);
      const ref = row
        ? (row.cells && row.cells.length > 1 ? row.cells[row.cells.length - 1] : row)
        : findDescriptionBlock(anchor);
      if (!ref || !ref.isConnected) return null;

      const cs = getComputedStyle(ref);
      const fgC = parseColor(cs.color);
      if (!fgC || fgC.a < 0.2) return null;

      // 站点底色：从参考元素向上找第一个不透明背景
      let bgC = null;
      for (let n = ref, i = 0; n && i < 16; i++, n = n.parentElement) {
        const c = parseColor(getComputedStyle(n).backgroundColor);
        if (c && c.a > 0.5) { bgC = c; break; }
      }
      if (!bgC) {
        const bodyC = parseColor(getComputedStyle(document.body).backgroundColor);
        bgC = (bodyC && bodyC.a > 0.5) ? bodyC : { r: 255, g: 255, b: 255, a: 1 };
      }

      // 次要文字：表格布局里「简介」左侧标签格的颜色最贴近站点的字段名样式
      let subC = null;
      if (row && row.cells && row.cells.length > 1 && row.cells[0] && row.cells[0] !== ref) {
        const lc = parseColor(getComputedStyle(row.cells[0]).color);
        if (lc && lc.a > 0.3) subC = lc;
      }

      // 分隔线：优先用站点表格自身的边框色，并确认它和底色有可辨识的差异
      let lineC = null;
      const table = ref.closest ? ref.closest('table') : null;
      if (table) {
        const tcs = getComputedStyle(table);
        lineC = parseColor(tcs.borderTopColor) || parseColor(tcs.borderBottomColor);
        if (!lineC || lineC.a < 0.1 || Math.abs(lumOf(lineC) - lumOf(bgC)) < 0.04) {
          const cell = table.querySelector('td, th');
          const dcs = cell ? getComputedStyle(cell) : null;
          const dc = dcs ? (parseColor(dcs.borderTopColor) || parseColor(dcs.borderBottomColor)) : null;
          lineC = (dc && dc.a >= 0.1 && Math.abs(lumOf(dc) - lumOf(bgC)) >= 0.04) ? dc : null;
        }
      }

      const link = ref.querySelector('a');
      const accentC = link ? parseColor(getComputedStyle(link).color) : null;
      const fs = Math.min(15, Math.max(11, parseFloat(cs.fontSize) || 13));

      return {
        dark: lumOf(bgC) < 0.5,
        fs: fs,
        font: cs.fontFamily || '',
        fg: rgbStr(fgC),
        sub: subC ? rgbStr(subC) : rgbaStr(mixColor(fgC, bgC, 0.45), 1),
        line: lineC ? rgbaStr(lineC) : rgbaStr(fgC, 0.13),
        hover: rgbaStr(fgC, 0.07),
        accent: accentC ? rgbStr(accentC) : null,
        bodyLine: cs.lineHeight
      };
    } catch (e) { return null; }
  }

  // 把采样结果写进 CSS 变量：内嵌始终跟随站点，悬浮卡片保持自己的外观（只跟随字体）
  function applySiteStyle(root, pal, inline) {
    if (!pal) return;
    const s = root.style;
    if (pal.font) s.setProperty('--mi-font', pal.font);
    if (pal.fs) s.setProperty('--mi-fs', pal.fs + 'px');
    if (!inline) return;
    s.setProperty('--mi-fg', pal.fg);
    s.setProperty('--mi-sub', pal.sub);
    s.setProperty('--mi-line', pal.line);
    s.setProperty('--mi-hover', pal.hover);
    if (pal.accent) s.setProperty('--mi-accent', pal.accent);
    root.classList.toggle('mi-dark', !!pal.dark);
    root.classList.toggle('mi-light', !pal.dark);
  }

  // PT 站多为深色主题且 body 背景常透明，用「正文颜色 + 主容器背景」综合判断
  function detectTheme() {
    if (state.theme !== 'auto') return state.theme;
    try {
      const fg = colorLum(getComputedStyle(document.body).color);
      if (fg !== null) {
        if (fg > 0.62) return 'dark';
        if (fg < 0.38) return 'light';
      }
      const nodes = [];
      document.querySelectorAll('#main, #content, #wrapper, #outer, .container, #torrent-detail, table.main, td.outer, .layui-body')
        .forEach(n => nodes.push(n));
      nodes.push(document.body, document.documentElement);
      let sum = 0, cnt = 0;
      for (const n of nodes) {
        const l = colorLum(getComputedStyle(n).backgroundColor);
        if (l === null) continue;
        sum += l; cnt++;
      }
      if (cnt) return (sum / cnt) > 0.5 ? 'light' : 'dark';
    } catch (e) { /* ignore */ }
    try {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (e) { return 'light'; }
  }

  function isVisible(node) {
    if (!node || !node.isConnected) return false;
    return !!(node.offsetWidth || node.offsetHeight || (node.getClientRects && node.getClientRects().length));
  }

  function matchesAny(node, selectors) {
    for (const sel of selectors) {
      try { if (node.matches && node.matches(sel)) return true; } catch (e) { /* 忽略非法选择器 */ }
    }
    return false;
  }

  // 找「简介」所在的表格行：从 MediaInfo 元素向上，取最靠近外层 table 的 tr
  function findIntroRow(anchor) {
    let row = null;
    let n = anchor;
    for (let i = 0; n && i < 20 && n !== document.body && n !== document.documentElement; i++, n = n.parentElement) {
      if (n.tagName === 'TR') row = n;
      if (n.tagName === 'TABLE') break;
    }
    return row;
  }

  // 非表格布局时，找最外层的「简介 / 描述」容器
  function findDescriptionBlock(anchor) {
    if (!anchor) return null;
    let outer = null;
    let n = anchor;
    for (let i = 0; n && i < 15 && n !== document.body && n !== document.documentElement; i++, n = n.parentElement) {
      if (/^(main|wrapper|outer|page|container|content|app|root|header|footer|nav)$/i.test(n.id || '')) break;
      if (matchesAny(n, CONFIG.descriptionSelectors)) outer = n;
    }
    return outer;
  }

  // 把卡片作为新的表格行插到「简介」行之前（hdwing.org 详情页是 table 布局）
  function insertAsRow(card, row) {
    if (!row || !row.parentNode) return false;
    try {
      const host = el('tr');
      host.setAttribute('data-mi-host', '1');
      const cells = row.cells || [];

      // 首选：克隆「简介」行的标签格 + 内容格，列宽/背景/边框全部沿用站点样式，
      // 卡片就像一个原生的「媒体信息」行，而不是贴在表格里的外挂方块
      if (cells.length >= 2 && /^T[DH]$/.test(cells[0].tagName) && !cells[0].hasAttribute('colspan')) {
        const labelCell = cells[0].cloneNode(false);
        const contentCell = cells[cells.length - 1].cloneNode(false);
        [labelCell, contentCell].forEach(c => {
          while (c.firstChild) c.removeChild(c.firstChild);
          c.removeAttribute('id');
          c.removeAttribute('rowspan');
          c.removeAttribute('colspan');
        });
        labelCell.classList.add('mi-label-cell');
        labelCell.textContent = '媒体信息';
        contentCell.classList.add('mi-content-cell');
        contentCell.appendChild(card);
        host.appendChild(labelCell);
        host.appendChild(contentCell);
        row.parentNode.insertBefore(host, row);
        return true;
      }

      // 兜底：整行一个单元格，按「简介」标签列宽度缩进，与内容列左对齐
      const cell = el('td', 'mi-td');
      cell.colSpan = Math.max(2, cells.length || 2);
      const label = cells && cells[0];
      if (label && label !== cell) {
        const w = label.getBoundingClientRect().width;
        if (w > 0 && w < 400) cell.style.setProperty('padding-left', Math.round(w + 12) + 'px', 'important');
      }
      cell.appendChild(card);
      host.appendChild(cell);
      row.parentNode.insertBefore(host, row);
      return true;
    } catch (e) { return false; }
  }

  // 非表格结构的安全插入，避免把 div 塞进 tr/table 造成非法 DOM
  function insertBeforeBlock(card, target) {
    if (!target || !target.parentNode) return false;
    const tag = target.tagName;
    if (tag === 'TD' || tag === 'TH') {
      target.insertBefore(card, target.firstChild);
      return true;
    }
    if (/^(TR|TBODY|THEAD|TFOOT|TABLE|UL|OL|DL|LI)$/.test(tag)) {
      let n = target;
      while (n && n.parentElement && /^(TR|TBODY|THEAD|TFOOT|TABLE|UL|OL|DL|LI)$/.test(n.tagName)) n = n.parentElement;
      if (n && n.parentNode && n !== document.body && n !== document.documentElement) {
        n.parentNode.insertBefore(card, n);
        return true;
      }
      return false;
    }
    target.parentNode.insertBefore(card, target);
    return true;
  }

  function placeCard(card, anchor) {
    if (state.mode === 'float') return false;
    if (CONFIG.insertPosition === 'above-intro') {
      const row = findIntroRow(anchor);
      if (row && isVisible(row) && insertAsRow(card, row)) return true;
      const block = findDescriptionBlock(anchor);
      if (block && isVisible(block) && insertBeforeBlock(card, block)) return true;
      return false; // 找不到简介区块时不塞进简介内容里，改由 render() 回落悬浮
    }
    if (anchor && anchor.parentNode && isVisible(anchor)) {
      anchor.parentNode.insertBefore(card, anchor);
      return true;
    }
    return false;
  }

  function locateTarget(anchor) {
    const row = findIntroRow(anchor);
    if (row && isVisible(row)) return row;
    const block = findDescriptionBlock(anchor);
    if (block && isVisible(block)) return block;
    return anchor;
  }

  // 能找到可见的「简介」行 / 描述区块就内嵌在它上方，否则退回悬浮卡片
  function effectiveMode(anchor) {
    if (state.mode === 'float') return 'float';
    const row = findIntroRow(anchor);
    if (row && isVisible(row)) return 'inline';
    const block = findDescriptionBlock(anchor);
    if (block && isVisible(block) && block.getBoundingClientRect().width >= 200) return 'inline';
    return 'float';
  }

  function applyPosition(r) {
    try {
      const p = JSON.parse(store.get('mi_pos', 'null'));
      if (p && typeof p.left === 'number' && typeof p.top === 'number' &&
          p.left >= 0 && p.left < window.innerWidth - 60 &&
          p.top >= 0 && p.top < window.innerHeight - 30) {
        r.style.setProperty('left', p.left + 'px', 'important');
        r.style.setProperty('top', p.top + 'px', 'important');
        r.style.setProperty('right', 'auto', 'important');
        r.style.setProperty('bottom', 'auto', 'important');
      }
    } catch (e) { /* ignore */ }
  }

  function enableDrag(r, handle) {
    handle.addEventListener('pointerdown', e => {
      if (e.button !== 0 || !r.classList.contains('mi-float') || (e.target.closest && e.target.closest('.mi-btn'))) return;
      const rect = r.getBoundingClientRect();
      const dx = e.clientX - rect.left;
      const dy = e.clientY - rect.top;
      const move = ev => {
        const left = Math.max(4, Math.min(window.innerWidth - rect.width - 4, ev.clientX - dx));
        const top = Math.max(4, Math.min(window.innerHeight - 40, ev.clientY - dy));
        r.style.setProperty('left', left + 'px', 'important');
        r.style.setProperty('top', top + 'px', 'important');
        r.style.setProperty('right', 'auto', 'important');
        r.style.setProperty('bottom', 'auto', 'important');
      };
      const up = () => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        const nr = r.getBoundingClientRect();
        store.set('mi_pos', JSON.stringify({ left: Math.round(nr.left), top: Math.round(nr.top) }));
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
      e.preventDefault();
    });
  }

  function copyText(text) {
    const done = () => { /* 可在此加提示 */ };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallback());
    } else fallback();
    function fallback() {
      const ta = el('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) { /* ignore */ }
      ta.remove();
      done();
    }
  }

  // 字段为空时的自查报告：把「抓到什么、缺少什么、页面上有没有这些标签」一次说清，
  // 点一下复制，比来回截图快得多。
  function buildDiagnostic() {
    const info = state.infos[state.index];
    const lines = [];
    lines.push('MediaInfo 卡片诊断 v' + VERSION);
    lines.push('页面: ' + location.href);
    lines.push('模式: ' + (MODE_LABEL[state.mode] || state.mode) + ' / 识别份数: ' + state.infos.length);
    if (!info) {
      lines.push('未识别到任何 MediaInfo');
      // 「一份都没识别到」时，最要紧的是先弄清文本在不在、在哪、为什么进不了候选
      let all = '';
      try { all = pageText(); } catch (e) { all = ''; }
      const roots = collectRoots();
      lines.push('可读根节点: ' + roots.length + ' 个（主文档 + 同源 iframe / shadow root）');
      lines.push('整页文本长度: ' + all.length + ' / 行数: ' + all.split('\n').length);
      lines.push('页面标记: DISC INFO=' + /DISC INFO/i.test(all) +
        ' | Disc Label=' + /\bDisc Label\s*[:：]/i.test(all) +
        ' | Disc Size=' + /\bDisc Size\s*[:：]/i.test(all) +
        ' | MPLS=' + /\.MPLS\b/i.test(all) +
        ' | General 段头=' + /(^|\n)\s*General\s*(\n|$)/i.test(all) +
        ' | Complete name=' + /\bComplete name\s*[:：]/i.test(all));
      lines.push('节点统计: textarea=' + document.querySelectorAll('textarea').length +
        ' / pre=' + document.querySelectorAll('pre').length +
        ' / iframe=' + document.querySelectorAll('iframe').length +
        ' / shadowRoot=' + roots.filter(r => r !== document && !r.documentElement).length);
      const top = rankBlocks(6);
      lines.push('---- 得分最高的容器（前 6，含未达门槛的）----');
      lines.push(top.length ? top.join('\n') : '  （没有任何容器得分 > 0）');
      if (!/[:：]\s*\S/.test(all)) {
        lines.push('提示: 页面几乎没有「标签: 值」文本，简介可能是一张图片，或被脚本延迟加载');
      } else if (/DISC INFO|Disc Label/i.test(all)) {
        lines.push('提示: 页面里有 BDInfo 文本，但没有容器进入候选，把这份诊断发我即可定位');
      }
    } else {
      const a = info.anchor;
      const desc = a ? (a.tagName.toLowerCase() + (a.id ? '#' + a.id : '') +
        (a.className && typeof a.className === 'string' ? '.' + a.className.trim().split(/\s+/).join('.') : '')) : '?';
      lines.push('选中容器: ' + desc);
      lines.push('格式: ' + (info._bd ? 'BDInfo（原盘）' : (info._zh ? '中文整理文本' : 'MediaInfo')));
      lines.push('抓到的文本长度: ' + (info.raw || '').length + ' 行数: ' + (info.raw || '').split('\n').length);
      if (info._bd) {
        // 不加 \b：换行被站点吞掉时字段会直接粘在一起（…@CMCTDisc Size:），加了就误报 false
        lines.push('文本含 Disc Title: ' + /Disc Title[ \t]*[:：]/i.test(info.raw || '') +
          ' / Disc Label: ' + /Disc Label[ \t]*[:：]/i.test(info.raw || '') +
          ' / Disc Size: ' + /Disc Size[ \t]*[:：]/i.test(info.raw || '') +
          ' / Playlist(.MPLS): ' + /\.MPLS\b/i.test(info.raw || ''));
        // 全部字段一次列全：只看碟名/标签/体积/播放列表，音频字幕空着也看不出来
        const show = v => (Array.isArray(v) ? v.filter(Boolean) : (v ? [v] : []));
        const fmt = v => { const a = show(v); return a.length ? a.join(' / ') : '(空)'; };
        lines.push('碟名: ' + (info.discTitle || '(空)') +
          (info.discTitleFrom === 'label' ? '（原文无 Disc Title，取 Disc Label）' : ''));
        lines.push('标签: ' + (info.discLabel || '(空)'));
        lines.push('体积: ' + fmt(info.size) + ' | 播放列表: ' + (info.playlist || '(空)'));
        lines.push('时长: ' + (info.duration || '(空)') + ' | 总码率: ' + (info.bitrate || '(空)') +
          ' | 帧率: ' + (info.fps || '(空)') + ' | 分辨率: ' + (info.resolution || '(空)'));
        lines.push('视频(' + show(info.video).length + '): ' + fmt(info.video));
        lines.push('音频(' + show(info.audio).length + '): ' + fmt(info.audio));
        lines.push('字幕(' + show(info.subtitle).length + '): ' + fmt(info.subtitle));
      } else {
        lines.push('文本含 General 段头: ' + hasHead(info.raw || '', 'General') +
          ' / Video: ' + hasHead(info.raw || '', 'Video') +
          ' / Audio: ' + hasHead(info.raw || '', 'Audio'));
        lines.push('文本含 Complete name: ' + /\bComplete name\s*[:：]/i.test(info.raw || ''));
        lines.push('文本含 File size: ' + /\bFile size\s*[:：]/i.test(info.raw || ''));
        lines.push('文本含 Encoded date: ' + /\bEncoded date\s*[:：]/i.test(info.raw || ''));
        lines.push('日期来源: MediaInfo 的 Encoded date / Tagged date / Released date；源里没有就留空（不用站点发布时间顶替）');
        lines.push('解析结果: 文件名=' + (info.fileName || '(空)') + ' | 体积=' + (info.size || '(空)') + ' | 日期=' + (info.date || '(空)'));
        const pg = info._pageScan || pageLabelScan();
        lines.push('整页标签兜底: 文件名=' + (pg.name || '(空)') + ' | 体积=' + (pg.size || '(空)') +
          ' | 日期=' + (pg.date || '(空)') + ' | 页面有 General 段头=' + pg.hasGeneral +
          ' | 有 Complete name=' + pg.hasCompleteName + ' | 有 File size=' + pg.hasFileSize +
          ' | 整页文本长度=' + pg.textLen);
      }
      lines.push('---- 抓到的文本前 800 字 ----');
      lines.push((info.raw || '').slice(0, 800));
    }
    return lines.join('\n');
  }

  function buildAbout() {
    const p = el('div', 'mi-about');
    const addRow = (k, v) => {
      const row = el('div', 'mi-about-row');
      row.appendChild(el('span', '', k));
      row.appendChild(el('span', '', v));
      p.appendChild(row);
    };
    addRow('版本', 'v' + VERSION + ' · MediaInfo 媒体信息卡片');
    addRow('范围', 'hdwing.org（@match 限定）');
    addRow('状态', '模式 ' + (MODE_LABEL[state.mode] || state.mode) +
      ' / 主题 ' + (THEME_LABEL[state.theme] || state.theme) +
      ' / 已识别 ' + state.infos.length + ' 份');
    p.appendChild(el('div', 'mi-about-sub', '更新记录'));
    const ul = el('ul', 'mi-about-list');
    RELEASE_NOTES.forEach(n => ul.appendChild(el('li', '', 'v' + n.v + ' — ' + n.d)));
    p.appendChild(ul);
    const tools = el('div', 'mi-about-tools');
    tools.appendChild(btn('复制诊断信息', '字段为空时点这里：复制「抓到什么、缺什么」，便于排查', () => {
      copyText(buildDiagnostic());
      const tip = el('div', 'mi-about-tip', '已复制到剪贴板，可直接粘贴发给我');
      tools.appendChild(tip);
      setTimeout(() => tip.remove(), 2600);
    }));
    tools.appendChild(btn('关闭', '关闭版本信息', () => { state.showAbout = false; render(); }));
    p.appendChild(tools);
    return p;
  }

  function buildCard() {
    const info = state.infos[state.index];
    const anchor = info.anchor;
    const inline = effectiveMode(anchor) === 'inline';

    const r = el('div', 'mi-root');
    r.setAttribute('data-mi-root', '1');
    r.classList.add(inline ? 'mi-inline' : 'mi-float');
    const theme = detectTheme();
    r.classList.add(theme === 'dark' ? 'mi-dark' : 'mi-light');
    // 内嵌时跟随站点配色，避免白底卡片突兀地贴在站点表格里
    const pal = CONFIG.followSiteStyle ? sampleSitePalette(anchor) : null;
    applySiteStyle(r, pal, inline);

    const box = el('div', 'mi-box');
    r.appendChild(box);

    /* 操作项：内嵌放标题行，悬浮放底部工具栏 */
    const pager = () => {
      if (state.infos.length < 2) return [];
      return [
        btn('‹', '上一份', () => { state.index = (state.index - 1 + state.infos.length) % state.infos.length; state.showRaw = false; state.showAllSubtitles = false; render(); }),
        el('span', 'mi-pager', (state.index + 1) + '/' + state.infos.length),
        btn('›', '下一份', () => { state.index = (state.index + 1) % state.infos.length; state.showRaw = false; state.showAllSubtitles = false; render(); })
      ];
    };
    const verBtn = () => {
      const v = el('span', 'mi-ver', 'v' + VERSION);
      v.title = '点击查看版本信息与更新记录';
      v.addEventListener('click', () => { state.showAbout = !state.showAbout; render(); });
      return v;
    };
    const locateTargetEl = locateTarget(anchor);
    const ACT = {
      copy: () => btn('复制', '复制为 文件名/日期/体积… 的整理文本', () => copyText(infoToText(info))),
      raw: () => btn('原文', '查看 / 隐藏 MediaInfo 原文', () => { state.showRaw = !state.showRaw; render(); }, state.showRaw),
      locate: () => btn('定位', '滚动到页面上的「简介」区块', () => {
        const a = locateTargetEl;
        try { a.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { /* ignore */ }
        try {
          const prev = a.style.outline;
          a.style.setProperty('outline', '2px solid ' + (pal && pal.accent ? pal.accent : 'currentColor'), 'important');
          setTimeout(() => { a.style.outline = prev; }, 1800);
        } catch (e) { /* ignore */ }
      }),
      mode: () => btn(inline ? '悬浮' : '内嵌', '切换卡片位置（悬浮 / 内嵌）', () => {
        state.mode = inline ? 'float' : 'inline';
        store.set('mi_mode', state.mode);
        render();
      }),
      theme: () => {
        const themeLabel = { auto: '自动', light: '亮色', dark: '暗色' }[state.theme] || '自动';
        return btn('主题·' + themeLabel, '循环切换 自动 / 亮色 / 暗色（内嵌时自动跟随站点配色）', () => {
          const order = ['auto', 'light', 'dark'];
          state.theme = order[(order.indexOf(state.theme) + 1) % 3];
          store.set('mi_theme', state.theme);
          render();
        });
      },
      collapse: () => btn(state.collapsed ? '▸' : '▾', '折叠 / 展开', () => { state.collapsed = !state.collapsed; render(); }),
      close: () => btn('×', '收起为悬浮球（Alt + M 或油猴菜单可重新打开）', () => { state.hidden = true; render(); })
    };

    /* 标题行 */
    const head = el('div', 'mi-head');
    // 内嵌时左边已有「媒体信息」行标签，标题只留 MediaInfo，避免重复
    head.appendChild(el('span', 'mi-title', inline ? 'MediaInfo' : 'MediaInfo 媒体信息'));
    const acts = el('div', 'mi-headacts');
    pager().forEach(n => acts.appendChild(n));
    if (inline) {
      acts.appendChild(ACT.copy());
      acts.appendChild(ACT.raw());
      if (isVisible(locateTargetEl)) acts.appendChild(ACT.locate());
      acts.appendChild(ACT.mode());
      acts.appendChild(ACT.theme());
      acts.appendChild(ACT.collapse());
      acts.appendChild(ACT.close());
      acts.appendChild(verBtn());
    } else {
      acts.appendChild(ACT.collapse());
      acts.appendChild(ACT.close());
    }
    head.appendChild(acts);
    box.appendChild(head);
    enableDrag(r, head);
    if (state.showAbout) box.appendChild(buildAbout());

    if (state.collapsed) { return r; }

    /* 内容 */
    const body = el('div', 'mi-body');
    const scroll = el('div', 'mi-scroll mi-grid');
    for (const row of (info.rows || ROWS)) {
      let val = info[row.k];
      if (row.expandable && state.showAllParams) val = info.paramsFull || info.params;
      if (Array.isArray(val)) val = val.filter(Boolean);
      else val = val ? [val] : [];
      // BDInfo 的可选行（碟名 / 标签 / 播放列表）取不到就不显示，免得堆一屏「—」
      if (row.optional && !val.length) continue;

      // 字幕轨道太多时（多音轨资源常见一二十条）：只列出中 / 英文字幕，
      // 其余语言收进「+ 更多（N）」，点击展开全部。这里只影响显示，
      // info.subtitle 本身不改动，「复制整理文本」「原文」仍包含全部字幕。
      let shown = val;
      let foldHidden = 0;
      if (row.k === 'subtitle' && CONFIG.subtitleCollapseThreshold > 0 &&
          val.length > CONFIG.subtitleCollapseThreshold) {
        const keep = val.filter(v => CONFIG.subtitleKeepLangs.indexOf(subtitleLangGroup(v)) >= 0);
        foldHidden = val.length - keep.length;
        if (foldHidden > 0 && !state.showAllSubtitles) shown = keep;
      }

      // 自适应列宽：文件名独占整行；多行 / 长内容自动跨列，短字段自动并排
      const isWide = row.k === 'fileName' || shown.length > 1 || shown.join(' ').length > 56 || foldHidden > 0;
      const line = el('div', 'mi-row mi-g-' + row.g + (isWide ? ' mi-row-wide' : ''));
      line.appendChild(el('span', 'mi-key', row.label));
      const vbox = el('div', 'mi-val' + (shown.length || foldHidden ? '' : ' mi-empty') + (row.k === 'params' || row.k === 'resolution' ? ' mi-mono' : ''));
      if (!shown.length && !foldHidden) vbox.textContent = '—';
      shown.forEach(v => vbox.appendChild(el('div', 'mi-val-line', v)));

      if (foldHidden > 0) {
        const subMore = el('span', 'mi-more mi-more-sub', state.showAllSubtitles ? '收起' : '+ 更多（' + foldHidden + '）');
        subMore.title = state.showAllSubtitles
          ? '重新折叠非中 / 英文字幕'
          : '展开其余 ' + foldHidden + ' 条非中 / 英文字幕';
        subMore.addEventListener('click', () => { state.showAllSubtitles = !state.showAllSubtitles; render(); });
        vbox.appendChild(subMore);
      }

      if (row.expandable && info.paramCount > CONFIG.paramLimit && info.paramsFull) {
        const more = el('span', 'mi-more', state.showAllParams ? '收起' : '+ 全部 ' + info.paramCount + ' 项');
        more.addEventListener('click', () => { state.showAllParams = !state.showAllParams; render(); });
        vbox.appendChild(more);
      }
      line.appendChild(vbox);
      scroll.appendChild(line);
    }
    body.appendChild(scroll);

    if (state.showRaw) body.appendChild(el('pre', 'mi-raw', info.raw || ''));
    box.appendChild(body);

    /* 工具栏：仅悬浮卡片需要（内嵌时操作都在标题行） */
    if (!inline) {
      const foot = el('div', 'mi-foot');
      foot.appendChild(ACT.copy());
      foot.appendChild(ACT.raw());
      if (isVisible(locateTargetEl)) foot.appendChild(ACT.locate());
      foot.appendChild(ACT.mode());
      foot.appendChild(ACT.theme());
      foot.appendChild(verBtn());
      box.appendChild(foot);
    }
    return r;
  }

  function ensureFab() {
    if (fab) return fab;
    fab = el('div', 'mi-fab', 'MI');
    fab.title = '显示 MediaInfo 媒体信息（Alt + M）';
    fab.addEventListener('click', () => { state.hidden = false; render(); });
    document.body.appendChild(fab);
    return fab;
  }

  function render() {
    if (root) { root.remove(); root = null; }
    document.querySelectorAll('[data-mi-host]').forEach(n => n.remove()); // 清掉上一次插入的宿主行
    if (!state.infos.length) { if (fab) fab.style.display = 'none'; return; }
    if (state.hidden) { ensureFab().style.display = 'block'; return; }
    if (fab) fab.style.display = 'none';

    root = buildCard();
    const anchor = state.infos[state.index].anchor;
    if (effectiveMode(anchor) === 'inline' && placeCard(root, anchor)) return;

    // 回落悬浮：清掉内嵌时采样到的站点配色，改回卡片自己的深浅色
    ['--mi-fg', '--mi-sub', '--mi-line', '--mi-hover', '--mi-accent'].forEach(k => root.style.removeProperty(k));
    root.classList.remove('mi-inline');
    root.classList.add('mi-float');
    ['mi-dark', 'mi-light'].forEach(c => root.classList.remove(c));
    root.classList.add(detectTheme() === 'dark' ? 'mi-dark' : 'mi-light');
    applyPosition(root);
    document.body.appendChild(root);
  }

  function scanAndRender(force) {
    let found = collectInfos();
    // 兜底 0：一个候选都没有，但整页（含 iframe / shadow）确实像 MediaInfo / BDInfo，就直接解析整页文本
    if (!found.length) {
      const fb = fallbackFromPage();
      if (fb) found = [fb];
    }
    if (!found.length) {
      if (!force && lastSig === '') return;
      lastSig = '';
      state.infos = [];
      render();
      return;
    }

    // 兜底 1：候选文本缺 General 段时，从整页文本里按「段头」捞一次
    let pageGen = '';
    if (!found.some(f => hasHead(f.text, 'General'))) {
      cloneCount = 0;
      pageGen = grabGeneralBlock(readText(document.body));
    }
    // 兜底 2：不管段头在不在，按标签把文件名 / 体积 / 日期从整页找回（生效面更大）
    const pageInfo = pageLabelScan();

    const infos = [];
    for (const f of found) {
      for (const part of splitMulti(f.text)) {
        let text = part;
        if (pageGen && !hasHead(text, 'General')) text = pageGen + '\n' + text;
        const info = parseInfo(text);
        info.anchor = f.el;
        // 解析结果缺字段时用整页标签兜底：只补空项，不覆盖 MediaInfo 里的真值。
        // BDInfo（原盘）没有文件名/日期概念，不做这套兜底，免得把种子发布名塞进来。
        if (pageInfo && !info._bd) {
          if (!info.fileName && pageInfo.name) info.fileName = pageInfo.name.split(/[\\/]/).pop().trim();
          if (!info.size && pageInfo.size) info.size = pageInfo.size;
          if (!info.date && pageInfo.date) info.date = fmtDate(pageInfo.date);
          info._pageScan = pageInfo;
        }
        infos.push(info);
        if (infos.length >= CONFIG.maxInfo * 2) break;
      }
      if (infos.length >= CONFIG.maxInfo * 2) break;
    }

    // 签名里要带上「解析后的字段」：只看原文前 120 字的话，异步补齐 / 兜底生效后
    // 文本没变、界面也不会刷新，卡片就会一直停在旧的空值上。
    const sig = infos.map(i => [
      (i.raw || '').length, (i.raw || '').slice(0, 120),
      i.fileName, i.size, i.date, i.duration, i.resolution,
      i.discTitle, i.discLabel, i.playlist, i.bitrate,
      i.video.join(';'), i.audio.join(';'), i.subtitle.length
    ].join('~')).join('|');
    if (!force && sig === lastSig) return;
    lastSig = sig;

    state.infos = infos;
    if (state.index >= infos.length) state.index = 0;
    render();
  }

  function toggle() {
    if (!state.infos.length) { scanAndRender(true); return; }
    state.hidden = !state.hidden;
    render();
  }

  function setupObserver() {
    let timer = null;
    const obs = new MutationObserver(muts => {
      let external = false;
      for (const m of muts) {
        for (const n of m.addedNodes) {
          if (n.nodeType !== 1) { external = true; break; }
          if (n.classList && (n.classList.contains('mi-root') || n.classList.contains('mi-fab'))) continue;
          external = true; break;
        }
        if (external) break;
      }
      if (!external) return;
      clearTimeout(timer);
      timer = setTimeout(() => scanAndRender(false), 450);
    });
    obs.observe(document.documentElement || document.body, { childList: true, subtree: true });
  }

  function setupHotkey() {
    document.addEventListener('keydown', e => {
      if (e.altKey && (e.key === 'm' || e.key === 'M')) { e.preventDefault(); toggle(); }
    });
  }

  function setupMenu() {
    if (typeof GM_registerMenuCommand !== 'function') return;
    GM_registerMenuCommand('显示 / 隐藏 MediaInfo 卡片', toggle);
    GM_registerMenuCommand('切换 悬浮 / 内嵌 模式', () => {
      const cur = effectiveMode(state.infos.length ? state.infos[state.index].anchor : null);
      state.mode = cur === 'inline' ? 'float' : 'inline';
      state.hidden = false;
      store.set('mi_mode', state.mode);
      render();
    });
    GM_registerMenuCommand('恢复智能定位（自动选择位置）', () => {
      state.mode = 'auto';
      state.hidden = false;
      store.set('mi_mode', 'auto');
      render();
    });
    GM_registerMenuCommand('重置卡片位置', () => { store.set('mi_pos', ''); render(); });
    GM_registerMenuCommand('重新扫描页面', () => scanAndRender(true));
    GM_registerMenuCommand('复制诊断信息（字段为空时用）', () => {
      scanAndRender(true);
      copyText(buildDiagnostic());
      try { alert('诊断信息已复制到剪贴板。\n\n' + buildDiagnostic().slice(0, 600)); } catch (e) { /* ignore */ }
    });
    GM_registerMenuCommand('关于 / 版本 v' + VERSION, () => {
      if (!state.infos.length) {
        try {
          alert('MediaInfo 媒体信息卡片 v' + VERSION + '\n\n' +
            RELEASE_NOTES.map(n => 'v' + n.v + '  ' + n.d).join('\n'));
        } catch (e) { /* ignore */ }
        return;
      }
      state.hidden = false;
      state.collapsed = false;
      state.showAbout = true;
      render();
    });
  }

  // 排除页判定：@exclude 已在元数据层挡一层，这里再做一次兜底（也便于自测与改配置）
  function isExcluded() {
    if (CONFIG.excludeHosts.some(h => location.hostname.indexOf(h) >= 0)) return true;
    const p = location.pathname || '';
    return CONFIG.excludePaths.some(x => {
      if (!x) return false;
      if (p === x) return true;
      if (p.indexOf(x) !== 0) return false;
      const next = p.charAt(x.length);
      return next === '' || next === '/' || next === '?';
    });
  }

  function boot() {
    if (isExcluded()) return; // 上传页等：完全不注入样式、不注册菜单、不扫页面
    injectCSS();
    if (CONFIG.onlyTorrentDetail && !DETAIL_URL_RE.test(location.pathname + location.search)) return;
    scanAndRender(true);
    setTimeout(() => scanAndRender(false), 1500); // 兼容异步渲染 / 点击「展开 MediaInfo」后的详情页
    setTimeout(() => scanAndRender(false), 3500);
    setupObserver();
    setupHotkey();
    setupMenu();
  }

  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  }

  // 便于在 Node 里做解析单测（油猴环境无 module，此分支不会执行）
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { parseInfo, parseBDInfo, isBDInfo, scoreMediaInfo, infoToText, splitMulti, normalizeText, subtitleLangGroup, grabGeneralBlock, pageLabelScan, buildDiagnostic, fallbackParams, CONFIG, VERSION, RELEASE_NOTES };
  }
})();
