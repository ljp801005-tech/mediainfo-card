// ==UserScript==
// @name         MediaInfo 媒体信息卡片
// @name:en      MediaInfo Card for PT Torrent Pages
// @namespace    workbuddy/mediainfo-card
// @version      1.11.0
// @description  自动识别页面上的 MediaInfo 与 BDInfo（原盘）贴文（含隐藏/折叠区块），生成结构化媒体信息卡片：文件名/碟名/日期/体积/时长/帧率/参数/分辨率/视频/音频/字幕。支持悬浮拖拽、内嵌页面、复制整理文本、查看原始、多份信息切换、深浅色自适应。已适配 HDChina / HDHome / HHanClub / OurBits / PTer / KeepFRDS / U2 / TLF / TTG / CHDBits / M-Team / FileList / HTPT / BTN 等站点。
// @description:en  Detects MediaInfo and BDInfo text on the page (including hidden or collapsed blocks) and renders it as a structured card: file name, disc title, date, size, duration, frame rate, encoding settings, resolution, video, audio and subtitles. Supports floating/inline placement, drag to move, copy as clean text, raw view, multiple entries and light/dark themes. Works on HDChina, HDHome, HHanClub, OurBits, PTer, KeepFRDS, U2, TLF, TTG, CHDBits, M-Team, FileList, HTPT, BroadcasTheNet and more.
// @author       WorkBuddy
// @license      MIT
// @match        *://hdwing.org/*
// @match        *://*.hdwing.org/*
// @match        *://hdhome.org/*
// @match        *://*.hdhome.org/*
// @match        *://hhanclub.net/*
// @match        *://*.hhanclub.net/*
// @match        *://ourbits.club/*
// @match        *://*.ourbits.club/*
// @match        *://pterclub.net/*
// @match        *://*.pterclub.net/*
// @match        *://keepfrds.com/*
// @match        *://*.keepfrds.com/*
// @match        *://springsunday.net/*
// @match        *://*.springsunday.net/*
// @match        *://audiences.me/*
// @match        *://*.audiences.me/*
// @match        *://u2.dmhy.org/*
// @match        *://pt.eastgame.org/*
// @match        *://totheglory.im/*
// @match        *://*.totheglory.im/*
// @match        *://ptchdbits.co/*
// @match        *://*.ptchdbits.co/*
// @match        *://m-team.cc/*
// @match        *://*.m-team.cc/*
// @match        *://filelist.io/*
// @match        *://*.filelist.io/*
// @match        *://htpt.cc/*
// @match        *://*.htpt.cc/*
// @match        *://broadcasthe.net/*
// @match        *://*.broadcasthe.net/*
// @exclude      *://*/edit.php*
// @exclude      *://*/upload.php*
// @exclude      *://*/takeupload.php*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// @run-at       document-idle
// @noframes
// @homepageURL  https://github.com/ljp801005-tech/mediainfo-card
// @supportURL   https://github.com/ljp801005-tech/mediainfo-card/issues
// @updateURL    https://raw.githubusercontent.com/ljp801005-tech/mediainfo-card/main/mediainfo-card.user.js
// @downloadURL  https://raw.githubusercontent.com/ljp801005-tech/mediainfo-card/main/mediainfo-card.user.js
// ==/UserScript==

/*
 * 适用范围：元数据 @match 里列出的 PT 站（种子详情页、候选页、论坛帖等，见下方「适配站点」）
 *           编辑种子页 /edit.php、发种上传页 /upload.php 与 /takeupload.php 不启用
 *           （元数据 @exclude + CONFIG.excludePaths 双重排除）
 *
 * 使用说明
 * 0) 两种装法，功能一样，任选其一：
 *    · 油猴脚本（Tampermonkey / Violentmonkey）：新建脚本粘贴本文件内容保存，或把本文件拖进浏览器。
 *    · Chrome 扩展（不装油猴也能用）：仓库 Releases 下载 mediainfo-card-extension.zip，解压到固定位置，
 *      打开 chrome://extensions/ → 右上角「开发者模式」→「加载已解压的扩展程序」→ 选那个文件夹。
 *      扩展那份不是另写的：scripts/build-ext.mjs 从本文件现场生成（manifest 的版本号、@match 站点清单
 *      都抄这里），菜单从「油猴菜单」挪到浏览器工具栏图标上，卡片本身与油猴版完全一致。
 * 1) @match 已列出一批 PT 站（见下方「适配站点」），没列到的站点不会加载本脚本；
 *    要加站点：补两行 @match（裸域 + *.域），再在 SITES 里登记一个名字即可。
 *    @exclude 已排除 /edit.php、/upload.php、/takeupload.php：这几页是发种/编辑表单，
 *    MediaInfo 要贴进输入框，卡片插进去会挡住表单，也会把待提交的内容误识别成已有信息。
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
 * 7) v1.9.0 起默认「用卡片替换站点原文」：卡片内嵌显示成功后，把页面上那块纯文本的
 *    MediaInfo / BDInfo 原文收起（display:none），一屏里同一份信息不再出现两遍。
 *    只收「装的基本上就是这段文字」的那一层：往上找容器时碰到 td / th / table / li
 *    这些结构格就停手，容器里有截图或视频也不再往上爬，所以简介里的图片、说明不会丢。
 *    切到悬浮、把卡片收成悬浮球、或在「版本信息」里关掉这项，原文会立刻还原。
 *    想保留原文并排显示：CONFIG.replaceSource = false，或点卡片版本号 →「替换原文 已关闭」。
 *
 * 适配站点（v1.8.0 起）
 *   HDChina   hdwing.org（复用的老域名）    NexusPHP，简介在 #kdescr
 *   家园系    hdhome.org                    NexusPHP
 *   憨憨      hhanclub.net                  NexusPHP，简介折叠
 *   我堡      ourbits.club                  NexusPHP
 *   猫站      pterclub.net                  NexusPHP，简介折叠
 *   朋友      pt.keepfrds.com               NexusPHP（keepfrds.com 全站匹配）
 *   观众      audiences.me                  NexusPHP
 *   U2        u2.dmhy.org                   NexusPHP（仅此子域，不动 dmhy.org 主站）
 *   TLF       pt.eastgame.org               NexusPHP（仅此子域）
 *   TTG       totheglory.im                 NexusPHP，详情页表格布局
 *   CHD       ptchdbits.co                  NexusPHP
 *   M-Team    kp.m-team.cc                  自有模板：无 table 行，走「区块前插入」
 *   FileList  filelist.io                   自有模板：简介在 panel 里，走「区块前插入」
 *   HTPT      www.htpt.cc                   NexusPHP
 *   BTN       broadcasthe.net               Gazelle：简介在 div.box > .torrent_description，
 *                                           卡片做成同款 box（标题条写 Media Info）插在简介盒前
 *   三类布局的判断顺序：① 找「简介」所在的 <tr>，克隆标签格 + 内容格插一行（NexusPHP 站最自然）；
 *   ② 找不到 tr，就找类名/ID 像「简介」的区块，插在它前面；③ 都不像（M-Team / FileList），
 *   从 MediaInfo 所在节点往上找第一个「有兄弟」的块级祖先，插在它前面；全失败才退回悬浮卡片。
 *   无论哪一类，只要页面文本里没有 MediaInfo / BDInfo 特征，脚本不产生任何可见输出。
 *
 * 版本与发版
 * - 版本号以元数据 @version 为唯一来源，脚本运行时从 GM_info 读取；卡片右下角显示 vX.Y.Z，
 *   点击可查看更新记录和当前生效配置，油猴菜单里也有「关于 / 版本」。
 * - 以后改功能时：① 递增 @version；② 在 docs/CHANGELOG.md 顶部加一节；③ 更新下方 RELEASE_NOTES
 *   里那条汇总。保存后 Tampermonkey 会因为版本号变化提示脚本已更新（手动粘贴安装的脚本，重新粘贴一次即可）。
 * - 本脚本已托管在 GitHub：https://github.com/ljp801005-tech/mediainfo-card
 *   @updateURL / @downloadURL 指向仓库 main 分支的 raw 地址，改动 push 上去、并把 @version
 *   递增，已安装的用户（Tampermonkey 默认 24 小时检查一次，也可手动「检查脚本更新」）就会拿到新版。
 *   注意 raw.githubusercontent.com 有几分钟 CDN 缓存，刚 push 完可能还取到旧文件，属正常。
 * - 同一份文件也会同步发到 Greasy Fork（脚本 ID 605024）；GF 会写入它自己的 updateURL，
 *   所以「装的是哪一份」决定从哪更新：从 GitHub 链接装的走 GitHub，从 GF 装的走 GF。
 *
 * 更新记录
 * - 只有一条对外汇总：卡片「关于」面板与 Greasy Fork 页面各显示一句，不罗列历史。
 * - 完整版本历史（每条改了什么、为什么这么改）在 docs/CHANGELOG.md，发版说明看 GitHub Releases。
 * - 改功能时按上面第 112 行的三步走：递增版本 → CHANGELOG 加一节 → 改 RELEASE_NOTES 那条汇总。
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

  // 版本号以元数据 @version 为唯一来源：Tampermonkey 通过 GM_info 提供；Chrome 扩展里由 gm-shim
  // 用 manifest 的 version 填同一个字段（manifest 的 version 又是构建时从 @version 抄的），三处不会走偏。
  const VERSION = (typeof GM_info !== 'undefined' && GM_info && GM_info.script && GM_info.script.version)
    ? GM_info.script.version
    : '1.11.0';
  // 跑在 Chrome 扩展里时 gm-shim 会挂上这个对象（油猴里是 undefined），用来换掉「菜单在哪」和「更新去哪下载」
  const EXT = (typeof window !== 'undefined' && window.__MI_EXT__) || null;
  // 用户在哪点菜单：油猴是脚本菜单，扩展是工具栏图标
  const MENU_NAME = (EXT && EXT.menuLabel) || '油猴菜单';
  // 「关于」面板里「完整更新历史」指向这里（与 @homepageURL 保持一致）
  const REPO_URL = 'https://github.com/ljp801005-tech/mediainfo-card';
  // 版本自检：读的就是安装源（与 @downloadURL 同一份文件），只取头部 @version，不下载整份逻辑
  const UPDATE_URL = 'https://raw.githubusercontent.com/ljp801005-tech/mediainfo-card/main/mediainfo-card.user.js';
  // 点红点去哪装新版：油猴里是脚本源文件（油猴接住直接弹更新页）；扩展里换成 Releases，
  // 因为扩展得下载新 zip 重新加载，没法像油猴那样一键装
  const INSTALL_URL = (EXT && EXT.installUrl) || UPDATE_URL;
  // 红点的两处文案：完整一句给 title，短短两个字塞进版本号自身的 title 里
  const CLICK_HINT = EXT ? '点击下载新版' : '点击更新';
  const CLICK_VERB = EXT ? '下载新版' : '更新';
  const UPDATE_INTERVAL = 24 * 60 * 60 * 1000;   // 24 小时查一次
  const UPDATE_KEY = 'mi_update';                // 缓存：{ at: 上次联网时间, ver: 查到的版本 }
  // 对外只保留一条汇总：卡片「关于」面板里不罗列历史，完整历史见 docs/CHANGELOG.md
  const RELEASE_NOTES = [
    { v: '1.11.0', d: '多了「不装油猴也能用」的形态：同一份脚本可以打包成 Chrome 扩展，从仓库 Releases 下载 zip、加载已解压的扩展程序即可，功能与油猴版一致（菜单挪到浏览器工具栏图标上）。油猴版不受影响，照旧装、照旧更新' }
  ];
  const MODE_LABEL = { auto: '智能', float: '悬浮', inline: '内嵌' };
  const THEME_LABEL = { auto: '自动', light: '亮色', dark: '暗色' };

  /* 版本号比较：按 . 切开逐段比数字（1.10.10 > 1.10.9，1.11.0 > 1.10.10），
   * 段数不等时短的按 0 补，别用字符串比较，否则 "1.10.9" > "1.10.10"。 */
  function cmpVersion(a, b) {
    const pa = String(a || '').split('.').map(x => parseInt(x, 10) || 0);
    const pb = String(b || '').split('.').map(x => parseInt(x, 10) || 0);
    const n = Math.max(pa.length, pb.length);
    for (let i = 0; i < n; i++) {
      const x = pa[i] || 0, y = pb[i] || 0;
      if (x !== y) return x > y ? 1 : -1;
    }
    return 0;
  }

  /* 从脚本源码里取出 @version：只认元数据块里那行，正文里随便写的数字不算。 */
  function pickVersion(src) {
    const m = /^\/\/\s*@version\s+([0-9][0-9A-Za-z.\-]*)\s*$/m.exec(String(src || ''));
    return m ? m[1] : '';
  }

  /* 适配站点登记表
   * - @match 已把脚本限定在这些域上，这里只负责「显示名 / 模板类型」，以及给个别模板补一条额外线索。
   * - kind: 'nexus' = NexusPHP 系（简介是 table 里的一行）；'custom' = 自有模板（没有可克隆的 tr）。
   * - desc: 只在通用 descriptionSelectors 之外「追加」的容器线索，命中不了不影响其它逻辑。
   * - 新增站点：① 元数据补 @match（裸域 + *.域）；② 这里加一行；③ 结构特殊时补 desc。
   */
  const SITES = [
    { host: 'hdwing.org',       name: 'HDChina 瓷器',   kind: 'nexus' },
    { host: 'hdhome.org',       name: 'HDHome 家园',     kind: 'nexus' },
    {
      // 憨憨：NexusPHP 皮肤，简介行常放在可折叠容器里（行本身可能不可见），
      // 容器名各皮肤不同，这里把 NexusPHP 常见的几种都列上
      host: 'hhanclub.net', name: 'HHanClub 憨憨', kind: 'nexus',
      desc: ['#kdescr', '#description', '#torrent-description', '.codemain', '.torrent-detail',
        '[class*="descr" i]', '[class*="description" i]', '[class*="detail-desc" i]', 'td.rowfollow',
        '.layui-tab-item', '.layui-card-body', '.card-body']
    },
    {
      host: 'pterclub.net', name: 'PTer 猫站', kind: 'nexus',
      desc: ['#kdescr', '#description', '#torrent-description', '.codemain', '.torrent-detail',
        '[class*="descr" i]', '[class*="description" i]', '[class*="detail-desc" i]', 'td.rowfollow',
        '.layui-tab-item', '.layui-card-body', '.card-body']
    },
    { host: 'ourbits.club',     name: 'OurBits 我堡',    kind: 'nexus' },
    { host: 'keepfrds.com',     name: 'KeepFRDS 朋友',   kind: 'nexus' },
    // 下面这一站照旧支持，但对外文档（README / Greasy Fork / 发帖说明）不点名，别再往清单里加
    { host: 'springsunday.net', name: 'SpringSunday 春天', kind: 'nexus' },
    // 这一站同样照旧支持，也按站方要求不在对外文档里点名（与上一行同一个道理）
    { host: 'audiences.me',     name: 'Audiences 观众',  kind: 'nexus' },
    { host: 'u2.dmhy.org',      name: 'U2 分享园',       kind: 'nexus', exact: true }, // 只匹配本站，不动 dmhy.org 主站
    { host: 'pt.eastgame.org',  name: 'TLF',        kind: 'nexus', exact: true }, // 只匹配本站，不动 eastgame.org 论坛
    { host: 'totheglory.im',    name: 'TTG',             kind: 'nexus' },
    { host: 'ptchdbits.co',     name: 'CHDBits',         kind: 'nexus' },
    { host: 'htpt.cc',          name: 'HTPT',            kind: 'nexus' },
    {
      // Angular + ng-zorro（Ant Design）单页应用：简介正文是 .markdown-body，
      // 外层层级是 .ant-tabs-tabpane / .ant-card，没有 table 行可克隆。
      host: 'm-team.cc', name: 'M-Team 馒头', kind: 'custom',
      desc: ['.markdown-body', '[class*="markdown-body"]', '.ant-tabs-tabpane', '.ant-card', '[class*="description"]', '[role="tabpanel"]']
    },
    {
      host: 'filelist.io', name: 'FileList', kind: 'custom', lang: 'en',
      desc: ['#description', '.panel-body', '.card-body', '.torrent-description', '.torrent-desc',
        '[class*="description" i]', '[id*="description" i]', '.panel']
    },
    {
      // Gazelle 系（BTN）：没有「简介」表格行，简介是 div.box（.head 标题条 + .body 正文），
      // 正文容器是 .torrent_description。落位走 insertGazelleBox()：在简介盒前插一个同款 box。
      // 界面是英文，表格标签用 Media Info。
      host: 'broadcasthe.net', name: 'BTN 广播', kind: 'gazelle', lang: 'en',
      desc: ['#torrent_description', '.torrent_description', '.group_description', '#description',
        '.torrentdetails', '.torrentinfo', '[class*="torrent_desc" i]', '[id*="description" i]']
    }
  ];

  // 主机名 → 站点登记项：优先最长后缀匹配（www.htpt.cc 命中 htpt.cc；u2.dmhy.org 只命中自己）
  function matchSite(hostname) {
    const h = String(hostname || '').toLowerCase();
    if (!h) return null;
    let hit = null;
    for (const s of SITES) {
      if (h === s.host || h.slice(-(s.host.length + 1)) === '.' + s.host) {
        if (!hit || s.host.length > hit.host.length) hit = s;
      }
    }
    return hit;
  }

  function currentSite() {
    let h = '';
    try { h = location.hostname || ''; } catch (e) { return null; }
    return matchSite(h);
  }

  // Gazelle 系（BTN 等）：整页是 div.box + table.torrent_table，没有可克隆的「简介」表格行
  function isGazelleSite() {
    const site = currentSite();
    return !!(site && site.kind === 'gazelle');
  }

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
    // 'above-intro' = 作为独立一行放到「简介」上方（NexusPHP 表格布局；无 table 时退化为区块前插入）
    // 'before-mediainfo' = 插在原 MediaInfo 元素之前（会落在简介文字里，一般不用）
    insertPosition: 'above-intro',
    // true = 卡片内嵌显示后，把页面上那块纯文本的 MediaInfo / BDInfo 原文收起（只留卡片）；
    // 切悬浮、收起卡片、或在「版本信息」里手动关掉都会立刻还原。false = 原文与卡片并存。
    replaceSource: true,
    gridMinCol: 300,      // 悬浮卡片自适应列宽：单列最小宽度
    inlineMinCol: 340,    // 内嵌时分栏宽度：内嵌占满整列，340 表示约 900px 宽时排 2 列
    followSiteStyle: true, // 内嵌时从「简介」行采样站点的字体、字号、正文色、次要色、分隔线色，做到融入页面
    descriptionSelectors: [ // 非表格布局时，用来定位「简介 / 描述」区块
      '#kdescr', '#descr', '#description', '#torrent-description', '#torrent_descr',
      '.description', '.descr', '.torrent-description', '.torrent-descr', '.torrent-desc',
      '[id*="descr" i]', '[class*="descr" i]', '[class*="description" i]',
      '[id*="intro" i]', '[class*="intro" i]', '.info-content', '.detail-content',
      '.panel-body', '.card-body', '.post-content', '.bbcode-content', '.md-content',
      'article', 'blockquote', 'fieldset'
    ],
    extraSelectors: [     // PT 站常见 MediaInfo 容器，逐个容错查找
      '.mediainfo', '#mediainfo', '[class*="mediainfo" i]', '[id*="mediainfo" i]',
      '.codemain', '.codetop + div', '#kdescr pre', '#descr pre', '.bbcode pre',
      '.torrent-info pre', '.torrent-detail pre', '[class*="collapse" i] pre',
      '.torrent-description pre', '.panel pre', 'article pre', '.md-content pre',
      'textarea[id*="info" i]', 'textarea[class*="info" i]'
    ],
    excludeHosts: [],     // 例：['example.com']
    // 这些路径不运行。默认排除编辑种子页 /edit.php、发种上传页 /upload.php 与 /takeupload.php：
    // 这几页的 MediaInfo 是要贴进输入框提交的，卡片插进去会挡住表单，也会把待提交内容误识别成已有信息。
    // @exclude 已挡一层，这里是兜底（管理器对通配支持不佳时仍然生效）。
    excludePaths: ['/edit.php', '/upload.php', '/takeupload.php'],
    excludeQueries: ['action=edit', 'action=upload', 'action=takeupload']
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
    'pcm': 'PCM', 'lpcm': 'LPCM', 'alac': 'ALAC', 'wma': 'WMA',
    // Atmos 在 MediaInfo 里写成「E-AC-3 JOC」/「MLP FBA + Dolby Atmos」，按长键优先单独标出来
    'e-ac-3 joc': 'DD+ Atmos', 'eac3 joc': 'DD+ Atmos', 'ac-3 joc': 'DD Atmos',
    'mlp fba atmos': 'TrueHD Atmos', 'truehd atmos': 'TrueHD Atmos'
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
/* 第三档落位：直接立成「简介」区块前面的一段，需要一点下边距把它和下面的区块分开 */
.mi-inline.mi-section { display: block !important; margin: 0 0 10px !important; }

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
/* 底色测不出来（来自背景图）或对比度不足时，卡片自己上底色，绝不留「字和底一个色」 */
.mi-inline.mi-surface-on .mi-box {
  background: var(--mi-surface) !important;
  border: 1px solid var(--mi-line) !important; border-radius: 8px !important;
  padding: 8px 10px !important;
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
/* 字段名 / 字段值的颜色选择器带到 .mi-root 前缀：
 * 有的站（FileList 等）自带 td 级别的 color 规则、扩展还会注入带 !important 的主题样式，
 * 光靠 .mi-val 一个类可能被压掉，值就会变成「站点的字色」而消失在背景里。 */
.mi-root .mi-key {
  color: var(--mi-sub) !important; font-size: .96em !important;
  letter-spacing: .2px !important; white-space: nowrap !important;
  padding-top: .08em !important;
}
.mi-root .mi-val {
  color: var(--mi-fg) !important; font-size: 1em !important;
  min-width: 0 !important; word-break: break-word !important;
  font-variant-numeric: tabular-nums !important;
}
.mi-val-line + .mi-val-line { margin-top: 1px !important; }
.mi-root .mi-val.mi-empty { color: var(--mi-sub) !important; opacity: .6 !important; }
.mi-root .mi-val.mi-mono { font-variant-numeric: tabular-nums !important; }
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
/* 有新版本时版本号旁的小红点（可点，点了去安装页） */
.mi-updot {
  all: unset !important;
  display: inline-block !important; width: 6px !important; height: 6px !important;
  margin-left: 4px !important; border-radius: 50% !important;
  background: #e5484d !important; box-shadow: 0 0 0 2px rgba(229, 72, 77, .22) !important;
  vertical-align: middle !important; position: relative !important; top: -1px !important;
  cursor: pointer !important;
  animation: mi-up-pulse 1.8s ease-in-out infinite !important;
}
.mi-updot::after {   /* 把小点儿的可点区域放大到 16px，好点 */
  content: '' !important; position: absolute !important;
  top: -5px !important; right: -5px !important; bottom: -5px !important; left: -5px !important;
}
@keyframes mi-up-pulse {
  0%, 100% { box-shadow: 0 0 0 2px rgba(229, 72, 77, .22) !important; }
  50% { box-shadow: 0 0 0 4px rgba(229, 72, 77, .10) !important; }
}
@media (prefers-reduced-motion: reduce) {
  .mi-updot { animation: none !important; }
}
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
.mi-about-link {
  font-size: .92em !important; color: var(--mi-label) !important;
  text-decoration: underline !important; text-underline-offset: 2px !important; cursor: pointer !important;
}
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
    // 取「最靠前 + 最长」的键：'E-AC-3 JOC' 要命中 'e-ac-3 joc'（DD+ Atmos），
    // 退一步也得命中开头的 'e-ac-3'（DD+），不能落到中间的 'ac-3'（DD）上。
    let best = 0;
    let hit = '';
    for (const key in table) {
      const at = k.indexOf(key);
      if (at < 0) continue;
      const rank = (at === 0 ? 1000 : 0) + key.length;
      if (rank > best) { best = rank; hit = key; }
    }
    return hit ? table[hit] : v.split('/')[0].trim().slice(0, 24);
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

    // 只认精确的「File」：pick() 会做前缀匹配，'File' 会命中 'File size'，文件名就变成了 6.44 GiB
    const completeRaw = pick(gen, ['Complete name', 'File name', 'Movie name']) ||
      (gen.find(f => String(f[0]).trim().toLowerCase() === 'file' && f[1]) || [])[1] || '';
    const complete = /^[\d.,]+\s*(?:B|bytes?|KiB|MiB|GiB|TiB|KB|MB|GB|TB)$/i.test(completeRaw.trim()) ? '' : completeRaw;
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

  /* ---------------- HTML 面板反解（PTGen 类模板） ----------------
   * 有些站的简介里根本没有 MediaInfo 原文，而是工具渲染好的 HTML 面板：
   *   Video / Audio / Subtitle 几栏，每栏是「标签 + 值」（Codec / Bitrate / Resolution …）
   *   或「#1 + 描述」（French, Dolby Digital Plus, 5.1, 640 kb/s）的成对结构。
   * 这种情况文本兜底一定拿不到东西（诊断里 Complete name / General 段头全是 false）。
   * 这里把面板反推回 MediaInfo 文本，再交给同一套 parseInfo，卡片、复制、多份切换都能照常工作。
   * 只做认得出来的字段，认不出的标签一律丢弃 —— 宁可少几行，也不要瞎猜。
   */
  const PANEL_SECTION_RE = /^(video|audio|subtitle|subtitles|subtitrare|text|字幕|音频|视频|音轨|音频轨)\b/i;
  const PANEL_LABEL = [
    [/^(video\s*)?codec$|^编码$/i, 'Format'],
    [/^(container|format|muxing|封装|格式|容器)$/i, 'Format'],
    [/^(format\s*profile|profile)$/i, 'Format profile'],
    [/^(overall\s*bit\s*rate|总码率)$/i, 'Overall bit rate'],
    [/^(bit\s*rate|bitrate|码率)$/i, 'Bit rate'],
    [/^(resolution|分辨率)$/i, '@RES'],
    [/^(frame\s*rate|fps|帧率)$/i, 'Frame rate'],
    [/^(duration|run\s*time|runtime|时长|片长)$/i, 'Duration'],
    [/^(hdr|hdr\s*format|dolby\s*vision)$/i, 'HDR'],
    [/^(channels?|channel\s*\(s\)|声道)$/i, 'Channel(s)'],
    [/^(sampling\s*rate|sample\s*rate|采样率)$/i, 'Sampling rate'],
    [/^(language|languages|语言|字幕语言)$/i, 'Language'],
    [/^(title|标题|片名)$/i, 'Title'],
    [/^(size|file\s*size|volume|体积|大小)$/i, 'File size']
  ];
  const normTxt = s => String(s == null ? '' : s).replace(/[\s\u00a0]+/g, ' ').trim();

  function panelLabelOf(text) {
    const t = normTxt(text).replace(/[：:]\s*$/, '');
    if (!t || t.length > 24) return '';
    for (const [re, key] of PANEL_LABEL) if (re.test(t)) return key;
    return '';
  }

  // 某一层的「自己的标题」：第一个有内容的子元素如果是短文本，就当它是这一栏的标题条
  function panelHeadOf(el) {
    if (!el || !el.children || !el.children.length) return '';
    for (const c of el.children) {
      const t = normTxt(c.textContent);
      if (!t) continue;
      return t.length <= 24 ? t : '';
    }
    return '';
  }

  // 找出「Video / Audio / Subtitle」这类分栏容器
  function panelSections(root) {
    const out = [];
    let guard = 0;
    let list;
    try { list = root.querySelectorAll('div,section,article,fieldset,li,td,dl'); } catch (e) { return out; }
    for (const n of list) {
      if (guard++ > 2500) break;
      const head = panelHeadOf(n);
      if (!head || !PANEL_SECTION_RE.test(head)) continue;
      // 只要最外层那一栏（内层子容器会被同一条规则重复命中）
      if (out.some(s => s.el.contains(n))) continue;
      out.push({ el: n, name: head });
      if (out.length >= 6) break;
    }
    return out;
  }

  // 把一栏里的「标签 + 值」「#1 + 描述」都抠出来
  function panelPairs(container) {
    const pairs = [];
    const seen = new Set();
    const push = (label, value) => {
      const l = normTxt(label), v = normTxt(value);
      if (!l || !v || v.length > 200) return;
      const k = l + '\u0001' + v;
      if (seen.has(k)) return;
      seen.add(k);
      pairs.push({ label: l, value: v });
    };
    // ① 表格行：首格是 #1 这类序号 → 整行当一条轨道描述；否则首格当标签
    let rows = [];
    try { rows = container.querySelectorAll('tr'); } catch (e) { rows = []; }
    for (const tr of rows) {
      const cells = [...tr.children].filter(c => /^(TD|TH)$/.test(c.tagName));
      if (!cells.length) continue;
      const first = normTxt(cells[0].textContent);
      if (/^#?\d+$/.test(first)) {
        push('@TRACK', cells.slice(1).map(c => normTxt(c.textContent)).join(', ') || '');
      } else if (cells.length >= 2) {
        push(first, cells.slice(1).map(c => normTxt(c.textContent)).join(' '));
      }
    }
    // ② div / li 行：正好两个子元素，前一个是短标签
    let nodes = [];
    try { nodes = container.querySelectorAll('div,li,p,dl,dd,span'); } catch (e) { nodes = []; }
    for (const el of nodes) {
      if (el.querySelector && el.querySelector('tr')) continue;
      const kids = [...el.children];
      if (kids.length !== 2) continue;
      const a = normTxt(kids[0].textContent), b = normTxt(kids[1].textContent);
      if (!a || !b || a.length > 24) continue;
      if (!panelLabelOf(a) && !/^#?\d+$/.test(a)) continue;
      if (/^#?\d+$/.test(a)) push('@TRACK', b);
      else push(a, b);
    }
    // ③ 纯文本行「Codec: HEVC」/「Codec  HEVC」（同一行内冒号或双空格分隔）
    const flat = normTxt(container.textContent);
    if (!pairs.length && flat) {
      for (const line of String(container.textContent || '').split('\n')) {
        const t = normTxt(line);
        const m = /^([A-Za-z][A-Za-z .()\/-]{1,20})\s*[:：]\s*(.+)$/.exec(t);
        if (m && panelLabelOf(m[1])) push(m[1], m[2]);
      }
    }
    return pairs;
  }

  // 一条「French, Dolby Digital Plus, 5.1, 640 kb/s」风格的轨道描述 → MediaInfo 字段行
  function trackLines(section, desc) {
    const parts = desc.split(/\s*[,，]\s*/).map(s => s.trim()).filter(Boolean);
    const lang = [], ch = [], br = [], other = [];
    for (const p of parts) {
      if (/^\d+(\.\d+)?$/.test(p) || /\b[1-8]\.\d\b/.test(p)) ch.push(p);
      else if (/^[\d.]+\s*(k|m)?b\/?s$/i.test(p) || /\d+\s*kbps/i.test(p)) br.push(p);
      else if (/^[A-Za-z][A-Za-z ()-]{1,28}$/.test(p) && !/dolby|dts|aac|truehd|atmos|flac|opus|mp3|ac-?3|e-?ac|pcm|digital/i.test(p)) lang.push(p);
      else other.push(p);
    }
    const out = [];
    if (/audio|音频|音轨/i.test(section)) {
      if (lang.length) out.push('Language : ' + lang.join(' '));
      if (other.length) out.push('Format : ' + other.join(', '));
      if (ch.length) out.push('Channel(s) : ' + ch[0]);
    } else {
      if (lang.length) out.push('Language : ' + lang.join(' '));
      if (other.length) out.push('Format : ' + other.join(', '));
    }
    if (br.length) out.push('Bit rate : ' + br[0].replace(/\s+/g, ' '));
    return out;
  }

  // 一栏的 pairs → MediaInfo 文本行
  function sectionToLines(section, pairs) {
    const lines = [];
    const isAudio = /audio|音频|音轨/i.test(section);
    for (const p of pairs) {
      if (p.label === '@TRACK') {
        lines.push(...trackLines(section, p.value));
        continue;
      }
      const key = panelLabelOf(p.label);
      if (!key) continue;
      if (key === '@RES') {
        // "3840x2160 (16:9)" / "3840 x 2160"
        const m = /(\d{3,5})\s*[x×*]\s*(\d{3,5})(?:\s*[（(]\s*([\d.]+\s*:\s*[\d.]+)\s*[)）])?/i.exec(p.value);
        if (m) {
          lines.push('Width : ' + m[1] + ' pixels');
          lines.push('Height : ' + m[2] + ' pixels');
          if (m[3]) lines.push('Display aspect ratio : ' + m[3].replace(/\s+/g, ''));
        } else {
          lines.push('Format/Info : ' + p.value);   // 认不出尺寸时至少别丢
        }
        continue;
      }
      // 音频栏里的「Codec」当 Format，字幕栏里的忽略
      lines.push(key + ' : ' + p.value);
    }
    return lines;
  }

  // 几栏的共同外层容器：卡片要插在它前面、收起时整块收起。
  // 直接拿第一栏当锚点的话，卡片会挤进三栏布局里（占掉 Video 那一格），右边还留着 Audio / Subtitle，
  // 看起来就像排版塌了 —— 这是 FileList 上「效果很不好」的主因。
  function panelGroupOf(sections) {
    if (!sections.length) return null;
    let a = sections[0].el;
    for (const s of sections.slice(1)) {
      let guard = 0;
      while (a && !a.contains(s.el) && guard++ < 24) a = a.parentElement;
    }
    if (!a || a === document.body || a === document.documentElement) return null;
    return a;
  }

  // 反解整页的 HTML 面板；拿不到像样内容返回 []
  function htmlPanelInfos() {
    if (!document.body) return [];
    const sections = panelSections(document.body);
    if (!sections.length) return [];
    const chunks = [];
    const audioLines = [];
    const textLines = [];
    let pairCount = 0;
    for (const s of sections) {
      const pairs = panelPairs(s.el);
      if (!pairs.length) continue;
      pairCount += pairs.length;
      const lines = sectionToLines(s.name, pairs);
      if (!lines.length) continue;
      if (/audio|音频|音轨/i.test(s.name)) audioLines.push(lines);
      else if (/sub|text|字幕/i.test(s.name)) textLines.push(lines);
      else chunks.push({ name: 'Video', lines: lines });
    }
    if (pairCount < 2) return [];
    // 拼成 MediaInfo 文本：Video 段（含 Duration / 分辨率）→ Audio 每轨一段 → Text 每轨一段
    const out = [];
    for (const c of chunks) out.push(c.name, ...c.lines);
    for (const lines of audioLines) out.push('Audio', ...lines);
    for (const lines of textLines) out.push('Text', ...lines);
    const text = out.join('\n');
    // 至少要有一条视频/音频信息，否则纯属误判
    if (!/(^|\n)Video(\n|$)/i.test(text) && !audioLines.length) return [];
    if (!/(Format|Width|Duration|Bit rate|Frame rate)\s*:/i.test(text)) return [];
    const group = panelGroupOf(sections);
    if (group) { try { group.setAttribute('data-mi-panel', '1'); } catch (e) { /* ignore */ } }
    return [{
      el: group || sections[0].el,
      text: normalizeText(text),
      score: scoreMediaInfo(text),
      len: text.length,
      _panel: true
    }];
  }

  /* ---------------- 多栏 HTML 面板：栏名集中一行，内容按栏排在后面 ----------------
   * Audiences 一类模板把 MediaInfo 摊成「表头行 + 一行多个内容格」：
   *   <tr><th>General</th><th>Video</th><th>Audio</th><th>Subtitles</th></tr>
   *   <tr><td>Format: Matroska<br>Duration: …</td><td>Format: AVC (8 bits)<br>…</td>…</tr>
   * 整块 textContent 读出来是
   *   General / Video / Audio / Subtitles / Format: Matroska / Duration: … / Format: AVC …
   * 几个段头全挤在开头。parseSections 只认最后那个段头，字段于是全落进同一段
   * （Subtitles 根本不是段头 → 全部进了 Audio），卡片就成了
   * 「视频 Video、音频 Matroska @ 9808 Kbps、时长/帧率/分辨率/字幕全是 —」。
   * 这里按 DOM 把「栏名 ↔ 栏内容」重新对上，拼回正常的多段文本再交给 parseInfo。
   * 只重建文本、不动锚点：落位（表格行）与「收起原文」的行为保持原样。
   */
  const LAYOUT_HEAD = /^(?:general|video|audio|text|subtitles?|menu|chapters?|概况|概要|视频|音频|字幕|菜单)$/i;
  const LAYOUT_CODEC = /\b(E-?AC-?3|AC-?3|DDP|DD\+|DTS(?:-HD)?(?:\s*(?:MA|HRA|X))?|TrueHD|Atmos|HE-?AAC|AAC|FLAC|Opus|LPCM|PCM|Vorbis|MP3|UTF-?8|PGS|VobSub|ASS|SSA|SubRip|SRT)\b/i;

  function layoutHeadName(text) {
    const t = normTxt(text).replace(/[：:]\s*$/, '');
    if (!t || t.length > 16) return '';
    if (!LAYOUT_HEAD.test(t)) return '';
    if (/^general$/i.test(t)) return 'General';
    if (/^video$/i.test(t)) return 'Video';
    if (/^audio$/i.test(t)) return 'Audio';
    if (/^(?:menu|chapters?|菜单)$/i.test(t)) return '';   // 菜单 / 章节栏没有卡片字段，跳过但不打乱列序
    return 'Text';
  }

  // 单元格自己的行：<br> 与块级元素都当换行（textContent 会把它们吃掉）
  function forcedLines(node) {
    if (!node) return [];
    let t = '';
    try {
      const clone = node.cloneNode(true);
      clone.querySelectorAll('script,style,noscript').forEach(n => n.remove());
      clone.querySelectorAll('br').forEach(b => b.replaceWith('\n'));
      const doc = clone.ownerDocument || document;
      clone.querySelectorAll('div,p,li,tr,td,th,pre,section,dd,dt').forEach(b => b.appendChild(doc.createTextNode('\n')));
      t = clone.textContent || '';
    } catch (e) { t = node.textContent || ''; }
    return flatText(t).split('\n').map(s => normTxt(s)).filter(Boolean);
  }

  // 无标签的一行 = 一条轨道描述：「English E-AC-3 2.0ch @ 224kb/s」「English UTF-8 (British)」
  function compactTrack(sec, line) {
    const t = normTxt(line);
    if (!t) return [];
    let rest = t, br = '', ch = '', codec = '', note = '', m;
    if ((m = /@\s*([\d.,]+\s*(?:k|m)?b\/?s)\b/i.exec(rest))) { br = m[1]; rest = rest.replace(m[0], ' '); }
    else if ((m = /\b([\d.,]+\s*kbps)\b/i.exec(rest))) { br = m[1]; rest = rest.replace(m[0], ' '); }
    if ((m = /\b(\d+(?:\s*\.\s*\d+){0,2})\s*(?:ch|channels?)\b/i.exec(rest))) {
      ch = m[1].replace(/\s+/g, '');
      rest = rest.replace(m[0], ' ');
    }
    if ((m = LAYOUT_CODEC.exec(rest))) { codec = m[1]; rest = rest.replace(m[0], ' '); }
    if ((m = /[（(]\s*([^)）]*?)\s*[)）]/.exec(rest))) { note = normTxt(m[1]); rest = rest.replace(m[0], ' '); }
    const lang = rest.replace(/\s+/g, ' ').replace(/^[\s,;|/\-–—]+|[\s,;|/\-–—]+$/g, '').trim();
    const out = [];
    if (lang && lang.length <= 30) out.push('Language : ' + lang);
    if (codec) out.push('Format : ' + (note ? codec + ' (' + note + ')' : codec));
    if (ch) out.push('Channel(s) : ' + ch);
    if (br) out.push('Bit rate : ' + br);
    return out;
  }

  // 一栏里的「标签 : 值」→ MediaInfo 行（General 的码率是总体码率，不能当视频码率用）
  function expandPanelPair(sec, key, val) {
    const isGen = /general|概况|概要/i.test(sec);
    if (key === '@RES') {
      const m = /(\d{3,5})\s*[x×*]\s*(\d{3,5})(?:\s*[（(]\s*([\d.]+\s*:\s*[\d.]+)\s*[)）])?/i.exec(val);
      if (m) {
        const lines = ['Width : ' + m[1] + ' pixels', 'Height : ' + m[2] + ' pixels'];
        if (m[3]) lines.push('Display aspect ratio : ' + m[3].replace(/\s+/g, ''));
        return lines;
      }
      return ['Format/Info : ' + val];
    }
    if (key === 'Bit rate' && isGen) return ['Overall bit rate : ' + val];
    return [key + ' : ' + val];
  }

  // 一栏的内容行 → { lines: 该栏的通用字段行, tracks: 该栏里的每条轨道 }
  function layoutSectionLines(sec, lines) {
    const out = [];
    const tracks = [];
    const isTrackSec = /audio|text|字幕|音频|音轨/i.test(sec);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.length <= 16 && LAYOUT_HEAD.test(line)) continue;   // 栏名混进内容里就跳过
      const m = /^(.{1,24}?)\s*[:：]\s*(\S.*)?$/.exec(line);
      if (m) {
        let val = m[2] || '';
        // 「Format:」与「Matroska」被拆成两行（嵌套表格 / span 各占一行）
        if (!val && i + 1 < lines.length && !/[:：]\s*$/.test(lines[i + 1])) val = lines[++i];
        const key = panelLabelOf(m[1]);
        if (!key || !val) continue;
        out.push(...expandPanelPair(sec, key, normTxt(val)));
        continue;
      }
      if (!isTrackSec) continue;
      const tl = compactTrack(sec, line);
      if (tl.length) tracks.push(tl);
    }
    return { lines: out, tracks };
  }

  // 表格结构：表头行的每一格是一个栏名，紧跟着的行里同一列就是该栏的内容
  function tableColumnPanels(table) {
    if (!table || !table.rows) return null;
    const rows = [...table.rows];
    for (let i = 0; i < rows.length; i++) {
      const cells = [...rows[i].children].filter(c => /^(TD|TH)$/.test(c.tagName));
      if (cells.length < 2) continue;
      const names = cells.map(c => layoutHeadName(c.textContent));
      if (names.filter(Boolean).length < 2) continue;
      const groups = names.map(n => (n ? { name: n, els: [] } : null));
      for (let j = i + 1; j < rows.length; j++) {
        const cs = [...rows[j].children].filter(c => /^(TD|TH)$/.test(c.tagName));
        if (cs.length !== names.length) break;
        if (cs.map(c => layoutHeadName(c.textContent)).filter(Boolean).length >= 2) break;   // 下一组表头
        cs.forEach((c, k) => { if (groups[k]) groups[k].els.push(c); });
      }
      const hit = groups.filter(g => g && g.els.length);
      if (!hit.length) continue;
      return hit;
    }
    return null;
  }

  // 标签条结构：标签排在同一处，内容按顺序跟在后面
  function labelStripPanels(root) {
    if (!root || !root.querySelectorAll) return null;
    let all = [];
    try { all = root.querySelectorAll('div,ul,ol,dl,section'); } catch (e) { return null; }
    let guard = 0;
    for (const box of all) {
      if (guard++ > 400) break;
      const kids = [...box.children];
      if (kids.length < 3) continue;
      const names = [];
      let i = 0;
      for (; i < kids.length; i++) {
        const n = layoutHeadName(kids[i].textContent);
        if (!n) break;
        names.push(n);
      }
      if (names.length < 2) continue;
      let panes = kids.slice(names.length);
      if (panes.length < names.length) {
        const nx = box.nextElementSibling;
        panes = nx && nx.children ? [...nx.children] : [];
      }
      if (panes.length < names.length) continue;
      return names.map((n, k) => ({ name: n, els: [panes[k]] }));
    }
    return null;
  }

  // 若干栏 → 正常的多段 MediaInfo 文本
  function groupsToText(groups) {
    if (!groups || !groups.length) return '';
    const general = [], video = [], audioTracks = [], textTracks = [];
    for (const g of groups) {
      const lines = [], tracks = [];
      for (const cell of g.els) {
        const r = layoutSectionLines(g.name, forcedLines(cell));
        lines.push(...r.lines);
        tracks.push(...r.tracks);
      }
      const body = lines.length ? lines : [];
      if (/^General$/i.test(g.name)) general.push(...body);
      else if (/^Video$/i.test(g.name)) video.push(...body);
      else if (/^Audio$/i.test(g.name)) {
        if (tracks.length) audioTracks.push(...tracks);
        else if (body.length) audioTracks.push(body);
      } else {
        if (tracks.length) textTracks.push(...tracks);
        else if (body.length) textTracks.push(body);
      }
    }
    const out = [];
    if (general.length) out.push('General', ...general);
    if (video.length) out.push('Video', ...video);
    for (const t of audioTracks) out.push('Audio', ...t);
    for (const t of textTracks) out.push('Text', ...t);
    const text = out.join('\n');
    if (!/(^|\n)Video(\n|$)/i.test(text) && !audioTracks.length) return '';
    if (!/(Format|Width|Duration|Bit rate|Frame rate)\s*:/i.test(text)) return '';
    if (text.split('\n').length < 4) return '';
    return text;
  }

  // 候选文本是不是「几个段头全挤在开头」的多栏面板。
  // 段头之间有没有换行都算：<div> 版是「General\nVideo\nAudio」，<span> 版会粘成「GeneralVideoAudio」。
  const PACKED_HEAD_RE = /^[\s\u3000]*(?:引用|quote)?[\s:：]*(?:(?:general|video|audio|text|subtitles?|字幕|音频|视频|概况|概要)[\s\u3000]*){2,}/i;
  function packedPanelText(text) {
    const t = String(text || '');
    if (!PACKED_HEAD_RE.test(t.slice(0, 200))) return false;
    // 后面得有「标签: 值」的行，否则就是一段普通的文字
    return /[A-Za-z][^\n:：]{0,23}\s*[:：]\s*\S/.test(t);
  }

  // 从候选所在的 DOM 里把多栏面板重新拼成文本；拼不出来返回 ''
  function rebuildPackedPanel(el) {
    if (!el) return '';
    const scopes = [];
    try { if (el.tagName === 'TABLE') scopes.push(el); } catch (e) { /* ignore */ }
    let tables = [];
    try { tables = el.querySelectorAll ? el.querySelectorAll('table') : []; } catch (e) { tables = []; }
    const wide = el === document.body || el === document.documentElement;
    for (const t of [...tables].slice(0, wide ? 40 : 8)) scopes.push(t);
    try {
      const up = el.closest && el.closest('table');
      if (up) scopes.push(up);
    } catch (e) { /* ignore */ }
    for (const t of scopes) {
      let g = null;
      try { g = tableColumnPanels(t); } catch (e) { g = null; }
      if (g) {
        const txt = groupsToText(g);
        if (txt) return txt;
      }
    }
    let g2 = null;
    try { g2 = labelStripPanels(el); } catch (e) { g2 = null; }
    if (g2) {
      const txt = groupsToText(g2);
      if (txt) return txt;
    }
    return '';
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
  // DOM 级的「标签 + 值」兜底：有的模板把标签写成 <b>Size</b><br>13.21 GB（没有冒号），
  // 纯文本正则抓不到，但按 DOM 相邻关系一看就有。FileList 这类「只有 HTML 面板」的页
  // 靠这条补上文件名 / 体积 / 日期（面板本身不带这几项）。
  function domLabelScan() {
    const out = { name: '', size: '', date: '' };
    if (!document.body) return out;
    const isSize = v => /^[\d.,]+\s*(B|bytes?|KiB|MiB|GiB|TiB|KB|MB|GB|TB)$/i.test(String(v).trim());
    const isFile = v => /\.(mkv|mp4|m4v|ts|m2ts|avi|iso|wmv|flv|mov|rmvb|mpg|mpeg|webm)\b/i.test(v);
    const isoDate = v => {
      let m = /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(v);
      if (m) return m[1] + '-' + m[2].padStart(2, '0') + '-' + m[3].padStart(2, '0');
      m = /(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/.exec(v);   // dd/mm/yyyy（欧洲站常见）
      if (m) return m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');
      return '';
    };
    // ① tooltip / title 属性里常有完整文件名（FileList 种子行的 title 就是 xxx.mkv）
    let guard = 0;
    for (const n of document.querySelectorAll('[title], [data-original-title]')) {
      if (guard++ > 1500) break;
      const raw = n.getAttribute('title') || n.getAttribute('data-original-title') || '';
      if (!raw || raw.length > 600) continue;
      const hit = /[^\s<>"'\\/]{2,}\.(mkv|mp4|m4v|ts|m2ts|avi|iso|wmv|flv|mov|rmvb|mpg|mpeg|webm)\b/i.exec(raw);
      if (hit) { out.name = hit[0].replace(/&[a-z]+;/gi, '').trim(); break; }
    }
    // ② 「标签 + 值」相邻：标签元素之后最近的一段非空文本
    const LABELS = [
      ['size', /^(size|file\s*size|体积|大小|檔案大小)$/i],
      ['date', /^(uploaded\s*at|uploaded|added|date|上传时间|发布日期|发布时间|日期)$/i]
    ];
    guard = 0;
    for (const n of document.querySelectorAll('b,strong,th,td,dt,span,div')) {
      if (guard++ > 3000) break;
      if (n.children.length) continue;
      const label = normTxt(n.textContent).replace(/[:：]\s*$/, '');
      if (!label || label.length > 14) continue;
      for (const [key, re] of LABELS) {
        if (out[key] || !re.test(label)) continue;
        let v = '';
        let sib = n.nextSibling;
        for (let i = 0; sib && i < 5; i++, sib = sib.nextSibling) {
          const t = normTxt(sib.textContent || '');
          if (t) { v = t; break; }
        }
        if (!v && n.parentElement) v = normTxt((n.parentElement.textContent || '').replace(label, ''));
        if (!v) continue;
        if (key === 'size' && isSize(v)) out.size = v;
        if (key === 'date' && isoDate(v)) out.date = isoDate(v);
      }
    }
    return out;
  }

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

    // 标签版式找不到（或找不全）时，再看 DOM 相邻关系 + tooltip，补缺不覆盖
    const dom = domLabelScan();

    return {
      name: firstMatch(PAGE_LABELS.name, isName) || titleName || dom.name,
      size: firstMatch(PAGE_LABELS.size, isSize) || dom.size,
      date: firstMatch(PAGE_LABELS.date, isDate) || dom.date,
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
    mode: CONFIG.mode, theme: CONFIG.theme,
    // 是否用卡片替换站点原文（默认开；记住用户选择，'0' 表示手动关过）
    replaceSource: CONFIG.replaceSource && store.get('mi_replace', '1') !== '0'
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
      // Gazelle（BTN）：页面是布局表格 + .box 板块，findIntroRow 会抓到导航那一行，
      // 配色要以简介正文为准，否则采样到的是深色导航条的配色
      const gz = isGazelleSite() ? gazelleDescEl(anchor) : null;
      const row = gz ? null : findIntroRow(anchor);
      const ref = gz || (row
        ? (row.cells && row.cells.length > 1 ? row.cells[row.cells.length - 1] : row)
        : findDescriptionBlock(anchor));
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
      // 采样到的「前景色 / 底色」如果贴在一起（FileList 上就是深灰字 + 深灰底），
      // 这套配色本身就看不清，不如不用：直接放弃，交给主题默认值，落位后再做一次对比度校正
      if (Math.abs(lumOf(fgC) - lumOf(bgC)) < 0.2) return null;

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
    /* 主题是手动选的（亮色 / 暗色）就别用站点配色覆盖它：
     * 之前这里照采样改 --mi-fg 和 mi-dark，用户在深色站点上点「亮色」等于没点，
     * 深色文字继续压深色背景，整块卡片看着是空的。 */
    if (state.theme !== 'auto') return;
    s.setProperty('--mi-fg', pal.fg);
    s.setProperty('--mi-sub', pal.sub);
    s.setProperty('--mi-line', pal.line);
    s.setProperty('--mi-hover', pal.hover);
    if (pal.accent) s.setProperty('--mi-accent', pal.accent);
    root.classList.toggle('mi-dark', !!pal.dark);
    root.classList.toggle('mi-light', !pal.dark);
  }

  // PT 站多为深色主题且 body 背景常透明，用「正文颜色 + 主容器背景」综合判断
  function detectTheme(preferNode) {
    if (state.theme !== 'auto') return state.theme;
    /* 先实测页面主体底色：深色皮肤常见「底色写在 html / 背景图上、body 却是默认黑字」，
     * 只看 body 的 color 会把深色页面判成浅色，卡片于是拿深色文字压在深色底上（看着像空的）。 */
    try {
      const prof = pageColorProfile(preferNode);
      if (prof.bg) return lumOf(prof.bg) < 0.5 ? 'dark' : 'light';
      if (prof.ink) {
        const li = lumOf(prof.ink);
        if (li > 0.55) return 'dark';
        if (li < 0.42) return 'light';
      }
    } catch (e) { /* ignore */ }
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

  /* 内嵌卡片是透明的：文字颜色一旦和页面底色接近，整块就会「看起来是空的」。
   * FileList 上正是这样：字段（文件名 / 体积 / 时长 / 分辨率 / 视频 / 音频 / 字幕）全都解析出来了，
   * 但前景色和页面底色都是深灰，肉眼一个字也看不见 —— 用户只能看到一排空标签。
   * 所以卡片落位后实测一次前景 / 底色的亮度差，不够就按页面底色反选主题。 */
  function bgBehind(node) {
    let n = node && node.parentElement;
    for (let i = 0; n && i < 30; i++, n = n.parentElement) {
      const st = getComputedStyle(n);
      const c = parseColor(st.backgroundColor);
      if (c && c.a > 0.5) return c;
      /* 深色皮肤常把正文底画成背景图（FileList 的 .cblock-content 就是 content-bg-blue.png），
       * 这一层往下就没有纯色底了：再往上爬到 body 拿到的是页面外框的浅灰 #b3b4ab，
       * 与眼睛看到的深色正文完全相反 —— 所以这里必须停手，交给「同位置文字色」反推。 */
      if (st.backgroundImage && st.backgroundImage !== 'none') return null;
    }
    return null;   // 全透明 / 背景图：量不出来
  }

  /* 卡片正后方的实测底色：只在「卡片自己的矩形」里取样，不做整页投票。
   * 为什么必须这么做：深色详情页里常常夹着大块浅色区域（海报、iframe、白底说明面板、右侧栏），
   * 整页取 3 个点投票时只要有 2 个落在那些地方，就会把「本地深色」判成浅色主题 ——
   * 浅色主题的深色文字压在深色底上，整块卡片看起来就是一排空标签（用户实测的正是这个）。
   * 取点用 elementsFromPoint：它按从上到下的顺序返回该点上的所有元素，跳过卡片自身后，
   * 第一个不是卡片的元素就是被卡片盖住的那一层，比「往上找父级」更接近真实观感。 */
  function stackAt(x, y) {
    try {
      if (document.elementsFromPoint) return document.elementsFromPoint(x, y) || [];
      const e = document.elementFromPoint(x, y);
      return e ? [e] : [];
    } catch (e) { return []; }
  }

  /* 某一点上「卡片背后」的两件事：纯色底色、以及这一层站点自己的文字色。
   * 底色量不出来（背后是背景图）时，站点文字色就是推断深浅的唯一可靠线索：
   * 页面在这一块能把字写成浅色，说明底色是深的。 */
  function behindAt(x, y, skip) {
    const out = { c: null, ink: null, img: false };
    for (const el of stackAt(x, y)) {
      if (!el || el.nodeType !== 1) continue;
      if (skip && (el === skip || (skip.contains && skip.contains(el)))) continue;
      if (el.closest && el.closest('.mi-root, .mi-fab')) continue;
      const ink0 = parseColor(getComputedStyle(el).color);
      if (ink0 && ink0.a > 0.3) out.ink = ink0;
      for (let n = el, i = 0; n && i < 40; i++, n = n.parentElement) {
        const st = getComputedStyle(n);
        const c = parseColor(st.backgroundColor);
        if (c && c.a > 0.5) { out.c = c; return out; }
        if (st.backgroundImage && st.backgroundImage !== 'none') { out.img = true; return out; }
      }
      return out;   // 一路透明到底：既没纯色底，也没有背景图
    }
    return out;
  }

  function modalColor(list) {
    if (!list || !list.length) return null;
    const buckets = new Map();
    for (const c of list) {
      const key = Math.round(lumOf(c) * 24) + ':' + (c.r >> 5) + ':' + (c.g >> 5) + ':' + (c.b >> 5);
      const cur = buckets.get(key) || { c, n: 0 };
      cur.n++;
      buckets.set(key, cur);
    }
    let best = null;
    for (const v of buckets.values()) if (!best || v.n > best.n) best = v;
    return best ? best.c : null;
  }

  function localBgFor(node) {
    const out = { bg: null, ink: null, img: false, points: 0, hits: 0, imgPts: 0 };
    if (!node || !node.isConnected) return out;
    let r = null;
    try { r = node.getBoundingClientRect(); } catch (e) { return out; }
    if (!r || r.width < 4 || r.height < 4) return out;
    const vw = window.innerWidth || document.documentElement.clientWidth || 0;
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    const bgs = [], inks = [];
    for (const fy of [0.2, 0.5, 0.8]) {
      for (const fx of [0.15, 0.5, 0.85]) {
        const x = Math.round(r.left + r.width * fx);
        const y = Math.round(r.top + r.height * fy);
        if (vw && (x < 0 || x >= vw)) continue;
        if (vh && (y < 0 || y >= vh)) continue;
        out.points++;
        const hit = behindAt(x, y, node);
        if (hit.ink) inks.push(hit.ink);
        if (hit.c) { bgs.push(hit.c); out.hits++; }
        else if (hit.img) out.imgPts++;
      }
    }
    out.bg = modalColor(bgs);
    out.ink = modalColor(inks);
    out.img = !out.bg && out.imgPts > 0;   // 背后是背景图：纯色底量不出
    return out;
  }

  /* 本地实测出来的「这一块该是深是浅」：有纯色底就看底色，只有背景图就看站点在这一块的文字色 */
  function themeOfLocal(local) {
    if (!local) return null;
    if (local.bg) return lumOf(local.bg) < 0.5 ? 'dark' : 'light';
    if (local.ink) return lumOf(local.ink) > 0.5 ? 'dark' : 'light';
    return null;
  }

  /* 页面实际底色：不再只靠「卡片父级往上第一个不透明背景」——那个祖先常常是局部的白色容器，
   * 而页面主体其实被外层深色皮肤 / 背景图盖住了（FileList 这类站就是：表体深色、局部白底），
   * 采错一次就会把深色文字判成「看得清」。
   * 改成在页面上取几个点（避开卡片自身），逐层往上找第一个不透明背景，按亮度分桶投票；
   * 同时记录这些点上「页面自己的文字色」，作为底色量不出来时的反推依据。 */
  function pageColorProfile(node) {
    const out = { bg: null, ink: null, points: 0 };
    const vw = Math.max(320, Math.round(window.innerWidth || document.documentElement.clientWidth || 1200));
    const vh = Math.max(240, Math.round(window.innerHeight || document.documentElement.clientHeight || 800));
    const pts = [];
    // 卡片 / 锚点附近优先：页眉导航的配色不能代表正文
    try {
      const ref = (node && node.isConnected && node.parentElement) || null;
      const rc = ref ? ref.getBoundingClientRect() : null;
      if (rc && rc.width > 0 && rc.height > 0) {
        pts.push([Math.min(vw - 4, Math.max(4, rc.left + rc.width * 0.5)), Math.min(vh - 4, Math.max(4, rc.top + 24))]);
      }
    } catch (e) { /* ignore */ }
    pts.push([vw * 0.5, vh * 0.5], [vw * 0.3, vh * 0.4], [vw * 0.7, vh * 0.6]);

    const bgs = [], inks = [];
    for (const pt of pts) {
      let el = null;
      try { el = document.elementFromPoint(Math.round(pt[0]), Math.round(pt[1])); } catch (e) { el = null; }
      if (!el) continue;
      if (el.closest && el.closest('.mi-root, .mi-fab')) continue;   // 别采到卡片自己
      out.points++;
      const cs = getComputedStyle(el);
      const ink = parseColor(cs.color);
      if (ink && ink.a > 0.3) inks.push(ink);
      let hit = null;
      for (let n = el, i = 0; n && i < 40; i++, n = n.parentElement) {
        const s = getComputedStyle(n);
        const c = parseColor(s.backgroundColor);
        if (c && c.a > 0.5) { hit = c; break; }
        if (s.backgroundImage && s.backgroundImage !== 'none') break;   // 有背景图：这一点量不出纯色底
      }
      /* 不再退到 body / html 的纯色底：深色皮肤常把正文底画成背景图，
       * 退到最后拿到的是页面外框的浅色（FileList 的 #b3b4ab），会把它当成正文底色 —— 宁可量不出。 */
      if (hit) bgs.push(hit);
    }

    if (bgs.length) {
      const buckets = new Map();
      for (const c of bgs) {
        const key = Math.round(lumOf(c) * 24) + ':' + (c.r >> 5) + ':' + (c.g >> 5) + ':' + (c.b >> 5);
        const cur = buckets.get(key) || { c, n: 0 };
        cur.n++;
        buckets.set(key, cur);
      }
      let best = null;
      for (const v of buckets.values()) if (!best || v.n > best.n) best = v;
      out.bg = best ? best.c : null;
    }
    if (inks.length) {
      let best = inks[0];
      for (const c of inks) if (lumOf(c) > lumOf(best)) best = c;
      out.ink = best;
    }
    // body 的文字色最能代表「页面主文字」：采样点常常落在没设 color 的元素上（继承成黑），
    // 拿它反推页面深浅会翻车，所以把 body 的颜色并进来一起挑最亮的
    try {
      const bi = parseColor(getComputedStyle(document.body).color);
      if (bi && bi.a > 0.3 && (!out.ink || lumOf(bi) > lumOf(out.ink))) out.ink = bi;
    } catch (e) { /* ignore */ }
    return out;
  }

  /* 文字色是否与底色够得着：返回参与比较的最小亮度差（越接近 0 越看不清）
   * 注意要遍历全部字段值：第一个 .mi-val 常常是「—」占位（用次要色），拿它当样本会误判成「看得清」 */
  function worstContrast(node, bg) {
    if (!bg) return null;
    const lb = lumOf(bg);
    const probe = [];
    const push = el => { if (el && probe.indexOf(el) < 0) probe.push(el); };
    push(node);
    if (node.querySelectorAll) {
      ['.mi-val:not(.mi-empty)', '.mi-key', '.mi-title', '.mi-btn', '.mi-more'].forEach(sel => {
        try { node.querySelectorAll(sel).forEach(push); } catch (e) { /* ignore */ }
      });
    }
    let worst = null;
    for (const el of probe) {
      let c = null;
      try { c = parseColor(getComputedStyle(el).color); } catch (e) { c = null; }
      if (!c || c.a < 0.2) continue;
      const d = Math.abs(lumOf(c) - lb);
      if (worst === null || d < worst.diff) worst = { diff: d, color: c };
    }
    return worst;
  }

  /* 内嵌卡片是透明的：文字一旦和页面底色贴太近，整块看着就像「空的」（FileList 上就这样）。
   * 这里以「实测文字色 vs 实测页面底色」为准做最终裁决：
   *   - 主题=自动：直接按页面底色反选深浅主题；
   *   - 主题=手动（用户点了浅色 / 深色）：文字色不动，但透明卡片读不出来时给它自己上底色，
   *     免得「手选了浅色 + 站点是暗色」变成深字压深底、一片空白。 */
  function ensureReadable(node, anchor) {
    if (!node || !node.isConnected) return null;
    const prof = pageColorProfile(node);
    /* 底色按可靠度排队：① 卡片正后方实测（最准）② 卡片祖先链上的第一个不透明底
     * ③ 整页取点投票（深浅混杂的页面会投错）
     * ①背后是背景图、②又在背景图处止步时，一律不采信 ③ —— 那往往是页面外框的浅色，
     * 与眼睛看到的正文底色正相反（FileList：body #b3b4ab，正文区是深色背景图）。
     * 这时改用「同位置站点的文字色」反推：页面在这一块把字写成浅色，底就是深的。 */
    const local = localBgFor(node);
    let bg = local.bg;
    if (!bg && !local.img) bg = bgBehind(node) || prof.bg;
    let bgGuessed = false;
    const inkC = local.ink || prof.ink;
    if (!bg && inkC) {
      const li = lumOf(inkC);
      if (li > 0.55) bg = { r: 24, g: 30, b: 40, a: 1 };        // 这一块的字是浅色 → 深色底
      else if (li < 0.42) bg = { r: 250, g: 250, b: 251, a: 1 }; // 这一块的字是深色 → 浅色底
      bgGuessed = true;
    }
    const lb = bg ? lumOf(bg) : null;
    const worst = worstContrast(node, bg);
    const bad = (lb === null) || !worst || worst.diff < 0.22;

    // 手动主题：只补底色，不改用户选的文字色
    if (state.theme !== 'auto') {
      if (!bad) return null;
      node.classList.add('mi-surface-on');
      return {
        fg: worst ? rgbStr(worst.color) : '-',
        bg: bg ? rgbStr(bg) : '测不出（背景图）',
        manual: true
      };
    }
    if (!bad) return null;

    const wantDark = lb !== null ? lb < 0.5 : (inkC ? lumOf(inkC) > 0.55 : true);
    ['--mi-fg', '--mi-sub', '--mi-line', '--mi-hover', '--mi-accent'].forEach(k => node.style.removeProperty(k));
    node.classList.toggle('mi-dark', wantDark);
    node.classList.toggle('mi-light', !wantDark);
    // 底色是推断出来的（或干脆量不出来）都不可靠：给卡片上底色，保证一定有对比
    node.classList.toggle('mi-surface-on', lb === null || bgGuessed);
    return {
      fg: worst ? rgbStr(worst.color) : '-',
      bg: bg ? rgbStr(bg) : '测不出（背景图）',
      flipped: wantDark
    };
  }

  function matchesAny(node, selectors) {
    for (const sel of selectors) {
      try { if (node.matches && node.matches(sel)) return true; } catch (e) { /* 忽略非法选择器 */ }
    }
    return false;
  }

  // 「简介 / 描述」这类行标签的多语言写法：英文站（FileList 等）写 Description / Media Info，
  // 繁体站写「簡介 / 說明」，都算简介行，不能只认中文的「简介」两个字。
  const INTRO_LABEL_RE = /^(简\s*介|簡\s*介|描\s*述|介\s*绍|介紹|内\s*容|內容|说\s*明|說明|详\s*情|詳\s*情|概\s*述|摘\s*要|技术信息|技術信息|种子简介|種子簡介|影片简介|影音信息|description|torrent\s*description|media\s*info|mediainfo|media\s*details|info|nfo|notes?|plot|synopsis|overview|details?|about)\b/i;

  function isIntroLabel(node) {
    if (!node) return false;
    const t = String(node.textContent || '').replace(/[\s\u00a0]+/g, ' ').replace(/^[\s:：]+|[\s:：]+$/g, '');
    return t.length > 0 && t.length <= 24 && INTRO_LABEL_RE.test(t);
  }

  // 站点语言：登记表里写了就用登记的，否则看 <html lang>，默认中文。
  // 只影响「媒体信息 / Media Info」这类要贴到站点表格里的字，卡片内部字段仍是中文。
  function siteLang() {
    const site = currentSite();
    if (site && site.lang) return site.lang;
    try {
      const l = String(document.documentElement.lang || '').toLowerCase();
      if (l && l.indexOf('zh') !== 0) return l.slice(0, 2);
    } catch (e) { /* ignore */ }
    return 'zh';
  }

  function inlineLabelText() {
    return siteLang() === 'en' ? 'Media Info' : '媒体信息';
  }

  // 诊断用：节点的祖先链（带尺寸 / 隐藏标记），落位不准时一眼看出脚本认到了哪一层
  function chainOf(node, depth) {
    const out = [];
    let n = node;
    for (let i = 0; n && i < (depth || 8) && n !== document.documentElement; i++, n = n.parentElement) {
      let s = shortSel(n);
      try {
        const r = n.getBoundingClientRect ? n.getBoundingClientRect() : null;
        if (r) s += '(' + Math.round(r.width) + '×' + Math.round(r.height) + (isVisible(n) ? '' : ',隐藏') + ')';
      } catch (e) { /* ignore */ }
      out.push(s);
    }
    return out.join(' → ');
  }

  // 找「简介」所在的表格行：从 MediaInfo 元素向上，取最靠近外层 table 的 tr；
  // 如果其中一行的首格写着「简介 / Description」之类的标签，优先认定它是简介行
  // （憨憨、猫站这类皮肤会把整块简介放进带 colspan 的独立行里）。
  function findIntroRow(anchor) {
    let row = null;
    let labelled = null;
    let n = anchor;
    for (let i = 0; n && i < 20 && n !== document.body && n !== document.documentElement; i++, n = n.parentElement) {
      if (n.tagName === 'TR') {
        row = n;
        const c = n.cells && n.cells[0];
        if (c && isIntroLabel(c)) labelled = n;
      }
      if (n.tagName === 'TABLE') break;
    }
    return labelled || row;
  }

  // 能不能把卡片插到它旁边：行本身隐藏（折叠容器里）但父级可见时也算可以，
  // 否则「简介行在 display:none 的 tr 里」的站点会整片落位失败、被迫悬浮。
  function canPlaceNear(node) {
    if (!node) return false;
    if (isVisible(node)) return true;
    return !!(node.parentElement && isVisible(node.parentElement));
  }


  // 非表格布局时，找最外层的「简介 / 描述」容器
  function findDescriptionBlock(anchor) {
    if (!anchor) return null;
    const site = currentSite();
    const sels = site && site.desc ? CONFIG.descriptionSelectors.concat(site.desc) : CONFIG.descriptionSelectors;
    // 防止一路爬到整页容器：候选文本比锚点大一个数量级，说明它已经包住了标题、文件列表等，
    // 不是「简介区块」，此时宁可交给第三档（贴近 MediaInfo 立一段），也不要把卡片扔到页面顶上
    const cap = Math.max(((anchor.textContent || '').length) * 10, 5000);
    let outer = null;
    let n = anchor;
    for (let i = 0; n && i < 15 && n !== document.body && n !== document.documentElement; i++, n = n.parentElement) {
      if (/^(main|wrapper|outer|page|container|content|app|root|header|footer|nav)$/i.test(n.id || '')) break;
      if ((n.textContent || '').length > cap) break;
      if (matchesAny(n, sels)) outer = n;
    }
    return outer;
  }

  /* Gazelle 落位（BTN / broadcasthe.net）
   * Gazelle 详情页不是 NexusPHP 那套「标签格 + 内容格」的表格行，而是：
   *   <div class="box"><div class="head">Description</div><div class="body">…正文…</div></div>
   * 正文容器常见 .torrent_description（CSS 里就有 .torrent_description img 的尺寸规则）。
   * 所以这里不克隆表格行，而是造一个同款 box —— 标题条写 Media Info、正文里放卡片 ——
   * 插在简介盒之前。这样卡片和站点其它板块齐边同宽，看着就是页面自带的「媒体信息」板块。
   */
  const GZ_DESC_SEL = ['#torrent_description', '.torrent_description', '.group_description',
    '#description', '.torrentdetails', '.torrentinfo', '[class*="torrent_desc" i]', '[id*="description" i]'];

  // 简介正文容器：从原文节点往上找第一个「像简介」的容器
  function gazelleDescEl(anchor) {
    if (!anchor) return null;
    const cap = Math.max((anchor.textContent || '').length * 10, 5000);
    let n = anchor;
    for (let i = 0; n && i < 16 && n !== document.body && n !== document.documentElement; i++, n = n.parentElement) {
      if (matchesAny(n, GZ_DESC_SEL)) return n;
      if ((n.textContent || '').length > cap) return null;   // 已经包住整页了，不是简介区块
      if (/^(main|wrapper|outer|page|container|content|app|root)$/i.test(n.id || '')) return null;
    }
    return null;
  }

  // 该把卡片插在哪个盒子之前：优先「带 .head 的那层 .box」（插在它前面最像原生板块）
  function gazelleBoxEl(anchor) {
    const desc = gazelleDescEl(anchor);
    if (!desc) return null;
    let box = null;
    try { box = desc.closest ? desc.closest('.box') : null; } catch (e) { box = null; }
    if (box && box !== document.body && box.parentElement) {
      const cap = Math.max((anchor.textContent || '').length * 12, 6000);
      if ((box.textContent || '').length <= cap) return box;
    }
    return desc;
  }

  // 在简介盒前插入「Media Info」盒。目标在格子 / 列表里时放弃（div 兄弟会把布局撑歪），交给通用档位
  function insertGazelleBox(card, anchor) {
    if (!isGazelleSite()) return false;
    const target = gazelleBoxEl(anchor);
    if (!target || !target.parentNode) return false;
    if (!isVisible(target)) return false;
    if (/^(TD|TH|TR|TBODY|THEAD|TFOOT|TABLE|LI|UL|OL|DL)$/.test(target.parentElement.tagName)) return false;
    const box = el('div', 'box mi-gz-box');
    box.setAttribute('data-mi-host', '1');
    box.appendChild(el('div', 'head', inlineLabelText()));
    const body = el('div', 'body pad');   // .body / .pad 两个类名都挂上：新旧 Gazelle 皮肤各认一个
    body.appendChild(card);
    box.appendChild(body);
    card.classList.add('mi-gz');
    target.parentNode.insertBefore(box, target);
    return true;
  }

  /* 第三档落位：M-Team / FileList 这类模板
   * 没有可克隆的 tr，也认不出「简介」类名，就退一步：
   * 从 MediaInfo 所在节点往上，找到第一个「有兄弟节点」的块级祖先（说明它是页面上的一个区块，
   * 而不是唯一内容），把卡片插在它前面。这样卡片仍然贴着简介区，而不是被迫悬浮到右下角。
   * 遇到 td / tr / table / li 这类结构性祖先一律放弃，避免把卡片塞进简介正文里被裁掉。
   */
  function findOuterBlock(anchor) {
    if (!anchor || !anchor.parentElement) return null;
    const bad = /^(TD|TH|TR|TBODY|THEAD|TFOOT|TABLE|LI|UL|OL|DL)$/;
    let n = anchor;
    for (let i = 0; n && i < 12; i++) {
      if (bad.test(n.tagName)) return null;
      const p = n.parentElement;
      if (!p || /^(BODY|HTML)$/.test(p.tagName)) return n === anchor ? null : n;
      if (bad.test(p.tagName)) return null;
      // 进入布局容器之前收手：当前节点就是页面里的一个区块
      if (/^(main|wrapper|outer|page|container|content|app|root)$/i.test(p.id || '') ||
          /^(main|wrapper|outer|page|container|content|app|root)$/i.test(String(p.className || ''))) return n;
      if (p.children.length > 1) return n;
      n = p;
    }
    return null;
  }

  // 把卡片作为新的表格行插到「简介」行之前（NexusPHP 详情页是 table 布局）
  function insertAsRow(card, row) {
    if (!row || !row.parentNode) return false;
    try {
      const host = el('tr');
      host.setAttribute('data-mi-host', '1');
      const cells = row.cells || [];

      // 首选：克隆「简介」行的标签格 + 内容格，列宽/背景/边框全部沿用站点样式，
      // 卡片就像一个原生的「媒体信息」行，而不是贴在表格里的外挂方块。
      // 只在「正好 2 格」（标签 + 内容）时克隆：3 格以上的多是列表页/候选页的汇总行，
      // 克隆出来列数对不上会把表格撑歪，那种情况走下面的整行 colspan 兜底。
      if (cells.length === 2 && /^T[DH]$/.test(cells[0].tagName) && !cells[0].hasAttribute('colspan')) {
        const labelCell = cells[0].cloneNode(false);
        const contentCell = cells[cells.length - 1].cloneNode(false);
        [labelCell, contentCell].forEach(c => {
          while (c.firstChild) c.removeChild(c.firstChild);
          c.removeAttribute('id');
          c.removeAttribute('rowspan');
          c.removeAttribute('colspan');
        });
        labelCell.classList.add('mi-label-cell');
        labelCell.textContent = inlineLabelText();
        contentCell.classList.add('mi-content-cell');
        contentCell.appendChild(card);
        host.appendChild(labelCell);
        host.appendChild(contentCell);
        row.parentNode.insertBefore(host, row);
        return true;
      }

      // 兜底：整行一个单元格，按「简介」标签列宽度缩进，与内容列左对齐
      const cell = el('td', 'mi-td');
      // 列数按同一张表里最宽的一行算：简介行本身常常只有 1 格（colspan），
      // 直接拿它自己的格数当列数，卡片会比表格窄一截，右侧留一条空边
      let cols = Math.max(2, cells.length || 2);
      try {
        const rows = (row.parentNode && row.parentNode.rows) || [];
        for (let i = 0; i < rows.length; i++) {
          const rc = rows[i].cells;
          if (rows[i] !== row && rc && rc.length > cols) cols = rc.length;
        }
      } catch (e) { /* ignore */ }
      cell.colSpan = cols;
      // 缩进：单格简介行没有自己的标签格，借用上一行的首格宽度，让卡片和简介正文左对齐
      let label = cells && cells[0];
      if (!label || label === cell || label === host || cells.length < 2) {
        const prev = row.previousElementSibling;
        if (prev && prev.cells && prev.cells[0]) label = prev.cells[0];
      }
      if (label && label !== cell && label !== host) {
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

  // 区块前插入（第三档）：给卡片一个独立区块的间距，插到「简介」区块之前
  function insertAsSection(card, anchor) {
    const outer = findOuterBlock(anchor);
    if (!outer || !outer.parentNode) return false;
    if (!isVisible(outer)) return false;
    card.classList.add('mi-section');
    outer.parentNode.insertBefore(card, outer);
    return true;
  }

  // 第四档：三档都插不进去（没有可用的 table 行、认不出简介区块、也立不成区块）时，
  // 直接把卡片插在 MediaInfo 原文之前。卡片仍然落在简介里，只是不克隆站点行样式。
  // 隐藏的 textarea / input 往上找最近的可见祖先，避免把卡片插进看不见的地方。
  // 第四档落位目标：从原文往上找到第一个可见、且父级不是 tr / ul 这类结构容器的节点。
  // 找不到（整块被隐藏）或只能挂到 body 上（会跑到页面顶部）就返回 null，交给悬浮。
  function anchorPlacementTarget(anchor) {
    if (!anchor) return null;
    let t = anchor;
    for (let i = 0; t && i < 6 && !isVisible(t); i++) t = t.parentElement;
    if (!t || !t.parentNode || !isVisible(t)) return null;
    if (t === document.body || t === document.documentElement) return null;
    while (t.parentElement && /^(LI|UL|OL|DL|TR|TBODY|THEAD|TFOOT|TABLE)$/.test(t.parentElement.tagName)) {
      t = t.parentElement;
    }
    const p = t.parentNode;
    if (!p || /^(BODY|HTML)$/.test(p.tagName)) return null;
    return t;
  }

  // 第四档：三档都插不进去（没有可用的 table 行、认不出简介区块、也立不成区块）时，
  // 直接把卡片插在 MediaInfo 原文之前。卡片仍然落在简介里，只是不克隆站点行样式。
  function insertBeforeAnchor(card, anchor) {
    const t = anchorPlacementTarget(anchor);
    if (!t || !t.parentNode) return false;
    card.classList.add('mi-anchor');
    t.parentNode.insertBefore(card, t);
    return true;
  }

  function placeCard(card, anchor) {
    if (state.mode === 'float') return false;
    // HTML 面板反解（FileList 这类 PTGen 模板）：卡片整块插在三栏面板之前，
    // 不挤进 flex 栏里，宽度跟正文一致；收起原文时由 applySourceReplace 收掉整个面板组
    if (anchor && anchor.getAttribute && anchor.getAttribute('data-mi-panel') === '1') {
      const t = anchorPlacementTarget(anchor) || anchor;
      if (t && t.parentNode && isVisible(t)) {
        card.classList.add('mi-section');
        t.parentNode.insertBefore(card, t);
        return true;
      }
    }
    if (CONFIG.insertPosition === 'above-intro') {
      // Gazelle（BTN）：先试「同款 box 插在简介盒前」，别去克隆布局表格的行
      if (isGazelleSite() && insertGazelleBox(card, anchor)) return true;
      const row = findIntroRow(anchor);
      if (row && canPlaceNear(row) && insertAsRow(card, row)) return true;
      const block = findDescriptionBlock(anchor);
      if (block && canPlaceNear(block) && insertBeforeBlock(card, block)) return true;
      if (insertAsSection(card, anchor)) return true;
      if (insertBeforeAnchor(card, anchor)) return true; // 第四档兜底：贴着原文站住，别再退回悬浮
      return false;
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

  /* ---------------- 用卡片替换站点原文 ----------------
   * 站点把 MediaInfo / BDInfo 当纯文本贴在简介里，卡片渲染出来后原文还挂在那儿，
   * 一屏里同一份信息出现两遍。这里把「装的基本上就是这段文字」的那一层收起，只留卡片。
   * 三条保守规则（宁可少藏一层，也不把简介里的说明文字 / 截图一起藏掉）：
   *   ① 往上找容器时碰到 td / th / table / li / ul 这类结构格就停手；
   *   ② 容器里有 img / video / iframe / canvas 就不再往上爬；
   *   ③ 容器文字量超过原文 1.25 倍（且至少多 240 字）就不再往上爬。
   * 例外：正好命中「简介」那一行 <tr>（NexusPHP 的标签格 + 内容格）时允许收到整行，
   * 这样表格里只会剩下「媒体信息」一行，与站点原生行完全一致。
   */
  const SRC_STOP_TAGS = /^(TD|TH|THEAD|TBODY|TFOOT|TABLE|LI|UL|OL|DL|FORM|BODY|HTML)$/;
  const SRC_MEDIA_SEL = 'img,video,iframe,canvas,object,embed,audio';
  let hiddenSources = [];   // [{ el, display, priority }]

  // 简介 / 豆瓣信息这类「正文」的行首特征。容器里混着这些就不能整块收：
  // HDChina 瓷器（hdwing.org）把剧情简介和 [Mediainfo] 原文放在同一个 #kdescr 里、中间只隔 <br>，
  // 整块收掉等于把简介一起藏了（简介行变成空白，点都点不开）
  // 注：不把「简　介」「引用 / [quote]」算进来 —— 简介行标签和引用框本身就长这样，
  // 拿它们当判据会把「只装 MediaInfo 的行」也误判成混排。
  // 也不能依赖行首：站点用 <br> 排版时 textContent 里根本没有换行符，
  // 这里统一按字符出现判断（这些词在 MediaInfo 原文里基本不会出现）。
  const SRC_PROSE_RE = /◎|豆\s*瓣|译\s*名|片\s*名|年\s*代|产\s*地|类\s*别|语\s*言|上映日期|片\s*长|导\s*演|主\s*演/;

  function hasProse(text) { return SRC_PROSE_RE.test(String(text || '')); }

  // <br> 排版的页面里 textContent 不带换行，先克隆一份把 <br> 换成 \n 再取文字，
  // 否则「MediaInfo 前面压着多少字」这类按行判断全都会失效
  function textLines(node) {
    if (!node) return '';
    try {
      const c = node.cloneNode(true);
      const brs = c.querySelectorAll ? c.querySelectorAll('br') : [];
      for (let i = 0; i < brs.length; i++) brs[i].replaceWith('\n');
      return c.textContent || '';
    } catch (e) {
      return node.textContent || '';
    }
  }

  // MediaInfo 正文前面还压着多大一段别的字（简介、说明）。超过 80 字就算混排。
  function prefaceLen(text) {
    const t = String(text || '');
    const i = t.search(/(?:^|\n)[\s\u3000>]*(?:\[?\s*media\s*info\s*\]?|general)\b/i);
    if (i < 0) return 0;
    return t.slice(0, i).replace(/[\s\u3000]+/g, '').length;
  }

  function mixedContent(text) {
    return hasProse(text) || prefaceLen(text) > 80;
  }

  // 混排容器的补救：里面若还有「只装 MediaInfo」的子块（pre / 代码块 / 面板），
  // 就只收那个子块；捞不到就保留原文 —— 宁可一屏两份，也不能把简介藏没了
  function miBlockInside(scope, rawLen) {
    const len = Number(rawLen) || (scope.textContent || '').length;
    const limit = Math.round(len * 1.2) + 120;
    let best = null;
    scope.querySelectorAll('div,pre,section,table,blockquote,font').forEach(n => {
      if (n.contains(root) || n.querySelector('[data-mi-root], [data-mi-host]')) return;
      if (n.querySelector(SRC_MEDIA_SEL)) return;
      const t = n.textContent || '';
      if (!t || t.length > limit) return;
      if (hasProse(t)) return;
      if (!/(?:^|\n)\s*General\b/i.test(t)) return;
      if (MI_FIELD_RE.filter(re => re.test(t)).length < 3) return;
      if (!best || best.contains(n)) best = n;   // 取最内层
    });
    return best;
  }

  function sourceBlockOf(anchor, rawLen) {
    if (!anchor || !anchor.isConnected) return null;
    const len = Number(rawLen) || (anchor.textContent || '').length;
    if (!len) return null;
    const limit = len + Math.max(240, Math.round(len * 0.25));
    // 收整行的门槛要更严：整行文字必须几乎就是这段原文（只多出「简　介」这类标签），
    // 否则说明这一行里还夹着剧情简介、压制说明，藏掉整行会把这些字一起带走
    const tight = len + Math.max(60, Math.round(len * 0.05));
    const hasMedia = n => !!(n.querySelector && n.querySelector(SRC_MEDIA_SEL));
    // 容器里已经有卡片（或卡片宿主行）时绝不能再往上收：div 布局的站点里
    // 卡片就插在简介面板内部，收掉面板会把卡片一起藏了 —— 那一屏就什么都不剩
    const holdsCard = n => !!n && ((root && n.contains(root)) ||
      !!(n.querySelector && n.querySelector('[data-mi-host], [data-mi-root]')));

    // ⓿ 整块里混着简介正文 → 不能整块收，只能收里面「纯 MediaInfo」的那一小块
    if (mixedContent(textLines(anchor))) return miBlockInside(anchor, len);

    // ① 整行都只是这段原文（NexusPHP 的「简介」行：左边标签 + 右边一段 MediaInfo）
    //    → 收整行，表格里只剩上面的「媒体信息」行，跟站点原生行一模一样
    const introRow = findIntroRow(anchor);
    if (introRow && !hasMedia(introRow) && !holdsCard(introRow) &&
        !mixedContent(textLines(introRow)) &&
        (introRow.textContent || '').length <= tight) return introRow;

    // ② 否则只收「只装着这段文字」的最内层容器（引用框 / pre / 外层 div）
    let best = anchor;
    let n = anchor;
    for (let i = 0; n && i < 12; i++, n = n.parentElement) {
      if (!n || n === document.body || n === document.documentElement) break;
      if (hasMedia(n)) break;
      if (holdsCard(n)) break;
      if (hasProse(n.textContent || '')) break;   // 父级混着简介，收到这里就够
      if ((n.textContent || '').length > limit) break;
      if (SRC_STOP_TAGS.test(n.tagName)) break;
      best = n;
    }
    return best;
  }

  function hideSource(node, kind) {
    if (!node || !node.isConnected || node === document.body) return false;
    if (hiddenSources.some(h => h.el === node)) return true;
    const st = node.style;
    hiddenSources.push({
      el: node,
      kind: kind || 'raw',
      display: st.getPropertyValue('display'),
      priority: st.getPropertyPriority('display')
    });
    try { node.setAttribute('data-mi-src', kind === 'panel' ? 'panel' : '1'); } catch (e) { /* ignore */ }
    st.setProperty('display', 'none', 'important');
    return true;
  }

  // 还原所有被收起的原文（返回还原过的节点，供「定位」用）
  function restoreSources() {
    if (!hiddenSources.length) return [];
    const back = [];
    for (const h of hiddenSources) {
      const node = h.el;
      if (!node) continue;
      try {
        node.removeAttribute('data-mi-src');
        if (h.display) node.style.setProperty('display', h.display, h.priority || '');
        else node.style.removeProperty('display');
        back.push(node);
      } catch (e) { /* 节点已被站点移除 */ }
    }
    hiddenSources = [];
    return back;
  }

  // 当前这一份信息该不该收起原文：内嵌 + 展开 + 选项开着，三个条件都满足才收
  function replaceWanted() {
    if (!CONFIG.replaceSource || !state.replaceSource) return false;
    if (state.hidden || state.collapsed) return false;   // 卡片收起来了，原文得还回去
    if (state.mode === 'float') return false;
    const info = state.infos[state.index];
    if (!info || !info.anchor) return false;
    return effectiveMode(info.anchor) === 'inline';
  }

  /* ---------------- 站点自带的「媒体信息」面板 ----------------
   * 有些站在简介行里同时放了两份：一份站点渲染好的可见面板
   * （文件名 / 体积 / 时长 / 分辨率 / 视频 / 音频 / 字幕），一段隐藏的原文。
   * 只收原文时那份可见面板还挂在那儿，一屏就出现两份「媒体信息」。
   * 这里在同一行里按文件名认亲，把面板（或它独占的那一行）一起收起。
   * 三条门槛，宁可少收也不误伤：① 必须同一份文件（文件名要去空白后完整匹配）；
   * ② 至少命中 3 个 MediaInfo 字段；③ 不碰夹着截图 / 视频、也不碰含卡片的容器。
   */
  const MI_FIELD_RE = [
    /(?:^|[^a-z])format\s*[:：]/i,
    /(?:file ?size|文件大小|体\s*积)\s*[:：]/i,
    /(?:duration|时\s*长)\s*[:：]/i,
    /(?:width|height|宽\s*度|高\s*度|分\s*辨\s*率)\s*[:：]/i,
    /(?:bit ?rate|码\s*率|视\s*频)\s*[:：]/i,
    /(?:audio|音\s*频|subtitles?|字\s*幕)\s*[:：]/i,
    /(?:frame ?rate|帧\s*率)\s*[:：]/i
  ];

  function nativeMediaPanels(anchor, info) {
    if (!anchor || !anchor.isConnected) return [];
    const base = normFileName(info.fileName).replace(/\.[a-z0-9]{2,5}$/i, '');
    if (!base || base.length < 10) return [];   // 文件名太短不认，免得把别的块当同源
    // 范围只取「简介这一行」或「锚点所在的格子」：范围越小越不会误伤
    // 发布信息表（那里也有文件名 / 体积，收掉就丢东西了）
    const row = findIntroRow(anchor);
    const introRow = row && row.cells && row.cells[0] && isIntroLabel(row.cells[0]) ? row : null;
    const scope = introRow || (function () {
      let n = anchor;
      for (let i = 0; n && i < 6; i++, n = n.parentElement)
        if (n.tagName === 'TD' || n.tagName === 'TH') return n;
      return null;
    })();
    if (!scope) return [];
    const hits = [];
    scope.querySelectorAll('div,section,table,ul,ol,dl,pre,font').forEach(n => {
      if (!n.isConnected) return;
      if (n.contains(root) || n.querySelector('[data-mi-root], [data-mi-host]')) return;
      if (n.hasAttribute('data-mi-src') || n.closest('[data-mi-src]')) return;
      if (!isVisible(n)) return;
      if (n.querySelector(SRC_MEDIA_SEL)) return;
      const text = n.textContent || '';
      if (text.length < 24 || text.length > 6000) return;
      if (normFileName(text).indexOf(base) < 0) return;
      if (MI_FIELD_RE.filter(re => re.test(text)).length < 3) return;
      hits.push(n);
    });
    // 只留最内层：外层往往把剧情简介一块包进来，收掉会连带藏掉说明文字
    return hits.filter(n => !hits.some(m => m !== n && n.contains(m)));
  }

  // 命中点常是「面板内容格」，外面还有一层带标题的外壳（MediaInfo / 媒体信息）。
  // 往上扩展到「仍旧只装这份面板」的那一层，收起来才不会留个空标题条。
  function expandPanelShell(p, hits) {
    const len = (p.textContent || '').length;
    const limit = len + Math.max(200, Math.round(len * 0.3));
    let best = p;
    let n = p;
    for (let i = 0; n && i < 4; i++, n = n.parentElement) {
      if (!n || n === document.body || n === document.documentElement) break;
      if (/^(TD|TH|THEAD|TBODY|TFOOT|TABLE|TR|UL|OL|BODY)$/.test(n.tagName)) break;
      if (n.querySelector(SRC_MEDIA_SEL)) break;
      if (n.contains(root) || n.querySelector('[data-mi-root], [data-mi-host]')) break;
      if ((n.textContent || '').length > limit) break;
      if (hits.some(m => m !== p && n.contains(m))) break;   // 外层还装着别的面板，别一锅端
      best = n;
    }
    return best;
  }

  // 只算「看得见」的文字：被收起的原文、其它面板都要跳过，
  // 否则 textContent 会把隐藏原文的长度也算进来，整行就永远判不成「只剩标签」
  function visibleText(node) {
    let s = '';
    const kids = node.childNodes || [];
    for (let i = 0; i < kids.length; i++) {
      const c = kids[i];
      if (c.nodeType === 3) { s += c.nodeValue || ''; continue; }
      if (c.nodeType !== 1) continue;
      if (c.hasAttribute && c.hasAttribute('data-mi-src')) continue;
      const cs = getComputedStyle(c);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      s += visibleText(c);
    }
    return s;
  }

  function applySourceReplace() {
    if (!replaceWanted()) return null;
    const info = state.infos[state.index];
    let main = null;
    // 面板反解：直接收掉整个三栏面板组（卡片是它的兄弟节点，收它不会把卡片一起藏掉）
    if (info._panel && info.anchor && info.anchor.isConnected &&
        info.anchor.getAttribute && info.anchor.getAttribute('data-mi-panel') === '1') {
      hideSource(info.anchor);
      main = info.anchor;
    } else {
      const block = sourceBlockOf(info.anchor, (info.raw || '').length);
      if (block) { hideSource(block); main = block; }
    }
    // 同源但独立的一份（站点自己渲染的面板）：连它独占的行一起收，
    // 收完表格里就只剩脚本这张卡片
    const panels = nativeMediaPanels(info.anchor, info);
    for (const p of panels) {
      const target = expandPanelShell(p, panels);
      hideSource(target, 'panel');
      const row = target.closest('tr');
      if (row && row !== main && !row.contains(root) && !row.querySelector('[data-mi-root], [data-mi-host]')) {
        const rest = visibleText(row).replace(/[\s\u3000:：|｜]+/g, '');
        if (rest.length <= 8) hideSource(row, 'panel');   // 这行只剩面板 + 标签
      }
    }
    return main;
  }

  // 诊断用：现在到底收没收、收的是哪一层（同样看传进来的卡片节点，不看全局 root）
  function replaceLabel(node) {
    const r = node || root;
    if (!CONFIG.replaceSource) return '已关闭（CONFIG.replaceSource = false）';
    if (!state.replaceSource) return '已关闭（版本信息里手动关闭）';
    if (state.hidden) return '未生效（卡片已收成悬浮球，原文已还原）';
    if (state.collapsed) return '未生效（卡片折叠中，原文已还原）';
    const inline = !!(r && (r.classList.contains('mi-inline') || r.closest('tr[data-mi-host]')));
    if (!inline) return '未生效（当前是悬浮卡片，原文保持原样）';
    const info = state.infos[state.index];
    const isPanel = !!(info && info._panel);
    const raw = hiddenSources.find(h => (h.kind || 'raw') === 'raw');
    const nPanel = hiddenSources.filter(h => h.kind === 'panel').length;
    if (hiddenSources.length) {
      const head = (isPanel ? '已收起整个 HTML 面板组 ' : '已收起 ') + shortSel((raw || hiddenSources[0]).el);
      return head + (nPanel ? '，另收起站点自带面板 ' + nPanel + ' 处' : '') + '（切悬浮 / 收起卡片会还原）';
    }
    if (!info) return '未生效（还没有识别到信息）';
    const guess = sourceBlockOf(info.anchor, (info.raw || '').length);
    if (!guess) {
      return mixedContent(textLines(info.anchor))
        ? '已保留（原文与简介正文混在同一块里，收它会连简介一起藏掉）'
        : '未找到可收起的原文块（可能整段与简介文字 / 截图混在一起）';
    }
    return '本轮渲染后收起 ' + shortSel(guess) + '（原文与卡片同层时会被合并）';
  }

  // 诊断用：内嵌卡片的实际文字色 / 页面底色 —— 一眼看出「字和底一个色、看着像空的」
  function paletteLabel(node) {
    const r = node || root;
    if (!r || !r.isConnected) return '未渲染';
    const prof = pageColorProfile(r);
    const local = localBgFor(r);
    const bg = local.bg || (local.img ? null : (bgBehind(r) || prof.bg));
    const ink = local.ink || prof.ink;
    const worst = worstContrast(r, bg);
    const lb = bg ? lumOf(bg) : null;
    const theme = r.classList.contains('mi-dark') ? '深色' : (r.classList.contains('mi-light') ? '浅色' : '未定');
    let bgText;
    if (bg) bgText = rgbStr(bg) + (local.bg ? '（卡片后方实测）' : '');
    else if (local.img) bgText = '测不出（卡片背后是背景图，按同位置文字色推断）';
    else bgText = '测不出（背景图）';
    const parts = [
      '主题 ' + theme,
      '文字 ' + (worst ? rgbStr(worst.color) : '-'),
      '页面底 ' + bgText
    ];
    if (worst && lb !== null) {
      parts.push('亮度差 ' + worst.diff.toFixed(2) + (worst.diff < 0.22 ? '，已校正' : ''));
    }
    if (r.classList.contains('mi-surface-on')) parts.push('卡片自带底色');
    if (ink) parts.push('页面字（同位） ' + rgbStr(ink));
    return parts.join(' / ');
  }

  // 能找到可见的「简介」行 / 描述区块 / 可以立区块的祖先 / 至少能贴着原文站住，就内嵌，否则悬浮
  function effectiveMode(anchor) {
    if (state.mode === 'float') return 'float';
    if (state.mode === 'inline') return 'inline'; // 用户手动选了内嵌：哪怕只能立区块也内嵌
    // HTML 面板反解：锚点就是三栏容器本身，能贴上去就内嵌（不然会退回右下角悬浮）
    if (anchor && anchor.getAttribute && anchor.getAttribute('data-mi-panel') === '1' && isVisible(anchor)) return 'inline';
    // Gazelle（BTN）：认出简介盒就内嵌，别去套布局表格的行
    if (isGazelleSite()) {
      const gz = gazelleBoxEl(anchor);
      if (gz && canPlaceNear(gz) && gz.getBoundingClientRect().width >= 200) return 'inline';
    }
    const row = findIntroRow(anchor);
    if (row && canPlaceNear(row)) return 'inline';
    const block = findDescriptionBlock(anchor);
    if (block && canPlaceNear(block) && block.getBoundingClientRect().width >= 200) return 'inline';
    const outer = findOuterBlock(anchor);
    if (outer && isVisible(outer) && outer.getBoundingClientRect().width >= 200) return 'inline';
    // 第四档：贴着原文插也能内嵌（隐藏 textarea 之类会往上找可见祖先）
    if (anchorPlacementTarget(anchor)) return 'inline';
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

  // 站点名 + 模板类型，用于诊断与「关于」面板
  function siteLabel() {
    const site = currentSite();
    const h = (function () { try { return location.hostname; } catch (e) { return '?'; } })();
    if (!site) return h + '（未登记：走通用规则，卡片能否内嵌取决于页面结构）';
    const kindText = site.kind === 'gazelle' ? 'Gazelle' : (site.kind === 'custom' ? '自有模板' : 'NexusPHP');
    return site.name + '（' + h + '，' + kindText + '）';
  }

  function shortSel(node) {
    if (!node || !node.tagName) return '?';
    let s = node.tagName.toLowerCase();
    if (node.id) s += '#' + node.id;
    else if (node.className && typeof node.className === 'string') {
      const c = node.className.trim().split(/\s+/).filter(x => x && x.indexOf('mi-') !== 0).slice(0, 2);
      if (c.length) s += '.' + c.join('.');
    }
    return s;
  }

  // 卡片实际落在哪：直接看传进来的卡片节点（不要再读全局 root ——
  // 「关于」面板是在 buildCard 期间生成的，那时 root 还没赋值，读全局永远显示「尚未渲染」）
  function placementLabel(node) {
    const r = node || root;
    try {
      if (!r || !r.isConnected) return '未落位（卡片还没插进页面）';
      const host = r.closest('tr[data-mi-host]');
      if (host) {
        const two = !!(host.cells && host.cells.length === 2);
        const row = host.nextElementSibling;
        return '表格行（' + (two ? '克隆「简介」行的标签格 + 内容格' : '整行 colspan，沿用简介列宽') +
          '，插在 ' + (row ? shortSel(row) : '表格末尾') + ' 之前）';
      }
      if (r.classList.contains('mi-gz')) {
        const host = r.closest('.mi-gz-box');
        const after = host ? host.nextElementSibling : null;
        return 'Gazelle 板块（同款 .box 插在 ' + (after ? shortSel(after) : '简介盒') + ' 之前）';
      }
      if (r.classList.contains('mi-anchor')) {
        const t = r.nextElementSibling;
        return '原文上方（直接插在 ' + (t ? shortSel(t) : 'MediaInfo 原文') + ' 之前）';
      }
      if (r.classList.contains('mi-section')) {
        return '区块前（插在 ' + (r.parentElement ? shortSel(r.parentElement) : '页面') + ' 内的 MediaInfo 区块之前）';
      }
      if (r.classList.contains('mi-float')) return '悬浮（没找到可插入的「简介」结构，或本来就是悬浮模式）';
      if (r.parentElement) return '内嵌（插在 ' + shortSel(r.parentElement) + ' 内）';
      return '内嵌';
    } catch (e) { return '?'; }
  }

  // 字段为空时的自查报告：把「抓到什么、缺少什么、页面上有没有这些标签」一次说清，
  // 点一下复制，比来回截图快得多。
  function buildDiagnostic() {
    const info = state.infos[state.index];
    const lines = [];
    lines.push('MediaInfo 卡片诊断 v' + VERSION);
    lines.push('页面: ' + location.href);
    lines.push('站点: ' + siteLabel());
    lines.push('模式: ' + (MODE_LABEL[state.mode] || state.mode) + ' / 识别份数: ' + state.infos.length);
    if (info) lines.push('落位: ' + placementLabel(root));
    if (info) lines.push('原文替换: ' + replaceLabel(root));
    if (info) lines.push('配色: ' + paletteLabel(root));
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
      // HTML 面板反解：PTGen 一类模板把 MediaInfo 渲染成 Video/Audio/Subtitle 三栏，没有原文
      let panel = [];
      try { panel = htmlPanelInfos(); } catch (e) { panel = []; }
      lines.push('HTML 面板反解: ' + (panel.length
        ? '可用（' + (panel[0].text || '').split('\n').length + ' 行，来自 ' + shortSel(panel[0].el) + '）'
        : '未命中（分栏 ' + panelSections(document.body).length + ' 个，需要 Video / Audio / Subtitle 这类分栏且每栏能抠出「标签 + 值」）'));
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
      if (info._panel) lines.push('数据来源: HTML 面板反解（页面没有 MediaInfo 原文，字段由 Video / Audio / Subtitle 面板还原）');
      if (info._rebuilt) lines.push('数据来源: 多栏 HTML 面板（原文里 General / Video / Audio / Subtitles 几个栏名挤在开头，已按表格列重新对齐后解析）');
      if (info._merged) {
        lines.push('同源合并: 页面上同一份 MediaInfo 出现 ' + (info._merged + 1) + ' 次（HTML 面板 + 原文），' +
          '已合成一份；字段取更全的那份' + (info._mergedSubs ? '，字幕 ' + info._mergedSubs + ' 条取自更全的原文' : ''));
      }
      if (info._pageSubs) {
        lines.push('字幕来源: 这份面板没有字幕栏，从整页同名 MediaInfo 里补了 ' + info._pageSubs + ' 条');
      }
      // 落位不准时这几行最有用：脚本认到了哪个节点、它上层是什么结构、三档候选各自可不可用
      lines.push('锚点: ' + shortSel(a) + '（' + (isVisible(a) ? '可见' : '隐藏') + '）');
      lines.push('祖先链: ' + chainOf(a, 8));
      const row0 = findIntroRow(a);
      const blk0 = findDescriptionBlock(a);
      const out0 = findOuterBlock(a);
      lines.push('落位候选: 表格行=' + (row0 ? shortSel(row0) + (canPlaceNear(row0) ? '（可用）' : '（不可见）') : '无') +
        ' / 简介区块=' + (blk0 ? shortSel(blk0) + (canPlaceNear(blk0) ? '（可用）' : '（不可见）') : '无') +
        ' / 外层区块=' + (out0 ? shortSel(out0) : '无'));
      lines.push('候选: ' + state.infos.map((it, i) =>
        (i === state.index ? '▶' : '') + (i + 1) + '.' + shortSel(it.anchor) +
        (isVisible(it.anchor) ? '' : '(隐藏)')).join(' | '));
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

  /* ============================ 版本自检 ============================
   * 每 24 小时向安装源（与 @downloadURL 同一份文件）问一次「最新 @version 是多少」，
   * 有新版本就在版本号旁点一个红点；点红点就是打开安装源，油猴会接住并弹出更新页。
   * 查询时间与结果存在油猴存储里：24 小时内不再联网，换页面也能直接把红点亮出来。
   */
  const update = { checkedAt: 0, latest: '', busy: false, failed: '' };

  function readUpdateCache() {
    try {
      const raw = store.get(UPDATE_KEY, '');
      const o = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return { at: Number(o && o.at) || 0, ver: (o && o.ver) || '' };
    } catch (e) { return { at: 0, ver: '' }; }
  }

  function writeUpdateCache() {
    try {
      store.set(UPDATE_KEY, JSON.stringify({ at: update.checkedAt, ver: update.latest }));
    } catch (e) { /* ignore */ }
  }

  // 取远端文本：优先 GM_xmlhttpRequest（不受页面 CSP / 跨域限制），没有就退回 fetch
  function httpGet(url) {
    return new Promise((resolve, reject) => {
      if (typeof GM_xmlhttpRequest === 'function') {
        try {
          GM_xmlhttpRequest({
            method: 'GET',
            url,
            timeout: 10000,
            onload: r => (r.status >= 200 && r.status < 300)
              ? resolve(r.responseText)
              : reject(new Error('HTTP ' + r.status)),
            onerror: () => reject(new Error('网络错误')),
            ontimeout: () => reject(new Error('超时'))
          });
          return;
        } catch (e) { /* 落到 fetch */ }
      }
      fetch(url, { cache: 'no-store', credentials: 'omit' })
        .then(r => (r.ok ? r.text() : Promise.reject(new Error('HTTP ' + r.status))))
        .then(resolve, reject);
    });
  }

  function isUpdateReady() {
    return !!update.latest && cmpVersion(update.latest, VERSION) > 0;
  }

  function agoText(ts) {
    if (!ts) return '还没查过';
    const d = Date.now() - ts;
    if (d < 60 * 1000) return '刚刚';
    if (d < 3600 * 1000) return Math.max(1, Math.round(d / 60000)) + ' 分钟前';
    if (d < 24 * 3600 * 1000) return Math.round(d / 3600000) + ' 小时前';
    return Math.round(d / 86400000) + ' 天前';
  }

  // 只读缓存、不联网：卡片一渲染就能按上次的结果挂红点
  function primeUpdate() {
    const c = readUpdateCache();
    update.checkedAt = c.at;
    update.latest = c.ver;
    refreshUpdateBadges();
  }

  /* force=true 时无视 24 小时节流（「关于」面板与油猴菜单里的手动检查） */
  function checkUpdate(force, done) {
    const c = readUpdateCache();
    update.checkedAt = c.at;
    update.latest = c.ver;
    const fresh = c.at && (Date.now() - c.at < UPDATE_INTERVAL);
    if (update.busy || (fresh && !force)) {
      refreshUpdateBadges();
      if (done) done();
      return;
    }
    update.busy = true;
    update.failed = '';
    refreshUpdateBadges();
    // 加个时间戳参数，绕过 raw 的 CDN 缓存（不然刚发的版本可能几分钟内查不到）
    const url = UPDATE_URL + (UPDATE_URL.indexOf('?') < 0 ? '?' : '&') + 't=' + Date.now();
    httpGet(url)
      .then(src => {
        const v = pickVersion(src);
        if (!v) throw new Error('源码里没读到 @version');
        update.latest = v;
        update.checkedAt = Date.now();
        writeUpdateCache();
      })
      .catch(err => { update.failed = (err && err.message) || '查询失败'; })
      .then(() => {
        update.busy = false;
        refreshUpdateBadges();
        if (done) done();
      });
  }

  // 版本号旁的角标：有新版才挂红点，确认没新版就把红点摘掉
  function applyUpdateBadge(span) {
    if (!span || !span.appendChild) return;
    const old = span.querySelector ? span.querySelector('.mi-updot') : null;
    if (!isUpdateReady()) {
      if (old) old.remove();
      span.title = '点击查看版本信息与更新记录';
      return;
    }
    span.title = '发现新版本 v' + update.latest + '（点红点' + CLICK_VERB + '）';
    if (old) return;
    const dot = document.createElement('a');
    dot.className = 'mi-updot';
    dot.href = INSTALL_URL;
    dot.target = '_blank';
    dot.rel = 'noopener noreferrer';
    dot.title = '发现新版本 v' + update.latest + '，' + CLICK_HINT;
    dot.setAttribute('data-mi-updot', '1');
    dot.addEventListener('click', ev => ev.stopPropagation());   // 别顺带把「关于」面板也切了
    span.appendChild(dot);
  }

  // 后台查完只重刷现成的版本角标，不整卡重绘（免得打乱正在看的位置）
  function refreshUpdateBadges() {
    let list = [];
    try { list = document.querySelectorAll('.mi-ver'); } catch (e) { return; }
    for (let i = 0; i < list.length; i++) applyUpdateBadge(list[i]);
  }

  function updateLink(text) {
    const a = document.createElement('a');
    a.className = 'mi-about-link';
    a.href = INSTALL_URL;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = text;
    return a;
  }

  // 「关于」面板里的「更新」一行
  function paintUpdateRow(val) {
    if (!val) return;
    val.textContent = '';
    if (update.busy) { val.textContent = '检查中…'; return; }
    if (isUpdateReady()) {
      val.appendChild(document.createTextNode('发现 v' + update.latest + '（' + agoText(update.checkedAt) + '查到）　'));
      val.appendChild(updateLink('点这里更新'));
      return;
    }
    if (update.failed) {
      val.appendChild(document.createTextNode('查询失败：' + update.failed + '　'));
      val.appendChild(updateLink('去安装页'));
      return;
    }
    val.textContent = update.checkedAt
      ? '已是最新（' + agoText(update.checkedAt) + '查过 v' + (update.latest || VERSION) + '）'
      : '还没查过（打开页面几秒后会自动查）';
  }

  let aboutEls = null;   // 「关于」面板里的「落位 / 原文」值，插到位之后再刷新一次

  function buildAbout(cardEl) {
    const p = el('div', 'mi-about');
    const addRow = (k, v) => {
      const row = el('div', 'mi-about-row');
      row.appendChild(el('span', '', k));
      const val = el('span', '', v);
      row.appendChild(val);
      p.appendChild(row);
      return val;
    };
    addRow('版本', 'v' + VERSION + ' · MediaInfo 媒体信息卡片');
    // 有新版本时这一行会变成「发现 vX，点这里更新」；后台查询完会重绘
    paintUpdateRow(addRow('更新', ''));
    addRow('站点', siteLabel());
    // 这两行的真值要等卡片插进 DOM 才能算（isConnected / 原文是否已收起），先占位、渲染完再刷新
    aboutEls = {
      place: addRow('落位', '渲染中…'),
      replace: addRow('原文', '渲染中…')
    };
    addRow('范围', SITES.length + ' 个 PT 站（' + (EXT ? '扩展授权站点' : '@match 限定') + '）：' + SITES.map(s => s.host).join('、'));
    addRow('状态', '模式 ' + (MODE_LABEL[state.mode] || state.mode) +
      ' / 主题 ' + (THEME_LABEL[state.theme] || state.theme) +
      ' / 已识别 ' + state.infos.length + ' 份');
    p.appendChild(el('div', 'mi-about-sub', '版本说明'));
    const ul = el('ul', 'mi-about-list');
    RELEASE_NOTES.forEach(n => ul.appendChild(el('li', '', 'v' + n.v + ' — ' + n.d)));
    p.appendChild(ul);
    // 只放一条汇总，历史不铺开：给一个入口去仓库看完整记录
    if (REPO_URL) {
      const more = el('div', 'mi-about-tip');
      const a = document.createElement('a');
      a.className = 'mi-about-link';
      a.href = REPO_URL + '/releases';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = '完整更新历史';
      more.appendChild(a);
      p.appendChild(more);
    }
    const tools = el('div', 'mi-about-tools');
    tools.appendChild(btn(state.replaceSource ? '替换原文：开' : '替换原文：关',
      '开启后：卡片内嵌显示时，把页面原有的 MediaInfo / BDInfo 原文收起，只留卡片；关掉则原文与卡片并存', () => {
        state.replaceSource = !state.replaceSource;
        store.set('mi_replace', state.replaceSource ? '1' : '0');
        render();
      }, state.replaceSource));
    tools.appendChild(btn('复制诊断信息', '字段为空时点这里：复制「抓到什么、缺什么」，便于排查', () => {
      copyText(buildDiagnostic());
      const tip = el('div', 'mi-about-tip', '已复制到剪贴板，可直接粘贴发给我');
      tools.appendChild(tip);
      setTimeout(() => tip.remove(), 2600);
    }));
    tools.appendChild(btn('检查更新', '立即向仓库查一次（平时每 24 小时自动查一次）', () => {
      update.failed = '';
      checkUpdate(true, () => render());   // 查完重绘「关于」，把结果写进「更新」那一行
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
    // 内嵌时按「卡片将要落位的这块地方」先定深浅：整页投票在深浅混杂的页面上会选错，
    // 先判错就会有一闪而过的深字压深底（落位后 ensureReadable 会再校正一次）
    let theme = detectTheme(anchor);
    let verdict = null;   // 本地实测给出的结论：'dark' / 'light' / null（量不出）
    if (inline) {
      try { verdict = themeOfLocal(localBgFor(anchor)); } catch (e) { verdict = null; }
      // 只改「自动」的判定：手动选了亮色 / 暗色时，本地实测只用来校验采样配色，不能顶掉用户的选择
      if (verdict && state.theme === 'auto') theme = verdict;
    }
    r.classList.add(theme === 'dark' ? 'mi-dark' : 'mi-light');
    // 内嵌时跟随站点配色，避免白底卡片突兀地贴在站点表格里
    let pal = CONFIG.followSiteStyle ? sampleSitePalette(anchor) : null;
    /* 采到的配色要跟「这一步该是深是浅」对一次：对不上就整组丢弃，改用主题默认色。
     * 采样点在站点结构里常落到别的容器（浅色说明格 / 深色导航条），照用就是深字压深底。 */
    if (pal && verdict) {
      const fgL = lumOf(parseColor(pal.fg) || { r: 0, g: 0, b: 0 });
      if ((verdict === 'dark' && fgL < 0.42) || (verdict === 'light' && fgL > 0.58)) pal = null;
    }
    applySiteStyle(r, pal, inline);
    // 自动主题以本地实测为准收口：采样配色即使留下，深浅类也不能跟实测结论反着来
    if (inline && verdict && state.theme === 'auto') {
      const wantDark = verdict === 'dark';
      r.classList.toggle('mi-dark', wantDark);
      r.classList.toggle('mi-light', !wantDark);
    }

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
      applyUpdateBadge(v);   // 上次查到有新版就先挂红点，后台查完再刷一遍
      return v;
    };
    const locateTargetEl = locateTarget(anchor);
    const ACT = {
      copy: () => btn('复制', '复制为 文件名/日期/体积… 的整理文本', () => copyText(infoToText(info))),
      raw: () => btn('原文', '查看 / 隐藏 MediaInfo 原文', () => { state.showRaw = !state.showRaw; render(); }, state.showRaw),
      locate: () => btn('定位', '滚动到页面上的「简介」区块（原文被卡片替换时会先展开 4 秒）', () => {
        // 原文被收起了，这时候「定位」滚过去只会看到空白：先展开，看完再自动收回去
        const revealed = restoreSources();
        const a = (revealed && revealed.length) ? revealed[0] : locateTargetEl;
        try { a.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { /* ignore */ }
        try {
          const prev = a.style.outline;
          a.style.setProperty('outline', '2px solid ' + (pal && pal.accent ? pal.accent : 'currentColor'), 'important');
          setTimeout(() => { a.style.outline = prev; }, 1800);
        } catch (e) { /* ignore */ }
        if (revealed && revealed.length) setTimeout(() => { applySourceReplace(); }, 4000);
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
      close: () => btn('×', '收起为悬浮球（Alt + M 或' + MENU_NAME + '可重新打开）', () => { state.hidden = true; render(); })
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
    if (state.showAbout) box.appendChild(buildAbout(r));

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

  // 「关于」面板里的「落位 / 原文」两行在 buildCard 期间只有占位值：
  // 那时卡片还没插进 DOM，isConnected / 原文是否已收起都算不出来。插到位后再刷新一次。
  function refreshAbout() {
    if (!aboutEls) return;
    try {
      if (aboutEls.place && aboutEls.place.isConnected) aboutEls.place.textContent = placementLabel();
      if (aboutEls.replace && aboutEls.replace.isConnected) aboutEls.replace.textContent = replaceLabel();
    } catch (e) { /* ignore */ }
  }

  function render() {
    if (root) { root.remove(); root = null; }
    aboutEls = null;
    // 每一轮先把上一轮收起的原文放回来，状态由本轮重新决定（换页 / 切模式 / 关选项都不会留下残影）
    restoreSources();
    document.querySelectorAll('[data-mi-host]').forEach(n => n.remove()); // 清掉上一次插入的宿主行
    if (!state.infos.length) { if (fab) fab.style.display = 'none'; return; }
    if (state.hidden) { ensureFab().style.display = 'block'; return; }
    if (fab) fab.style.display = 'none';

    root = buildCard();
    const anchor = state.infos[state.index].anchor;
    if (effectiveMode(anchor) === 'inline' && placeCard(root, anchor)) {
      applySourceReplace();   // 内嵌成功后收起源码原文：一屏只留卡片
      ensureReadable(root, anchor);   // 落位后再校一次对比度：透明卡片最怕「字和底一个色」
      refreshAbout();
      return;
    }

    // 回落悬浮：清掉内嵌时采样到的站点配色，改回卡片自己的深浅色
    ['--mi-fg', '--mi-sub', '--mi-line', '--mi-hover', '--mi-accent'].forEach(k => root.style.removeProperty(k));
    root.classList.remove('mi-inline', 'mi-anchor', 'mi-section', 'mi-surface-on');
    root.classList.add('mi-float');
    ['mi-dark', 'mi-light'].forEach(c => root.classList.remove(c));
    root.classList.add(detectTheme() === 'dark' ? 'mi-dark' : 'mi-light');
    applyPosition(root);
    document.body.appendChild(root);
    refreshAbout();
  }

  /* 同源候选合并
   * 一份 MediaInfo 在页面上常出现两次：一是上传者贴的原文（.codemain / code 块，字段全），
   * 二是站点或工具渲染出来的面板（Audiences 的 ptgen 面板只有 General / Video / Audio 三栏，
   * 字幕整栏都省了）。两边各自被认成一份候选时，卡片默认显示面板那份 → 字幕全「—」，
   * 用户得点「›」切到 2/2 才看得到字幕。
   * 这里按文件名认「同一份」：字段更全的当底，另一份只补空项与更长的列表；
   * 锚点（落位与「收起原文」用）仍取面板那份，落位行为不变。
   */
  function normFileName(s) {
    return String(s || '').toLowerCase().replace(/[\s\u3000]+/g, '');
  }
  function mediaFullness(i) {
    return (i.subtitle || []).length * 3 + (i.audio || []).length * 2 + (i.video || []).length * 2 +
      (i.resolution ? 1 : 0) + (i.fps ? 1 : 0) + (i.params ? 1 : 0) +
      (i.duration ? 1 : 0) + (i.size ? 1 : 0) + (i.date ? 1 : 0);
  }
  function mergeSameFile(list) {
    const out = [];
    const byName = new Map();
    const mergeInto = (base, other) => {
      const longer = (a, b) => ((b || []).length > (a || []).length ? b : ((a || []).length ? a : b));
      base.video = longer(base.video, other.video);
      base.audio = longer(base.audio, other.audio);
      base.subtitle = longer(base.subtitle, other.subtitle);
      ['fileName', 'date', 'size', 'duration', 'fps', 'resolution', 'params', 'paramsFull',
        'bitrate', 'discTitle', 'discLabel', 'discSize', 'playlist', 'totalBitrate'
      ].forEach(k => { if (!base[k] && other[k]) base[k] = other[k]; });
      base.paramCount = Math.max(base.paramCount || 0, other.paramCount || 0);
      // 「原文」取更长的那份：面板重建出来的文本往往缺字幕段，看完原文会对不上卡片
      if ((other.raw || '').length > (base.raw || '').length) base.raw = other.raw;
      base._merged = (base._merged || 0) + 1 + (other._merged || 0);
      // 字幕差得最多：面板那份常常整栏没有字幕，合完要能看出「字幕是从哪份来的」
      if ((other.subtitle || []).length < (base.subtitle || []).length) base._mergedSubs = base.subtitle.length;
      return base;
    };
    for (const info of list) {
      const key = normFileName(info.fileName);
      if (!key) { out.push(info); continue; }
      const prev = byName.get(key);
      if (!prev) { byName.set(key, info); out.push(info); continue; }
      // 字段更全的当底；一样多时优先「不是面板」的那份（原文更干净，不会把 JOC 粘到语言上）
      const richer = mediaFullness(info) > mediaFullness(prev) ||
        (mediaFullness(info) === mediaFullness(prev) && !info._panel && prev._panel);
      const base = richer ? info : prev;
      const other = richer ? prev : info;
      mergeInto(base, other);
      // 锚点始终沿用面板那份：落位方式与「收起原文」的范围跟以前一致
      const panelSide = prev._panel || prev._rebuilt ? prev : (info._panel || info._rebuilt ? info : null);
      if (panelSide) {
        base.anchor = panelSide.anchor;
        base._panel = panelSide._panel;
        base._rebuilt = panelSide._rebuilt;
      }
      if (richer) {
        const idx = out.indexOf(prev);
        if (idx >= 0) out[idx] = base;
      }
      byName.set(key, base);
    }
    return out;
  }

  /* 字幕兜底：面板模板（ptgen 一类）常常只有 General / Video / Audio 三栏，字幕整栏没有；
   * 上传者贴的原文却还在页面上，只是没被单独认成候选（被上层容器吞掉 / 与面板挤在一起）。
   * 这里只在「这份信息字幕为空」时才跑：整页文本里必须出现同名文件、解析出来的文件名也得对得上，
   * 才把字幕（以及同样空着的音轨）补进来 —— 宁可留空，也不拿别的种子的字幕来凑。
   */
  function fillSubtitlesFromPage(info) {
    if (!info || info._bd) return info;
    if (info.subtitle && info.subtitle.length) return info;
    if (!info.fileName) return info;
    let page = '';
    try { page = readText(document.body); } catch (e) { return info; }
    if (!page || page.length < 200) return info;
    if (page.indexOf(info.fileName) < 0) return info;
    let p = null;
    try { p = parseInfo(page); } catch (e) { return info; }
    if (!p || !p.subtitle || !p.subtitle.length) return info;
    if (normFileName(p.fileName) !== normFileName(info.fileName)) return info;
    info.subtitle = p.subtitle;
    if (!info.audio.length && p.audio.length) info.audio = p.audio;
    info._pageSubs = p.subtitle.length;
    return info;
  }

  function scanAndRender(force) {
    let found = collectInfos();
    // 兜底 0：一个候选都没有，但整页（含 iframe / shadow）确实像 MediaInfo / BDInfo，就直接解析整页文本
    if (!found.length) {
      const fb = fallbackFromPage();
      if (fb) found = [fb];
    }
    // 兜底 0.5：整页都没有 MediaInfo 原文，但简介是渲染好的 HTML 面板（PTGen 一类）→ 反解
    // 面板是结构化数据，比「零散文本候选」可靠：候选里连 Video / General 段和 Format 都没有时，
    // 说明认到的其实是一块无关文字，这时用面板顶掉（否则卡片会渲染成一屏「—」）
    // 正常站点（候选里有真正的 Video / General 段）不跑这一步，省掉一次全页遍历
    const solidText = t => /(^|\n)\s*(?:Video|General)\s*$/im.test(t || '') && /Format\s*:/i.test(t || '');
    if (!found.length || !found.some(f => solidText(f.text))) {
      let panel = [];
      try { panel = htmlPanelInfos(); } catch (e) { panel = []; }
      if (panel.length) found = panel;
    }
    // 连整页兜底都没拿到东西（面板在 display:none 的容器里，正文一个字都读不到）：
    // 只要整页文本是「段头全挤在开头」的多栏面板，就按 DOM 重排后直接当候选
    if (!found.length && packedPanelText(document.body ? document.body.textContent || '' : '')) {
      let rb = '';
      try { rb = rebuildPackedPanel(document.body); } catch (e) { rb = ''; }
      if (rb) found = [{ el: document.body, text: rb, score: scoreMediaInfo(rb), len: rb.length, _rebuilt: true }];
    }
    /* 兜底 -1：候选（或整页兜底）拿到的文本是「几个段头全挤在开头」的多栏 HTML 面板，
     * Audiences 一类模板就是这样：General / Video / Audio / Subtitles 四个栏名排在表头行，
     * 内容按栏放在下一行。这种文本里段头与内容已经错位 —— 全部字段会落进同一段，
     * 卡片只会显示「视频 Video / 音频 Matroska @ 9808 Kbps / 其余全是 —」。
     * 按 DOM 把栏名与栏内容重新对上、重建正常的多段文本；只换文本、不动锚点，
     * 落位方式（表格行）与「收起原文」的行为都与原来一致。 */
    for (const f of found) {
      if (!packedPanelText(f.text)) continue;
      let fixed = '';
      try { fixed = rebuildPackedPanel(f.el); } catch (e) { fixed = ''; }
      if (!fixed && f.el !== document.body) {
        try { fixed = rebuildPackedPanel(document.body); } catch (e) { fixed = ''; }
      }
      if (!fixed) continue;
      f.text = fixed;
      f._rebuilt = true;
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

    // 同一份 MediaInfo 在页面上常有两种形态：渲染好的 HTML 面板（Audiences 的 ptgen 面板只有
    // General / Video / Audio 三栏，字幕整栏都没有）和原文代码块（.codemain 里是全的）。
    // 之前两者各成一份候选，卡片默认落在面板那份上，于是「字幕全 —」，要切到 2/2 才有字幕。
    // 现在按文件名把同源候选合成一份：媒体字段更全的当底，面板那份只负责锚点与缺项。
    const infosRaw = [];
    for (const f of found) {
      for (const part of splitMulti(f.text)) {
        let text = part;
        if (pageGen && !hasHead(text, 'General')) text = pageGen + '\n' + text;
        const info = parseInfo(text);
        info.anchor = f.el;
        if (f._panel) info._panel = true;   // 来源是 HTML 面板 → 收起时整组收
        if (f._rebuilt) info._rebuilt = true;   // 多栏面板 → 文本已按栏重排
        // 解析结果缺字段时用整页标签兜底：只补空项，不覆盖 MediaInfo 里的真值。
        // BDInfo（原盘）没有文件名/日期概念，不做这套兜底，免得把种子发布名塞进来。
        if (pageInfo && !info._bd) {
          if (!info.fileName && pageInfo.name) info.fileName = pageInfo.name.split(/[\\/]/).pop().trim();
          if (!info.size && pageInfo.size) info.size = pageInfo.size;
          if (!info.date && pageInfo.date) info.date = fmtDate(pageInfo.date);
          info._pageScan = pageInfo;
        }
        infosRaw.push(info);
        if (infosRaw.length >= CONFIG.maxInfo * 2) break;
      }
      if (infosRaw.length >= CONFIG.maxInfo * 2) break;
    }
    const merged = mergeSameFile(infosRaw);
    // 合并后还是没字幕（原文没被单独认成候选，比如被上层容器吞掉）：从整页文本里再捞一次，
    // 只认「同名」的那一段 MediaInfo —— 面板模板常常整栏没有字幕，而原文就躺在页面别处。
    for (const info of merged) fillSubtitlesFromPage(info);
    const infos = merged;

    // 空壳保护：解析下来一个媒体字段都没有，就别把卡片摆出来 —— 一屏「—」比不显示更糟
    if (!infos.some(i => i.video.length || i.audio.length || i.subtitle.length ||
        i.duration || i.resolution || i.size || i.discTitle || i.playlist || i.bitrate)) {
      if (!force && lastSig === '') return;
      lastSig = '';
      state.infos = [];
      render();
      return;
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
    GM_registerMenuCommand('切换「用卡片替换站点原文」', () => {
      state.replaceSource = !state.replaceSource;
      store.set('mi_replace', state.replaceSource ? '1' : '0');
      render();
    });
    GM_registerMenuCommand('复制诊断信息（字段为空时用）', () => {
      scanAndRender(true);
      copyText(buildDiagnostic());
      try { alert('诊断信息已复制到剪贴板。\n\n' + buildDiagnostic().slice(0, 600)); } catch (e) { /* ignore */ }
    });
    GM_registerMenuCommand('检查新版本（每 24 小时自动查一次）', () => {
      checkUpdate(true, () => {
        let msg;
        if (isUpdateReady()) msg = '发现新版本 v' + update.latest + '\n\n点卡片右上角版本号旁的红点即可更新。';
        else if (update.failed) msg = '查询失败：' + update.failed + '\n\n稍后再试，或用' + MENU_NAME + '里的「检查新版本」。';
        else msg = '已是最新版本 v' + VERSION + '（' + agoText(update.checkedAt) + '查过）';
        try { alert(msg); } catch (e) { /* ignore */ }
      });
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
    const q = (location.search || '').toLowerCase();
    if ((CONFIG.excludeQueries || []).some(x => x && q.indexOf(x) >= 0)) return true;
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
    setTimeout(() => scanAndRender(false), 6000); // 单页应用（M-Team 之类）首屏较慢时补一次
    setupObserver();
    setupHotkey();
    setupMenu();
    // 版本自检：先用上次的结果把红点亮出来，再按 24 小时节流去联网（别跟首屏抢资源）
    primeUpdate();
    setTimeout(() => checkUpdate(false), 2500);
  }

  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  }

  // 便于在 Node 里做解析单测（油猴环境无 module，此分支不会执行）
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { parseInfo, mergeSameFile, mediaFullness, normFileName, parseBDInfo, isBDInfo, scoreMediaInfo, infoToText, splitMulti, normalizeText, subtitleLangGroup, grabGeneralBlock, pageLabelScan, buildDiagnostic, fallbackParams, cmpVersion, pickVersion, isUpdateReady, CONFIG, VERSION, RELEASE_NOTES, SITES, matchSite, siteLabel, UPDATE_URL, UPDATE_INTERVAL };
  }
})();
