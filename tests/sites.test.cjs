// 站点识别自检（纯 Node，不需要浏览器）：
//   ① 主机名 → 站点登记表，是不是都能命中、名字对不对；
//   ② 登记表 ↔ @match 是否一一对应（加了站点忘了补 @match，或反过来，都会在这里失败）；
//   ③ 发种 / 编辑页是否在排除清单里。
// 运行：node tests/sites.test.cjs
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'mediainfo-card.user.js');
const js = fs.readFileSync(SRC, 'utf8');

// 脚本里 siteLabel() 会读 location.hostname，这里给一个假的 location 再 require
function load(hostname) {
  global.location = { hostname, pathname: '/', search: '', href: 'https://' + hostname + '/' };
  delete require.cache[require.resolve(SRC)];
  return require(SRC);
}

const mod0 = load('hdwing.org');
const VERSION = mod0.VERSION;
const SITES = mod0.SITES;

let fail = 0;
const check = (name, ok) => {
  if (ok) console.log('PASS ' + name);
  else { fail++; console.log('FAIL ' + name); }
};

console.log('v' + VERSION + ' 站点识别自检');

// ① 每个登记站点：裸域要命中自己；非「只管本站」的站点，带 www 也要命中
for (const s of SITES) {
  const m = load(s.host);
  check(s.host + ' → ' + s.name, (m.matchSite(s.host) || {}).name === s.name);
  if (!s.exact) check('www.' + s.host + ' → ' + s.name, (m.matchSite('www.' + s.host) || {}).name === s.name);
}

// 特殊：子域站点不能被父域规则抢走，未登记站点必须返回 null
const m2 = load('kp.m-team.cc');
check('kp.m-team.cc → M-Team', (m2.matchSite('kp.m-team.cc') || {}).name.indexOf('M-Team') === 0);
check('未登记域名返回 null', m2.matchSite('unknown.example.com') === null);
check('空主机名返回 null', m2.matchSite('') === null);

// ② @match 与登记表一一对应
const matches = [...js.matchAll(/^\/\/ @match\s+(\S+)$/gm)].map(x => x[1]);
const hosts = matches.map(u => u.replace(/^\*:\/\/\*?\.?/, '').replace(/\/\*$/, ''));
for (const s of SITES) {
  const covered = hosts.indexOf(s.host) >= 0;
  check('@match 覆盖 ' + s.host, covered);
}
for (const h of hosts) {
  check('@match ' + h + ' 已在 SITES 登记', !!mod0.matchSite(h));
}
// 每条 @match 都要有对应的裸域 + *.域 两种写法（避免某些管理器对 *. 的处理差异）；
// 只允许「只管本站」的站点（如 u2.dmhy.org）只写裸域，免得把父域整站都匹配进来
for (const s of SITES) {
  if (s.exact) continue;
  const both = matches.indexOf('*://' + s.host + '/*') >= 0 && matches.indexOf('*://*.' + s.host + '/*') >= 0;
  if (!both) check('@match ' + s.host + ' 裸域与 *.域 都写了', false);
}
for (const s of SITES.filter(x => x.exact)) {
  const hasWild = matches.indexOf('*://*.' + s.host + '/*') >= 0;
  if (hasWild) check('@match ' + s.host + ' 不应写 *.域（会带进父域）', false);
}

// ③ 排除页
const C = mod0.CONFIG;
check('排除 /edit.php', C.excludePaths.indexOf('/edit.php') >= 0);
check('排除 /upload.php', C.excludePaths.indexOf('/upload.php') >= 0);
check('排除 /takeupload.php', C.excludePaths.indexOf('/takeupload.php') >= 0);
check('排除 action=edit', (C.excludeQueries || []).indexOf('action=edit') >= 0);

console.log(fail === 0 ? '\n全部通过（' + SITES.length + ' 个站点）' : '\n失败 ' + fail + ' 项');
process.exit(fail ? 1 : 0);
