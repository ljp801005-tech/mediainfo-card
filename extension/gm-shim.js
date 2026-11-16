/* MediaInfo 媒体信息卡片 · Chrome 扩展兼容层
 *
 * 这个文件在 mediainfo-card.user.js 之前加载（同一个 content script 世界），
 * 只负责把用户脚本用到的几个油猴接口补上，逻辑本身一个字都不改：
 *
 *   GM_info               → 从 manifest 取版本号（脚本以它为唯一版本来源）
 *   GM_addStyle           → 样式已经由 manifest 的 css 注入（这样能绕开站点 CSP），这里做成空函数
 *   GM_xmlhttpRequest     → 转给后台 service worker 去发（不受页面 CSP / 跨域限制）
 *   GM_registerMenuCommand→ 收集起来，交给工具栏弹窗显示
 *   window.__MI_EXT__     → 告诉脚本「我在扩展里」：红点改指向 Releases、提示文案换成「工具栏图标」
 *
 * GM_getValue / GM_setValue 故意不实现：脚本自带 localStorage 兜底，设置存在站点本地即可。
 */
(function () {
  'use strict';

  const api = typeof chrome !== 'undefined' ? chrome : null;
  if (!api || !api.runtime || !api.runtime.id) return;   // 不在扩展环境里，直接退出

  const manifest = (api.runtime.getManifest && api.runtime.getManifest()) || {};
  const VERSION = manifest.version || '0.0.0';
  const RELEASES = 'https://github.com/ljp801005-tech/mediainfo-card/releases/latest';

  // 脚本读 GM_info.script.version 当版本号，读 __MI_EXT__ 决定红点点到哪、文案怎么写
  window.GM_info = {
    script: { name: manifest.name || 'MediaInfo 媒体信息卡片', version: VERSION, namespace: 'workbuddy/mediainfo-card' },
    scriptHandler: 'Chrome Extension'
  };
  window.__MI_EXT__ = {
    version: VERSION,
    installUrl: RELEASES,
    menuLabel: '工具栏图标'
  };

  // 样式：build-ext.mjs 会把脚本里的 CSS 抽成 card.css，由 manifest 注入（manifest 注入不受页面 CSP 限制）
  window.GM_addStyle = function () { /* no-op：样式已由 card.css 提供 */ };

  /* ---------- GM_xmlhttpRequest：转交后台，避免页面 CSP / 跨域干扰 ---------- */
  let seq = 0;
  window.GM_xmlhttpRequest = function (opt) {
    const o = opt || {};
    const id = ++seq;
    let done = false;
    const finish = (fn, arg) => {
      if (done) return;
      done = true;
      try { if (typeof fn === 'function') fn(arg); } catch (e) { /* 调用方自己的错，不往外抛 */ }
    };
    const timer = setTimeout(() => finish(o.ontimeout, { status: 0, responseText: '' }), o.timeout || 15000);

    try {
      api.runtime.sendMessage({ type: 'mi:fetch', id, url: o.url, method: o.method || 'GET' }, resp => {
        clearTimeout(timer);
        const err = api.runtime.lastError;
        if (err) { finish(o.onerror, { status: 0, error: err.message }); return; }
        if (!resp) { finish(o.onerror, { status: 0, error: '后台没有响应' }); return; }
        if (resp.ok) finish(o.onload, { status: resp.status, responseText: resp.text || '' });
        else finish(o.onerror, { status: resp.status || 0, error: resp.error || '请求失败' });
      });
    } catch (e) {
      clearTimeout(timer);
      finish(o.onerror, { status: 0, error: String(e && e.message || e) });
    }
    return { abort() { done = true; } };
  };

  /* ---------- GM_registerMenuCommand：攒起来给弹窗用 ---------- */
  const commands = [];
  window.GM_registerMenuCommand = function (label, fn) {
    if (typeof label !== 'string' || typeof fn !== 'function') return;
    // 同一页可能重复注入（单页应用切换），按文案去重，别让弹窗里出现两遍
    if (commands.some(c => c.label === label)) return;
    commands.push({ label, fn });
  };
  window.__MI_MENU__ = commands;

  api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'mi:menu') {
      sendResponse({ ok: true, host: location.hostname, labels: commands.map(c => c.label) });
      return;
    }
    if (msg.type === 'mi:menu-run') {
      const c = commands[msg.index];
      if (!c) { sendResponse({ ok: false, error: '这条菜单已经不在了，刷新页面再试' }); return; }
      try {
        c.fn();
        sendResponse({ ok: true, label: c.label });
      } catch (e) {
        sendResponse({ ok: false, error: String(e && e.message || e) });
      }
    }
  });
})();
