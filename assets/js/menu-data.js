/* ==========================================================================
   Hanini Subs — menu data
   Every item, price and customization option on the site comes from here.

   OPTION GROUP TYPES
     size      pick one size; the size price replaces the item price
     single    pick one (radio). Options can carry a price (+$1.00 etc.)
     included  comes on the item, pre-checked. Customer unchecks to remove.
     multi     optional add-ons (checkboxes), each with its own price
     count     choose exactly N with +/- steppers (party tray)

   OPTION FIELDS
     id, label, price (default 0), default (pre-selected for single/size),
     short (shorter label for the cart summary),
     extraOf { group, option } or { group, notOption } — ties an "extra" to
       the thing it's extra of (e.g. Extra lettuce needs lettuce on the sub)

   IMAGES
     Set `image: 'assets/img/food/italian-sub.jpg'` on any item and the
     photo replaces its placeholder everywhere on the site.

   Anything marked CONFIRM is a sensible default the owner should check.
   ========================================================================== */
(function () {
  function o(id, label, price, extra) {
    var opt = { id: id, label: label, price: price || 0 };
    if (extra) for (var k in extra) opt[k] = extra[k];
    return opt;
  }
  function sizes(list) {
    return { id: 'size', title: 'Size', type: 'size', required: true, options: list };
  }

  /* ---------- Shared option groups ---------- */
  var G = {};

  G.subBread = { id: 'bread', title: 'Bread', type: 'single', required: true, hideDefault: true, options: [
    o('roll', 'Sub roll', 0, { default: true }),
    o('wrap', 'Make it a wrap', 0, { short: 'As a wrap' })
  ]};

  G.cheese = { id: 'cheese', title: 'Cheese', type: 'single', required: true, options: [
    o('american', 'American', 0, { default: true }),
    o('provolone', 'Provolone'),
    o('none', 'No cheese')
  ]};

  G.subToppings = { id: 'toppings', title: 'Comes with', type: 'included',
    help: 'Uncheck anything you don’t want.', options: [
    o('lettuce', 'Lettuce'), o('tomato', 'Tomato'), o('onion', 'Onion'),
    o('mayo', 'Mayo'), o('mustard', 'Mustard')
  ]};

  G.makeHot = { id: 'hot', title: 'Hot or cold', type: 'multi', plain: true,
    help: 'Served cold unless you make it hot.', options: [
    o('hot', 'Make it hot', 0.50, { short: 'Made hot' })
  ]};

  G.subExtras = { id: 'extras', title: 'Extras', type: 'multi', options: [
    o('x-cheese', 'Extra cheese', 1.00, { extraOf: { group: 'cheese', notOption: 'none' } }),
    o('x-meat', 'Extra meat', 4.00)
  ]};

  G.subVeg = { id: 'veg', title: 'Extra veggies', type: 'multi', help: '$0.50 each', options: [
    o('x-lettuce', 'Extra lettuce', 0.50, { extraOf: { group: 'toppings', option: 'lettuce' } }),
    o('x-tomato', 'Extra tomato', 0.50, { extraOf: { group: 'toppings', option: 'tomato' } }),
    o('x-onion', 'Extra onion', 0.50, { extraOf: { group: 'toppings', option: 'onion' } }),
    // CONFIRM — which of these veggies the shop stocks
    o('pickles', 'Pickles', 0.50),
    o('banana-peppers', 'Banana peppers', 0.50),
    o('jalapenos', 'Jalapeños', 0.50),
    o('green-peppers', 'Green peppers', 0.50),
    o('black-olives', 'Black olives', 0.50)
  ]};

  /* Corned beef */
  G.cbBread = { id: 'bread', title: 'Bread', type: 'single', required: true, options: [
    o('white', 'White sub bread', 0, { default: true, short: 'White bread' }),
    o('wheat', 'Wheat sub bread', 0, { short: 'Wheat bread' })
  ]};
  G.cbToppings = { id: 'addons', title: 'Toppings', type: 'multi', help: 'Add as many as you like, no charge.', options: [
    // CONFIRM — standard toppings offered on plain corned beef
    o('mustard', 'Mustard'), o('mayo', 'Mayo'), o('lettuce', 'Lettuce'),
    o('tomato', 'Tomato'), o('onion', 'Onion')
  ]};
  G.cbCheese = { id: 'cheese', title: 'Cheese', type: 'single', required: true, hideDefault: true, options: [
    // CONFIRM — cheese prices on corned beef (uses the menu's $1.00 extra-cheese price)
    o('none', 'No cheese', 0, { default: true }),
    o('swiss', 'Swiss', 1.00),
    o('american', 'American', 1.00),
    o('provolone', 'Provolone', 1.00)
  ]};
  G.reubenToppings = { id: 'toppings', title: 'Comes with', type: 'included',
    help: 'Uncheck anything you don’t want.', options: [
    o('kraut', 'Sauerkraut'), o('swiss', 'Swiss cheese'), o('thousand', 'Thousand Island')
  ]};
  G.nyToppings = { id: 'toppings', title: 'Comes with', type: 'included',
    help: 'Uncheck anything you don’t want.', options: [
    o('kraut', 'Sauerkraut'), o('slaw', 'Cole slaw'), o('thousand', 'Thousand Island')
  ]};
  G.cbExtras = { id: 'extras', title: 'Extras', type: 'multi', options: [
    o('x-meat', 'Extra meat', 4.00)
  ]};
  G.reubenExtras = { id: 'extras', title: 'Extras', type: 'multi', options: [
    o('x-swiss', 'Extra Swiss cheese', 1.00, { extraOf: { group: 'toppings', option: 'swiss' } }),
    o('x-meat', 'Extra meat', 4.00)
  ]};

  /* Gyro */
  G.gyroToppings = { id: 'toppings', title: 'Comes with', type: 'included',
    help: 'Uncheck anything you don’t want.', options: [
    o('lettuce', 'Lettuce'), o('tomato', 'Tomato'), o('onion', 'Onion'), o('sauce', 'Gyro sauce')
  ]};
  G.gyroExtras = { id: 'extras', title: 'Extras', type: 'multi', options: [
    // CONFIRM — extras on gyros (prices borrowed from subs & salads)
    o('x-meat', 'Extra meat', 4.00),
    o('feta', 'Feta cheese', 1.00)
  ]};
  G.basicVeg = { id: 'veg', title: 'Extra veggies', type: 'multi', help: '$0.50 each', options: [
    o('x-lettuce', 'Extra lettuce', 0.50, { extraOf: { group: 'toppings', option: 'lettuce' } }),
    o('x-tomato', 'Extra tomato', 0.50, { extraOf: { group: 'toppings', option: 'tomato' } }),
    o('x-onion', 'Extra onion', 0.50, { extraOf: { group: 'toppings', option: 'onion' } })
  ]};

  /* Wraps */
  G.wrapSauce = { id: 'sauce', title: 'Sauce', type: 'single', required: true, options: [
    o('buffalo', 'Buffalo'), o('teriyaki', 'Teriyaki')
  ]};
  G.wrapToppings = { id: 'toppings', title: 'Comes with', type: 'included',
    help: 'Uncheck anything you don’t want.', options: [
    // CONFIRM — what comes in a Hanini wrap
    o('lettuce', 'Lettuce'), o('tomato', 'Tomato'), o('onion', 'Onion')
  ]};
  G.wrapExtras = { id: 'extras', title: 'Extras', type: 'multi', options: [
    o('x-meat', 'Additional meat', 4.00),
    o('x-cheese', 'Extra cheese', 1.00, { extraOf: { group: 'cheese', notOption: 'none' } })
  ]};

  /* Burger */
  G.burgerToppings = { id: 'toppings', title: 'Comes with', type: 'included',
    help: 'Uncheck anything you don’t want.', options: [
    // CONFIRM — standard burger toppings
    o('lettuce', 'Lettuce'), o('tomato', 'Tomato'), o('onion', 'Onion'), o('pickles', 'Pickles'),
    o('ketchup', 'Ketchup'), o('mustard', 'Mustard'), o('mayo', 'Mayo')
  ]};
  G.burgerCheese = { id: 'cheese', title: 'Cheese', type: 'single', required: true, options: [
    o('american', 'American', 0, { default: true }), o('provolone', 'Provolone')
  ]};
  G.burgerExtras = { id: 'extras', title: 'Extras', type: 'multi', options: [
    o('x-cheese', 'Extra cheese', 1.00)
  ]};

  /* Salads */
  G.dressing = { id: 'dressing', title: 'Dressing', type: 'single', required: true, options: [
    // CONFIRM — dressing list
    o('ranch', 'Ranch'), o('italian', 'Italian'), o('thousand', 'Thousand Island'),
    o('honey-mustard', 'Honey mustard'), o('caesar', 'Caesar'), o('balsamic', 'Balsamic vinaigrette'),
    o('none', 'No dressing')
  ]};
  G.dressingSide = { id: 'side', title: 'How to serve it', type: 'multi', plain: true, options: [
    o('on-side', 'Dressing on the side')
  ]};
  G.saladAddons = { id: 'addons', title: 'Add-ons', type: 'multi', options: [
    o('eggs', 'Two eggs', 1.50), o('croutons', 'Croutons', 1.00),
    o('feta', 'Feta cheese', 1.00), o('x-meat', 'Extra meat', 4.00)
  ]};
  G.twoMeats = { id: 'meats', title: 'Choose your two meats', type: 'multi', plain: true, min: 2, max: 2, required: true, options: [
    // CONFIRM — meats available on "Salad with any two meat"
    o('grilled-chicken', 'Grilled chicken'), o('crispy-chicken', 'Crispy chicken'),
    o('gyro', 'Gyro meat'), o('steak', 'Steak'), o('crab', 'Crab meat'),
    o('turkey', 'Turkey'), o('roast-beef', 'Roast beef')
  ]};
  G.loadedExtras = { id: 'extras', title: 'Extras', type: 'multi', options: [
    // CONFIRM — extras on loaded fries
    o('x-meat', 'Extra meat', 4.00), o('x-cheese', 'Extra cheese', 1.00)
  ]};

  /* New additions */
  G.tenderSide = { id: 'side', title: 'Choose your side', type: 'single', required: true, options: [
    o('fries', 'Fries', 0, { default: true }), o('jojos', 'JoJo’s')
  ]};
  G.bbqAddons = { id: 'addons', title: 'Add-ons', type: 'multi', options: [
    // CONFIRM
    o('cheese', 'Add cheese', 1.00), o('x-meat', 'Extra meat', 4.00)
  ]};
  G.polishToppings = { id: 'toppings', title: 'Comes with', type: 'included',
    help: 'Uncheck anything you don’t want.', options: [
    // CONFIRM — the classic Polish Boy build
    o('fries', 'Fries'), o('slaw', 'Coleslaw'), o('bbq', 'BBQ sauce')
  ]};

  /* Catering */
  G.partyTraySubs = { id: 'subs', title: 'Pick your 7 subs', type: 'count', count: 7, required: true,
    help: 'Mix and match any combination.', options: [
    // CONFIRM — which subs can go on a party tray
    o('italian', 'Italian'), o('crab', 'Crab Meat'), o('roast-beef', 'Roast Beef'),
    o('pastrami', 'Pastrami'), o('cold-cuts', 'Cold Cuts'), o('tuna', 'Tuna'),
    o('turkey-breast', 'Turkey Breast'), o('turkey-ham', 'Turkey Ham'),
    o('salami', 'Salami'), o('veggie', 'Veggie')
  ]};

  var coldSub = [G.subBread, G.cheese, G.subToppings, G.makeHot, G.subExtras, G.subVeg];
  var hotSub = [G.subBread, G.cheese, G.subToppings, G.subExtras, G.subVeg];
  var cbPlainSub = [G.cbBread, G.cbToppings, G.cbCheese, G.cbExtras];
  var cbReubenSub = [G.cbBread, G.reubenToppings, G.reubenExtras];
  var cbPlainSand = [G.cbToppings, G.cbCheese, G.cbExtras];
  var cbReubenSand = [G.reubenToppings, G.reubenExtras];
  var gyro = [G.gyroToppings, G.gyroExtras, G.basicVeg];
  var wrap = [G.wrapToppings, G.cheese, G.wrapExtras, G.basicVeg];
  var salad = [G.dressing, G.dressingSide, G.saladAddons];

  /* ---------- Categories & items ---------- */
  var categories = [
    {
      id: 'cold-subs', name: 'Cold Subs',
      note: 'Every sub comes with lettuce, tomato, onion, mayo, mustard and American or provolone. Make any cold sub hot for $0.50, or have it as a wrap.',
      items: [
        { id: 'italian-sub', name: 'Italian Sub', price: 12.99, groups: coldSub },
        { id: 'crab-meat-sub', name: 'Crab Meat', price: 12.99, groups: coldSub },
        { id: 'cold-roast-beef-sub', name: 'Roast Beef', price: 12.99, groups: coldSub },
        { id: 'cold-pastrami-sub', name: 'Pastrami', price: 12.99, groups: coldSub },
        { id: 'cold-cuts-sub', name: 'Cold Cuts', price: 11.99, groups: coldSub },
        { id: 'tuna-sub', name: 'Tuna', price: 11.99, groups: coldSub },
        { id: 'turkey-breast-sub', name: 'Turkey Breast', price: 10.99, groups: coldSub },
        { id: 'turkey-ham-sub', name: 'Turkey Ham', price: 10.99, groups: coldSub },
        { id: 'salami-sub', name: 'Salami', price: 10.99, groups: coldSub },
        { id: 'veggie-sub', name: 'Veggie', price: 9.99, groups: coldSub }
      ]
    },
    {
      id: 'hot-subs', name: 'Hot Subs',
      note: 'Same fixings as the cold subs: lettuce, tomato, onion, mayo, mustard and your choice of cheese.',
      items: [
        { id: 'steak-and-cheese', name: 'Steak & Cheese', price: 14.99, groups: hotSub },
        { id: 'chicken-philly', name: 'Chicken Philly', price: 14.99, groups: hotSub },
        { id: 'chicken-parmesan', name: 'Chicken Parmesan', price: 13.99, groups: hotSub },
        { id: 'hot-roast-beef-sub', name: 'Roast Beef', price: 13.49, groups: hotSub },
        { id: 'hot-pastrami-sub', name: 'Pastrami', price: 13.49, groups: hotSub },
        { id: 'turkey-bacon-sub', name: 'Turkey Bacon', price: 12.99, groups: hotSub },
        { id: 'meatball-sub', name: 'Meatball Sub', price: 11.99, groups: hotSub },
        { id: 'blt-sub', name: 'B.L.T.', price: 10.99, groups: hotSub },
        // Hot dog skips the sub/wrap choice
        { id: 'kosher-hot-dog', name: 'Kosher Hot Dog', price: 8.99, groups: [G.cheese, G.subToppings, G.subExtras, G.subVeg] }
      ]
    },
    {
      id: 'signature-subs', name: 'Signature Subs',
      note: 'Stacked combos with lettuce, tomato, onion, mayo, mustard and your choice of cheese.',
      items: [
        { id: 'the-hood', name: 'The Hood', desc: 'Roast beef & turkey', price: 12.99, groups: hotSub },
        { id: 'all-american-sub', name: 'All American Sub', desc: 'Turkey breast & turkey ham', price: 12.99, groups: hotSub },
        { id: 'marathon-club', name: 'Marathon Club', desc: 'Roast beef, pastrami & turkey', price: 13.99, groups: hotSub },
        { id: 'sig-roast-beef-turkey-ham', name: 'Roast Beef, Turkey & Turkey Ham', price: 13.99, groups: hotSub },
        { id: 'sig-turkey-corned-beef-ham', name: 'Turkey, Corned Beef & Turkey Ham', price: 14.99, groups: hotSub },
        { id: 'sig-corned-beef-ham-pastrami', name: 'Corned Beef, Turkey Ham & Pastrami', price: 14.99, groups: hotSub }
      ]
    },
    {
      id: 'corned-beef-subs', name: 'Corned Beef Subs',
      note: 'Piled on white or wheat sub bread.',
      items: [
        { id: 'corned-beef-sub', name: 'Corned Beef Sub', groups: [sizes([
            o('small', 'Small', 12.99, { default: true }), o('medium', 'Medium', 16.99), o('large', 'Large', 18.99)
          ])].concat(cbPlainSub) },
        { id: 'reuben-sub', name: 'Reuben Sub', desc: 'Corned beef, sauerkraut, Swiss & Thousand Island', groups: [sizes([
            o('small', 'Small', 13.99, { default: true }), o('medium', 'Medium', 17.99), o('large', 'Large', 19.99)
          ])].concat(cbReubenSub) },
        { id: 'turkey-reuben-sub', name: 'Turkey Reuben', desc: 'Turkey, sauerkraut, Swiss & Thousand Island', price: 13.99, groups: cbReubenSub },
        { id: 'new-york-reuben-sub', name: 'New York Reuben', desc: 'Pastrami, corned beef, sauerkraut, cole slaw & Thousand Island', price: 16.99, groups: [G.cbBread, G.nyToppings, G.cbExtras] },
        { id: 'windy-city-sub', name: 'Windy City Sub', desc: 'Corned beef, pastrami & gyro', price: 16.99, groups: cbPlainSub }
      ]
    },
    {
      id: 'corned-beef-sandwiches', name: 'Corned Beef Sandwiches',
      note: 'The same corned beef, served on rye bread.',
      items: [
        { id: 'corned-beef-sandwich', name: 'Corned Beef on Rye', groups: [sizes([
            o('small', 'Small', 11.99, { default: true }), o('medium', 'Medium', 15.99), o('large', 'Large', 17.99)
          ])].concat(cbPlainSand) },
        { id: 'reuben-sandwich', name: 'Reuben on Rye', desc: 'Corned beef, sauerkraut, Swiss & Thousand Island', groups: [sizes([
            o('small', 'Small', 12.99, { default: true }), o('medium', 'Medium', 16.99), o('large', 'Large', 18.99)
          ])].concat(cbReubenSand) },
        { id: 'turkey-reuben-sandwich', name: 'Turkey Reuben on Rye', desc: 'Turkey, sauerkraut, Swiss & Thousand Island', price: 12.99, groups: cbReubenSand },
        { id: 'new-york-reuben-sandwich', name: 'New York Reuben on Rye', desc: 'Pastrami, corned beef, sauerkraut, cole slaw & Thousand Island', price: 15.99, groups: [G.nyToppings, G.cbExtras] },
        { id: 'windy-city-sandwich', name: 'Windy City on Rye', desc: 'Corned beef, pastrami & gyro', price: 16.99, groups: cbPlainSand }
      ]
    },
    {
      id: 'gyros', name: 'Gyros',
      note: 'Served with lettuce, tomato, onion and gyro sauce.',
      items: [
        { id: 'gyro', name: 'Gyro', groups: [sizes([
            o('small', 'Small', 9.99, { default: true }), o('medium', 'Medium', 12.99), o('large', 'Large', 15.99)
          ])].concat(gyro) },
        { id: 'chicken-gyro', name: 'Chicken Gyro', price: 13.99, groups: gyro },
        { id: 'pita-bread', name: 'Pita Bread', price: 1.00, groups: [] }
      ]
    },
    {
      id: 'wraps', name: 'Hanini Wraps',
      note: 'Add more meat to any wrap for $4.00.',
      items: [
        { id: 'buffalo-teriyaki-wrap', name: 'Buffalo or Teriyaki Chicken Wrap', price: 14.99, groups: [G.wrapSauce].concat(wrap) },
        { id: 'grilled-chicken-wrap', name: 'Grilled Chicken Wrap', price: 14.99, groups: wrap },
        { id: 'steak-cheese-wrap', name: 'Steak & Cheese Wrap', price: 14.99, groups: wrap },
        { id: 'crispy-chicken-wrap', name: 'Crispy Chicken Wrap', price: 16.99, groups: wrap }
      ]
    },
    {
      id: 'salads', name: 'Salads & Loaded Fries',
      note: 'Add two eggs, croutons, feta or extra meat to any salad.',
      items: [
        { id: 'crispy-chicken-salad', name: 'Crispy Chicken Salad', price: 15.99, groups: salad },
        { id: 'grilled-chicken-salad', name: 'Grilled Chicken Salad', price: 14.99, groups: salad },
        { id: 'crab-meat-salad', name: 'Crab Meat Salad', price: 14.99, groups: salad },
        { id: 'chicken-fajita-salad', name: 'Chicken Fajita Salad', price: 14.99, groups: salad },
        { id: 'gyro-salad', name: 'Gyro Salad', price: 14.99, groups: salad },
        { id: 'garden-salad', name: 'Garden Salad', price: 9.99, groups: salad },
        { id: 'two-meat-salad', name: 'Salad with Any Two Meats', price: 17.99, groups: [G.twoMeats].concat(salad) },
        { id: 'tortilla-bowl-salad', name: 'Tortilla Bowl Salad', price: 16.99, groups: salad },
        { id: 'chicken-loaded-fries', name: 'Chicken Loaded Fries', price: 15.99, groups: [G.loadedExtras] },
        { id: 'steak-loaded-fries', name: 'Steak Loaded Fries', price: 15.99, groups: [G.loadedExtras] }
      ]
    },
    {
      id: 'burgers', name: 'Burgers',
      items: [
        { id: 'cheeseburger', name: 'Cheeseburger with Fries', price: 12.99, groups: [G.burgerCheese, G.burgerToppings, G.burgerExtras] }
      ]
    },
    {
      id: 'new-additions', name: 'New Additions',
      note: 'The newest things on the menu board.',
      items: [
        { id: 'chicken-tender-meal', name: 'Chicken Tender Meal', desc: 'With fries or JoJo’s', price: 14.99, badge: 'New', groups: [G.tenderSide] },
        { id: 'bbq-chicken-sandwich', name: 'BBQ Chicken Sandwich', price: 13.99, badge: 'New', groups: [G.bbqAddons] },
        { id: 'polish-boy', name: 'Polish Boy', badge: 'New', groups: [sizes([
            o('small', 'Small', 9.99, { default: true }), o('large', 'Large', 12.99)
          ]), G.polishToppings] }
      ]
    },
    {
      id: 'sides', name: 'Sides & Snacks',
      items: [
        { id: 'french-fries', name: 'French Fries', groups: [sizes([o('small', 'Small', 4.99, { default: true }), o('large', 'Large', 6.99)])] },
        { id: 'jojos', name: 'JoJo’s', groups: [sizes([o('small', 'Small', 4.99, { default: true }), o('large', 'Large', 6.99)])] },
        { id: 'onion-rings', name: 'Onion Rings', groups: [sizes([o('small', 'Small', 4.99, { default: true }), o('large', 'Large', 6.99)])] },
        { id: 'mozzarella-sticks', name: 'Mozzarella Sticks', groups: [sizes([o('small', 'Small', 4.99, { default: true }), o('large', 'Large', 6.99)])] },
        { id: 'funnel-fries', name: 'Funnel Fries', price: 5.99, groups: [] },
        { id: 'breaded-mushrooms', name: 'Breaded Mushrooms', price: 6.99, groups: [] },
        { id: 'breaded-okra', name: 'Breaded Okra', price: 6.99, groups: [] },
        { id: 'zucchini-sticks', name: 'Zucchini Sticks', price: 6.99, groups: [] },
        { id: 'pickle-chips', name: 'Pickle Chips', price: 6.99, groups: [] },
        { id: 'peppers-cheddar', name: 'Peppers with Cheddar Cheese', price: 6.99, groups: [] },
        { id: 'peppers-cream-cheese', name: 'Peppers with Cream Cheese', price: 6.99, groups: [] },
        { id: 'mild-cheddar', name: 'Mild Cheddar Cheese', price: 1.00, groups: [] }
      ]
    },
    {
      id: 'party', name: 'Party Subs & Trays',
      note: 'Order ahead for parties, offices and game day.',
      items: [
        { id: 'six-foot-sub', name: '6-Foot Long Sub', desc: 'A full six feet of sub with lettuce, tomato, onion, mayo, mustard and cheese.',
          price: 139.00, groups: [G.cheese, G.subToppings],
          notesPlaceholder: 'Which meats would you like? For example: half Italian, half turkey.' },
        { id: 'party-tray', name: 'Party Tray', desc: 'Seven subs, your choice of any mix.', price: 85.00, groups: [G.partyTraySubs, G.cheese, G.subToppings] }
      ]
    }
  ];

  /* Home page "Start here" picks — item ids from above */
  var featured = ['corned-beef-sub', 'gyro', 'steak-and-cheese', 'windy-city-sub', 'steak-loaded-fries', 'chicken-tender-meal'];

  window.HANINI_MENU = { categories: categories, featured: featured };
})();
