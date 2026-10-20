// Jaartal in de footer
document.getElementById('year').textContent = new Date().getFullYear();

var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Binnenkomst bij scrollen: elementen met data-reveal krijgen eenmalig .is-in (ook de illustraties
// reageren daarop). Wat tegelijk in beeld komt, volgt elkaar 70ms op in leesvolgorde.
// Zonder JS of IntersectionObserver staat alles gewoon in beeld (de klasse .js wordt dan verwijderd).
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
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });
  items.forEach(function (el) { observer.observe(el); });
  window.motionReady = true;
})();

// De kolibrie uit het logo.
// - Tijdens het scrollen blijft hij waar hij is (hij hangt in de pagina en schuift dus mee).
// - Eén seconde na het scrollen: is hij niet (helemaal) in beeld, dan vliegt hij vanaf de schermrand
//   naar een plek in beeld.
// - Wie even niet scrolt, ziet hem af en toe naar een andere plek in beeld vliegen.
// Een plek is een rustplek (data-perch) of een willekeurige vrije plek; nooit over tekst, knoppen,
// velden of illustraties. Hij onthoudt zijn laatste plekken, zodat hij niet heen en weer pendelt.
// Hij draait eerst op de plek als hij de andere kant op moet, en helt voorover in de vliegrichting.
(function () {
  var bird = document.querySelector('.bird');
  if (!bird || reduceMotion) return;
  var root = document.documentElement;
  var flipEl = bird.querySelector('.bird-flip');
  var BASE = 100;                 // breedte van .bird in px (zie css)
  var HEADER = 72;                // hoogte van de vaste balk bovenaan
  var IDLE = 1000;                // wachttijd na het laatste scrollen
  var WANDER_MIN = 5000, WANDER_EXTRA = 4000;   // rondzwerven na 5–9 s stilte
  var TURN = 240;                 // omdraaien op de plek (ms), gelijk aan de css-overgang
  var OBSTACLES = 'h1, h2, h3, p, li:not(.step):not(.client), dt, dd, label, input, textarea, button, a, img, .step-art, .service-art, .form';
  var TEXT = 'h1, h2, h3, p, li:not(.step):not(.client), dd';   // daar vliegt hij liever niet dwars overheen
  var STORE = 'sak-kolibrie';
  var paused = false;
  var pos = { x: 0, y: 0, w: 64 };
  var perch = null;               // rustplek waar hij op zit (of null bij een vrije plek)
  var facing = 1;                 // 1 = kijkt naar rechts, -1 = naar links
  var flight = null, turnTimer = null, idleTimer = null, wanderTimer = null;
  var recent = [];                // laatste plekken (pagina-coördinaten)

  root.classList.add('bird-on');

  function size() { return Math.max(64, Math.min(104, window.innerWidth * .07)); }
  // De paginamarge (linkerrand van de koppen); hij blijft binnen dezelfde marges als de inhoud
  function margin() {
    var head = document.querySelector('.section-head');
    return head ? Math.max(8, head.getBoundingClientRect().left) : 8;
  }
  function pageRect(el, pad) {
    var r = el.getBoundingClientRect(); pad = pad || 0;
    return { x: r.left + window.scrollX - pad, y: r.top + window.scrollY - pad, w: r.width + pad * 2, h: r.height + pad * 2 };
  }
  function spotOf(el) {
    var b = pageRect(el);
    if (el.hasAttribute('data-fit')) return { x: b.x, y: b.y, w: b.w };
    var w = size();
    var m = margin();
    var x = Math.max(window.scrollX + m, Math.min(window.scrollX + root.clientWidth - w - m, b.x + b.w / 2 - w / 2));
    return { x: x, y: b.y + b.h / 2 - w * .97 / 2, w: w };
  }
  function boxOf(s) { return { x: s.x, y: s.y, w: s.w, h: s.w * .97 }; }
  function overlaps(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function view() {
    var m = margin();
    return { top: window.scrollY + HEADER + 12, bottom: window.scrollY + window.innerHeight - 12, left: window.scrollX + m, right: window.scrollX + root.clientWidth - m };
  }
  function inView(b, v) { return b.y >= v.top && b.y + b.h <= v.bottom && b.x >= v.left && b.x + b.w <= v.right; }

  function apply(rot) {
    bird.style.transform = 'translate3d(' + pos.x.toFixed(1) + 'px,' + pos.y.toFixed(1) + 'px,0) scale(' + (pos.w / BASE).toFixed(3) + ') rotate(' + (rot || 0).toFixed(1) + 'deg)';
  }
  function face(dir) {
    if (dir === facing) return false;
    facing = dir;
    flipEl.style.setProperty('--flip', dir);
    return true;
  }
  function settleClass(onPerchWord) { bird.classList.toggle('is-hovering', !onPerchWord && !paused); }
  function sitOn(el) {
    pos = spotOf(el);
    perch = el;
    settleClass(el.hasAttribute('data-fit'));
    apply(0);
  }

  // Alles wat hij niet mag bedekken, in beeld
  function obstacles(v) {
    var area = { x: v.left, y: v.top, w: v.right - v.left, h: v.bottom - v.top };
    return Array.prototype.slice.call(document.querySelectorAll(OBSTACLES))
      .filter(function (el) { return !el.closest('.bird') && !el.closest('.versiebalk') && el.getClientRects().length; })
      .map(function (el) { return pageRect(el, 10); })
      .filter(function (r) { return r.w > 0 && r.h > 0 && overlaps(r, area); });
  }
  function isFree(box, obs) { for (var i = 0; i < obs.length; i++) if (overlaps(box, obs[i])) return false; return true; }
  function isRecent(s) {
    return recent.some(function (r) { return Math.hypot(r.x - s.x, r.y - s.y) < 140; });
  }
  function remember(s) { recent.push({ x: s.x, y: s.y }); if (recent.length > 4) recent.shift(); }

  // Tekstblokken die de rechte lijn naar het doel kruist (het vertrekpunt en het doel zelf tellen niet)
  function crossesText(spot, texts) {
    var from = boxOf(pos), to = boxOf(spot);
    for (var i = 1; i < 10; i++) {
      var t = i / 10;
      var b = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, w: from.w + (to.w - from.w) * t, h: from.h + (to.h - from.h) * t };
      b = { x: b.x + b.w * .3, y: b.y + b.h * .3, w: b.w * .4, h: b.h * .4 };   // alleen de kern van de vogel
      for (var j = 0; j < texts.length; j++) {
        if (overlaps(b, texts[j]) && !overlaps(from, texts[j]) && !overlaps(to, texts[j])) return true;
      }
    }
    return false;
  }
  function textRects(v) {
    var area = { x: v.left, y: v.top - 400, w: v.right - v.left, h: v.bottom - v.top + 800 };
    return Array.prototype.slice.call(document.querySelectorAll(TEXT))
      .filter(function (el) { return !el.closest('.versiebalk') && el.getClientRects().length; })
      .map(function (el) { return pageRect(el); })
      .filter(function (r) { return r.w > 0 && r.h > 0 && overlaps(r, area); });
  }

  // Kandidaten: vrije willekeurige plekken en vrije rustplekken in beeld (ook weer het plekje in de zin)
  function candidates(v, opts) {
    var obs = obstacles(v), w = size(), h = w * .97, out = [];
    Array.prototype.slice.call(document.querySelectorAll('[data-perch]')).forEach(function (el) {
      if (!el.getClientRects().length || el === perch) return;
      var fit = el.hasAttribute('data-fit');
      var s = spotOf(el), b = boxOf(s);
      if (fit && s.w < 8) return;
      if (inView(b, v) && (fit || isFree(b, obs))) out.push({ spot: s, el: el });
    });
    for (var i = 0; i < 80 && out.length < 12; i++) {
      var s = { x: v.left + Math.random() * Math.max(0, v.right - v.left - w), y: v.top + Math.random() * Math.max(0, v.bottom - v.top - h), w: w };
      if (isFree(boxOf(s), obs)) out.push({ spot: s, el: null });
    }
    out = out.filter(function (c) {
      var far = Math.hypot(c.spot.x - pos.x, c.spot.y - pos.y) > (opts.minDistance || 0);
      return far && !isRecent(c.spot);
    });
    var texts = textRects(v);
    var clear = out.filter(function (c) { return !crossesText(c.spot, texts); });
    return clear.length ? clear : out;
  }

  var grove = document.querySelector('.grove');
  function rustle() {
    if (!grove) return;
    grove.classList.remove('is-rustling'); void grove.offsetWidth; grove.classList.add('is-rustling');
    setTimeout(function () { grove.classList.remove('is-rustling'); }, 800);
  }
  function inGrove(el) { return !!(el && grove && grove.contains(el)); }

  function fly(target) {
    clearTimeout(turnTimer);
    if (inGrove(perch)) rustle();
    var v = view();
    var h = pos.w * .97;
    // Buiten beeld? Dan vertrekt hij net buiten de rand aan zijn kant (die sprong ziet niemand).
    var start = { x: Math.min(Math.max(pos.x, v.left - pos.w), v.right), y: pos.y, w: pos.w };
    if (pos.y + h < v.top) start.y = v.top - h - 12;
    else if (pos.y > v.bottom) start.y = v.bottom + 12;
    var wasOutside = start.x !== pos.x || start.y !== pos.y;
    var end = target.spot;
    var dx = end.x - start.x, dy = end.y - start.y, dist = Math.hypot(dx, dy);
    perch = null;
    if (dist < 2) { land(target); return; }

    // Eerst omdraaien op de plek als hij de andere kant op moet
    var dir = Math.abs(dx) > 12 ? (dx < 0 ? -1 : 1) : facing;
    var needsTurn = face(dir) && !wasOutside;
    pos = { x: start.x, y: start.y, w: start.w };
    apply(0);
    turnTimer = setTimeout(go, needsTurn ? TURN : 0);

    function go() {
      var duration = Math.max(700, Math.min(1700, 380 + dist * 1.1));
      // Zachte S-boog: twee controlepunten, een beetje omhoog en een beetje toeval
      var nx = -dy / dist, ny = dx / dist;
      var bend = (Math.random() * 2 - 1) * Math.min(90, dist * .25);
      var lift = Math.min(120, dist * .22);
      var c1 = { x: start.x + dx * .3 + nx * bend, y: start.y + dy * .3 + ny * bend - lift };
      var c2 = { x: start.x + dx * .72 - nx * bend * .5, y: start.y + dy * .72 - ny * bend * .5 - lift * .6 };
      var t0 = null, rot = 0, prev = { x: start.x, y: start.y };
      bird.classList.add('is-flying');
      bird.classList.remove('is-hovering');

      function bez(a, b, c, d, t) { var u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d; }
      function step(now) {
        if (t0 === null) t0 = now;
        var t = Math.min(1, (now - t0) / duration);
        // snel weg, rustig aankomen (zoals een kolibrie die naar een bloem schiet)
        var e = .5 - .5 * Math.cos(Math.PI * Math.pow(t, .75));
        pos.x = bez(start.x, c1.x, c2.x, end.x, e);
        pos.y = bez(start.y, c1.y, c2.y, end.y, e);
        pos.w = start.w + (end.w - start.w) * e;
        // Helling: voorover in de vliegrichting, omhoog/omlaag langs de baan; gedempt
        var vx = pos.x - prev.x, vy = pos.y - prev.y; prev = { x: pos.x, y: pos.y };
        var speed = Math.hypot(vx, vy);
        var pitch = speed > .3 ? Math.atan2(vy, Math.abs(vx) + .5) * 57.3 * .45 : 0;
        var lean = Math.min(14, speed * 1.6);
        var goal = Math.max(-24, Math.min(24, pitch + lean)) * facing;
        rot += (goal - rot) * .18;
        apply(rot * (1 - Math.pow(t, 4)));
        if (t < 1) { flight = requestAnimationFrame(step); return; }
        flight = null;
        bird.classList.remove('is-flying');
        land(target);
      }
      flight = requestAnimationFrame(step);
    }
  }
  function land(target) {
    pos = { x: target.spot.x, y: target.spot.y, w: target.spot.w };
    perch = target.el;
    if (inGrove(perch)) rustle();
    remember(pos);
    settleClass(!!(perch && perch.hasAttribute('data-fit')));
    apply(0);
    scheduleWander();
  }

  function stopFlight() {
    clearTimeout(turnTimer);
    if (!flight) return;
    cancelAnimationFrame(flight);
    flight = null;
    bird.classList.remove('is-flying');
    settleClass(true);
    apply(0);
  }

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function nearest(list) {
    return list.slice().sort(function (a, b) {
      return Math.hypot(a.spot.x - pos.x, a.spot.y - pos.y) - Math.hypot(b.spot.x - pos.x, b.spot.y - pos.y);
    })[0];
  }

  // Na het scrollen: zit hij nog zichtbaar, dan blijft hij; anders naar een plek in beeld
  function settle() {
    if (paused) return;
    var v = view();
    var here = perch ? boxOf(spotOf(perch)) : boxOf(pos);
    if (inView(here, v)) { if (perch) sitOn(perch); scheduleWander(); return; }
    var list = candidates(v, {});
    if (!list.length) { scheduleWander(); return; }
    // de dichtstbijzijnde paar plekken, daaruit een willekeurige: natuurlijk, maar niet voorspelbaar
    var close = list.sort(function (a, b) {
      return Math.hypot(a.spot.x - pos.x, a.spot.y - pos.y) - Math.hypot(b.spot.x - pos.x, b.spot.y - pos.y);
    }).slice(0, 4);
    fly(pick(close));
  }

  // Rondzwerven na een stille periode
  function scheduleWander() {
    clearTimeout(wanderTimer);
    wanderTimer = setTimeout(wander, WANDER_MIN + Math.random() * WANDER_EXTRA);
  }
  function wander() {
    var typing = document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (paused) return;
    if (flight || document.hidden || typing) { scheduleWander(); return; }
    var list = candidates(view(), { minDistance: 180 });
    if (!list.length) { scheduleWander(); return; }
    fly(pick(list));
  }

  window.addEventListener('scroll', function () {
    if (paused) return;
    stopFlight();
    clearTimeout(wanderTimer);
    clearTimeout(idleTimer);
    idleTimer = setTimeout(settle, IDLE);
  }, { passive: true });
  window.addEventListener('resize', function () {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { if (perch) sitOn(perch); settle(); }, 200);
  });

  // Stilzetten en weer laten vliegen met een klik op de vogel
  function setPaused(on) {
    paused = on;
    bird.classList.toggle('is-paused', on);
    if (on) { stopFlight(); clearTimeout(wanderTimer); clearTimeout(idleTimer); }
    settleClass(!!(perch && perch.hasAttribute('data-fit')));
    try { if (on) localStorage.setItem(STORE, 'stil'); else localStorage.removeItem(STORE); } catch (e) {}
    if (!on && bird.classList.contains('is-ready')) { clearTimeout(wanderTimer); wanderTimer = setTimeout(wander, 1200); }
  }
  bird.addEventListener('click', function () { setPaused(!paused); });
  try { if (localStorage.getItem(STORE) === 'stil') setPaused(true); } catch (e) {}

  // Begin in het bosje als dat in beeld is (grote schermen) en vlieg dan de zin in; anders meteen in de zin
  var word = document.querySelector('.perch-word');
  var nest = grove && grove.querySelector('[data-perch]');
  var first = nest && nest.getClientRects().length && inView(boxOf(spotOf(nest)), view()) ? nest : (word || document.querySelector('[data-perch]'));
  if (first === nest && word) {   // al naar de zin toe kijken, zonder zichtbare draai
    flipEl.style.transition = 'none';
    face(pageRect(word).x < pageRect(nest).x ? -1 : 1);
    requestAnimationFrame(function () { requestAnimationFrame(function () { flipEl.style.transition = ''; }); });
  }
  sitOn(first);
  function realign() { if (perch) sitOn(perch); }
  window.addEventListener('load', function () { realign(); setTimeout(realign, 600); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(realign);
  // Pas tonen als de eerste regel van de zin op zijn plek staat (die schuift bij het laden omhoog)
  setTimeout(function () {
    realign();
    bird.classList.add('is-ready');
    clearTimeout(wanderTimer);
    if (paused) return;
    if (first === nest && perch === nest && word) {
      // uit het bosje de zin in; daarna zwerft hij zoals altijd
      wanderTimer = setTimeout(function () { if (perch === nest) fly({ spot: spotOf(word), el: word }); }, 700);
    } else {
      wanderTimer = setTimeout(wander, 2600);   // na een paar seconden de zin uit
    }
  }, 1150);
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
