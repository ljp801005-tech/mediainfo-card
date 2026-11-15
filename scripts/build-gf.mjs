#!/usr/bin/env node
// 生成「Greasy Fork 版」脚本：把 GitHub 的 @updateURL / @downloadURL 去掉。
//
// 原因：Greasy Fork 在发布时会写入它自己的 @updateURL / @downloadURL。如果文件里
// 已经带着 GitHub 的那两行，最终元数据里会出现重复键，哪一行生效取决于解析器实现，
// 容易出现「装了 GF 版却去 GitHub 拉更新（或反之）」的怪状态。
// GF 版只保留 @homepageURL / @supportURL，更新源交给 GF 自己管。
// 顺带把代码里版本自检用的 UPDATE_URL 换成 GF 自己那份脚本地址：装了 GF 版的人，
// 红点提示的应当是 GF 上的新版，点进去也应当落在 GF 渠道，不能两条渠道互相顶。
//
// 用法：node scripts/build-gf.mjs   →  dist/mediainfo-card.gf.user.js

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'mediainfo-card.user.js');
const outDir = join(root, 'dist');
const out = join(outDir, 'mediainfo-card.gf.user.js');

const code = readFileSync(src, 'utf8');
const meta = code.match(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/);
if (!meta) {
  console.error('找不到 ==UserScript== 元数据块');
  process.exit(1);
}

const stripped = meta[0]
  .split('\n')
  .filter((line) => !/^\/\/ @(updateURL|downloadURL)\b/.test(line))
  .join('\n');

const body0 = code.replace(meta[0], stripped);
const version = (code.match(/\/\/ @version\s+(\S+)/) || [])[1] || '?';

// 版本自检的地址也要跟着换：GitHub 版读仓库 raw 文件，GF 版读 Greasy Fork 自己那份。
// 否则装了 GF 版的用户，红点提示的是 GitHub 上的版本，点进去又把脚本换成 GitHub 渠道的，
// 两条渠道互相顶。
const GF_ID = '605024';
const GF_FILE = `https://update.greasyfork.org/scripts/${GF_ID}/mediainfo-card.user.js`;
const body = body0.replace(/const UPDATE_URL = '[^']+';/, `const UPDATE_URL = '${GF_FILE}';`);
if (body === body0) {
  console.error('没能改写 UPDATE_URL（模板变了？请检查 mediainfo-card.user.js 里的 const UPDATE_URL）');
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(out, body, 'utf8');

console.log(`已生成 ${out}`);
console.log(`版本 ${version}，${Buffer.byteLength(body, 'utf8')} 字节（已移除 @updateURL / @downloadURL，自检地址指向 Greasy Fork 脚本 ${GF_ID}）`);
