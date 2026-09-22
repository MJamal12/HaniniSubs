/* ==========================================================================
   Hanini Subs — menu engine + cart
   Menu: defaults, pricing, validation and plain-English summaries of a
         customer's choices.
   Cart: a small store saved to localStorage so the order follows the
         customer across pages. Prices are always recalculated from
         menu-data.js, never trusted from storage.
   ========================================================================== */
(function () {
  var data = window.HANINI_MENU;
  var byId = {};
  var categoryOf = {};
  data.categories.forEach(function (cat) {
    cat.items.forEach(function (item) {
      byId[item.id] = item;
      categoryOf[item.id] = cat;
    });
  });

  function round2(n) { return Math.round(n * 100) / 100; }
  function money(n) { return '$' + round2(n).toFixed(2); }
  function findOpt(group, id) {
    for (var i = 0; i < group.options.length; i++) if (group.options[i].id === id) return group.options[i];
    return null;
  }
  function defaultOpt(group) {
    for (var i = 0; i < group.options.length; i++) if (group.options[i].default) return group.options[i];
    return null;
  }

  var Menu = {
    categories: data.categories,
    featured: data.featured,
    get: function (id) { return byId[id] || null; },
    categoryOf: function (id) { return categoryOf[id] || null; },
    money: money,
    round2: round2,
    findOpt: findOpt,
    defaultOpt: defaultOpt,

    /* Lowest price, for "from $X" labels */
    fromPrice: function (item) {
      if (typeof item.price === 'number') return item.price;
      var size = item.groups.filter(function (g) { return g.type === 'size'; })[0];
      return Math.min.apply(null, size.options.map(function (o) { return o.price; }));
    },
    hasSizes: function (item) {
      return item.groups.some(function (g) { return g.type === 'size'; });
    },
    isCustomizable: function (item) { return item.groups.length > 0; },

    defaults: function (item) {
      var sel = {};
      item.groups.forEach(function (g) {
        if (g.type === 'size' || g.type === 'single') {
          var d = defaultOpt(g);
          sel[g.id] = d ? d.id : null;
        } else if (g.type === 'included') {
          sel[g.id] = g.options.map(function (o) { return o.id; });
        } else if (g.type === 'multi') {
          sel[g.id] = [];
        } else if (g.type === 'count') {
          sel[g.id] = {};
        }
      });
      return sel;
    },

    unitPrice: function (item, sel) {
      var total = typeof item.price === 'number' ? item.price : 0;
      item.groups.forEach(function (g) {
        var v = sel[g.id];
        if (g.type === 'size') {
          var s = findOpt(g, v) || defaultOpt(g) || g.options[0];
          total += s.price;
        } else if (g.type === 'single') {
          var opt = findOpt(g, v);
          if (opt) total += opt.price;
        } else if (g.type === 'multi' || g.type === 'included') {
          (v || []).forEach(function (id) { var op = findOpt(g, id); if (op) total += op.price; });
        } else if (g.type === 'count') {
          Object.keys(v || {}).forEach(function (id) { var op = findOpt(g, id); if (op) total += op.price * v[id]; });
        }
      });
      return round2(total);
    },

    /* Returns { groupId: 'message' } for anything still needed */
    validate: function (item, sel) {
      var errors = {};
      item.groups.forEach(function (g) {
        var v = sel[g.id];
        if ((g.type === 'single' || g.type === 'size') && g.required && !findOpt(g, v)) {
          errors[g.id] = 'Choose one to continue.';
        }
        if (g.type === 'multi' && g.min && (v || []).length < g.min) {
          var left = g.min - (v || []).length;
          errors[g.id] = 'Choose ' + left + ' more.';
        }
        if (g.type === 'count') {
          var n = Menu.countTotal(v);
          if (n < g.count) errors[g.id] = 'Choose ' + (g.count - n) + ' more.';
        }
      });
      return errors;
    },

    countTotal: function (v) {
      return Object.keys(v || {}).reduce(function (s, k) { return s + (v[k] || 0); }, 0);
    },

    /* Short human summary, e.g. ["Medium", "Provolone", "No onion", "+ Extra cheese"] */
    describe: function (item, sel) {
      var parts = [];
      item.groups.forEach(function (g) {
        var v = sel[g.id];
        if (g.type === 'size' || g.type === 'single') {
          var opt = findOpt(g, v);
          if (!opt) return;
          if (g.hideDefault && opt.default) return;
          parts.push(opt.short || opt.label);
        } else if (g.type === 'included') {
          g.options.forEach(function (op) {
            if ((v || []).indexOf(op.id) === -1) parts.push('No ' + op.label.toLowerCase());
          });
        } else if (g.type === 'multi') {
          var chosen = g.options.filter(function (op) { return (v || []).indexOf(op.id) !== -1; });
          if (g.plain && g.max && chosen.length) {
            parts.push(chosen.map(function (op) { return op.short || op.label; }).join(' & '));
          } else {
            chosen.forEach(function (op) { parts.push((g.plain ? '' : '+ ') + (op.short || op.label)); });
          }
        } else if (g.type === 'count') {
          g.options.forEach(function (op) {
            var n = (v || {})[op.id];
            if (n) parts.push(n + '× ' + op.label);
          });
        }
      });
      return parts;
    },

    /* Keeps linked options consistent after a change (e.g. removing lettuce
       also removes "Extra lettuce"; adding extra cheese restores a cheese). */
    applyLinks: function (item, sel, changedGroupId, changedOptId, checked) {
      var groupsById = {};
      item.groups.forEach(function (g) { groupsById[g.id] = g; });
      var changed = groupsById[changedGroupId];

      // An extra was just checked -> make sure its base is present
      if (changed && changed.type === 'multi' && checked) {
        var opt = findOpt(changed, changedOptId);
        if (opt && opt.extraOf && groupsById[opt.extraOf.group]) {
          var base = groupsById[opt.extraOf.group];
          if (opt.extraOf.option && base.type === 'included') {
            if (sel[base.id].indexOf(opt.extraOf.option) === -1) sel[base.id].push(opt.extraOf.option);
          }
          if (opt.extraOf.notOption && sel[base.id] === opt.extraOf.notOption) {
            var d = defaultOpt(base);
            sel[base.id] = d && d.id !== opt.extraOf.notOption ? d.id : base.options[0].id;
          }
        }
      }

      // A base was removed / set to "none" -> drop extras that depend on it
      item.groups.forEach(function (g) {
        if (g.type !== 'multi') return;
        sel[g.id] = (sel[g.id] || []).filter(function (id) {
          var op = findOpt(g, id);
          if (!op || !op.extraOf) return true;
          var b = groupsById[op.extraOf.group];
          if (!b) return true;
          if (op.extraOf.option && b.type === 'included') return sel[b.id].indexOf(op.extraOf.option) !== -1;
          if (op.extraOf.notOption) return sel[b.id] !== op.extraOf.notOption;
          return true;
        });
      });
      return sel;
    }
  };

  /* ---------------- Cart store ---------------- */
  var KEY = 'hanini-cart-v1';
  var listeners = [];
  var lines = [];

  function uid() { return 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function signature(itemId, sel, notes) {
    var norm = {};
    Object.keys(sel).sort().forEach(function (k) {
      var v = sel[k];
      if (Array.isArray(v)) norm[k] = v.slice().sort();
      else if (v && typeof v === 'object') {
        var c = {}; Object.keys(v).sort().forEach(function (x) { if (v[x]) c[x] = v[x]; }); norm[k] = c;
      } else norm[k] = v;
    });
    return itemId + '|' + JSON.stringify(norm) + '|' + (notes || '').trim().toLowerCase();
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      lines = (Array.isArray(parsed) ? parsed : []).filter(function (l) { return l && byId[l.itemId] && l.qty > 0; });
    } catch (e) { lines = []; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch (e) { /* storage unavailable: cart lasts for this page only */ }
    listeners.forEach(function (fn) { fn(Cart); });
  }

  var Cart = {
    lines: function () { return lines.slice(); },
    get: function (lineId) { return lines.filter(function (l) { return l.lineId === lineId; })[0] || null; },
    add: function (itemId, sel, qty, notes) {
      var sig = signature(itemId, sel, notes);
      var existing = lines.filter(function (l) { return signature(l.itemId, l.sel, l.notes) === sig; })[0];
      if (existing) existing.qty = Math.min(99, existing.qty + qty);
      else lines.push({ lineId: uid(), itemId: itemId, sel: sel, qty: qty, notes: (notes || '').trim() });
      save();
    },
    update: function (lineId, patch) {
      var l = Cart.get(lineId);
      if (!l) return;
      Object.keys(patch).forEach(function (k) { l[k] = patch[k]; });
      if (l.qty <= 0) Cart.remove(lineId); else save();
    },
    remove: function (lineId) {
      lines = lines.filter(function (l) { return l.lineId !== lineId; });
      save();
    },
    clear: function () { lines = []; save(); },
    count: function () { return lines.reduce(function (s, l) { return s + l.qty; }, 0); },
    lineTotal: function (l) { return round2(Menu.unitPrice(byId[l.itemId], l.sel) * l.qty); },
    subtotal: function () { return round2(lines.reduce(function (s, l) { return s + Cart.lineTotal(l); }, 0)); },
    subscribe: function (fn) { listeners.push(fn); }
  };

  load();
  // Keep tabs in sync
  window.addEventListener('storage', function (e) {
    if (e.key === KEY) { load(); listeners.forEach(function (fn) { fn(Cart); }); }
  });

  window.HaniniMenu = Menu;
  window.HaniniCart = Cart;
})();
