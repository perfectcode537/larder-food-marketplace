/* The neighbourhood map: one stylised street grid shared by the home page,
   the shop finder and order tracking. Shops sit on street corners so a route
   between any two of them can follow the streets. */
(function () {
  const W = 840, H = 620;
  const XS = [60, 180, 300, 420, 540, 660, 780];
  const YS = [60, 160, 260, 360, 460, 560];
  const SW = 18; // street width
  const PARK = [[5, 4], [6, 4]]; // [col, row] cells that are park
  let uid = 0;

  function rand(seed) {
    return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  }

  function blocks() {
    const r = rand(7);
    const bx = [-20, ...XS, W + 20], by = [-20, ...YS, H + 20];
    let out = '';
    for (let c = 0; c < bx.length - 1; c++) {
      for (let row = 0; row < by.length - 1; row++) {
        const x0 = bx[c] + SW / 2, x1 = bx[c + 1] - SW / 2;
        const y0 = by[row] + SW / 2, y1 = by[row + 1] - SW / 2;
        if (PARK.some(([pc, pr]) => pc === c && pr === row)) continue;
        // split some blocks into a few buildings
        const parts = r() < 0.45 ? 1 : r() < 0.6 ? 2 : 3;
        const vertical = r() < 0.5;
        const len = vertical ? (x1 - x0) : (y1 - y0);
        let cut = 0;
        for (let i = 0; i < parts; i++) {
          const size = i === parts - 1 ? len - cut : Math.round((len / parts) * (0.75 + r() * 0.5));
          const gap = i === parts - 1 ? 0 : 5;
          const x = vertical ? x0 + cut : x0, y = vertical ? y0 : y0 + cut;
          const w = vertical ? size - gap : x1 - x0, h = vertical ? y1 - y0 : size - gap;
          out += `<rect class="m-block${r() < 0.3 ? ' alt' : ''}" x="${x}" y="${y}" width="${w}" height="${h}" rx="5"/>`;
          cut += size;
        }
      }
    }
    return out;
  }

  function park() {
    // spans the two blocks between x 540..780 and y 360..460
    const px0 = XS[4] + SW / 2, px1 = XS[6] - SW / 2, py0 = YS[3] + SW / 2, py1 = YS[4] - SW / 2;
    const r = rand(42);
    let trees = '';
    for (let i = 0; i < 26; i++) {
      const tx = px0 + 10 + r() * (px1 - px0 - 20), ty = py0 + 10 + r() * (py1 - py0 - 20);
      trees += `<circle class="m-tree" cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="${(4 + r() * 4).toFixed(1)}"/>`;
    }
    return `<rect class="m-park" x="${px0}" y="${py0}" width="${px1 - px0}" height="${py1 - py0}" rx="14"/>
      <path class="m-path" d="M${px0 + 12} ${py1 - 14} C ${px0 + 80} ${py0 + 40}, ${px1 - 90} ${py1 - 10}, ${px1 - 12} ${py0 + 14}"/>
      ${trees}
      <text class="m-label m-label--park" x="${px0 + 12}" y="${py0 + 18}">THE COMMON</text>`;
  }

  function streets() {
    let s = '';
    XS.forEach((x, i) => { s += `<line class="m-street${i === 3 ? ' main' : ''}" x1="${x}" y1="-20" x2="${x}" y2="${H + 20}"/>`; });
    YS.forEach((y, i) => { s += `<line class="m-street${i === 3 ? ' main' : ''}" x1="-20" y1="${y}" x2="${W + 20}" y2="${y}"/>`; });
    return s;
  }

  function labels() {
    const v = (x, y, t) => `<text class="m-label" x="${x}" y="${y}" transform="rotate(-90 ${x} ${y})" text-anchor="middle">${t}</text>`;
    const h = (x, y, t) => `<text class="m-label" x="${x}" y="${y}" text-anchor="middle">${t}</text>`;
    return [
      v(XS[1] + 3.5, 110, 'CHATSWORTH RD'), v(XS[3] + 3.5, 520, 'MARE ST'), v(XS[5] + 3.5, 110, 'WELL ST'),
      h(110, YS[2] + 3.5, 'GRAHAM RD'), h(600, YS[3] + 3.5, 'MORNING LN'), h(360, YS[5] + 3.5, 'BROADWAY MKT'),
    ].join('');
  }

  const CANAL = `M -30 600 C 120 560, 160 520, 250 528 S 420 600, 520 520 S 700 380, 860 430`;
  function canal() {
    return `<path class="m-canal" d="${CANAL}"/><path class="m-canal-hi" d="${CANAL}"/>`;
  }
  // drawn after the streets so the bridges don't cut through the name
  function canalLabel() {
    return `<path id="canal-${uid}" d="${CANAL}" fill="none" stroke="none"/>
      <text class="m-label m-label--water" dy="3"><textPath href="#canal-${uid}" startOffset="22%">REGENT'S CANAL</textPath></text>`;
  }

  function pin(s, opts) {
    const cls = ['mpin'];
    if (opts.dim) cls.push('is-dim');
    if (opts.route) cls.push('is-route');
    return `<g class="${cls.join(' ')}" data-pin="${s.id}" transform="translate(${s.x} ${s.y})" tabindex="${opts.focusable ? 0 : -1}" role="${opts.focusable ? 'link' : 'presentation'}" aria-label="${opts.focusable ? s.name : ''}">
      <circle class="mpin__pulse" r="22" style="fill:${s.color}"/>
      <circle class="mpin__dot" r="15" style="fill:${s.color}"/>
      <text class="mpin__mono" y="3.6" text-anchor="middle" style="fill:${s.ink}">${s.mono}</text>
      <g class="mpin__label" transform="translate(0 -30)">
        <rect x="${-(s.name.length * 3.6 + 12)}" y="-11" width="${s.name.length * 7.2 + 24}" height="22" rx="11"/>
        <text y="4" text-anchor="middle">${s.name.replace('&', '&amp;')}</text>
      </g>
      <g class="mpin__tick" transform="translate(11 -11)"><circle r="8"/><path d="M-3.4 0.2 L-1 2.6 L3.6 -2.4"/></g>
    </g>`;
  }

  function homePin(home) {
    return `<g class="mhome" transform="translate(${home.x} ${home.y})">
      <circle class="mhome__ring" r="26"/>
      <circle class="mhome__dot" r="17"/>
      <path class="mhome__icon" d="M-7 1 L0 -6 L7 1 V7.5 H-7 Z M-2.2 7.5 V3 H2.2 V7.5"/>
      <g class="mpin__label mpin__label--on" transform="translate(0 -36)"><rect x="-26" y="-11" width="52" height="22" rx="11"/><text y="4" text-anchor="middle">${home.label}</text></g>
    </g>`;
  }

  // vertices along the streets: go horizontally first, then vertically
  function vertices(points) {
    const v = [points[0]];
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i];
      if (a.x !== b.x && a.y !== b.y) v.push({ x: b.x, y: a.y });
      v.push(b);
    }
    // drop zero-length steps
    return v.filter((p, i) => i === 0 || p.x !== v[i - 1].x || p.y !== v[i - 1].y);
  }

  function roundedPath(v, r = 16) {
    let d = `M${v[0].x} ${v[0].y}`;
    for (let i = 1; i < v.length; i++) {
      const p = v[i], prev = v[i - 1], next = v[i + 1];
      if (!next || (prev.x === next.x && prev.x === p.x) || (prev.y === next.y && prev.y === p.y)) { d += ` L${p.x} ${p.y}`; continue; }
      const inLen = Math.hypot(p.x - prev.x, p.y - prev.y), outLen = Math.hypot(next.x - p.x, next.y - p.y);
      const rr = Math.min(r, inLen / 2, outLen / 2);
      const ax = p.x - Math.sign(p.x - prev.x) * rr, ay = p.y - Math.sign(p.y - prev.y) * rr;
      const bx = p.x + Math.sign(next.x - p.x) * rr, by = p.y + Math.sign(next.y - p.y) * rr;
      d += ` L${ax} ${ay} Q${p.x} ${p.y} ${bx} ${by}`;
    }
    return d;
  }

  // fraction of the route at which each stop is reached
  function stopFractions(points) {
    const v = vertices(points);
    const seg = [];
    let total = 0;
    for (let i = 1; i < v.length; i++) { total += Math.abs(v[i].x - v[i - 1].x) + Math.abs(v[i].y - v[i - 1].y); seg.push(total); }
    let acc = 0, j = 0;
    return points.map((p, i) => {
      if (i === 0) return 0;
      while (j < v.length - 1) {
        j++;
        acc = seg[j - 1];
        if (v[j].x === p.x && v[j].y === p.y) break;
      }
      return total ? acc / total : 0;
    });
  }

  /* opts: { shops: [shop], route: [shop ids..., 'home'], home, interactive, label: 'route'|'all'|'none', id } */
  function svg(opts) {
    uid++;
    const D = window.LARDER;
    const home = opts.home || D.home;
    const byId = Object.fromEntries(D.shops.map(s => [s.id, s]));
    const routeIds = opts.route || [];
    const routePts = routeIds.map(id => (id === 'home' ? home : id === 'hub' ? D.hub : byId[id]));
    const onRoute = new Set(routeIds);
    const shown = opts.shops || D.shops;
    let route = '';
    if (routePts.length > 1) {
      const d = roundedPath(vertices(routePts));
      route = `<path class="m-route-bg" d="${d}"/><path class="m-route" d="${d}"/>`;
    }
    const pins = shown.map(s => pin(s, { dim: routeIds.length && !onRoute.has(s.id), route: onRoute.has(s.id), focusable: !!opts.interactive })).join('');
    const hub = onRoute.has('hub') ? `<g class="mhub" transform="translate(${D.hub.x} ${D.hub.y})"><rect x="-11" y="-11" width="22" height="22" rx="6"/><text y="4" text-anchor="middle">L</text></g>` : '';
    const courier = routePts.length > 1 ? `<g class="courier" transform="translate(${routePts[0].x} ${routePts[0].y})">
        <circle class="courier__halo" r="24"/><circle class="courier__dot" r="16"/>
        <g class="courier__bike" transform="scale(.62) translate(-12 -12)"><circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-7h5l3 7M10 9 8.6 6H6.5M15 9l-1-3h2.5"/></g>
      </g>` : '';
    return `<svg class="nmap ${opts.cls || ''}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${opts.aria || 'Map of the neighbourhood'}" data-route="${routeIds.join(',')}">
      <rect class="m-bg" x="-40" y="-40" width="${W + 80}" height="${H + 80}"/>
      ${blocks()}${park()}${canal()}${streets()}${labels()}${canalLabel()}
      <g class="m-routes">${route}</g>
      ${hub}
      <g class="m-pins${opts.label === 'all' ? ' labels-on' : ''}">${pins}</g>
      ${opts.showHome === false ? '' : homePin(home)}
      ${courier}
    </svg>`;
  }

  // wire up a rendered map so a 0..1 progress value moves the courier along the route
  function route(svgEl) {
    const D = window.LARDER;
    const ids = (svgEl.dataset.route || '').split(',').filter(Boolean);
    const path = svgEl.querySelector('.m-route');
    const courier = svgEl.querySelector('.courier');
    if (!path || !courier) return { set() {}, stops: [] };
    const byId = Object.fromEntries(D.shops.map(s => [s.id, s]));
    const pts = ids.map(id => (id === 'home' ? D.home : id === 'hub' ? D.hub : byId[id]));
    const fr = stopFractions(pts);
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len} ${len}`;
    path.style.strokeDashoffset = len;
    const pins = ids.map(id => svgEl.querySelector(`[data-pin="${id}"]`));
    let last = -1;
    return {
      stops: fr,
      set(p) {
        p = Math.max(0, Math.min(1, p));
        if (Math.abs(p - last) < 0.0005) return;
        last = p;
        path.style.strokeDashoffset = len * (1 - p);
        const pt = path.getPointAtLength(len * p);
        courier.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
        pins.forEach((pin, i) => { if (pin) pin.classList.toggle('is-visited', p >= fr[i] - 0.002); });
        svgEl.classList.toggle('is-arrived', p >= 0.999);
      },
    };
  }

  window.LarderMap = { svg, route, stopFractions };
})();
