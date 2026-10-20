// Jaartal in de footer
document.getElementById('year').textContent = new Date().getFullYear();

// Schaduw onder de header zodra hij boven de inhoud zweeft
(function () {
  var header = document.querySelector('.site-header');
  function update() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', update, { passive: true });
  update();
})();

// Terminal in de hero: regels één voor één tonen, agents "werken" tot de review
(function () {
  var list = document.getElementById('terminal');
  if (!list || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var lines = Array.prototype.slice.call(list.children);
  var running = lines.filter(function (li) { return li.classList.contains('t-run'); });
  list.classList.add('is-playing');

  var delay = 400;
  lines.forEach(function (li, i) {
    var isReview = li.classList.contains('t-done') && i > 1;
    delay += isReview ? 1800 : 650; // agents krijgen even de tijd voordat de review komt
    setTimeout(function () {
      if (li.classList.contains('t-run')) li.classList.add('is-busy');
      if (isReview) {
        running.forEach(function (r) { r.classList.remove('is-busy'); r.classList.add('is-finished'); });
      }
      li.classList.add('is-in');
    }, delay);
  });
})();

// Binnenkomst: elementen met data-reveal verschijnen eenmalig als ze in beeld komen. Wat tegelijk
// in beeld komt verschijnt 70ms na elkaar, in leesvolgorde. Zonder JS of IntersectionObserver staat alles gewoon in beeld.
(function () {
  var items = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if (!('IntersectionObserver' in window)) {
    document.documentElement.classList.remove('js');
    return;
  }
  var observer = new IntersectionObserver(function (entries) {
    entries
      .filter(function (entry) { return entry.isIntersecting; })
      .sort(function (a, b) { return items.indexOf(a.target) - items.indexOf(b.target); })
      .forEach(function (entry, i) {
        entry.target.style.setProperty('--reveal-delay', Math.min(i, 5) * 70 + 'ms');
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
  }, { rootMargin: '0px 0px -10% 0px' });
  items.forEach(function (el) { observer.observe(el); });
  window.revealReady = true;
})();

// GoatCounter-event tellen (doet niets als de teller niet geladen is, bijv. lokaal)
function count(path) {
  if (window.goatcounter && window.goatcounter.count) {
    window.goatcounter.count({ path: path, title: path, event: true });
  }
}

// Klikken op het mailadres ook tellen, zodat je ziet of mensen contact zoeken
document.addEventListener('click', function (e) {
  if (e.target.closest('a[href^="mailto:"]')) count('klik-mail');
});

// Contactformulier: controleren en versturen via Web3Forms zonder paginawissel
(function () {
  var form = document.getElementById('contact-form');
  if (!form) return;
  var status = form.querySelector('.form-status');
  var button = form.querySelector('button[type="submit"]');
  var fallback = 'Mail ons direct op <a href="mailto:info@studioanderekoek.nl">info@studioanderekoek.nl</a>.';

  var checks = {
    name: function (v) { return v ? '' : 'Vul je naam in.'; },
    email: function (v) {
      if (!v) return 'Vul je e-mailadres in.';
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Dit e-mailadres lijkt niet te kloppen.';
    },
    message: function (v) { return v ? '' : 'Schrijf een kort bericht.'; }
  };

  function validate() {
    var firstInvalid = null;
    Object.keys(checks).forEach(function (name) {
      var input = form.elements[name];
      var message = checks[name](input.value.trim());
      var error = document.getElementById(input.id + '-error');
      error.textContent = message;
      input.parentNode.classList.toggle('has-error', !!message);
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (message) input.setAttribute('aria-describedby', error.id); else input.removeAttribute('aria-describedby');
      if (message && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;

    button.disabled = true;
    status.textContent = 'Bezig met versturen…';

    fetch(form.action, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form)
    })
      .then(function (res) { return res.json().then(function (data) { return res.ok && data.success; }); })
      .then(function (ok) {
        if (!ok) throw new Error('niet verstuurd');
        form.classList.add('is-sent');
        status.textContent = 'Bedankt voor je bericht! We nemen zo snel mogelijk contact met je op.';
        count('bericht-verstuurd');
      })
      .catch(function () {
        status.innerHTML = 'Dat ging helaas mis. ' + fallback;
        button.disabled = false;
      });
  });
})();
