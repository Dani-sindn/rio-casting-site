/* =========================================================================
   Rio Casting — client portal (prototype)
   Sample data only. In production the same views read from Supabase, where
   each client can only ever see their own rows (row-level security).
   ========================================================================= */
(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const app = $("#app");

  /* ------------------------------------------------------------ sample data */
  // Dates are offsets from today, so the prototype always looks current.
  const day = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return d; };
  const fmt = (d, o = { month: "short", day: "numeric" }) => d.toLocaleDateString("en-US", o);
  const usd = v => "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const STAGES = ["Received", "Quoted", "Approved", "CAD / 3D", "Casting", "Finishing", "Ready / Shipped"];
  const STAGE_COPY = [
    "We have your request and files.",
    "Your quote is ready to review.",
    "Quote approved — your piece is scheduled.",
    "Modeling and printing in wax or resin.",
    "Your piece is being cast in metal.",
    "Clean-up, polishing and final detailing.",
    "Ready for pick-up or on its way to you."
  ];

  const CLIENT = { first: "María", last: "Torres", company: "Torres Fine Jewelry", email: "maria@torresfinejewelry.com", phone: "+1 (646) 555-0142", since: 2024 };
  const CONTACT = { name: "Roberto", phone: "+1 212-764-7674", email: "roberto@riocasting.com" };

  const ORDERS = [
    { code: "RC-2026-0142", piece: "Signet ring — custom crest", metal: "18K Yellow Gold", qty: 1, stage: 4,
      dates: [-18, -16, -14, -12, -1], eta: 6, quote: "Q-2026-0362",
      notes: { 3: "CAD approved after one revision.", 4: "Poured this morning — cooling and devesting." } },
    { code: "RC-2026-0139", piece: "Bridal bands — production run", metal: "14K White Gold", qty: 40, stage: 5,
      dates: [-25, -23, -22, -20, -9, -3], eta: 4, quote: "Q-2026-0355",
      notes: { 5: "32 of 40 polished. Final inspection on Monday." } },
    { code: "RC-2026-0147", piece: "Pendant prototype", metal: "Sterling Silver", qty: 3, stage: 3,
      dates: [-8, -7, -5, -2], eta: 13, quote: "Q-2026-0372",
      notes: { 3: "3D preview sent to your email for review." } },
    { code: "RC-2026-0151", piece: "Cuff bracelet", metal: "Bronze", qty: 12, stage: 1,
      dates: [-3, -1], eta: null, quote: "Q-2026-0381",
      notes: { 1: "Quote sent — waiting for your approval." } },
    { code: "RC-2026-0118", piece: "Engagement ring", metal: "Platinum 950", qty: 1, stage: 6, complete: true,
      dates: [-52, -50, -49, -46, -38, -33, -21], eta: -21, quote: "Q-2026-0331",
      notes: { 6: "Shipped via FedEx Priority — delivered." } }
  ];

  const QUOTES = [
    { code: "Q-2026-0381", order: "RC-2026-0151", piece: "Cuff bracelet ×12", metal: "Bronze", amount: 2860, issued: -1, valid: 14, status: "pending" },
    { code: "Q-2026-0372", order: "RC-2026-0147", piece: "Pendant prototype ×3", metal: "Sterling Silver", amount: 640, issued: -7, valid: 7, status: "approved" },
    { code: "Q-2026-0362", order: "RC-2026-0142", piece: "Signet ring ×1", metal: "18K Yellow Gold", amount: 1940, issued: -16, valid: -2, status: "approved" },
    { code: "Q-2026-0355", order: "RC-2026-0139", piece: "Bridal bands ×40", metal: "14K White Gold", amount: 9800, issued: -23, valid: -9, status: "approved" },
    { code: "Q-2026-0331", order: null, piece: "Hoop earrings ×24", metal: "14K Rose Gold", amount: 1320, issued: -40, valid: -10, status: "expired" }
  ];

  /* ---------------------------------------------------------------- helpers */
  const session = {
    get() { try { return sessionStorage.getItem("rio-portal") === "1"; } catch { return false; } },
    set(on) { try { on ? sessionStorage.setItem("rio-portal", "1") : sessionStorage.removeItem("rio-portal"); } catch {} }
  };
  let signedIn = session.get();

  let toastT = 0;
  const toast = msg => {
    const t = $("#toast"); t.textContent = msg; t.classList.add("is-on");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("is-on"), 3600);
  };

  const active = () => ORDERS.filter(o => !o.complete);
  const pendingQuotes = () => QUOTES.filter(q => q.status === "pending");
  const stagePill = o => o.complete ? `<span class="pill pill--done">Delivered</span>`
    : o.stage === 1 ? `<span class="pill pill--wait">Awaiting approval</span>`
    : `<span class="pill pill--live">${STAGES[o.stage]}</span>`;
  const etaText = o => o.complete ? `Delivered ${fmt(day(o.eta))}` : o.eta == null ? "Date set on approval" : `Est. ready ${fmt(day(o.eta), { weekday: "short", month: "short", day: "numeric" })}`;
  const bar = o => `<div class="bar" aria-hidden="true">${STAGES.map((_, i) =>
    `<i class="${i < o.stage || o.complete ? "on" : i === o.stage ? "now" : ""}"></i>`).join("")}</div>`;
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };

  const orderCard = o => `
    <a class="order" href="#/orders/${o.code}">
      <div class="order__h">
        <div><p class="order__code">${o.code}</p><h3 class="order__piece">${o.piece}</h3><p class="order__meta">${o.metal} · ${o.qty} ${o.qty === 1 ? "piece" : "pieces"}</p></div>
        ${stagePill(o)}
      </div>
      ${bar(o)}
      <div class="order__f"><span>Step <b>${Math.min(o.stage + 1, 7)} of 7</b> · ${STAGES[o.stage]}</span><span><b>${etaText(o)}</b></span></div>
    </a>`;

  const contactCard = () => `
    <div class="card">
      <h3>Your contact at Río</h3>
      <p>Questions about an order? Mention its code and we'll pick it up from there.</p>
      <div class="contact">
        <a href="tel:${CONTACT.phone.replace(/[^\d+]/g, "")}"><svg aria-hidden="true"><use href="#i-phone"/></svg>${CONTACT.phone}</a>
        <a href="mailto:${CONTACT.email}"><svg aria-hidden="true"><use href="#i-mail"/></svg>${CONTACT.email}</a>
      </div>
    </div>`;

  /* ------------------------------------------------------------------ views */
  function viewSignIn() {
    document.title = "Sign in — Rio Casting Client Portal";
    app.innerHTML = `
      <div class="auth">
        <section class="auth__brand">
          <a class="brand" href="../"><svg aria-hidden="true"><use href="#logo"/></svg><span><b>RÍO CASTING</b><small>Creation without limits</small></span></a>
          <div>
            <h1>Your pieces, <em>tracked.</em></h1>
            <p>Follow every order from wax to metal — status, timelines and quotes in one place.</p>
          </div>
          <ul class="auth__perks"><li>Live status for every order</li><li>Estimated ready dates</li><li>Your quotes, all in one list</li></ul>
        </section>
        <section class="auth__side">
          <div class="signin" id="signin"></div>
        </section>
      </div>`;
    stepEmail();
  }

  function stepEmail(prefill = "") {
    const box = $("#signin");
    box.innerHTML = `
      <p class="eyebrow">Client portal</p>
      <h2>Sign in</h2>
      <p class="signin__lead">Enter the email your Río Casting account was set up with. We'll send you a one-time code — no password needed.</p>
      <form id="fEmail" novalidate>
        <label>Email<input id="email" type="email" autocomplete="email" inputmode="email" required value="${prefill}" placeholder="you@company.com" /></label>
        <p class="signin__err" id="err" role="alert"></p>
        <button class="btn btn--molten btn--block" type="submit">Send my code <svg aria-hidden="true"><use href="#i-arrow"/></svg></button>
      </form>
      <div class="signin__safe"><svg aria-hidden="true"><use href="#i-lock"/></svg><span>Access is by invitation only. Not a client yet? <a class="link" href="../#start">Start a project</a>.</span></div>`;
    $("#email").focus();
    $("#fEmail").addEventListener("submit", e => {
      e.preventDefault();
      const v = $("#email").value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { $("#err").textContent = "Please enter a valid email address."; $("#email").setAttribute("aria-invalid", "true"); return; }
      stepCode(v);
    });
  }

  function stepCode(email) {
    const box = $("#signin");
    const masked = email.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => a + "•".repeat(Math.min(b.length, 6)) + c);
    box.innerHTML = `
      <p class="eyebrow">Check your inbox</p>
      <h2>Enter your code</h2>
      <p class="signin__lead">We sent a 6-digit code to <b>${masked}</b>. It works once and expires in 10 minutes.</p>
      <form id="fCode" novalidate>
        <label><span class="sr">6-digit code</span><input id="code" class="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" required placeholder="000000" /></label>
        <p><span class="hint">Prototype: any 6 digits will work.</span></p>
        <p class="signin__err" id="err" role="alert"></p>
        <button class="btn btn--molten btn--block" type="submit">Sign in <svg aria-hidden="true"><use href="#i-arrow"/></svg></button>
      </form>
      <div class="signin__alt" style="margin-top:18px">
        <button class="link" type="button" id="resend">Send a new code</button>
        <button class="link" type="button" id="change">Use a different email</button>
      </div>`;
    const code = $("#code");
    code.focus();
    code.addEventListener("input", () => { code.value = code.value.replace(/\D/g, "").slice(0, 6); });
    $("#resend").addEventListener("click", () => toast("Prototype: a new code would be sent now."));
    $("#change").addEventListener("click", () => stepEmail(email));
    $("#fCode").addEventListener("submit", e => {
      e.preventDefault();
      if (!/^\d{6}$/.test(code.value)) { $("#err").textContent = "Enter the 6 digits from the email."; return; }
      signedIn = true; session.set(true);
      location.hash = "#/overview";
    });
  }

  function shell(current, inner) {
    const pq = pendingQuotes().length;
    const tab = (id, icon, label, extra = "") =>
      `<a href="#/${id}"${current === id ? ' aria-current="page"' : ""}><svg aria-hidden="true"><use href="#i-${icon}"/></svg><span>${label}</span>${extra}</a>`;
    app.innerHTML = `
      <header class="top">
        <div class="wrap top__in">
          <a class="brand" href="#/overview" aria-label="Rio Casting client portal — overview"><svg aria-hidden="true"><use href="#logo"/></svg><span><b>RÍO CASTING</b><small>Creation without limits</small></span></a>
          <span class="top__tag">Client portal</span>
          <nav class="tabs" aria-label="Portal">
            ${tab("overview", "home", "Overview")}
            ${tab("orders", "box", "Orders")}
            ${tab("quotes", "doc", "Quotes", pq ? `<span class="badge" aria-label="${pq} pending">${pq}</span>` : "")}
            ${tab("account", "user", "Account")}
          </nav>
          <div class="me">
            <span class="me__av" aria-hidden="true">${CLIENT.first[0]}${CLIENT.last[0]}</span>
            <span class="me__name">${CLIENT.first}</span>
            <button class="me__out" type="button" id="signout">Sign out</button>
          </div>
        </div>
      </header>
      <main id="main"><div class="wrap">${inner}</div></main>`;
    $("#signout").addEventListener("click", () => { signedIn = false; session.set(false); location.hash = "#/signin"; toast("You've been signed out."); });
    const h1 = $("main h1"); if (h1) { h1.tabIndex = -1; h1.focus({ preventScroll: true }); }
  }

  function viewOverview() {
    document.title = "Overview — Rio Casting Client Portal";
    const act = active(), pq = pendingQuotes();
    const next = act.filter(o => o.eta != null).sort((a, b) => a.eta - b.eta)[0];
    const feed = ORDERS.flatMap(o => o.dates.map((d, i) => ({ o, i, d })))
      .sort((a, b) => b.d - a.d).slice(0, 5)
      .map(({ o, i, d }) => `<li><span><b>${o.code}</b> · ${STAGES[i]}<small>${fmt(day(d), { weekday: "short", month: "short", day: "numeric" })}</small></span></li>`).join("");
    shell("overview", `
      <div class="page-h">
        <div>
          <p class="eyebrow">${fmt(new Date(), { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1>${greeting()}, ${CLIENT.first}.</h1>
          <p>${CLIENT.company} · Client since ${CLIENT.since}</p>
        </div>
      </div>
      <div class="stats">
        <div class="stat"><span>Active orders</span><b>${act.length}</b><small>In the workshop now</small></div>
        <div class="stat"><span>Quotes for you</span><b>${pq.length}</b><small>${pq.length ? "Waiting for your approval" : "Nothing pending"}</small></div>
        <div class="stat"><span>Next ready</span><b>${next ? fmt(day(next.eta)) : "—"}</b><small>${next ? next.code + " · " + next.piece.split(" — ")[0] : ""}</small></div>
      </div>
      ${pq.map(q => `
        <div class="attn">
          <span class="attn__ic"><svg aria-hidden="true"><use href="#i-doc"/></svg></span>
          <div class="attn__t"><b>Your quote ${q.code} is ready — ${usd(q.amount)}</b><span>${q.piece} in ${q.metal}. Valid until ${fmt(day(q.valid), { month: "long", day: "numeric" })}.</span></div>
          <a class="btn btn--molten btn--sm" href="#/quotes">Review quote <svg aria-hidden="true"><use href="#i-arrow"/></svg></a>
        </div>`).join("")}
      <div class="grid2">
        <section>
          <h2 class="section-t">Active orders <a href="#/orders">All orders →</a></h2>
          <div class="stack">${act.map(orderCard).join("")}</div>
        </section>
        <aside class="stack">
          ${contactCard()}
          <div class="card"><h3>Latest updates</h3><ul class="feed">${feed}</ul></div>
        </aside>
      </div>`);
  }

  let orderFilter = "active";
  function viewOrders() {
    document.title = "Orders — Rio Casting Client Portal";
    const list = orderFilter === "active" ? active() : orderFilter === "done" ? ORDERS.filter(o => o.complete) : ORDERS;
    shell("orders", `
      <div class="page-h"><div><p class="eyebrow">Orders</p><h1>Your orders</h1><p>Every piece we're making for you, step by step.</p></div></div>
      <div class="filters" role="group" aria-label="Show">
        ${[["active", "Active"], ["done", "Completed"], ["all", "All"]].map(([k, l]) => `<button type="button" data-f="${k}" aria-pressed="${orderFilter === k}">${l}</button>`).join("")}
      </div>
      <div class="cards">${list.map(orderCard).join("") || `<p>No orders here yet.</p>`}</div>`);
    $$(".filters button").forEach(b => b.addEventListener("click", () => { orderFilter = b.dataset.f; viewOrders(); }));
  }

  function viewOrder(code) {
    const o = ORDERS.find(x => x.code === code);
    if (!o) { location.hash = "#/orders"; return; }
    document.title = `${o.code} — Rio Casting Client Portal`;
    const q = QUOTES.find(x => x.code === o.quote);
    const steps = STAGES.map((s, i) => {
      const done = i < o.stage || o.complete, now = i === o.stage && !o.complete;
      const when = o.dates[i] != null ? fmt(day(o.dates[i]), { weekday: "short", month: "short", day: "numeric" })
        : i === STAGES.length - 1 && o.eta != null ? "Est. " + fmt(day(o.eta)) : "Upcoming";
      return `<li class="${done ? "done" : now ? "now" : "next"}">
        <span class="tl__dot">${done ? `<svg aria-hidden="true"><use href="#i-check"/></svg>` : ""}</span>
        <div class="tl__t"><b>${s}${now ? " · in progress" : ""}</b>${done || now ? `<p>${o.notes[i] || STAGE_COPY[i]}</p>` : ""}</div>
        <span class="tl__d">${when}</span>
      </li>`;
    }).join("");
    shell("orders", `
      <a class="back" href="#/orders"><svg aria-hidden="true"><use href="#i-back"/></svg>All orders</a>
      <div class="page-h">
        <div><p class="eyebrow">${o.code}</p><h1>${o.piece}</h1></div>
        ${stagePill(o)}
      </div>
      <div class="facts">
        <div><span>Metal</span><b>${o.metal}</b></div>
        <div><span>Quantity</span><b>${o.qty} ${o.qty === 1 ? "piece" : "pieces"}</b></div>
        <div><span>Received</span><b>${fmt(day(o.dates[0]), { month: "long", day: "numeric" })}</b></div>
        <div><span>${o.complete ? "Delivered" : "Estimated ready"}</span><b>${o.eta == null ? "On approval" : fmt(day(o.eta), { month: "long", day: "numeric" })}</b></div>
      </div>
      <div class="grid2">
        <section><h2 class="section-t">Progress</h2><ol class="tl">${steps}</ol></section>
        <aside class="stack">
          ${q ? `<div class="card"><h3>Quote ${q.code}</h3><p>${usd(q.amount)} · ${q.status === "pending" ? "waiting for your approval" : q.status}</p><div class="acts"><a class="btn btn--line btn--sm" href="#/quotes">${q.status === "pending" ? "Review quote" : "See quotes"}</a></div></div>` : ""}
          ${contactCard()}
        </aside>
      </div>`);
  }

  function viewQuotes() {
    document.title = "Quotes — Rio Casting Client Portal";
    const pill = s => s === "pending" ? `<span class="pill pill--wait">Awaiting you</span>` : s === "approved" ? `<span class="pill pill--done">Approved</span>` : `<span class="pill pill--off">Expired</span>`;
    shell("quotes", `
      <div class="page-h"><div><p class="eyebrow">Quotes</p><h1>Your quotes</h1><p>Prices include metal, casting and finishing as described in each quote.</p></div></div>
      <div class="qlist">${QUOTES.map(q => `
        <article class="quote${q.status === "pending" ? " is-pending" : ""}">
          <div class="quote__piece"><b>${q.piece}</b><span>${q.code}${q.order ? " · " + q.order : ""}</span></div>
          <dl><dt>Amount</dt><dd>${usd(q.amount)}</dd></dl>
          <dl><dt>${q.status === "pending" ? "Valid until" : q.status === "expired" ? "Expired" : "Issued"}</dt><dd>${fmt(day(q.status === "approved" ? q.issued : q.valid))}</dd></dl>
          <dl><dt>Status</dt><dd>${pill(q.status)}</dd></dl>
          <div class="quote__act">${q.status === "pending"
            ? `<button class="btn btn--molten btn--sm" type="button" data-approve="${q.code}">Approve</button><a class="btn btn--line btn--sm" href="mailto:${CONTACT.email}?subject=${encodeURIComponent("Question about " + q.code)}">Ask</a>`
            : q.order ? `<a class="btn btn--line btn--sm" href="#/orders/${q.order}">View order</a>` : ""}</div>
        </article>`).join("")}</div>`);
    $$("[data-approve]").forEach(b => b.addEventListener("click", () => {
      const q = QUOTES.find(x => x.code === b.dataset.approve);
      q.status = "approved";
      const o = ORDERS.find(x => x.code === q.order);
      if (o) { o.stage = 2; o.dates[2] = 0; o.eta = 18; o.notes[2] = "Approved online — your piece is scheduled."; }
      viewQuotes();
      toast(`Prototype: ${q.code} marked as approved. In the live portal Río is notified.`);
    }));
  }

  function viewAccount() {
    document.title = "Account — Rio Casting Client Portal";
    shell("account", `
      <div class="page-h"><div><p class="eyebrow">Account</p><h1>Your details</h1><p>The only information we keep to run your orders.</p></div></div>
      <div class="grid2">
        <section class="card">
          <h3>Contact details</h3>
          <dl class="kv">
            <div><dt>Name</dt><dd>${CLIENT.first} ${CLIENT.last}</dd></div>
            <div><dt>Company</dt><dd>${CLIENT.company}</dd></div>
            <div><dt>Email</dt><dd>${CLIENT.email}</dd></div>
            <div><dt>Phone</dt><dd>${CLIENT.phone}</dd></div>
          </dl>
          <div class="acts">
            <button class="btn btn--line btn--sm" type="button" data-proto="Prototype: Río would receive your change request.">Request a change</button>
            <button class="btn btn--line btn--sm" type="button" data-proto="Prototype: your account and order history would be deleted after confirmation.">Delete my account</button>
          </div>
        </section>
        <aside class="stack">
          <div class="card">
            <h3>What we keep</h3>
            <ul class="ticks"><li><svg aria-hidden="true"><use href="#i-check"/></svg>Your name, company, email and phone</li><li><svg aria-hidden="true"><use href="#i-check"/></svg>Your orders, their status and dates</li><li><svg aria-hidden="true"><use href="#i-check"/></svg>Your quotes and their amounts</li></ul>
          </div>
          <div class="card">
            <h3>What we never store here</h3>
            <ul class="ticks no"><li><svg aria-hidden="true"><use href="#i-lock"/></svg>Passwords — you sign in with a one-time code</li><li><svg aria-hidden="true"><use href="#i-lock"/></svg>Card or bank details</li><li><svg aria-hidden="true"><use href="#i-lock"/></svg>ID numbers or home addresses</li><li><svg aria-hidden="true"><use href="#i-lock"/></svg>Your design files</li></ul>
          </div>
        </aside>
      </div>`);
    $$("[data-proto]").forEach(b => b.addEventListener("click", () => toast(b.dataset.proto)));
  }

  /* ----------------------------------------------------------------- router */
  function route() {
    const [, page = "", id] = location.hash.split("/");
    if (!signedIn) { if (page !== "signin") history.replaceState(null, "", "#/signin"); viewSignIn(); scrollTo(0, 0); return; }
    if (page === "signin" || !page) { history.replaceState(null, "", "#/overview"); viewOverview(); }
    else if (page === "orders" && id) viewOrder(decodeURIComponent(id));
    else if (page === "orders") viewOrders();
    else if (page === "quotes") viewQuotes();
    else if (page === "account") viewAccount();
    else viewOverview();
    scrollTo(0, 0);
  }
  addEventListener("hashchange", route);
  route();
})();
