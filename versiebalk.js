// TIJDELIJK: versiekeuze om het origineel en het redesign te vergelijken.
// Verwijderen vóór de lancering: dit bestand, de map voor/ en de <script>-regels die het laden.
(function () {
  var path = location.pathname;
  var current = /\/voor\/(index\.html)?$/.test(path) ? 'voor' : 'redesign';
  var up = current === 'redesign' ? '' : '../';
  var versions = [
    { id: 'voor', label: 'Origineel', href: up + 'voor/' },
    { id: 'redesign', label: 'Redesign', href: up || './' }
  ];

  var style = document.createElement('style');
  style.textContent =
    '.versiebalk{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px 14px;' +
    'padding:8px 16px;background:#16191d;color:#d7dde3;font:500 14px/1.3 system-ui,-apple-system,"Segoe UI",sans-serif;position:relative;z-index:100}' +
    '.versiebalk nav{display:inline-flex;gap:4px;padding:3px;border-radius:999px;background:#2a3037}' +
    '.versiebalk a{padding:5px 12px;border-radius:999px;color:#d7dde3;text-decoration:none;transition:background-color .15s ease,color .15s ease}' +
    '.versiebalk a:hover{color:#fff}' +
    '.versiebalk a[aria-current="page"]{background:#fff;color:#16191d}' +
    '.versiebalk a:focus-visible{outline:2px solid #fff;outline-offset:2px}';
  document.head.appendChild(style);

  var bar = document.createElement('div');
  bar.className = 'versiebalk';
  bar.setAttribute('data-ui', '');
  bar.innerHTML = '<span>Tijdelijke preview · versie:</span><nav aria-label="Versie"></nav>';
  var nav = bar.querySelector('nav');
  versions.forEach(function (v) {
    var a = document.createElement('a');
    a.href = v.href;
    a.textContent = v.label;
    if (v.id === current) a.setAttribute('aria-current', 'page');
    nav.appendChild(a);
  });
  // Kleurkeuze (alleen voor het redesign): auto volgt het besturingssysteem; licht/donker forceren
  if (current === 'redesign') {
    var label = document.createElement('span');
    label.textContent = 'Kleur:';
    var themes = document.createElement('nav');
    themes.setAttribute('aria-label', 'Kleur');
    [['auto', 'Auto'], ['licht', 'Licht'], ['donker', 'Donker']].forEach(function (t) {
      var b = document.createElement('a');
      b.href = '#';
      b.textContent = t[1];
      b.setAttribute('data-kleur', t[0]);
      themes.appendChild(b);
    });
    function chosen() {
      var t = document.documentElement.getAttribute('data-theme');
      return t === 'dark' ? 'donker' : t === 'light' ? 'licht' : 'auto';
    }
    function show() {
      var c = chosen();
      themes.querySelectorAll('a').forEach(function (b) {
        if (b.getAttribute('data-kleur') === c) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
      });
    }
    themes.addEventListener('click', function (e) {
      var b = e.target.closest('a[data-kleur]');
      if (!b) return;
      e.preventDefault();
      var k = b.getAttribute('data-kleur');
      if (k === 'auto') document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', k === 'donker' ? 'dark' : 'light');
      try { if (k === 'auto') localStorage.removeItem('sak-kleur'); else localStorage.setItem('sak-kleur', k); } catch (err) {}
      show();
    });
    show();
    bar.appendChild(label);
    bar.appendChild(themes);
  }
  document.body.insertBefore(bar, document.body.firstChild);
})();
