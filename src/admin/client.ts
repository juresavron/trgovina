/**
 * THE ADMIN'S TWO CLIENT SCRIPTS, and the only JavaScript this project
 * requires to do its job.
 *
 * Everything else the Worker renders works with scripting off; these do not,
 * and the reason is the image pipeline. A photograph straight off a phone is
 * a 6 MB JPEG in a colour space and an orientation the shop does not want,
 * and converting it in the browser is what keeps a 6 MB upload from becoming
 * a 6 MB object in the bucket. That cannot be done on the server without
 * first accepting the 6 MB.
 *
 * ⚠️ THEY ARE STRINGS, NOT MODULES, and they are inlined into a <script>
 * tag. So they are not typechecked, not linted, and not covered by the test
 * suite — which is exactly why they live in a file of their own rather than
 * at the bottom of a file of HTML builders. 1,049 lines of untypechecked
 * browser code hiding under the page that emits it is how it stays unread.
 *
 * Extracted from panel.ts unchanged, byte for byte; panel-snapshot.test.ts
 * holds the pages that inline them to the same hashes as before.
 */

/* THE SMART UPLOADER'S SCRIPT — the router in front of the single-slot
   pipeline. Shares its moves with UPLOAD_JS (decode, WebP-verified encode,
   centre-crop to the slot's frame, the guarded upscale) but not its DOM:
   that script is married to the one-form page, and marrying it to two would
   couple every future change to both. The duplication is ~60 lines of
   canvas code and is priced in. */
export const SMART_JS = `
/* MOUNTED THREE TIMES, not copied three times.
 *
 * This was one IIFE bound to the ids sm-f/sm-drop/sm-list. The colour
 * sorter needs the SAME machinery — probe, classify, upscale-guard, crop,
 * WebP, upload — pointed at a different catalogue, and the one thing that
 * must not happen is a second copy of a pipeline this careful. So the ids
 * take a prefix and the whole thing becomes mount(prefix, scope).
 *
 * The scope is what the server sorts against: "" is the site catalogue,
 * "barva"/"obloga" the two colour lists. It also decides whether the
 * original FILENAMES are sent, which is what settles most of a colour drop
 * without asking a model anything. */
(function(){
  "use strict";
function mount(p, scope){
  var file = document.getElementById(p + "-f");
  if (!file) return;
  var drop = document.getElementById(p + "-drop"), list = document.getElementById(p + "-list"),
      st = document.getElementById(p + "-st"), stwrap = document.getElementById(p + "-stwrap"),
      ai = document.getElementById(p + "-ai");
  var rows = [], lis = [], urls = [], busy = false;

  function say(text, kind){
    st.textContent = text;
    stwrap.className = "stline" + (kind ? " is-" + kind : "");
  }
  function mark(i, text, cls){
    if (!rows[i]) return;
    rows[i].textContent = text;
    rows[i].className = "rowst" + (cls ? " " + cls : "");
    lis.forEach(function(li, k){ li.className = k === i && !cls ? "is-live" : ""; });
  }

  function decode(f){
    if (window.createImageBitmap) return createImageBitmap(f);
    return new Promise(function(res, rej){
      var img = new Image(), url = URL.createObjectURL(f);
      img.onload = function(){ URL.revokeObjectURL(url); res(img); };
      img.onerror = function(){ URL.revokeObjectURL(url); rej(new Error("slike ni bilo mogoče prebrati")); };
      img.src = url;
    });
  }
  function isWebp(buf){
    var b = new Uint8Array(buf);
    return b.length > 12 &&
      b[0] === 82 && b[1] === 73 && b[2] === 70 && b[3] === 70 &&
      b[8] === 87 && b[9] === 69 && b[10] === 66 && b[11] === 80;
  }
  function toBlob(c, type, q){
    return new Promise(function(res, rej){
      c.toBlob(function(b){ b ? res(b) : rej(new Error("pretvorba ni uspela")); }, type, q);
    });
  }

  /* A small JPEG stand-in for the classifier. JPEG, not WebP: every engine
     encodes it, and the model reads either — the WebP guarantee matters for
     what is STORED, and probes are never stored. */
  function probe(f){
    return decode(f).then(function(bmp){
      var w = bmp.width || bmp.naturalWidth, h = bmp.height || bmp.naturalHeight;
      var pw = Math.min(w, 1024), ph = Math.max(1, Math.round(h * (pw / w)));
      var c = document.createElement("canvas");
      c.width = pw; c.height = ph;
      c.getContext("2d").drawImage(bmp, 0, 0, pw, ph);
      return toBlob(c, "image/jpeg", 0.85);
    });
  }

  /* FIND THE SWATCH IN THE PICTURE, so a row of tiles is a row of tiles.

     The owner's report, twice: "i want all to be centered and look the same
     and not like one a bit higher one a bit lower", then "one image cannot be
     different as here". Screen captures of a supplier chart put the sample in
     different places at different sizes; a centre crop keeps whatever happened
     to be in the middle, so tiles sat high, low and clipped.

     ⚠️ THIS RETURNS THE OBJECT, NOT A CROP, and the first version returned a
     crop — which is why the second report happened.

     That version picked a square around the sample and let drawSlot cut it
     out. A cut-out has to fit INSIDE the picture, so it was clamped twice:
     the side was capped at min(w, h), and the origin was pushed back inside
     the frame. A sample near an edge, or one whose box is wider than the
     picture is tall, therefore came out neither centred on itself nor at the
     same scale as its neighbours — which is exactly the row of three cabinet
     swatches that was reported, all three uploaded after that version
     shipped.

     Composing cannot be clamped. drawSlot paints the ground, then draws this
     box scaled so its LONGEST side is a fixed fraction of the tile, centred.
     Every swatch then has identical padding and identical centring by
     construction, whatever shape or position it arrived in.

     ⚠️ AND IT NEVER RETURNS NOTHING. Falling back to a plain centre crop was
     the other way one tile ended up unlike the rest: a sample that fills its
     frame, or one too close to its ground to find (Silver white marble is
     very nearly the white it is photographed against), took a different road
     and came out framed differently. Where the sample cannot be found the
     whole picture IS the object — same road, same padding, nothing lost. */
  function frameSwatch(bmp){
    var w = bmp.width || bmp.naturalWidth, h = bmp.height || bmp.naturalHeight;
    var whole = { x: 0, y: 0, w: w, h: h, bg: "#ffffff" };
    if (!(w > 8 && h > 8)) return whole;
    /* Analysed small: 240px is enough to find an edge, and keeps a
       twelve-megapixel screen capture from locking the tab. */
    var aw = Math.min(w, 240), ah = Math.max(1, Math.round(h * (aw / w)));
    var c = document.createElement("canvas");
    c.width = aw; c.height = ah;
    var ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bmp, 0, 0, aw, ah);
    var d;
    try { d = ctx.getImageData(0, 0, aw, ah).data; } catch (e) { return whole; }

    function at(x, y){ var i = (y * aw + x) * 4; return [d[i], d[i + 1], d[i + 2]]; }
    function far(p, q){
      var dr = p[0] - q[0], dg = p[1] - q[1], db = p[2] - q[2];
      return Math.sqrt(dr * dr + dg * dg + db * db);
    }
    /* THE GROUND, FROM THE WHOLE BORDER RING — used both to find the sample
       and to paint the tile around it, so the padding is the colour the
       photograph already had rather than an invented white.

       ⚠️ IT USED TO BE THE FOUR CORNERS, AND THAT IS WHY THE CAPTIONS SURVIVED.
       Four corners had to AGREE within 18, or the function gave up and
       returned the whole picture. A hot-tub corner photographed wide touches
       or nearly touches the left and right edges, so a bottom corner sample
       landed on the panel or on its shadow, the four disagreed, and every one
       of those images took the give-up path — caption included, and framed at
       whatever size it happened to arrive at. Which is exactly what shipped:
       three cabinet tiles at three different scales, two with the supplier's
       English shade name still printed across them.

       A ring is the right sample because an object can touch an edge without
       touching most of the border. The median is taken per channel and then
       the ring is asked how much of ITSELF agrees: a real ground carries most
       of its own border, and a photograph with no ground carries none. That
       is the honest version of the test the corners were trying to be. */
    var m = 2;
    var ring = [];
    for (var rx = m; rx < aw - m; rx += 2) { ring.push(at(rx, m)); ring.push(at(rx, ah - 1 - m)); }
    for (var ry = m; ry < ah - m; ry += 2) { ring.push(at(m, ry)); ring.push(at(aw - 1 - m, ry)); }
    if (ring.length < 8) return whole;
    var med = function (ch) {
      var v = ring.map(function (px) { return px[ch]; }).sort(function (a, b) { return a - b; });
      return v[Math.floor(v.length / 2)];
    };
    var bg = [med(0), med(1), med(2)];
    whole.bg = "rgb(" + bg[0] + "," + bg[1] + "," + bg[2] + ")";
    var agree = 0;
    for (var ri = 0; ri < ring.length; ri++) if (far(ring[ri], bg) <= 24) agree++;
    /* Less than half the border is the ground: there is no ground to separate
       the sample from, so the whole picture is the object. */
    if (agree < ring.length * 0.5) return whole;

    /* The mask: everything that is not the ground. */
    var mask = new Uint8Array(aw * ah), hits = 0;
    for (var y = 0; y < ah; y++) {
      for (var x = 0; x < aw; x++) {
        if (far(at(x, y), bg) <= 24) continue;
        mask[y * aw + x] = 1;
        hits++;
      }
    }
    if (hits === 0) return whole;

    /* ⚠️ THE LARGEST CONNECTED BLOB, NOT THE BOUNDING BOX OF EVERYTHING.
     *
     * The owner uploaded screen captures from a supplier page that carry the
     * shade name printed under the sample — "Black", "Pure White", "Grey" —
     * and a box drawn around all non-background pixels swallows the caption
     * with the panel. Three tiles then showed English words a Slovenian shop
     * does not use, in a picker whose whole job is to show a colour.
     *
     * A caption is a separate island of ink; the sample is one solid mass. So
     * this floods each island, keeps the biggest, and frames that. It costs
     * one pass over a 240px grid and it also disposes of a watermark, a stray
     * mark and a drop shadow that does not touch the sample.
     *
     * Text ON the sample survives, and has to: removing it would mean
     * repainting pixels, and a swatch that has been painted over is not a
     * photograph of the colour any more.
     *
     * The rail is a share of the ink: an island holding less than a quarter
     * of it is not obviously the subject, so the old whole-mask box stands.
     * Two chips photographed side by side land there, which is the right
     * answer — better to frame both loosely than to drop one. */
    var seen = new Uint8Array(aw * ah);
    var stack = new Int32Array(aw * ah);
    var bx0 = 0, by0 = 0, bx1 = -1, by1 = -1, best = 0;
    for (var i0 = 0; i0 < mask.length; i0++) {
      if (mask[i0] === 0 || seen[i0] === 1) continue;
      var top = 0, n = 0;
      var cx0 = aw, cy0 = ah, cx1 = -1, cy1 = -1;
      stack[top++] = i0; seen[i0] = 1;
      while (top > 0) {
        var p0 = stack[--top];
        var px = p0 % aw, py = (p0 - px) / aw;
        n++;
        if (px < cx0) cx0 = px;
        if (px > cx1) cx1 = px;
        if (py < cy0) cy0 = py;
        if (py > cy1) cy1 = py;
        /* Eight-connected: a caption's strokes touch diagonally, and letting
           them count as one island keeps the caption from being counted as
           several tiny ones that each clear no rail. */
        for (var dy = -1; dy <= 1; dy++) {
          for (var dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            var qx = px + dx, qy = py + dy;
            if (qx < 0 || qy < 0 || qx >= aw || qy >= ah) continue;
            var q = qy * aw + qx;
            if (mask[q] === 0 || seen[q] === 1) continue;
            seen[q] = 1; stack[top++] = q;
          }
        }
      }
      if (n > best) { best = n; bx0 = cx0; by0 = cy0; bx1 = cx1; by1 = cy1; }
    }

    var x0, y0, x1, y1;
    if (bx1 >= 0 && best >= hits * 0.25) {
      x0 = bx0; y0 = by0; x1 = bx1; y1 = by1;
      hits = best;
    } else {
      x0 = aw; y0 = ah; x1 = -1; y1 = -1;
      for (var yy = 0; yy < ah; yy++) {
        for (var xx = 0; xx < aw; xx++) {
          if (mask[yy * aw + xx] === 0) continue;
          if (xx < x0) x0 = xx;
          if (xx > x1) x1 = xx;
          if (yy < y0) y0 = yy;
          if (yy > y1) y1 = yy;
        }
      }
    }
    if (x1 < 0) return whole;
    var area = (x1 - x0 + 1) * (y1 - y0 + 1);
    /* ⚠️ DENSITY, NOT AREA, IS THE RAIL THAT WORKS. A 4% area floor was the
       first attempt and it refused a real case: a 120px sample inside a
       900x600 screen capture is 2.7% of the frame. What separates a sample
       from scattered noise is that a sample FILLS its own bounding box. */
    if (hits < area * 0.6) return whole;
    if (area < aw * ah * 0.005) return whole;

    var kk = w / aw;
    return {
      x: Math.round(x0 * kk),
      y: Math.round(y0 * kk),
      w: Math.max(1, Math.round((x1 - x0 + 1) * kk)),
      h: Math.max(1, Math.round((y1 - y0 + 1) * kk)),
      bg: whole.bg,
    };
  }

  /* Centre-crop to the slot's shape, capped at its width — the same cut the
     single-slot page makes, so the two roads store the same picture. */
  /* How much of the tile the sample fills, along its longest side. One
     constant, applied to every swatch, is the whole of "they must all look
     the same": the padding around a sample is then a property of the tile
     rather than of whatever the photographer framed. */
  var SWATCH_FILL = 0.84;

  function drawSlot(bmp, ar, maxW, exact, frame){
    var sw = bmp.width || bmp.naturalWidth, sh = bmp.height || bmp.naturalHeight;
    /* ⚠️ A SWATCH IS COMPOSED, NOT CUT OUT. Everything else on the site is a
       photograph somebody framed, and the right thing to do with it is take
       the middle. A swatch is a sample on a plain ground, and the right thing
       is to put it in the same place at the same size as every other sample —
       which a crop cannot promise, because a crop has to fit inside the
       picture and gets clamped when the sample sits near an edge. */
    if (frame && exact && maxW > 0) {
      var c0 = document.createElement("canvas");
      c0.width = maxW; c0.height = maxW;
      var g0 = c0.getContext("2d");
      g0.fillStyle = frame.bg || "#ffffff";
      g0.fillRect(0, 0, maxW, maxW);
      var k = (maxW * SWATCH_FILL) / Math.max(frame.w, frame.h);
      var dw = Math.max(1, Math.round(frame.w * k)), dh = Math.max(1, Math.round(frame.h * k));
      g0.imageSmoothingQuality = "high";
      g0.drawImage(bmp, frame.x, frame.y, frame.w, frame.h,
        Math.round((maxW - dw) / 2), Math.round((maxW - dh) / 2), dw, dh);
      return toBlob(c0, "image/webp", 0.9).then(function(blob){
        return blob.arrayBuffer().then(function(buf){
          if (!isWebp(buf)) throw new Error("ta brskalnik ne zna shraniti v WebP — poskusite v Chromu ali posodobite Safari");
          return { blob: blob, w: maxW, h: maxW };
        });
      });
    }
    var sx = 0, sy = 0, cw = sw, ch = sh;
    if (ar > 0) {
      if (sw / sh > ar) { cw = Math.round(sh * ar); sx = Math.round((sw - cw) / 2); }
      else { ch = Math.round(sw / ar); sy = Math.round((sh - ch) / 2); }
    }
    /* EXACT SLOTS ARE A SIZE, NOT A CEILING. The colour swatches paint as a
       row of identical squares beside their names, and a row of squares is
       only a picker if every square is the same square — so these store at
       maxW × maxW whatever came in, scaling UP where the sample was small.
       Safe precisely here: a flat colour sample has no detail to invent, so
       bilinear scaling gives the same colour at a different size. Every
       other slot keeps the ceiling (a photograph is served through a srcset
       and its stored width is nobody's business). */
    var w, h;
    if (exact && maxW > 0) {
      w = maxW; h = Math.max(1, Math.round(ar > 0 ? maxW / ar : maxW * (ch / cw)));
    } else {
      w = Math.min(cw, maxW || 2048); h = Math.max(1, Math.round(ch * (w / cw)));
    }
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    c.getContext("2d").drawImage(bmp, sx, sy, cw, ch, 0, 0, w, h);
    return toBlob(c, "image/webp", 0.82).then(function(blob){
      return blob.arrayBuffer().then(function(buf){
        if (!isWebp(buf)) throw new Error("ta brskalnik ne zna shraniti v WebP — poskusite v Chromu ali posodobite Safari");
        return { blob: blob, w: w, h: h };
      });
    });
  }

  /* The guarded upscale — only when the picture is too small for its slot,
     only when the box is ticked, and only kept when what came back is
     MEASURABLY larger. Same guard as the single pages: a redraw that added
     no pixels is all risk and no benefit. */
  function maybeEnhance(f, srcW, maxW, i){
    /* ⚠️ NO CHECKBOX MEANS NO UPSCALE — which is still how a zone opts out,
       and is no longer how the colour zones behave: the owner asked for the
       upscale there and finishDropCard now renders the box. The reasoning
       against it is written out at that call site.
       The guard is unchanged and is what keeps the answer sane: a redraw
       runs only when the source is NARROWER than the slot, and the result is
       kept only when it comes back measurably larger. A redraw that added no
       pixels is all risk and no benefit. */
    /* ⚠️ THE SIZE GUARD DOES NOT APPLY TO A COLOUR SWATCH, on the owner's
       instruction, asked for three times. Everywhere else a redraw runs only
       when the picture is too small for its slot, because a redraw of an
       already-big photograph is all risk and no benefit. The owner wants the
       samples regenerated regardless of size — "I want ai to regenerate the
       image and make it perfect. Like we did for other images" — and the box
       is ticked per upload, so it is a decision taken each time rather than
       a default nobody sees. What comes back is still only kept when it is
       measurably larger than what went in. */
    if (!ai || !ai.checked) return Promise.resolve({ f: f, up: false });
    if (!scope && !(srcW < maxW)) return Promise.resolve({ f: f, up: false });
    mark(i, "povečujem z AI …");
    var fd = new FormData();
    fd.append("file", f, f.name || "slika");
    fd.append("target", maxW >= 3000 ? "4K" : "2K");
    return fetch("/admin/enhance", { method: "POST", body: fd, credentials: "same-origin" })
      .then(function(res){
        if (res.status === 204 || !res.ok) return { f: f, up: false };
        return res.blob().then(function(b){
          if (!(b.size > 0)) return { f: f, up: false };
          return Promise.all([decode(f), decode(b)]).then(function(pair){
            var was = pair[0].width || pair[0].naturalWidth;
            var now = pair[1].width || pair[1].naturalWidth;
            return now > was ? { f: b, up: true } : { f: f, up: false };
          }, function(){ return { f: f, up: false }; });
        });
      })
      .catch(function(){ return { f: f, up: false }; });
  }

  function shown(fs){
    urls.forEach(URL.revokeObjectURL); urls = []; rows = []; lis = [];
    list.innerHTML = "";
    list.className = "picked on";
    fs.forEach(function(f){
      var u = URL.createObjectURL(f); urls.push(u);
      var li = document.createElement("li");
      var img = document.createElement("img"); img.src = u; img.alt = "";
      var box = document.createElement("div"); box.className = "grow";
      var nm = document.createElement("span"); nm.className = "nm"; nm.textContent = f.name;
      var stat = document.createElement("span"); stat.className = "rowst wait"; stat.textContent = "čaka";
      box.appendChild(nm); box.appendChild(stat);
      li.appendChild(img); li.appendChild(box);
      list.appendChild(li);
      rows.push(stat); lis.push(li);
    });
  }

  /* The card on this very page that previews the slot — refreshed after an
     upload so the operator sees the change without reloading. The key never
     changes, so without the bust the browser shows the picture it replaced. */
  function refreshCard(stem){
    var a = document.querySelector('a[href="/admin/site/' + stem + '"] img');
    if (a) a.src = "/media/site/" + stem + ".webp?v=" + Date.now();
  }

  function run(fs){
    if (busy || !fs.length) return;
    busy = true;
    shown(fs);
    say("AI razvršča " + fs.length + " slik …", "");

    /* Probes first, all of them, then ONE sorting request: the assignment is
       a property of the batch — see the site-sort route.

       ⚠️ A FAILED PROBE MUST NOT KILL THE BATCH. The first version chained
       these with no per-file catch, so one PDF in the drag — or an AVIF on
       an engine that cannot decode it — rejected the whole chain before
       anything was classified, and nine good photographs died with it. The
       failed file keeps its SLOT in the array as a 1×1 stand-in (the server
       answers by position, so the indexes must stay aligned), is marked
       dead here, and is skipped when the answers come back. */
    var probes = [];
    var deadRows = {};
    function standIn(){
      var c = document.createElement("canvas");
      c.width = 1; c.height = 1;
      return toBlob(c, "image/jpeg", 0.5);
    }
    var chain = Promise.resolve();
    fs.forEach(function(f, i){
      chain = chain.then(function(){
        mark(i, "pripravljam …");
        return probe(f).then(function(b){ probes[i] = b; }, function(err){
          deadRows[i] = true;
          mark(i, err && err.message ? err.message : "slike ni bilo mogoče prebrati", "bad");
          return standIn().then(function(b){ probes[i] = b; });
        });
      });
    });

    chain.then(function(){
      var fd = new FormData();
      probes.forEach(function(b, i){ fd.append("files", b, "p" + i + ".jpg"); });
      /* Positional and parallel to files[]: the probes are downsampled JPEGs
         named p0…pN, so the real names have to travel on their own. Sent for
         every scope; only the colour catalogues read them. */
      fs.forEach(function(f){ fd.append("names", f.name || ""); });
      if (scope) fd.append("scope", scope);
      fs.forEach(function(_, i){ mark(i, "AI razvršča …"); });
      return fetch("/admin/site-sort", { method: "POST", body: fd, credentials: "same-origin" });
    }).then(function(res){
      if (!res.ok) throw new Error("razvrščanje ni uspelo (" + res.status + ")");
      return res.json();
    }).then(function(data){
      var items = data.items || [];
      var done = 0, up = 0, skipped = 0;
      var seq = Promise.resolve();
      items.forEach(function(it){
        seq = seq.then(function(){
          var i = it.i, f = fs[i];
          if (deadRows[i]) { skipped++; return; }
          if (!it.stem) {
            skipped++;
            mark(i, "ni razporejena — " + (it.reason || "brez razloga"), "bad");
            return;
          }
          var ar = 0;
          if (it.ar) {
            var p = it.ar.split(":");
            ar = parseFloat(p[0]) / parseFloat(p[1]);
          }
          var wasUp = false;
          mark(i, it.label + " · pripravljam …");
          return decode(f).then(function(bmp){
            var srcW = bmp.width || bmp.naturalWidth;
            return maybeEnhance(f, srcW, it.max || 2048, i);
          }).then(function(e){
            wasUp = e.up;
            if (e.up) up++;
            return decode(e.f);
          }).then(function(bmp2){
            mark(i, it.label + " · obrezujem …");
            /* ONLY THE COLOUR CATALOGUE IS FRAMED. A hero, a gallery
               shot or a guide photograph is composed by whoever took it,
               and hunting for a subject in one would throw away the
               composition the photographer chose. A swatch has no
               composition: it is one object on a plain ground, and the only
               right answer is that every one of them sits in the same place
               at the same size. */
            return drawSlot(bmp2, ar, it.max || 2048, it.exact,
              scope ? frameSwatch(bmp2) : null);
          }).then(function(r){
            mark(i, it.label + " · nalagam …");
            var fd = new FormData();
            fd.append("file", r.blob, it.stem + ".webp");
            fd.append("bulk", "1");
            return fetch("/admin/site/" + it.stem + "/upload", {
              method: "POST", body: fd, credentials: "same-origin",
            }).then(function(res){
              if (!(res.status === 204 || res.ok)) throw new Error("shramba ni sprejela slike");
              done++;
              refreshCard(it.stem);
              mark(i, it.label + " · naloženo · " + r.w + " × " + r.h + " px" +
                (wasUp ? " · AI povečava" : ""), "ok");
            });
          }).catch(function(err){
            skipped++;
            mark(i, it.label + " · " + (err && err.message ? err.message : "ni uspelo"), "bad");
          });
        });
      });
      return seq.then(function(){
        /* A COLOUR DROP ENDS BY RELOADING THE LIST IT JUST CHANGED.
           The uploaded set IS the shop's colour list — nothing else decides
           what a customer can pick — so leaving a stale list under a success
           message would be the panel disagreeing with itself on the one page
           whose whole job is to say which colours exist. Only on a clean run:
           if anything failed, the per-file log is the more useful thing on
           screen and a reload would throw it away. */
        if (scope && done === fs.length) {
          say("Naloženih " + done + ". Osvežujem seznam …", "ok");
          setTimeout(function(){ location.href = "/admin/barve?m=fin-uploaded"; }, 900);
          return;
        }
        say((scope ? "Naloženih " : "Razporejenih ") + done + " od " + fs.length +
          (up ? " · " + up + " povečanih z AI" : "") +
          (skipped ? " · " + skipped + (scope ? " ni uspelo" : " brez mesta") : "") +
          (scope
            ? ". Na strani modela bodo ob naslednji posodobitvi strani."
            : ". Slike so na strani v nekaj minutah."), done ? "ok" : "bad");
      });
    }).catch(function(err){
      say(err && err.message ? err.message : "Ni uspelo.", "bad");
    }).then(function(){ busy = false; });
  }

  file.addEventListener("change", function(){
    run(file.files ? Array.prototype.slice.call(file.files) : []);
  });
  ["dragover", "dragenter"].forEach(function(ev){
    drop.addEventListener(ev, function(e){ e.preventDefault(); drop.classList.add("is-over"); });
  });
  ["dragleave", "drop"].forEach(function(ev){
    drop.addEventListener(ev, function(e){ e.preventDefault(); drop.classList.remove("is-over"); });
  });
  drop.addEventListener("drop", function(e){
    var fs = e.dataTransfer && e.dataTransfer.files
      ? Array.prototype.slice.call(e.dataTransfer.files) : [];
    if (fs.length) run(fs);
  });
}

  mount("sm", "");
  mount("bv", "barva");
  mount("ob", "obloga");
})();
`;

export const UPLOAD_JS = `
(function(){
  "use strict";
  var form = document.getElementById("up");
  if (!form) return;
  /* SITE MODE: one picture, one fixed key, no width ladder. A site image is
     rendered decoratively by the storefront, so it has no description to
     collect and no srcset to describe. */
  var siteMode = form.getAttribute("data-mode") === "site";
  var file = document.getElementById("f"), go = document.getElementById("go"),
      st = document.getElementById("st"), pr = document.getElementById("pr"),
      drop = document.getElementById("drop"), prev = document.getElementById("prev"),
      fmeta = document.getElementById("fmeta"), hint = fmeta.textContent,
      picked = document.getElementById("picked"),
      gowrap = document.getElementById("gowrap");

  /* The button is the no-script path's whole upload. Script is running, so it
     is a fallback nobody needs: the files go the moment they are chosen. */
  if (gowrap) gowrap.style.display = "none";

  var stwrap = document.getElementById("stwrap");

  var urls = [];
  var rows = [];
  var lis = [];
  var busy = false;
  var total = 0;
  /* WHERE THE RUN RESUMES, and it did not used to exist.

     A failure on the fourth of ten stopped the loop, put the Naloži button
     back and said "prvih 3 je naloženih". Pressing that button restarted at
     zero — so the fix for a failed upload was to upload the three that had
     already worked a second time, and the catalogue grew three duplicates
     nobody asked for. The cursor survives the failure; choosing a new set is
     what resets it. */
  var cursor = 0;

  function slike(n){
    if (n === 0) return "brez fotografij";
    /* Last two digits, matched exactly — the same rule photoCount() states
       server-side: compounds (22, 94) take the genitive plural. */
    var t = n % 100;
    if (t === 1) return n + " fotografija";
    if (t === 2) return n + " fotografiji";
    if (t === 3 || t === 4) return n + " fotografije";
    return n + " fotografij";
  }

  /* The one line that speaks for the whole run. It is a role="status" region,
     so setting it is also how a screen-reader user is told anything at all. */
  function say(text, kind){
    st.textContent = text;
    if (stwrap) stwrap.className = "stline" + (kind ? " is-" + kind : "");
  }

  /* THE BAR MOVES WHILE ONE PICTURE IS BEING WORKED ON, not only between them.
     It advanced once per completed file, so a single 6 MB photograph — decode,
     a round trip to the upscaler, four canvas encodes, an upload — sat at 0%
     for the whole of it and then jumped to 100. A set of one, which is the
     common case for a replacement, had a progress bar that never progressed.
     The fractions are honest orders of magnitude, not a fake animation. */
  function step(frac){
    if (!total) { pr.value = 0; return; }
    pr.value = Math.round(((cursor + frac) / total) * 100);
  }

  /* "Slika 3 od 10 · nalagam …" — position and phase in one line, because the
     per-file rows can be scrolled past and this one cannot. */
  function phase(i, text, frac){
    mark(i, text + " …");
    say("Slika " + (i + 1) + " od " + total + " · " + text + " …", "");
    step(frac);
  }

  /* Show what was chosen. Thumbnails and a status line each — picking the
     wrong photograph and finding out only after it is uploaded is this
     panel's most annoying failure, and it is the ONLY thing this list is
     for now. There is nothing here to fill in. */
  function shown(){
    urls.forEach(URL.revokeObjectURL); urls = [];
    rows = []; lis = [];
    cursor = 0;
    picked.innerHTML = "";
    prev.className = ""; prev.removeAttribute("src");
    say("", "");
    pr.hidden = true; pr.value = 0;
    if (go) go.textContent = "Naloži";
    var fs = file.files ? Array.prototype.slice.call(file.files) : [];
    if (!fs.length) { fmeta.textContent = hint; picked.className = "picked"; return; }

    var kb = 0;
    fs.forEach(function(f){ kb += f.size; });
    fmeta.textContent = (fs.length === 1
      ? fs[0].name
      : slike(fs.length)) + " · " + Math.round(kb / 1024) + " kB";

    /* ⚠️ THE BIG PREVIEW IS SITE MODE ONLY. On a model page it drew the same
       picture twice — a 320px preview above the picker and a 72px thumbnail
       in the list below it — and shoved the file input down the card as it
       appeared. There the list IS the preview, and it shows all of them. */
    if (siteMode && fs.length === 1) {
      var u = URL.createObjectURL(fs[0]);
      urls.push(u); prev.src = u; prev.className = "on";
    }
    if (siteMode) { picked.className = "picked"; return; }

    picked.className = "picked on";
    fs.forEach(function(f){
      var u = URL.createObjectURL(f); urls.push(u);
      var li = document.createElement("li");
      var img = document.createElement("img");
      img.src = u; img.alt = "";
      var box = document.createElement("div"); box.className = "grow";
      var nm = document.createElement("span"); nm.className = "nm"; nm.textContent = f.name;
      var stat = document.createElement("span"); stat.className = "rowst wait";
      stat.textContent = "čaka";
      box.appendChild(nm); box.appendChild(stat);
      li.appendChild(img); li.appendChild(box);
      picked.appendChild(li);
      rows.push(stat); lis.push(li);
    });
    return fs;
  }

  /* One row's state. The run is strictly sequential — one picture is converted
     or uploaded at a time, never two — so the row that is moving is marked as
     such, and the nine that are waiting are not shouting the same ink at it. */
  function mark(i, text, cls){
    if (!rows[i]) return;
    rows[i].textContent = text;
    rows[i].className = "rowst" + (cls ? " " + cls : "");
    lis.forEach(function(li, k){
      li.className = k === i && !cls ? "is-live" : "";
    });
  }

  /* Per file, so a set of ten shows which of them the upscaler took and which
     it did not — one upload answers "is this working" for good. */
  function markDone(i, wasUpscaled){
    mark(i, wasUpscaled ? "naloženo · 2K" : "naloženo", "ok");
  }

  /* ---- conversion ---------------------------------------------------- */

  /* The widths the storefront's slots actually paint, doubled for 2x screens.
     Never upscale: a rung wider than the source is the same pixels in a bigger
     file, and its w descriptor would then be a lie the browser acts on. */
  var LADDER = [480, 800, 1200, 1600];
  /* Nothing is ever painted wider than this, and a picture larger than it is
     bytes nobody sees. It is also the ceiling the enhancer works to. */
  var MAX_W = 2048;

  /* DECODE. createImageBitmap is the direct route and Safari only got it in
     15 — before that this whole block bailed out, the form did an ordinary
     POST, and the server refused the JPEG with a message telling the operator
     to convert it themselves. An <img> and an object URL decode anywhere. */
  function decode(f){
    if (window.createImageBitmap) return createImageBitmap(f);
    return new Promise(function(res, rej){
      var img = new Image(), url = URL.createObjectURL(f);
      img.onload = function(){ URL.revokeObjectURL(url); res(img); };
      img.onerror = function(){ URL.revokeObjectURL(url); rej(new Error("slike ni bilo mogoče prebrati")); };
      img.src = url;
    });
  }

  /* Is this really WebP? RIFF at 0 and WEBP at 8 — the same check the server
     makes on the bytes it receives.

     ⚠️ toBlob SILENTLY FALLS BACK TO PNG when the browser cannot encode the
     type you asked for, and several Safari versions cannot encode WebP. The
     old code trusted it, labelled the PNG "480.webp", and let the server
     discover the lie — so a working upload path produced an error message
     about the operator's own file. Verified here, the browser's limitation is
     named where it happens. */
  function isWebp(buf){
    var b = new Uint8Array(buf);
    return b.length > 12 &&
      b[0] === 82 && b[1] === 73 && b[2] === 70 && b[3] === 70 &&
      b[8] === 87 && b[9] === 69 && b[10] === 66 && b[11] === 80;
  }

  function draw(bmp, w){
    var srcW = bmp.width || bmp.naturalWidth, srcH = bmp.height || bmp.naturalHeight;
    var h = Math.round(srcH * (w / srcW));
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    c.getContext("2d").drawImage(bmp, 0, 0, w, h);
    return encode(c);
  }

  /* THE SLOT'S OWN SHAPE, CUT FROM THE MIDDLE, then scaled to the slot's cap.
     This is what "correct dimensions" means here: the hero frame is 16:9 and
     the category cards are square, so a wide garden photograph dropped into a
     square card was being centre-cropped by the BROWSER, on the visitor's
     screen, out of a file that carried the whole width. Doing it here instead
     means the operator sees in the panel exactly what the site will show, and
     the bytes for the cropped-away sides are never stored or downloaded.

     ⚠️ THE CAP IS A CEILING, NOT A TARGET. Math.min never inflates: a 1600 px
     upload into a 3840 px slot is stored at 1600 and the status line says so.
     Scaling it up in a canvas would add no detail, only bytes, and would make
     the largest contentful paint on the page worse in order to fix a number.

     No crop at all when the frame does not crop — the small story frame is
     object-fit: contain and shows the picture whole. */
  function drawSlot(bmp, ar, maxW, exact){
    var sw = bmp.width || bmp.naturalWidth, sh = bmp.height || bmp.naturalHeight;
    var sx = 0, sy = 0, cw = sw, ch = sh;
    if (ar > 0) {
      if (sw / sh > ar) { cw = Math.round(sh * ar); sx = Math.round((sw - cw) / 2); }
      else { ch = Math.round(sw / ar); sy = Math.round((sh - ch) / 2); }
    }
    /* Same rule as the batch uploader's copy: an exact slot stores AT maxW,
       not under it, so one colour replaced by hand still matches the fifteen
       sorted by the batch. Two copies of this arithmetic is one too many and
       the reason they must not drift. */
    var w, h;
    if (exact && maxW > 0) {
      w = maxW; h = Math.max(1, Math.round(ar > 0 ? maxW / ar : maxW * (ch / cw)));
    } else {
      w = Math.min(cw, maxW); h = Math.max(1, Math.round(ch * (w / cw)));
    }
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    c.getContext("2d").drawImage(bmp, sx, sy, cw, ch, 0, 0, w, h);
    return encode(c).then(function(blob){
      return { blob: blob, w: w, h: h, srcW: sw, srcH: sh };
    });
  }

  function encode(c){
    return new Promise(function(res, rej){
      c.toBlob(function(blob){
        if (!blob) { rej(new Error("pretvorba ni uspela")); return; }
        blob.arrayBuffer().then(function(buf){
          if (!isWebp(buf)) {
            rej(new Error("ta brskalnik ne zna shraniti v WebP — poskusite v " +
              "Chromu ali posodobite Safari"));
            return;
          }
          res(blob);
        }, function(){ rej(new Error("pretvorba ni uspela")); });
      }, "image/webp", 0.82);
    });
  }

  /* The slot's shape as a number, and its ceiling. Absent attributes mean
     "do not crop" and the old 2048 default, so a form that predates this
     behaves exactly as it did. */
  var slotAr = (function(){
    var a = (form.getAttribute("data-ar") || "").split(":");
    var w = parseFloat(a[0]), h = parseFloat(a[1]);
    return (isFinite(w) && isFinite(h) && h > 0) ? w / h : 0;
  })();
  var slotMax = parseInt(form.getAttribute("data-max") || "", 10) || MAX_W;
  var slotExact = form.getAttribute("data-exact") === "1";

  /* ⚠️ READ AT SUBMIT TIME, NOT AT LOAD. The product forms carry
     data-enhance="on" and always upscale; a site slot offers a checkbox the
     operator ticks, and a boolean captured when the script ran would be the
     state of a box nobody had touched yet. */
  var aiBox = document.getElementById("ai");
  function wantsEnhance(){
    return form.getAttribute("data-enhance") === "on" || (aiBox && aiBox.checked);
  }

  /* Ask the Worker to redraw the picture at 2K, or hand back what we had.
     A 204 means the upscaler produced nothing usable and the ORIGINAL should
     go through — an enhancement must never cost an upload, so every failure
     here resolves rather than rejects. */
  /* HOW MANY PICTURES THE UPSCALER ACTUALLY TOUCHED.
     The panel used to promise "Slike se samodejno izboljšajo na 2K" and then
     say nothing either way. If the key is missing, or the model name has
     been retired, every call answers 204, the original uploads, and the
     operator has no way of finding out — which is exactly the state this
     shop was in. Counted here and reported when the run finishes. */
  var upscaled = 0;
  var hit = [];
  /* What the site slot actually stored — set by drawSlot, read once when the
     run finishes. Only ever one picture in site mode, so one variable.
     shotWarn is separate rather than sniffed out of the sentence: the first
     version tested the message for a word, and the moment a second wording
     was added ("prenizka") the check stopped matching and the warning went
     silent. A flag cannot drift from the thing it describes. */
  var shot = "";
  var shotWarn = false;

  /* Ask a picture to come back bigger, keeping the original unless it does.
     A site slot asks for 4K, a product for 2K: the hero is the full viewport
     and the largest contentful paint on the page, the product frames are a
     column wide. */
  function enhanced(f, i){
    if (!wantsEnhance()) return Promise.resolve(f);
    phase(i, "izboljšujem", .1);
    var fd = new FormData();
    fd.append("file", f, f.name);
    fd.append("target", siteMode ? "4K" : "2K");
    return fetch("/admin/enhance", { method: "POST", body: fd, credentials: "same-origin" })
      .then(function(res){
        if (res.status === 204 || !res.ok) return f;
        return res.blob().then(function(b){
          if (!(b.size > 0)) return f;
          /* ⚠️ MEASURE WHAT CAME BACK. imageSize is a REQUEST, and which sizes
             a model honours moves with the model — so "we asked for 4K" is not
             evidence that anything got bigger. A redraw that is no larger than
             what it was given is all of this path's risk (the hero came back
             as the same tub in a different garden) and none of its benefit, so
             it is thrown away and the operator's own file goes through.

             Both are decoded because neither carries its size until it is. If
             either fails to decode, keep the original — the safe direction. */
          return Promise.all([decode(f), decode(b)]).then(function(pair){
            var was = pair[0].width || pair[0].naturalWidth;
            var now = pair[1].width || pair[1].naturalWidth;
            if (!(now > was)) return f;
            upscaled++; hit[i] = true;
            return b;
          }, function(){ return f; });
        });
      })
      .catch(function(){ return f; });
  }

  /* One file, one request. The server handler takes exactly one photograph
     and its width rungs, so a set is a loop here rather than a new shape
     there — and a failure on the fourth of five leaves the first three
     uploaded and says which one stopped, instead of losing the lot.

     NO DESCRIPTION IS SENT. The server writes it, from the picture it has
     just been handed: see describe.ts, and standInAlt for what happens when
     there is no key or the model gives nothing back. */
  /* The run's total is a closure variable, not an argument: this signature
     shadowed it, and the two were always the same number anyway. */
  function upload(f0, i){
    return enhanced(f0, i).then(function(f){
      phase(i, "pretvarjam", .4);
      return decode(f);
    }).then(function(bmp){
      var srcW = bmp.width || bmp.naturalWidth;
      if (siteMode) {
        return drawSlot(bmp, slotAr, slotMax, slotExact).then(function(r){
          /* WHAT WAS ACTUALLY STORED, AND WHY IT IS NOT BIGGER. An operator
             who drops a 1600 px picture into the 3840 px hero slot has no way
             of knowing it went in soft unless somebody says so, and the honest
             fix is a bigger file rather than a canvas that pretends.

             ⚠️ THE TWO REASONS ARE DIFFERENT AND THE MESSAGE HAS TO SAY WHICH.
             A first version said "we recommend 3840 px wide" whenever the
             result was under the cap — which told somebody who had just
             uploaded a 6000 × 2000 photograph that their picture was too
             narrow. It was not: it was too SHORT. Cropping 3:1 to 16:9 is
             limited by the height, so 6000 px of width yields 3556. Telling
             them to find a wider file is advice that cannot work. */
          shot = r.w + " × " + r.h + " px";
          shotWarn = r.w < slotMax;
          if (r.w < slotMax) {
            var needH = slotAr > 0 ? Math.round(slotMax / slotAr) : 0;
            shot += r.srcW >= slotMax && needH > 0
              ? " — slika je za ta okvir prenizka: pri tem razmerju bi za " +
                slotMax + " px širine potrebovali " + needH + " px višine"
              : " — za oster prikaz priporočamo sliko, široko " + slotMax + " px";
          }
          return { widths: [r.w], blobs: [r.blob], one: true };
        });
      }
      var widths = LADDER.filter(function(w){ return w < srcW; });
      widths.push(srcW);
      return Promise.all(widths.map(function(w){ return draw(bmp, w); }))
        .then(function(blobs){ return { widths: widths, blobs: blobs }; });
    }).then(function(out){
      var fd = new FormData();
      if (out.one) {
        fd.append("file", out.blobs[0], "site.webp");
        phase(i, "nalagam", .7);
        return fetch(form.action, { method: "POST", body: fd, credentials: "same-origin" });
      }
      // The picture's position in this set, so a description the server has to
      // stand in for still differs from its neighbours' — see standInAlt.
      fd.append("n", String(i + 1));
      fd.append("widths", out.widths.join(","));
      /* WHETHER THE UPSCALER RAN, SENT RATHER THAN GUESSED AT LATER. Only
         this side knows: the server sees a set of WebP blobs and cannot tell
         a 2048px photograph from a small one Gemini redrew at 2K. The width
         ladder cannot answer it either — it is the same either way. */
      if (hit[i] === true) fd.append("enhanced", "1");
      out.blobs.forEach(function(b, k){ fd.append("w" + out.widths[k], b, out.widths[k] + ".webp"); });
      phase(i, "nalagam", .7);
      return fetch(form.action, { method: "POST", body: fd, credentials: "same-origin" });
    }).then(function(res){
      /* A redirect here is the server's own error path (?e=…): it answers a
         successful upload the same way, so the only safe reading is to follow
         it and let the page say what happened. */
      if (!res.ok && !res.redirected) {
        return res.text().then(function(t){ throw new Error(t.slice(0, 200)); });
      }
      step(1);
      markDone(i, hit[i] === true);
      return res;
    });
  }

  /* ---- the run ------------------------------------------------------- */

  function start(){
    var fs = file.files ? Array.prototype.slice.call(file.files) : [];
    if (!fs.length || busy) return;
    if (!HTMLCanvasElement.prototype.toBlob) {
      say("ta brskalnik ne zna shraniti v WebP — poskusite v Chromu", "bad");
      if (gowrap) gowrap.style.display = "";
      return;
    }
    busy = true;
    total = fs.length;
    if (go) go.disabled = true;
    pr.hidden = false;
    say("Pripravljam " + slike(fs.length) + " …", "");
    step(0);

    (function next(){
      if (cursor >= fs.length) {
        /* Say what happened before the page reloads under them. Reaching the
           list below with nothing said would leave "did it upscale?" as
           unanswerable as it was before.

           ⚠️ THIS IS THE ONE PLACE THE ANSWER IS EVER GIVEN. If the key is
           missing or the model name has been retired, every enhance call
           answers 204, every original uploads, and the panel's promise that
           "slike se samodejno izboljšajo na 2K" is quietly untrue. It used to
           be said in 13px grey and taken off the screen two and a half seconds
           later; it is now the loud state of the status region, and it holds
           long enough to be read. */
        if (wantsEnhance() && upscaled === 0) {
          /* The size this run ASKED for, not a hard-coded 2K. A site slot asks
             for 4K, and telling somebody who ticked "povečaj na 4K" that
             nothing could be upscaled to 2K reads as a different feature
             failing. */
          say("Naloženo — " + (siteMode ? "slike ni" : "nobene slike ni") +
            " bilo mogoče povečati na " + (siteMode ? "4K" : "2K") + ". " +
            (siteMode ? "Naložena je takšna" : "Naložene so takšne") +
            ", kot ste jo izbrali.", "warn");
          setTimeout(function(){ location.reload(); }, 5000);
          return;
        }
        /* THE STORED SIZE, HELD LONG ENOUGH TO READ, and the same argument as
           the branch above: the one moment the operator can learn that their
           file went in smaller than the slot wants is now, and a reload two
           seconds later takes the answer away with it. Only warns when the
           picture is under the slot's ceiling; a clean upload just reloads. */
        if (shotWarn) {
          say("Naloženo — " + shot + ".", "warn");
          setTimeout(function(){ location.reload(); }, 5000);
          return;
        }
        location.reload();
        return;
      }
      upload(fs[cursor], cursor)
        .then(function(){
          cursor++;
          step(0);
          next();
        })
        .catch(function(e){
          busy = false;
          if (go) { go.disabled = false; go.textContent = "Poskusi znova"; }
          if (gowrap) gowrap.style.display = "";
          mark(cursor, "napaka", "bad");
          /* Which one stopped, what stopped it, and — because pressing the
             button again now RESUMES rather than restarting — what pressing it
             will actually do. */
          say("Napaka pri sliki " + (cursor + 1) + " od " + fs.length + ": " +
            e.message + (cursor > 0 ? " · prvih " + cursor + " je naloženih" : "") +
            " · »Poskusi znova« nadaljuje od " + (cursor + 1) + ".", "bad");
        });
    })();
  }

  /* CHOOSING THE FILES IS THE WHOLE INTERACTION. No description to write, no
     button to find: the change event is the upload. */
  file.addEventListener("change", function(){ shown(); start(); });
  form.addEventListener("submit", function(ev){ ev.preventDefault(); start(); });

  /* Drag and drop. The file input still works exactly as before; this only
     gives the browser a second way to hand the same file over. */
  if (window.DataTransfer && "files" in DataTransfer.prototype) {
    ["dragenter","dragover"].forEach(function(e){
      drop.addEventListener(e, function(ev){ ev.preventDefault(); drop.classList.add("is-over"); });
    });
    ["dragleave","drop"].forEach(function(e){
      drop.addEventListener(e, function(){ drop.classList.remove("is-over"); });
    });
    drop.addEventListener("drop", function(ev){
      ev.preventDefault();
      if (!ev.dataTransfer || !ev.dataTransfer.files.length) return;
      file.files = ev.dataTransfer.files;
      shown(); start();
    });
  }
})();
`;

