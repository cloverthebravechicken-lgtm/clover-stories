# Clover Brave: Shopify theme for Clover Stories

A custom, lightweight Online Store 2.0 theme for **Clover, the Brave Chicken**, built to turn
Meta ad traffic into orders. It pulls in the store's existing images, video, editorial reviews
(Kirkus and The Children's Book Review), customer reviews, author bio and activity-packet offer.

## What's inside

**Homepage: a long-form sales page**
1. Announcement bar that rotates messages (free shipping, free activity packet, Kirkus review)
2. Hero with a buy box above the fold: image slideshow, stars, benefit bullets, price, add to cart,
   express checkout (Shop Pay / Apple Pay), a book vs. book + plush choice, and a
   **personalized and author-signed** add-on that asks for the child's name
3. Trust badges
4. Editorial reviews (Kirkus, The Children's Book Review)
5. Scrolling "Perfect for…" ribbon
6. Video story (the store's existing video; tap for sound; plays only while on screen)
7. Six benefits ("Why families love Clover")
8. "Peek inside" page spreads, swipeable, with tap-to-zoom
9. Customer review wall
10. Meet the author (Melanie)
11. The Clover collection (book, bundle, plush) with quick add
12. Free activity packet email signup. Signups are tagged `newsletter, clovers-club`
13. FAQ (also output as FAQ structured data for search engines)
14. Final call to action with one-tap add to cart

**Product page**: swipeable gallery with zoom, bundle picker, signed-inscription add-on,
sticky add-to-cart bar, perks, mini review, accordions, reviews, a Judge.me app slot, and
Product structured data.

**Cart drawer**: opens after add to cart with a burst of feather confetti. It shows a perk
message, lets shoppers change quantities, offers a plush upsell, and ends in a secure
checkout button.

Everything is vanilla JS/CSS (no jQuery or frameworks) to keep it fast on mobile. Animations
respect "reduce motion".

## Before going live
- Set **Clover Plush** and **Clover Book & Plush Bundle** to *Active*. They are drafts, so the
  bundle option, cart upsell and product cards stay hidden until then.
- The "Personalized & Author Signed" add-on is unlisted and has inventory of -4. Either turn
  off inventory tracking for it or set a quantity, so it can't sell out.
- Set up an automation in Shopify Email or Klaviyo that sends the activity packet PDF to
  customers tagged `clovers-club`.
- Add your social links in **Theme settings → Social media**.
- Assign the `product.plush` template to the plush and bundle products.

## Installing
Either:
- **Shopify admin → Online Store → Themes → Add theme → Connect from GitHub** and pick this
  repo/branch (it stays in sync automatically), or
- download this repo as a zip and use **Add theme → Upload zip file**.

## Developing
```
shopify theme dev --store cloverstories.myshopify.com
shopify theme check
```
