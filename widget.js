/* EVERMOD Chat Widget v3 — embedded section (no open/close buttons, scrolls with the page, ChatGPT-like).
   The widget renders INSIDE a container div with id="evermod-chat" if present (falls back to <body>).
   Config comes from WordPress via wp_localize_script (EVERMOD_CHAT_CONFIG):
     meetingLink   — Book a Video Call opens this link in a new tab (fallback: asks Orion)
     callbackPhone — optional direct-dial number shown in the window
     callbackText  — predefined WhatsApp message for "Request a Call Back"
   API: EvermodChat.ask('text') · EvermodChat.greet() · EvermodChat.focus() · EvermodChat.scrollTo() */
(function () {
  'use strict';
  if (window.EvermodChat) return;

  var CFG = window.EVERMOD_CHAT_CONFIG || {};
  var MEETING_LINK = CFG.meetingLink || 'https://meetings-eu1.hubspot.com/normunds-broks/schedule-google-meets-call-with-normunds-evermod';
  var CALLBACK_PHONE = CFG.callbackPhone || '';
  var CALLBACK_TEXT = CFG.callbackText || 'Please call me back';
  var WHATSAPP_NUMBER = (CFG.whatsappNumber || '37127034348').replace(/[^0-9]/g, '');

  var STORE = 'https://superagent-5681298a.base44.app/functions/evermodChatStore';
  var GREETING = 'Hi! I am Orion from EVERMOD \u{1F3E0} \u2014 your AI assistant.\n\nWe have been building modular homes for 23 years with 2000+ projects delivered. Ask me anything about our houses, or tell me what you are looking for!';

  var sessionId = null;
  try {
    sessionId = localStorage.getItem('evm-session');
    if (!sessionId) { sessionId = 'web-' + Math.random().toString(36).slice(2, 10); localStorage.setItem('evm-session', sessionId); }
  } catch (e) { sessionId = 'web-' + Date.now(); }

  /* ---------- styles ---------- */
  var css = document.createElement('style');
  css.textContent = [
    '#evermod-chat{width:100%}',
    '#evm-panel{position:static;width:100%;height:600px;background:#fff;border:1px solid #e8ddd4;border-radius:20px;box-shadow:0 10px 30px rgba(0,0,0,.10);display:flex;flex-direction:column;overflow:hidden;font-family:"Work Sans",-apple-system,Segoe UI,Roboto,sans-serif}',
    '#evm-head{background:#2a241a;color:#f6efe4;padding:13px 15px;display:flex;align-items:center;gap:10px}',
    '#evm-head .t{font-size:15px;font-weight:800;letter-spacing:.04em;font-family:"Archivo",-apple-system,sans-serif}',
    '#evm-head .s{font-size:11px;font-weight:300;opacity:.8;margin-top:2px}',
    '#evm-head .dot{width:8px;height:8px;border-radius:50%;background:#4caf50;flex:none}',
    '#evm-acts{display:flex;gap:8px;padding:10px 12px;background:#fff;border-bottom:1px solid #e8ddd4;flex-wrap:wrap}',
    '.evm-act{flex:1;min-width:100px;border:1px solid #2a241a;background:#fff;color:#2a241a;border-radius:10px;padding:8px 10px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s ease;white-space:nowrap;text-align:center}',
    '.evm-act:hover{background:#2a241a;color:#f6efe4}',
    '.evm-act.primary{background:#2a241a;color:#f6efe4}',
    '.evm-act.primary:hover{background:#3d352a}',
    '#evm-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#f6efe4}',
    '.evm-msg{max-width:82%;padding:10px 13px;border-radius:12px;font-size:14px;line-height:1.45;white-space:pre-wrap;overflow-wrap:break-word}',
    '.evm-msg.ai{background:#fff;border:1px solid #e8ddd4;color:#2a241a;border-bottom-left-radius:4px;align-self:flex-start}',
    '.evm-msg.user{background:#2a241a;color:#f6efe4;border-bottom-right-radius:4px;align-self:flex-end}',
    '.evm-typing{align-self:flex-start;background:#fff;border:1px solid #e8ddd4;border-radius:12px;padding:12px 14px;display:flex;gap:4px}',
    '.evm-typing span{width:6px;height:6px;border-radius:50%;background:#999;animation:evm-blink 1s infinite}',
    '.evm-typing span:nth-child(2){animation-delay:.2s}.evm-typing span:nth-child(3){animation-delay:.4s}',
    '#evm-inrow{display:flex;border-top:1px solid #e8ddd4;background:#fff}',
    '#evm-inrow input{flex:1;border:none;outline:none;padding:13px 14px;font-size:14px;background:transparent;font-family:inherit}',
    '#evm-inrow button{background:none;border:none;cursor:pointer;padding:0 14px;display:flex;align-items:center}',
    '#evm-inrow button:disabled{opacity:.4;cursor:default}',
    '#evm-inrow button svg{width:20px;height:20px;fill:#2a241a}',
    '#evm-foot{font-size:10px;font-weight:300;text-align:center;color:#6b5f50;padding:6px;background:#fff}',
    '#evm-foot a{color:#888;text-decoration:none;font-weight:400}',
    '@keyframes evm-blink{0%,100%{opacity:.2}50%{opacity:1}}',
    '@media (max-width:768px){#evm-panel{height:520px;border-radius:16px}}',
    '@media (max-width:768px){#evm-acts{gap:6px;padding:8px 10px}}',
    '@media (max-width:768px){.evm-act{min-width:0;font-size:11px;padding:7px 8px;white-space:normal}}'
  ].join('');
  document.head.appendChild(css);

  /* ---------- markup (embedded: rendered inside #evermod-chat when present) ---------- */
  var panel = document.createElement('div');
  panel.id = 'evm-panel';
  panel.setAttribute('role', 'log');
  panel.setAttribute('aria-label', 'EVERMOD chat');
  panel.innerHTML =
    '<div id="evm-head"><span class="dot"></span><div><div class="t">EVERMOD</div><div class="s">Orion \u00b7 online now</div></div></div>' +
    '<div id="evm-acts">' +
      '<button class="evm-act primary" id="evm-a-chat">Chat with Orion</button>' +
      '<button class="evm-act" id="evm-a-video">Book a Video Call</button>' +
      '<button class="evm-act" id="evm-a-call">Request a Call Back</button>' +
    '</div>' +
    '<div id="evm-msgs"></div>' +
    '<div id="evm-inrow">' +
      '<input id="evm-input" type="text" placeholder="Write your question..." aria-label="Your question">' +
      '<button id="evm-send" aria-label="Send"><svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg></button>' +
    '</div>' +
    '<div id="evm-foot">powered by EVERMOD assistant' + (CALLBACK_PHONE ? ' \u00b7 <a href="tel:' + CALLBACK_PHONE.replace(/\s+/g, '') + '">' + CALLBACK_PHONE + '</a>' : '') + '</div>';

  var host = document.getElementById('evermod-chat') || document.body;
  host.appendChild(panel);

  var msgs = panel.querySelector('#evm-msgs');
  var input = panel.querySelector('#evm-input');
  var sendBtn = panel.querySelector('#evm-send');
  var greeted = false;
  var lastShownId = null;
  var polling = false;

  /* ---------- helpers ---------- */
  function scroll() { msgs.scrollTop = msgs.scrollHeight; }

  function addMsg(text, who) {
    var div = document.createElement('div');
    div.className = 'evm-msg ' + who;
    div.textContent = text;
    msgs.appendChild(div);
    scroll();
  }

  function typing(on) {
    var t = panel.querySelector('.evm-typing');
    if (on && !t) {
      t = document.createElement('div');
      t.className = 'evm-typing';
      t.innerHTML = '<span></span><span></span><span></span>';
      msgs.appendChild(t);
      scroll();
    } else if (!on && t) { t.remove(); }
  }

  function stripMarker(t) {
    return (t || '').replace(/\[Website chat id=[^\]]*\]/g, '').trim();
  }

  var pendingId = null; // record awaiting an answer

  function enqueue(question) {
    typing(true);
    sendBtn.disabled = true;
    fetch(STORE, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'enqueue', sessionId: sessionId, question: question }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.recordId) {
          pendingId = d.recordId;
          try { localStorage.setItem('evm-last-record', pendingId); } catch (e) {}
          poll();
        } else {
          throw new Error('no record');
        }
      })
      .catch(function () {
        typing(false);
        sendBtn.disabled = false;
        addMsg('Sorry, the connection dropped \u2014 please try again in a moment.', 'ai');
      });
  }

  function poll() {
    if (polling) return;
    if (!pendingId) { typing(false); sendBtn.disabled = false; return; }
    polling = true;
    fetch(STORE, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'poll', recordId: pendingId }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        polling = false;
        if (d && d.status === 'answered' && d.reply) {
          if (d.recordId !== lastShownId) {
            lastShownId = d.recordId;
            try { localStorage.setItem('evm-last-shown', lastShownId); } catch (e) {}
            pendingId = null;
            typing(false);
            sendBtn.disabled = false;
            addMsg(stripMarker(d.reply), 'ai');
          } else {
            typing(false);
            sendBtn.disabled = false;
            pendingId = null;
          }
        } else if (d && (d.status === 'pending' || d.status === 'in_flight')) {
          typing(true);
          sendBtn.disabled = true;
          setTimeout(function () { if (panel.querySelector('.evm-typing')) poll(); }, 4000);
        } else {
          typing(false);
          sendBtn.disabled = false;
          pendingId = null;
        }
      })
      .catch(function () { polling = false; setTimeout(function () { if (panel.querySelector('.evm-typing')) poll(); }, 5000); });
  }

  function send(text) {
    text = (text || '').trim();
    if (!text) return;
    addMsg(text, 'user');
    input.value = '';
    enqueue(text);
  }

  /* ---------- public API ---------- */
  window.EvermodChat = {
    ask: function (text) { send(text); },
    greet: function () {
      if (!greeted && !msgs.children.length) { addMsg(GREETING, 'ai'); greeted = true; }
      scroll();
    },
    focus: function () { input.focus(); },
    scrollTo: function () {
      var el = document.getElementById('evermod-chat') || panel;
      if (el && el.scrollIntoView) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      window.EvermodChat.greet();
      setTimeout(function () { input.focus(); }, 400);
    },
    open: function () { window.EvermodChat.scrollTo(); }
  };

  /* ---------- events ---------- */
  sendBtn.addEventListener('click', function () { send(input.value); });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(input.value); });

  panel.querySelector('#evm-a-chat').addEventListener('click', function () { window.EvermodChat.greet(); input.focus(); });
  panel.querySelector('#evm-a-video').addEventListener('click', function () {
    if (MEETING_LINK) { window.open(MEETING_LINK, '_blank'); }
    else { send('I would like to book a video call with a specialist'); }
  });
  panel.querySelector('#evm-a-call').addEventListener('click', function () {
    window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(CALLBACK_TEXT), '_blank');
  });

  /* ---------- init: greeting shows instantly (chat is a visible page section) ---------- */
  window.EvermodChat.greet();

  // catch-up: if the visitor reloaded while an answer was on its way, deliver it now
  try { lastShownId = localStorage.getItem('evm-last-shown') || null; } catch (e) { lastShownId = null; }
  var lastRecord = null;
  try { lastRecord = localStorage.getItem('evm-last-record'); } catch (e) {}
  if (lastRecord && lastRecord !== lastShownId) {
    pendingId = lastRecord;
    poll();
  }
})();
