#!/usr/bin/env node
// 把用户脚本打包成「可直接加载的 Chrome 扩展」（Manifest V3）。
//
// 做法：不去维护第二份逻辑，全部从 mediainfo-card.user.js 现取现用——
//   · 版本号、名字、描述、@match / @exclude  → 生成 manifest.json
//   · 脚本里的 CSS 常量                      → 抽成 card.css（由 manifest 注入，绕开站点 CSP）
//   · 脚本本体                              → content/mediainfo-card.js（一字不改）
// 再拼上 extension/ 里的兼容层（gm-shim）、后台 SW、工具栏弹窗与图标。
//
// 用法：node scripts/build-ext.mjs   →  dist/extension/ 、 dist/mediainfo-card-extension.zip

import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'mediainfo-card.user.js');
const srcDir = join(root, 'extension');
const outDir = join(root, 'dist', 'extension');
const zipPath = join(root, 'dist', 'mediainfo-card-extension.zip');

const code = readFileSync(src, 'utf8');
const meta = code.match(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/);
if (!meta) { console.error('找不到 ==UserScript== 元数据块'); process.exit(1); }

const pick = (key) => (meta[0].match(new RegExp('^// @' + key + '\\s+(.+)$', 'm')) || [])[1];
const version = (pick('version') || '').trim();
const name = (pick('name') || 'MediaInfo 媒体信息卡片').trim();
const desc = (pick('description') || '').trim();

// @match / @exclude 原样搬进 manifest，站点清单永远只有脚本元数据一个来源
const allOf = (key) => [...meta[0].matchAll(new RegExp('^// @' + key + '\\s+(\\S+)$', 'gm'))].map((m) => m[1]);
const matches = allOf('match');
const excludes = allOf('exclude');
if (!matches.length) { console.error('脚本里没有 @match，生成扩展无意义'); process.exit(1); }

// Chrome 的 manifest 版本号只允许 1~4 段数字，且每段 < 65536
if (!/^\d+(\.\d+){0,3}$/.test(version)) {
  console.error('@version 不能直接当扩展版本号（需要 1~4 段数字）：' + version);
  process.exit(1);
}

// Chrome 对 description 有 132 字符的硬上限，脚本那条（带站点清单）比它长得多，直接截会断在半句上，
// 所以扩展用一条专写的短描述：讲清「干什么的」，站点清单交给 about 面板与文档。
const EXT_DESC = '自动识别 PT 站种子页上的 MediaInfo / BDInfo 贴文，整理成结构化媒体信息卡片：文件名、体积、时长、分辨率、视频、音频、字幕。可悬浮拖动或内嵌页面，深浅色自适应。';
if (EXT_DESC.length > 132) {
  console.error('扩展描述超过 Chrome 的 132 字符上限：' + EXT_DESC.length);
  process.exit(1);
}

/* ---------- 抽 CSS：脚本里是模板字符串，可能带 ${CONFIG.x} 插值，用真实 CONFIG 求值 ---------- */
const CSS_START = '  const CSS = `';
const i = code.indexOf(CSS_START);
if (i < 0) { console.error('找不到 `const CSS = ` 常量（模板变了？）'); process.exit(1); }
const j = code.indexOf('`;', i + CSS_START.length);
if (j < 0) { console.error('CSS 常量的结束反引号没找到'); process.exit(1); }
const rawCss = code.slice(i + CSS_START.length, j);

const require = createRequire(import.meta.url);
const { CONFIG } = require(src);
let css;
try {
  css = new Function('CONFIG', 'return `' + rawCss + '`;')(CONFIG);
} catch (e) {
  console.error('CSS 求值失败（模板里引用了 CONFIG 没有的字段？）：' + e.message);
  process.exit(1);
}
if (/\$\{/.test(css)) { console.error('CSS 里还剩未处理的 ${...} 插值'); process.exit(1); }

/* ---------- 组装 ---------- */
rmSync(outDir, { recursive: true, force: true });
// 早期版本把扩展输出到 dist/mediainfo-card-extension/，后来改成 dist/extension/。
// 老目录留在磁盘上会让人「加载了旧目录、版本号却对不上脚本」，每次构建一并清掉。
rmSync(join(root, 'dist', 'mediainfo-card-extension'), { recursive: true, force: true });
mkdirSync(join(outDir, 'content'), { recursive: true });
mkdirSync(join(outDir, 'icons'), { recursive: true });

const manifest = {
  manifest_version: 3,
  name,
  version,
  description: EXT_DESC,
  homepage_url: 'https://github.com/ljp801005-tech/mediainfo-card',
  minimum_chrome_version: '102',
  icons: {
    16: 'icons/icon16.png',
    32: 'icons/icon32.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png'
  },
  action: {
    default_title: 'MediaInfo 卡片',
    default_popup: 'popup.html',
    default_icon: { 16: 'icons/icon16.png', 32: 'icons/icon32.png' }
  },
  background: { service_worker: 'background.js' },
  // 只为版本自检读一次 raw 上的脚本头；后台 SW 发请求，不受 CORS / 页面 CSP 限制
  host_permissions: ['https://raw.githubusercontent.com/*'],
  // 「复制整理文本 / 诊断信息」：内容脚本回落到 execCommand('copy') 时，
  // 有这条权限才不会被浏览器的用户手势检查挡下（navigator.clipboard 那条路本来就行）
  permissions: ['clipboardWrite'],
  content_scripts: [
    {
      matches,
      exclude_matches: excludes,
      // 顺序有意义：兼容层要先于脚本执行
      js: ['gm-shim.js', 'content/mediainfo-card.js'],
      css: ['card.css'],
      run_at: 'document_idle',
      all_frames: false
    }
  ]
};
writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');

writeFileSync(join(outDir, 'card.css'), '/* 由 scripts/build-ext.mjs 从 mediainfo-card.user.js 自动抽取，勿手改 */\n' + css, 'utf8');
copyFileSync(src, join(outDir, 'content', 'mediainfo-card.js'));

for (const f of ['gm-shim.js', 'background.js', 'popup.html', 'popup.js']) {
  const p = join(srcDir, f);
  if (!existsSync(p)) { console.error('缺少扩展源文件：extension/' + f); process.exit(1); }
  copyFileSync(p, join(outDir, f));
}
for (const s of [16, 32, 48, 128]) {
  const p = join(srcDir, 'icons', `icon${s}.png`);
  if (!existsSync(p)) { console.error('缺少图标：extension/icons/icon' + s + '.png'); process.exit(1); }
  copyFileSync(p, join(outDir, 'icons', `icon${s}.png`));
}

// 装了扩展的人第一眼看到的是这个目录，附一份最短的安装说明（文件名用 ASCII，免得跨平台解压乱码）
writeFileSync(join(outDir, 'INSTALL.txt'),
  [
    'MediaInfo 媒体信息卡片 · Chrome 扩展 v' + version,
    '',
    '安装（二选一）：',
    '1. 解压本包到固定位置（别删），打开 chrome://extensions/',
    '   → 右上角打开「开发者模式」→ 点「加载已解压的扩展程序」→ 选择这个文件夹。',
    '2. 或者把本包解压后拖进 chrome://extensions/ 页面。',
    '',
    '装完打开支持的 PT 站种子页即可，卡片会自动出现；',
    '点浏览器工具栏上的图标可以看到「显示/隐藏、切模式、重新扫描、检查更新」等菜单。',
    '快捷键 Alt + M 显示/隐藏。',
    '',
    '更新：下载新版 zip 解压覆盖原文件夹，回到 chrome://extensions/ 点一次「重新加载」；',
    '卡片发现新版时会在版本号旁亮红点，点红点会打开 Releases 页面。',
    '',
    '说明：本扩展不收集任何数据，只在你打开受支持的 PT 站时运行。',
    '唯一的外部请求是每 24 小时读一次仓库脚本头里的版本号（raw.githubusercontent.com）。',
    ''
  ].join('\n'), 'utf8');

/* ---------- 打包 ---------- */
let zipNote = '';
try {
  rmSync(zipPath, { force: true });
  execFileSync('zip', ['-r', '-X', '-q', zipPath, '.'], { cwd: outDir });
  zipNote = `${(statSync(zipPath).size / 1024).toFixed(1)} KB`;
} catch (e) {
  zipNote = '未打包（本机没有 zip 命令，dist/extension 目录本身可直接加载）';
}

const bytes = (p) => readFileSync(p).length;
console.log('已生成 dist/extension/');
console.log(`  版本 ${version}　站点 ${matches.length} 条 match / ${excludes.length} 条 exclude`);
console.log(`  描述 ${EXT_DESC.length} 字符（上限 132）`);
console.log(`  card.css ${bytes(join(outDir, 'card.css'))} 字节　内容脚本 ${bytes(join(outDir, 'content', 'mediainfo-card.js'))} 字节`);
console.log(`  zip ${zipNote}`);
