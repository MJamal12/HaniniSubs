# Hanini Subs — website

A fast, static website for Hanini Subs & Corned Beef (1318 Copley Rd, Akron, OH) with a full online-ordering flow: menu, item customizer, cart, and pickup checkout. Payment is intentionally not connected yet; see **Connecting payment** below.

Plain HTML, CSS and JavaScript. No build step, no frameworks, no npm install, no external services. It runs from any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, cPanel) and also opens straight from the folder.

## Previewing

Double-click `index.html`, or run a local server from this folder (recommended, closer to production):

```
python3 -m http.server 8000      # then open http://localhost:8000
# or: npx serve .
```

## Pages

| File | What it is |
|---|---|
| `index.html` | Home: hero, hours/location, featured items, story teaser, party subs |
| `order.html` | Full menu with search, category nav, customizer and cart |
| `checkout.html` | Pickup details, pickup time, order summary, confirmation |
| `catering.html` | 6-foot sub and party tray |
| `about.html` | Owner story and the Akron City Council proclamation |
| `location.html` | Map, hours, directions and contact form |

## Where to change things

**Business info — `assets/js/config.js`.** Phone, address, hours, email, social links, pickup rules (minimum order, lead time, slot length, days ahead), and tax rate. Every page reads from this file, so an hours change here updates the header status, footer, home page, location page and checkout time slots at once.

**Menu — `assets/js/menu-data.js`.** Every item, price and customization option. The header comment explains the option types:

- `included`: toppings that come on the item. They start checked and the customer unchecks to remove.
- `multi`: optional add-ons with prices, shown as "+$0.50".
- `single` / `size`: pick one (bread, cheese, dressing, size).
- `count`: pick exactly N (the 7-sub party tray).

Extras can be linked to their base ingredient with `extraOf`, so "Extra onion" re-adds onion, and choosing "No cheese" drops "Extra cheese".

**Deep links.** `order.html?item=gyro` opens an item's customizer directly; `order.html#corned-beef-subs` jumps to a category. Handy for social posts and QR codes.

## Adding food photos

Every food image is currently a striped placeholder.

1. Put the photo in `assets/img/food/` (landscape, around 1200×900, JPG, compressed).
2. In `menu-data.js`, add `image` to the item:
   ```js
   { id: 'gyro', name: 'Gyro', image: 'assets/img/food/gyro.jpg', groups: [...] }
   ```

The photo then replaces the placeholder everywhere that item appears (menu card, home tiles, customizer, catering page).

The large placeholders on the Home and About pages (owner / crew photos) are in the HTML; swap each `<div class="ph ...">` block for an `<img>`.

A higher-resolution storefront photo would sharpen the home hero on large screens. Replace `assets/img/storefront-mural.jpg` (at least 2000px wide) and `storefront-mural-800.jpg`.

## Owner needs to confirm

Search the code for `CONFIRM` to find each one.

- Email address and Facebook/Instagram links (blank links are hidden automatically)
- Sales tax rate (`taxRate`; leave `null` to show "Added at payment")
- Online minimum order ($10.00) and pickup lead time (20 minutes)
- Veggie extras list and prices on subs
- Toppings and cheese options on corned beef, wraps, burger, Polish Boy
- Salad dressing list, and the meats offered on "Salad with Any Two Meats"
- Extras on gyros, loaded fries and the BBQ chicken sandwich
- Which subs can go on a party tray
- Founding story for the About page (marked `TODO` in `about.html`)

## Connecting payment (Square or other)

Checkout already validates everything and builds a complete order object (customer, pickup time, line items with modifiers, subtotal). Two places to change:

1. **`checkout.html`**: mount the payment form inside `<div id="payment-slot">`.
2. **`assets/js/checkout.js`**: replace `HaniniCheckout.submitOrder(order)`. It should tokenize the card, send `order` plus the token to your server, and resolve with `{ id }` once paid. The confirmation screen and cart clearing already happen after it resolves.

Card processing needs a small server (or serverless function) to hold the secret keys; don't put secret keys in these files. Always recalculate prices on the server from the menu rather than trusting totals sent by the browser.

When payment is live, set `demoMode: false` in `config.js` to remove the demo notices.

## Contact form

`location.html` validates entries and then calls `HaniniApp.sendContactForm(data)` in `assets/js/app.js`. Replace that function with a real handler (Formspree, Netlify Forms, or your own endpoint). It should return a Promise.

## Notes

- Cart is saved in the browser (`localStorage`), so it survives page changes and reloads, and stays in sync across tabs.
- Open/closed status and pickup times are calculated in Akron time (America/New_York) regardless of the visitor's time zone.
- Works on phones: bottom-sheet customizer, sticky order bar, safe-area support for notched phones, 16px inputs (no iOS zoom), and respects the reduced-motion setting.
- Fonts: Bricolage Grotesque and Figtree (SIL Open Font License). Icons: Phosphor (MIT). License files are next to each asset.
