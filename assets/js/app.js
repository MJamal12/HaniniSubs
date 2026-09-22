/* ==========================================================================
   Hanini Subs — shared site behavior
   Loaded on every page after config.js, icons.js, menu-data.js and cart.js.
   ========================================================================== */
(function () {
  var C = window.HANINI_CONFIG;
  var Menu = window.HaniniMenu;
  var Cart = window.HaniniCart;
  var icon = window.haniniIcon;
  var money = Menu.money;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     Time & hours (always in the shop's time zone)
     ------------------------------------------------------------------ */
  var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function shopNow(date) {
    var d = date || new Date();
    var parts = {};
    try {
      new Intl.DateTimeFormat('en-US', {
        timeZone: C.timeZone, weekday: 'short', year: 'numeric', month: '2-digit',
        day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
      }).formatToParts(d).forEach(function (p) { parts[p.type] = p.value; });
    } catch (e) {
      return { day: d.getDay(), minutes: d.getHours() * 60 + d.getMinutes(), y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
    }
    return {
      day: DAY_SHORT.indexOf(parts.weekday),
      minutes: (parseInt(parts.hour, 10) % 24) * 60 + parseInt(parts.minute, 10),
      y: +parts.year, m: +parts.month, d: +parts.day
    };
  }
  function toMin(hhmm) { var p = hhmm.split(':'); return +p[0] * 60 + +p[1]; }
  function fmtTime(min) {
    var h = Math.floor(min / 60) % 24, m = min % 60;
    var suffix = h >= 12 ? 'pm' : 'am';
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + (m ? ':' + String(m).padStart(2, '0') : '') + suffix;
  }
  function hoursFor(day) {
    var h = C.hours[day];
    return h ? { open: toMin(h[0]), close: toMin(h[1]) } : null;
  }

  function shopStatus() {
    var now = shopNow();
    var today = hoursFor(now.day);
    if (today && now.minutes >= today.open && now.minutes < today.close) {
      return { open: true, label: 'Open now', detail: 'until ' + fmtTime(today.close) };
    }
    if (today && now.minutes < today.open) {
      return { open: false, label: 'Closed', detail: 'opens today at ' + fmtTime(today.open) };
    }
    for (var i = 1; i <= 7; i++) {
      var day = (now.day + i) % 7;
      var h = hoursFor(day);
      if (h) {
        var when = i === 1 ? 'tomorrow' : DAY_NAMES[day];
        return { open: false, label: 'Closed', detail: 'opens ' + when + ' at ' + fmtTime(h.open) };
      }
    }
    return { open: false, label: 'Closed', detail: '' };
  }

  function renderStatus() {
    var s = shopStatus();
    qsa('[data-shop-status]').forEach(function (el) {
      el.innerHTML = '<span class="status-dot' + (s.open ? ' is-open' : '') + '" aria-hidden="true"></span>' +
        '<strong>' + s.label + '</strong>' + (s.detail ? ' <span>' + s.detail + '</span>' : '');
    });
  }

  function renderHours() {
    var now = shopNow();
    // Full weekly table, Monday first
    qsa('[data-hours="table"]').forEach(function (el) {
      var order = [1, 2, 3, 4, 5, 6, 0];
      el.innerHTML = order.map(function (d) {
        var h = hoursFor(d);
        var isToday = d === now.day;
        return '<div class="hours-row' + (isToday ? ' is-today' : '') + '">' +
          '<dt>' + DAY_NAMES[d] + (isToday ? ' <span class="today-tag">Today</span>' : '') + '</dt>' +
          '<dd>' + (h ? fmtTime(h.open) + '–' + fmtTime(h.close) : 'Closed') + '</dd></div>';
      }).join('');
    });
    // Compact: groups consecutive days with the same hours
    qsa('[data-hours="compact"]').forEach(function (el) {
      var order = [1, 2, 3, 4, 5, 6, 0];
      var groups = [];
      order.forEach(function (d) {
        var key = C.hours[d] ? C.hours[d].join('-') : 'closed';
        var last = groups[groups.length - 1];
        if (last && last.key === key) last.days.push(d); else groups.push({ key: key, days: [d] });
      });
      el.innerHTML = groups.map(function (g) {
        var first = g.days[0], lastD = g.days[g.days.length - 1];
        var label = g.days.length > 1 ? DAY_SHORT[first] + '–' + DAY_SHORT[lastD] : DAY_NAMES[first];
        var h = hoursFor(first);
        return '<div class="hours-row"><dt>' + label + '</dt><dd>' + (h ? fmtTime(h.open) + '–' + fmtTime(h.close) : 'Closed') + '</dd></div>';
      }).join('');
    });
  }

  /* Fill contact details from config so they only live in one place */
  function bindConfig() {
    var a = C.address;
    var values = {
      phone: C.phone,
      street: a.street,
      cityline: a.city + ', ' + a.state + ' ' + a.zip,
      address: a.street + ', ' + a.city + ', ' + a.state + ' ' + a.zip,
      email: C.email,
      owner: C.owner,
      minimum: money(C.ordering.minimumOrder)
    };
    var hrefs = {
      phone: C.phoneHref,
      directions: C.directionsUrl,
      email: C.email ? 'mailto:' + C.email : '',
      facebook: C.social.facebook,
      instagram: C.social.instagram
    };
    qsa('[data-bind]').forEach(function (el) {
      var v = values[el.getAttribute('data-bind')];
      if (v) el.textContent = v;
    });
    qsa('[data-bind-href]').forEach(function (el) {
      var key = el.getAttribute('data-bind-href');
      if (hrefs[key]) el.setAttribute('href', hrefs[key]);
      else if (el.hasAttribute('data-hide-empty')) el.hidden = true;
    });
    qsa('[data-map-embed]').forEach(function (el) { if (!el.src) el.src = C.mapEmbedUrl; });
    qsa('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
    qsa('[data-demo-note]').forEach(function (el) { el.hidden = !C.demoMode; });
  }

  /* ------------------------------------------------------------------
     Header: mobile nav, stuck shadow, cart count
     ------------------------------------------------------------------ */
  function initHeader() {
    var header = qs('.site-header');
    if (!header) return;
    var toggle = qs('[data-nav-toggle]', header);
    var nav = qs('#site-nav');
    function setOpen(open) {
      header.classList.toggle('nav-open', open);
      if (toggle) {
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        toggle.innerHTML = icon(open ? 'x' : 'list');
      }
    }
    if (toggle) {
      toggle.addEventListener('click', function () { setOpen(!header.classList.contains('nav-open')); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && header.classList.contains('nav-open')) { setOpen(false); toggle.focus(); }
      });
      if (nav) nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
      window.matchMedia('(min-width: 960px)').addEventListener('change', function (m) { if (m.matches) setOpen(false); });
    }
    var sentinel = qs('[data-header-sentinel]');
    if (sentinel && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        header.classList.toggle('is-stuck', !entries[0].isIntersecting);
      }).observe(sentinel);
    }
  }

  function renderCartCount() {
    var n = Cart.count();
    qsa('[data-cart-count]').forEach(function (el) {
      el.textContent = n;
      el.hidden = n === 0;
    });
    qsa('[data-cart-button]').forEach(function (btn) {
      btn.setAttribute('aria-label', n ? 'Your order, ' + n + (n === 1 ? ' item' : ' items') : 'Your order is empty');
    });
  }
  function bumpCartButton() {
    if (reduceMotion) return;
    qsa('[data-cart-button]').forEach(function (btn) {
      btn.classList.remove('is-bumped');
      void btn.offsetWidth;
      btn.classList.add('is-bumped');
    });
  }

  /* ------------------------------------------------------------------
     Toasts
     ------------------------------------------------------------------ */
  var toastRegion;
  function toast(message, action) {
    if (!toastRegion) {
      toastRegion = document.createElement('div');
      toastRegion.className = 'toast-region';
      toastRegion.setAttribute('role', 'status');
      toastRegion.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastRegion);
    }
    // Modal dialogs sit in the top layer, so the toast has to live inside the open one to be seen
    var host = qs('dialog[open]:not(.is-closing)') || document.body;
    if (toastRegion.parentNode !== host) host.appendChild(toastRegion);
    var t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = icon('check-circle', 'toast__icon') + '<span class="toast__msg">' + esc(message) + '</span>';
    if (action) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'toast__action';
      b.textContent = action.label;
      b.addEventListener('click', function () { action.onClick(); dismiss(); });
      t.appendChild(b);
    }
    toastRegion.innerHTML = '';
    toastRegion.appendChild(t);
    var timer = setTimeout(dismiss, 4200);
    function dismiss() {
      clearTimeout(timer);
      t.classList.add('is-leaving');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, reduceMotion ? 0 : 220);
    }
  }

  // When a dialog closes, move the toast back to the page so it stays visible
  document.addEventListener('close', function () {
    if (toastRegion && toastRegion.parentNode !== document.body) document.body.appendChild(toastRegion);
  }, true);

  /* ------------------------------------------------------------------
     Item cards (used on the home, menu and catering pages)
     ------------------------------------------------------------------ */
  function mediaHTML(item, cls) {
    if (item.image) {
      return '<img class="' + cls + '" src="' + esc(item.image) + '" alt="' + esc(item.name) + '" loading="lazy" decoding="async">';
    }
    return '<span class="' + cls + ' ph" data-placeholder="' + esc(item.id) + '" aria-hidden="true">' +
      icon('fork-knife', 'ph__icon') + '<span class="ph__label">Photo</span></span>';
  }
  function priceLabel(item) {
    return (Menu.hasSizes(item) ? 'From ' : '') + money(Menu.fromPrice(item));
  }
  function cardHTML(item, variant) {
    if (variant === 'offer') {
      return '<button type="button" class="offer" data-add-item="' + esc(item.id) + '">' +
        '<span class="offer__text"><span class="offer__name">' + esc(item.name) + '</span>' +
        (item.desc ? '<span class="offer__desc">' + esc(item.desc) + '</span>' : '') + '</span>' +
        '<span class="offer__price num">' + money(Menu.fromPrice(item)).replace('.00', '') + '</span>' +
        '<span class="offer__cta">Customize</span></button>';
    }
    if (variant === 'feature') {
      return '<article class="feature-item">' +
        '<div class="feature-item__media">' + mediaHTML(item, 'feature-item__img') + '</div>' +
        '<div class="feature-item__body">' +
          '<h2 class="feature-item__name">' + esc(item.name) + '</h2>' +
          (item.desc ? '<p class="feature-item__desc">' + esc(item.desc) + '</p>' : '') +
          '<p class="feature-item__price num">' + priceLabel(item) + '</p>' +
          '<button type="button" class="btn btn--primary" data-add-item="' + esc(item.id) + '">Customize and add</button>' +
        '</div></article>';
    }
    var badge = item.badge ? '<span class="badge">' + esc(item.badge) + '</span>' : '';
    var desc = item.desc ? '<span class="item__desc">' + esc(item.desc) + '</span>' : '';
    return '<button type="button" class="item item--' + (variant || 'row') + '" data-add-item="' + esc(item.id) + '">' +
      '<span class="item__media-wrap">' + mediaHTML(item, 'item__media') + '</span>' +
      '<span class="item__body">' +
        '<span class="item__name">' + esc(item.name) + badge + '</span>' + desc +
        '<span class="item__price">' + priceLabel(item) + '</span>' +
      '</span>' +
      '<span class="item__add" aria-hidden="true">' + icon('plus') + '</span>' +
      '<span class="visually-hidden">, customize and add to order</span>' +
    '</button>';
  }

  /* ------------------------------------------------------------------
     Customizer dialog
     ------------------------------------------------------------------ */
  var cz = null;       // dialog element
  var state = null;    // { item, sel, qty, notes, lineId }

  function lockScroll(on) { document.documentElement.classList.toggle('is-locked', on); }

  function buildCustomizer() {
    cz = document.createElement('dialog');
    cz.className = 'sheet';
    cz.id = 'customizer';
    cz.setAttribute('aria-labelledby', 'cz-title');
    cz.innerHTML =
      '<div class="sheet__panel">' +
        '<button type="button" class="icon-btn sheet__close" data-cz-close aria-label="Close">' + icon('x') + '</button>' +
        '<div class="sheet__scroll">' +
          '<div class="sheet__media" data-cz-media></div>' +
          '<div class="sheet__head">' +
            '<h2 class="sheet__title" id="cz-title"></h2>' +
            '<p class="sheet__desc" data-cz-desc></p>' +
            '<p class="sheet__base" data-cz-base></p>' +
          '</div>' +
          '<div class="sheet__groups" data-cz-groups></div>' +
          '<div class="field sheet__notes">' +
            '<label class="field__label" for="cz-notes">Special instructions <span class="field__opt">Optional</span></label>' +
            '<textarea id="cz-notes" class="input" rows="2" maxlength="160" data-cz-notes></textarea>' +
          '</div>' +
        '</div>' +
        '<div class="sheet__footer">' +
          '<div class="stepper" role="group" aria-label="Quantity">' +
            '<button type="button" class="stepper__btn" data-cz-qty="-1" aria-label="Decrease quantity">' + icon('minus') + '</button>' +
            '<output class="stepper__val" data-cz-qty-val aria-live="polite">1</output>' +
            '<button type="button" class="stepper__btn" data-cz-qty="1" aria-label="Increase quantity">' + icon('plus') + '</button>' +
          '</div>' +
          '<button type="button" class="btn btn--primary btn--block sheet__add" data-cz-add>' +
            '<span data-cz-add-label>Add to order</span><span class="sheet__add-price" data-cz-total></span>' +
          '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(cz);

    cz.addEventListener('click', function (e) {
      if (e.target === cz) return closeDialog(cz); // backdrop
      if (e.target.closest('[data-cz-close]')) return closeDialog(cz);
      var q = e.target.closest('[data-cz-qty]');
      if (q) { state.qty = Math.max(1, Math.min(99, state.qty + +q.getAttribute('data-cz-qty'))); return updateFooter(); }
      var step = e.target.closest('[data-count-step]');
      if (step) return onCountStep(step);
      if (e.target.closest('[data-cz-add]')) return submitCustomizer();
    });
    cz.addEventListener('change', onOptionChange);
    cz.addEventListener('input', function (e) { if (e.target.matches('[data-cz-notes]')) state.notes = e.target.value; });
    cz.addEventListener('cancel', function (e) { e.preventDefault(); closeDialog(cz); });
    cz.addEventListener('close', function () { lockScroll(false); });
  }

  function groupBadge(g, errors) {
    var sel = state.sel[g.id];
    if (g.type === 'included') return '<span class="pill pill--quiet">Included</span>';
    if (g.type === 'count') {
      var n = Menu.countTotal(sel);
      return '<span class="pill' + (n === g.count ? ' pill--done' : ' pill--req') + '">' + n + ' of ' + g.count + '</span>';
    }
    if (g.type === 'multi' && g.min) {
      var c = (sel || []).length;
      return '<span class="pill' + (c >= g.min ? ' pill--done' : ' pill--req') + '">' + (c >= g.min ? icon('check') + 'Done' : 'Choose ' + g.min) + '</span>';
    }
    if (g.required && (g.type === 'single' || g.type === 'size')) {
      var ok = !!Menu.findOpt(g, sel);
      return '<span class="pill' + (ok ? ' pill--done' : ' pill--req') + '">' + (ok ? icon('check') + 'Chosen' : 'Required') + '</span>';
    }
    return '<span class="pill pill--quiet">Optional</span>';
  }

  function groupHTML(g) {
    var sel = state.sel[g.id];
    var name = 'cz-' + g.id;
    var help = g.help ? '<p class="opt-group__help">' + esc(g.help) + '</p>' : '';
    var rows = '';

    if (g.type === 'count') {
      rows = g.options.map(function (op) {
        var n = (sel || {})[op.id] || 0;
        var full = Menu.countTotal(sel) >= g.count;
        return '<div class="opt opt--count' + (n ? ' is-on' : '') + '">' +
          '<span class="opt__label">' + esc(op.label) + '</span>' +
          '<span class="stepper stepper--sm" role="group" aria-label="' + esc(op.label) + ' quantity">' +
            '<button type="button" class="stepper__btn" data-count-step="-1" data-group="' + g.id + '" data-opt="' + op.id + '" aria-label="Remove one ' + esc(op.label) + '"' + (n ? '' : ' disabled') + '>' + icon('minus') + '</button>' +
            '<output class="stepper__val">' + n + '</output>' +
            '<button type="button" class="stepper__btn" data-count-step="1" data-group="' + g.id + '" data-opt="' + op.id + '" aria-label="Add one ' + esc(op.label) + '"' + (full ? ' disabled' : '') + '>' + icon('plus') + '</button>' +
          '</span></div>';
      }).join('');
    } else {
      var isRadio = g.type === 'size' || g.type === 'single';
      var atMax = g.type === 'multi' && g.max && (sel || []).length >= g.max;
      rows = g.options.map(function (op) {
        var checked = isRadio ? sel === op.id : (sel || []).indexOf(op.id) !== -1;
        var disabled = !checked && atMax;
        var price = '';
        if (g.type === 'size') price = money(op.price);
        else if (op.price) price = '+' + money(op.price);
        var removed = g.type === 'included' && !checked;
        return '<label class="opt' + (checked ? ' is-on' : '') + (removed ? ' is-removed' : '') + (disabled ? ' is-disabled' : '') + '">' +
          '<input type="' + (isRadio ? 'radio' : 'checkbox') + '" name="' + name + '" value="' + op.id + '" data-group="' + g.id + '"' +
            (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + '>' +
          '<span class="opt__control opt__control--' + (isRadio ? 'radio' : 'check') + '" aria-hidden="true">' + (isRadio ? '' : icon('check')) + '</span>' +
          '<span class="opt__label">' + esc(op.label) + '</span>' +
          (removed ? '<span class="opt__meta">Removed</span>' : '') +
          (price ? '<span class="opt__price">' + price + '</span>' : '') +
        '</label>';
      }).join('');
    }

    return '<fieldset class="opt-group" data-group-id="' + g.id + '">' +
      '<legend class="opt-group__legend"><span class="opt-group__head">' +
        '<span class="opt-group__title">' + esc(g.title) + '</span>' + groupBadge(g) +
      '</span></legend>' + help +
      '<div class="opt-list">' + rows + '</div>' +
      '<p class="opt-group__error" id="cz-err-' + g.id + '" hidden></p>' +
    '</fieldset>';
  }

  function renderGroups(keepFocus) {
    var active = document.activeElement;
    var focusKey = active && active.closest && active.closest('#customizer') ?
      (active.getAttribute('data-group') || '') + ':' + (active.value || active.getAttribute('data-opt') || '') + ':' + (active.getAttribute('data-count-step') || '') : null;
    var wrap = qs('[data-cz-groups]', cz);
    wrap.innerHTML = state.item.groups.map(groupHTML).join('');
    if (keepFocus && focusKey) {
      var parts = focusKey.split(':');
      var el = parts[2] ?
        qs('[data-count-step="' + parts[2] + '"][data-group="' + parts[0] + '"][data-opt="' + parts[1] + '"]', wrap) :
        qs('input[data-group="' + parts[0] + '"][value="' + parts[1] + '"]', wrap);
      if (el && !el.disabled) el.focus();
      else if (el) { var alt = qs('[data-group="' + parts[0] + '"][data-opt="' + parts[1] + '"]:not([disabled])', wrap); if (alt) alt.focus(); }
    }
    if (state.showErrors) showErrors(false);
  }

  function updateFooter() {
    var unit = Menu.unitPrice(state.item, state.sel);
    qs('[data-cz-total]', cz).textContent = money(unit * state.qty);
    qs('[data-cz-qty-val]', cz).textContent = state.qty;
    qs('[data-cz-qty="-1"]', cz).disabled = state.qty <= 1;
    qs('[data-cz-base]', cz).textContent = money(unit) + (state.qty > 1 ? ' each' : '');
  }

  function onOptionChange(e) {
    var input = e.target;
    if (!input.matches('input[data-group]')) return;
    var gid = input.getAttribute('data-group');
    var g = state.item.groups.filter(function (x) { return x.id === gid; })[0];
    if (!g) return;
    if (input.type === 'radio') {
      state.sel[gid] = input.value;
    } else {
      var arr = state.sel[gid] || [];
      if (input.checked) { if (arr.indexOf(input.value) === -1) arr.push(input.value); }
      else arr = arr.filter(function (v) { return v !== input.value; });
      state.sel[gid] = arr;
    }
    Menu.applyLinks(state.item, state.sel, gid, input.value, input.checked);
    renderGroups(true);
    updateFooter();
  }

  function onCountStep(btn) {
    var gid = btn.getAttribute('data-group'), oid = btn.getAttribute('data-opt');
    var g = state.item.groups.filter(function (x) { return x.id === gid; })[0];
    var v = state.sel[gid] || {};
    var delta = +btn.getAttribute('data-count-step');
    var total = Menu.countTotal(v);
    if (delta > 0 && total >= g.count) return;
    v[oid] = Math.max(0, (v[oid] || 0) + delta);
    if (!v[oid]) delete v[oid];
    state.sel[gid] = v;
    renderGroups(true);
    updateFooter();
  }

  function showErrors(scroll) {
    var errors = Menu.validate(state.item, state.sel);
    var first = null;
    qsa('.opt-group', cz).forEach(function (fs) {
      var gid = fs.getAttribute('data-group-id');
      var err = qs('.opt-group__error', fs);
      if (errors[gid]) {
        fs.classList.add('has-error');
        fs.setAttribute('aria-describedby', 'cz-err-' + gid);
        err.innerHTML = icon('warning-circle') + '<span>' + errors[gid] + '</span>';
        err.hidden = false;
        if (!first) first = fs;
      } else {
        fs.classList.remove('has-error');
        fs.removeAttribute('aria-describedby');
        err.hidden = true;
      }
    });
    if (scroll && first) {
      first.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      var f = qs('input:not([disabled]), button:not([disabled])', first);
      if (f) f.focus({ preventScroll: true });
    }
    return Object.keys(errors).length === 0;
  }

  function submitCustomizer() {
    state.showErrors = true;
    if (!showErrors(true)) return;
    var item = state.item;
    var sel = JSON.parse(JSON.stringify(state.sel));
    if (state.lineId) {
      Cart.update(state.lineId, { sel: sel, qty: state.qty, notes: (state.notes || '').trim() });
      closeDialog(cz);
      toast('Updated ' + item.name);
    } else {
      Cart.add(item.id, sel, state.qty, state.notes);
      closeDialog(cz);
      bumpCartButton();
      toast('Added ' + (state.qty > 1 ? state.qty + ' × ' : '') + item.name, { label: 'View order', onClick: openCart });
    }
  }

  function openCustomizer(itemId, lineId) {
    var item = Menu.get(itemId);
    if (!item) return;
    if (!cz) buildCustomizer();
    var line = lineId ? Cart.get(lineId) : null;
    state = {
      item: item,
      sel: line ? JSON.parse(JSON.stringify(line.sel)) : Menu.defaults(item),
      qty: line ? line.qty : 1,
      notes: line ? line.notes : '',
      lineId: line ? line.lineId : null,
      showErrors: false
    };
    // make sure older saved lines still have every group
    var d = Menu.defaults(item);
    Object.keys(d).forEach(function (k) { if (!(k in state.sel)) state.sel[k] = d[k]; });

    qs('#cz-title', cz).textContent = item.name;
    var desc = qs('[data-cz-desc]', cz);
    var cat = Menu.categoryOf(item.id);
    desc.textContent = item.desc || (cat && cat.note) || '';
    desc.hidden = !desc.textContent;
    qs('[data-cz-media]', cz).innerHTML = mediaHTML(item, 'sheet__img');
    var notes = qs('[data-cz-notes]', cz);
    notes.value = state.notes;
    notes.placeholder = item.notesPlaceholder || 'For example: light mayo, cut in half';
    qs('[data-cz-add-label]', cz).textContent = line ? 'Update item' : 'Add to order';
    cz.classList.toggle('sheet--simple', !item.groups.length);
    renderGroups(false);
    updateFooter();
    qs('.sheet__scroll', cz).scrollTop = 0;
    openDialog(cz);
  }

  function openDialog(dlg) {
    closeDialog(qs('dialog[open]'), true);
    dlg.classList.remove('is-closing');
    dlg.showModal();
    lockScroll(true);
  }
  function closeDialog(dlg, instant) {
    if (!dlg || !dlg.open) return;
    if (instant || reduceMotion) { dlg.close(); return; }
    dlg.classList.add('is-closing');
    setTimeout(function () { dlg.classList.remove('is-closing'); dlg.close(); }, 180);
  }

  /* ------------------------------------------------------------------
     Cart rendering (drawer + menu-page sidebar + checkout summary)
     ------------------------------------------------------------------ */
  function cartSummaryHTML(opts) {
    var sub = Cart.subtotal();
    var min = C.ordering.minimumOrder;
    var tax = C.ordering.taxRate;
    var rows = '<div class="sum-row"><span>Subtotal</span><span class="num">' + money(sub) + '</span></div>';
    if (typeof tax === 'number') {
      rows += '<div class="sum-row sum-row--muted"><span>Estimated tax</span><span class="num">' + money(sub * tax) + '</span></div>' +
        '<div class="sum-row sum-row--total"><span>Estimated total</span><span class="num">' + money(sub * (1 + tax)) + '</span></div>';
    } else {
      rows += '<div class="sum-row sum-row--muted"><span>Tax</span><span>Added at payment</span></div>';
    }
    var cta = '';
    if (opts && opts.checkout) {
      if (sub < min) {
        var pct = Math.max(4, Math.min(100, (sub / min) * 100));
        cta = '<div class="min-note" role="note">' +
          '<div class="min-note__bar"><span style="width:' + pct.toFixed(0) + '%"></span></div>' +
          '<p>Add <strong>' + money(min - sub) + '</strong> more to check out. Online orders have a ' + money(min) + ' minimum.</p></div>' +
          '<button type="button" class="btn btn--primary btn--block" disabled>Go to checkout</button>';
      } else {
        cta = '<a class="btn btn--primary btn--block" href="checkout.html"><span>Go to checkout</span><span class="num">' + money(sub) + '</span></a>';
      }
      cta += '<p class="pickup-note">' + icon('storefront') + '<span>Pickup only at <span data-bind="street">' + esc(C.address.street) + '</span></span></p>';
    }
    return '<div class="cart-summary">' + rows + cta + '</div>';
  }

  function cartLinesHTML(opts) {
    var editable = !(opts && opts.readOnly);
    return '<ul class="cart-lines">' + Cart.lines().map(function (l) {
      var item = Menu.get(l.itemId);
      var mods = Menu.describe(item, l.sel);
      return '<li class="cart-line" data-line="' + l.lineId + '">' +
        '<div class="cart-line__main">' +
          '<p class="cart-line__name">' + (editable ? '' : '<span class="cart-line__qty">' + l.qty + '×</span> ') + esc(item.name) + '</p>' +
          (mods.length ? '<p class="cart-line__mods">' + esc(mods.join(', ')) + '</p>' : '') +
          (l.notes ? '<p class="cart-line__notes">“' + esc(l.notes) + '”</p>' : '') +
          (editable ? '<div class="cart-line__actions">' +
            '<button type="button" class="link-btn" data-edit-line="' + l.lineId + '">' + icon('pencil-simple') + 'Edit</button>' +
            '<button type="button" class="link-btn link-btn--danger" data-remove-line="' + l.lineId + '">' + icon('trash') + 'Remove</button>' +
          '</div>' : '') +
        '</div>' +
        '<div class="cart-line__side">' +
          '<span class="cart-line__price num">' + money(Cart.lineTotal(l)) + '</span>' +
          (editable ? '<span class="stepper stepper--sm" role="group" aria-label="Quantity of ' + esc(item.name) + '">' +
            '<button type="button" class="stepper__btn" data-line-step="-1" data-line-id="' + l.lineId + '" aria-label="' + (l.qty === 1 ? 'Remove ' : 'One fewer ') + esc(item.name) + '">' + icon(l.qty === 1 ? 'trash' : 'minus') + '</button>' +
            '<output class="stepper__val">' + l.qty + '</output>' +
            '<button type="button" class="stepper__btn" data-line-step="1" data-line-id="' + l.lineId + '" aria-label="One more ' + esc(item.name) + '"' + (l.qty >= 99 ? ' disabled' : '') + '>' + icon('plus') + '</button>' +
          '</span>' : '') +
        '</div>' +
      '</li>';
    }).join('') + '</ul>';
  }

  function emptyCartHTML(onMenuPage) {
    return '<div class="cart-empty">' +
      '<span class="cart-empty__icon">' + icon('bag') + '</span>' +
      '<p class="cart-empty__title">Your order is empty</p>' +
      '<p class="cart-empty__text">Pick something from the menu and it will show up here.</p>' +
      (onMenuPage ? '' : '<a class="btn btn--secondary" href="order.html">Browse the menu</a>') +
    '</div>';
  }

  function renderCart(container, opts) {
    if (!container) return;
    opts = opts || {};
    if (!Cart.count()) { container.innerHTML = emptyCartHTML(opts.onMenuPage); return; }
    container.innerHTML = cartLinesHTML(opts) + cartSummaryHTML({ checkout: !opts.readOnly && opts.checkout !== false });
  }

  // One delegated handler for every cart surface
  document.addEventListener('click', function (e) {
    var add = e.target.closest('[data-add-item]');
    if (add) { openCustomizer(add.getAttribute('data-add-item')); return; }
    if (e.target.closest('[data-cart-button]')) { openCart(); return; }
    var edit = e.target.closest('[data-edit-line]');
    if (edit) {
      var line = Cart.get(edit.getAttribute('data-edit-line'));
      if (line) { openCustomizer(line.itemId, line.lineId); }
      return;
    }
    var rm = e.target.closest('[data-remove-line]');
    if (rm) { removeLine(rm.getAttribute('data-remove-line')); return; }
    var step = e.target.closest('[data-line-step]');
    if (step) {
      var l = Cart.get(step.getAttribute('data-line-id'));
      if (!l) return;
      var next = l.qty + +step.getAttribute('data-line-step');
      if (next <= 0) removeLine(l.lineId); else Cart.update(l.lineId, { qty: Math.min(99, next) });
    }
  });

  function removeLine(lineId) {
    var l = Cart.get(lineId);
    if (!l) return;
    var snapshot = JSON.parse(JSON.stringify(l));
    var name = Menu.get(l.itemId).name;
    Cart.remove(lineId);
    toast('Removed ' + name, { label: 'Undo', onClick: function () { Cart.add(snapshot.itemId, snapshot.sel, snapshot.qty, snapshot.notes); } });
  }

  /* Cart drawer */
  var drawer = null;
  function buildDrawer() {
    drawer = document.createElement('dialog');
    drawer.className = 'drawer';
    drawer.id = 'cart-drawer';
    drawer.setAttribute('aria-labelledby', 'drawer-title');
    drawer.innerHTML =
      '<div class="drawer__panel">' +
        '<div class="drawer__head">' +
          '<h2 class="drawer__title" id="drawer-title">Your order</h2>' +
          '<button type="button" class="icon-btn" data-drawer-close aria-label="Close your order">' + icon('x') + '</button>' +
        '</div>' +
        '<div class="drawer__body" data-drawer-body></div>' +
      '</div>';
    document.body.appendChild(drawer);
    drawer.addEventListener('click', function (e) {
      if (e.target === drawer || e.target.closest('[data-drawer-close]')) closeDialog(drawer);
    });
    drawer.addEventListener('cancel', function (e) { e.preventDefault(); closeDialog(drawer); });
    drawer.addEventListener('close', function () { lockScroll(false); });
  }
  function openCart() {
    var panel = qs('[data-order-panel]');
    if (panel && window.matchMedia('(min-width: 1024px)').matches) {
      var h = qs('h2', panel);
      panel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      panel.classList.remove('is-flash'); void panel.offsetWidth; panel.classList.add('is-flash');
      return;
    }
    if (!drawer) buildDrawer();
    renderCart(qs('[data-drawer-body]', drawer), { onMenuPage: !!panel });
    openDialog(drawer);
  }

  Cart.subscribe(function () {
    renderCartCount();
    if (drawer && drawer.open) renderCart(qs('[data-drawer-body]', drawer), { onMenuPage: !!qs('[data-order-panel]') });
  });

  /* ------------------------------------------------------------------
     Contact-style forms (demo handler until a real one is connected)
     ------------------------------------------------------------------ */
  function fieldError(input, message) {
    var field = input.closest('.field');
    if (!field) return;
    var err = qs('.field__error', field);
    if (!err) {
      err = document.createElement('p');
      err.className = 'field__error';
      err.id = (input.id || input.name) + '-error';
      field.appendChild(err);
    }
    if (message) {
      err.innerHTML = icon('warning-circle') + '<span>' + esc(message) + '</span>';
      err.hidden = false;
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', err.id);
    } else {
      err.hidden = true;
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    }
  }
  function validateField(input) {
    var v = input.value.trim();
    var label = input.getAttribute('data-label') || 'This field';
    if (input.required && !v) return label + ' is required.';
    if (v && input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Enter an email like name@example.com.';
    if (v && input.type === 'tel' && v.replace(/\D/g, '').length < 10) return 'Enter a 10-digit phone number.';
    return '';
  }
  function validateForm(form) {
    var firstBad = null;
    qsa('input, textarea, select', form).forEach(function (input) {
      if (input.type === 'hidden' || input.disabled) return;
      var msg = validateField(input);
      fieldError(input, msg);
      if (msg && !firstBad) firstBad = input;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }
  function initForms() {
    qsa('form[data-validate]').forEach(function (form) {
      form.setAttribute('novalidate', '');
      form.addEventListener('focusout', function (e) {
        var t = e.target;
        if (t.matches('input, textarea') && t.getAttribute('aria-invalid') === 'true') fieldError(t, validateField(t));
      });
    });
    qsa('form[data-demo-form]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!validateForm(form)) return;
        var btn = qs('[type="submit"]', form);
        var original = btn.innerHTML;
        btn.disabled = true;
        btn.textContent = 'Sending…';
        var payload = {};
        new FormData(form).forEach(function (v, k) { payload[k] = v; });
        HaniniApp.sendContactForm(payload).then(function () {
          form.hidden = true;
          var ok = qs('[data-form-success]', form.parentNode);
          if (ok) { ok.hidden = false; ok.setAttribute('tabindex', '-1'); ok.focus(); }
        }).catch(function () {
          toast('Your message didn’t send. Call us at ' + C.phone + ' instead.');
        }).then(function () { btn.disabled = false; btn.innerHTML = original; });
      });
    });
  }

  /* ------------------------------------------------------------------
     Home page extras: featured items + a light hero entrance
     ------------------------------------------------------------------ */
  function renderFeatured() {
    qsa('[data-featured]').forEach(function (el) {
      el.innerHTML = Menu.featured.map(function (id) {
        var item = Menu.get(id);
        return item ? '<li>' + cardHTML(item, 'tile') + '</li>' : '';
      }).join('');
    });
    qsa('[data-items]').forEach(function (el) {
      el.innerHTML = el.getAttribute('data-items').split(',').map(function (id) {
        var item = Menu.get(id.trim());
        return item ? cardHTML(item, el.getAttribute('data-variant') || 'row') : '';
      }).join('');
    });
  }

  /* ------------------------------------------------------------------
     Public API + boot
     ------------------------------------------------------------------ */
  window.HaniniApp = {
    esc: esc, qs: qs, qsa: qsa, icon: icon, money: money,
    shopNow: shopNow, hoursFor: hoursFor, fmtTime: fmtTime, shopStatus: shopStatus,
    DAY_NAMES: DAY_NAMES, DAY_SHORT: DAY_SHORT,
    cardHTML: cardHTML, openCustomizer: openCustomizer, openCart: openCart,
    renderCart: renderCart, cartLinesHTML: cartLinesHTML, toast: toast,
    validateForm: validateForm, fieldError: fieldError,
    /* Replace with a real form service (Formspree, Netlify Forms, your own API…) */
    sendContactForm: function (data) {
      console.info('[Hanini demo] Contact form payload:', data);
      return new Promise(function (resolve) { setTimeout(resolve, 600); });
    }
  };

  function boot() {
    bindConfig();
    renderStatus();
    renderHours();
    initHeader();
    renderCartCount();
    renderFeatured();
    initForms();
    document.documentElement.classList.add('is-ready');
    setInterval(renderStatus, 60 * 1000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
