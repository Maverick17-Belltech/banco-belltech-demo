/* marca.js v1 – Demo Banco & Seguros (Belltech powered by NiCE)
   Toma el nombre de la asistente y del banco de la planilla (API v6.45, GET accion=marca) y los reemplaza en la página:
   textos, atributos (placeholder, title, aria-label, alt) y el título de la pestaña, también en lo que se agrega después.
   No toca los widgets de Cognigy (chat y llamada): ahí los nombres los pone Cognigy.
   Primera visita: oculta la página hasta 1,5 s mientras llega el nombre; después usa el último nombre guardado en el navegador.
   Para usarlo: <script src="config.js"></script> y después <script src="marca.js"></script>, dentro del <head>. */
(function () {
  var DEF = { asistente: 'Sofía', banco: 'Banco & Seguros Belltech', banco_corto: 'Banco & Seguros' };
  var KEY = 'bt_marca_v1', M = null, hecho = new WeakMap();
  try { M = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  window.BT_MARCA = M;
  var root = document.documentElement, oculto = false;
  if (!M) { oculto = true; root.style.visibility = 'hidden'; setTimeout(mostrar, 1500); }
  function mostrar() { if (oculto) { oculto = false; root.style.visibility = ''; } }

  function cambiar(t) {
    if (!M || !t) return t;
    if (t.indexOf('Sofía') < 0 && t.indexOf('Banco & Seguros') < 0 && t.indexOf('Banco &amp; Seguros') < 0) return t;
    // marcadores para no pisar dos veces (ej. si el nombre nuevo contiene el viejo)
    return t.split('Banco & Seguros Belltech').join('\u0001B\u0001').split('Banco &amp; Seguros Belltech').join('\u0001B\u0001')
      .split('Banco & Seguros').join('\u0001C\u0001').split('Banco &amp; Seguros').join('\u0001C\u0001')
      .split('Sofía').join('\u0001A\u0001')
      .split('\u0001B\u0001').join(M.banco || DEF.banco).split('\u0001C\u0001').join(M.banco_corto || DEF.banco_corto)
      .split('\u0001A\u0001').join(M.asistente || DEF.asistente);
  }
  function excluido(el) {
    for (var n = el; n && n.nodeType === 1; n = n.parentNode) {
      var id = (n.id || '') + ' ' + (typeof n.className === 'string' ? n.className : '');
      if (/webchat|webrtc|cognigy/i.test(id) || n.hasAttribute('data-cognigy-webchat-root') || /^(SCRIPT|STYLE|TEXTAREA)$/.test(n.tagName)) return true;
    }
    return false;
  }
  var ATR = ['placeholder', 'title', 'aria-label', 'alt', 'value'];
  function nodo(n) {
    if (n.nodeType === 3) {
      if (!n.parentNode || excluido(n.parentNode)) return;
      if (hecho.get(n) === n.data) return;
      var v = cambiar(n.data); if (v !== n.data) n.data = v; hecho.set(n, n.data);
    } else if (n.nodeType === 1) {
      if (excluido(n)) return;
      ATR.forEach(function (a) {
        if (!n.hasAttribute(a) || (a === 'value' && !/^(BUTTON|INPUT)$/.test(n.tagName)) || (a === 'value' && n.tagName === 'INPUT' && !/^(button|submit)$/i.test(n.type))) return;
        var x = n.getAttribute(a), y = cambiar(x); if (y !== x) n.setAttribute(a, y);
      });
      for (var c = n.firstChild; c; c = c.nextSibling) nodo(c);
    }
  }
  function aplicar() { if (!M || !document.body) return; document.title = cambiar(document.title); nodo(document.body); }
  var obs = new MutationObserver(function (ls) {
    if (!M) return;
    ls.forEach(function (l) {
      if (l.type === 'characterData') nodo(l.target);
      else if (l.type === 'attributes') nodo(l.target);
      else l.addedNodes.forEach(nodo);
    });
  });
  function arrancar() {
    aplicar();
    obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATR });
    var api = (window.DEMO_CONFIG || {}).BYS_API_URL;
    if (!api) { mostrar(); return; }
    fetch(api + '?accion=marca&_=' + Date.now()).then(function (r) { return r.json(); }).then(function (r) {
      if (!r || !r.ok || !r.asistente) return;
      var nuevo = { asistente: r.asistente, banco: r.banco || DEF.banco, banco_corto: r.banco_corto || DEF.banco_corto };
      var cambio = !M || M.asistente !== nuevo.asistente || M.banco !== nuevo.banco || M.banco_corto !== nuevo.banco_corto;
      try { localStorage.setItem(KEY, JSON.stringify(nuevo)); } catch (e) {}
      if (cambio && M) { location.reload(); return; }   // cambió el nombre en la planilla: se recarga una vez con el nuevo
      M = nuevo; window.BT_MARCA = M; aplicar();
      try { window.dispatchEvent(new CustomEvent('bt-marca', { detail: M })); } catch (e) {}
    }).catch(function () {}).then(mostrar);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
  window.BT_MARCA_TXT = cambiar;
})();
