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

  /* ------------------------------------------- hero: the logo, cast in metal */
  // v3: the logo as a solid, slightly turned 3D piece — a worn bronze bevel
  // around a recessed tray. Molten metal pours into the top of the R's stem and
  // fills the whole tray, cooling into the next metal each cycle.
  const POURS = [
    { name: "18K Yellow Gold", sw: "#E0A93B", b: [1.00, .90, .62], m: [.88, .64, .24], d: [.30, .16, .04] },
    { name: "18K Rose Gold",   sw: "#D98A6E", b: [1.00, .85, .77], m: [.84, .50, .40], d: [.30, .12, .08] },
    { name: "Platinum 950",    sw: "#B9C1CC", b: [.96, .98, 1.0], m: [.64, .68, .74], d: [.12, .13, .16] },
    { name: "Sterling Silver", sw: "#D8DCE2", b: [1.00, 1.0, 1.0], m: [.80, .82, .86], d: [.18, .19, .22] }
  ];
  (() => {
    const heroCopy = $(".hero__in"), cv = $("#cast"), stage = $(".hero__stage"), cap = $("#pour"), capName = $("#pourName"), capDot = $("#pourDot");
    if (!cv) return;
    const gl = cv.getContext("webgl", { antialias: false, depth: false, stencil: false, premultipliedAlpha: true, powerPreference: "low-power" });
    if (!gl) { stage.classList.add("is-fallback"); return; }

    // ---- masks from the official SVG paths (logo units: 448 × 490)
    const PAD = 56, LW = 448, LH = 490, TW = LW + PAD * 2, TH = LH + PAD * 2;
    const R_STEM = new Path2D("M0 0H56.378V486.26H0V0Z");
    const R_BOWL = new Path2D("M305.38 0.236285C380.045 4.49519 439.278 66.3887 439.278 142.119C439.278 203.245 400.688 255.351 346.542 275.416L447.5 462.769L421.575 476.108L395.65 489.446L285.507 284.239H220.813V486.26H164.436V0H305.38V0.236285ZM220.813 227.861H305.38V227.654C349.995 224.636 385.249 187.499 385.249 142.119C385.249 96.7397 349.995 59.6002 305.38 56.5821V56.378H220.813V227.861Z");
    const BAR = new Path2D("M291.286 486.26L63.4253 0H131.549L354.711 486.26H291.286Z");
    // The logo (R and bar as one piece) becomes a signed distance field at 2× resolution:
    // distance in logo units, positive inside. Edges stay crisp at any size and the
    // bevel, recess, side walls and shadow are all measured from it.
    const SS = 2, SW = TW * SS, SH = TH * SS;
    const c2 = document.createElement("canvas"); c2.width = SW; c2.height = SH;
    const x2 = c2.getContext("2d"); x2.scale(SS, SS); x2.translate(PAD, PAD); x2.fillStyle = "#fff";
    x2.fill(R_STEM); x2.fill(R_BOWL, "evenodd"); x2.fill(BAR);
    const alpha = x2.getImageData(0, 0, SW, SH).data;
    const INF = 1e20;
    const dt1 = (f, n, out) => { // Felzenszwalb–Huttenlocher 1D squared distance transform
      const v = new Int32Array(n), z = new Float64Array(n + 1);
      let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
      for (let q = 1; q < n; q++) {
        let sq = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
        while (sq <= z[k]) { k--; sq = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
        k++; v[k] = q; z[k] = sq; z[k + 1] = INF;
      }
      k = 0;
      for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; out[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
    };
    const edt = (on) => { // distance (px) from every pixel to the nearest "on" pixel
      const g = new Float64Array(SW * SH);
      for (let i = 0; i < g.length; i++) g[i] = on(i) ? 0 : INF;
      const col = new Float64Array(SH), cOut = new Float64Array(SH);
      for (let x = 0; x < SW; x++) {
        for (let y = 0; y < SH; y++) col[y] = g[y * SW + x];
        dt1(col, SH, cOut);
        for (let y = 0; y < SH; y++) g[y * SW + x] = cOut[y];
      }
      const row = new Float64Array(SW), rOut = new Float64Array(SW);
      for (let y = 0; y < SH; y++) {
        for (let x = 0; x < SW; x++) row[x] = g[y * SW + x];
        dt1(row, SW, rOut);
        for (let x = 0; x < SW; x++) g[y * SW + x] = Math.sqrt(rOut[x]);
      }
      return g;
    };
    const inside = (i) => alpha[i * 4 + 3] >= 128;
    const dOut = edt(inside), dIn = edt(i => !inside(i));
    const px = new Uint8Array(SW * SH * 4);
    for (let i = 0; i < SW * SH; i++) {
      const sd = (inside(i) ? dIn[i] - .5 : -(dOut[i] - .5)) / SS;   // logo units, + inside
      px[i * 4] = Math.max(0, Math.min(255, Math.round((.5 + sd / 80) * 255)));      // ±40 units, fine
      px[i * 4 + 1] = Math.max(0, Math.min(255, Math.round((.5 + sd / 320) * 255))); // ±160 units, far field
      px[i * 4 + 3] = 255;
    }
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, SW, SH, 0, gl.RGBA, gl.UNSIGNED_BYTE, px);
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(p => gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE));
    [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(p => gl.texParameteri(gl.TEXTURE_2D, p, gl.LINEAR));

    // bar geometry in texture uv (centre line, top → bottom)
    const G = {
      xTop: (PAD + 97.49) / TW, xBot: (PAD + 323.0) / TW,
      vTop: PAD / TH, vBot: (PAD + 486.26) / TH
    };

    const vs = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
    const fs = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uTex;uniform vec2 uRes,uTexel,uMo;uniform vec4 uRect;
uniform float uT,uLevel,uFade,uHead,uTail,uHot,uLit,uSrc;uniform vec3 uB,uM,uD;
const float TW=${TW}.,TH=${TH}.,LH=${LH}.;
const float XS=${(28.19 - LW / 2).toFixed(2)};       // centre of the R's stem, logo-centred units
const float DEPTH=60.,DIST=1500.,YAW=-.34,PITCH=.12;
// frame profile, measured as distance from the logo's edge (negative = outside)
const float RIM=15.,FLAT0=-10.,FLAT1=-4.5,RECESS=7.;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
vec3 molten(float x){x=clamp(x,0.,1.);
vec3 c=mix(vec3(.42,.02,.01),vec3(.88,.1,.02),smoothstep(0.,.3,x));
c=mix(c,vec3(1.,.38,.03),smoothstep(.25,.58,x));
c=mix(c,vec3(1.,.74,.18),smoothstep(.55,.85,x));
return mix(c,vec3(1.,.94,.68),smoothstep(.86,1.,x));}
vec4 tx(vec2 L){vec2 uv=(L+vec2(TW,TH)*.5)/vec2(TW,TH);
 if(uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.)return vec4(0.);return texture2D(uTex,uv);}
float sd(vec2 L){return (tx(L).r-.5)*80.;}           // signed distance to the logo, ±40 units
float sdFar(vec2 L){return (tx(L).g-.5)*320.;}       // same, ±160 units
// the inlet: a small funnel cut through the top of the frame, right above the stem,
// so the pour has a way into the logo
float inlet(vec2 L){
 float top=-LH*.5;
 float hw=9.5+max(top-L.y,0.)*.6;                    // widens towards the outside, like a sprue cup
 vec2 q=vec2(abs(L.x-XS)-hw,max(L.y-(top+2.),(top-RIM-6.)-L.y));
 return -(length(max(q,0.))+min(max(q.x,q.y),0.));}
float sdE(vec2 L){return max(sd(L),inlet(L));}       // the frame's inner edge, inlet included
// worn metal: soft mottling, fine scratches, rubbed patches — no grain
vec3 worn(vec2 L,vec3 dark,vec3 light,float lum){
 float mott=noise(L*.018)*.6+noise(L*.045+5.)*.4;
 float s1=smoothstep(.94,.99,noise(vec2(L.x*.8+L.y*.3,(L.y-L.x*.3)*.022)));
 float s2=smoothstep(.95,.99,noise(vec2(L.y*.7-L.x*.45,(L.x*.7+L.y*.45)*.018)+9.));
 vec3 c=mix(dark,light,clamp(mott*.35+lum*.8,0.,1.));
 c*=.88+.18*mott;
 c+=(s1+s2)*.12*light;
 c*=1.-smoothstep(.6,.85,noise(L*.028+2.))*.15;
 return c;}
void main(){
vec2 fc=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y);
float sc=uRect.z/TW;vec2 ctr=uRect.xy+uRect.zw*.5;
vec2 S=(fc-ctr)/sc;                                   // screen, logo units, y down
float cy=cos(YAW),sy=sin(YAW),cp=cos(PITCH),sp=sin(PITCH);
mat3 R=mat3(1.,0.,0.,0.,cp,sp,0.,-sp,cp)*mat3(cy,0.,-sy,0.,1.,0.,sy,0.,cy);
vec3 rd=normalize(vec3(S,DIST));
vec3 o=vec3(0.,0.,-DIST)*R,d=rd*R;                    // the ray in the logo's own space
float t0=-o.z/d.z,t1=(DEPTH-o.z)/d.z;
vec3 V=-rd;
// one key light, high on the left and in front; it barely moves, so light and shadow always agree
vec3 Lw=normalize(vec3(-.55+sin(uT*.15)*.05+uMo.x*.22,-.68+uMo.y*.12,-.62));
vec3 Lo=Lw*R;
float aaw=max(.3,.85/sc);                             // about one device pixel, in logo units
vec3 hot=molten(.48);vec3 tint=mix(uM,hot,uHot*.75);
vec3 bzD=vec3(.1,.068,.042),bzL=vec3(.7,.5,.32);     // worn bronze
vec2 F=(o+d*t0).xy;
float dF=sd(F);
float outer=smoothstep(-RIM-aaw,-RIM+aaw,dF);

// ---- the wall the piece is mounted on
vec2 Wp=(o+d*t1).xy;
float dW=sdFar(Wp);
vec3 nWall=R*vec3(0.,0.,-1.);
float wdiff=max(dot(nWall,Lw),0.);
float spot=1.-smoothstep(80.,1000.,length(Wp-vec2(-50.,-40.)));
float wm=noise(Wp*.005)*.6+noise(Wp*.014+4.)*.4;
vec3 col=mix(vec3(.026,.022,.022),vec3(.16,.108,.07),spot*(.45+.55*wdiff))*(.9+.2*wm);
if(dW>-RIM-170.){
 // soft cast shadow: walk from the wall towards the light through the piece's depth
 float occ=0.,run=DEPTH/max(-Lo.z,.25);
 for(int k=1;k<=16;k++){
  float f=float(k)/16.;
  float dq=sdFar(Wp+Lo.xy*run*f);
  occ+=smoothstep(-RIM-12.-f*24.,-RIM+12.,dq)*(1.-f*.4);   // penumbra stays inside the mask margin
 }
 occ=clamp(occ/9.,0.,1.);
 col*=1.-occ*.36;
 col*=1.-.22*(1.-smoothstep(0.,34.,-RIM-dW));         // contact shadow where it meets the wall
 col+=tint*(1.-smoothstep(0.,34.,-RIM-dW))*uLit*.07;  // warm bounce from the metal
}

// ---- side walls (the piece's thickness)
if(outer<.999&&dF>-RIM-140.){
 float tp=t0,th=-1.;
 for(int k=1;k<=24;k++){
  float t=mix(t0,t1,float(k)/24.);
  if(sd((o+d*t).xy)>-RIM){th=t;break;}
  tp=t;
 }
 if(th>0.){
  for(int k=0;k<5;k++){float tm=(tp+th)*.5;if(sd((o+d*tm).xy)>-RIM)th=tm;else tp=tm;}
  vec3 Hp=o+d*th;
  float e=.8;
  vec2 g=vec2(sd(Hp.xy+vec2(e,0.))-sd(Hp.xy-vec2(e,0.)),sd(Hp.xy+vec2(0.,e))-sd(Hp.xy-vec2(0.,e)));
  vec3 nW=R*normalize(vec3(-g,1e-4));
  float diff=max(dot(nW,Lw),0.);
  float spec=pow(max(dot(reflect(-Lw,nW),V),0.),24.);
  float zf=Hp.z/DEPTH;
  vec3 c=worn(Hp.xy+vec2(0.,Hp.z),bzD,bzL*.8,diff*.85+.06)+spec*bzL*.4;
  c*=mix(1.,.7,zf);
  col=mix(col,c,1.-outer);
 }
}
// ---- the face: a crisp bevelled frame around the logo, which is recessed as a tray
if(outer>0.){
 float e=.7;
 float dE=sdE(F);
 vec2 g=vec2(sd(F+vec2(e,0.))-sd(F-vec2(e,0.)),sd(F+vec2(0.,e))-sd(F-vec2(0.,e)))/(2.*e);
 vec2 gE=vec2(sdE(F+vec2(e,0.))-sdE(F-vec2(e,0.)),sdE(F+vec2(0.,e))-sdE(F-vec2(0.,e)))/(2.*e);
 float wA=(1.-smoothstep(FLAT0-.6,FLAT0+.6,dF))*(1.-smoothstep(-1.,1.,inlet(F)));  // outer 45° chamfer
 float wC=smoothstep(FLAT1-.6,FLAT1+.6,dE);          // inner chamfer down into the tray
 vec3 nW=R*normalize(vec3(-g*wA+gE*wC*1.15,-1.));
 float diff=max(dot(nW,Lw),0.);
 float spec=pow(max(dot(reflect(-Lw,nW),V),0.),40.);
 vec3 frame=worn(F,bzD,bzL,diff)+spec*vec3(1.,.88,.7)*.85;
 // crisp creases where the bevel planes meet
 float crease=(1.-smoothstep(0.,.9,abs(dF-FLAT0)))*(1.-smoothstep(-1.,1.,inlet(F)))+(1.-smoothstep(0.,.9,abs(dE-FLAT1)));
 frame+=bzL*crease*.12*(.4+diff);
 frame+=tint*wC*uLit*.35;
 // the tray: exactly the logo, sunk into the frame; the frame shades its upper-left inner edge
 float tray=smoothstep(-aaw,aaw,dE);
 float shade=1.-smoothstep(-1.,1.6,sdE(F+Lo.xy*(RECESS/max(-Lo.z,.25))));
 vec3 trayc=worn(F*1.3+7.,vec3(.028,.028,.034),vec3(.2,.19,.19),.25+wdiff*.2);
 // molten metal filling the tray from the bottom
 float surf=mix(LH*.5,-LH*.5,uLevel)+(noise(vec2(F.x*.06,uT*2.))-.5)*2.;
 float depth=(F.y-surf)/LH;
 float fill=smoothstep(-1.,1.,F.y-surf)*uFade;
 vec3 nL=normalize(vec3((noise(F*.014+vec2(0.,uT*.12))-.5)*.8,(noise(F*.019+vec2(uT*.1,9.))-.5)*.8,-1.));
 vec3 nLW=R*nL;
 float band=smoothstep(.15,.95,.5+.5*sin(nLW.y*5.+nLW.x*2.5+F.y*.014));
 float specL=pow(max(dot(reflect(-Lw,nLW),V),0.),24.);
 vec3 metal=mix(uD,uM,.5+.5*band);metal=mix(metal,uB,band*band*.6)+uB*specL*.85;
 float h=(1.-smoothstep(0.,.22,depth))*uHot;
 float hn=h*(.8+.3*noise(vec2(F.x*.03,F.y*.04-uT*1.4)));
 vec3 liquid=mix(metal,molten(.25+.75*hn)*1.15,smoothstep(.05,.75,h)*.9);
 liquid+=molten(.92)*(1.-smoothstep(0.,1.4,abs(F.y-surf)))*uHot*.8;
 trayc=mix(trayc,liquid,fill);
 trayc*=1.-shade*.5;
 vec3 face=mix(frame,trayc,tray);
 col=mix(col,face,outer);
}
vec3 pm=col;

// ---- the pour: falls straight down into the top of the stem, onto the rising metal
float surfL=mix(LH*.5,-LH*.5,uLevel);
vec3 Wi=R*vec3(XS,surfL,0.),Wt=R*vec3(XS,-LH*.5,0.);
vec2 Si=Wi.xy*DIST/(DIST+Wi.z),St=Wt.xy*DIST/(DIST+Wt.z);
float topY=-ctr.y/sc-10.;
float headY=mix(topY,Si.y,uHead),tailY=mix(topY,Si.y,max(uTail,0.));
float span=step(tailY,S.y)*step(S.y,headY)*step(uTail,.999)*step(.001,uHead);
float xc=S.y<St.y?St.x:mix(St.x,Si.x,clamp((S.y-St.y)/max(Si.y-St.y,1.),0.,1.));
float fallen=max(S.y-topY,0.),q=2.*sqrt(fallen);
float f=clamp(fallen/max(St.y-topY,1.),0.,1.);
float glug=.16*sin(uT*2.3)+.12*(noise(vec2(uT*1.4,.5))-.5);
float sway=(sin(q*.42-uT*2.6)*1.4+(noise(vec2(q*.35-uT*2.2,3.))-.5)*2.4)*sin(3.1416*min(f*1.1,1.));
float bulge=1.+.2*sin(q*1.25-uT*10.)+.16*(noise(vec2(q*.9-uT*7.,9.))-.5);
float hw=mix(6.,3.4,sqrt(f))*(1.+glug)*bulge;
float dd=abs(S.x-xc-sway);
float body=1.-smoothstep(hw-aaw,hw+aaw,dd);
float beads=smoothstep(-.15,.25,sin(q*2.6-uT*16.));
body*=mix(beads,1.,smoothstep(0.,40.,S.y-tailY));
float stream=body*span;
float core=1.-clamp(dd/hw,0.,1.);
float streak=.55+.45*noise(vec2(S.x*.25,S.y*.09-uT*16.));
vec3 scol=molten(.3+.38*core+.22*streak+.12*noise(vec2(S.y*.05-uT*9.,uT*2.)));
pm=mix(pm,scol*1.2,stream);
float bloom=exp(-pow(length(S-Si)/9.,2.))*span*step(Si.y-2.,headY);
pm+=molten(.95)*bloom*.9;
gl_FragColor=vec4(pm,1.);
}`;
    const sh = (t, src) => { const o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); return o; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(pr)); stage.classList.add("is-fallback"); return; }
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {};
    ["uTex", "uRes", "uTexel", "uMo", "uRect", "uT", "uLevel", "uFade", "uHead", "uTail", "uHot", "uLit", "uSrc", "uB", "uM", "uD"].forEach(k => U[k] = gl.getUniformLocation(pr, k));
    gl.uniform1i(U.uTex, 0); gl.uniform2f(U.uTexel, 1 / TW, 1 / TH);

    // ---- layout: where the logo sits inside the stage
    // most of the frame is cheap wall; the costly parts only run near the piece
    let budget = LOW ? 220000 : MOBILE ? 560000 : 1150000, scale = 1, rect = [0, 0, 1, 1];
    const layout = () => {
      const W = stage.clientWidth, H = stage.clientHeight;
      scale = Math.min(devicePixelRatio || 1, 2, Math.sqrt(budget / Math.max(1, W * H)));
      cv.width = Math.max(1, Math.round(W * scale)); cv.height = Math.max(1, Math.round(H * scale));
      gl.viewport(0, 0, cv.width, cv.height);
      // the stage now fills the hero (it is the wall); place the piece beside / above the copy
      const narrow = innerWidth <= 860;
      let lh, cxp, cyp;
      if (narrow) {
        const textTop = heroCopy ? heroCopy.getBoundingClientRect().top - stage.getBoundingClientRect().top : H * .55;
        const room = Math.max(160, textTop - 84 - 34);
        lh = Math.min(room * .9, W * .58 * LH / LW); cxp = W * .5; cyp = 84 + room / 2;
      } else {
        // keep clear air between the headline and the piece: measure where the copy ends
        const sl = stage.getBoundingClientRect().left;
        let textRight = W * .45;
        if (heroCopy) {
          const rg = document.createRange(); rg.selectNodeContents($(".hero__title", heroCopy));
          textRight = Math.max(rg.getBoundingClientRect().right, $(".hero__lead", heroCopy).getBoundingClientRect().right,
            $(".hero__cta", heroCopy).getBoundingClientRect().left + 360) - sl;
        }
        const gap = Math.max(96, W * .07), margin = Math.max(48, W * .05);
        const room = Math.max(220, W - margin - (textRight + gap));
        lh = Math.min(H * .5, room * .92 * LH / LW, 520);
        cxp = textRight + gap + room / 2; cyp = H * .52;
      }
      const s = lh / LH;
      rect = [(cxp - (PAD + LW / 2) * s) * scale, (cyp - (PAD + LH / 2) * s) * scale, TW * s * scale, TH * s * scale];
      if (cap) cap.style.top = `${Math.round(cyp + LH / 2 * s + (narrow ? 12 : 34))}px`;
      if (STILL) draw(performance.now());
    };

    // ---- the pour timeline (seconds within one cycle)
    const CYCLE = 8.6, STILL = reduce || LOW;
    const ease = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    const clamp01 = x => Math.max(0, Math.min(1, x));
    let idx = -1, start = performance.now(), mo = [0, 0], moT = [0, 0];
    function draw(now) {
      const T = STILL ? 0 : Math.max(0, now - start) / 1000, c = Math.floor(T / CYCLE), t = T - c * CYCLE;
      const i = STILL ? 0 : c % POURS.length, P = POURS[i];
      if (i !== idx) {
        idx = i;
        if (capName) { capName.textContent = P.name; capDot.style.background = P.sw; }
      }
      let level, head, tail, hot, fade;
      if (STILL) { level = 1; head = 0; tail = 2; hot = 0; fade = 1; }
      else {
        head = Math.pow(clamp01(t / .9), 2);                       // fall progress, 0 → 1
        level = ease(clamp01((t - .8) / 4.6));
        tail = t < 5.1 ? -1 : Math.pow(clamp01((t - 5.1) / .8), 2);
        hot = 1 - clamp01((t - 5.3) / 1.8);
        fade = 1 - clamp01((t - 7.6) / 1);
      }
      mo[0] += (moT[0] - mo[0]) * .05; mo[1] += (moT[1] - mo[1]) * .05;
      gl.uniform2f(U.uRes, cv.width, cv.height);
      gl.uniform4f(U.uRect, rect[0], rect[1], rect[2], rect[3]);
      gl.uniform1f(U.uT, STILL ? 2.2 : (T % 600) + 2);
      gl.uniform1f(U.uLevel, level); gl.uniform1f(U.uHead, head); gl.uniform1f(U.uTail, tail);
      gl.uniform1f(U.uHot, hot); gl.uniform1f(U.uFade, fade);
      gl.uniform1f(U.uLit, level * level * fade);
      gl.uniform3fv(U.uB, P.b); gl.uniform3fv(U.uM, P.m); gl.uniform3fv(U.uD, P.d);
      gl.uniform2f(U.uMo, mo[0], mo[1]);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    let raf = 0, last = 0, slow = 0, visible = true;
    const onTop = () => scrollY < innerHeight * 1.02;
    const loop = (now) => {
      const dt = now - last;
      if (dt >= FRAME_MS - 2) {
        if (last && dt > 55 && budget > 80000 && ++slow > 20) { budget *= .7; slow = 0; layout(); }
        last = now; draw(now);
      }
      raf = visible && onTop() && !STILL ? requestAnimationFrame(loop) : (last = 0, 0);
    };
    const wake = () => { if (visible && onTop() && !raf && !STILL) raf = requestAnimationFrame(loop); };
    onScrollFrame(wake);
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; wake(); }).observe(stage);
    let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(layout, 150); });
    if (!MOBILE) addEventListener("pointermove", e => { moT[0] = e.clientX / innerWidth - .5; moT[1] = e.clientY / innerHeight - .5; }, { passive: true });
    layout(); draw(performance.now()); wake();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layout(); draw(performance.now()); });
    stage.classList.add("is-ready");
  })();

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
  const heroIn = $(".hero__in"), heroStage = $(".hero__stage");
  const onCurtain = () => {
    if (reduce) return;
    const k = Math.min(1, Math.max(0, scrollY / innerHeight));
    heroIn.style.opacity = 1 - k * 1.15;
    heroIn.style.transform = `translateY(${-k * 70}px) scale(${1 - k * .04})`;
    heroStage.style.opacity = 1 - k * .9;
    heroStage.style.transform = `translateY(${-k * 40}px) scale(${1 - k * .05})`;
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
      // the jewel loops on its own clock: hold each form, then melt into the next
      // ~3.3 s holding each form, ~0.9 s melting into the next
      const n = FORMS.length, s = t / 4.2, i = Math.floor(s) % n, j = (i + 1) % n;
      const k = smooth(.785, 1, s - Math.floor(s)), A = FORMS[i], B = FORMS[j];
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
      const cur = k < .5 ? i : j;
      if (cur !== shown) {
        shown = cur;
        fig.textContent = "Fig. 0" + (cur + 1) + " — " + FORMS[cur].name;
        metal.textContent = FORMS[cur].metal;
        items.forEach((li, x) => li.classList.toggle("is-on", x === cur));
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
  // Sending is scheduled for the next delivery: for now the form only shows a note.
  const form = $("#form"), msg = $("#formMsg");
  form.addEventListener("submit", e => {
    e.preventDefault();
    msg.className = "form__msg";
    msg.textContent = `Online requests are coming soon. In the meantime, call us at ${C.phone || "our studio"} or write to ${C.email || "us"}.`;
  });
})();
