/* ==========================================================================
   Hanini Subs — site configuration
   Business details, hours and ordering rules live here. Every page reads
   from this file, so change a value once and it updates everywhere.
   Values marked CONFIRM still need the owner's sign-off.
   ========================================================================== */
window.HANINI_CONFIG = {
  name: 'Hanini Subs',
  legalName: 'Hanini Subs & Corned Beef',
  owner: 'Sam Al Jamel',

  phone: '(330) 835-9906',
  phoneHref: 'tel:+13308359906',
  email: '', // CONFIRM — business email for the contact form / receipts

  address: {
    street: '1318 Copley Road',
    city: 'Akron',
    state: 'OH',
    zip: '44320'
  },
  directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=Hanini+Subs+1318+Copley+Rd+Akron+OH+44320',
  mapEmbedUrl: 'https://www.google.com/maps?q=Hanini+Subs,+1318+Copley+Rd,+Akron,+OH+44320&output=embed',

  social: {
    facebook: '',  // CONFIRM — full URL, e.g. https://www.facebook.com/haninisubs
    instagram: ''  // CONFIRM — full URL
  },

  /* Hours are in the shop's local time zone. 0 = Sunday … 6 = Saturday.
     null means closed that day. Times are 24-hour "HH:MM". */
  timeZone: 'America/New_York',
  hours: {
    0: null,
    1: ['11:00', '21:00'],
    2: ['11:00', '21:00'],
    3: ['11:00', '21:00'],
    4: ['11:00', '21:00'],
    5: ['11:00', '21:00'],
    6: ['11:00', '21:00']
  },

  ordering: {
    pickupOnly: true,
    minimumOrder: 10.00,      // CONFIRM — online order minimum
    taxRate: null,            // CONFIRM — e.g. 0.0675. null shows "Added at payment".
    pickupLeadMinutes: 20,    // CONFIRM — earliest scheduled pickup after "now"
    pickupSlotMinutes: 15,
    lastOrderBeforeCloseMinutes: 15, // CONFIRM — stop taking online orders this long before close
    daysAhead: 3              // how many open days customers can schedule ahead
  },

  /* Demo mode: checkout and the contact form run end-to-end in the browser but
     nothing is charged or sent. Flip to false once payment (e.g. Square) and a
     form handler are connected in checkout.js / app.js. */
  demoMode: true
};
