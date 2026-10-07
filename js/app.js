/* Une la pantalla con el estado: navegación, memoria del navegador y compartir. */
import { DIMENSIONS, cloneState, decode, encodeState, hasAny, catalogOk, total, toggle, riskPattern, SHARE_BLURB } from './domain.js';
import { createView } from './view.js';

var STATE_KEY = 'animoreader-state';
var SHARE_KEY = 'animoreader-share';
var INSTALL_KEY = 'animoreader-install-hide';
var THEME_KEY = 'animoreader-theme';
var FONT_KEY = 'animoreader-font';
var FONT_STEPS = [87.5, 100, 112.5, 125];
var MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
var SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.1 5.1l1.6 1.6M17.3 17.3l1.6 1.6M18.9 5.1l-1.6 1.6M6.7 17.3l-1.6 1.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
var session = { S: { me: {}, gu: {} }, tab: 'me', dim: 'modo', incoming: null, showGate: false, shownLink: '', comfortOpen: false, comfortId: '' };
var deferredInstall = null;
var view = createView(document, function () { return session; }, {
  combinationCount: function () { return total().toLocaleString('es'); },
  go: go,
  dismiss: dismissShare,
  beginImagine: beginImagine,
  reveal: reveal,
  pick: pick,
  clear: clearTab,
  shareMine: shareMine,
  copySentence: copySentence,
  openDim: openDim,
  toggleComfort: toggleComfort
});

function $(id) { return document.getElementById(id); }
function locked() { return session.tab === 'gu' && session.incoming && session.incoming.revealed; }
function showBriefly(node, message, restore, ms) {
  node.textContent = message;
  setTimeout(function () { node.textContent = restore; }, ms);
}
function keepGuess() {
  if (!(session.tab === 'gu' && session.incoming && session.incoming.state && !session.incoming.revealed)) return;
  session.incoming.guess = cloneState(session.S.gu);
  session.incoming.started = true;
  saveIncoming();
}
function refreshComfort() {
  var pattern = riskPattern(session.S.me);
  var id = pattern ? pattern.id : '';
  if (id !== session.comfortId) { session.comfortOpen = false; session.comfortId = id; }
}
function toggleComfort() { session.comfortOpen = !session.comfortOpen; view.render(); }
function pick(dim, key) {
  if (locked()) return;
  session.S[session.tab] = toggle(dim, session.S[session.tab], key);
  if (session.tab === 'me') session.shownLink = '';
  keepGuess();
  refreshComfort();
  saveLocal();
  view.render();
}
function clearTab() {
  session.S[session.tab] = {};
  if (session.tab === 'me') session.shownLink = '';
  keepGuess();
  refreshComfort();
  saveLocal();
  view.render();
}
function loadLocal() {
  try {
    var saved = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
    if (!saved) return;
    if (saved.me) session.S.me = cloneState(saved.me);
    if (saved.gu) session.S.gu = cloneState(saved.gu);
  } catch (e) {}
}
function saveLocal() {
  try { localStorage.setItem(STATE_KEY, JSON.stringify({ me: cloneState(session.S.me), gu: cloneState(session.S.gu) })); } catch (e) {}
}
function loadSaved(raw) {
  try {
    var saved = JSON.parse(sessionStorage.getItem(SHARE_KEY) || 'null');
    if (!saved || saved.raw !== raw) return null;
    return saved;
  } catch (e) { return null; }
}
function saveIncoming() {
  if (!session.incoming || !session.incoming.raw || session.incoming.error) return;
  try {
    sessionStorage.setItem(SHARE_KEY, JSON.stringify({
      raw: session.incoming.raw,
      revealed: !!session.incoming.revealed,
      guess: session.incoming.guess,
      started: !!session.incoming.started
    }));
  } catch (e) {}
}
function readLink() {
  var hash = '';
  try { hash = decodeURIComponent((location.hash || '').replace(/^#/, '')).trim(); } catch (e) { hash = ''; }
  if (!hash) { session.incoming = null; session.showGate = false; return; }
  var match = /^e=([0-9.\-]+)$/.exec(hash);
  if (!match) {
    if (hash.indexOf('e=') === 0) { session.incoming = { error: 'Este enlace no se pudo leer.' }; session.showGate = false; }
    return;
  }
  var raw = match[1];
  if (session.incoming && session.incoming.raw === raw && (session.incoming.state || session.incoming.error)) return;
  var decoded = decode(raw);
  if (!decoded.ok) { session.incoming = { raw: raw, error: decoded.error }; session.showGate = false; return; }
  if (!hasAny(decoded.state)) { session.incoming = { raw: raw, error: 'Este enlace no trae ningún estado.' }; session.showGate = false; return; }
  var saved = loadSaved(raw);
  if (saved && saved.revealed) session.S.gu = cloneState(saved.guess || {});
  else if (saved && hasAny(saved.guess || {})) session.S.gu = cloneState(saved.guess);
  var kept = hasAny(session.S.gu);
  session.incoming = {
    raw: raw,
    state: decoded.state,
    revealed: !!(saved && saved.revealed),
    guess: (saved && saved.revealed) ? cloneState(saved.guess || {}) : (kept ? cloneState(session.S.gu) : null),
    started: !!(saved && (saved.started || saved.revealed)) || kept
  };
  if (kept && !session.incoming.revealed) saveIncoming();
  session.showGate = !session.incoming.revealed && !session.incoming.started;
  if (session.incoming.revealed) session.tab = 'cm';
  else if (session.incoming.started) session.tab = 'gu';
}
function dismissShare() {
  session.incoming = null;
  session.showGate = false;
  session.shownLink = '';
  try { sessionStorage.removeItem(SHARE_KEY); } catch (e) {}
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  session.tab = 'me';
  view.render();
}
function beginImagine() {
  if (session.incoming) { session.incoming.started = true; saveIncoming(); }
  session.showGate = false;
  session.tab = 'gu';
  view.render();
}
function reveal() {
  if (!session.incoming || !session.incoming.state || session.incoming.revealed) return;
  session.incoming.revealed = true;
  session.incoming.started = true;
  session.incoming.guess = cloneState(session.S.gu);
  saveIncoming();
  saveLocal();
  session.showGate = false;
  session.tab = 'cm';
  view.render();
}
function openDim(key) {
  if (key === session.dim) return;
  var from = 0;
  var to = 0;
  DIMENSIONS.forEach(function (dim, index) {
    if (dim.k === session.dim) from = index;
    if (dim.k === key) to = index;
  });
  session.slide = to > from ? 1 : -1;
  session.dim = key;
  view.render();
  session.slide = 0;
}
function go(key) {
  if (session.showGate && session.incoming && session.incoming.state) { session.incoming.started = true; saveIncoming(); }
  session.showGate = false;
  session.tab = key;
  view.render();
}
function shareUrl(state) { return location.href.split('#')[0] + '#e=' + encodeState(state); }
function shareMine(button) {
  if (!hasAny(session.S.me)) { showBriefly(button, 'Elige algo antes', 'Compartir', 1500); return; }
  if (!catalogOk()) { showBriefly(button, 'No se pudo armar', 'Compartir', 1500); return; }
  var url = shareUrl(session.S.me);
  if (navigator.share) {
    navigator.share({ title: 'AnimoReader', text: SHARE_BLURB, url: url }).catch(function (err) {
      if (err && err.name === 'AbortError') return;
      fallbackCopy(url, button);
    });
    return;
  }
  fallbackCopy(url, button);
}
function fallbackCopy(url, button) {
  var ok = function () { session.shownLink = ''; showBriefly(button, 'Enlace copiado', 'Compartir', 1600); };
  var bad = function () { session.shownLink = url; view.render(); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok).catch(bad);
  else bad();
}
function copySentence(text, button) {
  if (!text) return;
  var done = function () { button.textContent = 'Copiado'; };
  var failed = function () { button.textContent = 'No se pudo copiar'; };
  try {
    navigator.clipboard.writeText(text).then(done).catch(failed);
  } catch (e) { failed(); }
  setTimeout(function () { button.textContent = 'Copiar'; }, 1500);
}
function installedApp() {
  return window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
}
function mobileDevice() {
  var ua = navigator.userAgent || '';
  if (/Android|iPhone|iPad|iPod/i.test(ua)) return true;
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}
function installHidden() { try { return sessionStorage.getItem(INSTALL_KEY) === '1'; } catch (e) { return false; } }
function hideInstall(remember) {
  if (remember) { try { sessionStorage.setItem(INSTALL_KEY, '1'); } catch (e) {} }
  var box = $('install');
  if (!box) return;
  box.hidden = true;
  box.textContent = '';
}
function showInstall(mode) {
  var box = $('install');
  if (!box) return;
  if (installedApp() || !mobileDevice() || installHidden()) { hideInstall(false); return; }
  view.showInstall(box, mode, {
    onInstall: function () {
      if (!deferredInstall) return;
      var prompt = deferredInstall.prompt();
      var choice = deferredInstall.userChoice;
      deferredInstall = null;
      Promise.resolve(choice || prompt).then(function (result) { hideInstall(result && result.outcome === 'accepted'); }).catch(function () { hideInstall(false); });
    },
    onDismiss: function () { hideInstall(true); }
  });
}

function storedTheme() {
  try {
    var value = localStorage.getItem(THEME_KEY);
    return value === 'dark' || value === 'light' ? value : '';
  } catch (e) { return ''; }
}
function systemDark() { return window.matchMedia('(prefers-color-scheme: dark)').matches; }
function effectiveDark() {
  var choice = storedTheme();
  if (choice === 'dark') return true;
  if (choice === 'light') return false;
  return systemDark();
}
function paintTheme() {
  var dark = effectiveDark();
  var button = $('theme-toggle');
  button.innerHTML = dark ? SUN : MOON;
  button.setAttribute('aria-label', dark ? 'Activar modo claro' : 'Activar modo oscuro');
  button.setAttribute('aria-pressed', String(dark));
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#0F1A20' : '#EEF3F5');
}
function toggleTheme() {
  var next = effectiveDark() ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  paintTheme();
}
function fontIndex() {
  var raw = '';
  try { raw = localStorage.getItem(FONT_KEY) || ''; } catch (e) {}
  var index = FONT_STEPS.indexOf(parseFloat(raw));
  return index < 0 ? 1 : index;
}
function applyFont(index, save) {
  var value = FONT_STEPS[index];
  document.documentElement.style.fontSize = value === 100 ? '' : value + '%';
  if (save) {
    try {
      if (value === 100) localStorage.removeItem(FONT_KEY);
      else localStorage.setItem(FONT_KEY, String(value));
    } catch (e) {}
  }
  $('font-down').disabled = index === 0;
  $('font-up').disabled = index === FONT_STEPS.length - 1;
}
function stepFont(delta) {
  var next = fontIndex() + delta;
  if (next < 0 || next >= FONT_STEPS.length) return;
  applyFont(next, true);
}

$('t-me').onclick = function () { go('me'); };
$('t-gu').onclick = function () { go('gu'); };
$('t-cm').onclick = function () { go('cm'); };
$('t-fu').onclick = function () { go('fu'); };
$('font-down').onclick = function () { stepFont(-1); };
$('font-up').onclick = function () { stepFont(1); };
$('theme-toggle').onclick = toggleTheme;
applyFont(fontIndex(), false);
paintTheme();
try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { if (!storedTheme()) paintTheme(); }); } catch (e) {}
loadLocal();
refreshComfort();
readLink();
view.render();
window.addEventListener('hashchange', function () { readLink(); view.render(); });
if ('serviceWorker' in navigator) window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
window.addEventListener('beforeinstallprompt', function (event) {
  if (!mobileDevice() || installedApp()) return;
  event.preventDefault();
  deferredInstall = event;
  showInstall('native');
});
window.addEventListener('appinstalled', function () { deferredInstall = null; hideInstall(true); });
try { window.matchMedia('(display-mode: standalone)').addEventListener('change', function (event) { if (event.matches) hideInstall(true); }); } catch (e) {}
(function () {
  var ua = navigator.userAgent || '';
  var iOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var other = /CriOS|FxiOS|EdgiOS|OPiOS|WhatsApp|Instagram|FBAN|FBAV/.test(ua);
  if (iOS && !other) showInstall('ios');
})();
