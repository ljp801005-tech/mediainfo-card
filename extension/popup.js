/* 工具栏弹窗：把脚本里 GM_registerMenuCommand 注册的那些菜单项列出来。
 * 内容脚本负责保存回调，这里只负责「列出 + 点一下」。 */
'use strict';

const $ = id => document.getElementById(id);

function showEmpty(title, detail) {
  const box = document.createElement('div');
  box.className = 'empty';
  const b = document.createElement('div');
  b.textContent = title;
  box.appendChild(b);
  if (detail) {
    const d = document.createElement('div');
    d.style.marginTop = '4px';
    d.style.opacity = '.8';
    d.textContent = detail;
    box.appendChild(d);
  }
  $('list').innerHTML = '';
  $('list').appendChild(box);
}

function renderButtons(labels, tabId) {
  $('list').innerHTML = '';
  labels.forEach((label, index) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.addEventListener('click', () => {
      chrome.tabs.sendMessage(tabId, { type: 'mi:menu-run', index }, resp => {
        const err = chrome.runtime.lastError;
        if (err || !resp || !resp.ok) {
          showEmpty('这条命令没执行成功', (resp && resp.error) || (err && err.message) || '刷新页面后再试');
          return;
        }
        window.close();   // 执行成功就收起弹窗，直接看页面效果
      });
    });
    $('list').appendChild(b);
  });
}

async function main() {
  try { $('ver').textContent = 'v' + chrome.runtime.getManifest().version; } catch (e) { /* ignore */ }

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs && tabs[0];
  if (!tab || !tab.id) { $('host').textContent = '读不到当前标签页'; showEmpty('读不到当前标签页'); return; }

  chrome.tabs.sendMessage(tab.id, { type: 'mi:menu' }, resp => {
    const err = chrome.runtime.lastError;   // 非 PT 站 / 页面刚打开还没注入，都会走到这里
    if (err || !resp || !resp.ok) {
      $('host').textContent = '当前页面没有运行卡片脚本';
      showEmpty('这个页面用不上', '卡片只在支持的 PT 站种子页生效');
      return;
    }
    $('host').textContent = resp.host || '';
    if (!resp.labels || !resp.labels.length) { showEmpty('页面还没准备好', '稍等一秒再点一次，或刷新页面'); return; }
    renderButtons(resp.labels, tab.id);
  });
}

main();
