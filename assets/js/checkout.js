/* ==========================================================================
   Hanini Subs — checkout
   Everything up to payment runs here: pickup details, pickup time slots
   based on the shop's real hours, validation, and an order payload.

   ► CONNECTING PAYMENT LATER (e.g. Square)
     1. Mount the payment form inside #payment-slot.
     2. Replace HaniniCheckout.submitOrder() below so it tokenizes the card,
        sends `order` to your server, and resolves with { id } when paid.
     3. Set demoMode: false in config.js.
   ========================================================================== */
(function () {
  var C = window.HANINI_CONFIG;
  var App = window.HaniniApp;
  var Menu = window.HaniniMenu;
  var Cart = window.HaniniCart;
  var qs = App.qs, qsa = App.qsa, esc = App.esc, money = App.money, icon = App.icon;

  var root = qs('[data-checkout]');
  if (!root) return;
  var form = qs('[data-checkout-form]');
  var summary = qs('[data-checkout-summary]');
  var slotSelect = qs('[data-pickup-slot]');
  var slotField = qs('[data-slot-field]');
  var asapChoice = qs('[data-asap-choice]');
  var hint = qs('[data-pickup-hint]');
  var confirmEl = qs('[data-confirm]');
  var placeBtn = qs('[data-place-order]');
  var O = C.ordering;

  window.HaniniCheckout = {
    /* Demo implementation — swap for your payment + order API. */
    submitOrder: function (order) {
      console.info('[Hanini demo] Order payload:', order);
      return new Promise(function (resolve) {
        setTimeout(function () { resolve({ id: order.id }); }, 900);
      });
    }
  };

  /* ---------- Pickup slots ---------- */
  function addDays(y, m, d, n) {
    var dt = new Date(Date.UTC(y, m - 1, d + n));
    return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate(), dow: dt.getUTCDay() };
  }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function buildSlots() {
    var now = App.shopNow();
    var step = O.pickupSlotMinutes;
    var days = [];
    for (var i = 0; i < 10 && days.length < O.daysAhead; i++) {
      var cal = addDays(now.y, now.m, now.d, i);
      var h = App.hoursFor(cal.dow);
      if (!h) continue;
      var start = h.open + step;
      var end = h.close - O.lastOrderBeforeCloseMinutes;
      if (i === 0) start = Math.max(start, Math.ceil((now.minutes + O.pickupLeadMinutes) / step) * step);
      if (start > end) continue;
      var label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : App.DAY_SHORT[cal.dow] + ', ' + MONTHS[cal.m - 1] + ' ' + cal.d;
      var dateStr = cal.y + '-' + String(cal.m).padStart(2, '0') + '-' + String(cal.d).padStart(2, '0');
      var times = [];
      for (var t = start; t <= end; t += step) times.push(t);
      days.push({ label: label, date: dateStr, times: times, full: App.DAY_NAMES[cal.dow] + ', ' + MONTHS[cal.m - 1] + ' ' + cal.d });
    }
    return days;
  }

  function asapAvailable() {
    var now = App.shopNow();
    var h = App.hoursFor(now.day);
    return !!h && now.minutes >= h.open && now.minutes <= h.close - O.lastOrderBeforeCloseMinutes;
  }

  var slotDays = [];
  function renderSlots() {
    slotDays = buildSlots();
    slotSelect.innerHTML = '<option value="">Choose a time</option>' + slotDays.map(function (day) {
      return '<optgroup label="' + esc(day.label) + '">' + day.times.map(function (t) {
        return '<option value="' + day.date + 'T' + String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0') +
          '" data-label="' + esc(day.label + ' at ' + App.fmtTime(t)) + '">' + esc(day.label + ', ' + App.fmtTime(t)) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');

    var canAsap = asapAvailable();
    var asapInput = qs('input', asapChoice);
    var laterInput = qs('input[value="later"]', form);
    asapChoice.classList.toggle('is-disabled', !canAsap);
    asapInput.disabled = !canAsap;
    if (!canAsap) {
      laterInput.checked = true;
      var st = App.shopStatus();
      hint.textContent = 'We’re closed right now (' + st.detail + '). Schedule your pickup for when we’re open.';
      hint.hidden = false;
    } else {
      hint.hidden = true;
    }
    syncWhen();
  }

  function syncWhen() {
    var later = qs('input[name="when"]:checked', form).value === 'later';
    slotField.hidden = !later;
    slotSelect.required = later;
  }
  qsa('input[name="when"]', form).forEach(function (r) { r.addEventListener('change', syncWhen); });

  /* ---------- Summary ---------- */
  function renderSummary() {
    var sub = Cart.subtotal();
    if (!Cart.count()) {
      root.innerHTML = '<div class="panel cart-empty cart-empty--page">' +
        '<span class="cart-empty__icon">' + icon('bag') + '</span>' +
        '<p class="cart-empty__title">Your order is empty</p>' +
        '<p class="cart-empty__text">Add something from the menu to check out.</p>' +
        '<a class="btn btn--primary" href="order.html">Browse the menu</a></div>';
      return false;
    }
    var tax = O.taxRate;
    var rows = '<div class="sum-row"><span>Subtotal</span><span class="num">' + money(sub) + '</span></div>';
    if (typeof tax === 'number') {
      rows += '<div class="sum-row sum-row--muted"><span>Estimated tax</span><span class="num">' + money(sub * tax) + '</span></div>' +
              '<div class="sum-row sum-row--total"><span>Estimated total</span><span class="num">' + money(sub * (1 + tax)) + '</span></div>';
    } else {
      rows += '<div class="sum-row sum-row--muted"><span>Tax</span><span>Added at payment</span></div>';
    }
    summary.innerHTML = App.cartLinesHTML({ readOnly: true }) + '<div class="cart-summary">' + rows + '</div>';
    var total = typeof tax === 'number' ? sub * (1 + tax) : sub;
    qs('[data-place-total]', placeBtn).textContent = money(total);

    var below = sub < O.minimumOrder;
    placeBtn.disabled = below;
    var minNote = qs('[data-min-warning]');
    minNote.hidden = !below;
    if (below) minNote.querySelector('span').textContent = 'Add ' + money(O.minimumOrder - sub) + ' more to place an online order. There’s a ' + money(O.minimumOrder) + ' minimum.';
    return true;
  }

  /* ---------- Submit ---------- */
  function phoneFormat(v) {
    var d = v.replace(/\D/g, '').slice(-10);
    return d.length === 10 ? '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6) : v;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (Cart.subtotal() < O.minimumOrder) return;
    if (!App.validateForm(form)) return;

    var when = qs('input[name="when"]:checked', form).value;
    var pickup;
    if (when === 'asap') {
      pickup = { type: 'asap', label: 'As soon as possible' };
    } else {
      var opt = slotSelect.options[slotSelect.selectedIndex];
      pickup = { type: 'scheduled', at: slotSelect.value, label: opt.getAttribute('data-label') };
    }

    var order = {
      id: 'H' + Date.now().toString(36).slice(-5).toUpperCase(),
      createdAt: new Date().toISOString(),
      source: 'website',
      fulfillment: 'pickup',
      customer: {
        name: form.elements.name.value.trim(),
        phone: phoneFormat(form.elements.phone.value.trim()),
        email: form.elements.email.value.trim()
      },
      pickup: pickup,
      notes: form.elements.notes.value.trim(),
      lines: Cart.lines().map(function (l) {
        var item = Menu.get(l.itemId);
        return {
          itemId: l.itemId,
          name: item.name,
          qty: l.qty,
          unitPrice: Menu.unitPrice(item, l.sel),
          lineTotal: Cart.lineTotal(l),
          modifiers: Menu.describe(item, l.sel),
          selections: l.sel,
          notes: l.notes
        };
      }),
      subtotal: Cart.subtotal(),
      taxRate: O.taxRate
    };

    placeBtn.disabled = true;
    placeBtn.classList.add('is-loading');
    qs('[data-place-label]', placeBtn).textContent = 'Placing order…';

    window.HaniniCheckout.submitOrder(order).then(function (res) {
      showConfirmation(order, res && res.id ? res.id : order.id);
      Cart.clear();
    }).catch(function () {
      placeBtn.disabled = false;
      placeBtn.classList.remove('is-loading');
      qs('[data-place-label]', placeBtn).textContent = 'Place pickup order';
      App.toast('We couldn’t place your order. Try again or call ' + C.phone + '.');
    });
  });

  function showConfirmation(order, id) {
    var lines = order.lines.map(function (l) {
      return '<li class="cart-line"><div class="cart-line__main"><p class="cart-line__name"><span class="cart-line__qty">' + l.qty + '×</span> ' + esc(l.name) + '</p>' +
        (l.modifiers.length ? '<p class="cart-line__mods">' + esc(l.modifiers.join(', ')) + '</p>' : '') +
        (l.notes ? '<p class="cart-line__notes">“' + esc(l.notes) + '”</p>' : '') +
        '</div><div class="cart-line__side"><span class="cart-line__price num">' + money(l.lineTotal) + '</span></div></li>';
    }).join('');
    var label = order.pickup.label;
    var pickupText = order.pickup.type === 'asap' ? 'as soon as it’s ready' :
      /^(Today|Tomorrow)/.test(label) ? label.charAt(0).toLowerCase() + label.slice(1) : 'on ' + label;
    confirmEl.innerHTML =
      '<div class="confirm__card panel">' +
        '<span class="confirm__icon">' + icon('check') + '</span>' +
        '<h2 class="confirm__title">Order placed</h2>' +
        '<p class="confirm__lead">Thanks, ' + esc(order.customer.name.split(' ')[0]) + '. Pick it up ' + esc(pickupText) +
          ' at ' + esc(C.address.street) + '.</p>' +
        '<dl class="confirm__facts">' +
          '<div><dt>Order number</dt><dd class="num">' + esc(id) + '</dd></div>' +
          '<div><dt>Pickup</dt><dd>' + esc(order.pickup.label) + '</dd></div>' +
          '<div><dt>Name</dt><dd>' + esc(order.customer.name) + '</dd></div>' +
        '</dl>' +
        (C.demoMode ? '<p class="demo-banner demo-banner--inline">' + icon('info') + '<span>Demo mode: no payment was taken and this order was not sent to the shop. The full order data is in the browser console.</span></p>' : '') +
        '<ul class="cart-lines">' + lines + '</ul>' +
        '<div class="sum-row sum-row--total"><span>Subtotal</span><span class="num">' + money(order.subtotal) + '</span></div>' +
        '<div class="btn-row"><a class="btn btn--primary" href="index.html">Back to home</a><a class="btn btn--secondary" data-bind-href="directions" href="' + esc(C.directionsUrl) + '" target="_blank" rel="noopener">Get directions</a></div>' +
      '</div>';
    root.hidden = true;
    qsa('.section > .container > [data-demo-note]').forEach(function (el) { el.hidden = true; });
    confirmEl.hidden = false;
    confirmEl.focus();
    window.scrollTo({ top: 0 });
  }

  /* ---------- Boot ---------- */
  if (renderSummary()) {
    renderSlots();
    setInterval(function () { var v = slotSelect.value; renderSlots(); slotSelect.value = v; }, 60 * 1000);
  }
  Cart.subscribe(function () { if (!root.hidden) renderSummary(); });
})();
