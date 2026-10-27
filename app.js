/* Larder - food shop marketplace demo. Plain JS, hash routing, no build step. */
(() => {
  'use strict';

  const D = window.LARDER;
  const MapKit = window.LarderMap;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = $('#app');
  const shopById = Object.fromEntries(D.shops.map(s => [s.id, s]));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    if (window.Flip) gsap.registerPlugin(Flip);
  }
  if (hasGsap && !reduce) document.documentElement.classList.add('anim');

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => D.currency + (Math.round(n * 100) / 100).toFixed(2);
  const fmtK = n => (n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : String(n));
  const fmtH = h => (h === 0 || h === 24 ? '12am' : h === 12 ? '12pm' : h > 12 ? h - 12 + 'pm' : h + 'am');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const BADGES = { V: 'Vegetarian', VG: 'Vegan', GF: 'Gluten-free', ORG: 'Organic' };
  const icon = (id, cls = '') => `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const logoMark = () => '<svg class="logo__mark" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="32"/><circle cx="32" cy="32" r="25" fill="none" stroke-width="1.8" stroke-dasharray="2.4 3"/><text x="32" y="43.5" text-anchor="middle">L</text></svg>';

  /* ---------------------------------------------------------------- store */
  const KEY = 'larder:v1';
  const store = Object.assign({ cart: {}, notes: {}, favs: [], orders: {}, postcode: D.home.postcode }, load());
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* private mode */ } }
  const subs = new Set();
  function emit() {
    save();
    // re-renders replace steppers, so put keyboard focus back where it was
    const a = document.activeElement;
    const fk = a && a.dataset && (a.dataset.inc || a.dataset.dec || a.dataset.add);
    const fa = fk && (a.dataset.inc ? 'inc' : a.dataset.dec ? 'dec' : 'add');
    const layer = fk && a.closest('#drawer, #palette, #quick');
    subs.forEach(f => f());
    if (fk && !document.contains(a)) {
      const scope = layer ? '#' + layer.id + ' ' : '';
      const sel = qty(fk) ? `${scope}[data-${fa === 'add' ? 'inc' : fa}="${fk}"]` : `${scope}[data-add="${fk}"]`;
      const next = $(sel) || (layer && $('[data-close], .drawer__close', layer));
      if (next) next.focus({ preventScroll: true });
    }
  }

  const qty = key => store.cart[key] || 0;
  function setQty(key, n) {
    n = clamp(n, 0, 99);
    if (n) store.cart[key] = n; else delete store.cart[key];
    emit();
  }

  function cartGroups(cart = store.cart) {
    const groups = {};
    Object.entries(cart).forEach(([k, q]) => {
      const p = D.products[k];
      if (!p) return;
      const g = groups[p.shop] || (groups[p.shop] = { shop: shopById[p.shop], items: [], subtotal: 0 });
      g.items.push({ p, q, total: p.price * q });
      g.subtotal += p.price * q;
    });
    return Object.values(groups);
  }

  function totals(cart = store.cart, tip = 0) {
    const groups = cartGroups(cart);
    const items = groups.reduce((a, g) => a + g.subtotal, 0);
    const count = Object.values(cart).reduce((a, b) => a + b, 0);
    const delivery = !count ? 0 : items >= D.freeOver ? 0 : D.deliveryFee;
    const service = count ? D.serviceFee : 0;
    return {
      groups, items, count, delivery, service, tip,
      total: items + delivery + service + tip,
      freeLeft: Math.max(0, D.freeOver - items),
      short: groups.filter(g => g.subtotal < g.shop.min),
    };
  }

  /* ----------------------------------------------------------- shop time */
  function openState(s, d = new Date()) {
    const day = d.getDay(), h = d.getHours() + d.getMinutes() / 60, today = s.hours[day];
    if (today && h >= today[0] && h < today[1]) return { open: true, label: `Open until ${fmtH(today[1])}`, closesIn: today[1] - h };
    if (today && h < today[0]) return { open: false, label: `Opens ${fmtH(today[0])}` };
    for (let i = 1; i <= 7; i++) {
      const dd = (day + i) % 7, hh = s.hours[dd];
      if (hh) return { open: false, label: `Opens ${i === 1 ? 'tomorrow' : DAYS[dd].slice(0, 3)} ${fmtH(hh[0])}` };
    }
    return { open: false, label: 'Closed' };
  }

  /* ---------------------------------------------------------- components */
  let stampId = 0;
  function stamp(s, cls = '') {
    const id = 'sp' + (++stampId);
    const ring = `${s.name} · ${s.kind} · est ${s.est} · `.toUpperCase();
    const fs = Math.min(8.6, 236 / (ring.length * 0.6)).toFixed(2);
    const mfs = s.mono.length > 2 ? 19 : 24;
    return `<svg class="stamp ${cls}" viewBox="0 0 100 100" aria-hidden="true" style="--c:${s.color};--ci:${s.ink}">
      <circle cx="50" cy="50" r="49.5" class="stamp__bg"/>
      <circle cx="50" cy="50" r="28" class="stamp__inner"/>
      <defs><path id="${id}" d="M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0"/></defs>
      <g class="stamp__ring"><text style="font-size:${fs}px"><textPath href="#${id}" textLength="236" lengthAdjust="spacing">${esc(ring)}</textPath></text></g>
      <text class="stamp__mono" x="50" y="50" dy=".34em" text-anchor="middle" style="font-size:${mfs}px">${esc(s.mono)}</text>
    </svg>`;
  }

  function addCtl(key, size = '') {
    const p = D.products[key], q = qty(key);
    if (!q) {
      return `<div class="addctl ${size}" data-ctl="${key}" data-size="${size}" data-q="0"><button class="addbtn" type="button" data-add="${key}" aria-label="Add ${esc(p.name)} to basket">${icon('plus')}<span>Add</span></button></div>`;
    }
    return `<div class="addctl is-on ${size}" data-ctl="${key}" data-size="${size}" data-q="${q}"><div class="stepper">
      <button type="button" data-dec="${key}" aria-label="Remove one ${esc(p.name)}">${icon(q === 1 ? 'trash' : 'minus')}</button>
      <output aria-live="polite">${q}</output>
      <button type="button" data-inc="${key}" aria-label="Add one more ${esc(p.name)}">${icon('plus')}</button></div></div>`;
  }

  function refreshCtls() {
    $$('[data-ctl]').forEach(el => {
      const k = el.dataset.ctl;
      if (+el.dataset.q === qty(k)) return;
      const wasOn = el.classList.contains('is-on');
      el.outerHTML = addCtl(k, el.dataset.size);
      if (!wasOn && hasGsap && !reduce) {
        $$(`[data-ctl="${k}"] .stepper`).forEach(st => gsap.from(st, { scaleX: 0.6, opacity: 0, duration: 0.35, ease: 'back.out(2)' }));
      }
    });
  }

  const badgeHtml = (b = []) => b.map(x => `<abbr class="diet diet--${x.toLowerCase()}" title="${BADGES[x]}">${x}</abbr>`).join('');
  const flagHtml = t => (t ? `<span class="flag flag--${t.toLowerCase()}">${t}</span>` : '');
  const stars = r => `<span class="stars" style="--r:${r}" aria-label="${r} out of 5"></span>`;

  function productCard(p) {
    const s = shopById[p.shop];
    return `<article class="pcard" data-reveal>
      <button class="pcard__media" type="button" data-quick="${p.key}" tabindex="-1" aria-hidden="true">
        <img src="${p.img}" alt="" loading="lazy" width="640" height="640">
        ${flagHtml(p.tag)}
      </button>
      <span class="ptag" aria-hidden="true"><b>${money(p.price)}</b><i>${esc(p.unit)}</i></span>
      <div class="pcard__body">
        <a class="pcard__shop" href="#/shop/${s.id}"><span class="sdot" style="--c:${s.color}"></span>${esc(s.name)}</a>
        <h3 class="pcard__name"><button type="button" data-quick="${p.key}">${esc(p.name)}</button></h3>
        <div class="pcard__foot"><span class="pcard__price">${money(p.price)}<small>/ ${esc(p.unit)}</small></span>${addCtl(p.key)}</div>
      </div>
    </article>`;
  }

  function shopCard(s) {
    const st = openState(s), fav = store.favs.includes(s.id);
    return `<article class="scard" data-shop="${s.id}" data-reveal style="--c:${s.color};--ci:${s.ink}">
      <div class="scard__media" data-video="${s.video}">
        <img src="${s.cover}" alt="" loading="lazy" width="1280" height="720">
        <span class="status ${st.open ? 'is-open' : ''}"><i></i>${st.label}</span>
      </div>
      <a class="scard__link" href="#/shop/${s.id}"><span class="sr">${esc(s.name)}, ${esc(s.kind)} in ${esc(s.area)}</span></a>
      <button class="fav ${fav ? 'is-on' : ''}" type="button" data-fav="${s.id}" aria-pressed="${fav}" aria-label="Save ${esc(s.name)}">${icon('heart')}</button>
      <div class="scard__stamp">${stamp(s)}</div>
      <div class="scard__body">
        <p class="scard__kind">${esc(s.kind)} · ${esc(s.area)}</p>
        <h3 class="scard__name">${esc(s.name)}</h3>
        <p class="scard__tag">${esc(s.tagline)}</p>
        <ul class="scard__meta">
          <li>${icon('star', 'ic--star')}<b>${s.rating}</b><span>(${fmtK(s.reviews)})</span></li>
          <li>${icon('pin')}${s.dist} mi</li>
          <li>${icon('clock')}${s.eta[0]}–${s.eta[1]} min</li>
        </ul>
        <p class="scard__match" hidden></p>
      </div>
    </article>`;
  }

  function itemRow(p) {
    const s = shopById[p.shop];
    return `<article class="row" data-row="${p.key}" data-text="${esc((p.name + ' ' + p.desc).toLowerCase())}">
      <button class="row__main" type="button" data-quick="${p.key}">
        <span class="row__txt">
          <span class="row__name">${esc(p.name)} ${badgeHtml(p.badges)}</span>
          <span class="row__desc">${esc(p.desc)}</span>
          <span class="row__price">${money(p.price)} <small>/ ${esc(p.unit)}</small> ${flagHtml(p.tag)}</span>
        </span>
        ${p.img ? `<img class="row__img" src="${p.img}" alt="" loading="lazy" width="640" height="640">` : `<span class="row__label" style="--c:${s.color};--ci:${s.ink}"><b>${esc(s.mono)}</b></span>`}
      </button>
      <div class="row__add">${addCtl(p.key, 'addctl--sm')}</div>
    </article>`;
  }

  function monthsStrip(season = []) {
    const now = new Date().getMonth();
    return `<span class="months" aria-label="In season: ${season.map(m => MONTHS[m]).join(', ')}">${'JFMAMJJASOND'.split('').map((l, i) => `<i class="${season.includes(i) ? 'on' : ''}${i === now ? ' now' : ''}">${l}</i>`).join('')}</span>`;
  }

  /* ---------------------------------------------------------------- views */
  const cleanups = [];
  const onCleanup = fn => cleanups.push(fn);

  // ---------- HOME
  function viewHome() {
    const near = [...D.shops].sort((a, b) => a.dist - b.dist).slice(0, 6);
    const featured = ['crumb:croissant', 'underwood:chanterelles', 'rind:comte', 'saltline:seabass', 'patch:squash', 'ring:sprinkle', 'fiorella:tagliatelle', 'hive:wildflower', 'cellar:gamay', 'nib:bar70', 'saffron:spicebox', 'ember:espresso'].map(k => D.products[k]).filter(Boolean);
    const month = new Date().getMonth();
    const pool = Object.values(D.products).filter(p => p.img && p.season);
    const pref = ['underwood:chanterelles', 'underwood:porcini', 'patch:squash', 'patch:apples', 'hive:heather', 'saltline:crab'];
    let seasonal = pref.map(k => D.products[k]).filter(p => p && p.season.includes(month));
    pool.forEach(p => { if (seasonal.length < 6 && p.season.includes(month) && !seasonal.includes(p)) seasonal.push(p); });
    pool.forEach(p => { if (seasonal.length < 6 && !seasonal.includes(p)) seasonal.push(p); });
    const counts = Object.fromEntries(D.categories.map(c => [c.id, D.shops.filter(s => s.cat === c.id).length]));
    const ribbonA = ['Country sourdough', 'Golden chanterelles', 'Comté, 24 months', 'Day-boat sea bass', 'Heather honey', 'Cox apples', 'Damask rose', 'Egg tagliatelle'];
    const ribbonB = ['Bakehouses', 'Cheesemongers', 'Greengrocers', 'Fishmongers', 'Spice merchants', 'Foragers', 'Roasters', 'Wine shops'];
    const rib = list => list.map(t => `<span>${esc(t)}</span>${icon('spark', 'ic--spark')}`).join('');
    const makers = [
      { s: shopById.underwood, media: `<video data-src="assets/video/underwood.mp4" poster="assets/img/poster/underwood.webp" muted loop playsinline></video>` },
      { s: shopById.saltline, media: `<video data-src="assets/video/saltline.mp4" poster="assets/img/poster/saltline.webp" muted loop playsinline></video>` },
      { s: shopById.rind, media: `<img src="assets/img/scene/cheesemakers.webp" alt="" loading="lazy">` },
      { s: shopById.fiorella, media: `<video data-src="assets/video/fiorella.mp4" poster="assets/img/poster/fiorella.webp" muted loop playsinline></video>` },
    ];
    const howItems = [['crumb', 'crumb:sourdough'], ['rind', 'rind:comte'], ['patch', 'patch:tomatoes']];

    const html = `
    <section class="hero">
      <div class="wrap hero__grid">
        <div class="hero__copy">
          <p class="eyebrow" data-reveal><span class="pulse"></span>Delivering across east London · ${D.shops.length} independents</p>
          <h1 class="display hero__title" data-split>The whole high street, <em>in one basket.</em></h1>
          <p class="lede" data-reveal>Sourdough from the bakehouse, a wedge from the cheesemonger, day-boat fish off the slab. Shop as many independents as you like and one courier collects the lot, at your door in about 40 minutes.</p>
          <form class="finder" data-finder data-reveal>
            <label class="finder__field">${icon('pin')}<span class="sr">Your postcode</span><input name="postcode" value="${esc(store.postcode)}" autocomplete="postal-code" spellcheck="false" maxlength="8"></label>
            <button class="btn btn--ink" type="submit" data-magnetic><span>Find shops near me</span>${icon('arrow')}</button>
          </form>
          <p class="hero__try" data-reveal>Popular now:
            <a href="#/shops?q=sourdough">sourdough</a>
            <a href="#/shops?q=chanterelles">chanterelles</a>
            <a href="#/shops?q=natural%20wine">natural wine</a>
            <a href="#/shops?cat=fish">fish</a>
          </p>
          <div class="proof" data-reveal>
            <div class="faces" aria-hidden="true"><i style="--c:#C8692B">O</i><i style="--c:#2F6B52">M</i><i style="--c:#2B5D7C">P</i><i style="--c:#D9577F">J</i></div>
            <p><b>4.9 ${icon('star', 'ic--star')}</b> from 18,400 neighbours</p>
            <span class="proof__sep"></span>
            <p><b>${money(D.deliveryFee)}</b> delivery, however many shops</p>
          </div>
        </div>
        <div class="hero__stage" aria-hidden="true">
          <div class="facade">
            <div class="awning"><div class="awning__band"></div><div class="awning__scallops"></div></div>
            <div class="arches">
              <figure class="arch arch--1"><video data-src="assets/video/arch-bakery.mp4" poster="assets/img/arch/bakery.webp" muted loop playsinline></video><span class="hang"><span class="ptag ptag--hang"><b>${money(2.8)}</b><i>Croissant</i></span></span></figure>
              <figure class="arch arch--2"><video data-src="assets/video/arch-fish.mp4" poster="assets/img/arch/fish.webp" muted loop playsinline></video><span class="hang"><span class="ptag ptag--hang"><b>${money(9.8)}</b><i>Sea bass</i></span></span></figure>
              <figure class="arch arch--3"><video data-src="assets/video/arch-mushroom.mp4" poster="assets/img/arch/mushroom.webp" muted loop playsinline></video><span class="hang"><span class="ptag ptag--hang"><b>${money(9.5)}</b><i>Chanterelles</i></span></span></figure>
            </div>
            <div class="facade__sill"></div>
          </div>
          <div class="sticker">
            <svg class="sticker__svg" viewBox="0 0 120 120"><defs><path id="stickerPath" d="M60 60 m-46 0 a46 46 0 1 1 92 0 a46 46 0 1 1 -92 0"/></defs>
            <circle cx="60" cy="60" r="59" class="sticker__bg"/>
            <g class="sticker__ring"><text><textPath href="#stickerPath" textLength="286" lengthAdjust="spacing">FREE DELIVERY OVER ${D.currency}${D.freeOver} · ONE COURIER · </textPath></text></g></svg>
            ${icon('bike', 'sticker__ic')}
          </div>
          <div class="live" data-live>
            <div class="live__stamp"></div>
            <p class="live__text"></p>
            <time class="live__time"></time>
          </div>
        </div>
      </div>
    </section>

    <section class="ribbons" aria-hidden="true">
      <div class="ribbon ribbon--a"><div class="ribbon__track">${rib(ribbonA)}${rib(ribbonA)}</div></div>
      <div class="ribbon ribbon--b"><div class="ribbon__track">${rib(ribbonB)}${rib(ribbonB)}</div></div>
    </section>

    <section class="cats wrap">
      <header class="sec-head">
        <p class="kicker" data-reveal><span>01</span> Browse the high street</p>
        <h2 class="display" data-split>What are you <em>after today?</em></h2>
      </header>
      <div class="cats__rail" data-drag>
        ${D.categories.map((c, i) => `
          <a class="cat" href="#/shops?cat=${c.id}" data-reveal style="--i:${i}">
            <span class="cat__disc">
              <img src="${c.img}" alt="" loading="lazy" width="640" height="640">
              <svg class="cat__ring" viewBox="0 0 100 100" aria-hidden="true"><defs><path id="cr${i}" d="M50 50 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0"/></defs><text><textPath href="#cr${i}" textLength="274" lengthAdjust="spacing">${esc(c.label.toUpperCase())} · ${counts[c.id]} ${counts[c.id] === 1 ? 'SHOP' : 'SHOPS'} · ${esc(c.label.toUpperCase())} · </textPath></text></svg>
            </span>
            <span class="cat__label">${esc(c.label)}</span>
            <span class="cat__count">${counts[c.id]} ${counts[c.id] === 1 ? 'shop' : 'shops'}</span>
          </a>`).join('')}
      </div>
    </section>

    <section class="near wrap">
      <header class="sec-head sec-head--split">
        <div>
          <p class="kicker" data-reveal><span>02</span> Open near <b data-postcode>${esc(store.postcode)}</b></p>
          <h2 class="display" data-split>Shops on <em>your patch</em></h2>
        </div>
        <a class="btn btn--line" href="#/shops" data-reveal><span>All ${D.shops.length} shops</span>${icon('arrow')}</a>
      </header>
      <div class="shop-grid">${near.map(shopCard).join('')}</div>
    </section>

    <section class="how" id="how">
      <div class="how__sticky">
        <div class="how__grid wrap">
          <div class="how__copy">
            <p class="kicker"><span>03</span> How Larder works</p>
            <h2 class="display">Three shops. <em>One courier.</em></h2>
            <ol class="how__steps">
              <li class="is-on"><b>01</b><div><h3>Fill one basket</h3><p>Add a loaf here, a wedge there. Your basket keeps every shop’s items together, with one checkout.</p></div></li>
              <li><b>02</b><div><h3>Shops pack it fresh</h3><p>Each shop gets its part of the order instantly and packs it to order: sliced, filleted, wrapped in paper.</p></div></li>
              <li><b>03</b><div><h3>One courier, one loop</h3><p>A neighbourhood rider on an electric cargo bike collects from every shop on a single route.</p></div></li>
              <li><b>04</b><div><h3>At your door, ~40 min</h3><p>One delivery and one ${money(D.deliveryFee)} fee, free over ${D.currency}${D.freeOver}. 92% of what you pay goes to the shops.</p></div></li>
            </ol>
            <div class="how__bar"><span></span></div>
          </div>
          <div class="how__map">
            ${MapKit.svg({ route: ['hub', 'crumb', 'rind', 'patch', 'home'], cls: 'nmap--how', aria: 'A courier collecting from three shops on the way to your door' })}
            <div class="how__basket">
              <p class="how__basket-head">${icon('basket')} Your basket <span data-how-count>0 of 3 collected</span></p>
              <ul>${howItems.map(([sid, key]) => { const p = D.products[key], s = shopById[sid]; return `<li data-how-item="${sid}">${stamp(s, 'stamp--xs')}<span><b>${esc(p.name)}</b><small>${esc(s.name)}</small></span>${icon('check', 'how__tick')}</li>`; }).join('')}</ul>
              <p class="how__eta" data-how-eta>${icon('clock')} Arriving in <b>38 min</b></p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="rail-sec">
      <header class="sec-head sec-head--split wrap">
        <div>
          <p class="kicker" data-reveal><span>04</span> This week at the market</p>
          <h2 class="display" data-split>Counter <em>favourites</em></h2>
        </div>
        <div class="rail-nav" data-reveal>
          <button class="icon-btn" type="button" data-rail-prev aria-label="Scroll back">${icon('arrow-l')}</button>
          <button class="icon-btn" type="button" data-rail-next aria-label="Scroll forward">${icon('arrow')}</button>
        </div>
      </header>
      <div class="rail" data-rail data-drag>${featured.map(productCard).join('')}</div>
    </section>

    <section class="season wrap">
      <div class="season__media" data-reveal="clip">
        <img src="assets/img/scene/squash-tall.webp" alt="Harlequin squash and pumpkins" loading="lazy" data-parallax>
        <div class="season__badge"><span>In season</span><b>${MONTHS[month]}</b></div>
      </div>
      <div class="season__body">
        <p class="kicker" data-reveal><span>05</span> Peak season</p>
        <h2 class="display" data-split>Late ${MONTHS[month]}, <em>at its very best</em></h2>
        <p class="lede" data-reveal>Shops update their counters daily, so what you see is what came in this week. These are at their peak right now.</p>
        <ul class="season__list">
          ${seasonal.map(p => { const s = shopById[p.shop]; return `<li data-reveal>
            <button type="button" class="season__item" data-quick="${p.key}">
              <img src="${p.img}" alt="" loading="lazy" width="640" height="640">
              <span><b>${esc(p.name)}</b><small>${esc(s.name)} · ${money(p.price)} / ${esc(p.unit)}</small>${monthsStrip(p.season)}</span>
            </button>${addCtl(p.key, 'addctl--sm')}</li>`; }).join('')}
        </ul>
      </div>
    </section>

    <section class="makers">
      <div class="wrap">
        <header class="sec-head">
          <p class="kicker" data-reveal><span>06</span> Behind the counter</p>
          <h2 class="display" data-split>Real shops, run by <em>people who care</em></h2>
        </header>
        <div class="makers__stage" data-makers>
          <div class="makers__media" data-reveal="clip">
            ${makers.map((m, i) => `<div class="makers__slide${i === 0 ? ' is-on' : ''}">${m.media}</div>`).join('')}
            <div class="makers__shade"></div>
            <blockquote class="makers__quote" data-quote></blockquote>
          </div>
          <ul class="makers__list">
            ${makers.map((m, i) => `<li><button type="button" class="maker${i === 0 ? ' is-on' : ''}" data-maker="${i}" aria-pressed="${i === 0}">
              ${stamp(m.s, 'stamp--sm')}
              <span><b>${esc(m.s.owner)}</b><small>${esc(m.s.ownerRole)}, ${esc(m.s.name)}</small></span>
              <i class="maker__bar"><i></i></i>
            </button></li>`).join('')}
          </ul>
        </div>
      </div>
    </section>

    <section class="sellband">
      <div class="wrap sellband__grid">
        <div class="sellband__copy">
          <p class="kicker kicker--light" data-reveal>For shopkeepers</p>
          <h2 class="display" data-split>Run a food shop? <em>Keep more of every sale.</em></h2>
          <p data-reveal>Larder takes 12%, not 30%. No tablets to rent, no sign-up fee, and your name stays on your food. We bring the customers and the couriers.</p>
          <a class="btn btn--tomato" href="#/sell" data-reveal data-magnetic><span>Sell on Larder</span>${icon('arrow')}</a>
        </div>
        <ul class="stats">
          <li data-reveal><b><span data-count="92">0</span>%</b><span>of every basket goes straight to the shop</span></li>
          <li data-reveal><b><span data-count="38">0</span> min</b><span>average door-to-door, across three shops</span></li>
          <li data-reveal><b><span data-count="1900">0</span>+</b><span>baskets a week from neighbours in E5, E8 &amp; E9</span></li>
        </ul>
      </div>
    </section>

    <section class="letter wrap">
      <div class="letter__card" data-reveal>
        <div class="letter__stamp" aria-hidden="true"><span>E8</span><small>1st class</small></div>
        <div class="letter__copy">
          <p class="kicker"><span>07</span> The Saturday Larder</p>
          <h2 class="display">What’s good this weekend, <em>from the people who sell it.</em></h2>
          <p>One short email on Friday evening: new arrivals, what’s in season and the occasional recipe from behind the counter.</p>
        </div>
        <form class="letter__form" data-letter novalidate>
          <label class="sr" for="letterEmail">Email address</label>
          <input id="letterEmail" type="email" placeholder="you@example.com" autocomplete="email" required>
          <button class="btn btn--ink" type="submit"><span>Sign me up</span></button>
          <p class="form-msg" role="status"></p>
        </form>
      </div>
    </section>`;

    return { html, title: null, mount: mountHome };
  }

  function mountHome(root, q) {
    // postcode finder
    const finder = $('[data-finder]', root);
    finder.addEventListener('submit', e => {
      e.preventDefault();
      const v = finder.postcode.value.trim().toUpperCase();
      if (v) { store.postcode = v; save(); syncPostcode(); }
      location.hash = '#/shops';
    });

    // hero live ticker
    const live = $('[data-live]', root);
    const msgs = [
      ['crumb', '<b>Ola</b> filled one basket from <b>3 shops</b>', '2 min ago'],
      ['underwood', '<b>Marcus</b> grabbed the last <b>porcini</b> of the day', '4 min ago'],
      ['cellar', 'A <b>cheese &amp; wine supper</b> is on its way to E9', '6 min ago'],
      ['saltline', 'Rider <b>Sam</b> just left Saltline with <b>2 baskets</b>', 'just now'],
    ];
    let mi = 0;
    const showLive = () => {
      const [sid, text, when] = msgs[mi++ % msgs.length];
      const set = () => {
        $('.live__stamp', live).innerHTML = stamp(shopById[sid], 'stamp--xs');
        $('.live__text', live).innerHTML = text;
        $('.live__time', live).textContent = when;
      };
      if (hasGsap && !reduce && mi > 1) gsap.timeline().to(live, { y: 10, opacity: 0, duration: 0.3 }).add(set).to(live, { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.6)' });
      else set();
    };
    showLive();
    const liveTimer = setInterval(showLive, 4200);
    onCleanup(() => clearInterval(liveTimer));

    // hero entrance
    if (hasGsap && !reduce) {
      const tl = gsap.timeline({ delay: firstLoad ? INTRO + 0.15 : 0.2 });
      tl.from('.awning', { scaleY: 0, transformOrigin: '50% 0%', duration: 0.9, ease: 'expo.out' })
        .from('.arch', { yPercent: 18, opacity: 0, duration: 1.1, stagger: 0.12, ease: 'expo.out' }, '-=0.6')
        .from('.ptag--hang', { rotate: -40, opacity: 0, duration: 1.2, stagger: 0.1, ease: 'elastic.out(1, 0.45)' }, '-=0.7')
        .from('.sticker', { scale: 0, rotate: -90, duration: 0.9, ease: 'back.out(1.8)' }, '-=1')
        .from('.live', { y: 30, opacity: 0, duration: 0.7, ease: 'back.out(1.6)' }, '-=0.8');
    }

    // ribbons that speed up with scroll
    if (hasGsap && !reduce) {
      const tweens = $$('.ribbon__track', root).map((t, i) =>
        gsap.fromTo(t, { xPercent: i ? -50 : 0 }, { xPercent: i ? 0 : -50, duration: i ? 46 : 40, ease: 'none', repeat: -1 }));
      ScrollTrigger.create({
        trigger: '.ribbons', start: 'top bottom', end: 'bottom top',
        onUpdate: self => {
          const v = clamp(Math.abs(self.getVelocity()) / 250, 0, 5);
          tweens.forEach(tw => gsap.to(tw, { timeScale: 1 + v, duration: 0.2, overwrite: true, onComplete: () => gsap.to(tw, { timeScale: 1, duration: 0.8 }) }));
        },
      });
    }

    // how it works: scroll moves the courier along the route
    const how = $('.how', root);
    const svg = $('.nmap--how', how);
    const rt = MapKit.route(svg);
    const steps = $$('.how__steps li', how);
    const bar = $('.how__bar span', how);
    const howItems = $$('[data-how-item]', how);
    const howCount = $('[data-how-count]', how);
    const howEta = $('[data-how-eta] b', how);
    let lastStep = -1;
    const onHow = () => {
      const r = how.getBoundingClientRect();
      const total = how.offsetHeight - innerHeight;
      const p = clamp(-r.top / (total || 1), 0, 1);
      const rp = clamp((p - 0.04) / 0.86, 0, 1);
      rt.set(rp);
      const step = Math.min(3, Math.floor(p * 4));
      if (step !== lastStep) { steps.forEach((li, i) => li.classList.toggle('is-on', i === step)); lastStep = step; }
      bar.style.transform = `scaleX(${p})`;
      let got = 0;
      // stops[0] is the hub, so shop i is stop i + 1
      howItems.forEach((li, i) => { const on = rp >= rt.stops[i + 1] - 0.002; li.classList.toggle('is-in', on); if (on) got++; });
      howCount.textContent = rp >= 0.999 ? 'Delivered' : `${got} of 3 collected`;
      howEta.textContent = rp >= 0.999 ? 'Delivered · 38 min' : `${Math.max(1, Math.round(38 * (1 - rp)))} min`;
    };
    onScroll(onHow);
    onHow();

    // rail arrows + drag
    const rail = $('[data-rail]', root);
    const step = () => Math.min(rail.clientWidth * 0.8, 900);
    $('[data-rail-prev]', root).addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
    $('[data-rail-next]', root).addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));

    // makers carousel
    const stage = $('[data-makers]', root);
    const slides = $$('.makers__slide', stage);
    const btns = $$('[data-maker]', stage);
    const quote = $('[data-quote]', stage);
    const makerShops = ['underwood', 'saltline', 'rind', 'fiorella'].map(id => shopById[id]);
    let cur = 0, timer = null;
    const setMaker = (i, user) => {
      cur = i;
      slides.forEach((sl, j) => {
        sl.classList.toggle('is-on', j === i);
        const v = $('video', sl);
        if (v) { if (j === i) playVideo(v); else v.pause(); }
      });
      btns.forEach((b, j) => { b.classList.toggle('is-on', j === i); b.setAttribute('aria-pressed', j === i); });
      const s = makerShops[i];
      quote.innerHTML = `<p>“${esc(s.quote)}”</p><footer><span>${esc(s.owner)}, ${esc(s.name)}</span><a href="#/shop/${s.id}" class="link-arrow">Visit the shop ${icon('arrow')}</a></footer>`;
      if (hasGsap && !reduce) gsap.from(quote.children, { y: 18, opacity: 0, duration: 0.7, stagger: 0.08, ease: 'expo.out' });
      clearTimeout(timer);
      timer = setTimeout(() => setMaker((cur + 1) % slides.length), 7000);
    };
    btns.forEach(b => b.addEventListener('click', () => setMaker(+b.dataset.maker)));
    const io = new IntersectionObserver(([en]) => {
      if (en.isIntersecting) setMaker(cur); else { clearTimeout(timer); $$('video', stage).forEach(v => v.pause()); }
    }, { threshold: 0.3 });
    io.observe(stage);
    onCleanup(() => { clearTimeout(timer); io.disconnect(); });

    // newsletter
    const lf = $('[data-letter]', root);
    lf.addEventListener('submit', e => {
      e.preventDefault();
      const inp = $('input', lf), msg = $('.form-msg', lf);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inp.value.trim())) { msg.textContent = 'That email doesn’t look quite right.'; msg.className = 'form-msg is-err'; inp.focus(); return; }
      lf.classList.add('is-done');
      msg.className = 'form-msg is-ok';
      msg.textContent = 'You’re on the list. First letter lands Friday.';
      inp.value = '';
    });

    if (q.get('s') === 'how') requestAnimationFrame(() => scrollToEl(how, 0));
  }

  // ---------- SHOPS
  function viewShops(q) {
    const counts = Object.fromEntries(D.categories.map(c => [c.id, D.shops.filter(s => s.cat === c.id).length]));
    const html = `
    <section class="listing">
      <header class="listing__head wrap">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a><span>/</span><span>Shops</span></nav>
        <h1 class="display listing__title"><span data-result-count>${D.shops.length} shops</span> <em>near <b data-postcode>${esc(store.postcode)}</b></em></h1>
        <div class="toolbar">
          <label class="search-inline">${icon('search')}<span class="sr">Filter shops</span><input type="search" placeholder="Search shops or food, try “croissant”" data-q value="${esc(q.get('q') || '')}"></label>
          <div class="segmented" role="group" aria-label="View">
            <button type="button" class="is-on" data-view="grid" aria-pressed="true">${icon('grid')}<span>Grid</span></button>
            <button type="button" data-view="map" aria-pressed="false">${icon('map')}<span>Map</span></button>
          </div>
          <label class="select"><span>Sort</span><select data-sort>
            <option value="near">Nearest</option><option value="rating">Top rated</option><option value="fast">Fastest</option><option value="az">A–Z</option>
          </select>${icon('chev')}</label>
        </div>
        <div class="chips" role="group" aria-label="Category">
          <button type="button" class="chip is-on" data-cat="">All <i>${D.shops.length}</i></button>
          ${D.categories.map(c => `<button type="button" class="chip" data-cat="${c.id}">${esc(c.label)} <i>${counts[c.id]}</i></button>`).join('')}
        </div>
        <div class="toggles" role="group" aria-label="Filters">
          <button type="button" class="toggle" data-flag="open" aria-pressed="false"><i></i>Open now</button>
          <button type="button" class="toggle" data-flag="fast" aria-pressed="false"><i></i>Under 35 min</button>
          <button type="button" class="toggle" data-flag="vegan" aria-pressed="false"><i></i>Vegan-friendly</button>
          <button type="button" class="toggle" data-flag="organic" aria-pressed="false"><i></i>Organic</button>
          <button type="button" class="toggle" data-flag="fav" aria-pressed="false"><i></i>Saved</button>
        </div>
      </header>
      <div class="wrap">
        <div class="shop-grid shop-grid--all" data-grid>${D.shops.map(shopCard).join('')}</div>
        <div class="finder-map" data-mapview hidden>
          <div class="finder-map__canvas">${MapKit.svg({ interactive: true, cls: 'nmap--finder', aria: 'Map of shops near you' })}<div class="pin-card" data-pin-card hidden></div></div>
          <ol class="finder-map__list" data-maplist data-lenis-prevent></ol>
        </div>
        <div class="empty" data-empty hidden>
          <div class="empty__art" aria-hidden="true">${icon('basket')}</div>
          <h2 class="display">Nothing on the counter <em>for that.</em></h2>
          <p>Try a different search, or clear the filters to see every shop.</p>
          <button type="button" class="btn btn--ink" data-clear><span>Clear filters</span></button>
        </div>
      </div>
    </section>`;
    return { html, title: 'Shops near you', mount: mountShops };
  }

  function mountShops(root, q) {
    const state = { q: q.get('q') || '', cat: q.get('cat') || '', sort: q.get('sort') || 'near', flags: new Set((q.get('f') || '').split(',').filter(Boolean)), view: q.get('view') || 'grid' };
    const grid = $('[data-grid]', root), mapView = $('[data-mapview]', root), empty = $('[data-empty]', root);
    const cards = Object.fromEntries($$('.scard', grid).map(c => [c.dataset.shop, c]));
    // filtering shows and hides cards, so they get their own entrance instead of scroll reveals
    Object.values(cards).forEach(c => c.removeAttribute('data-reveal'));
    if (hasGsap && !reduce) requestAnimationFrame(() => gsap.from($$('.scard:not([hidden])', grid).slice(0, 9), { y: 40, opacity: 0, duration: 0.9, stagger: 0.06, ease: 'expo.out', clearProps: 'transform,opacity' }));
    const input = $('[data-q]', root), sortSel = $('[data-sort]', root);
    sortSel.value = state.sort;

    const matchProducts = (s, term) => s.sections.flatMap(sec => sec.items).filter(p => (p.name + ' ' + p.desc).toLowerCase().includes(term));
    const tests = {
      open: s => openState(s).open,
      fast: s => s.eta[1] <= 35,
      vegan: s => s.sections.flatMap(x => x.items).filter(p => (p.badges || []).includes('VG')).length >= 3,
      organic: s => s.tags.includes('Organic') || s.sections.some(x => x.items.some(p => (p.badges || []).includes('ORG'))),
      fav: s => store.favs.includes(s.id),
    };
    const sorters = {
      near: (a, b) => a.dist - b.dist,
      rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
      fast: (a, b) => a.eta[0] - b.eta[0] || a.dist - b.dist,
      az: (a, b) => a.name.localeCompare(b.name),
    };

    function apply(animate = true) {
      const term = state.q.trim().toLowerCase();
      const flipState = animate && hasGsap && window.Flip && !reduce ? Flip.getState('.scard', { props: 'opacity' }) : null;
      const list = [...D.shops].sort(sorters[state.sort]);
      const visible = [];
      list.forEach(s => {
        const card = cards[s.id];
        grid.appendChild(card);
        let ok = (!state.cat || s.cat === state.cat) && [...state.flags].every(f => tests[f](s));
        let hits = [];
        if (ok && term) {
          const inShop = (s.name + ' ' + s.kind + ' ' + s.area + ' ' + s.tags.join(' ') + ' ' + s.tagline).toLowerCase().includes(term);
          hits = matchProducts(s, term);
          ok = inShop || hits.length > 0;
        }
        card.hidden = !ok;
        const m = $('.scard__match', card);
        if (ok && hits.length) { m.hidden = false; m.innerHTML = `${icon('search')} ${hits.slice(0, 2).map(h => esc(h.name)).join(', ')}${hits.length > 2 ? ` +${hits.length - 2}` : ''}`; } else m.hidden = true;
        if (ok) visible.push(s);
      });
      if (flipState) Flip.from(flipState, { duration: 0.6, ease: 'expo.out', absolute: true, scale: true, onEnter: els => gsap.fromTo(els, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.5 }), onLeave: els => gsap.to(els, { opacity: 0, scale: 0.92, duration: 0.3 }) });
      $('[data-result-count]', root).textContent = `${visible.length} shop${visible.length === 1 ? '' : 's'}`;
      empty.hidden = visible.length > 0;
      grid.hidden = state.view !== 'grid' || !visible.length;
      mapView.hidden = state.view !== 'map' || !visible.length;
      // chips/toggles
      $$('[data-cat]', root).forEach(b => b.classList.toggle('is-on', b.dataset.cat === state.cat));
      $$('[data-flag]', root).forEach(b => { const on = state.flags.has(b.dataset.flag); b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
      $$('[data-view]', root).forEach(b => { const on = b.dataset.view === state.view; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
      // map pins + list
      const vis = new Set(visible.map(s => s.id));
      $$('.nmap--finder [data-pin]', root).forEach(p => p.classList.toggle('is-dim', !vis.has(p.dataset.pin)));
      $('[data-maplist]', root).innerHTML = visible.map(s => { const st = openState(s); return `<li><a href="#/shop/${s.id}" data-hot="${s.id}">${stamp(s, 'stamp--sm')}<span><b>${esc(s.name)}</b><small>${esc(s.kind)} · ${s.dist} mi · ${s.eta[0]}–${s.eta[1]} min</small><em class="${st.open ? 'is-open' : ''}">${st.label}</em></span></a></li>`; }).join('');
      // keep url shareable without re-rendering
      const params = new URLSearchParams();
      if (state.q) params.set('q', state.q);
      if (state.cat) params.set('cat', state.cat);
      if (state.sort !== 'near') params.set('sort', state.sort);
      if (state.flags.size) params.set('f', [...state.flags].join(','));
      if (state.view !== 'grid') params.set('view', state.view);
      const qs = params.toString();
      history.replaceState(null, '', '#/shops' + (qs ? '?' + qs : ''));
      if (hasGsap) ScrollTrigger.refresh();
    }

    root.addEventListener('click', e => {
      const c = e.target.closest('[data-cat]');
      if (c) { state.cat = c.dataset.cat; apply(); return; }
      const f = e.target.closest('[data-flag]');
      if (f) { const k = f.dataset.flag; state.flags.has(k) ? state.flags.delete(k) : state.flags.add(k); apply(); return; }
      const v = e.target.closest('[data-view]');
      if (v) { state.view = v.dataset.view; apply(false); if (state.view === 'map' && hasGsap && !reduce) gsap.from('.finder-map', { opacity: 0, y: 20, duration: 0.6, ease: 'expo.out' }); return; }
      if (e.target.closest('[data-clear]')) { state.q = ''; state.cat = ''; state.flags.clear(); input.value = ''; apply(); }
    });
    let t;
    input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { state.q = input.value; apply(); }, 140); });
    sortSel.addEventListener('change', () => { state.sort = sortSel.value; apply(); });
    // re-filter saved shops when a heart is toggled
    const favSub = () => { if (state.flags.has('fav')) apply(); };
    subs.add(favSub);
    onCleanup(() => subs.delete(favSub));

    // map pin hover card
    const canvas = $('.finder-map__canvas', root), card = $('[data-pin-card]', root);
    const showPin = id => {
      $$('[data-pin]', canvas).forEach(p => p.classList.toggle('is-hot', p.dataset.pin === id));
      $$('[data-hot]', root).forEach(a => a.classList.toggle('is-hot', a.dataset.hot === id));
      if (!id) { card.hidden = true; return; }
      const s = shopById[id], pin = $(`[data-pin="${id}"]`, canvas);
      const pr = pin.getBoundingClientRect(), cr = canvas.getBoundingClientRect();
      const st = openState(s);
      card.innerHTML = `<img src="${s.cover}" alt=""><div><b>${esc(s.name)}</b><small>${esc(s.kind)} · ${icon('star', 'ic--star')} ${s.rating}</small><em class="${st.open ? 'is-open' : ''}">${st.label}</em></div>`;
      card.hidden = false;
      const x = clamp(pr.left - cr.left + pr.width / 2, 130, cr.width - 130);
      card.style.left = x + 'px';
      card.style.top = (pr.top - cr.top) + 'px';
    };
    canvas.addEventListener('pointerover', e => { const p = e.target.closest('[data-pin]'); if (p) showPin(p.dataset.pin); });
    canvas.addEventListener('pointerleave', () => showPin(null));
    canvas.addEventListener('focusin', e => { const p = e.target.closest('[data-pin]'); if (p) showPin(p.dataset.pin); });
    canvas.addEventListener('click', e => { const p = e.target.closest('[data-pin]'); if (p) location.hash = '#/shop/' + p.dataset.pin; });
    canvas.addEventListener('keydown', e => { const p = e.target.closest('[data-pin]'); if (p && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); location.hash = '#/shop/' + p.dataset.pin; } });
    const list = $('[data-maplist]', root);
    list.addEventListener('pointerover', e => { const a = e.target.closest('[data-hot]'); if (a) showPin(a.dataset.hot); });
    list.addEventListener('pointerleave', () => showPin(null));

    apply(false);
  }

  // ---------- SHOP
  function viewShop(id) {
    const s = shopById[id];
    if (!s) return viewNotFound();
    const st = openState(s);
    const fav = store.favs.includes(s.id);
    const featured = s.sections.flatMap(x => x.items).filter(p => p.img).slice(0, 4);
    const today = new Date().getDay();
    const cat = D.categories.find(c => c.id === s.cat);
    const dist = [82, 13, 3, 1, 1];
    const html = `
    <section class="shop-hero" style="--c:${s.color};--ci:${s.ink}">
      <div class="shop-hero__media">
        <video data-src="${s.video}" poster="${s.poster}" muted loop playsinline></video>
        <div class="shop-hero__shade"></div>
      </div>
      <div class="wrap shop-hero__inner">
        <nav class="crumbs crumbs--light" aria-label="Breadcrumb"><a href="#/">Home</a><span>/</span><a href="#/shops">Shops</a><span>/</span><a href="#/shops?cat=${s.cat}">${esc(cat.label)}</a></nav>
        <div class="shop-hero__row">
          <div class="shop-hero__stamp">${stamp(s, 'stamp--xl')}</div>
          <div class="shop-hero__titles">
            <p class="eyebrow eyebrow--light" data-reveal>${esc(s.kind)} · ${esc(s.area)} · Est. ${s.est}</p>
            <h1 class="display shop-hero__name" data-split>${esc(s.name)}</h1>
            <p class="shop-hero__tag" data-reveal>${esc(s.tagline)}</p>
          </div>
        </div>
        <div class="shop-hero__bar" data-reveal>
          <ul class="shop-hero__meta">
            <li>${icon('star', 'ic--star')}<b>${s.rating}</b> <span>${s.reviews.toLocaleString()} reviews</span></li>
            <li class="status ${st.open ? 'is-open' : ''}"><i></i>${st.label}</li>
            <li>${icon('pin')}${s.dist} mi away</li>
            <li>${icon('clock')}${s.eta[0]}–${s.eta[1]} min</li>
            <li>${icon('basket')}Min. ${money(s.min)}</li>
          </ul>
          <div class="shop-hero__actions">
            <button type="button" class="btn btn--glass ${fav ? 'is-on' : ''}" data-fav="${s.id}" aria-pressed="${fav}">${icon('heart')}<span>${fav ? 'Saved' : 'Save shop'}</span></button>
            <button type="button" class="btn btn--glass" data-share>${icon('share')}<span>Share</span></button>
          </div>
        </div>
      </div>
    </section>

    <nav class="shop-tabs" aria-label="Shop sections">
      <div class="wrap shop-tabs__inner">
        <div class="shop-tabs__links" data-tabs>
          <a href="#sec-featured" data-tab="sec-featured" class="is-on">Favourites</a>
          ${s.sections.map((sec, i) => `<a href="#sec-${i}" data-tab="sec-${i}">${esc(sec.name)}</a>`).join('')}
          <a href="#sec-reviews" data-tab="sec-reviews">Reviews</a>
        </div>
        <label class="search-inline search-inline--sm">${icon('search')}<span class="sr">Search this shop</span><input type="search" placeholder="Search ${esc(s.name)}" data-shop-q></label>
      </div>
    </nav>

    <div class="wrap shop-body">
      <div class="shop-main">
        <section class="menu-sec" id="sec-featured" data-sec>
          <h2 class="menu-sec__title">Counter favourites</h2>
          <div class="pgrid">${featured.map(productCard).join('')}</div>
        </section>
        ${s.sections.map((sec, i) => `
          <section class="menu-sec" id="sec-${i}" data-sec>
            <h2 class="menu-sec__title">${esc(sec.name)} <span>${sec.items.length}</span></h2>
            <div class="rows">${sec.items.map(itemRow).join('')}</div>
          </section>`).join('')}
        <p class="shop-empty" data-shop-empty hidden>Nothing in ${esc(s.name)} matches that. Try another word.</p>
        <section class="menu-sec reviews" id="sec-reviews" data-sec>
          <h2 class="menu-sec__title">What neighbours say</h2>
          <div class="reviews__grid">
            <div class="reviews__score">
              <b class="display">${s.rating}</b>${stars(s.rating)}<span>${s.reviews.toLocaleString()} reviews</span>
              <ul>${[5, 4, 3, 2, 1].map((n, i) => `<li><span>${n}</span><i><i style="width:${dist[i]}%"></i></i></li>`).join('')}</ul>
            </div>
            <div class="reviews__list">
              ${s.reviewList.map(r => `<figure class="review" data-reveal>${stars(r.stars)}<blockquote>${esc(r.text)}</blockquote><figcaption><b>${esc(r.name)}</b> · ${esc(r.when)}</figcaption></figure>`).join('')}
            </div>
          </div>
        </section>
      </div>
      <aside class="shop-side">
        <div class="side-card about" data-reveal>
          <img src="${s.scene}" alt="" loading="lazy">
          <div class="about__body">
            <p class="kicker">About the shop</p>
            <p>${esc(s.story)}</p>
            <blockquote>“${esc(s.quote)}”<cite>${esc(s.owner)}, ${esc(s.ownerRole)}</cite></blockquote>
            <ul class="tags">${s.tags.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
          </div>
        </div>
        <div class="side-card info" data-reveal>
          <p class="info__addr">${icon('pin')}<span>${esc(s.street)}<small>${s.dist} mi from ${esc(store.postcode)}</small></span></p>
          <table class="hours">
            <caption class="sr">Opening hours</caption>
            ${[1, 2, 3, 4, 5, 6, 0].map(d => `<tr class="${d === today ? 'is-today' : ''}"><th scope="row">${DAYS[d].slice(0, 3)}</th><td>${s.hours[d] ? `${fmtH(s.hours[d][0])} – ${fmtH(s.hours[d][1])}` : 'Closed'}</td></tr>`).join('')}
          </table>
        </div>
        <div class="side-card mini-basket" data-mini="${s.id}"></div>
      </aside>
    </div>

    <section class="pairs wrap">
      <header class="sec-head sec-head--split">
        <div><p class="kicker" data-reveal>Same courier, same basket</p><h2 class="display" data-split>Pairs well <em>with</em></h2></div>
        <p class="pairs__note" data-reveal>Add from any of these and it all arrives together, for one ${money(D.deliveryFee)} delivery.</p>
      </header>
      <div class="shop-grid shop-grid--three">${s.pairs.map(pid => shopCard(shopById[pid])).join('')}</div>
    </section>`;
    return { html, title: s.name, dark: true, mount: root => mountShop(root, s) };
  }

  function mountShop(root, s) {
    // in-shop search
    const qIn = $('[data-shop-q]', root);
    qIn.addEventListener('input', () => {
      const t = qIn.value.trim().toLowerCase();
      let any = false;
      $$('.menu-sec[id^="sec-"]:not(#sec-featured):not(#sec-reviews)', root).forEach(sec => {
        let n = 0;
        $$('[data-row]', sec).forEach(r => { const ok = !t || r.dataset.text.includes(t); r.hidden = !ok; if (ok) n++; });
        sec.hidden = n === 0;
        if (n) any = true;
      });
      $('#sec-featured', root).hidden = !!t;
      $('[data-shop-empty]', root).hidden = any;
      if (hasGsap) ScrollTrigger.refresh();
    });

    // tabs: smooth scroll + scrollspy
    const tabs = $('[data-tabs]', root);
    tabs.addEventListener('click', e => {
      const a = e.target.closest('[data-tab]');
      if (!a) return;
      e.preventDefault();
      scrollToEl($('#' + a.dataset.tab, root), -130);
    });
    const secs = $$('[data-sec]', root);
    const spy = () => {
      let on = secs[0].id;
      secs.forEach(sec => { if (!sec.hidden && sec.getBoundingClientRect().top < 180) on = sec.id; });
      $$('[data-tab]', tabs).forEach(a => {
        const is = a.dataset.tab === on;
        if (is && !a.classList.contains('is-on')) tabs.scrollTo({ left: a.offsetLeft - 16, behavior: 'smooth' });
        a.classList.toggle('is-on', is);
      });
    };
    onScroll(spy);

    $('[data-share]', root).addEventListener('click', async () => {
      const url = location.href;
      try { await navigator.clipboard.writeText(url); toast(`Link to ${s.name} copied`); }
      catch (e) { toast('Copy this link: ' + url); }
    });

    const mini = $('[data-mini]', root);
    const renderMini = () => {
      const g = cartGroups().find(x => x.shop.id === s.id);
      const t = totals();
      if (!g) {
        mini.innerHTML = `<p class="kicker">Your basket</p><p class="mini-basket__empty">Nothing from ${esc(s.name)} yet. Tap <b>Add</b> on anything, and keep shopping other shops: one courier collects it all.</p>`;
        return;
      }
      const left = Math.max(0, s.min - g.subtotal);
      const n = g.items.reduce((a, x) => a + x.q, 0);
      mini.innerHTML = `<p class="kicker">Your basket</p>
        <p class="mini-basket__sum"><b>${n} item${n > 1 ? 's' : ''}</b> from ${esc(s.name)}<span>${money(g.subtotal)}</span></p>
        ${left > 0 ? `<div class="meter"><i style="width:${(g.subtotal / s.min) * 100}%"></i></div><p class="mini-basket__note">Add ${money(left)} more to reach this shop’s ${money(s.min)} minimum.</p>` : `<p class="mini-basket__note is-ok">${icon('check')} Shop minimum reached</p>`}
        ${t.groups.length > 1 ? `<p class="mini-basket__note">Plus ${t.groups.length - 1} other shop${t.groups.length > 2 ? 's' : ''}, still one delivery.</p>` : ''}
        <button type="button" class="btn btn--ink btn--block" data-open-basket><span>View basket · ${money(t.items)}</span></button>`;
    };
    renderMini();
    subs.add(renderMini);
    onCleanup(() => subs.delete(renderMini));
  }

  // ---------- CHECKOUT
  function slotDays() {
    const now = new Date();
    return [0, 1].map(d => {
      const day = new Date(now);
      day.setDate(now.getDate() + d);
      const list = [];
      for (let h = 8; h < 21; h++) {
        const start = new Date(day);
        start.setHours(h, 0, 0, 0);
        list.push({ h, label: `${fmtH(h)}–${fmtH(h + 1)}`, value: start.getTime(), off: start - now < 60 * 60 * 1000 });
      }
      return { label: d ? 'Tomorrow' : 'Today', sub: day.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }), list };
    });
  }

  function viewCheckout() {
    const t = totals();
    if (!t.count) {
      return {
        title: 'Checkout',
        html: `<section class="wrap blank">
          <div class="empty__art" aria-hidden="true">${icon('basket')}</div>
          <h1 class="display">Your basket is <em>empty.</em></h1>
          <p>Fill it from as many shops as you like. One courier brings it all.</p>
          <a class="btn btn--ink" href="#/shops"><span>Browse shops</span>${icon('arrow')}</a>
        </section>`,
      };
    }
    const closed = t.groups.filter(g => { const st = openState(g.shop); return !st.open || st.closesIn < 0.75; });
    const days = slotDays();
    const eta = Math.max(...t.groups.map(g => g.shop.eta[1])) + (t.groups.length - 1) * 3;
    const html = `
    <section class="checkout wrap">
      <header class="checkout__head">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a><span>/</span><button type="button" class="linkish" data-open-basket>Basket</button><span>/</span><span>Checkout</span></nav>
        <h1 class="display">Nearly <em>at your door.</em></h1>
        <p class="lede">${t.groups.length} shop${t.groups.length > 1 ? 's' : ''}, ${t.count} item${t.count > 1 ? 's' : ''}, one courier.</p>
      </header>
      <div class="checkout__grid">
        <form class="co-form" data-co novalidate>
          <fieldset class="co-step">
            <legend><b>1</b> Where to?</legend>
            <div class="fields">
              <div class="field"><label for="coName">Full name</label><input id="coName" name="name" autocomplete="name" required placeholder="Alex Morgan"><p class="err"></p></div>
              <div class="field"><label for="coPhone">Mobile</label><input id="coPhone" name="phone" type="tel" autocomplete="tel" required placeholder="07700 900123"><p class="err"></p></div>
              <div class="field field--wide"><label for="coAddr">Address</label><input id="coAddr" name="address" autocomplete="street-address" required placeholder="Flat 2, 14 Mare Street"><p class="err"></p></div>
              <div class="field"><label for="coPost">Postcode</label><input id="coPost" name="postcode" autocomplete="postal-code" required value="${esc(store.postcode)}"><p class="err"></p></div>
              <div class="field"><label for="coNote">Note for the courier <small>optional</small></label><input id="coNote" name="note" placeholder="Blue door, buzzer 2"></div>
            </div>
            <label class="switch"><input type="checkbox" name="leave" checked><span class="switch__ui"></span><span>Leave at the door if I don’t answer</span></label>
          </fieldset>

          <fieldset class="co-step">
            <legend><b>2</b> When?</legend>
            <div class="when">
              <label class="radio-card ${closed.length ? 'is-off' : ''}">
                <input type="radio" name="when" value="asap" ${closed.length ? 'disabled' : 'checked'}>
                <span class="radio-card__ui"></span>
                <span><b>As soon as possible</b><small>${closed.length ? `${esc(closed.map(g => g.shop.name).join(', '))} ${closed.length > 1 ? 'are' : 'is'} closed or closing soon` : `About ${eta} minutes`}</small></span>
                ${icon('bike')}
              </label>
              <label class="radio-card">
                <input type="radio" name="when" value="slot" ${closed.length ? 'checked' : ''}>
                <span class="radio-card__ui"></span>
                <span><b>Choose a time</b><small>Hour-long slots, today or tomorrow</small></span>
                ${icon('clock')}
              </label>
            </div>
            <div class="slots" data-slots ${closed.length ? '' : 'hidden'}>
              <div class="slots__days" role="tablist">${days.map((d, i) => `<button type="button" role="tab" class="${i === 0 ? 'is-on' : ''}" data-day="${i}" aria-selected="${i === 0}">${d.label}<small>${d.sub}</small></button>`).join('')}</div>
              ${days.map((d, i) => `<div class="slots__grid" data-daygrid="${i}" ${i ? 'hidden' : ''}>${d.list.map(sl => `<label class="slot ${sl.off ? 'is-off' : ''}"><input type="radio" name="slot" value="${sl.value}" ${sl.off ? 'disabled' : ''}><span>${sl.label}</span></label>`).join('')}${d.list.every(x => x.off) ? '<p class="slots__none">No slots left today, try tomorrow.</p>' : ''}</div>`).join('')}
              <p class="err" data-slot-err></p>
            </div>
          </fieldset>

          <fieldset class="co-step">
            <legend><b>3</b> If something’s sold out</legend>
            <div class="seg-radio">
              <label><input type="radio" name="subs" value="best" checked><span>Shop picks the best match</span></label>
              <label><input type="radio" name="subs" value="ask"><span>Message me first</span></label>
              <label><input type="radio" name="subs" value="refund"><span>Refund it</span></label>
            </div>
          </fieldset>

          <fieldset class="co-step">
            <legend><b>4</b> Thank your courier <small>100% goes to them</small></legend>
            <div class="seg-radio seg-radio--tips">
              ${[0, 1, 2, 3].map(v => `<label><input type="radio" name="tip" value="${v}" ${v === 1 ? 'checked' : ''}><span>${v ? money(v) : 'Not now'}</span></label>`).join('')}
            </div>
          </fieldset>

          <fieldset class="co-step">
            <legend><b>5</b> Payment</legend>
            <div class="pay">
              <div class="card3d" data-card>
                <div class="card3d__inner">
                  <div class="card3d__front">
                    <span class="card3d__brand" data-brand>CARD</span>
                    <span class="card3d__chip"></span>
                    <span class="card3d__num" data-cnum>•••• •••• •••• ••••</span>
                    <span class="card3d__row"><span data-cname>YOUR NAME</span><span data-cexp>MM/YY</span></span>
                  </div>
                  <div class="card3d__back"><span class="card3d__strip"></span><span class="card3d__cvc" data-ccvc>•••</span></div>
                </div>
              </div>
              <div class="fields">
                <div class="field field--wide"><label for="coCard">Card number</label><input id="coCard" name="card" inputmode="numeric" autocomplete="cc-number" placeholder="4242 4242 4242 4242" maxlength="19" required><p class="err"></p></div>
                <div class="field"><label for="coExp">Expiry</label><input id="coExp" name="exp" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/YY" maxlength="5" required><p class="err"></p></div>
                <div class="field"><label for="coCvc">CVC</label><input id="coCvc" name="cvc" inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="4" required><p class="err"></p></div>
              </div>
              <p class="pay__note">${icon('lock')} Demo checkout. No payment is taken, so any test numbers will do.</p>
            </div>
          </fieldset>

          <button class="btn btn--tomato btn--xl btn--block" type="submit" data-place><span>Place order · <b data-place-total>${money(t.total + 1)}</b></span>${icon('arrow')}</button>
          <p class="co-legal">By placing your order you agree to Larder’s demo terms. Wine is only handed to someone over 18 with ID.</p>
        </form>
        <aside class="co-summary">
          <div class="receipt" data-co-receipt></div>
        </aside>
      </div>
    </section>`;
    return { html, title: 'Checkout', mount: mountCheckout };
  }

  function receiptHtml(t, opts = {}) {
    return `<div class="receipt__top"><span class="receipt__logo">${logoMark()}<b>Larder</b></span><span>${opts.id ? esc(opts.id) : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
      ${t.groups.map(g => `<div class="receipt__shop"><p class="receipt__shopname">${stamp(g.shop, 'stamp--xs')}${esc(g.shop.name)}</p>
        <ul>${g.items.map(x => `<li><span>${x.q} × ${esc(x.p.name)}</span><i></i><b>${money(x.total)}</b></li>`).join('')}</ul></div>`).join('')}
      <dl class="receipt__sum">
        <div><dt>Items</dt><dd>${money(t.items)}</dd></div>
        <div><dt>Delivery <small>one courier, ${t.groups.length} stop${t.groups.length > 1 ? 's' : ''}</small></dt><dd>${t.delivery ? money(t.delivery) : '<em>Free</em>'}</dd></div>
        <div><dt>Service</dt><dd>${money(t.service)}</dd></div>
        ${opts.tip !== undefined ? `<div><dt>Courier tip</dt><dd>${t.tip ? money(t.tip) : '–'}</dd></div>` : ''}
        <div class="receipt__total"><dt>Total</dt><dd>${money(t.total)}</dd></div>
      </dl>
      <p class="receipt__foot">${t.groups.length > 1 ? `${t.groups.length} shops, 1 courier, 1 delivery fee` : 'Thank you for shopping local'}</p>`;
  }

  function mountCheckout(root) {
    const form = $('[data-co]', root);
    if (!form) return;
    const rec = $('[data-co-receipt]', root);
    const getTip = () => +(form.querySelector('[name=tip]:checked') || { value: 0 }).value;
    let placing = false;
    const render = () => {
      if (placing) return;
      const t = totals(store.cart, getTip());
      if (!t.count) { navigate(); return; }
      rec.innerHTML = receiptHtml(t, { tip: true });
      $('[data-place-total]', root).textContent = money(t.total);
    };
    render();
    subs.add(render);
    onCleanup(() => subs.delete(render));
    form.addEventListener('change', e => {
      if (e.target.name === 'tip') render();
      if (e.target.name === 'when') {
        const slots = $('[data-slots]', root);
        slots.hidden = e.target.value !== 'slot';
        if (!slots.hidden && hasGsap && !reduce) gsap.from(slots, { opacity: 0, y: -8, duration: 0.4 });
      }
    });
    $$('[data-day]', root).forEach(b => b.addEventListener('click', () => {
      $$('[data-day]', root).forEach(x => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-selected', x === b); });
      $$('[data-daygrid]', root).forEach(g => { g.hidden = g.dataset.daygrid !== b.dataset.day; });
    }));

    // live card preview
    const card = $('[data-card]', root);
    const f = form.elements;
    f.card.addEventListener('input', () => {
      const d = f.card.value.replace(/\D/g, '').slice(0, 16);
      f.card.value = d.replace(/(.{4})/g, '$1 ').trim();
      const shown = (d + '•'.repeat(16 - d.length)).replace(/(.{4})/g, '$1 ').trim();
      $('[data-cnum]', card).textContent = shown;
      $('[data-brand]', card).textContent = /^4/.test(d) ? 'VISA' : /^5[1-5]|^2[2-7]/.test(d) ? 'MASTERCARD' : /^3[47]/.test(d) ? 'AMEX' : 'CARD';
    });
    f.exp.addEventListener('input', e => {
      let d = f.exp.value.replace(/\D/g, '').slice(0, 4);
      if (d.length >= 3) d = d.slice(0, 2) + '/' + d.slice(2);
      else if (d.length === 2 && e.inputType !== 'deleteContentBackward') d += '/';
      f.exp.value = d;
      $('[data-cexp]', card).textContent = d || 'MM/YY';
    });
    f.cvc.addEventListener('input', () => { f.cvc.value = f.cvc.value.replace(/\D/g, '').slice(0, 4); $('[data-ccvc]', card).textContent = f.cvc.value || '•••'; });
    f.cvc.addEventListener('focus', () => card.classList.add('is-flipped'));
    f.cvc.addEventListener('blur', () => card.classList.remove('is-flipped'));
    f.name.addEventListener('input', () => { $('[data-cname]', card).textContent = f.name.value.toUpperCase() || 'YOUR NAME'; });

    const setErr = (input, msg) => {
      const field = input.closest('.field');
      field.classList.toggle('is-error', !!msg);
      $('.err', field).textContent = msg || '';
      input.setAttribute('aria-invalid', !!msg);
    };
    const checks = {
      name: v => (v.trim().length > 1 ? '' : 'Please add your name.'),
      phone: v => (v.replace(/\D/g, '').length >= 10 ? '' : 'We need a number the courier can call.'),
      address: v => (v.trim().length > 4 ? '' : 'Where should we bring it?'),
      postcode: v => (/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(v.trim()) ? '' : 'That doesn’t look like a UK postcode.'),
      card: v => (v.replace(/\D/g, '').length >= 15 ? '' : 'Card number looks too short.'),
      exp: v => {
        const m = v.match(/^(\d{2})\/(\d{2})$/);
        if (!m || +m[1] < 1 || +m[1] > 12) return 'Use MM/YY.';
        const end = new Date(2000 + +m[2], +m[1], 1);
        return end > new Date() ? '' : 'This card has expired.';
      },
      cvc: v => (/^\d{3,4}$/.test(v) ? '' : '3 or 4 digits on the back.'),
    };
    Object.keys(checks).forEach(k => {
      f[k].addEventListener('blur', () => { if (f[k].value) setErr(f[k], checks[k](f[k].value)); });
      // once a field is flagged, clear the message as soon as it's fixed
      f[k].addEventListener('input', () => { if (f[k].closest('.field').classList.contains('is-error') && !checks[k](f[k].value)) setErr(f[k], ''); });
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      let first = null;
      Object.keys(checks).forEach(k => { const m = checks[k](f[k].value); setErr(f[k], m); if (m && !first) first = f[k]; });
      const when = (form.querySelector('[name=when]:checked') || {}).value;
      const slot = form.querySelector('[name=slot]:checked');
      const slotErr = $('[data-slot-err]', root);
      slotErr.textContent = '';
      if (when !== 'asap' && !slot) { slotErr.textContent = 'Pick a delivery slot.'; if (!first) first = $('[data-slots]', root); }
      if (!when) { slotErr.textContent = 'Choose when you’d like it.'; if (!first) first = $('[data-slots]', root); }
      if (first) { scrollToEl(first, -140); setTimeout(() => first.focus && first.focus({ preventScroll: true }), 400); return; }
      const btn = $('[data-place]', root);
      placing = true;
      btn.disabled = true;
      btn.classList.add('is-loading');
      const t = totals(store.cart, getTip());
      const id = 'LDR-' + Math.floor(1000 + Math.random() * 9000);
      store.orders[id] = {
        id, created: Date.now(), cart: { ...store.cart }, tip: getTip(),
        name: f.name.value.trim().split(' ')[0], address: f.address.value.trim(), postcode: f.postcode.value.trim().toUpperCase(),
        slot: when === 'asap' ? null : +slot.value, total: t.total,
      };
      setTimeout(() => {
        store.cart = {};
        emit();
        stampOverlay('Order placed', id).then(() => { location.hash = '#/order/' + id; });
      }, 900);
    });
  }

  // ---------- ORDER TRACKING
  const SIM_MS = 80000;
  function orderRoute(cart) {
    const ids = [...new Set(Object.keys(cart).map(k => D.products[k] && D.products[k].shop).filter(Boolean))];
    const pts = ids.map(id => shopById[id]);
    const md = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    const route = [];
    let at = D.hub;
    while (pts.length) {
      pts.sort((a, b) => md(at, a) - md(at, b));
      at = pts.shift();
      route.push(at.id);
    }
    return ['hub', ...route, 'home'];
  }

  function demoOrder(id) {
    return { id, created: Date.now(), cart: { 'crumb:sourdough': 1, 'rind:comte': 1, 'patch:tomatoes': 2, 'cellar:gamay': 1 }, tip: 1, name: 'there', address: '14 Mare Street', postcode: store.postcode, slot: null, demo: true };
  }

  function viewOrder(id) {
    let o = store.orders[id];
    if (!o) { o = demoOrder(id); store.orders[id] = o; save(); }
    const t = totals(o.cart, o.tip);
    const route = orderRoute(o.cart);
    const shopsOnRoute = route.filter(r => r !== 'hub' && r !== 'home').map(sid => shopById[sid]);
    const html = `
    <section class="track wrap">
      <header class="track__head">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a><span>/</span><span>Order ${esc(o.id)}</span></nav>
        <div class="track__titles">
          <h1 class="display" data-track-title>Your shops are packing</h1>
          <p class="track__eta"><span data-track-eta>Arriving in <b>38 min</b></span><span class="track__by" data-track-by></span></p>
        </div>
        <div class="track__progress"><i data-track-bar></i></div>
      </header>
      <div class="track__grid">
        <div class="track__map">
          ${MapKit.svg({ route, shops: D.shops, cls: 'nmap--track', aria: 'Live map of your courier' })}
          <div class="track__chip" data-track-chip>${icon('bike')} <span>Sam is getting ready</span></div>
          ${o.slot ? `<div class="track__sched" data-sched><p class="kicker">Scheduled</p><h2 class="display">${new Date(o.slot).toLocaleDateString('en-GB', { weekday: 'long' })}, <em>${fmtH(new Date(o.slot).getHours())}–${fmtH(new Date(o.slot).getHours() + 1)}</em></h2><p>Your shops will pack this fresh on the day.</p><button type="button" class="btn btn--ink" data-skip><span>Skip ahead to delivery day</span>${icon('arrow')}</button><small>Demo shortcut</small></div>` : ''}
        </div>
        <aside class="track__side">
          <ol class="timeline" data-timeline>
            <li data-tl="confirmed"><i></i><div><b>Order confirmed</b><small>${shopsOnRoute.length} shop${shopsOnRoute.length > 1 ? 's' : ''} notified</small></div></li>
            ${shopsOnRoute.map(s => `<li data-tl="${s.id}"><i></i><div><b>${esc(s.name)}</b><small data-tl-sub>Packing your order</small></div>${stamp(s, 'stamp--xs')}</li>`).join('')}
            <li data-tl="way"><i></i><div><b>On the way to you</b><small>${esc(o.address)}, ${esc(o.postcode)}</small></div></li>
            <li data-tl="done"><i></i><div><b>Delivered</b><small data-tl-done-sub>Enjoy it all</small></div></li>
          </ol>
          <div class="courier-card">
            <span class="courier-card__face">S</span>
            <div><b>Sam</b><small>Electric cargo bike · ${icon('star', 'ic--star')} 4.97</small></div>
            <button type="button" class="icon-btn" data-msg aria-label="Message Sam">${icon('chat')}</button>
          </div>
          <details class="track__receipt">
            <summary>Order summary · ${money(t.total)}</summary>
            <div class="receipt receipt--flat">${receiptHtml(t, { id: o.id, tip: true })}</div>
          </details>
          <div class="rate" data-rate hidden>
            <p><b>How did we do?</b></p>
            <div class="rate__stars" role="radiogroup" aria-label="Rate your delivery">${[1, 2, 3, 4, 5].map(n => `<button type="button" role="radio" aria-checked="false" aria-label="${n} star${n > 1 ? 's' : ''}" data-star="${n}">${icon('star')}</button>`).join('')}</div>
            <button type="button" class="btn btn--line btn--block" data-reorder><span>Order the same again</span></button>
          </div>
        </aside>
      </div>
      <p class="track__demo">Demo mode: the whole journey plays out in about 80 seconds.</p>
    </section>`;
    return { html, title: 'Order ' + o.id, mount: root => mountOrder(root, o, route, shopsOnRoute) };
  }

  function mountOrder(root, o, route, shopsOnRoute) {
    const svg = $('.nmap--track', root);
    const rt = MapKit.route(svg);
    const title = $('[data-track-title]', root), eta = $('[data-track-eta]', root), by = $('[data-track-by]', root);
    const bar = $('[data-track-bar]', root), chip = $('[data-track-chip] span', root);
    const shopStops = route.map((r, i) => ({ r, f: rt.stops[i] })).filter(x => x.r !== 'hub' && x.r !== 'home');
    const totalMin = Math.max(...shopsOnRoute.map(s => s.eta[1])) + (shopsOnRoute.length - 1) * 3;
    let started = o.slot ? null : o.created;
    let lastTitle = '';
    const setTitle = txt => {
      if (txt === lastTitle) return;
      lastTitle = txt;
      title.textContent = txt;
      if (hasGsap && !reduce) gsap.from(title, { y: 16, opacity: 0, duration: 0.5, ease: 'expo.out' });
    };
    const arrive = new Date((started || Date.now()) + totalMin * 60000);
    by.textContent = o.slot ? '' : `by ${arrive.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })}`;

    const tick = () => {
      if (!started) {
        rt.set(0);
        setTitle('Booked in');
        eta.innerHTML = 'We’ll send a text when your courier sets off';
        chip.textContent = 'Scheduled';
        $('[data-tl="confirmed"]', root).className = 'is-done';
        return;
      }
      const tt = clamp((Date.now() - started) / SIM_MS, 0, 1);
      const rp = clamp((tt - 0.08) / 0.92, 0, 1);
      rt.set(rp);
      bar.style.transform = `scaleX(${tt})`;
      const mins = Math.max(0, Math.round(totalMin * (1 - tt)));
      const next = shopStops.find(x => rp < x.f - 0.002);
      $$('[data-tl]', root).forEach(li => {
        const k = li.dataset.tl;
        let state = '';
        if (k === 'confirmed') state = 'done';
        else if (k === 'way') state = rp >= 0.999 ? 'done' : !next ? 'now' : '';
        else if (k === 'done') state = rp >= 0.999 ? 'done' : '';
        else {
          const stop = shopStops.find(x => x.r === k);
          state = rp >= stop.f - 0.002 ? 'done' : next && next.r === k ? 'now' : '';
          const sub = $('[data-tl-sub]', li);
          sub.textContent = state === 'done' ? 'Collected' : state === 'now' && tt > 0.08 ? 'Courier on the way' : tt > 0.04 ? 'Packed and waiting' : 'Packing your order';
        }
        li.className = state ? 'is-' + state : '';
      });
      if (rp >= 0.999) {
        setTitle('Delivered. Enjoy!');
        eta.innerHTML = `Arrived ${new Date().toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })}`;
        chip.textContent = 'Delivered to your door';
        by.textContent = '';
        $('[data-rate]', root).hidden = false;
        clearInterval(timer);
        return;
      }
      if (tt < 0.08) { setTitle('Your shops are packing'); chip.textContent = 'Sam is heading out'; }
      else if (next) { setTitle(`Collecting from ${shopById[next.r].name}`); chip.textContent = `Riding to ${shopById[next.r].name}`; }
      else { setTitle('On the way to you'); chip.textContent = `Riding to ${o.address}`; }
      eta.innerHTML = `Arriving in <b>${mins} min</b>`;
    };
    let timer = setInterval(tick, 200);
    tick();
    onCleanup(() => clearInterval(timer));

    const skip = $('[data-skip]', root);
    if (skip) skip.addEventListener('click', () => {
      started = Date.now();
      o.slot = null; o.created = started; save();
      const box = $('[data-sched]', root);
      if (hasGsap && !reduce) gsap.to(box, { opacity: 0, y: -10, duration: 0.4, onComplete: () => box.remove() }); else box.remove();
      by.textContent = `by ${new Date(started + totalMin * 60000).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })}`;
      clearInterval(timer);
      timer = setInterval(tick, 200);
    });
    $('[data-msg]', root).addEventListener('click', () => toast('Messaging is switched off in this demo, but Sam says hi.'));
    $$('[data-star]', root).forEach(b => b.addEventListener('click', () => {
      const n = +b.dataset.star;
      $$('[data-star]', root).forEach(x => { const on = +x.dataset.star <= n; x.classList.toggle('is-on', on); x.setAttribute('aria-checked', +x.dataset.star === n); });
      toast(n >= 4 ? 'Thank you! We’ll pass that on to Sam and the shops.' : 'Thanks. We’ll look into what went wrong.');
    }));
    $('[data-reorder]', root).addEventListener('click', () => {
      Object.entries(o.cart).forEach(([k, q]) => { store.cart[k] = (store.cart[k] || 0) + q; });
      emit();
      openDrawer();
    });
  }

  // ---------- SELL
  function viewSell() {
    const html = `
    <section class="sell-hero">
      <div class="wrap sell-hero__grid">
        <div class="sell-hero__copy">
          <p class="eyebrow" data-reveal><span class="pulse"></span>For independent food shops</p>
          <h1 class="display" data-split>Your shop. Our couriers. <em>Your rules.</em></h1>
          <p class="lede" data-reveal>List your counter on Larder and reach thousands of neighbours who would rather shop with you. We handle the orders, the riders and the payments. You keep doing the thing you’re good at.</p>
          <div class="sell-hero__cta" data-reveal>
            <button type="button" class="btn btn--tomato" data-goto="#apply" data-magnetic><span>Apply in 5 minutes</span>${icon('arrow')}</button>
            <button type="button" class="btn btn--line" data-goto="#calc"><span>Run the numbers</span></button>
          </div>
          <ul class="sell-hero__facts" data-reveal>
            <li><b>12%</b><span>flat commission</span></li>
            <li><b>${D.currency}0</b><span>to join, no hardware</span></li>
            <li><b>Weekly</b><span>payouts, every Monday</span></li>
          </ul>
        </div>
        <div class="sell-hero__media" data-reveal="clip">
          <video data-src="assets/video/courier.mp4" poster="assets/img/poster/courier.webp" muted loop playsinline></video>
          <div class="ping-stack" data-pings aria-hidden="true"></div>
        </div>
      </div>
    </section>

    <section class="sell-steps wrap">
      <header class="sec-head"><p class="kicker" data-reveal><span>01</span> How it works for shops</p><h2 class="display" data-split>Live in a week, <em>not a quarter.</em></h2></header>
      <ol class="steps3">
        <li data-reveal><span class="steps3__n">1</span><h3>Tell us about your shop</h3><p>Five minutes on the form below. We visit, taste a few things and take photos of your counter, on us.</p></li>
        <li data-reveal><span class="steps3__n">2</span><h3>Add your counter</h3><p>Upload products from a spreadsheet or your till, or let us type them in. Mark things sold out from your phone in one tap.</p></li>
        <li data-reveal><span class="steps3__n">3</span><h3>Pack, we collect</h3><p>Orders ping your phone with a pick-up time. A Larder courier collects, often alongside your neighbours’ orders.</p></li>
      </ol>
    </section>

    <section class="calc wrap" id="calc">
      <div class="calc__card" data-reveal>
        <div class="calc__inputs">
          <p class="kicker"><span>02</span> Run the numbers</p>
          <h2 class="display">What you’d <em>actually keep</em></h2>
          <div class="range">
            <label for="rOrders">Orders a week <output data-out="orders">120</output></label>
            <input type="range" id="rOrders" min="10" max="500" step="5" value="120" data-r="orders">
          </div>
          <div class="range">
            <label for="rBasket">Average order from your shop <output data-out="basket">${D.currency}28</output></label>
            <input type="range" id="rBasket" min="8" max="80" step="1" value="28" data-r="basket">
          </div>
          <p class="calc__fine">Based on 4.33 weeks a month. Typical delivery apps charge 25–35% plus fees; we used 30%.</p>
        </div>
        <div class="calc__out">
          <p class="calc__label">You keep each month on Larder</p>
          <p class="calc__big display" data-keep>${D.currency}0</p>
          <div class="bars">
            <div class="bar bar--us"><span>Larder, 12%</span><i data-bar-us></i><b data-v-us></b></div>
            <div class="bar bar--them"><span>Typical app, 30%</span><i data-bar-them></i><b data-v-them></b></div>
          </div>
          <p class="calc__diff">That’s <b data-diff>${D.currency}0</b> more every month, or <b data-diff-y>${D.currency}0</b> a year.</p>
        </div>
      </div>
    </section>

    <section class="dash wrap">
      <header class="sec-head sec-head--split">
        <div><p class="kicker" data-reveal><span>03</span> Your shop dashboard</p><h2 class="display" data-split>Everything on <em>one screen.</em></h2></div>
        <p class="pairs__note" data-reveal>Works on the phone in your apron pocket. No tablet, no printer, no extra till.</p>
      </header>
      <div class="dashboard" data-reveal>
        <div class="dashboard__top">
          <span class="dashboard__shop">${stamp(shopById.crumb, 'stamp--xs')}<b>Crumb &amp; Kiln</b><span class="status is-open"><i></i>Taking orders</span></span>
          <span class="dashboard__date">${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
        <div class="dashboard__kpis">
          <div><small>Orders today</small><b data-k-orders>46</b><em>+18% vs last ${DAYS[new Date().getDay()].slice(0, 3)}</em></div>
          <div><small>Sales today</small><b data-k-sales>${money(612.4)}</b><em>${money(538.9)} after fees</em></div>
          <div><small>Avg. pack time</small><b>6m 40s</b><em>Couriers wait 1m on avg.</em></div>
          <div class="dashboard__spark"><small>Orders by hour</small>${sparkline()}</div>
        </div>
        <div class="dashboard__orders">
          <div class="dashboard__head"><span>Live orders</span><span>Pick-up</span><span>Status</span></div>
          <ul data-dash-orders></ul>
        </div>
      </div>
    </section>

    <section class="apply wrap" id="apply">
      <div class="apply__grid">
        <form class="apply__form" data-apply novalidate data-reveal>
          <p class="kicker"><span>04</span> Apply</p>
          <h2 class="display">Get your shop <em>on Larder</em></h2>
          <div class="fields">
            <div class="field field--wide"><label for="aShop">Shop name</label><input id="aShop" name="shop" required placeholder="e.g. Crumb &amp; Kiln"><p class="err"></p></div>
            <div class="field"><label for="aType">What do you sell?</label><select id="aType" name="type" required><option value="">Choose one</option>${['Bakery', 'Greengrocer', 'Cheesemonger', 'Butcher', 'Fishmonger', 'Deli', 'Wine & drink', 'Coffee', 'Something else'].map(x => `<option>${x}</option>`).join('')}</select><p class="err"></p></div>
            <div class="field"><label for="aPost">Shop postcode</label><input id="aPost" name="postcode" required placeholder="E8 4QJ"><p class="err"></p></div>
            <div class="field field--wide"><label for="aEmail">Email</label><input id="aEmail" name="email" type="email" required placeholder="hello@yourshop.co.uk"><p class="err"></p></div>
          </div>
          <button class="btn btn--ink btn--block" type="submit"><span>Send application</span>${icon('arrow')}</button>
          <p class="form-msg" role="status"></p>
        </form>
        <div class="faq" data-reveal>
          <h3>Good questions</h3>
          ${[
            ['What does it cost?', 'A flat 12% on orders through Larder, including card fees. No sign-up fee, no monthly charge, no hardware. Customers pay the delivery fee, not you.'],
            ['Who delivers?', 'Larder couriers on electric cargo bikes, employed by us and paid a proper hourly wage. One rider usually collects from several shops on a loop.'],
            ['Can I set my own hours and stock?', 'Always. Pause the shop, mark items sold out or change prices from your phone in seconds. Your counter, your rules.'],
            ['How do payouts work?', 'Every Monday, straight to your bank, with a clear statement for each order. No holding periods.'],
            ['Do you take exclusivity?', 'Never. Keep selling in person, on your own website or anywhere else you like.'],
          ].map(([q, a], i) => `<details ${i === 0 ? 'open' : ''}><summary>${esc(q)}${icon('plus')}</summary><p>${esc(a)}</p></details>`).join('')}
        </div>
      </div>
    </section>`;
    return { html, title: 'Sell on Larder', mount: mountSell };
  }

  function sparkline() {
    const pts = [2, 5, 9, 6, 4, 5, 8, 7, 4, 3, 5, 6];
    const w = 220, h = 54, max = 10;
    const xy = pts.map((v, i) => [(i / (pts.length - 1)) * w, h - (v / max) * h]);
    const line = xy.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    return `<svg class="spark" viewBox="0 -4 ${w} ${h + 8}" preserveAspectRatio="none" aria-hidden="true"><path class="spark__area" d="${line} L${w} ${h} L0 ${h} Z"/><path class="spark__line" d="${line}"/><circle class="spark__dot" cx="${xy[xy.length - 1][0]}" cy="${xy[xy.length - 1][1]}" r="4"/></svg>`;
  }

  function mountSell(root) {
    $$('[data-goto]', root).forEach(b => b.addEventListener('click', () => scrollToEl($(b.dataset.goto, root), -90)));

    // calculator
    const r = { orders: $('[data-r=orders]', root), basket: $('[data-r=basket]', root) };
    const out = k => $(`[data-out=${k}]`, root);
    let shown = { keep: 0, us: 0, them: 0, diff: 0 };
    const calc = () => {
      const o = +r.orders.value, b = +r.basket.value;
      out('orders').textContent = o;
      out('basket').textContent = D.currency + b;
      [r.orders, r.basket].forEach(i => i.style.setProperty('--p', ((i.value - i.min) / (i.max - i.min)) * 100 + '%'));
      const month = o * b * 4.33;
      const target = { keep: month * 0.88, us: month * 0.88, them: month * 0.7, diff: month * 0.18 };
      const fmt = n => D.currency + Math.round(n).toLocaleString('en-GB');
      const paint = v => {
        $('[data-keep]', root).textContent = fmt(v.keep);
        $('[data-v-us]', root).textContent = fmt(v.us);
        $('[data-v-them]', root).textContent = fmt(v.them);
        $('[data-diff]', root).textContent = fmt(v.diff);
        $('[data-diff-y]', root).textContent = fmt(v.diff * 12);
      };
      $('[data-bar-us]', root).style.transform = 'scaleX(1)';
      $('[data-bar-them]', root).style.transform = `scaleX(${0.7 / 0.88})`;
      if (hasGsap && !reduce) gsap.to(shown, { ...target, duration: 0.6, ease: 'expo.out', overwrite: true, onUpdate: () => paint(shown) });
      else { shown = target; paint(target); }
    };
    Object.values(r).forEach(i => i.addEventListener('input', calc));
    calc();

    // dashboard live orders
    const list = $('[data-dash-orders]', root);
    const names = ['Ola B.', 'Marcus T.', 'Hannah W.', 'Dev P.', 'Aisha N.', 'Tom E.', 'Chloe P.', 'Ben A.'];
    const items = ['Country sourdough, Butter croissant × 2', 'Seeded malt tin', 'Cardamom knot × 4', 'Brioche loaf, Pain au chocolat', 'Pizza dough balls × 2', 'Dark rye, 100%', 'Almond croissant × 3'];
    const statuses = [['New', 'is-new'], ['Packing', 'is-pack'], ['Ready', 'is-ready'], ['Collected', 'is-done']];
    let n = 0;
    const addOrder = (instant) => {
      const now = new Date(Date.now() + (8 + (n % 5) * 3) * 60000);
      const li = document.createElement('li');
      li.innerHTML = `<span><b>#${4120 + n} · ${names[n % names.length]}</b><small>${items[n % items.length]}</small></span><span>${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span><span class="pill ${statuses[0][1]}">${statuses[0][0]}</span>`;
      li.dataset.s = 0;
      list.prepend(li);
      n++;
      if (!instant && hasGsap && !reduce) gsap.from(li, { height: 0, opacity: 0, duration: 0.5, ease: 'expo.out' });
      $$('li', list).slice(5).forEach(x => x.remove());
      $('[data-k-orders]', root).textContent = 46 + n - 4;
    };
    for (let i = 0; i < 4; i++) addOrder(true);
    $$('li', list).forEach((li, i) => { const s = Math.min(3, i); li.dataset.s = s; const p = $('.pill', li); p.className = 'pill ' + statuses[s][1]; p.textContent = statuses[s][0]; });
    const advance = () => {
      $$('li', list).forEach(li => {
        const s = Math.min(3, +li.dataset.s + 1);
        li.dataset.s = s;
        const p = $('.pill', li);
        p.className = 'pill ' + statuses[s][1];
        p.textContent = statuses[s][0];
      });
      addOrder(false);
    };
    let dt = null;
    const io = new IntersectionObserver(([en]) => { clearInterval(dt); if (en.isIntersecting) dt = setInterval(advance, 3200); }, { threshold: 0.2 });
    io.observe(list);
    onCleanup(() => { clearInterval(dt); io.disconnect(); });

    // order pings over the hero video
    const pings = $('[data-pings]', root);
    const pingData = [['crumb', '3 items', 18.4], ['rind', '2 items', 21.3], ['patch', '6 items', 27.9], ['cellar', '1 item', 16], ['fiorella', '4 items', 24.6]];
    let pi = 0;
    const ping = () => {
      const [sid, what, amt] = pingData[pi++ % pingData.length];
      const s = shopById[sid];
      const el = document.createElement('div');
      el.className = 'ping';
      el.innerHTML = `${stamp(s, 'stamp--xs')}<span><b>New order · ${money(amt)}</b><small>${esc(s.name)} · ${what} · collect in 12 min</small></span>`;
      pings.prepend(el);
      if (hasGsap && !reduce) gsap.from(el, { y: -20, opacity: 0, scale: 0.9, duration: 0.6, ease: 'back.out(1.6)' });
      $$('.ping', pings).slice(3).forEach(x => x.remove());
    };
    ping(); ping();
    const pt = setInterval(ping, 3600);
    onCleanup(() => clearInterval(pt));

    // application
    const form = $('[data-apply]', root);
    form.addEventListener('submit', e => {
      e.preventDefault();
      const f = form.elements;
      const errs = {
        shop: f.shop.value.trim() ? '' : 'What’s the shop called?',
        type: f.type.value ? '' : 'Pick the closest match.',
        postcode: /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(f.postcode.value.trim()) ? '' : 'A UK postcode, please.',
        email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.value.trim()) ? '' : 'We’ll need an email to reply to.',
      };
      let first = null;
      Object.entries(errs).forEach(([k, m]) => {
        const fld = f[k].closest('.field');
        fld.classList.toggle('is-error', !!m);
        $('.err', fld).textContent = m;
        if (m && !first) first = f[k];
      });
      if (first) { first.focus(); return; }
      const name = f.shop.value.trim();
      form.innerHTML = `<div class="apply__done">
        <div class="apply__stamp">${icon('check')}</div>
        <p class="kicker">Application received</p>
        <h2 class="display">Thanks, <em>${esc(name)}.</em></h2>
        <p>We’ll be in touch within two working days to arrange a visit. Expect someone hungry.</p>
      </div>`;
      if (hasGsap && !reduce) gsap.from(form.firstElementChild.children, { y: 20, opacity: 0, stagger: 0.08, duration: 0.7, ease: 'expo.out' });
    });
  }

  function viewNotFound() {
    return {
      title: 'Not found',
      html: `<section class="wrap blank">
        <div class="empty__art" aria-hidden="true">${icon('store')}</div>
        <h1 class="display">This shelf is <em>empty.</em></h1>
        <p>We couldn’t find that page. The shops are still open, though.</p>
        <a class="btn btn--ink" href="#/"><span>Back to the high street</span>${icon('arrow')}</a>
      </section>`,
    };
  }

  /* --------------------------------------------------------------- router */
  const routes = [
    [/^\/?$/, (m, q) => viewHome(q)],
    [/^\/shops$/, (m, q) => viewShops(q)],
    [/^\/shop\/([\w-]+)$/, m => viewShop(m[1])],
    [/^\/checkout$/, () => viewCheckout()],
    [/^\/order\/([\w-]+)$/, m => viewOrder(m[1])],
    [/^\/sell$/, () => viewSell()],
  ];
  let firstLoad = true;
  let navToken = 0;
  const INTRO = 1.55; // seconds until the loader starts lifting on first visit

  function parseHash() {
    const h = location.hash.replace(/^#/, '') || '/';
    const [path, qs] = h.split('?');
    return { path, q: new URLSearchParams(qs || '') };
  }

  async function navigate() {
    let { path, q } = parseHash();
    // a plain in-page anchor is not a route; only fall back to home if nothing is rendered yet
    if (!path.startsWith('/')) {
      if (app.children.length) return;
      path = '/';
    }
    const token = ++navToken;
    let view = null;
    for (const [re, fn] of routes) { const m = path.match(re); if (m) { view = fn(m, q); break; } }
    if (!view) view = viewNotFound();
    closeAll();
    const animate = !firstLoad && hasGsap && !reduce;
    if (animate) await curtain(true);
    if (token !== navToken) return;
    teardown();
    app.innerHTML = view.html;
    document.title = view.title ? `${view.title} · Larder` : 'Larder · The whole high street, in one basket';
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
    setActiveNav(path, q);
    document.documentElement.classList.toggle('nav-on-dark', !!view.dark);
    if (view.mount) view.mount(app, q);
    initMotion(app);
    lazyVideos(app);
    if (animate) curtain(false);
    if (!firstLoad) app.focus({ preventScroll: true });
    firstLoad = false;
  }

  function teardown() {
    while (cleanups.length) { try { cleanups.pop()(); } catch (e) { /* ignore */ } }
    if (hasGsap) ScrollTrigger.getAll().forEach(t => t.kill());
    $$('video', app).forEach(v => { v.pause(); v.removeAttribute('src'); v.load(); });
  }

  function curtain(cover) {
    const c = $('#curtain');
    const bars = $$('span', c);
    return new Promise(res => {
      if (cover) {
        c.classList.add('is-on');
        gsap.fromTo(bars, { scaleY: 0, transformOrigin: '50% 0%' }, { scaleY: 1, duration: 0.42, stagger: 0.04, ease: 'power3.inOut', onComplete: res });
      } else {
        gsap.to(bars, { scaleY: 0, transformOrigin: '50% 100%', duration: 0.5, stagger: 0.04, ease: 'power3.inOut', delay: 0.05, onComplete: () => { c.classList.remove('is-on'); res(); } });
      }
    });
  }

  function setActiveNav(path, q) {
    const key = path.startsWith('/shop') ? 'shops' : path === '/sell' ? 'sell' : path === '/' || path === '' ? (q.get('s') === 'how' ? 'how' : 'home') : '';
    $$('[data-nav]').forEach(a => a.classList.toggle('is-on', a.dataset.nav === key));
    $$('[data-tab-nav]').forEach(a => a.classList.toggle('is-on', a.dataset.tabNav === key || (key === 'how' && a.dataset.tabNav === 'home')));
  }

  /* --------------------------------------------------------------- motion */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1, smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  function scrollToEl(el, offset = 0) {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset, duration: 1.2 });
    else window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + offset, behavior: reduce ? 'auto' : 'smooth' });
  }

  // one shared scroll listener; views register handlers that are dropped on route change
  const scrollFns = new Set();
  let scrollRaf = 0;
  function onScroll(fn) { scrollFns.add(fn); onCleanup(() => scrollFns.delete(fn)); }
  addEventListener('scroll', () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; scrollFns.forEach(f => f()); navOnScroll(); });
  }, { passive: true });

  const nav = $('#nav');
  let lastY = 0;
  function navOnScroll() {
    const y = scrollY;
    nav.classList.toggle('is-solid', y > 12);
    const hide = y > 400 && y > lastY + 4 && !document.body.classList.contains('is-locked');
    if (y < lastY - 4 || y < 400) nav.classList.remove('is-hidden');
    else if (hide) nav.classList.add('is-hidden');
    document.documentElement.classList.toggle('nav-hidden', nav.classList.contains('is-hidden'));
    lastY = y;
  }

  function splitWords(el) {
    if (el.dataset.splitDone) return;
    el.dataset.splitDone = '1';
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const i = document.createElement('span');
            i.className = 'wi';
            i.textContent = part;
            w.appendChild(i);
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
  }

  function initMotion(root) {
    if (!hasGsap || reduce) {
      $$('[data-count]', root).forEach(el => { el.textContent = (+el.dataset.count).toLocaleString('en-GB'); });
      return;
    }
    $$('[data-split]', root).forEach(el => {
      splitWords(el);
      gsap.fromTo($$('.wi', el), { yPercent: 115, rotate: 4 }, {
        yPercent: 0, rotate: 0, duration: 1.1, ease: 'expo.out', stagger: 0.045,
        delay: firstLoad && el.closest('.hero, .shop-hero, .sell-hero') ? INTRO : 0,
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });
    const introDelay = firstLoad ? INTRO + 0.1 : 0.1;
    ScrollTrigger.batch($$('[data-reveal]:not([data-reveal="clip"])', root), {
      start: 'top 92%', once: true,
      onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.07, overwrite: true, delay: els[0].closest('.hero, .shop-hero, .sell-hero') ? introDelay : 0 }),
    });
    $$('[data-reveal="clip"]', root).forEach(el => {
      gsap.fromTo(el, { clipPath: 'inset(12% 8% 12% 8% round 28px)', opacity: 0.4 }, {
        clipPath: 'inset(0% 0% 0% 0% round 28px)', opacity: 1, duration: 1.4, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      });
    });
    $$('[data-parallax]', root).forEach(el => {
      gsap.fromTo(el, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('[data-count]', root).forEach(el => {
      const o = { v: 0 }, end = +el.dataset.count;
      gsap.to(o, { v: end, duration: 2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('en-GB'); } });
    });
    if (finePointer) {
      $$('[data-magnetic]', root).forEach(el => {
        const move = e => { const r = el.getBoundingClientRect(); gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.22, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.5, ease: 'power3.out' }); };
        const leave = () => gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerleave', leave);
      });
    }
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  // drag to scroll for horizontal rails (mouse only; touch scrolls natively)
  document.addEventListener('pointerdown', e => {
    const rail = e.target.closest('[data-drag]');
    if (!rail || e.pointerType !== 'mouse' || e.button !== 0) return;
    const x0 = e.clientX, s0 = rail.scrollLeft;
    let moved = false;
    const move = ev => { const dx = ev.clientX - x0; if (Math.abs(dx) > 5) { moved = true; rail.classList.add('is-dragging'); } rail.scrollLeft = s0 - dx; };
    const up = () => {
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
      rail.classList.remove('is-dragging');
      if (moved) addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); }, { capture: true, once: true });
    };
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
  });

  function playVideo(v) {
    if (reduce) return;
    if (!v.src && v.dataset.src) v.src = v.dataset.src;
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  }

  let vidIO = null;
  function lazyVideos(root) {
    if (vidIO) vidIO.disconnect();
    vidIO = new IntersectionObserver(entries => entries.forEach(en => {
      const v = en.target;
      if (v.closest('[data-makers]')) return; // the makers carousel drives its own videos
      if (en.isIntersecting) playVideo(v); else v.pause();
    }), { rootMargin: '120px' });
    $$('video[data-src]', root).forEach(v => vidIO.observe(v));
  }

  // shop cards play their footage on hover
  if (finePointer) {
    document.addEventListener('pointerover', e => {
      const card = e.target.closest('.scard');
      if (!card || card.contains(e.relatedTarget)) return;
      const m = $('.scard__media', card);
      let v = $('video', m);
      if (!v) { v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.dataset.src = m.dataset.video; m.insertBefore(v, m.children[1]); }
      playVideo(v);
      card.classList.add('is-playing');
    });
    document.addEventListener('pointerout', e => {
      const card = e.target.closest('.scard');
      if (!card || card.contains(e.relatedTarget)) return;
      card.classList.remove('is-playing');
      const v = $('.scard__media video', card);
      if (v) setTimeout(() => { if (!card.classList.contains('is-playing')) v.pause(); }, 400);
    });
  }

  /* --------------------------------------------------------- global UI */
  const scrim = $('#scrim');
  const drawer = $('#drawer');
  const palette = $('#palette');
  const quick = $('#quick');
  let lastFocus = null;

  function lock(on) {
    document.body.classList.toggle('is-locked', on);
    if (lenis) on ? lenis.stop() : lenis.start();
  }

  function openLayer(el) {
    lastFocus = document.activeElement;
    closeAll(true);
    el.hidden = false;
    scrim.hidden = false;
    requestAnimationFrame(() => { el.classList.add('is-open'); scrim.classList.add('is-open'); });
    lock(true);
  }

  function closeAll(keepFocus) {
    let any = false;
    [drawer, palette, quick, $('#locPop')].forEach(el => {
      if (!el || el.hidden) return;
      any = true;
      el.classList.remove('is-open');
      setTimeout(() => { if (!el.classList.contains('is-open')) el.hidden = true; }, 380);
    });
    scrim.classList.remove('is-open');
    setTimeout(() => { if (!scrim.classList.contains('is-open')) scrim.hidden = true; }, 380);
    if (any) { lock(false); if (!keepFocus && lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true }); }
  }

  // focus trap for open layers
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeAll(); return; }
    const k = e.key.toLowerCase();
    if ((e.metaKey || e.ctrlKey) && k === 'k') { e.preventDefault(); openSearch(); return; }
    if (k === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); return; }
    if (e.key !== 'Tab') return;
    const layer = [drawer, palette, quick].find(l => !l.hidden && l.classList.contains('is-open'));
    if (!layer) return;
    const f = $$('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])', layer).filter(x => x.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });
  scrim.addEventListener('click', () => closeAll());

  // ---------- basket drawer
  function openDrawer() {
    renderDrawer();
    openLayer(drawer);
    setTimeout(() => $('.drawer__close', drawer).focus(), 50);
  }

  function renderDrawer() {
    const t = totals();
    const body = $('.drawer__body', drawer), foot = $('.drawer__foot', drawer);
    $('[data-drawer-count]', drawer).textContent = t.count ? `${t.count} item${t.count > 1 ? 's' : ''} · ${t.groups.length} shop${t.groups.length > 1 ? 's' : ''}` : '';
    if (!t.count) {
      body.innerHTML = `<div class="drawer__empty">
        <div class="empty__art" aria-hidden="true">${icon('basket')}</div>
        <h3 class="display">Nothing in here <em>yet.</em></h3>
        <p>Add from as many shops as you like. One courier collects it all, for one ${money(D.deliveryFee)} fee.</p>
        <a class="btn btn--ink" href="#/shops"><span>Browse shops</span>${icon('arrow')}</a>
      </div>`;
      foot.innerHTML = '';
      return;
    }
    const eta = Math.max(...t.groups.map(g => g.shop.eta[1])) + (t.groups.length - 1) * 3;
    body.innerHTML = `
      <div class="route-strip">
        <div class="route-strip__dots">${t.groups.map(g => stamp(g.shop, 'stamp--xs')).join('<i></i>')}<i></i><span class="route-strip__home">${icon('home')}</span></div>
        <p><b>One courier, ${t.groups.length} stop${t.groups.length > 1 ? 's' : ''}</b> · about ${eta} min</p>
      </div>
      <div class="free">
        ${t.freeLeft > 0 ? `<p>Add <b>${money(t.freeLeft)}</b> for free delivery</p>` : `<p>${icon('check')} <b>Free delivery</b> unlocked</p>`}
        <div class="meter"><i style="width:${Math.min(100, (t.items / D.freeOver) * 100)}%"></i></div>
      </div>
      ${t.groups.map(g => {
        const st = openState(g.shop), left = g.shop.min - g.subtotal;
        return `<section class="bgroup" style="--c:${g.shop.color}">
          <header class="bgroup__head">
            <a href="#/shop/${g.shop.id}">${stamp(g.shop, 'stamp--sm')}<span><b>${esc(g.shop.name)}</b><small class="${st.open ? 'is-open' : ''}">${st.label}</small></span></a>
            <span class="bgroup__sub">${money(g.subtotal)}</span>
          </header>
          <ul>${g.items.map(x => `<li class="bline">
            ${x.p.img ? `<img src="${x.p.img}" alt="" width="64" height="64">` : `<span class="bline__label" style="--c:${g.shop.color};--ci:${g.shop.ink}">${esc(g.shop.mono)}</span>`}
            <span class="bline__txt"><b>${esc(x.p.name)}</b><small>${money(x.p.price)} / ${esc(x.p.unit)}</small></span>
            ${addCtl(x.p.key, 'addctl--sm')}
            <b class="bline__total">${money(x.total)}</b>
          </li>`).join('')}</ul>
          ${left > 0 ? `<p class="bgroup__warn">${icon('info')} Add ${money(left)} more from ${esc(g.shop.name)} to reach its ${money(g.shop.min)} minimum. <a href="#/shop/${g.shop.id}">Keep shopping</a></p>` : ''}
        </section>`;
      }).join('')}
      <button type="button" class="linkish drawer__clear" data-clear-cart>${icon('trash')} Empty basket</button>`;
    foot.innerHTML = `
      <dl class="sumlist">
        <div><dt>Items</dt><dd>${money(t.items)}</dd></div>
        <div><dt>Delivery <small>one fee, any number of shops</small></dt><dd>${t.delivery ? money(t.delivery) : '<em>Free</em>'}</dd></div>
        <div><dt>Service</dt><dd>${money(t.service)}</dd></div>
        <div class="sumlist__total"><dt>Total</dt><dd>${money(t.total)}</dd></div>
      </dl>
      ${t.short.length ? `<p class="drawer__block">${icon('info')} ${t.short.length === 1 ? esc(t.short[0].shop.name) + ' is' : t.short.length + ' shops are'} under the minimum order.</p>` : ''}
      <a class="btn btn--tomato btn--block btn--xl ${t.short.length ? 'is-disabled' : ''}" href="#/checkout" ${t.short.length ? 'aria-disabled="true" tabindex="-1"' : ''}><span>Checkout · ${money(t.total)}</span>${icon('arrow')}</a>`;
  }

  // ---------- search palette
  let palIndex = 0;
  function openSearch() {
    openLayer(palette);
    const inp = $('input', palette);
    inp.value = '';
    renderSearch('');
    setTimeout(() => inp.focus(), 40);
  }

  function renderSearch(q) {
    const t = q.trim().toLowerCase();
    const out = $('.palette__results', palette);
    palIndex = 0;
    if (!t) {
      const month = new Date().getMonth();
      const seasonal = Object.values(D.products).filter(p => p.season && p.season.includes(month) && p.img).slice(0, 4);
      out.innerHTML = `<p class="palette__label">Try</p>
        <div class="palette__try">${['chanterelles', 'croissant', 'sea bass', 'natural wine', 'honey', 'vegan'].map(x => `<button type="button" data-try="${x}">${x}</button>`).join('')}</div>
        <p class="palette__label">In season now</p>
        ${seasonal.map(resultProduct).join('')}`;
      markActive();
      return;
    }
    const shops = D.shops.filter(s => (s.name + ' ' + s.kind + ' ' + s.area + ' ' + s.tags.join(' ')).toLowerCase().includes(t)).slice(0, 4);
    const words = t.split(/\s+/);
    const prods = Object.values(D.products).filter(p => {
      const hay = (p.name + ' ' + p.desc + ' ' + (p.badges || []).map(b => BADGES[b]).join(' ') + ' ' + shopById[p.shop].kind).toLowerCase();
      return words.every(w => hay.includes(w));
    }).sort((a, b) => (b.name.toLowerCase().includes(t) - a.name.toLowerCase().includes(t)) || (!!b.img - !!a.img)).slice(0, 8);
    if (!shops.length && !prods.length) {
      out.innerHTML = `<p class="palette__none">No shop sells “${esc(q)}” yet. Maybe ask one of them?</p>`;
      return;
    }
    out.innerHTML = (shops.length ? `<p class="palette__label">Shops</p>${shops.map(s => `<a class="res" href="#/shop/${s.id}" data-res>${stamp(s, 'stamp--sm')}<span><b>${hl(s.name, t)}</b><small>${esc(s.kind)} · ${esc(s.area)} · ${s.eta[0]}–${s.eta[1]} min</small></span>${icon('arrow', 'res__go')}</a>`).join('')}` : '')
      + (prods.length ? `<p class="palette__label">Food</p>${prods.map(p => resultProduct(p, t)).join('')}` : '');
    markActive();
  }

  function hl(text, t) {
    const i = text.toLowerCase().indexOf(t);
    if (!t || i < 0) return esc(text);
    return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + t.length)) + '</mark>' + esc(text.slice(i + t.length));
  }

  function resultProduct(p, t = '') {
    const s = shopById[p.shop];
    return `<div class="res res--p" data-res data-quick="${p.key}" role="button" tabindex="-1">
      ${p.img ? `<img src="${p.img}" alt="" width="64" height="64">` : `<span class="bline__label" style="--c:${s.color};--ci:${s.ink}">${esc(s.mono)}</span>`}
      <span><b>${hl(p.name, t)}</b><small>${esc(s.name)} · ${money(p.price)} / ${esc(p.unit)}</small></span>
      ${addCtl(p.key, 'addctl--sm')}
    </div>`;
  }

  function markActive() {
    const res = $$('[data-res]', palette);
    res.forEach((r, i) => r.classList.toggle('is-active', i === palIndex));
    const a = res[palIndex];
    if (a) a.scrollIntoView({ block: 'nearest' });
  }

  $('input', palette).addEventListener('input', e => renderSearch(e.target.value));
  $('input', palette).addEventListener('keydown', e => {
    const res = $$('[data-res]', palette);
    if (e.key === 'ArrowDown') { e.preventDefault(); palIndex = Math.min(res.length - 1, palIndex + 1); markActive(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); palIndex = Math.max(0, palIndex - 1); markActive(); }
    if (e.key === 'Enter') {
      e.preventDefault();
      const r = res[palIndex];
      if (!r) return;
      if (r.dataset.quick) openQuick(r.dataset.quick);
      else { closeAll(); location.hash = r.getAttribute('href'); }
    }
  });

  // ---------- quick view
  function openQuick(key) {
    const p = D.products[key];
    if (!p) return;
    const s = shopById[p.shop];
    const pairs = s.pairs.map(pid => shopById[pid].sections.flatMap(x => x.items).find(x => x.img)).filter(Boolean).slice(0, 2);
    let n = Math.max(1, qty(key) || 1);
    const panel = $('.modal__body', quick);
    panel.innerHTML = `
      <div class="quick">
        <div class="quick__media" style="--c:${s.color};--ci:${s.ink}">
          ${p.img ? `<img src="${p.img}" alt="${esc(p.name)}">` : `<div class="quick__label">${stamp(s, 'stamp--xl')}<b class="display">${esc(p.name)}</b><small>${esc(p.unit)}</small></div>`}
          ${flagHtml(p.tag)}
        </div>
        <div class="quick__body">
          <a class="quick__shop" href="#/shop/${s.id}">${stamp(s, 'stamp--xs')}<span>${esc(s.name)} · ${esc(p.section)}</span></a>
          <h2 class="display quick__title" id="quickTitle">${esc(p.name)}</h2>
          <p class="quick__price"><b>${money(p.price)}</b> / ${esc(p.unit)} ${badgeHtml(p.badges)}</p>
          <p class="quick__desc">${esc(p.desc)}</p>
          <dl class="quick__facts">
            ${p.allergens ? `<div><dt>Allergens</dt><dd>${esc(p.allergens)}</dd></div>` : ''}
            ${p.season ? `<div><dt>In season</dt><dd>${monthsStrip(p.season)}</dd></div>` : ''}
            <div><dt>From</dt><dd>${esc(s.street)}</dd></div>
          </dl>
          <label class="quick__note"><span>Note for ${esc(s.owner.split(' ')[0])} <small>optional</small></span><input type="text" maxlength="120" placeholder="${s.cat === 'fish' ? 'e.g. filleted, skin on' : s.cat === 'bakery' ? 'e.g. sliced, please' : 'Anything we should know?'}" value="${esc(store.notes[key] || '')}" data-note></label>
          <div class="quick__buy">
            <div class="stepper stepper--lg"><button type="button" data-qminus aria-label="One fewer">${icon('minus')}</button><output data-qn>${n}</output><button type="button" data-qplus aria-label="One more">${icon('plus')}</button></div>
            <button type="button" class="btn btn--tomato btn--block" data-qadd><span>${qty(key) ? 'Update basket' : 'Add to basket'} · <b data-qtotal>${money(p.price * n)}</b></span></button>
          </div>
          ${pairs.length ? `<div class="quick__pairs"><p class="kicker">Goes well with</p>${pairs.map(x => resultProduct(x)).join('')}</div>` : ''}
        </div>
      </div>`;
    const upd = () => { $('[data-qn]', panel).textContent = n; $('[data-qtotal]', panel).textContent = money(p.price * n); };
    $('[data-qminus]', panel).onclick = () => { n = Math.max(1, n - 1); upd(); };
    $('[data-qplus]', panel).onclick = () => { n = Math.min(99, n + 1); upd(); };
    $('[data-qadd]', panel).onclick = e => {
      const note = $('[data-note]', panel).value.trim();
      if (note) store.notes[key] = note; else delete store.notes[key];
      const before = cartGroups().length;
      const had = qty(key);
      setQty(key, n);
      fly(e.currentTarget, p.img);
      closeAll();
      if (!had) shopToast(p, before);
    };
    if (palette.classList.contains('is-open')) { palette.classList.remove('is-open'); palette.hidden = true; }
    openLayer(quick);
    setTimeout(() => $('.modal__close', quick).focus(), 50);
  }

  // ---------- fly to basket
  function basketTarget() {
    const tab = $('.tabbar [data-open-basket]');
    if (tab && tab.offsetParent !== null) return tab;
    return $('#basketBtn');
  }

  function fly(from, img) {
    const target = basketTarget();
    if (!from || !target || reduce) { bump(); return; }
    const navWasHidden = nav.classList.contains('is-hidden') && target.id === 'basketBtn';
    nav.classList.remove('is-hidden');
    document.documentElement.classList.remove('nav-hidden');
    const a = from.getBoundingClientRect(), b0 = target.getBoundingClientRect();
    const b = { left: b0.left, width: b0.width, height: b0.height, top: b0.top + (navWasHidden ? nav.offsetHeight : 0) };
    const outer = document.createElement('div');
    outer.className = 'flyer';
    outer.style.left = a.left + a.width / 2 - 26 + 'px';
    outer.style.top = a.top + a.height / 2 - 26 + 'px';
    const inner = document.createElement('div');
    inner.className = 'flyer__in';
    if (img) inner.style.backgroundImage = `url("${img}")`;
    outer.appendChild(inner);
    document.body.appendChild(outer);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    outer.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${dx}px)` }], { duration: 760, easing: 'cubic-bezier(.35,0,.55,1)', fill: 'forwards' });
    inner.animate([
      { transform: 'translateY(0) scale(.6)', opacity: 0 },
      { transform: `translateY(${Math.min(-60, dy * 0.3 - 90)}px) scale(1)`, opacity: 1, offset: 0.35 },
      { transform: `translateY(${dy}px) scale(.3)`, opacity: 0.9 },
    ], { duration: 760, easing: 'cubic-bezier(.3,.1,.6,1)', fill: 'forwards' }).onfinish = () => { outer.remove(); bump(); };
  }

  function bump() {
    $$('[data-open-basket]').forEach(b => {
      if (hasGsap && !reduce) gsap.fromTo(b, { scale: 1 }, { scale: 1.12, duration: 0.14, yoyo: true, repeat: 1, ease: 'power2.out' });
    });
  }

  function shopToast(p, groupsBefore) {
    const groups = cartGroups();
    const s = shopById[p.shop];
    if (groups.length > groupsBefore && groups.length > 1) {
      toast(`<b>${esc(s.name)}</b> added. Now collecting from ${groups.length} shops, still one delivery.`, { action: 'View basket' });
    } else if (groups.length === 1 && groupsBefore === 0) {
      toast(`<b>${esc(p.name)}</b> is in your basket.`, { action: 'View basket' });
    }
  }

  // ---------- toast
  function toast(html, opts = {}) {
    const wrap = $('#toasts');
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `${icon('check', 'toast__ic')}<p>${html}</p>${opts.action ? `<button type="button" data-open-basket>${esc(opts.action)}</button>` : ''}`;
    wrap.appendChild(t);
    requestAnimationFrame(() => t.classList.add('is-in'));
    setTimeout(() => { t.classList.remove('is-in'); setTimeout(() => t.remove(), 400); }, opts.ms || 3600);
    $$('.toast', wrap).slice(0, -3).forEach(x => x.remove());
  }

  // ---------- stamp overlay after placing an order
  function stampOverlay(text, sub) {
    return new Promise(res => {
      const el = document.createElement('div');
      el.className = 'placed';
      el.innerHTML = `<div class="placed__stamp"><span>${esc(text)}</span><small>${esc(sub)}</small></div>`;
      document.body.appendChild(el);
      if (hasGsap && !reduce) {
        gsap.timeline({ onComplete: () => { res(); gsap.to(el, { opacity: 0, duration: 0.4, delay: 0.3, onComplete: () => el.remove() }); } })
          .from(el, { opacity: 0, duration: 0.25 })
          .from('.placed__stamp', { scale: 2.4, rotate: -24, opacity: 0, duration: 0.5, ease: 'power4.in' })
          .to('.placed__stamp', { scale: 0.96, duration: 0.08, yoyo: true, repeat: 1 })
          .to({}, { duration: 0.7 });
      } else { setTimeout(() => { el.remove(); res(); }, 900); }
    });
  }

  // ---------- location popover
  const locBtn = $('[data-open-loc]');
  const locPop = $('#locPop');
  locBtn.addEventListener('click', () => {
    if (!locPop.hidden) { closeAll(); return; }
    lastFocus = locBtn;
    locPop.hidden = false;
    requestAnimationFrame(() => locPop.classList.add('is-open'));
    const inp = $('input', locPop);
    inp.value = store.postcode;
    setTimeout(() => inp.focus(), 30);
  });
  $('form', locPop).addEventListener('submit', e => {
    e.preventDefault();
    const v = $('input', locPop).value.trim().toUpperCase();
    const ok = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/.test(v);
    const msg = $('.form-msg', locPop);
    if (!ok) { msg.textContent = 'Enter a full UK postcode, like E8 3PH.'; msg.className = 'form-msg is-err'; return; }
    store.postcode = v;
    save();
    syncPostcode();
    msg.textContent = '';
    closeAll();
    toast(`Showing shops that deliver to <b>${esc(v)}</b>`);
  });
  document.addEventListener('click', e => {
    if (!locPop.hidden && !locPop.contains(e.target) && !locBtn.contains(e.target)) { locPop.classList.remove('is-open'); setTimeout(() => { locPop.hidden = true; }, 300); }
  });
  function syncPostcode() { $$('[data-postcode]').forEach(el => { el.textContent = store.postcode; }); }

  /* -------------------------------------------- global click delegation */
  document.addEventListener('click', e => {
    const t = e.target;
    const add = t.closest('[data-add]');
    if (add) {
      e.preventDefault();
      const key = add.dataset.add;
      const before = cartGroups().length;
      setQty(key, qty(key) + 1);
      fly(add, D.products[key].img);
      shopToast(D.products[key], before);
      return;
    }
    const inc = t.closest('[data-inc]');
    if (inc) { e.preventDefault(); setQty(inc.dataset.inc, qty(inc.dataset.inc) + 1); bump(); return; }
    const dec = t.closest('[data-dec]');
    if (dec) { e.preventDefault(); setQty(dec.dataset.dec, qty(dec.dataset.dec) - 1); return; }
    const qv = t.closest('[data-quick]');
    if (qv && !t.closest('.addctl')) { e.preventDefault(); openQuick(qv.dataset.quick); return; }
    const fav = t.closest('[data-fav]');
    if (fav) {
      e.preventDefault();
      const id = fav.dataset.fav, i = store.favs.indexOf(id);
      if (i >= 0) store.favs.splice(i, 1); else store.favs.push(id);
      const on = i < 0;
      $$(`[data-fav="${id}"]`).forEach(b => {
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on);
        const lbl = $('span', b);
        if (lbl) lbl.textContent = on ? 'Saved' : 'Save shop';
        if (on && hasGsap && !reduce) { gsap.fromTo($('svg', b), { scale: 0.6 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1.2, 0.4)' }); burst(b); }
      });
      emit();
      toast(on ? `Saved <b>${esc(shopById[id].name)}</b> to your shops` : `Removed <b>${esc(shopById[id].name)}</b> from saved`);
      return;
    }
    if (t.closest('[data-open-basket]')) { e.preventDefault(); openDrawer(); return; }
    if (t.closest('[data-open-search]')) { e.preventDefault(); openSearch(); return; }
    if (t.closest('[data-close]')) { e.preventDefault(); closeAll(); return; }
    if (t.closest('[data-clear-cart]')) {
      const snapshot = { ...store.cart };
      store.cart = {};
      emit();
      toast('Basket emptied.', { ms: 5000 });
      const btn = $('#toasts .toast:last-child');
      if (btn) { const u = document.createElement('button'); u.type = 'button'; u.textContent = 'Undo'; u.onclick = () => { store.cart = snapshot; emit(); u.closest('.toast').remove(); }; btn.appendChild(u); }
      return;
    }
    const tr = t.closest('[data-try]');
    if (tr) { const inp = $('input', palette); inp.value = tr.dataset.try; renderSearch(tr.dataset.try); inp.focus(); return; }
    const a = t.closest('a[href^="#/"]');
    if (a && a.getAttribute('aria-disabled') === 'true') { e.preventDefault(); return; }
    if (a && (drawer.classList.contains('is-open') || palette.classList.contains('is-open') || quick.classList.contains('is-open'))) closeAll(true);
  });

  function burst(el) {
    const r = el.getBoundingClientRect();
    for (let i = 0; i < 8; i++) {
      const d = document.createElement('i');
      d.className = 'burst';
      d.style.left = r.left + r.width / 2 + 'px';
      d.style.top = r.top + r.height / 2 + 'px';
      document.body.appendChild(d);
      const ang = (i / 8) * Math.PI * 2;
      gsap.fromTo(d, { x: 0, y: 0, scale: 1, opacity: 1 }, { x: Math.cos(ang) * 30, y: Math.sin(ang) * 30, scale: 0, opacity: 0, duration: 0.6, ease: 'power3.out', onComplete: () => d.remove() });
    }
  }

  /* ------------------------------------------------- badges & subscriptions */
  let lastCount = -1;
  function syncBadges() {
    const t = totals();
    $$('[data-count-badge]').forEach(b => {
      b.textContent = t.count;
      b.classList.toggle('is-zero', !t.count);
      if (lastCount >= 0 && t.count !== lastCount && hasGsap && !reduce) gsap.fromTo(b, { yPercent: t.count > lastCount ? 60 : -60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.4, ease: 'back.out(2)' });
    });
    $$('[data-total-badge]').forEach(b => { b.textContent = t.count ? money(t.items) : ''; });
    $('#basketBtn').setAttribute('aria-label', `Basket, ${t.count} item${t.count === 1 ? '' : 's'}`);
    lastCount = t.count;
  }
  subs.add(syncBadges);
  subs.add(refreshCtls);
  subs.add(() => { if (drawer.classList.contains('is-open')) renderDrawer(); });

  /* ----------------------------------------------------------------- boot */
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  $$('[data-kbd]').forEach(k => { k.textContent = isMac ? '⌘K' : 'Ctrl K'; });
  $('#year').textContent = new Date().getFullYear();
  syncBadges();
  syncPostcode();

  function intro() {
    const loader = $('#loader');
    if (!hasGsap || reduce) { loader.remove(); return; }
    const tl = gsap.timeline({ onComplete: () => loader.remove() });
    // keep in step with INTRO, which delays the hero entrance until the shutter lifts
    tl.from('.loader__band', { scaleY: 0, transformOrigin: '50% 0%', duration: 0.5, ease: 'expo.out' })
      .from('.loader__scallops', { scaleY: 0, transformOrigin: '50% 0%', duration: 0.35, ease: 'back.out(2)' }, 0.3)
      .from('.loader__mark', { scale: 1.6, rotate: -30, opacity: 0, duration: 0.45, ease: 'power4.in' }, 0.45)
      .from('.loader__word', { yPercent: 100, duration: 0.5, ease: 'expo.out' }, 0.85)
      .to(loader, { yPercent: -100, duration: 0.85, ease: 'expo.inOut' }, 1.5);
  }

  addEventListener('hashchange', navigate);
  navigate().then(intro);
})();
