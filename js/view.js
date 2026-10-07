/* Dibuja la pantalla a partir del estado. Las decisiones de negocio viven en domain.js. */
import { DIMENSIONS, sentence, questions, hasAny, isOn, asKeys, compareRows, riskPattern } from './domain.js';

var SHORT = { modo: 'Modo', foco: 'Foco', emo: 'Emoción', tiempo: 'Tiempo', nec: 'Cuerpo', animo: 'Ánimo' };

function el(doc, tag, className, text) {
  var node = doc.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function row(doc, nodes) {
  var box = el(doc, 'div', 'row');
  nodes.forEach(function (node) { box.appendChild(node); });
  return box;
}
function chipLabel(text) {
  return text.replace(/^(con el foco en |en modo |con |de |sin )/, '');
}
function questionBox(doc, title, items) {
  var box = el(doc, 'div', 'q');
  box.appendChild(el(doc, 'strong', '', title));
  items.forEach(function (text) { box.appendChild(el(doc, 'p', '', text)); });
  return box;
}
function resultLine(hit, tot) {
  return tot
    ? ('Coincidieron ' + hit + ' de ' + tot + '. Las diferencias no son errores: son buenas preguntas para hacerse.')
    : 'No hay dimensiones elegidas de los dos lados para comparar.';
}
function fillTable(doc, real, guess, heads) {
  var wrap = el(doc, 'div', 'wrap');
  var table = el(doc, 'table', 'cmp');
  var head = el(doc, 'tr');
  heads.forEach(function (text) { head.appendChild(el(doc, 'th', '', text)); });
  table.appendChild(head);
  var summary = compareRows(real, guess);
  summary.rows.forEach(function (item) {
    var line = el(doc, 'tr');
    line.appendChild(el(doc, 'td', '', item.title));
    line.appendChild(el(doc, 'td', '', item.real || 'sin elegir'));
    line.appendChild(el(doc, 'td', '', item.guess || 'no sabía'));
    line.appendChild(el(doc, 'td', item.both ? (item.match ? 'ok' : 'no') : '', item.both ? (item.match ? 'coincide' : 'distinto') : ''));
    table.appendChild(line);
  });
  wrap.appendChild(table);
  return { node: wrap, hit: summary.hit, tot: summary.tot };
}

export function createView(doc, getSession, api) {
  function $(id) { return doc.getElementById(id); }
  function imagineButton() {
    var button = el(doc, 'button', 'go', 'Imaginar ahora');
    button.onclick = api.beginImagine;
    return button;
  }
  function locked() {
    var session = getSession();
    return session.tab === 'gu' && session.incoming && session.incoming.revealed;
  }
  function renderGate(app) {
    var gate = el(doc, 'div', 'gate');
    gate.appendChild(el(doc, 'h2', '', 'Alguien te compartió su estado'));
    gate.appendChild(el(doc, 'p', '', 'Primero imagina cómo está esta persona. Cuando termines, toca Revelar.'));
    var skip = el(doc, 'button', '', 'Seguir sin este enlace');
    skip.onclick = api.dismiss;
    gate.appendChild(row(doc, [imagineButton(), skip]));
    app.appendChild(gate);
  }
  function renderEditor(app, session) {
    var tab = session.tab;
    var state = session.S[tab];
    var text = sentence(state, tab);
    var lock = locked();
    var pending = session.incoming && session.incoming.state && !session.incoming.revealed;
    var box = el(doc, 'div', 'say');
    box.appendChild(text ? el(doc, 'p', '', text) : el(doc, 'p', 'empty', tab === 'me' ? 'Elige abajo cómo estás ahora.' : 'Elige abajo cómo imaginas que está la otra persona.'));
    if (tab === 'me') box.appendChild(el(doc, 'p', 'hint', 'Compartir manda el enlace. La otra persona imagina tu estado antes de verlo.'));
    if (lock) box.appendChild(el(doc, 'p', 'hint', 'Ya revelaste este estado. Así quedó lo que imaginaste.'));
    var actions = [];
    if (tab === 'me') {
      var share = el(doc, 'button', 'share', 'Compartir');
      share.onclick = function () { api.shareMine(share); };
      actions.push(share);
    }
    var copy = el(doc, 'button', '', 'Copiar');
    copy.onclick = function () { api.copySentence(text, copy); };
    actions.push(copy);
    if (!lock) {
      var clear = el(doc, 'button', '', 'Limpiar');
      clear.onclick = api.clear;
      actions.push(clear);
    }
    box.appendChild(row(doc, actions));
    if (tab === 'me' && session.shownLink) {
      box.appendChild(el(doc, 'p', 'hint', 'Selecciona el enlace y cópialo.'));
      var input = doc.createElement('input');
      input.className = 'url';
      input.readOnly = true;
      input.value = session.shownLink;
      input.setAttribute('aria-label', 'Enlace para compartir');
      box.appendChild(input);
      setTimeout(function () { input.focus(); input.select(); }, 0);
    }
    app.appendChild(box);
    if (pending && tab === 'me') {
      var note = el(doc, 'div', 'q');
      note.appendChild(el(doc, 'p', '', 'Hay un estado compartido sin revelar. Imagínalo antes de verlo.'));
      note.appendChild(row(doc, [imagineButton()]));
      app.appendChild(note);
    }
    var current = DIMENSIONS[0];
    DIMENSIONS.forEach(function (dim) { if (dim.k === session.dim) current = dim; });
    var dims = el(doc, 'div', 'dims');
    dims.setAttribute('role', 'tablist');
    dims.setAttribute('aria-label', 'Dimensiones');
    DIMENSIONS.forEach(function (dim) {
      var name = SHORT[dim.k] || dim.t;
      var picked = asKeys(dim, state[dim.k]).length > 0;
      var tabBtn = el(doc, 'button', picked ? 'filled' : '', name);
      tabBtn.type = 'button';
      tabBtn.setAttribute('role', 'tab');
      tabBtn.setAttribute('aria-selected', String(dim.k === current.k));
      if (picked) tabBtn.setAttribute('aria-label', name + ', con elección');
      tabBtn.onclick = function () { api.openDim(dim.k); };
      dims.appendChild(tabBtn);
    });
    app.appendChild(dims);
    var field = el(doc, 'fieldset', 'sheet-page');
    var legend = el(doc, 'legend', '', current.t + ' ');
    if (current.multi) legend.appendChild(el(doc, 'small', '', '(puedes elegir varias)'));
    else if (tab === 'gu') legend.appendChild(el(doc, 'small', '', '(si no sabes, déjalo sin elegir)'));
    field.appendChild(legend);
    var chips = el(doc, 'div', 'chips');
    current.o.forEach(function (option) {
      var button = el(doc, 'button', 'chip', chipLabel(option[1]));
      button.setAttribute('aria-pressed', String(isOn(current, state, option[0])));
      button.disabled = lock;
      button.onclick = function () { api.pick(current, option[0]); };
      chips.appendChild(button);
    });
    field.appendChild(chips);
    var sheet = el(doc, 'div', 'sheet');
    var forward = session.slide > 0;
    if (session.leaving) {
      field.classList.add(forward ? 'from-right' : 'from-left');
      session.leaving.className = 'sheet-page ' + (forward ? 'to-left' : 'to-right');
      session.leaving.setAttribute('aria-hidden', 'true');
      sheet.appendChild(session.leaving);
    }
    sheet.appendChild(field);
    app.appendChild(sheet);
    if (session.leaving) {
      var gone = session.leaving;
      sheet.style.minHeight = Math.max(field.offsetHeight, gone.offsetHeight) + 'px';
      var finish = function () {
        if (gone.parentNode) gone.parentNode.removeChild(gone);
        sheet.style.minHeight = '';
      };
      gone.addEventListener('animationend', finish);
      setTimeout(finish, 500);
      session.leaving = null;
    }
    var prompts = questions(state);
    if (prompts.length && !lock) app.appendChild(questionBox(doc, tab === 'me' ? 'Para decirlo en voz alta' : 'Para preguntar antes de suponer', prompts));
    if (pending && tab === 'gu') {
      var dock = el(doc, 'div', 'dock');
      var inner = el(doc, 'div', 'dock-inner');
      inner.appendChild(el(doc, 'p', '', hasAny(session.S.gu) ? 'Tu elección se conservó. Toca Revelar para compararla.' : 'Cuando termines, toca Revelar.'));
      var reveal = el(doc, 'button', '', 'Revelar');
      reveal.onclick = api.reveal;
      inner.appendChild(reveal);
      dock.appendChild(inner);
      app.appendChild(dock);
    }
  }
  function renderShared(app, incoming) {
    var real = incoming.state;
    var guess = incoming.guess || {};
    var box = el(doc, 'div', 'say');
    box.appendChild(el(doc, 'p', 'hint', 'Este es el estado que te compartieron, comparado con lo que imaginaste antes de verlo.'));
    var theirs = sentence(real, 'them');
    var mine = sentence(guess, 'gu');
    if (theirs) box.appendChild(el(doc, 'p', '', theirs));
    if (mine) box.appendChild(el(doc, 'p', '', mine));
    app.appendChild(box);
    if (!mine) app.appendChild(el(doc, 'p', 'n', 'No imaginaste ninguna dimensión antes de revelar.'));
    var table = fillTable(doc, real, guess, ['Dimensión', 'Su estado', 'Lo que imaginé', '']);
    app.appendChild(table.node);
    app.appendChild(el(doc, 'p', 'n', resultLine(table.hit, table.tot)));
    var prompts = questions(real);
    if (prompts.length) app.appendChild(questionBox(doc, 'Para conversar a partir de su estado', prompts));
    var bye = el(doc, 'button', '', 'Dejar este enlace');
    bye.onclick = api.dismiss;
    app.appendChild(row(doc, [bye]));
  }
  function renderCompare(app, session) {
    var incoming = session.incoming;
    if (incoming && incoming.state && incoming.revealed) { renderShared(app, incoming); return; }
    if (incoming && incoming.state && !incoming.revealed) {
      var wait = el(doc, 'div', 'say');
      wait.appendChild(el(doc, 'p', '', 'El estado compartido sigue oculto. Imagínalo primero y después toca Revelar.'));
      wait.appendChild(row(doc, [imagineButton()]));
      app.appendChild(wait);
      return;
    }
    var mine = sentence(session.S.me, 'me');
    var guess = sentence(session.S.gu, 'gu');
    var box = el(doc, 'div', 'say');
    box.appendChild(el(doc, 'p', 'empty', 'Cada persona arma su estado real en «Mi estado». Quien imagina el del otro lo arma en «Imagino tu estado». Aquí se ven las diferencias.'));
    app.appendChild(box);
    if (!mine || !guess) { app.appendChild(el(doc, 'p', 'n', 'Falta completar al menos una dimensión en «Mi estado» y en «Imagino tu estado».')); return; }
    var table = fillTable(doc, session.S.me, session.S.gu, ['Dimensión', 'Estado real', 'Lo que imaginé', '']);
    app.appendChild(table.node);
    app.appendChild(el(doc, 'p', 'n', resultLine(table.hit, table.tot)));
  }
  function renderFundamento(app) {
    var session = getSession();
    var box = el(doc, 'div', 'fund');
    box.appendChild(el(doc, 'h2', '', 'Fundamento'));
    box.appendChild(el(doc, 'p', '', 'El cerebro puede tener varias combinaciones posibles de estados. El propósito de esta app es tener una representación visual de lo que pasa en nuestra mente y una forma gráfica de expresarlo cuando no sabemos cómo decirlo en palabras.'));
    box.appendChild(el(doc, 'p', '', 'Incluye una forma lúdica de intentar adivinar o interpretar el estado del otro.'));
    var figure = el(doc, 'p', 'figure');
    figure.appendChild(el(doc, 'span', 'figure-n', api.combinationCount()));
    box.appendChild(figure);
    box.appendChild(el(doc, 'p', 'n', 'combinaciones posibles con estas seis dimensiones. El estado del otro rara vez es uno solo.'));
    var pattern = riskPattern(session.S.me);
    if (pattern) {
      var hug = el(doc, 'button', 'hug');
      hug.type = 'button';
      var emoji = el(doc, 'span', 'hug-emoji', '\u{1F917}');
      emoji.setAttribute('aria-hidden', 'true');
      hug.appendChild(emoji);
      hug.appendChild(el(doc, 'span', '', 'Abrazo'));
      hug.setAttribute('aria-label', session.comfortOpen ? 'Ocultar palabras de contención' : 'Un abrazo');
      hug.setAttribute('aria-expanded', String(!!session.comfortOpen));
      hug.onclick = api.toggleComfort;
      box.appendChild(hug);
      if (session.comfortOpen) box.appendChild(el(doc, 'p', 'comfort', pattern.text));
    }
    app.appendChild(box);
  }
  function render() {
    var session = getSession();
    var app = $('app');
    session.leaving = null;
    if (session.slide) {
      var reduce = doc.defaultView.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var old = app.querySelector('.sheet-page:not(.to-left):not(.to-right)');
      if (old && !reduce) session.leaving = old.cloneNode(true);
    }
    app.textContent = '';
    var pending = session.incoming && session.incoming.state && !session.incoming.revealed;
    doc.querySelector('main').classList.toggle('has-dock', !!(pending && !session.showGate && session.tab === 'gu'));
    ['me', 'gu', 'cm', 'fu'].forEach(function (key) { $('t-' + key).setAttribute('aria-selected', String(!session.showGate && key === session.tab)); });
    var warm = session.showGate || session.tab === 'gu';
    doc.documentElement.dataset.climate = warm ? 'gu' : 'me';
    doc.documentElement.style.setProperty('--accent', warm ? 'var(--gu)' : 'var(--me)');
    if (session.incoming && session.incoming.error) {
      var err = el(doc, 'div', 'q');
      err.appendChild(el(doc, 'p', '', session.incoming.error));
      var understood = el(doc, 'button', '', 'Entendido');
      understood.onclick = api.dismiss;
      err.appendChild(row(doc, [understood]));
      app.appendChild(err);
    }
    if (session.showGate && session.incoming && session.incoming.state && !session.incoming.revealed) { renderGate(app); return; }
    if (session.tab === 'fu') { renderFundamento(app); return; }
    if (session.tab === 'cm') { renderCompare(app, session); return; }
    renderEditor(app, session);
  }
  function showInstall(box, mode, handlers) {
    if (!box) return;
    box.hidden = false;
    box.textContent = '';
    box.appendChild(el(doc, 'p', '', mode === 'ios' ? 'Para crear el ícono, toca Compartir y después Agregar a inicio.' : 'Instala AnimoReader para tener el ícono en el celular.'));
    var actions = [];
    if (mode === 'native') {
      var install = el(doc, 'button', 'install-go', 'Instalar');
      install.onclick = handlers.onInstall;
      actions.push(install);
    }
    var dismiss = el(doc, 'button', 'install-x', 'Ahora no');
    dismiss.setAttribute('aria-label', 'Cerrar aviso de instalación');
    dismiss.onclick = handlers.onDismiss;
    actions.push(dismiss);
    box.appendChild(row(doc, actions));
  }
  return { render: render, showInstall: showInstall };
}
