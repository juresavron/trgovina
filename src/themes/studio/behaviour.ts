/**
 * STUDIO behaviour — the interactions the source theme has that CSS cannot do.
 *
 * WHY THERE IS JAVASCRIPT HERE AT ALL. Everything else in this theme is
 * zero-JS on purpose: LCP is the reason these shops can outrank the incumbents
 * (docs/SEO.md §4), and the source's own motion runtime is hundreds of
 * kilobytes that block first paint. Three behaviours genuinely cannot be done
 * without script, and the owner asked for the source's behaviour exactly:
 *
 *   1. prev/next that STEP by one card. Anchors can only jump to a fixed
 *      target, so ours jumped to the end of the rail — visibly wrong.
 *   2. pagination that reflects scroll position.
 *   3. counters that count up when they scroll into view.
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
export const STUDIO_JS = `(function(){
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

function init(){
  [].forEach.call(document.querySelectorAll("[data-st-slider]"), slider);
  [].forEach.call(document.querySelectorAll("[data-st-count]"), counter);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
})();`;
