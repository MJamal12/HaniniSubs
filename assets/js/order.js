/* ==========================================================================
   Hanini Subs — menu & ordering page
   ========================================================================== */
(function () {
  var App = window.HaniniApp;
  var Menu = window.HaniniMenu;
  var Cart = window.HaniniCart;
  var qs = App.qs, qsa = App.qsa, esc = App.esc;

  var menuEl = qs('[data-menu]');
  if (!menuEl) return;
  var chipsEl = qs('[data-menu-chips]');
  var searchEl = qs('[data-menu-search]');
  var clearBtn = qs('[data-search-clear]');
  var statusEl = qs('[data-search-status]');
  var emptyEl = qs('[data-menu-empty]');
  var panelBody = qs('[data-order-panel-body]');
  var bar = qs('[data-order-bar]');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Render ---------- */
  menuEl.innerHTML = Menu.categories.map(function (cat) {
    return '<section class="menu-section" id="' + cat.id + '" aria-labelledby="h-' + cat.id + '" data-cat="' + cat.id + '">' +
      '<div class="menu-section__head">' +
        '<h2 class="menu-section__title" id="h-' + cat.id + '">' + esc(cat.name) + '</h2>' +
        (cat.note ? '<p class="menu-section__note">' + esc(cat.note) + '</p>' : '') +
      '</div>' +
      '<div class="menu-grid">' + cat.items.map(function (item) {
        return '<div class="menu-grid__cell" data-search-text="' + esc((item.name + ' ' + (item.desc || '') + ' ' + cat.name).toLowerCase()) + '">' +
          App.cardHTML(item, 'row') + '</div>';
      }).join('') + '</div>' +
    '</section>';
  }).join('');

  chipsEl.innerHTML = '<ul class="chips__list">' + Menu.categories.map(function (cat) {
    return '<li><a class="chip" href="#' + cat.id + '" data-chip="' + cat.id + '">' + esc(cat.name) + '</a></li>';
  }).join('') + '</ul>';

  /* ---------- Chips: scroll to section + scrollspy ---------- */
  var activeChip = null;
  function setActive(id) {
    var chip = qs('[data-chip="' + id + '"]', chipsEl);
    if (!chip || chip === activeChip) return;
    if (activeChip) { activeChip.classList.remove('is-active'); activeChip.removeAttribute('aria-current'); }
    chip.classList.add('is-active');
    chip.setAttribute('aria-current', 'true');
    activeChip = chip;
    // keep the active chip visible inside the horizontal strip
    var strip = chipsEl;
    var left = chip.offsetLeft - strip.clientWidth / 2 + chip.clientWidth / 2;
    strip.scrollTo({ left: Math.max(0, left), behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  chipsEl.addEventListener('click', function (e) {
    var chip = e.target.closest('[data-chip]');
    if (!chip) return;
    e.preventDefault();
    var id = chip.getAttribute('data-chip');
    if (searchEl.value) { searchEl.value = ''; applySearch(); }
    var target = document.getElementById(id);
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    setActive(id);
    history.replaceState(null, '', '#' + id);
    var h = qs('h2', target);
    h.setAttribute('tabindex', '-1');
    h.focus({ preventScroll: true });
  });

  if ('IntersectionObserver' in window) {
    var visible = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      for (var i = Menu.categories.length - 1; i >= 0; i--) {
        var id = Menu.categories[i].id;
        if (visible[id]) { setActive(id); break; }
      }
    }, { rootMargin: '-150px 0px -55% 0px' });
    qsa('.menu-section', menuEl).forEach(function (s) { spy.observe(s); });
  }
  setActive(Menu.categories[0].id);

  /* ---------- Search ---------- */
  function applySearch() {
    var q = searchEl.value.trim().toLowerCase();
    clearBtn.hidden = !q;
    var shown = 0;
    qsa('.menu-section', menuEl).forEach(function (sec) {
      var any = false;
      qsa('.menu-grid__cell', sec).forEach(function (cell) {
        var match = !q || cell.getAttribute('data-search-text').indexOf(q) !== -1;
        cell.hidden = !match;
        if (match) { any = true; shown++; }
      });
      sec.hidden = !any;
    });
    emptyEl.hidden = shown > 0;
    if (!shown) qs('[data-empty-query]', emptyEl).textContent = searchEl.value.trim();
    chipsEl.classList.toggle('is-dimmed', !!q);
    statusEl.textContent = q ? (shown ? shown + (shown === 1 ? ' item matches' : ' items match') + ' “' + searchEl.value.trim() + '”' : 'No items match “' + searchEl.value.trim() + '”') : '';
  }
  searchEl.addEventListener('input', applySearch);
  clearBtn.addEventListener('click', function () { searchEl.value = ''; applySearch(); searchEl.focus(); });
  qs('[data-empty-clear]', emptyEl).addEventListener('click', function () { searchEl.value = ''; applySearch(); searchEl.focus(); });

  /* ---------- Sidebar cart + mobile order bar ---------- */
  function renderPanel() {
    App.renderCart(panelBody, { onMenuPage: true });
    var n = Cart.count();
    bar.hidden = n === 0;
    document.body.classList.toggle('has-order-bar', n > 0);
    qs('[data-order-bar-count]', bar).textContent = n;
    qs('[data-order-bar-total]', bar).textContent = App.money(Cart.subtotal());
  }
  Cart.subscribe(renderPanel);
  renderPanel();

  /* ---------- Deep links: order.html?item=gyro or #corned-beef-subs ---------- */
  var params = new URLSearchParams(location.search);
  var deepItem = params.get('item');
  if (deepItem && Menu.get(deepItem)) setTimeout(function () { App.openCustomizer(deepItem); }, 60);
  if (location.hash && document.getElementById(location.hash.slice(1))) {
    setTimeout(function () {
      document.getElementById(location.hash.slice(1)).scrollIntoView({ block: 'start' });
      setActive(location.hash.slice(1));
    }, 30);
  }
})();
