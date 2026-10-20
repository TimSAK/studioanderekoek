// TIJDELIJK: versiekeuze om de site vóór en na de design-skills te vergelijken.
// Verwijderen vóór de lancering: dit bestand, de map voor/ en de twee <script>-regels die het laden.
(function () {
  var inVoor = /\/voor\/(index\.html)?$/.test(location.pathname);
  var versions = [
    { label: 'Na skills', href: inVoor ? '../' : './', current: !inVoor },
    { label: 'Vóór skills', href: inVoor ? './' : 'voor/', current: inVoor }
  ];

  var style = document.createElement('style');
  style.textContent =
    '.versiebalk{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px 14px;' +
    'padding:8px 16px;background:#16191d;color:#d7dde3;font:500 14px/1.3 system-ui,-apple-system,"Segoe UI",sans-serif}' +
    '.versiebalk nav{display:inline-flex;gap:4px;padding:3px;border-radius:999px;background:#2a3037}' +
    '.versiebalk a{padding:5px 12px;border-radius:999px;color:#d7dde3;text-decoration:none;transition:background-color .15s ease,color .15s ease}' +
    '.versiebalk a:hover{color:#fff}' +
    '.versiebalk a[aria-current="page"]{background:#fff;color:#16191d}' +
    '.versiebalk a:focus-visible{outline:2px solid #fff;outline-offset:2px}';
  document.head.appendChild(style);

  var bar = document.createElement('div');
  bar.className = 'versiebalk';
  bar.innerHTML = '<span>Tijdelijke preview · versie:</span><nav aria-label="Versie"></nav>';
  var nav = bar.querySelector('nav');
  versions.forEach(function (v) {
    var a = document.createElement('a');
    a.href = v.href;
    a.textContent = v.label;
    if (v.current) a.setAttribute('aria-current', 'page');
    nav.appendChild(a);
  });
  document.body.insertBefore(bar, document.body.firstChild);
})();
