/* MediaInfo 媒体信息卡片 · 后台 service worker
 *
 * 只做一件事：替内容脚本发一次 GET。扩展的 host_permissions 让这个请求不受页面
 * 的 CORS / CSP 限制，所以版本自检在再严格的站上也能跑。
 * 目前只放行查版本用的那个域名（见 manifest 的 host_permissions）。
 */
'use strict';

const TIMEOUT = 15000;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.type !== 'mi:fetch' || typeof msg.url !== 'string') return;

  let url;
  try { url = new URL(msg.url); } catch (e) {
    sendResponse({ ok: false, status: 0, error: '地址不合法' });
    return;
  }
  if (url.protocol !== 'https:') {
    sendResponse({ ok: false, status: 0, error: '只允许 https 请求' });
    return;
  }

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT);

  fetch(url.href, {
    method: msg.method === 'POST' ? 'POST' : 'GET',
    credentials: 'omit',
    cache: 'no-store',
    signal: ctl.signal
  })
    .then(r => r.text().then(text => ({ ok: r.ok, status: r.status, text })))
    .then(r => {
      clearTimeout(timer);
      // 只回必要字段：脚本只需要状态码和文本
      sendResponse({ ok: r.ok, status: r.status, text: r.ok ? r.text : '' });
    })
    .catch(err => {
      clearTimeout(timer);
      sendResponse({ ok: false, status: 0, error: (err && err.name === 'AbortError') ? '超时' : String(err && err.message || err) });
    });

  return true;   // 异步回包
});
