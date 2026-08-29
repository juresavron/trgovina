/**
 * STUDIO behaviour — the interactions the source theme has that CSS cannot do.
 *
 * WHY THERE IS JAVASCRIPT HERE AT ALL. Everything else in this theme is
 * zero-JS on purpose: LCP is the reason these shops can outrank the incumbents
 * (docs/SEO.md §4), and the source's own motion runtime is hundreds of
 * kilobytes that block first paint. These behaviours genuinely cannot be done
 * without script, and the owner asked for the source's behaviour exactly:
 *
 *   1. prev/next that STEP by one card. Anchors can only jump to a fixed
 *      target, so ours jumped to the end of the rail — visibly wrong.
 *   2. pagination that reflects scroll position.
 *   3. counters that count up when they scroll into view.
 *   4. the add-on total on a product page. Nine checkboxes cannot sum
 *      themselves in CSS, and a configurator that shows prices but never a
 *      total makes the customer do the arithmetic that decides the purchase.
 *   5. aria-current on the chrome nav. The server renders ONE nav string for
 *      every page, so only the browser can say which item is "here".
 *
 * The cost is kept honest: no framework, no build step, one inline module
 * under 4 KB. A module script is deferred by definition, so it never blocks
 * parsing or paint, and it runs after the document is interactive.
 *
 * PROGRESSIVE ENHANCEMENT IS THE CONTRACT. Every device works before this
 * file runs and must keep working if it never does: the rail is a real scroll
 * container with real anchor links, and each counter's final value is already
 * in the server-rendered HTML. This script upgrades; it never supplies.
 *
 * Nothing here changes layout, so it cannot cause CLS: dots are appended into
 * a slot the stylesheet already reserves, and counters only rewrite the text
 * of a box whose size is set by the type ramp.
 */
const SOURCE = `(function(){
"use strict";
var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)");
var soft = function(){ return reduce && reduce.matches ? "auto" : "smooth"; };

/* ---- sliders ------------------------------------------------------------
   The scroller is a real overflow-x container with scroll-snap, so all this
   adds is: step by exactly one item, know which item is showing, and disable
   a control that would do nothing. [data-st-thumb] is the PDP gallery's
   server-rendered pagination — one anchor per item, in item order — so it
   binds like a dot but is never created here: its href already works. */
function slider(root){
  var scroller = root.querySelector("[data-st-scroll]");
  var items = [].slice.call(root.querySelectorAll("[data-st-item]"));
  var prev = root.querySelector("[data-st-prev]");
  var next = root.querySelector("[data-st-next]");
  var dots = root.querySelector("[data-st-dots]");
  var thumbs = [].slice.call(root.querySelectorAll("[data-st-thumb]"));
  if (!scroller || items.length < 2) return;

  function step(){
    // Measure rather than assume: the card width is a clamp() and the gap is a
    // token, both of which change per breakpoint.
    var a = items[0].getBoundingClientRect();
    var b = items[1].getBoundingClientRect();
    return Math.round(b.left - a.left) || Math.round(a.width);
  }
  function atStart(){ return scroller.scrollLeft <= 1; }
  function atEnd(){ return scroller.scrollLeft >= scroller.scrollWidth - scroller.clientWidth - 1; }

  function go(dir){ scroller.scrollBy({ left: dir * step(), behavior: soft() }); }

  function bind(el, dir){
    if (!el) return;
    el.addEventListener("click", function(e){
      // The href stays a working fallback; only intercept once we are here.
      e.preventDefault();
      go(dir);
    });
  }
  bind(prev, -1);
  bind(next, 1);

  /* A thumb's anchor jump would also scroll the PAGE to the slide's top;
     intercepted, only the stage moves and the reader stays where they are. */
  thumbs.forEach(function(t, i){
    t.addEventListener("click", function(e){
      var item = items[i];
      if (!item) return;
      e.preventDefault();
      scroller.scrollTo({ left: item.offsetLeft - scroller.offsetLeft, behavior: soft() });
    });
  });

  var buttons = [];
  if (dots){
    items.forEach(function(item, i){
      var b = document.createElement("button");
      b.type = "button";
      b.className = "st-dot";
      b.setAttribute("aria-label", (i + 1) + ". od " + items.length);
      b.addEventListener("click", function(){
        scroller.scrollTo({ left: item.offsetLeft - scroller.offsetLeft, behavior: soft() });
      });
      dots.appendChild(b);
      buttons.push(b);
    });
  }

  function sync(){
    if (prev){ prev.setAttribute("aria-disabled", String(atStart())); }
    if (next){ next.setAttribute("aria-disabled", String(atEnd())); }
    if (!buttons.length && !thumbs.length) return;
    // Nearest item to the scroller's centre is the one on show.
    var mid = scroller.scrollLeft + scroller.clientWidth / 2;
    var best = 0, bestD = Infinity;
    items.forEach(function(item, i){
      var c = item.offsetLeft - scroller.offsetLeft + item.offsetWidth / 2;
      var d = Math.abs(c - mid);
      if (d < bestD){ bestD = d; best = i; }
    });
    var mark = function(el, on){
      if (on) el.setAttribute("aria-current", "true");
      else el.removeAttribute("aria-current");
    };
    buttons.forEach(function(b, i){ mark(b, i === best); });
    thumbs.forEach(function(t, i){ mark(t, i === best); });
  }

  var queued = false;
  scroller.addEventListener("scroll", function(){
    if (queued) return;
    queued = true;
    requestAnimationFrame(function(){ queued = false; sync(); });
  }, { passive: true });
  addEventListener("resize", sync, { passive: true });
  sync();
}

/* ---- counters -----------------------------------------------------------
   The final value is already in the HTML. This replays it from zero the first
   time it scrolls into view, then leaves it alone. */
function counter(el){
  var target = parseInt(el.getAttribute("data-st-count") || "", 10);
  if (!isFinite(target)) return;
  var fmt;
  try { fmt = new Intl.NumberFormat("sl-SI"); } catch (e) { fmt = null; }
  var render = function(n){ el.textContent = fmt ? fmt.format(n) : String(n); };

  var run = function(){
    if (reduce && reduce.matches) return;      // already correct in the DOM
    var t0 = 0, dur = 1100;
    var tick = function(t){
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      // easeOutCubic — fast to near-final, then settles.
      render(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
      else render(target);
    };
    requestAnimationFrame(tick);
  };

  if (!("IntersectionObserver" in window)) return;
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (!en.isIntersecting) return;
      io.disconnect();
      run();
    });
  }, { threshold: 0.6 });
  io.observe(el);
}

/* ---- add-on total -------------------------------------------------------
   Every [data-st-total] starts at its own data-st-base, which the server
   already rendered as text. This adds the ticked options to it. If the script
   never runs, the page still shows the shell's price and every option's price
   beside it — correct, just not summed.

   Formatted here rather than through Intl: CLDR gives Slovenian a minimum
   grouping of two digits, so Intl renders 6990 as "6990". The server groups
   by hand for the same reason (src/catalog/pricing.ts) and the two must
   agree, or the total changes shape the moment a box is ticked. */
function eur(cents){
  var whole = String(Math.round(cents / 100));
  var out = "";
  for (var i = 0; i < whole.length; i++){
    if (i > 0 && (whole.length - i) % 3 === 0) out += ".";
    out += whole.charAt(i);
  }
  return out + "\u00a0\u20ac";
}

function addons(root){
  var boxes = [].slice.call(root.querySelectorAll("[data-st-addon]"));
  var totals = [].slice.call(document.querySelectorAll("[data-st-total]"));
  var extras = [].slice.call(document.querySelectorAll("[data-st-extras]"));
  if (!boxes.length || !totals.length) return;

  function sync(){
    var extra = 0;
    boxes.forEach(function(b){
      if (!b.checked) return;
      /* data-price, not value: the box lives inside the enquiry form now and
         its value is the option's NAME, which is what has to reach the shop's
         inbox. The price moved to a data attribute the same day. */
      var v = parseInt(b.getAttribute("data-price") || "", 10);
      if (isFinite(v)) extra += v;
    });
    totals.forEach(function(t){
      var base = parseInt(t.getAttribute("data-st-base") || "", 10);
      if (!isFinite(base)) return;
      t.textContent = eur(base + extra);
    });
    /* The line that explains why the total matches the price above it when
       nothing is ticked. */
    extras.forEach(function(e){ e.textContent = eur(extra); });
  }

  boxes.forEach(function(b){ b.addEventListener("change", sync); });
  /* The summed lines ship hidden, because with no script they would state a
     WRONG figure rather than no figure — 0 EUR of equipment beside three
     ticked boxes. A script is here now, so they can be shown. */
  [].forEach.call(document.querySelectorAll("[data-st-sums]"), function(el){
    el.hidden = false;
  });
  /* A reload can restore ticked boxes without firing change, so the total
     would open disagreeing with the checkboxes above it. */
  sync();
  /* ⚠️ AND ON pageshow, because the one-shot above is TOO EARLY for the case
     it was written for. Chrome restores form state AFTER DOMContentLoaded and
     without firing change, so on a Back navigation the boxes came back ticked
     and the totals did not: driven twice on this build, three options ticked
     and a colour chosen, the page reopened saying "Izbrana oprema 0 EUR" and
     "Skupaj 7.890 EUR" under three visibly ticked boxes — 700 EUR out. One
     synthetic change event fixed it, so sync() was never the problem, only
     when it ran. pageshow fires after the restore, for bfcache and ordinary
     back navigations alike. */
  window.addEventListener("pageshow", sync);
}

/* ---- where-you-are ------------------------------------------------------
   aria-current="page" on the chrome nav item whose destination this page IS.
   Set here rather than on the server because the server cannot: the chrome
   renderer builds ONE nav string with no knowledge of the page it will sit
   on. The stylesheet turns the attribute into a resting underline; without
   script the marker is simply absent — an enhancement, never a destination.
   Exact match on pathname (the anchor's own parsed property, so the dev
   query never interferes): the worker 308s every path to lowercase-no-slash
   canonical form, so string equality is the whole comparison. */
function navCurrent(){
  [].forEach.call(document.querySelectorAll(".st-chrome-nav a"), function(a){
    if (a.pathname === location.pathname) a.setAttribute("aria-current", "page");
  });
}

/* ---- what the sticky bar says you chose ---------------------------------
   The bar carries the model, a spec line and the price. Now that the colours
   are a real choice, a bar that keeps naming the model's dimensions while the
   buyer has picked a finish is telling them the one thing they did not decide.

   APPENDED, NOT REPLACED, and only for the groups the renderer marks with
   data-st-bar — the colours. Replacing the line lost "5,80 × 2,28 m · 38 šob"
   and put 47 characters of nowrap into a row that already holds a name, a
   price and a button; the connection and the service level are two lines of
   the column the visitor is looking at, and the colour is the one choice they
   cannot see once they have scrolled past it.

   Names are read from the checked input's own value, which the renderer wrote
   from the model's own option list — nothing here reads the URL. */
function barConfig(){
  var bar = document.querySelector(".st-pdp-sum-cfg");
  var form = document.querySelector(".st-pdp-form");
  if (!bar || !form) return;
  var groups = [].slice.call(form.querySelectorAll("[data-st-bar]"));
  if (!groups.length) return;
  var spec = bar.textContent;

  function sync(){
    var parts = [];
    groups.forEach(function(g){
      var on = g.querySelector("input:checked");
      if (on && on.value) parts.push(on.value);
    });
    bar.textContent = parts.length ? spec + " · " + parts.join(" · ") : spec;
  }

  form.addEventListener("change", sync);
  sync();
  /* Same restore-after-load case as addons(): the bar's summary line went
     back to the bare spec string on a Back navigation while the chosen colour
     was still visibly ringed above it. */
  window.addEventListener("pageshow", sync);
}

/* ---- the full-size viewer ----------------------------------------------
   The gallery renders a <dialog> and a hidden chip per slide; this is what
   makes them work, and the chip stays hidden if this never runs — nothing
   that cannot work is ever offered.

   Bail out entirely without showModal: a <dialog> without it is a block that
   would sit open at the bottom of the page, which is worse than no viewer.

   The picture is set on open rather than served with the page: pointing the
   dialog's img at the first photograph would cost a second full-size download
   of the LCP element on every product page for a view most visitors never
   ask for. srcset comes across with it so the browser still picks a rung —
   sizes becomes 100vw, because that is what the dialog is. */
function lightbox(gallery){
  var dlg = gallery.querySelector("[data-st-lightbox]");
  if (!dlg || typeof dlg.showModal !== "function") return;
  var img = null;
  var opener = null;

  function open(photo){
    if (!photo) return;
    /* Built on the first open, not shipped with the page — see LIGHTBOX in
       pdp.ts. An empty <img> in the document is an element with no intrinsic
       size, which is exactly what the structural audit refuses. */
    if (!img) {
      img = document.createElement("img");
      img.className = "st-pdp-lb-img";
      img.decoding = "async";
      dlg.appendChild(img);
    }
    img.src = photo.currentSrc || photo.src;
    if (photo.srcset) { img.srcset = photo.srcset; img.sizes = "100vw"; }
    img.alt = photo.alt || "";
    dlg.showModal();
    /* ⚠️ A MODAL FREEZES WHAT IS BEHIND IT, and this one did not: showModal()
       blocks interaction with the page but not scrolling of it. Driven from
       scrollY 0, a wheel over the open dialog took the page to 700 and End
       took it to 5706 — so Escape returned focus correctly and left the
       reader in the footer, five thousand pixels from the photograph they had
       opened. */
    document.documentElement.style.overflow = "hidden";
  }

  [].forEach.call(gallery.querySelectorAll("[data-st-zoom]"), function(btn){
    btn.hidden = false;
    btn.addEventListener("click", function(){
      opener = btn;
      open(btn.parentElement.querySelector(".st-pdp-photo"));
    });
  });

  /* The photograph is the target everyone actually aims at. On touch this
     fires only for a tap that was not a drag, so it does not fight the
     stage's own paging. */
  [].forEach.call(gallery.querySelectorAll(".st-pdp-stage .st-pdp-photo"), function(photo){
    photo.addEventListener("click", function(){
      opener = photo.parentElement.querySelector("[data-st-zoom]");
      open(photo);
    });
  });

  var close = dlg.querySelector("[data-st-lb-close]");
  if (close) close.addEventListener("click", function(){ dlg.close(); });

  /* Clicking the ground around the picture closes it — the convention every
     viewer keeps. The dialog's own box IS the ground, so the test is whether
     the click landed on the element itself rather than on the picture. */
  dlg.addEventListener("click", function(ev){
    if (ev.target === dlg) dlg.close();
  });

  /* Escape closes natively; this is what returns focus to the control that
     opened it, which the platform does not do. */
  dlg.addEventListener("close", function(){
    /* Runs on Escape, on the X and on a backdrop click — all three route
       through close, which is why the scroll lock is released here. */
    document.documentElement.style.overflow = "";
    if (img) { img.removeAttribute("src"); img.removeAttribute("srcset"); }
    if (opener && document.contains(opener)) opener.focus();
    opener = null;
  });
}

/* ---- scroll reveal ------------------------------------------------------
   Cards and section heads rise 14px as they enter. The gate is the whole
   design: html[data-st-motion] is set HERE, only when the reader has not
   asked for reduced motion and the observer exists — the stylesheet's hidden
   state hangs off that attribute, so no-JS, old-engine and reduced-motion
   visitors read a page that was never hidden. Elements above the fold are
   revealed before first paint (isIntersecting on the initial callback), and
   each is unobserved once shown: a reveal is a greeting, not a loop. */
function reveal(){
  if (reduce && reduce.matches) return;
  if (!("IntersectionObserver" in window)) return;
  var els = document.querySelectorAll(
    ".st-card, .st-cat-card, .st-gd-card, .st-imp-tile, .st-stat, " +
    ".st-also-cell, .st-sec-h, .st-statement-h, .st-soc-card, .st-mem-in"
  );
  if (!els.length) return;
  document.documentElement.setAttribute("data-st-motion", "");
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (!en.isIntersecting) return;
      en.target.classList.add("is-in");
      io.unobserve(en.target);
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  [].forEach.call(els, function(el){
    /* The stagger is per PARENT, so the third card of a row waits on the
       first of ITS row, not on every card above it on the page. */
    var i = 0, sib = el;
    while ((sib = sib.previousElementSibling) && i < 3) {
      if (sib.classList.contains("st-rev")) i++;
    }
    el.style.setProperty("--rev-i", String(i));
    el.classList.add("st-rev");
    io.observe(el);
  });
}

/* The back-to-top disc: visible after roughly a screen of scroll, gone at
   the top. A passive listener flipping one class — the CSS owns the fade,
   and the kernel's reduced-motion strip removes that fade wholesale while
   the disc itself stays functional: appearing is not motion. */
function topDisc(){
  var t = document.querySelector(".st-top");
  if (!t) return;
  var on = false;
  function sync(){
    var want = (window.scrollY || document.documentElement.scrollTop) > 600;
    if (want !== on) { on = want; t.classList.toggle("is-on", want); }
  }
  addEventListener("scroll", sync, { passive: true });
  sync();
}

/* The print button exists only where script does: window.print() is the
   whole feature, so a no-JS visitor is not shown a control that cannot
   work. (They can still print the page — the print stylesheet does not
   care how the dialog was opened.) */
function printBtn(){
  [].forEach.call(document.querySelectorAll("[data-st-print]"), function(b){
    b.hidden = false;
    b.addEventListener("click", function(){ window.print(); });
  });
}

/* ---- the buy bar defers to the buy column's own CTA ----------------------
   At scroll 0 the bar covers the bottom of the gallery: measured on
   /bazen/veliki-230, the thumbnail strip was 0% visible on EVERY desktop
   viewport (1024x768, 1440x900, 1440x1080, 1920x900, 1920x1080), and 66-73px
   of the product photograph itself sat behind the black band at 1440x900 and
   1920. A visitor's first paint was one clipped photograph with no sign that
   nine more existed.

   The bar is also redundant exactly there: at 1440x900 the column's own
   "Povprašajte za ponudbo" is at y 532-584 while the bar repeats it at
   826-900, 242px apart. So the bar earns its place only once that button has
   gone, which is what this watches.

   ⚠️ THE NO-SCRIPT STATE IS THE BAR SHOWING, not hiding. The class is added
   here, so a visitor with no JavaScript, or an engine without
   IntersectionObserver, keeps today's page rather than losing the CTA
   entirely — the same trade every other progressive touch in this file makes.
   The height budget in pdp.ts is unchanged and still correct for the stuck
   state; this only fixes the position every visitor starts from. */
function barDefer(){
  var bar = document.querySelector(".st-pdp-bar");
  var cta = document.querySelector(".st-pdp-buyrow");
  if (!bar || !cta) return;
  if (!("IntersectionObserver" in window)) return;
  bar.classList.add("is-deferred");
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      bar.classList.toggle("is-deferred", en.isIntersecting);
    });
  }, { threshold: 0 });
  io.observe(cta);
}

function init(){
  navCurrent();
  barConfig();
  barDefer();
  reveal();
  topDisc();
  printBtn();
  [].forEach.call(document.querySelectorAll(".st-pdp-gallery"), lightbox);
  [].forEach.call(document.querySelectorAll("[data-st-slider]"), slider);
  [].forEach.call(document.querySelectorAll("[data-st-count]"), counter);
  [].forEach.call(document.querySelectorAll("[data-st-addons]"), addons);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
})();`;

/**
 * Comments are for the reader of this file, not for every visitor's browser.
 * The same argument as the stylesheet's: this is inlined into every studio
 * document, so its comments are bytes on the wire that explain nothing to the
 * person waiting for the page.
 *
 * Conservative on purpose. It strips block and line comments and collapses
 * runs of whitespace, and it is safe here only because this file contains no
 * regex literals and no string holding "//" — a general JavaScript minifier
 * this simple would be wrong. `studio.test.ts` parses the result, so a change
 * that breaks it fails the build rather than the storefront.
 */
export const STUDIO_JS = SOURCE
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^[ \t]*\/\/.*$/gm, "")
  .replace(/\n\s*\n/g, "\n")
  .replace(/^[ \t]+/gm, "")
  .trim();
