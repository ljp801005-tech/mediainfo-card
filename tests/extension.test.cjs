#!/usr/bin/env node
/* Chrome 扩展包自检：跑一次 scripts/build-ext.mjs，再逐项核对生成物。
 *
 * 重点盯的是「两边不会走偏」：
 *   · manifest 的版本 / 站点清单必须等于脚本的 @version / @match / @exclude（不许手写第二份）
 *   · 内容脚本必须是脚本本体的逐字节副本
 *   · MV3 的两条硬规矩：不能有内联脚本、service worker 必须存在 */
'use strict';

const { execFileSync } = require('child_process');
const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

const root = join(__dirname, '..');
const outDir = join(root, 'dist', 'extension');
const src = readFileSync(join(root, 'mediainfo-card.user.js'), 'utf8');
const meta = src.match(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/)[0];

let pass = 0, fail = 0;
const ok = (cond, label, extra) => {
  if (cond) { pass++; console.log('  ✓ ' + label); }
  else { fail++; console.log('  ✗ ' + label + (extra !== undefined ? '  → ' + extra : '')); }
};
const read = (...p) => readFileSync(join(outDir, ...p), 'utf8');
const exists = (...p) => existsSync(join(outDir, ...p));

console.log('构建');
let buildOut = '';
try {
  buildOut = execFileSync(process.execPath, [join(root, 'scripts', 'build-ext.mjs')], { encoding: 'utf8' });
  ok(/已生成/.test(buildOut), 'build-ext.mjs 正常结束');
} catch (e) {
  ok(false, 'build-ext.mjs 失败', (e.stdout || '') + (e.stderr || ''));
}

const VERSION = (meta.match(/@version\s+(\S+)/) || [])[1];
const NAME = (meta.match(/@name\s+(.+)/) || [])[1].trim();
const MATCH = [...meta.matchAll(/^\/\/ @match\s+(\S+)$/gm)].map(m => m[1]);
const EXCL = [...meta.matchAll(/^\/\/ @exclude\s+(\S+)$/gm)].map(m => m[1]);

console.log('manifest');
const mfPath = join(outDir, 'manifest.json');
ok(existsSync(mfPath), 'manifest.json 已生成');
let mf = {};
try { mf = JSON.parse(readFileSync(mfPath, 'utf8')); } catch (e) { ok(false, 'manifest.json 能解析', e.message); }

ok(mf.manifest_version === 3, 'manifest_version = 3');
ok(mf.version === VERSION, '扩展版本 == 脚本 @version', mf.version + ' vs ' + VERSION);
ok(mf.name === NAME, '扩展名 == 脚本 @name', mf.name);
ok(typeof mf.description === 'string' && mf.description.length > 0 && mf.description.length <= 132, '描述非空且不超过 Chrome 的 132 字符上限', mf.description && mf.description.length);
ok(!/mediainfo-card\.user\.js/.test(mf.description || ''), '描述里没有塞脚本地址');

const cs = (mf.content_scripts || [])[0] || {};
ok(JSON.stringify(cs.matches) === JSON.stringify(MATCH), 'content_scripts.matches == 脚本 @match（' + MATCH.length + ' 条）', (cs.matches || []).length);
ok(JSON.stringify(cs.exclude_matches) === JSON.stringify(EXCL), 'exclude_matches == 脚本 @exclude（' + EXCL.length + ' 条）', (cs.exclude_matches || []).length);
ok(cs.run_at === 'document_idle', 'run_at = document_idle（与油猴 @run-at 一致）');
ok(cs.all_frames === false, 'all_frames = false（对应 @noframes）');
ok(JSON.stringify(cs.js) === JSON.stringify(['gm-shim.js', 'content/mediainfo-card.js']), '兼容层排在脚本之前', JSON.stringify(cs.js));
ok(JSON.stringify(cs.css) === JSON.stringify(['card.css']), '样式由 manifest 注入（绕开站点 CSP）', JSON.stringify(cs.css));

const icons = mf.icons || {};
ok(['16', '32', '48', '128'].every(k => icons[k]), '四档图标都登记了', JSON.stringify(icons));
ok(mf.action && mf.action.default_popup === 'popup.html', '工具栏有弹窗', mf.action && mf.action.default_popup);
ok(mf.background && mf.background.service_worker === 'background.js', '有后台 service worker');

const hosts = mf.host_permissions || [];
ok(hosts.length === 1 && hosts[0] === 'https://raw.githubusercontent.com/*', 'host_permissions 只放了查版本的那一个域名', JSON.stringify(hosts));
const perms = mf.permissions || [];
ok(perms.length === 1 && perms[0] === 'clipboardWrite',
  'API 权限只给了 clipboardWrite（「复制」回落到 execCommand 时要用，别的不要）', JSON.stringify(perms));

console.log('文件内容');
ok(exists('content', 'mediainfo-card.js'), '内容脚本已生成');
ok(read('content', 'mediainfo-card.js') === src, '内容脚本与 mediainfo-card.user.js 逐字节一致');
ok(exists('card.css'), 'card.css 已生成');
const css = read('card.css');
ok(!css.includes('${'), 'card.css 里没有未求值的 ${...}');
ok(css.includes('.mi-root'), 'card.css 含卡片根选择器');
ok(/\.mi-raw[\s\S]{0,900}?white-space: pre-wrap/.test(css), '原文块兜底换行（不支持 contain 时也不会把表格顶宽）');
ok(/@supports \(contain: inline-size\)[\s\S]{0,300}?contain: inline-size/.test(css), '原文块在支持的浏览器上保留列对齐 + 框内横滚');
ok(/\.mi-inline \.mi-raw\s*\{[^}]*max-height/.test(css), '内嵌时原文框放高，能一次多看几行');
ok(!/^[ \t]*(html|body|:root)\b/m.test(css), 'card.css 的选择器都收在 .mi-* 里（不碰站点排版）');
ok(css.length > 5000, 'card.css 长度正常（' + css.length + ' 字节）');

const shim = read('gm-shim.js');
ok(/window\.GM_info\s*=/.test(shim), '兼容层提供 GM_info（版本号的来源）');
ok(/window\.GM_xmlhttpRequest\s*=/.test(shim), '兼容层提供 GM_xmlhttpRequest');
ok(/window\.GM_registerMenuCommand\s*=/.test(shim), '兼容层提供 GM_registerMenuCommand');
ok(/window\.GM_addStyle\s*=/.test(shim), '兼容层把 GM_addStyle 做成空函数（样式走 manifest）');
ok(/__MI_EXT__\s*=/.test(shim) && /installUrl/.test(shim), '兼容层告知脚本「这是扩展」并给出更新入口');
ok(!/GM_getValue\s*=/.test(shim), '不覆盖 GM_getValue（让脚本走自己的 localStorage 兜底）');
ok(!/GM_setValue\s*=/.test(shim), '不覆盖 GM_setValue');
ok(/getManifest/.test(shim), '版本号取自 manifest，不另存一份');

const bg = read('background.js');
ok(/sendResponse/.test(bg) && /return true/.test(bg), '后台异步回包（return true）');
ok(/https:/.test(bg) && /protocol !== 'https:'/.test(bg), '后台只放行 https');

const popupHtml = read('popup.html');
ok(!/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/.test(popupHtml), '弹窗没有内联 <script>（MV3 CSP 会拦）');
ok(/<script src="popup\.js"><\/script>/.test(popupHtml), '弹窗引用了 popup.js');
ok(exists('popup.js'), 'popup.js 已生成');
ok(!/onclick=/i.test(popupHtml), '弹窗没有内联事件（CSP 会拦）');

console.log('图标');
for (const s of [16, 32, 48, 128]) {
  const p = join(outDir, 'icons', `icon${s}.png`);
  let good = false, w = 0, h = 0;
  if (existsSync(p)) {
    const b = readFileSync(p);
    good = b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    w = b.readUInt32BE(16); h = b.readUInt32BE(20);
  }
  ok(good && w === s && h === s, `icon${s}.png 是 ${s}×${s} 的 PNG`, w + '×' + h);
}

console.log('脚本侧保持原样');
ok(/const INSTALL_URL = \(EXT && EXT\.installUrl\) \|\| UPDATE_URL;/.test(src), '油猴里 INSTALL_URL 仍等于 UPDATE_URL（行为不变）');
ok(/const VERSION = \(typeof GM_info/.test(src), '版本号仍只从 GM_info/@version 取');
ok(/@updateURL\s+https:\/\/raw\.githubusercontent\.com/.test(meta), '元数据 @updateURL 未动');

console.log('\n' + (fail ? `失败 ${fail} 条` : `全部通过（${pass} 条）`));
if (buildOut) console.log(buildOut.trim().split('\n').map(l => '  · ' + l.trim()).join('\n'));
process.exit(fail ? 1 : 0);
