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
   a control that would do nothing. */
function slider(root){
  var scroller = root.querySelector("[data-st-scroll]");
  var items = [].slice.call(root.querySelectorAll("[data-st-item]"));
  var prev = root.querySelector("[data-st-prev]");
  var next = root.querySelector("[data-st-next]");
  var dots = root.querySelector("[data-st-dots]");
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
    if (!buttons.length) return;
    // Nearest item to the scroller's centre is the one on show.
    var mid = scroller.scrollLeft + scroller.clientWidth / 2;
    var best = 0, bestD = Infinity;
    items.forEach(function(item, i){
      var c = item.offsetLeft - scroller.offsetLeft + item.offsetWidth / 2;
      var d = Math.abs(c - mid);
      if (d < bestD){ bestD = d; best = i; }
    });
    buttons.forEach(function(b, i){
      if (i === best) b.setAttribute("aria-current", "true");
      else b.removeAttribute("aria-current");
    });
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
      var v = parseInt(b.value, 10);
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
  /* A reload can restore ticked boxes without firing change, so the total
     would open disagreeing with the checkboxes above it. */
  sync();
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

function init(){
  navCurrent();
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
