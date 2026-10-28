# Larder: food shop marketplace (demo)

A clickable demo of a multi-vendor marketplace for independent food shops. Customers fill one basket from several shops (bakery, cheesemonger, greengrocer, fishmonger and more), and one courier collects from every shop on a single route.

## What's in it

- **Home**: market-awning intro, a hero shopfront with looping footage, category rail, nearby shops, a scroll-driven map where the courier collects from three shops, a short film of one day on the high street (an arch-shaped window opens to full screen and scrolling runs the clock from 05:40 to 19:00 over four chapters), seasonal picks with a month calendar, maker stories, a seller pitch and a newsletter sign-up
- **Shops** (`#/shops`): search that also matches products ("croissant" finds the bakery), category chips, filters (open now, under 35 min, vegan, organic, saved), sorting, and a map view with pin cards. Filters stay in the URL so links can be shared
- **Shop page** (`#/shop/crumb`): video header, sticky section tabs with scrollspy, in-shop search, favourites, full counter, reviews, about/hours sidebar, the shop's minimum order, and "pairs well with" shops
- **Basket**: grouped by shop, per-shop minimums, a free-delivery meter, one delivery fee however many shops, undo on empty
- **Checkout** (`#/checkout`): validation, ASAP or hourly slots (ASAP is switched off when a shop is closed), substitutions, courier tip, and a live card preview. No payment is taken
- **Order tracking** (`#/order/...`): the courier rides the route through each shop to your door, with a live timeline. The journey plays out in about 80 seconds
- **Sell on Larder** (`#/sell`): commission calculator, live dashboard mock-up and an application form
- Search palette (Ctrl/Cmd + K or `/`), product quick view, toasts, and a mobile tab bar with bottom sheets

Opening hours are real-time: shops show as open or closed from the visitor's clock. The basket, saved shops and orders are kept in localStorage.

## Run it

Plain HTML, CSS and JavaScript. No build step.

```
python -m http.server 5180
```

Then open http://localhost:5180

- `data.js`: shops, products, hours, reviews (edit this to rebrand or change currency)
- `map.js`: the neighbourhood map and courier route
- `app.js`: router, basket, views and interactions
- `styles.css`: design tokens and all styles

Motion uses GSAP (ScrollTrigger, Flip) and Lenis from CDNs. If they fail to load, or the visitor prefers reduced motion, the site still works without animation.

Page changes drop a roller shutter with the next page's name on it. With a mouse, the hero shopfront leans in 3D and its price tags swing as you move past them, the italic headline and the footer wordmark thicken under the pointer (Fraunces' variable weight axis), cards tilt with a sheen, and a small label follows the pointer over rails and cards. None of this runs on touch screens or with reduced motion.

## Credits

- Footage and stills: [Mixkit](https://mixkit.co/) (Mixkit free licence), stills cut from the clips
- Fonts: Fraunces, Geist and Geist Mono (Google Fonts)

Larder is not a real business. Shops, people, prices and reviews are made up for the demo.
