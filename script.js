/* =============================================================
CASH LOANS · PORTAL EJECUTIVO
script.js — JavaScript puro, sin dependencias
-------------------------------------------------------------
Módulos
01. Navegación por pestañas (hash routing)
02. Barra de pestañas fija y progreso de lectura
03. Animación de aparición (IntersectionObserver)
04. Medidores de la matriz de pagos
05. Journey del cliente (render desde datos del PPT)
06. Cronograma Gantt (render desde datos del PPT)
07. Masthead: fecha de consulta e impresión
08. Botón volver arriba
============================================================= */
(function () {
'use strict';

var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ===========================================================
01. NAVEGACIÓN POR PESTAÑAS
=========================================================== */
var tabNav = document.getElementById('tabNav');
var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
var panels = Array.prototype.slice.call(document.querySelectorAll('.panel'));

/* Mantiene visible la pestaña activa cuando la barra se desplaza en móvil. */
function revealTab(btn) {
if (!btn || !tabNav || typeof btn.scrollIntoView !== 'function') return;
var izq = btn.offsetLeft, der = izq + btn.offsetWidth;
if (izq < tabNav.scrollLeft || der > tabNav.scrollLeft + tabNav.clientWidth) {
tabNav.scrollTo({ left: Math.max(0, izq - 16), behavior: reduceMotion ? 'auto' : 'smooth' });
}
}

function activate(id, pushHash) {
var target = document.getElementById(id);
if (!target) return;

tabs.forEach(function (t) {
var on = t.dataset.tab === id;
t.classList.toggle('is-active', on);
t.setAttribute('aria-selected', on ? 'true' : 'false');
if (on) revealTab(t);
});

panels.forEach(function (p) {
var on = p.id === id;
p.classList.toggle('is-active', on);
if (on) { p.removeAttribute('hidden'); } else { p.setAttribute('hidden', ''); }
});

if (pushHash) history.replaceState(null, '', '#' + id);
window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });

// Vuelve a evaluar animaciones del panel recién mostrado.
requestAnimationFrame(function () {
scanReveals();
if (id === 'timeline') drawGantt();
if (id === 'propuesta') runMeters();
});
}

tabs.forEach(function (t) {
t.addEventListener('click', function () { activate(t.dataset.tab, true); });
});

window.addEventListener('hashchange', function () {
var id = location.hash.replace('#', '');
if (id) activate(id, false);
});

/* ===========================================================
02. HEADER PEGAJOSO + PROGRESO DE LECTURA
=========================================================== */
var tabbar = document.querySelector('.tabbar');
var masthead = document.querySelector('.masthead');

/* El umbral se mide contra el masthead, que no es pegajoso: el
offsetTop de la propia barra cambia en cuanto queda fija. */
function umbralFijo() {
return masthead ? masthead.offsetTop + masthead.offsetHeight : 0;
}
var progress = document.getElementById('scrollProgress');
var toTop = document.getElementById('toTop');

function onScroll() {
var y = window.scrollY || document.documentElement.scrollTop;
var max = document.documentElement.scrollHeight - window.innerHeight;
if (tabbar) tabbar.classList.toggle('is-stuck', y > umbralFijo());
if (progress) progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
if (toTop) toTop.classList.toggle('is-visible', y > 500);
sweepReveals(); // red de seguridad ante desplazamientos muy rápidos
}
window.addEventListener('scroll', onScroll, { passive: true });

/* ===========================================================
03. ANIMACIÓN DE APARICIÓN
=========================================================== */
var io = null;
if ('IntersectionObserver' in window && !reduceMotion) {
io = new IntersectionObserver(function (entries) {
entries.forEach(function (e, i) {
if (!e.isIntersecting) return;
var el = e.target;
setTimeout(function () { el.classList.add('is-in'); }, Math.min(i * 55, 280));
io.unobserve(el);
});
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
}

function scanReveals() {
var items = document.querySelectorAll('.panel.is-active .reveal:not(.is-in)');
Array.prototype.forEach.call(items, function (el) {
if (io) { io.observe(el); } else { el.classList.add('is-in'); }
});
}

/* Red de seguridad: si el usuario se desplaza más rápido de lo que el
observador alcanza a notificar, revela todo lo que ya quedó por encima
del borde inferior del viewport. Así ningún bloque queda invisible. */
var sweepPending = false;
function sweepReveals() {
if (sweepPending) return;
sweepPending = true;
requestAnimationFrame(function () {
sweepPending = false;
var limit = window.innerHeight;
var items = document.querySelectorAll('.panel.is-active .reveal:not(.is-in)');
Array.prototype.forEach.call(items, function (el) {
if (el.getBoundingClientRect().top < limit) el.classList.add('is-in');
});
});
}

/* ===========================================================
04. MEDIDORES DE LA MATRIZ DE PAGOS
=========================================================== */
function runMeters() {
document.querySelectorAll('#propuesta .meter span').forEach(function (bar) {
if (bar.dataset.done) return;
var w = bar.style.width;
bar.dataset.done = '1';
bar.style.width = '0';
requestAnimationFrame(function () {
setTimeout(function () { bar.style.width = w; }, 120);
});
});
}

/* ===========================================================
05. JOURNEY DEL CLIENTE (Fuente: Slide 5)
=========================================================== */
var JOURNEY = [
{ icon: 'i-phone', quote: '“Se me acabó la pensión antes de fin de mes.”', title: 'Tiene una necesidad',
desc: 'Solicita el Cash Loan Exprés en la app, con asistencia si la necesita.' },
{ icon: 'i-user-check', quote: '“¿Me lo prestan?”', title: 'Se precalifica',
desc: 'Sí: recibe su monto preaprobado. No: construye historial y lo volvemos a buscar.' },
{ icon: 'i-wallet', quote: '“Ya está en mi cuenta.”', title: 'Recibe su dinero',
desc: 'Abre su cuenta N4 en la app y ahí recibe el crédito al momento.' },
{ icon: 'i-calendar', quote: '“Pago a tiempo, mes a mes.”', title: 'Paga y gana confianza',
desc: 'Pago voluntario: cada pago construye su historial con nosotros.' },
{ icon: 'i-gift', quote: '“Me ofrecen más, y más barato.”', title: 'Mejora su oferta',
desc: 'Al portar su pensión accede al Anticipo de Pensión o al Cashloan.', highlight: true },
{ icon: 'i-handshake', quote: '“Este ya es mi banco.”', title: 'Crece con nosotros',
desc: 'Créditos de mayor monto y plazo, hasta el descuento vía nómina.' }
];

function renderJourney() {
var host = document.getElementById('journey');
if (!host) return;
host.innerHTML = JOURNEY.map(function (s, i) {
return '' +
'<article class="jn jn-' + (i + 1) + (s.highlight ? ' jn-hl' : '') + ' reveal">' +
'<p class="jn-quote">' + s.quote + '</p>' +
'<div class="jn-mid">' +
'<span class="jn-ico"><svg aria-hidden="true"><use href="#' + s.icon + '"/></svg></span>' +
(i < JOURNEY.length - 1 ? '<span class="jn-line"></span>' : '') +
'</div>' +
'<div class="jn-step"><span class="jn-num">' + (i + 1) + '</span>' +
'<span class="jn-t">' + s.title + '</span></div>' +
'<p class="jn-d">' + s.desc + '</p>' +
'</article>';
}).join('');
}

/* ===========================================================
06. CRONOGRAMA GANTT (Fuente: Slide 10)
-----------------------------------------------------------
Eje: 14 columnas → 2026 Q4 | 2027 Q1-Q4 | 2028 Q1-Q4 |
2029 Q1-Q4 | 2030–31
Los meses se cuentan desde octubre 2026 (m = 0).
T0 del proyecto = noviembre 2026 (m = 1).
=========================================================== */
var COLS = 14; // columnas totales del eje
var LINEAR_M = 39; // meses con escala trimestral (oct 2026 – dic 2029)
var TAIL_M = 24; // meses comprimidos en la última columna (2030–31)

// mes → porcentaje del ancho del track.
// Hasta dic 2029 la escala es un trimestre por columna; de ahí en adelante
// los dos años finales se comprimen en la columna "2030–31", igual que el PPT.
function pct(m) {
var cols = m <= LINEAR_M
? m / 3
: (LINEAR_M / 3) + Math.min((m - LINEAR_M) / TAIL_M, 1);
return (cols / COLS) * 100;
}

var YEARS = [
{ label: '2026', quarters: ['Q4'] },
{ label: '2027', quarters: ['Q1', 'Q2', 'Q3', 'Q4'] },
{ label: '2028', quarters: ['Q1', 'Q2', 'Q3', 'Q4'] },
{ label: '2029', quarters: ['Q1', 'Q2', 'Q3', 'Q4'] },
{ label: '2030–31', quarters: [''] }
];

var ROWS = [
{
name: 'Habilitación común', note: 'Plataforma, app y modelo de riesgo',
bars: [{ type: 'hab', from: 1, to: 6, label: '5 meses' }],
diamonds: [6]
},
{
name: 'Cash Loan Exprés', note: 'Plazo <em>1 a 3 meses</em>',
bars: [
{ type: 'pru', from: 6, to: 12, label: '6 meses' },
{ type: 'lan', from: 12, to: 18, label: '6 meses' },
{ type: 'mas', from: 18, to: 63, label: 'Masificación' }
],
diamonds: [12, 18],
milestone: { at: 33, label: 'Madurez · jul 2029' }
},
{
name: 'Anticipo de Pensión', note: 'Plazo <em>1 a 2 meses</em>',
bars: [
{ type: 'hab', from: 8, to: 12, label: '4 meses' },
{ type: 'pru', from: 12, to: 16, label: '4 meses' },
{ type: 'lan', from: 16, to: 22, label: '6 meses' },
{ type: 'mas', from: 22, to: 63, label: 'Masificación' }
],
diamonds: [12, 16, 22],
milestone: { at: 42, label: 'Madurez · abr 2030' }
},
{
name: 'Cashloan', note: 'Plazo <em>6 a 18 meses</em>',
bars: [
{ type: 'hab', from: 12, to: 16, label: '4 meses' },
{ type: 'pru', from: 16, to: 22, label: '6 meses' },
{ type: 'lan', from: 22, to: 28, label: '6 meses' },
{ type: 'mas', from: 28, to: 63, label: 'Masificación' }
],
diamonds: [16, 22, 28]
}
];

// Dependencias: cada producto arranca su prueba cuando el anterior avanza.
var DEPS = [{ m: 6, row: 0 }, { m: 12, row: 1 }, { m: 16, row: 2 }];

var ROW_H = 74, BAR_TOP = 18, BAR_H = 38;

function buildGantt() {
var host = document.getElementById('gantt');
if (!host || host.dataset.built) return;

var totalQ = YEARS.reduce(function (n, y) { return n + y.quarters.length; }, 0);
var yearCols = YEARS.map(function (y) { return y.quarters.length + 'fr'; }).join(' ');
var qCols = 'repeat(' + totalQ + ',1fr)';

// --- Encabezado de años y trimestres ---
var head = '<div class="g-head"><div></div><div>' +
'<div class="g-years" style="grid-template-columns:' + yearCols + '">' +
YEARS.map(function (y) { return '<div class="g-year">' + y.label + '</div>'; }).join('') +
'</div>' +
'<div class="g-quarters" style="grid-template-columns:' + qCols + '">' +
YEARS.reduce(function (acc, y) {
return acc.concat(y.quarters.map(function (q) { return '<div class="g-q">' + q + '</div>'; }));
}, []).join('') +
'</div></div></div>';

// --- Líneas de cuadrícula verticales ---
var grid = '<div class="g-grid" style="grid-template-columns:' + qCols + '">' +
YEARS.reduce(function (acc, y) {
return acc.concat(y.quarters.map(function (q) {
return '<i class="' + (q === 'Q4' ? 'q4' : '') + '"></i>';
}));
}, []).join('') + '</div>';

// --- Filas ---
var labels = '', rows = '';
ROWS.forEach(function (r) {
labels += '<div class="g-label"><b>' + r.name + '</b><small>' + r.note + '</small></div>';

var bars = r.bars.map(function (b) {
var left = pct(b.from), width = pct(b.to) - left;
return '<div class="g-bar ' + b.type + '" style="left:' + left + '%;width:' + width + '%">' +
b.label + '</div>';
}).join('');

var diamonds = (r.diamonds || []).map(function (m) {
return '<span class="g-diamond" style="left:' + pct(m) + '%"></span>';
}).join('');

var ms = r.milestone
? '<div class="g-milestone" style="left:' + pct(r.milestone.at) + '%">' +
'<span>' + r.milestone.label + '</span><i></i></div>'
: '';

rows += '<div class="g-row">' + bars + diamonds + ms + '</div>';
});

// --- Flechas de dependencia entre filas ---
var deps = DEPS.map(function (d) {
var top = d.row * ROW_H + BAR_TOP + BAR_H;
var h = ((d.row + 1) * ROW_H + BAR_TOP) - top;
return '<span class="g-dep" style="left:' + pct(d.m) + '%;top:' + top + 'px;height:' + h + 'px"></span>';
}).join('');

// --- Línea T0 ---
var t0 = '<div class="g-t0" style="left:' + pct(1) + '%"><span>T0 · nov 2026</span></div>';

host.innerHTML = head +
'<div class="g-rowset">' +
'<div class="g-labels">' + labels + '</div>' +
'<div class="g-track">' + grid + t0 + rows + deps + '<div class="g-foot"></div></div>' +
'</div>';

host.dataset.built = '1';
}

function drawGantt() {
buildGantt();
var host = document.getElementById('gantt');
if (host) setTimeout(function () { host.classList.add('is-drawn'); }, 120);
}

/* ===========================================================
07. MASTHEAD: FECHA DE CONSULTA E IMPRESIÓN
=========================================================== */
function initMasthead() {
var fecha = document.getElementById('fechaConsulta');
if (fecha) {
try {
fecha.textContent = new Date().toLocaleDateString('es-MX', {
day: 'numeric', month: 'short', year: 'numeric'
});
} catch (e) {
fecha.textContent = new Date().toLocaleDateString();
}
}
var imprimir = document.getElementById('btnPrint');
if (imprimir) imprimir.addEventListener('click', function () { window.print(); });
}

/* ===========================================================
08. VOLVER ARRIBA
=========================================================== */
if (toTop) {
toTop.addEventListener('click', function () {
window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
});
}

/* ===========================================================
ARRANQUE
=========================================================== */
function init() {
initMasthead();
renderJourney();

var initial = location.hash.replace('#', '');
var valid = tabs.some(function (t) { return t.dataset.tab === initial; });
activate(valid ? initial : 'tablero', false);

revealTab(document.querySelector('.tab.is-active'));
scanReveals();
onScroll();
}

if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', init);
} else {
init();
}

})();
