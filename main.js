/* =========================================================================
   Rio Casting — interactions
   ========================================================================= */
(() => {
  "use strict";
  const RIO = window.RIO || {};
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Device budget: low-end or data-saver devices get lighter (or static) visuals.
  const conn = navigator.connection || {};
  const LOW = !!conn.saveData || (navigator.deviceMemory || 8) <= 2 || (navigator.hardwareConcurrency || 8) <= 2;
  const MOBILE = matchMedia("(max-width: 860px), (pointer: coarse)").matches;
  const FRAME_MS = 1000 / 30; // decorative animations never need more than 30 fps
  // One passive scroll listener, batched to a single animation frame.
  const scrollFns = [];
  let scrollQueued = false;
  const onScrollFrame = (fn) => { scrollFns.push(fn); fn(); };
  addEventListener("scroll", () => {
    if (scrollQueued) return; scrollQueued = true;
    requestAnimationFrame(() => { scrollQueued = false; for (const fn of scrollFns) fn(); });
  }, { passive: true });
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add("is-in")));
  $("#year").textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------ data */
  const G_PER_OZ = 31.1034768, G_PER_DWT = 1.55517384;
  const UNITS = {
    oz:  { label: "per troy ounce", f: 1 },
    g:   { label: "per gram", f: 1 / G_PER_OZ },
    dwt: { label: "per pennyweight", f: G_PER_DWT / G_PER_OZ },
    kg:  { label: "per kilogram", f: 1000 / G_PER_OZ }
  };
  const SPOTS = [
    { sym: "XAU", name: "Gold",      sw: "linear-gradient(135deg,#FFE7A8,#E0A93B 55%,#7A5212)" },
    { sym: "XAG", name: "Silver",    sw: "linear-gradient(135deg,#FFFFFF,#D8DCE2 55%,#737A85)" },
    { sym: "XPT", name: "Platinum",  sw: "linear-gradient(135deg,#F4F7FB,#B9C1CC 55%,#4D5563)" },
    { sym: "XPD", name: "Palladium", sw: "linear-gradient(135deg,#F3F1EC,#BDB6A8 55%,#5A5448)" }
  ];
  const KARATS = [["24K", .999], ["22K", .9167], ["18K", .750], ["14K", .585], ["10K", .417]];

  // Wax-to-metal multipliers assume a casting wax with specific gravity ≈ 1.0.
  const ALLOYS = [
    { id: "10k",  name: "10K Gold",         sym: "XAU", fine: .417, sg: 11.6 },
    { id: "14k",  name: "14K Gold",         sym: "XAU", fine: .585, sg: 13.2 },
    { id: "18k",  name: "18K Gold",         sym: "XAU", fine: .750, sg: 15.6 },
    { id: "22k",  name: "22K Gold",         sym: "XAU", fine: .917, sg: 17.8 },
    { id: "pt",   name: "Platinum 950",     sym: "XPT", fine: .950, sg: 20.8 },
    { id: "pd",   name: "Palladium 950",    sym: "XPD", fine: .950, sg: 12.0 },
    { id: "ag",   name: "Sterling Silver",  sym: "XAG", fine: .925, sg: 10.4 },
    { id: "brass",name: "Brass",            sym: null,  fine: 0,    sg: 8.5 },
    { id: "bronze",name:"Bronze",           sym: null,  fine: 0,    sg: 8.8 }
  ];

  const METALS = [
    { id: "gold", name: "Gold", sym: "Au", kicker: "Precious metal", spot: "XAU",
      sw: "linear-gradient(140deg,#FFF3C9 0%,#F1C463 30%,#C98F2A 60%,#7A5212 100%)",
      desc: "Our most-poured metal. Every karat from 10K to 22K, alloyed in yellow, white or rose to match exactly what you have in mind.",
      specs: [["Karats", "10K · 14K · 18K · 22K"], ["Colors", "Yellow · White · Rose"], ["Best for", "Fine jewelry · Production"]] },
    { id: "platinum", name: "Platinum", sym: "Pt", kicker: "Precious metal", spot: "XPT",
      sw: "linear-gradient(140deg,#FFFFFF 0%,#DDE3EA 30%,#A3ACB8 65%,#4D5563 100%)",
      desc: "Dense, naturally white and built to last. Platinum's high melting point demands real experience at the bench — it's where three decades show.",
      specs: [["Alloy", "Pt 950"], ["Melts at", "≈ 1,768 °C"], ["Character", "Dense · Hypoallergenic"]] },
    { id: "palladium", name: "Palladium", sym: "Pd", kicker: "Precious metal", spot: "XPD",
      sw: "linear-gradient(140deg,#FBFAF6 0%,#D9D4C9 30%,#A39C8E 65%,#5A5448 100%)",
      desc: "A naturally white platinum-group metal that's lighter on the hand — a refined alternative for white pieces and bands.",
      specs: [["Alloy", "Pd 950"], ["Melts at", "≈ 1,555 °C"], ["Character", "Light · Naturally white"]] },
    { id: "silver", name: "Sterling Silver", sym: "Ag", kicker: "Precious metal", spot: "XAG",
      sw: "linear-gradient(140deg,#FFFFFF 0%,#E9ECF0 30%,#B5BBC4 65%,#636A75 100%)",
      desc: "Bright, versatile and ideal for collections, samples and production runs that still deserve a precious-metal finish.",
      specs: [["Alloy", "925"], ["Melts at", "≈ 893 °C"], ["Best for", "Collections · Runs"]] },
    { id: "brass", name: "Brass", sym: "CuZn", kicker: "Fine metal", spot: null,
      sw: "linear-gradient(140deg,#FFF0B8 0%,#E2C163 30%,#B08A2E 65%,#5C4512 100%)",
      desc: "Warm, golden and economical. Perfect for prototypes, fit samples and fashion pieces before committing to precious metal.",
      specs: [["Base", "Copper · Zinc"], ["Melts at", "≈ 900–940 °C"], ["Best for", "Prototypes · Fashion"]] },
    { id: "bronze", name: "Bronze", sym: "CuSn", kicker: "Fine metal", spot: null,
      sw: "linear-gradient(140deg,#F8D2A8 0%,#D4935A 30%,#A0582A 65%,#4A2410 100%)",
      desc: "Deep, earthy color with strong detail retention — loved for sculptural work and statement pieces.",
      specs: [["Base", "Copper · Tin"], ["Melts at", "≈ 950 °C"], ["Best for", "Sculptural work"]] },
    { id: "white", name: "White Metal", sym: "Wm", kicker: "Fine metal", spot: null,
      sw: "linear-gradient(140deg,#F4F4F2 0%,#CFCFCB 30%,#9A9A96 65%,#55554F 100%)",
      desc: "A low-melt alloy for fast, affordable production — costume jewelry, components and test runs.",
      specs: [["Type", "Low-melt alloy"], ["Speed", "Fast production"], ["Best for", "Costume · Components"]] }
  ];

  /* -------------------------------------------------------------- formatting */
  const usd = (v, d) => {
    if (v == null || !isFinite(v)) return "—";
    const digits = d ?? (v >= 1000 ? 2 : v >= 1 ? 2 : 3);
    return "$" + v.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  };
  const nyTime = (d) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }) + " ET";
  const nyDate = (d) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/New_York" });
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };

  /* --------------------------------------------------------------------- nav */
  const nav = $("#nav"), burger = $("#burger"), menu = $("#menu");
  const onScroll = () => nav.classList.toggle("is-solid", scrollY > 30);
  onScrollFrame(onScroll);
  const setMenu = (open) => {
    burger.setAttribute("aria-expanded", open); menu.hidden = !open;
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
    nav.classList.toggle("is-solid", open || scrollY > 30);
  };
  burger.addEventListener("click", () => setMenu(menu.hidden));
  $$("a", menu).forEach(a => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) setMenu(false); });

  /* --------------------------------------------------------- hero: liquid metal */
  const HERO_METALS = {
    molten:   { b: [1.00, .78, .42], m: [.86, .30, .04], d: [.10, .02, .00], g: 1 },
    yellow:   { b: [1.00, .92, .66], m: [.80, .58, .20], d: [.18, .10, .02], g: 0 },
    rose:     { b: [1.00, .86, .78], m: [.78, .46, .36], d: [.20, .08, .06], g: 0 },
    white:    { b: [1.00, .99, .96], m: [.70, .69, .67], d: [.10, .10, .12], g: 0 },
    platinum: { b: [.95, .97, 1.0], m: [.60, .64, .70], d: [.07, .08, .11], g: 0 },
    silver:   { b: [1.00, 1.0, 1.0], m: [.74, .76, .80], d: [.12, .13, .16], g: 0 },
    bronze:   { b: [1.00, .80, .58], m: [.66, .38, .18], d: [.14, .06, .02], g: 0 }
  };
  const heroMetal = (() => {
    const cv = $("#metal");
    const gl = cv.getContext("webgl", { antialias: false, alpha: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: "low-power" });
    if (!gl) return { set() {} };
    const vs = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
    const fs = `precision mediump float;
uniform vec2 uR;uniform float uT;uniform vec3 uB,uM,uD;uniform float uG;uniform vec2 uMo;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 R=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<4;i++){v+=a*noise(p);p=R*p;a*=.5;}return v;}
float field(vec2 p){vec2 q=vec2(fbm(p+vec2(0.,uT*.05)),fbm(p+vec2(5.2,1.3)-uT*.04));
return fbm(p+2.4*q+vec2(uT*.02,0.));}
void main(){
vec2 uv=gl_FragCoord.xy/uR;vec2 p=(gl_FragCoord.xy-.5*uR)/uR.y*1.6+vec2(.3,0.);
float e=.012;float h=field(p),hx=field(p+vec2(e,0.)),hy=field(p+vec2(0.,e));
vec3 n=normalize(vec3((h-hx)/e*.22,(h-hy)/e*.22,1.));
vec3 V=vec3(0.,0.,1.);vec3 R=reflect(-V,n);
vec3 L=normalize(vec3(uMo*.8+vec2(.35,.55),1.));
float band=.5+.5*sin(R.y*7.+R.x*2.5+h*4.);band=smoothstep(.15,.95,band);
float sky=smoothstep(-.2,.6,R.y);
float diff=max(dot(n,L),0.);
float spec=pow(max(dot(reflect(-L,n),V),0.),48.);
vec3 col=mix(uD,uM,clamp(diff*.9+band*.35,0.,1.));
col=mix(col,uB,band*sky*.85);
col+=spec*mix(vec3(1.),uB,.4)*1.1;
float heat=smoothstep(.38,.78,h);
vec3 em=mix(vec3(.35,.02,0.),mix(vec3(1.,.42,.06),vec3(1.,.86,.5),smoothstep(.6,1.,heat)),heat);
vec3 molten=col*.18+em*(.25+1.1*heat)+band*sky*vec3(1.,.55,.2)*.35+spec*vec3(1.,.85,.6);
col=mix(col,molten,uG);
col*=.55+.45*smoothstep(1.25,.15,length((uv-vec2(.72,.5))*vec2(1.,.8)));
gl_FragColor=vec4(col,1.);}`;
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return { set() {} };
    gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {}; ["uR", "uT", "uB", "uM", "uD", "uG", "uMo"].forEach(k => U[k] = gl.getUniformLocation(pr, k));

    const cur = JSON.parse(JSON.stringify(HERO_METALS.molten));
    let target = HERO_METALS.molten, from = JSON.parse(JSON.stringify(cur)), t0 = 0;
    const mouse = [0, 0], mT = [0, 0];
    let visible = true, raf = 0, start = performance.now();

    // The surface is soft by nature, so it renders to a small pixel budget and is
    // upscaled by the browser. The budget shrinks further if frames run slow.
    let budget = LOW ? 120000 : MOBILE ? 200000 : 380000, slow = 0, last = 0;
    const resize = () => {
      const w = cv.clientWidth, h = cv.clientHeight;
      const s = Math.min(devicePixelRatio || 1, Math.sqrt(budget / Math.max(1, w * h)));
      cv.width = Math.max(1, Math.round(w * s));
      cv.height = Math.max(1, Math.round(h * s));
      gl.viewport(0, 0, cv.width, cv.height);
      if (reduce) draw(performance.now());
    };
    const lerp = (a, b, k) => a + (b - a) * k;
    function draw(now) {
      const k = Math.min(1, (now - t0) / 900), ek = 1 - Math.pow(1 - k, 3);
      ["b", "m", "d"].forEach(c => { for (let i = 0; i < 3; i++) cur[c][i] = lerp(from[c][i], target[c][i], ek); });
      cur.g = lerp(from.g, target.g, ek);
      mouse[0] = lerp(mouse[0], mT[0], .05); mouse[1] = lerp(mouse[1], mT[1], .05);
      gl.uniform2f(U.uR, cv.width, cv.height);
      gl.uniform1f(U.uT, reduce ? 12 : (now - start) / 1000 + 12);
      gl.uniform3fv(U.uB, cur.b); gl.uniform3fv(U.uM, cur.m); gl.uniform3fv(U.uD, cur.d);
      gl.uniform1f(U.uG, cur.g); gl.uniform2f(U.uMo, mouse[0], mouse[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    const onTop = () => scrollY < innerHeight * 1.02;
    const loop = (now) => {
      const dt = now - last;
      if (dt >= FRAME_MS - 2) {
        if (last && dt > 55 && budget > 70000 && ++slow > 20) { budget *= .7; slow = 0; resize(); }
        last = now; draw(now);
      }
      raf = visible && onTop() && !reduce && !LOW ? requestAnimationFrame(loop) : (last = 0, 0);
    };
    onScrollFrame(() => { if (visible && onTop() && !raf && !reduce && !LOW) raf = requestAnimationFrame(loop); });
    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible && onTop() && !raf && !reduce && !LOW) raf = requestAnimationFrame(loop);
    }).observe(cv);
    let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); }); resize();
    if (!MOBILE) addEventListener("pointermove", e => { mT[0] = e.clientX / innerWidth - .5; mT[1] = .5 - e.clientY / innerHeight; }, { passive: true });
    if (reduce || LOW) draw(performance.now()); else raf = requestAnimationFrame(loop);
    cv.style.background = "none";
    return {
      set(id) {
        from = JSON.parse(JSON.stringify(cur)); target = HERO_METALS[id]; t0 = performance.now();
        if (reduce || LOW) { t0 -= 1000; draw(performance.now()); }
      }
    };
  })();
  $$("#metalChips .chip").forEach(ch => ch.addEventListener("click", () => {
    $$("#metalChips .chip").forEach(c => { c.classList.toggle("is-on", c === ch); c.setAttribute("aria-pressed", c === ch); });
    heroMetal.set(ch.dataset.metal);
  }));

  /* ---------------------------------------------------------- metal library */
  let prices = {}; // sym -> USD per troy oz
  const tabs = $("#libTabs"), panel = $("#libPanel");
  let libCurrent = METALS[0];
  METALS.forEach((m, i) => {
    const b = document.createElement("button");
    b.className = "lib__tab"; b.role = "tab"; b.id = "tab-" + m.id;
    b.setAttribute("aria-selected", i === 0); b.setAttribute("aria-controls", "libPanel"); b.tabIndex = i === 0 ? 0 : -1;
    b.innerHTML = `<i style="--sw:${m.sw}"></i>${m.name}<small>${m.sym}</small>`;
    b.addEventListener("click", () => selectMetal(m, b));
    tabs.appendChild(b);
  });
  tabs.addEventListener("keydown", e => {
    const list = $$(".lib__tab", tabs), i = list.indexOf(document.activeElement);
    if (i < 0) return;
    const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!d) return; e.preventDefault();
    const n = list[(i + d + list.length) % list.length]; n.focus(); n.click();
  });
  // Every metal's sheet is rendered into the same grid cell, so the card always
  // takes the height of the tallest one and never jumps when switching.
  const stack = $("#libStack");
  stack.innerHTML = METALS.map(m => `
    <div class="lib__info" data-metal="${m.id}" aria-hidden="true">
      <p class="lib__kicker">${m.kicker}</p>
      <h3>${m.name}</h3>
      <p>${m.desc}</p>
      <div class="lib__specs">${m.specs.map(([k, v]) => `<div class="spec"><span>${k}</span><b>${v}</b></div>`).join("")}</div>
      <div class="lib__live">${m.spot
        ? `<i class="dot" data-status></i><span>Spot today</span><b data-lib-spot="${m.spot}">—</b>`
        : `<span>Priced per project</span><b>On quote</b>`}<a href="${m.spot ? "#market" : "#start"}">${m.spot ? "See all prices" : "Ask for a quote"} →</a></div>
    </div>`).join("");
  function selectMetal(m, btn) {
    libCurrent = m;
    $$(".lib__tab", tabs).forEach(t => { const on = t === btn; t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1; });
    if (btn) panel.setAttribute("aria-labelledby", btn.id);
    $("#libSwatch").style.setProperty("--sw", m.sw);
    $("#libSym").textContent = m.sym;
    $$(".lib__info", stack).forEach(el => { const on = el.dataset.metal === m.id; el.classList.toggle("is-on", on); el.setAttribute("aria-hidden", !on); });
  }
  function renderLibPrice() {
    $$("[data-lib-spot]", stack).forEach(b => {
      const v = prices[b.dataset.libSpot];
      b.textContent = v ? `${usd(v)} /oz · ${usd(v / G_PER_OZ)} /g` : "—";
    });
  }
  selectMetal(METALS[0], $(".lib__tab", tabs));

  /* ------------------------------------------------------------ metal desk */
  let unit = "oz", lastPrices = {}, firstPrices = null, lastUpdate = null;
  const spotsEl = $("#spots");
  spotsEl.innerHTML = SPOTS.map(s => `
    <article class="spot is-loading" data-sym="${s.sym}" style="--sw:${s.sw}">
      <div class="spot__top"><i></i><b>${s.name}</b><small>${s.sym}</small></div>
      <div class="spot__price" aria-live="polite">$0,000.00</div>
      <div class="spot__unit">${UNITS[unit].label}</div>
      <div class="spot__chg">&nbsp;</div>
    </article>`).join("");

  function renderSpots(flash) {
    SPOTS.forEach(s => {
      const el = $(`.spot[data-sym="${s.sym}"]`, spotsEl), v = prices[s.sym];
      if (v == null) return;
      el.classList.remove("is-loading");
      const pe = $(".spot__price", el);
      pe.textContent = usd(v * UNITS[unit].f);
      $(".spot__unit", el).textContent = "USD " + UNITS[unit].label;
      const chg = $(".spot__chg", el);
      if (firstPrices && firstPrices[s.sym] && Math.abs(v - firstPrices[s.sym]) > 1e-6) {
        const d = (v - firstPrices[s.sym]) / firstPrices[s.sym] * 100;
        chg.className = "spot__chg " + (d >= 0 ? "up" : "down");
        chg.textContent = `${d >= 0 ? "▲" : "▼"} ${Math.abs(d).toFixed(2)}% since you arrived`;
      } else { chg.className = "spot__chg"; chg.textContent = lastUpdate ? (innerWidth < 560 ? "" : "Updated ") + nyTime(lastUpdate) : "Spot · USD"; }
      if (flash && lastPrices[s.sym] && lastPrices[s.sym] !== v) {
        pe.classList.add(v > lastPrices[s.sym] ? "flash-up" : "flash-down");
        setTimeout(() => pe.classList.remove("flash-up", "flash-down"), 900);
      }
    });
    const g = prices.XAU;
    $("[data-nav-gold]").textContent = g ? usd(g, 0) : "—";
    $("#ktable tbody").innerHTML = KARATS.map(([k, f]) =>
      `<tr><td>${k}</td><td>${(f * 1000).toFixed(f === .999 ? 1 : 1).replace(/\.0$/, "")}</td><td>${g ? usd(g / G_PER_OZ * f) : "—"}</td><td>${g ? usd(g / G_PER_OZ * G_PER_DWT * f) : "—"}</td></tr>`).join("");
    renderLibPrice(); calc();
  }
  $$(".unit").forEach(b => b.addEventListener("click", () => {
    unit = b.dataset.unit;
    $$(".unit").forEach(x => { x.classList.toggle("is-on", x === b); x.setAttribute("aria-pressed", x === b); });
    $$(".spot__unit").forEach(u => u.textContent = "USD " + UNITS[unit].label);
    renderSpots(false);
  }));

  function setStatus(kind, text, when) {
    $$("[data-status]").forEach(d => { d.className = "dot is-" + kind; });
    $("#feedStatus").textContent = text;
    $("#feedStamp").textContent = when ? `${nyDate(when)} · ${nyTime(when)}` : " ";
  }

  async function fetchPrices() {
    const base = (RIO.prices && RIO.prices.endpoint) || "https://api.gold-api.com/price/";
    try {
      const res = await Promise.all(SPOTS.map(s =>
        fetch(base + s.sym, { cache: "no-store" }).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })));
      const next = {}; let latest = 0;
      res.forEach((j, i) => {
        if (typeof j.price === "number" && j.price > 0) next[SPOTS[i].sym] = j.price;
        const t = Date.parse(j.updatedAt); if (t > latest) latest = t;
      });
      if (!Object.keys(next).length) throw new Error("empty");
      lastPrices = { ...prices }; prices = next;
      if (!firstPrices) firstPrices = { ...next };
      const when = new Date(latest || Date.now()); lastUpdate = when;
      store.set("rio-prices", { prices: next, at: when.getTime() });
      setStatus("live", "Live market prices", when);
      renderSpots(true);
    } catch (e) {
      if (Object.keys(prices).length) { setStatus("stale", "Reconnecting — showing last update", null); return; }
      const cached = store.get("rio-prices");
      if (cached && cached.prices) {
        prices = cached.prices;
        setStatus("stale", "Live feed unavailable — last known prices", new Date(cached.at));
        renderSpots(false);
      } else {
        setStatus("down", "Live feed unavailable — call us for today's price", null);
        $$(".spot", spotsEl).forEach(el => { el.classList.remove("is-loading"); $(".spot__price", el).textContent = "—"; });
      }
    }
  }
  fetchPrices();
  setInterval(() => { if (!document.hidden) fetchPrices(); }, (RIO.prices && RIO.prices.refreshMs) || 60000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) fetchPrices(); });

  /* ----------------------------------------------------------- estimator */
  let mode = "wax";
  const alloySel = $("#calcAlloy"), wIn = $("#calcW");
  alloySel.innerHTML = ALLOYS.map(a => `<option value="${a.id}"${a.id === "14k" ? " selected" : ""}>${a.name}</option>`).join("");
  $$(".seg__b").forEach(b => b.addEventListener("click", () => {
    mode = b.dataset.mode;
    $$(".seg__b").forEach(x => { x.classList.toggle("is-on", x === b); x.setAttribute("aria-pressed", x === b); });
    $("#calcWLabel").textContent = mode === "wax" ? "Wax weight" : "Metal weight";
    calc();
  }));
  alloySel.addEventListener("change", calc); wIn.addEventListener("input", calc);
  function calc() {
    const a = ALLOYS.find(x => x.id === alloySel.value), w = parseFloat(wIn.value);
    const out = $("#calcMetalW"), val = $("#calcValue");
    if (!a || !(w > 0)) { out.textContent = "—"; val.textContent = "—"; return; }
    const metalG = mode === "wax" ? w * a.sg : w;
    out.textContent = `${metalG.toLocaleString("en-US", { maximumFractionDigits: 2 })} g`;
    if (!a.sym) { val.textContent = "On quote"; return; }
    const spot = prices[a.sym];
    val.textContent = spot ? usd(metalG * a.fine * spot / G_PER_OZ) : "—";
  }
  calc();

  /* -------------------------------------------------------------- globe */
  (() => {
    const cv = $("#globe"); if (!cv) return;
    const ctx = cv.getContext("2d");
    const R2D = Math.PI / 180;
    const NYC = [40.76, -73.98];
    const CITIES = [[51.5, -0.12], [48.85, 2.35], [40.42, -3.7], [25.2, 55.27], [35.68, 139.69], [22.32, 114.17], [-23.55, -46.63], [19.43, -99.13], [4.71, -74.07], [34.05, -118.24], [43.65, -79.38], [-33.87, 151.21], [45.46, 9.19], [32.08, 34.78], [1.35, 103.82]];
    const pts = [];
    for (let lat = -80; lat <= 80; lat += 6) {
      const n = Math.max(6, Math.round(60 * Math.cos(lat * R2D)));
      for (let i = 0; i < n; i++) pts.push([lat, -180 + i * 360 / n]);
    }
    const toV = ([lat, lon]) => [Math.cos(lat * R2D) * Math.sin(lon * R2D), Math.sin(lat * R2D), Math.cos(lat * R2D) * Math.cos(lon * R2D)];
    const STILL = reduce || LOW;
    // Geometry is computed once; each frame only rotates and projects it.
    const dots = pts.map(toV), nyc = toV(NYC);
    const ARC_N = 40;
    const arcs = CITIES.map((c, i) => {
      const b = toV(c), d = Math.acos(Math.min(1, nyc[0] * b[0] + nyc[1] * b[1] + nyc[2] * b[2])), lift = .05 + d * .045;
      const path = [];
      for (let j = 0; j <= ARC_N; j++) {
        const k = j / ARC_N, v = slerp(nyc, b, k), h = 1 + Math.sin(k * Math.PI) * lift;
        path.push([v[0] * h, v[1] * h, v[2] * h]);
      }
      return { b, path, off: i * .37 };
    });
    let W = 0, raf = 0, vis = false, last = 0, t0 = performance.now();
    const resize = () => {
      const s = Math.min(devicePixelRatio || 1, 1.5); W = cv.clientWidth;
      cv.width = W * s; cv.height = W * s; ctx.setTransform(s, 0, 0, s, 0, 0);
      if (STILL) frame(performance.now());
    };
    const tilt = 22 * R2D;
    const ct = Math.cos(tilt), st = Math.sin(tilt);
    let cr = 1, sr = 0;
    const rot0 = t => (73.98 - 25) * R2D + Math.sin(t * .08) * .5;
    function proj(v) {
      const x = v[0], y = v[1], z = v[2];
      const x1 = x * cr + z * sr, z1 = -x * sr + z * cr;
      return [x1, y * ct - z1 * st, y * st + z1 * ct];
    }
    function slerp(a, b, t) {
      const d = Math.acos(Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])), s = Math.sin(d);
      const k1 = Math.sin((1 - t) * d) / s, k2 = Math.sin(t * d) / s;
      return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2];
    }
    function frame(now) {
      const t = STILL ? 0 : Math.max(0, now - t0) / 1000;
      const rot = rot0(t); cr = Math.cos(rot); sr = Math.sin(rot);
      const r = W * .42, cx = W / 2, cy = W / 2;
      ctx.clearRect(0, 0, W, W);
      const g = ctx.createRadialGradient(cx - r * .3, cy - r * .4, r * .1, cx, cy, r * 1.05);
      g.addColorStop(0, "rgba(10,43,181,.55)"); g.addColorStop(1, "rgba(7,11,31,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r * 1.05, 0, 7); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
      // dots batched into 4 brightness bands: 4 fills per frame instead of ~1,500
      const bands = [[], [], [], []];
      for (const v of dots) {
        const [x, y, z] = proj(v, rot); if (z < 0) continue;
        bands[Math.min(3, (z * 4) | 0)].push(cx + x * r, cy - y * r);
      }
      bands.forEach((b, i) => {
        ctx.fillStyle = `rgba(255,255,255,${.1 + i * .09})`; ctx.beginPath();
        for (let j = 0; j < b.length; j += 2) ctx.rect(b[j], b[j + 1], 1.4, 1.4);
        ctx.fill();
      });
      for (const a of arcs) {
        const prog = STILL ? 1 : ((t * .22 + a.off) % 1.6), end = Math.min(prog, 1) * ARC_N;
        ctx.beginPath(); let on = false;
        for (let i = 0; i <= end; i++) {
          const [x, y, z] = proj(a.path[i], rot);
          if (z < -.05) { on = false; continue; }
          on ? ctx.lineTo(cx + x * r, cy - y * r) : ctx.moveTo(cx + x * r, cy - y * r); on = true;
        }
        const fade = prog > 1 ? Math.max(0, 1 - (prog - 1) / .6) : 1;
        ctx.strokeStyle = `rgba(255,140,60,${.75 * fade})`; ctx.lineWidth = 1.3; ctx.stroke();
        const [bx, by, bz] = proj(a.b, rot);
        if (bz > 0 && prog >= 1) { ctx.fillStyle = `rgba(255,200,150,${fade})`; ctx.beginPath(); ctx.arc(cx + bx * r, cy - by * r, 2.2, 0, 7); ctx.fill(); }
      }
      const [nx, ny, nz] = proj(nyc, rot);
      if (nz > 0) {
        const px = cx + nx * r, py = cy - ny * r, pulse = STILL ? 0 : (t % 2) / 2;
        ctx.strokeStyle = `rgba(255,107,15,${1 - pulse})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(px, py, 4 + pulse * 18, 0, 7); ctx.stroke();
        ctx.fillStyle = "#FF6B0F"; ctx.beginPath(); ctx.arc(px, py, 4.5, 0, 7); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.font = "500 11px 'Geist Mono',monospace";
        ctx.fillText("NEW YORK", px + 12, py + 4);
      }
    }
    const loop = (now) => {
      if (now - last >= FRAME_MS - 2) { last = now; frame(now); }
      raf = vis && !STILL ? requestAnimationFrame(loop) : 0;
    };
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis && !raf && !STILL) raf = requestAnimationFrame(loop); }, { rootMargin: "100px" }).observe(cv);
    let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); }); resize();
  })();

  /* ------------------------------------------- hero curtain (stays put) */
  const heroIn = $(".hero__in"), heroShade = $(".hero__shade");
  const onCurtain = () => {
    if (reduce) return;
    const k = Math.min(1, Math.max(0, scrollY / innerHeight));
    heroIn.style.opacity = 1 - k * 1.15;
    heroIn.style.transform = `translateY(${-k * 70}px) scale(${1 - k * .04})`;
    heroShade.style.opacity = 1 + k * .6;
  };
  onScrollFrame(onCurtain);

  /* ------------------------------------- principle: morphing jewel, scroll-led */
  (() => {
    const sec = $("#principle"); if (!sec) return;
    const N = 160, TAU = Math.PI * 2, STILL = reduce || LOW;
    const ell = (cx, cy, rx, ry) => Array.from({ length: 121 }, (_, i) => {
      const t = -Math.PI / 2 + i / 120 * TAU; return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)];
    });
    const curve = (fn, n = 120) => Array.from({ length: n + 1 }, (_, i) => fn(i / n));
    const resample = (pts) => {
      const L = [0];
      for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      const tot = L[L.length - 1], out = []; let j = 1;
      for (let k = 0; k < N; k++) {
        const d = k / (N - 1) * tot;
        while (j < L.length - 1 && L[j] < d) j++;
        const f = (d - L[j - 1]) / ((L[j] - L[j - 1]) || 1);
        out.push([pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * f, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * f]);
      }
      return out;
    };
    const FORMS = [
      { name: "Solitaire", metal: "Molten", col: ["#FFB35A", "#FF6B0F", "#7A1E00"],
        a: ell(200, 262, 128, 62), b: ell(200, 266, 106, 47),
        c: [[182, 118], [218, 118], [242, 142], [200, 202], [158, 142], [182, 118]] },
      { name: "Pendant", metal: "18K Yellow", col: ["#FFE7A8", "#E0A93B", "#7A5212"],
        a: curve(t => [80 + 240 * t, 40 + 150 * (1 - Math.pow(2 * t - 1, 2))]),
        b: curve(t => { const u = t * TAU; return [200 + 62 * Math.sin(u) * Math.sin(u / 2), 205 + 78 * (1 - Math.cos(u))]; }),
        c: ell(200, 300, 22, 28) },
      { name: "Hoop", metal: "18K Rose", col: ["#FFD9C8", "#D98A6E", "#6E3324"],
        a: ell(200, 238, 122, 122), b: ell(200, 238, 102, 102), c: ell(200, 94, 15, 15) },
      { name: "Bangle", metal: "Platinum 950", col: ["#F4F7FB", "#9AA3B0", "#3A4150"],
        a: ell(200, 220, 158, 74), b: ell(200, 232, 138, 58), c: ell(200, 146, 20, 11) },
      { name: "Brilliant", metal: "Any metal", col: ["#FFB35A", "#0A2BB5", "#061A7A"],
        a: [[150, 128], [250, 128], [302, 178], [200, 330], [98, 178], [150, 128]],
        b: [[98, 178], [150, 128], [175, 178], [200, 128], [225, 178], [250, 128], [302, 178], [98, 178]],
        c: [[150, 178], [200, 330], [250, 178]] }
    ].map(f => ({ ...f, a: resample(f.a), b: resample(f.b), c: resample(f.c) }));

    const el = { a: $("#ja"), b: $("#jb"), c: $("#jc") }, glint = $("#jglint");
    const stops = [$("#jg0"), $("#jg1"), $("#jg2")];
    const fig = $("#jfig"), metal = $("#jmetal"), list = $("#forms");
    list.innerHTML = FORMS.map(f => `<li>${f.name}</li>`).join("");
    const items = $$("li", list);

    // split the manifesto into words so they can be "poured" in as you scroll
    const text = $(".manifesto__text");
    // one span per word (with its trailing space, so the underline runs across)
    const parts = text.textContent.trim().split(/\s+/);
    text.innerHTML = parts.map((w, i) => `<span class="w">${w}${i < parts.length - 1 ? " " : ""}</span>`).join("");
    const words = $$(".w", text);

    const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const mixHex = (x, y, k) => "rgb(" + hex(x).map((v, i) => Math.round(v + (hex(y)[i] - v) * k)).join(",") + ")";
    const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

    let prog = 0, shown = -1, raf = 0, vis = false;
    const t0 = performance.now();
    function render(now) {
      const t = STILL ? 0 : Math.max(0, now - t0) / 1000;
      const s = prog * (FORMS.length - 1), i = Math.min(FORMS.length - 2, Math.floor(s));
      const k = smooth(.2, .8, s - i), A = FORMS[i], B = FORMS[i + 1];
      for (const key of ["a", "b", "c"]) {
        let d = "";
        const pa = A[key], pb = B[key];
        for (let n = 0; n < N; n++) {
          const w = STILL ? 0 : Math.sin(t * 1.2 + n * .09) * .9;
          const x = pa[n][0] + (pb[n][0] - pa[n][0]) * k, y = pa[n][1] + (pb[n][1] - pa[n][1]) * k + w;
          d += (n ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
        }
        el[key].setAttribute("d", d);
      }
      const gi = Math.floor(((t * .12) % 1) * N), ga = A.a[gi], gb = B.a[gi];
      glint.setAttribute("cx", (ga[0] + (gb[0] - ga[0]) * k).toFixed(1));
      glint.setAttribute("cy", (ga[1] + (gb[1] - ga[1]) * k).toFixed(1));
      stops.forEach((st, j) => st.setAttribute("stop-color", mixHex(A.col[j], B.col[j], k)));
      const cur = k < .5 ? i : i + 1;
      if (cur !== shown) {
        shown = cur;
        fig.textContent = "Fig. 0" + (cur + 1) + " — " + FORMS[cur].name;
        metal.textContent = FORMS[cur].metal;
        items.forEach((li, j) => li.classList.toggle("is-on", j === cur));
      }
    }
    function update() {
      const r = sec.getBoundingClientRect(), span = r.height - innerHeight;
      prog = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
      const wp = reduce ? 1 : Math.min(1, prog / .9);
      const lit = Math.round(wp * words.length);
      if (lit === litShown) return; litShown = lit;
      words.forEach((w, j) => {
        w.classList.toggle("is-on", j < lit);
        w.classList.toggle("is-cur", !reduce && j < lit && j >= lit - 3);
      });
    }
    let last = 0, litShown = -1;
    const loop = (now) => {
      if (now - last >= FRAME_MS - 2) { last = now; render(now); }
      raf = vis && !STILL ? requestAnimationFrame(loop) : 0;
    };
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis && !raf && !STILL) raf = requestAnimationFrame(loop); }).observe(sec);
    onScrollFrame(() => { if (!vis && raf === 0 && litShown >= 0) return; update(); if (STILL) render(0); });
    addEventListener("resize", update);
    update(); render(performance.now());
  })();

  /* ------------------------------------------------- reveal + process line */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("is-seen"); io.unobserve(e.target); }
  }), { threshold: .15 });
  $$(".reveal").forEach(el => io.observe(el));

  const steps = $("#steps"), stepEls = $$(".step", steps);
  const onStep = () => {
    const r = steps.getBoundingClientRect(), vh = innerHeight;
    const p = Math.min(1, Math.max(0, (vh * .8 - r.top) / (vh * .55)));
    steps.style.setProperty("--p", p);
    stepEls.forEach((s, i) => s.classList.toggle("is-lit", p >= i / stepEls.length + .02));
  };
  onScrollFrame(onStep);

  /* ------------------------------------------------------------- contact */
  const C = RIO.contact || {};
  const setC = (k, text, href) => { const a = $(`[data-c="${k}"]`); if (a) { a.textContent = text || "—"; if (href) a.href = href; } };
  setC("address", C.address, C.address && "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(C.address));
  setC("phone", C.phone, C.phone && "tel:" + C.phone.replace(/[^\d+]/g, ""));
  setC("email", C.email, C.email && "mailto:" + C.email);

  /* ---------------------------------------------------------------- form */
  const form = $("#form"), msg = $("#formMsg");
  form.addEventListener("submit", async e => {
    e.preventDefault();
    let bad = null;
    $$("[required]", form).forEach(f => {
      const ok = f.value.trim() && (f.type !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value));
      f.setAttribute("aria-invalid", !ok); if (!ok && !bad) bad = f;
    });
    if (bad) { msg.className = "form__msg err"; msg.textContent = "Please complete your name, a valid email and a short description."; bad.focus(); return; }
    const data = Object.fromEntries(new FormData(form));
    const endpoint = RIO.form && RIO.form.endpoint;
    if (endpoint) {
      msg.className = "form__msg"; msg.textContent = "Sending…";
      try {
        const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
        if (!r.ok) throw new Error(r.status);
        form.reset(); msg.textContent = "Thank you — your request is in. Our New York team will be in touch shortly.";
      } catch {
        msg.className = "form__msg err"; msg.textContent = `Something went wrong. Please email us at ${C.email || "our studio"}.`;
      }
      return;
    }
    const body = [
      `Name: ${data.name}`, data.company && `Company: ${data.company}`, `Email: ${data.email}`, data.phone && `Phone: ${data.phone}`,
      `Service: ${data.service}`, `Metal: ${data.metal}`, data.quantity && `Quantity: ${data.quantity}`, "", data.message
    ].filter(x => x !== undefined && x !== "").join("\n");
    location.href = `mailto:${C.email || ""}?subject=${encodeURIComponent("New project — " + data.service + " (" + data.name + ")")}&body=${encodeURIComponent(body)}`;
    msg.className = "form__msg"; msg.textContent = "Your email app should open with the request ready to send.";
  });
})();
