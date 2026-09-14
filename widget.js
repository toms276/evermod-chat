/* EVERMOD Chat Widget — embed on any website (WordPress etc.)
   Usage: <script src="https://toms276.github.io/evermod-chat/widget.js" defer></script>
   API:   EvermodChat.open()  ·  EvermodChat.close()  ·  EvermodChat.ask('text')  */
(function () {
  'use strict';
  if (window.EvermodChat) return;

  var STORE = 'https://superagent-5681298a.base44.app/functions/evermodChatStore';
  var GREETING = 'Hi! I am Orion from EVERMOD \u{1F3E0} \u2014 your AI assistant.\n\nWe have been building modular homes for 23 years with 2000+ projects delivered. Ask me anything about our houses, or tell me what you are looking for!';
  var MARKER = /\[Website chat id=[A-Za-z0-9]{20,32}\]/g;

  var sessionId = null;
  try {
    sessionId = localStorage.getItem('evm-session');
    if (!sessionId) { sessionId = 'web-' + Math.random().toString(36).slice(2, 10); localStorage.setItem('evm-session', sessionId); }
  } catch (e) { sessionId = 'web-' + Date.now(); }

  /* ---------- styles ---------- */
  var css = document.createElement('style');
  css.textContent = [
    '#evm-btn{position:fixed;right:24px;bottom:24px;z-index:2147483000;width:60px;height:60px;border-radius:50%;background:#1a1a1a;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.25);transition:transform .2s ease}#evm-btn:hover{transform:translateY(-2px)}',
    '#evm-btn svg{width:26px;height:26px;fill:#fff}',
    '#evm-panel{position:fixed;right:24px;bottom:96px;z-index:2147483000;width:370px;max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 128px);background:#fff;border-radius:14px;box-shadow:0 16px 48px rgba(0,0,0,.28);display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,Segoe UI,Roboto,sans-serif}',
    '#evm-panel.evm-open{display:flex}',
    '#evm-head{background:#1a1a1a;color:#fff;padding:13px 15px;display:flex;align-items:center;gap:10px}',
    '#evm-head .t{font-size:15px;font-weight:700;letter-spacing:.02em}',
    '#evm-head .s{font-size:11px;font-weight:300;opacity:.8;margin-top:2px}',
    '#evm-head .dot{width:8px;height:8px;border-radius:50%;background:#4caf50;flex:none}',
    '#evm-head .wa{margin-left:auto;width:30px;height:30px;border-radius:50%;background:#25d366;display:flex;align-items:center;justify-content:center;flex:none}',
    '#evm-head .wa svg{width:16px;height:16px;fill:#fff}',
    '#evm-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#fafafa}',
    '.evm-msg{max-width:82%;padding:10px 13px;border-radius:12px;font-size:14px;line-height:1.45;white-space:pre-wrap;overflow-wrap:break-word}',
    '.evm-msg.ai{background:#fff;border:1px solid #e4e4e4;color:#1a1a1a;border-bottom-left-radius:4px;align-self:flex-start}',
    '.evm-msg.user{background:#1a1a1a;color:#fff;border-bottom-right-radius:4px;align-self:flex-end}',
    '.evm-typing{align-self:flex-start;background:#fff;border:1px solid #e4e4e4;border-radius:12px;padding:12px 14px;display:flex;gap:4px}',
    '.evm-typing span{width:6px;height:6px;border-radius:50%;background:#999;animation:evm-blink 1s infinite}',
    '.evm-typing span:nth-child(2){animation-delay:.2s}.evm-typing span:nth-child(3){animation-delay:.4s}',
    '#evm-inrow{display:flex;border-top:1px solid #e4e4e4;background:#fff}',
    '#evm-inrow input{flex:1;border:none;outline:none;padding:13px 14px;font-size:14px;background:transparent;font-family:inherit}',
    '#evm-inrow button{background:none;border:none;cursor:pointer;padding:0 14px;display:flex;align-items:center}',
    '#evm-inrow button:disabled{opacity:.4;cursor:default}',
    '#evm-inrow button svg{width:20px;height:20px;fill:#1a1a1a}',
    '#evm-foot{font-size:10px;font-weight:300;text-align:center;color:#aaa;padding:6px;background:#fff}',
    '@keyframes evm-blink{0%,100%{opacity:.2}50%{opacity:1}}',
    '@media (max-width:480px){#evm-panel{right:8px;left:8px;width:auto;bottom:88px}}'
  ].join('');
  document.head.appendChild(css);

  /* ---------- markup ---------- */
  var btn = document.createElement('button');
  btn.id = 'evm-btn';
  btn.setAttribute('aria-label', 'Chat with us');
  btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/></svg>';

  var panel = document.createElement('div');
  panel.id = 'evm-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'EVERMOD chat');
  panel.innerHTML =
    '<div id="evm-head"><span class="dot"></span><div><div class="t">EVERMOD</div><div class="s">Orion \u00b7 online</div></div>' +
    '<a class="wa" href="https://wa.me/37127034348" target="_blank" rel="noopener" aria-label="WhatsApp"><svg viewBox="0 0 32 32"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.2 1.7 6L4 29l8.2-1.7c1.7.9 3.7 1.4 5.8 1.4 6.6 0 12-5.4 12-12S22.6 3 16 3z"/></svg></a></div>' +
    '<div id="evm-msgs"></div>' +
    '<div id="evm-inrow"><input id="evm-input" type="text" placeholder="Write your question...">' +
    '<button id="evm-send" aria-label="Send"><svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg></button></div>' +
    '<div id="evm-foot">EVERMOD \u00b7 MODULAR HOMES \u00b7 23 YEARS \u00b7 2000+ PROJECTS</div>';

  function mount() { document.body.appendChild(btn); document.body.appendChild(panel); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();

  var box, input, sendBtn, busy = false, greeted = false;
  function refs() { box = panel.querySelector('#evm-msgs'); input = panel.querySelector('#evm-input'); sendBtn = panel.querySelector('#evm-send'); }
  refs();

  function el(tag, cls, text) { var d = document.createElement(tag); if (cls) d.className = cls; if (text !== undefined) d.textContent = text; return d; }
  function scroll() { box.scrollTop = box.scrollHeight; }
  function addMsg(text, who) { box.appendChild(el('div', 'evm-msg ' + who, text)); scroll(); }
  function addTyping() { var t = el('div', 'evm-typing'); t.innerHTML = '<span></span><span></span><span></span>'; box.appendChild(t); scroll(); return t; }

  function greet() {
    if (greeted) return; greeted = true;
    addMsg(GREETING, 'ai');
  }

  function open() { refs(); panel.classList.add('evm-open'); btn.style.display = 'none'; greet(); setTimeout(function () { input.focus(); }, 50); }
  function close() { panel.classList.remove('evm-open'); btn.style.display = 'flex'; }
  function toggle() { panel.classList.contains('evm-open') ? close() : open(); }
  btn.addEventListener('click', toggle);

  function poll(t) {
    fetch(STORE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'poll', sessionId: sessionId }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.status === 'answered' && d.reply) { t.remove(); addMsg(String(d.reply).replace(MARKER, '').trim(), 'ai'); busy = false; sendBtn.disabled = false; }
        else setTimeout(function () { poll(t); }, 4000);
      })
      .catch(function () { setTimeout(function () { poll(t); }, 8000); });
  }

  function send(text) {
    if (busy || !text) return;
    busy = true; sendBtn.disabled = true;
    refs();
    addMsg(text, 'user');
    var t = addTyping();
    fetch(STORE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'enqueue', sessionId: sessionId, question: text }) })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.ok) poll(t); else { t.remove(); addMsg('Sorry, the assistant is unavailable right now. Please try again in a moment.', 'ai'); busy = false; sendBtn.disabled = false; } })
      .catch(function () { t.remove(); addMsg('Connection problem. Please try again in a moment.', 'ai'); busy = false; sendBtn.disabled = false; });
  }

  sendBtn.addEventListener('click', function () { var v = input.value.trim(); input.value = ''; send(v); });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var v = input.value.trim(); input.value = ''; send(v); } });

  /* auto-open support for landing pages: ?evm_open=1 or #chat */
  try {
    var u = new URL(location.href);
    if (u.searchParams.get('evm_open') === '1' || u.hash === '#chat') setTimeout(open, 400);
  } catch (e) {}

  window.EvermodChat = { open: open, close: close, toggle: toggle, ask: function (text) { open(); send(text); } };
})();
