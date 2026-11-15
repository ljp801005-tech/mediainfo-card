// 版本自检的纯逻辑自检（纯 Node，不需要浏览器）：
//   ① cmpVersion：按段比数字，别退化成字符串比较（1.10.9 vs 1.10.10）；
//   ② pickVersion：只认元数据块里的 @version；
//   ③ 一致性：脚本里写的兜底版本号必须和 @version 一致，防止改了元数据忘了改代码。
// 运行：node tests/version.test.cjs
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'mediainfo-card.user.js');
const js = fs.readFileSync(SRC, 'utf8');

global.location = { hostname: 'hdwing.org', pathname: '/details.php', search: '?id=1', href: 'https://hdwing.org/details.php?id=1' };
const m = require(SRC);

let fail = 0;
const check = (name, ok, extra) => {
  if (ok) console.log('PASS ' + name);
  else { fail++; console.log('FAIL ' + name + (extra ? ' → ' + extra : '')); }
};

console.log('v' + m.VERSION + ' 版本自检逻辑');

// ① cmpVersion
const cmp = m.cmpVersion;
check('1.10.10 > 1.10.9', cmp('1.10.10', '1.10.9') === 1, String(cmp('1.10.10', '1.10.9')));
check('1.10.9 < 1.10.10（字符串比较会反过来）', cmp('1.10.9', '1.10.10') === -1, String(cmp('1.10.9', '1.10.10')));
check('1.9.99 < 1.10.0', cmp('1.9.99', '1.10.0') === -1);
check('2.0 == 2.0.0（段数不等按 0 补）', cmp('2.0', '2.0.0') === 0, String(cmp('2.0', '2.0.0')));
check('1.10.10 == 1.10.10', cmp('1.10.10', '1.10.10') === 0);
check('空版本号当 0（不会误判成新版）', cmp('', '1.0.0') === -1 && cmp('1.0.0', '') === 1);
check('1.11.0 > 1.10.10', cmp('1.11.0', '1.10.10') === 1);
check('2.0.0 > 1.99.99', cmp('2.0.0', '1.99.99') === 1);

// ② pickVersion
const HEAD = '// ==UserScript==\n// @name  x\n// @version      1.10.11\n// ==/UserScript==\nvar a = 1;\n';
check('从元数据里取版本', m.pickVersion(HEAD) === '1.10.11', m.pickVersion(HEAD));
check('没有 @version 返回空串', m.pickVersion('var a = 1;') === '');
check('正文里提到的数字不算版本', m.pickVersion('// 之前是 1.10.10\nvar ver = "1.2.3";') === '');
check('取到的是本文件里的真版本', m.pickVersion(js) === m.VERSION, m.pickVersion(js) + ' vs ' + m.VERSION);

// ③ 常量与一致性
check('检查间隔是 24 小时', m.UPDATE_INTERVAL === 24 * 60 * 60 * 1000, String(m.UPDATE_INTERVAL));
check('检查地址指向本仓库 raw 脚本', /raw\.githubusercontent\.com\/.+\/mediainfo-card\.user\.js$/.test(m.UPDATE_URL), m.UPDATE_URL);
check('代码里的兜底版本号与 @version 一致', js.indexOf(": '" + m.VERSION + "';") > 0 || js.indexOf(": '" + m.VERSION + "'") > 0, m.VERSION);
check('元数据声明了版本自检要用的权限', /@grant\s+GM_xmlhttpRequest/.test(js) && /@connect\s+raw\.githubusercontent\.com/.test(js));

console.log(fail ? '\n失败 ' + fail + ' 项' : '\n全部通过');
process.exit(fail ? 1 : 0);
