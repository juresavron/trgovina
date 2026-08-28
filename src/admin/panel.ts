/**
 * The admin panel's HTML.
 *
 * Deliberately NOT the studio theme — this is a back office, and a tool that
 * dresses up as its own shopfront invites people to treat it as a page to
 * design. One stylesheet, system fonts, no imagery but the photographs
 * themselves, and it renders in a single pass with no framework.
 *
 * It does share the shop's VOCABULARY, and only that: the mark from
 * themes/studio/brand.ts, the same near-black ink, the same two radii. The
 * greys are the studio theme's own tokens rather than new ones, which matters
 * for a reason beyond taste — those values carry computed contrast ratios
 * (--ink-mute is 5.17:1 on white and 4.54:1 on the panel grey, both above the
 * 4.5:1 AA floor the European Accessibility Act makes a legal requirement
 * here). Inventing a fresh grey means inventing a fresh ratio nobody checked.
 *
 * Controls are 44px tall and never smaller than 24x24 (WCAG 2.2 SC 2.5.8),
 * every focusable thing has a visible focus ring, and every hover transition
 * is dropped under prefers-reduced-motion.
 *
 * It is also the only place in this project that requires JavaScript to do its
 * job, and the reason is the image conversion — see UPLOAD_JS.
 */

import { esc } from "../render/sections";
import { brandMark } from "../themes/studio/brand";
import { shotLabel } from "./shots";

const CSS = `
*,*::before,*::after{box-sizing:border-box}

:root{
  /* The studio theme's ink and greys, verbatim — see the module comment. */
  --ink:#151515;
  --ink-body:#212121;
  --mute:#6d6d6d;
  --line:#dfdfdf;
  /* WCAG 1.4.11 holds the boundary of an interactive control to 3:1, which
     the hairline grey does not meet. Inputs get this one. */
  --line-ctrl:#949494;
  --paper:#f0f0f0;
  --card:#fff;
  --on-dark-mute:#a4a4a4;
  --danger:#8a1c1c;
  --danger-line:#e0bcbc;
  --danger-wash:#fdf3f3;
  --ok:#1c5c2a;
  --ok-line:#bfe0c6;
  --ok-wash:#eef7f0;
  --r-card:8px;
  --r-ctrl:4px;
  --lift:0 1px 2px rgba(21,21,21,.05),0 10px 28px rgba(21,21,21,.06);
}

html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink-body);
  font:15px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,
    "Helvetica Neue",Arial,sans-serif;
  -webkit-font-smoothing:antialiased}
code{font:13px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}

/* One ring, everywhere, and only for keyboard users. A panel that hides focus
   is a panel that cannot be operated without a mouse. */
:where(a,button,input,summary,[tabindex]):focus-visible{
  outline:2px solid var(--ink);outline-offset:2px;border-radius:var(--r-ctrl)}
.bar :where(a,button):focus-visible{outline-color:#fff}

/* ---- chrome ---------------------------------------------------------- */

.bar{position:sticky;top:0;z-index:9;background:var(--ink);color:#fff}
/* The account and the sign-out travel together: on a narrow panel they drop
   to a second line as a pair rather than the brand wrapping mid-phrase, which
   is what "Nadzorna / plošča" was doing at 390. */
.bar .in{max-width:1060px;margin:0 auto;padding:9px 20px;min-height:58px;
  display:flex;align-items:center;flex-wrap:wrap;gap:8px 14px}
/* 44px because it is a target like any other (WCAG 2.2 SC 2.5.8) — it was
   23px tall, the only control in the panel under the floor. */
.home{display:inline-flex;align-items:center;gap:10px;min-height:44px;
  color:#fff;text-decoration:none;font-weight:600;letter-spacing:.005em;
  white-space:nowrap}
.mark{width:22px;height:22px;display:block;flex:none}
.acct{display:flex;align-items:center;gap:12px;margin-left:auto;min-width:0}
.who{color:var(--on-dark-mute);font-size:13px;max-width:34ch;min-width:0;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* Off the screen, still in the accessible name. */
.vh{position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;
  overflow:hidden;clip-path:inset(50%);white-space:nowrap}
/* ⚠️ THE WORD GOES, THE ACCOUNT STAYS. At 390 the bar could not hold the
   brand, the account and the sign-out, and what gave way was the brand — it
   wrapped to "Nadzorna / plošča" and made the bar 105px of sticky chrome. The
   account is the half that has to stay legible: it is how somebody notices
   they are signed in as a colleague before they delete a colleague's
   photographs. The mark still links home and the link still announces its
   name; the phone simply does not print it. */
@media (max-width:559px){
  .home span{position:absolute;width:1px;height:1px;margin:-1px;padding:0;
    border:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
  .home{min-width:44px;justify-content:center}
}
.out{font:inherit;font-size:14px;min-height:36px;padding:7px 13px;cursor:pointer;
  background:transparent;color:#fff;border:1px solid var(--on-dark-mute);
  border-radius:var(--r-ctrl)}
.out:hover{background:#2e2e2e}

.wrap{max-width:1060px;margin:0 auto;padding:26px 20px 96px}

/* ---- headings -------------------------------------------------------- */

h1{font-size:clamp(21px,2.2vw,27px);line-height:1.22;letter-spacing:-.012em;
  color:var(--ink);margin:0}
h2{font-size:12px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;
  color:var(--mute);margin:38px 0 12px}
.lede{color:var(--mute);margin:7px 0 0;max-width:60ch}
/* A section heading with a control on its line. The h2's own margins move to
   the row, so the heading keeps its rhythm whether the control is there or
   not — and it is only there when the model has photographs to clear.
   ⚠️ NOT space-between: with two controls that put one of them in the middle
   of the row, reading as an accident rather than as a pair. The heading takes
   the slack and the controls stay together at the end. */
.head-row{display:flex;align-items:center;gap:10px 16px;flex-wrap:wrap;
  margin:38px 0 12px}
.head-row h2{margin:0 auto 0 0}
.clear-all,.arrange{margin:0}
/* Both controls share the heading's line; on a narrow panel they wrap
   together rather than one dropping below the other — which is what they did
   before they were a group, leaving the panel's one irreversible control alone
   at the left margin of its own line, the loosest possible framing for it.

   ⚠️ Same rule as the .file comment: no button label quoted here. The
   stylesheet ships inside every page, and panel.test asserts that a model with
   nothing to delete offers that control nowhere on it. */
.head-acts{display:flex;align-items:center;gap:10px;flex-wrap:wrap;
  margin-left:auto}
.head-row form{display:inline-block}
.head{margin:0 0 24px}
.back{display:inline-flex;align-items:center;gap:7px;min-height:24px;
  padding:4px 0;margin:0 0 14px;color:var(--mute);text-decoration:none;font-size:14px}
.back:hover{color:var(--ink)}

/* ---- surfaces -------------------------------------------------------- */

.card{background:var(--card);border:1px solid var(--line);
  border-radius:var(--r-card);padding:18px}
.muted{color:var(--mute);font-size:13px}
/* ⚠️ EVERY RUNNING PARAGRAPH IS CAPPED, and measured rather than guessed at.
   The panel's column is 1020px wide; a 13px hint spanning it runs to 120–125
   characters a line, which is half again the 85 an eye tracks back from
   reliably. 56ch lands them at 65–75. The cap is on the paragraph and not on
   the column because the CARDS want the full width — a photograph row uses
   every pixel of it. */
.hint{color:var(--mute);font-size:13px;line-height:1.45;margin:7px 0 0;
  max-width:56ch}

/* The card that shows a site slot as it stands. It was a 1020px card holding a
   720px picture, so a third of it was blank paper and the caption underneath
   ran the full width while the thing it captioned did not. The card is now the
   width of its own contents. */
.now{max-width:756px}
.now img{display:block;width:100%;border-radius:var(--r-ctrl)}

.note{display:block;padding:12px 14px;margin:0 0 20px;font-size:14px;
  border:1px solid;border-radius:var(--r-ctrl)}
.note--ok{background:var(--ok-wash);border-color:var(--ok-line);color:var(--ok)}
.note--err{background:var(--danger-wash);border-color:var(--danger-line);color:var(--danger)}

/* ---- controls -------------------------------------------------------- */

label{display:block;font-size:13px;font-weight:500;color:var(--ink);margin:0 0 5px}
input[type=text],input[type=email],input[type=password],input[type=number],
input[type=file]{font:inherit;width:100%;min-height:44px;padding:10px 12px;
  color:var(--ink-body);background:#fff;border:1px solid var(--line-ctrl);
  border-radius:var(--r-ctrl)}
input:hover{border-color:#6f6f6f}
input:focus{border-color:var(--ink);outline:none;box-shadow:0 0 0 2px rgba(21,21,21,.12)}
input[type=number]{width:86px;text-align:center}
input::placeholder{color:#8a8a8a}
input[type=file]{padding:8px 12px;cursor:pointer}
input[type=file]::file-selector-button{font:inherit;font-weight:500;cursor:pointer;
  margin-right:12px;padding:6px 13px;color:var(--ink);background:#fff;
  border:1px solid var(--ink);border-radius:var(--r-ctrl)}
input[type=file]::file-selector-button:hover{background:var(--paper)}

.btn{font:inherit;font-weight:500;display:inline-flex;align-items:center;
  justify-content:center;gap:8px;min-height:44px;padding:10px 18px;cursor:pointer;
  color:#fff;background:var(--ink);border:1px solid var(--ink);
  border-radius:var(--r-ctrl);text-decoration:none}
.btn:hover{background:#000;border-color:#000}
.btn--ghost{background:#fff;color:var(--ink)}
.btn--ghost:hover{background:var(--paper);border-color:var(--ink)}
.btn--danger{background:#fff;color:var(--danger);border-color:var(--danger-line)}
.btn--danger:hover{background:var(--danger-wash);border-color:var(--danger)}
.btn--sm{min-height:38px;padding:8px 14px;font-size:14px}
.btn:disabled{opacity:.5;cursor:not-allowed}

/* ---- login ----------------------------------------------------------- */

.login{min-height:100vh;min-height:100dvh;display:grid;place-items:center;
  padding:32px 20px}
/* 416 and not 398: the one paragraph of running text on this page — the note
   about where accounts live — ran at 44 characters a line inside the narrower
   card, one short of the floor. */
.login-in{width:100%;max-width:416px}
.brand{display:flex;align-items:center;justify-content:center;gap:10px;
  color:var(--ink);margin:0 0 20px}
.brand .mark{width:30px;height:30px}
.brand b{font-size:15px;font-weight:600;letter-spacing:.01em}
.login .card{padding:24px;box-shadow:var(--lift)}
.login h1{font-size:20px}
.login .lede{margin:6px 0 20px;font-size:14px}
.login ul{margin:10px 0 0;padding-left:20px}
.field+.field{margin-top:14px}
.login .btn{width:100%;margin-top:20px}
.login .hint{margin-top:16px;padding-top:14px;border-top:1px solid var(--line)}

/* ---- dashboard ------------------------------------------------------- */

.models{display:grid;gap:16px;margin:0;padding:0;list-style:none;
  grid-template-columns:repeat(auto-fill,minmax(232px,1fr))}
.model{background:var(--card);border:1px solid var(--line);
  border-radius:var(--r-card);overflow:hidden;transition:box-shadow .16s,transform .16s}
.model:hover{box-shadow:var(--lift);transform:translateY(-2px)}
.model:has(a:focus-visible){box-shadow:var(--lift)}
.model a{display:flex;flex-direction:column;height:100%;color:inherit;text-decoration:none}
/* ⚠️ height:auto OR THE ASPECT-RATIO IS DEAD CODE. The tag carries
   width="232" height="174" so the browser has a box before the picture
   arrives; that height attribute is a presentational hint, so the height is
   not auto, so aspect-ratio never applies. Every cover was locked to exactly
   174px tall whatever the column was doing — 174 in a 241px column at 1440,
   174 in a 305px column at 1920 — while the placeholder beside it, a span with
   no attributes to override anything, obeyed the ratio and came out 181. Seven
   pixels, and it was enough to knock the one model with no photograph out of
   line with the rest of its row. */
.cover{display:block;width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;
  background:var(--paper);border-bottom:1px solid var(--line)}
.cover--none{display:grid;place-items:center;width:100%;aspect-ratio:4/3;
  background:var(--paper);border-bottom:1px solid var(--line);color:#c2c2c2}
.cover--none .mark{width:34px;height:34px}
.model .meta{display:block;flex:1;padding:13px 15px 15px}
.model .name{display:block;font-weight:600;color:var(--ink);line-height:1.35}
/* ⚠️ CLAMPED, because this is the SLOT'S OWN NOTE and one of them is 250
   characters of cropping advice. Unclamped it made the hero card three times
   the height of its neighbours and turned a row of six into a staircase. The
   whole note is on the slot's page, one click away. */
.model .count{display:block;color:var(--mute);font-size:13px;margin-top:3px;
  overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;
  -webkit-line-clamp:3;line-clamp:3}
/* A phone is a list, not a contact sheet: six models at 350px wide is 3400px
   of scrolling to reach the seventh thing on the page. Beside a 104px cover
   the whole shop fits on one screen and the picture is still recognisable. */
@media (max-width:559px){
  .models{gap:10px}
  .model a{flex-direction:row;align-items:center;gap:12px;padding:10px 12px}
  /* Both dimensions given, so the cover keeps its 4:3 crop instead of being
     stretched to whatever height the name happens to need — two lines of model
     name were squeezing a landscape photograph into a portrait slot, and a
     model with no cover at all made a card half the height of its neighbours. */
  .cover,.cover--none{width:104px;height:78px;flex:none;
    border:1px solid var(--line);border-radius:var(--r-ctrl)}
  .cover--none .mark{width:26px;height:26px}
  .model .meta{padding:0;min-width:0}
}
/* A section whose whole content is one sentence and one control. The models
   and the site slots are grids of pictures; the blog is neither, and giving it
   a picture card with nothing to put in it would have been a grid of one. */
.row-card{display:flex;align-items:center;justify-content:space-between;
  gap:14px 20px;flex-wrap:wrap}
.row-card p{margin:0;color:var(--mute);font-size:14px;max-width:56ch}
.key{color:var(--mute);font-size:13px;margin:26px 0 0}

/* ---- upload ---------------------------------------------------------- */

.up{display:grid;gap:18px}
/* ⚠️ TWO COLUMNS ONLY WHEN TWO COLUMNS CAN BE READ. This split at 760px, which
   left the picker's own hint running at 31 characters a line and the AI
   disclosure at 41 — both well under the 45 a line needs before it starts
   reading as a column of fragments. Below 900 the card is one column and every
   paragraph in it gets the panel's full width, capped at 56ch. */
@media (min-width:900px){.up{grid-template-columns:minmax(0,1fr) minmax(0,1fr);
  align-items:start}}
/* The picker used to share the row with a column of description fields, so
   half the card was a form. There is no form left — the right-hand column is
   a progress report — so the picker takes the space it needs and the status
   sits beside it rather than opposite it. */
/* 430 and not 320: below it the picker's own hint — the line that becomes the
   count and weight of the chosen set — ran at 31 to 41 characters. */
@media (min-width:900px){.up--solo{grid-template-columns:minmax(0,430px) minmax(0,1fr)}}
.drop{border:1px dashed var(--line-ctrl);border-radius:var(--r-card);
  padding:16px;background:#fbfbfb}
.drop.is-over{border-color:var(--ink);background:var(--paper)}
/* The opt-in above the disclosure it belongs to: a real 44px row, because it
   is a control that changes what gets published. */
.ai-opt{display:flex;align-items:center;gap:10px;min-height:44px;margin:14px 0 0;
  font-size:14px;font-weight:500;color:var(--ink);cursor:pointer}
.ai-opt input{width:18px;height:18px;flex:none;cursor:pointer}
.note-ai{margin:16px 0 0;padding:11px 13px;border-left:2px solid var(--ink);
  background:#fbfbfb;font-size:13px;line-height:1.45;color:var(--mute);
  max-width:56ch}
/* The picker's own line: the format hint before anything is chosen, the count
   and weight of the set afterwards. It had no rule at all on a model page —
   the class was .fmeta and only .hint was styled — so it rendered at 15px in
   body ink there and at 13px mute on the site page, the same sentence in two
   different voices. */
.fmeta{color:var(--mute);font-size:13px;line-height:1.45;margin:9px 0 0;
  max-width:56ch}
.picked{list-style:none;margin:0;padding:0;display:none;flex-direction:column;gap:10px}
.picked.on{display:flex}
.picked li{display:flex;gap:12px;align-items:center}
.picked img{width:72px;height:54px;object-fit:cover;border-radius:var(--r-ctrl);
  background:var(--paper);flex:none;border:1px solid var(--line)}
.picked .grow{flex:1;min-width:0}
.picked .nm{display:block;font-size:12px;color:var(--mute);margin:0 0 2px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* One line of state per file. The list is now the only progress report the
   operator gets per picture, so it has to say where each one is — and the ONE
   that is moving has to look different from the nine that are waiting. The run
   is strictly sequential, so at any moment exactly one row is live. */
.picked .rowst{display:block;font-size:13px;color:var(--ink);font-weight:500}
.picked .rowst.wait{color:var(--mute);font-weight:400}
.picked .rowst.ok{color:var(--ok)}
.picked .rowst.bad{color:var(--danger)}
.picked li.is-live{box-shadow:inset 2px 0 0 var(--ink);padding-left:10px;
  margin-left:-10px}
/* ⚠️ THE RUN'S STATE SITS ABOVE THE LIST, NOT BELOW IT. Ten files make the
   list 600px tall, and the bar and the summary were underneath all of it —
   the operator watched the rows and never saw either. */
.runst{margin:0 0 14px}
/* Nothing to report, no room taken: the empty bar and the empty status line
   were 50px of permanent blank in the middle of the card. :has is already a
   dependency here (see .model), and a browser without it simply gets the old
   reserved space. */
.runst:has(#st:empty){display:none}
.stline{margin:6px 0 0;min-height:20px;font-size:13px;color:var(--mute);
  max-width:60ch}
.stline.is-bad{color:var(--danger);font-weight:500}
.stline.is-warn{color:var(--ink);font-weight:500;padding:9px 11px;
  border-left:2px solid var(--ink);background:var(--paper)}
#prev{display:none;width:100%;aspect-ratio:4/3;object-fit:contain;
  background:var(--paper);border-radius:var(--r-ctrl);margin-bottom:12px}
#prev.on{display:block}
progress{width:100%;height:8px;margin:0;display:block}
progress[hidden]{display:none}

/* ---- photographs ----------------------------------------------------- */
/*
 * ONE ROW PER PHOTOGRAPH, not a contact sheet.
 *
 * This was a card grid — auto-fill, minmax(288px, 1fr) — which meant the
 * description field, the one control on this page anybody actually uses, was
 * 283px wide at EVERY viewport from 390 to 1920. Measured: the ten sample
 * descriptions want between 363px and 817px, so the operator was reading and
 * editing a third of a sentence through a slot and scrolling the field
 * sideways to check the rest. Three columns of that is not a working surface,
 * it is a gallery with fields in it.
 *
 * As rows the field takes the whole column — 844px at 1440, 322px at 390 —
 * and ten photographs are one screen of scrolling instead of two and a half.
 *
 * The grid areas are the same shape at both sizes and in the same order as
 * the DOM, so nothing reads in one sequence and tabs in another:
 *
 *   narrow   thumb file      wide   thumb file
 *            field field            thumb field
 *            acts  acts             thumb acts
 */
.shots{display:grid;gap:10px;margin:0;padding:0;list-style:none}
.shot{background:var(--card);border:1px solid var(--line);
  border-radius:var(--r-card);padding:12px 14px;
  display:grid;gap:8px 14px;align-items:start;
  grid-template-columns:auto minmax(0,1fr);
  grid-template-areas:"thumb file" "field field" "acts acts"}
@media (min-width:560px){
  .shot{grid-template-areas:"thumb file" "thumb field" "thumb acts"}
}
/* The thumbnail is a LINK to the full picture. The panel tells the operator to
   look at what the upscaler did ("po nalaganju jo poglejte") and then gave
   them 288px to judge a 2K redraw by; now the row is compact and the whole
   photograph is one click away, in its own tab so a half-typed description
   survives the trip. */
.thumb{grid-area:thumb;display:block;width:clamp(72px,11vw,158px);
  border-radius:var(--r-ctrl);align-self:center}
.thumb img{display:block;width:100%;height:auto;aspect-ratio:4/3;
  object-fit:cover;background:var(--paper);border:1px solid var(--line);
  border-radius:var(--r-ctrl)}
.thumb:hover img{border-color:var(--ink)}
.shot .fields{grid-area:field;min-width:0}
.fhead{display:flex;align-items:baseline;gap:10px;margin:0 0 5px}
.fhead label{margin:0}
.badge{background:var(--ink);color:#fff;font-size:11px;font-weight:600;
  letter-spacing:.07em;text-transform:uppercase;padding:4px 9px;
  border-radius:99px;white-space:nowrap}
.shot .acts{grid-area:acts;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
/* The order number reads on the button row rather than above it: a labelled
   box stacked over 44px of input made every row 18px taller for a word. */
.num{display:flex;align-items:center;gap:8px}
.num label{margin:0;white-space:nowrap}
.shot .gone{display:none}
/*
 * THE REFERENCE LINE, which had grown into four unrelated jobs run together in
 * one grey sentence and was then broken mid-word by word-break:break-all — in
 * a 288px card the path lost its last letter to the second line, the width
 * list lost its last figure to the third and the shot name its last letter to
 * the fourth.
 *
 * ⚠️ DO NOT QUOTE THE LINE ITSELF IN THIS COMMENT. The stylesheet is inlined
 * into every admin page, so a sample of it here is a sample of it in the
 * document — and panel.test asserts that a photograph the upscaler did NOT
 * touch says so nowhere on the page. Same trap the site-image test names.
 *
 * The four are still one line, because the sort rule and the redraw both
 * belong to this photograph and to nothing else, but each is its own span now.
 * The filename carries the row's identity, so it is the part in body ink; the
 * folder repeats on all ten rows and stays quiet; the redraw marker is a
 * disclosure that those pixels were never photographed, so it is not grey
 * filler either; and only the path may break mid-word, when there is nowhere
 * else for it to go.
 */
.file{grid-area:file;font-size:12px;line-height:1.5;color:var(--mute);
  margin:0;align-self:center}
.file .path{overflow-wrap:anywhere}
.file .fn{color:var(--ink-body);font-weight:500}
/* ⚠️ THE FOLDER GOES ON A PHONE. It is shop/slug — the model whose page this
   is, spelled out again on every one of its own rows — and at 390 those 21
   characters are two thirds of the line, which forced the filename to break
   mid-word to make room for a folder the operator is standing in. The exact
   storage key is still on the row: it is the thumbnail's href. */
@media (max-width:559px){.file .dir{display:none}}
.file .w,.file .kind{white-space:nowrap}
.file .ai{white-space:nowrap;color:var(--ink-body);font-weight:500}
.empty{color:var(--mute);margin:0;max-width:56ch}

@media (prefers-reduced-motion:reduce){
  *{transition:none !important;animation:none !important}
  .model:hover{transform:none}
}
`;

/**
 * The stylesheet as it SHIPS: the rules, and not a word of the reasoning.
 *
 * ⚠️ THIS IS INLINED INTO EVERY ADMIN PAGE, which is what makes a comment in
 * CSS different from a comment anywhere else in this project — it is not
 * documentation, it is payload, and it is payload on every request. The
 * commentary above is more than half the constant: 21.7 kB of stylesheet, of
 * which 10.9 kB is rules. Stripped, each admin page carries the 10.9 kB and
 * the source keeps all of it.
 *
 * There is a second reason and it is not about bytes. A CSS comment that
 * quotes a piece of the interface — a button's label, a sample of a metadata
 * line — puts that text into the DOCUMENT, where any assertion that searches
 * the whole page for it finds it. panel.test asserts that a model with nothing
 * to delete offers no way to delete it, and that a photograph the upscaler did
 * not touch says so nowhere; both of those failed against a corrected page
 * because a comment in here quoted the string. describe.test names the same
 * trap. Stripping removes the trap along with the weight.
 *
 * Computed once at module load, not per request. Safe as a regular expression
 * because this stylesheet has no string literals and no url() — nothing in it
 * can contain the characters that end a comment.
 */
const CSS_OUT = CSS.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\n{2,}/g, "\n").trim();

/* ---- document -------------------------------------------------------- */

function doc(title: string, body: string): string {
  return (
    '<!doctype html><html lang="sl"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="robots" content="noindex, nofollow">' +
    '<meta name="color-scheme" content="light">' +
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">' +
    '<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">' +
    "<title>" + esc(title) + " — nadzorna plošča</title>" +
    "<style>" + CSS_OUT + "</style></head><body>" + body + "</body></html>"
  );
}

/**
 * The signed-in chrome.
 *
 * @param who The account, shown in the bar. With one shared password there was
 *   nothing to show; with accounts there is, and seeing which one you are is
 *   how you notice you are on a colleague's session before you delete their
 *   photographs.
 */
/*
 * ⚠️ EXPORTED SO A SECOND ADMIN PAGE CAN WEAR THE SAME CHROME.
 *
 * The blog editor lives in its own module — this file is already long and a
 * post editor has nothing to do with photographs — but it must not draw its
 * own bar, its own logout button and its own account label. Two admin pages
 * whose chrome disagrees is how an operator stops trusting which session they
 * are in, which is the exact thing the account label was added to prevent.
 */
export function shell(title: string, body: string, who: string): string {
  return doc(
    title,
    '<header class="bar"><div class="in">' +
      // The word is in a span of its own so a narrow bar can drop it without
      // dropping the link's accessible name with it.
      '<a class="home" href="/admin">' + brandMark("panel", "mark") +
      "<span>Nadzorna plošča</span></a>" +
      // The account and the sign-out are one group, so a narrow bar drops the
      // pair to a second line instead of hyphenating the brand.
      '<div class="acct">' +
      (who ? '<span class="who">' + esc(who) + "</span>" : "") +
      '<form method="post" action="/admin/logout">' +
      '<button class="out" type="submit">Odjava</button></form>' +
      "</div>" +
      '</div></header><main class="wrap">' + body + "</main>",
  );
}

/**
 * The banner that says what just happened.
 *
 * ⚠️ BOTH VARIANTS ANNOUNCE, and only one of them used to.
 *
 * Every notice in this panel arrives the same way: the handler redirects, the
 * browser loads a fresh page, and the banner is sitting at the top of it. The
 * failure carried role="alert" for exactly the reason given on loginPage — a
 * screen-reader user is returned to a page that looks identical to the one
 * they left and told nothing. The success case is the same page and the same
 * silence. Somebody deletes a photograph, the list comes back one row shorter,
 * and the only confirmation that the delete happened at all is a green bar
 * they were never told about.
 *
 * So the failure keeps role="alert" (assertive: it interrupts) and the success
 * gets role="status" (polite: it waits its turn). Both are announced.
 */
export function noticeHtml(notice?: { kind: "ok" | "err"; text: string }): string {
  if (!notice) return "";
  return (
    '<p class="note note--' + notice.kind + '" role="' +
    (notice.kind === "err" ? "alert" : "status") + '">' + esc(notice.text) + "</p>"
  );
}

/**
 * The login screen.
 *
 * No chrome bar: a header whose only links are the page you are already on and
 * a sign-out you cannot use is furniture, and it would be the first thing a
 * screen reader read out.
 *
 * role="alert" on the failure, because the message replaces the page after a
 * submit — without it a screen-reader user is returned to a form that looks
 * identical to the one they just sent and told nothing.
 */
export function loginPage(error?: string): string {
  return doc(
    "Prijava",
    '<main class="login"><div class="login-in">' +
      '<p class="brand">' + brandMark("login", "mark") +
      "<b>Masažni bazeni Vrelec</b></p>" +
      (error ? '<p class="note note--err" role="alert">' + esc(error) + "</p>" : "") +
      '<form method="post" action="/admin/login" class="card">' +
      "<h1>Prijava</h1>" +
      '<p class="lede">Urejanje fotografij izdelkov.</p>' +
      '<div class="field"><label for="em">E-naslov</label>' +
      '<input id="em" name="email" type="email" autocomplete="username" ' +
      'autocapitalize="none" spellcheck="false" required autofocus></div>' +
      '<div class="field"><label for="pw">Geslo</label>' +
      '<input id="pw" name="password" type="password" ' +
      'autocomplete="current-password" required></div>' +
      '<button class="btn" type="submit">Prijava</button>' +
      '<p class="hint">Račune ureja Supabase. Pozabljeno geslo ponastavite tam. ' +
      "Prijava velja eno uro.</p>" +
      "</form></div></main>",
  );
}

/**
 * A path that does not exist, for somebody who is already signed in.
 *
 * ⚠️ THIS USED TO RENDER THE LOGIN FORM. A signed-in admin who mistyped a URL
 * was shown a password box, which reads as "you have been signed out" — so the
 * honest response to it is to sign in again, and the honest conclusion after
 * that works is that the panel is unreliable.
 */
export function notFoundPage(message: string, who: string): string {
  return shell(
    "Ni najdeno",
    '<div class="head"><h1>' + esc(message) + "</h1>" +
      '<p class="lede">Naslov ne obstaja ali pa se je model preimenoval.</p></div>' +
      '<p><a class="btn btn--ghost" href="/admin">Nazaj na modele</a></p>',
    who,
  );
}

export function notConfiguredPage(missing: string[]): string {
  // Both remaining settings are PUBLIC values that live in wrangler.jsonc and
  // ship with the code. If this page is ever seen in production, something was
  // deleted from that file — there is no secret to forget to set.
  return doc(
    "Ni nastavljeno",
    '<main class="login"><div class="login-in">' +
      '<p class="brand">' + brandMark("cfg", "mark") +
      "<b>Masažni bazeni Vrelec</b></p>" +
      '<div class="card">' +
      "<h1>Nadzorna plošča ni nastavljena</h1>" +
      '<p class="lede">V <code>wrangler.jsonc</code> pod <code>vars</code> manjka:</p>' +
      "<ul>" + missing.map((m) => "<li><code>" + esc(m) + "</code></li>").join("") + "</ul>" +
      '<p class="hint">To sta javna podatka, ne skrivnosti — nastavita se v kodi ' +
      "in objavita z naslednjo objavo.</p>" +
      "</div></div></main>",
  );
}

/* ---- dashboard ------------------------------------------------------- */

export interface ModelLink {
  shop: string;
  slug: string;
  name: string;
  count: number;
  /** The first photograph, shown as the card's cover. Absent until there is one. */
  cover?: string | undefined;
}

/**
 * "1 fotografija", but "2 fotografiji" and "5 fotografij".
 *
 * Slovenian counts in four forms and this line used the genitive plural for
 * everything above one, so a model with two photographs read "2 fotografij".
 * Same class of error as modelCount() in content/bazen.ts and the same
 * consequence: getting your own numerals wrong reads as machine translation.
 *
 *   1        fotografija   (singular)
 *   2        fotografiji   (dual)
 *   3, 4     fotografije   (plural)
 *   5 and up fotografij    (genitive plural)
 */
export function photoCount(n: number): string {
  if (n === 0) return "brez fotografij";
  // The teens are the exception that has to be tested FIRST: 11 to 14 all take
  // the genitive plural even though they end in 1, 2, 3 and 4. Everything else
  // follows the last digit, so 21 is a singular and 22 a dual.
  // Last two digits, matched exactly: 22 and 94 are compounds and take the
  // genitive plural — a units-digit rule would print "22 fotografiji".
  const t = n % 100;
  if (t === 1) return n + " fotografija";
  if (t === 2) return n + " fotografiji";
  if (t === 3 || t === 4) return n + " fotografije";
  return n + " fotografij";
}

export interface SiteSlot {
  stem: string;
  label: string;
  note: string;
  /** The /media path to preview, whether it has been replaced yet or not. */
  src: string;
  /**
   * Which part of the site this belongs to.
   *
   * ⚠️ THE LIST OUTGREW A FLAT WALL. It was three slots and is fourteen, and
   * fourteen identical cards under one heading is a wall to scan rather than a
   * structure to navigate — an operator looking for the gallery strip should
   * not have to read six labels called "Galerija — slika n" to find out
   * whether they are in the right place. The heading answers it before they
   * start reading.
   */
  group: string;
}

export function indexPage(
  shopName: string,
  shopKey: string,
  models: ModelLink[],
  who = "",
  site: SiteSlot[] = [],
): string {
  return shell(
    "Izdelki",
    '<div class="head"><h1>' + esc(shopName) + "</h1>" +
      '<p class="lede">Izberite model in uredite njegove fotografije. ' +
      "Prva je tista, ki jo trgovina pokaže povsod.</p></div>" +
      // The site slots below had a heading and the models above them did not,
      // so the page's outline claimed everything before "Slike strani"
      // belonged to the h1. Two lists, two headings, and a screen reader can
      // jump between them.
      "<h2>Modeli</h2>" +
      '<ul class="models">' +
      models
        .map(
          (m) =>
            '<li class="model"><a href="/admin/' + esc(m.shop) + "/" + esc(m.slug) + '">' +
            (m.cover
              ? '<img class="cover" src="/media/' + esc(m.cover) +
                '" alt="" loading="lazy" width="232" height="174">'
              : '<span class="cover--none">' + brandMark("m-" + m.slug, "mark") +
                "</span>") +
            '<span class="meta"><span class="name">' + esc(m.name) + "</span>" +
            '<span class="count">' + photoCount(m.count) + "</span></span>" +
            "</a></li>",
        )
        .join("") +
      "</ul>" +

      // THE POSTS, which had no way in from here at all. The editor was
      // reachable only by typing /admin/blog, which means it was reachable
      // only by the person who wrote it.
      //
      // It sits between the models and the site pictures because that is how
      // often each is touched: photographs most days, a post now and then, a
      // site slot almost never. And it is a peer of both, not a subordinate —
      // the panel manages three things now, and the dashboard should say three.
      //
      // ⚠️ THE SENTENCE IS THERE BECAUSE THE RULE IS DIFFERENT HERE. Every
      // other change this panel makes waits for the next deploy, and the model
      // page says so at length. A post does not. An operator who has learned
      // "nothing I do here shows up today" will publish one and then go
      // looking for the deploy button.
      "<h2>Blog</h2>" +
      '<div class="card row-card">' +
      "<p>Zapisi so na spletni strani takoj po objavi.</p>" +
      '<a class="btn btn--ghost" href="/admin/blog">Uredi zapise</a>' +
      "</div>" +

      // MNENJA, and the sentence says the OPPOSITE of the blog's above it —
      // deliberately, and for a reason worth the two lines. A post publishes
      // itself; a review waits for the next update of the site, because it is
      // baked into the build so the launch gate sees it before a customer does
      // (src/content/reviews.generated.ts). An operator who has just learned
      // that posts are instant will assume everything here is.
      // POVPRAŠEVANJA FIRST, and above the reviews, because of how often each
      // is touched: an enquiry is a customer waiting for an answer, a review
      // is an editorial job. The dashboard should open on the thing with
      // somebody on the other end of it.
      "<h2>Barve</h2>" +
      '<div class="card row-card">' +
      "<p>Barve školjke in obloge, ki jih trgovina lahko pokaže. Dodate jih tako, "
        + "da naložite njihove vzorce.</p>" +
      '<a class="btn btn--ghost" href="/admin/barve">Uredi barve</a>' +
      "</div>" +

      "<h2>Povpraševanja</h2>" +
      '<div class="card row-card">' +
      "<p>Kar so ljudje oddali prek obrazca na strani Kontakt.</p>" +
      '<a class="btn btn--ghost" href="/admin/povprasevanja">Odpri povpraševanja</a>' +
      "</div>" +

      "<h2>Mnenja strank</h2>" +
      '<div class="card row-card">' +
      "<p>Prepisana mnenja kupcev. Na strani se pokažejo ob naslednji " +
      "posodobitvi.</p>" +
      '<a class="btn btn--ghost" href="/admin/mnenja">Uredi mnenja</a>' +
      "</div>" +

      // THE SMART UPLOADER — the owner's flow, in the owner's words: "I drop
      // 10 pictures and AI upscales and checks what on the image and assign
      // to correct section." The model CLASSIFIES (admin/assign.ts) and the
      // browser then runs the exact per-slot pipeline the single pages run —
      // crop to the slot's own frame, WebP, the guarded upscale — so this
      // card adds a router in front of the machinery, not a second copy of
      // it. The per-slot pages below remain the manual override.
      "<h2>Slike strani — pametno nalaganje</h2>" +
      '<div class="card">' +
      '<div class="drop" id="sm-drop">' +
      '<label for="sm-f">Izberite ali povlecite več slik naenkrat</label>' +
      '<input id="sm-f" type="file" multiple ' +
      'accept="image/webp,image/jpeg,image/png,image/avif">' +
      '<p class="fmeta" id="sm-meta">AI vsako fotografijo pogleda, jo razporedi ' +
      "na pravo mesto spodaj — naslovna, kategoriji, zgodba, vodniki, galerija — " +
      "jo obreže na pravo razmerje in naloži. Spodaj piše, kaj je šlo kam.</p>" +
      "</div>" +
      '<label class="ai-opt" for="sm-ai"><input type="checkbox" id="sm-ai" checked>' +
      "<span>Premajhne slike povečaj z umetno inteligenco</span></label>" +
      '<p class="note-ai">Velja za slike, ožje od okvirja, v katerega gredo. ' +
      "Model sliko PONOVNO NARIŠE večjo: rezultat je oster, ni pa nujno več " +
      "ista fotografija — razporejene slike po nalaganju preglejte. Če model " +
      "ne vrne večje slike, obdržimo vašo.</p>" +
      '<p class="stline" id="sm-stwrap" role="status"><span id="sm-st"></span></p>' +
      '<ul class="picked" id="sm-list"></ul>' +
      "</div>" +

// THE COLOUR SAMPLES — the owner's ask, in the owner's words: "for barve
      // školjke I want that I upload all colors and AI sorts them correctly".
      //
      // Its own drop zone rather than a note on the one above, because it is
      // a different question and the server answers it from a different
      // catalogue (see the scope field on /admin/site-sort). Sixteen colour
      // slots inside the site's 46-option prompt is not a list a model can
      // choose from — the notes are identical but for the colour name — while
      // ten shell finishes on their own, with the filenames read first, is.
      //
      // ⚠️ NO AI-UPSCALE CHECKBOX HERE, and that is deliberate. The enhancer
      // redraws a picture larger; on a marbled acrylic sample the redraw is a
      // new pattern in approximately that colour, which is the one thing a
      // swatch must not be. These slots cap at 400px anyway.
      "<h2>Barve školjke — naložite vse naenkrat</h2>" +
      '<div class="card">' +
      '<div class="drop" id="bv-drop">' +
      '<label for="bv-f">Izberite ali povlecite vse vzorce barv školjke naenkrat</label>' +
      '<input id="bv-f" type="file" multiple ' +
      'accept="image/webp,image/jpeg,image/png,image/avif">' +
      '<p class="fmeta">Vsaka datoteka postane ena barva, in ime barve je ime ' +
      "datoteke. Poimenujte jih po proizvajalčevi barvni karti — Oyster Opal.jpg, " +
      "silver white marble.png, Črna.jpg — in jih povlecite sem vse naenkrat. " +
      "Velikih in malih črk ne popravljamo: ime se navaja na naročilnici. " +
      "Vzorec obrežemo na sredini in shranimo 400 × 400 px." +
      "</p>" +
      "</div>" +
      '<p class="stline" id="bv-stwrap" role="status"><span id="bv-st"></span></p>' +
      '<ul class="picked" id="bv-list"></ul>' +
      "</div>" +

      "<h2>Barve obloge — naložite vse naenkrat</h2>" +
      '<div class="card">' +
      '<div class="drop" id="ob-drop">' +
      '<label for="ob-f">Izberite ali povlecite vse vzorce barv obloge naenkrat</label>' +
      '<input id="ob-f" type="file" multiple ' +
      'accept="image/webp,image/jpeg,image/png,image/avif">' +
      '<p class="fmeta">Vsaka datoteka postane ena barva, in ime barve je ime ' +
      "datoteke. Poimenujte jih po proizvajalčevi barvni karti — Oyster Opal.jpg, " +
      "silver white marble.png, Črna.jpg — in jih povlecite sem vse naenkrat. " +
      "Velikih in malih črk ne popravljamo: ime se navaja na naročilnici. " +
      "Vzorec obrežemo na sredini in shranimo 400 × 400 px." +
      "</p>" +
      "</div>" +
      '<p class="stline" id="ob-stwrap" role="status"><span id="ob-st"></span></p>' +
      '<ul class="picked" id="ob-list"></ul>' +
      "</div>" +

            // THE SITE'S OWN PICTURES, which had no way in here at all — so the
      // heaviest image on the storefront (a 2.7 MB PNG hero) was the one
      // picture the panel's convert-to-WebP promise never reached.
      // GROUPED, IN THE ORDER THE SLOTS APPEAR ON THE PAGE. The groups are
      // derived from the slots rather than listed here, so a new slot lands in
      // its section without this file knowing about it — and a new SECTION
      // appears by naming it once, in site-images.ts, where the slot is
      // declared. Set preserves first-seen order, which is already the order
      // SITE_IMAGES is written in.
      [...new Set(site.map((x) => x.group))]
        .map(
          (g) =>
            "<h2>" + esc(g) + "</h2>" +
            '<ul class="models">' +
            site
              .filter((x) => x.group === g)
              .map(
                (x) =>
                  '<li class="model"><a href="/admin/site/' + esc(x.stem) + '">' +
                  '<img class="cover" src="' + esc(x.src) + '" alt="" loading="lazy" ' +
                  'width="232" height="174">' +
                  '<span class="meta"><span class="name">' + esc(x.label) + "</span>" +
                  '<span class="count">' + esc(x.note) + "</span></span>" +
                  "</a></li>",
              )
              .join("") +
            "</ul>",
        )
        .join("") +

      '<p class="key">Ključ trgovine: <code>' + esc(shopKey) + "</code></p>" +
      "<script>" + SMART_JS + "</script>",
    who,
  );
}

/**
 * One site image: what is there now, and a form to replace it.
 *
 * Deliberately the same upload component as a model's page — same conversion,
 * same width check, same WebP guarantee — with the ladder suppressed. These
 * keys are FIXED so the storefront can name them in code, which means there
 * is exactly one file per slot and no srcset to describe.
 */
export function siteImagePage(
  stem: string,
  label: string,
  note: string,
  src: string,
  notice?: { kind: "ok" | "err"; text: string },
  who = "",
  /** The frame's own shape, or undefined where it does not crop. */
  ratio?: readonly [number, number],
  /** The largest width worth storing — a cap, never a target to inflate to. */
  maxWidth = 2048,
  /**
   * …EXCEPT on a slot that declares itself exact, where maxWidth stops being
   * a cap and becomes the stored size. Only the colour swatches do, so that
   * one replaced by hand on this page comes out the same 400 × 400 as the
   * fifteen the batch sorter stored. See `exact` on SiteImage.
   */
  exact = false,
  /** Whether GEMINI_API_KEY is set, so the upscale can even be offered. */
  canEnhance = false,
  // No enhance parameter. It used to take one and pass it to the form; a site
  // photograph is never redrawn now, so a caller handing this page the
  // upscaler's availability would be describing something that does not
  // happen. See the note on the form below.
): string {
  return shell(
    label,
    noticeHtml(notice) +
      '<a class="back" href="/admin">← Vsi modeli</a>' +
      '<div class="head"><h1>' + esc(label) + "</h1>" +
      '<p class="lede">' + esc(note) + "</p></div>" +

      "<h2>Trenutna slika</h2>" +
      // The card is the width of the picture it holds — see .now. The inline
      // style this used to carry was the only one in the panel, and it said
      // in an attribute what the one stylesheet says everywhere else.
      '<div class="card now"><img src="' + esc(src) + '" alt="">' +
      '<p class="hint">Nova slika zamenja to na istem naslovu. Na spletni ' +
      "strani se pokaže v nekaj minutah.</p></div>" +

      "<h2>Zamenjaj</h2>" +
      '<form class="card" method="post" action="/admin/site/' + esc(stem) +
      // ⚠️ NO data-enhance HERE, AND THAT IS THE POINT.
      //
      // The upscaler REDRAWS a picture, it does not sharpen one, and the
      // difference does not matter much on a product cut out against a plain
      // sweep — the subject is isolated and the model has little to invent.
      // It matters entirely on a SCENE. The hero is a photograph of a real
      // installation, chosen for how it is framed, and the model handed back
      // a different scene: same tub, moved, cropped to a corner, from a
      // garden that is no longer the same garden.
      //
      // There is a second reason, and it outranks the first. A shop's hero is
      // a claim about what this looks like in a real garden. A generated
      // reconstruction of that photograph is a picture of an installation
      // nobody built, presented as one. UCPD Article 6 is about exactly this
      // kind of assertion, and no amount of upscaling is worth it.
      '/upload" enctype="multipart/form-data" id="up" data-mode="site"' +
      // THE SLOT'S OWN SHAPE, so the browser can crop to it before storing.
      // Measured off the rendered page rather than guessed — see SiteImage.
      // Absent on a frame that shows the picture whole (object-fit: contain),
      // where a crop would throw away the sides for nothing.
      (ratio ? ' data-ar="' + ratio[0] + ":" + ratio[1] + '"' : "") +
      ' data-max="' + String(maxWidth) + '"' +
      (exact ? ' data-exact="1"' : "") + ">" +
      '<div class="up">' +
      '<div class="drop" id="drop">' +
      '<img id="prev" alt="" width="400" height="300">' +
      '<label for="f">Slika (JPEG, PNG, WebP)</label>' +
      '<input id="f" name="file" type="file" ' +
      'accept="image/webp,image/jpeg,image/png,image/avif" required>' +
      '<p class="fmeta" id="fmeta">Sliko lahko tudi povlečete sem. V brskalniku ' +
      "se samodejno pretvori v WebP.</p>" +
      "</div>" +
      '<div class="side">' +
      // No description field, and no hidden one either: this picture is
      // decorative on the storefront and is rendered with an empty alt there,
      // so a sentence collected here would never reach a page. The field that
      // used to sit here disabled — the whole showOneAlt mechanism — went with
      // the per-file description fields it existed to hide.
      // THE RUN'S OWN STATE FIRST. It is the only thing on this column that
      // changes while work is happening, and it used to sit under two
      // paragraphs of standing disclosure.
      '<div class="runst"><progress id="pr" max="100" value="0" hidden ' +
      'aria-label="Napredek nalaganja"></progress>' +
      '<p class="stline" id="stwrap" role="status"><span id="st"></span></p></div>' +
      '<ul class="picked" id="picked"></ul>' +
      '<p class="hint">Slika je okrasna — bralnik zaslona je ne prebere, zato ' +
      "opis ni potreben. Nalaganje se začne samo.</p>" +
      // THE UPSCALER RUNS ON EVERY UPLOAD when a key is configured — the
      // owner's instruction, given twice and with the caveat stated: they
      // upload, it upscales, there is nothing to tick.
      //
      // The line stays because it is not a control, it is a disclosure: the
      // picture is REDRAWN at 2K rather than sharpened, and an operator who
      // does not know that cannot judge whether the result still shows the
      // product they are selling.
      // ⚠️ AN OPT-IN, AND OFF BY DEFAULT, AND HERE AT ALL BECAUSE THE OWNER
      // ASKED TWICE FOR IT ON THIS SLOT.
      //
      // The refusal above it is the same one this file has carried since the
      // hero came back as a different garden, and it is still why nothing
      // happens unless somebody ticks the box. What changed is that "no" was
      // not an answer to "my hero is not sharp enough": the panel caps and
      // never inflates, so a small upload stays small, and the only thing that
      // can genuinely add pixels is a model that draws them.
      //
      // So the choice is put where the decision is made, with the cost stated
      // in the same breath — not in a manual, and not switched on quietly.
      // The size guard in the script refuses a result that is not actually
      // larger, so ticking this can cost time and never quality.
      (canEnhance
        ? '<label class="ai-opt" for="ai"><input type="checkbox" id="ai">' +
          "<span>Povečaj z umetno inteligenco na 4K</span></label>" +
          '<p class="note-ai">Brez kljukice sliko naložimo tako, kot ste jo ' +
          "izbrali — samo obrezano na pravo razmerje in pretvorjeno v WebP. " +
          "S kljukico jo model PONOVNO NARIŠE večjo: rezultat je oster, ni " +
          "pa nujno več ista fotografija. Pri naslovni sliki to pomeni, da " +
          "je lahko bazen v drugačnem vrtu, zato jo po nalaganju poglejte. " +
          "Če model ne vrne večje slike, obdržimo vašo.</p>"
        : '<p class="note-ai">Ta slika se ne obdeluje z umetno inteligenco — ' +
          "naložimo jo tako, kot ste jo izbrali, samo obrezano na pravo " +
          "razmerje in pretvorjeno v WebP.</p>") +
      '<p id="gowrap"><button class="btn" type="submit" id="go">Naloži</button></p>' +
      "</div></div></form>" +
      "<script>" + UPLOAD_JS + "</script>",
    who,
  );
}

/* ---- one model ------------------------------------------------------- */

export interface MediaView {
  id: string;
  url: string;
  alt: string;
  sort: number;
  widths: number[];
  /** True when the 2K upscaler redrew this image. Never inferred. */
  enhanced?: boolean;
  /** Which kind of shot this is — see admin/shots.ts. "" = not classified. */
  shot?: string | null;
}

/**
 * One photograph, as a row of a working list.
 *
 * ⚠️ THIS WAS A CARD IN A THREE-COLUMN GRID, and the grid was the fault. The
 * description field — the only control on this page anybody uses more than
 * once — measured 283px wide at every viewport from 390 to 1920, while the ten
 * descriptions in this catalogue want between 363 and 817. So the operator
 * edited a third of a sentence at a time and scrolled the field sideways to
 * check the rest of it. As a row the field takes the column: 844px at 1440.
 *
 * The four attributes at the foot are still one line, because all four belong
 * to this photograph and nowhere else, but they are no longer one string with
 * word-break:break-all through it. See .file in the stylesheet.
 */
function shotRow(base: string, m: MediaView, lead: boolean): string {
  const id = esc(m.id);
  const cut = m.url.lastIndexOf("/");
  const dir = cut < 0 ? "" : m.url.slice(0, cut + 1);
  const fileName = m.url.slice(cut + 1);
  const kind = shotLabel(m.shot);
  return (
    '<li class="shot">' +
    // The thumbnail opens the photograph itself. This page tells the operator
    // to LOOK at what the upscaler did to a picture and then gave them 288px
    // of it to judge by; a new tab so a half-typed description survives.
    '<a class="thumb" href="/media/' + esc(m.url) + '" target="_blank" ' +
    'rel="noopener" aria-label="Odpri sliko ' + esc(fileName) + ' v novem zavihku">' +
    '<img src="/media/' + esc(m.url) + '" alt="" loading="lazy" ' +
    'width="132" height="99"></a>' +
    // The reference line: which file, which rungs, whether it was redrawn, and
    // what the gallery sorts it as. The folder is the same on all ten rows, so
    // the FILENAME is the part that carries this row's identity and the part
    // that is not grey.
    '<p class="file"><span class="path"><span class="dir">' + esc(dir) +
    '</span><span class="fn">' + esc(fileName) + "</span></span> " +
    (m.widths.length
      ? '<span class="w">· širine: ' + m.widths.join(", ") + "</span>"
      : '<span class="w">· ena širina</span>') +
    // An enhanced picture is a REDRAWN one, and the person editing this
    // catalogue is entitled to know which those are without having to remember
    // the day it was uploaded. It is a disclosure, so it is not grey filler.
    (m.enhanced ? ' <span class="ai">· 2K (obdelano z UI)</span>' : "") +
    // The kind of shot, because the gallery is sorted by it and an order whose
    // rule is invisible reads as an arbitrary one.
    (kind ? ' <span class="kind">· ' + esc(kind) + "</span>" : "") +
    "</p>" +
    // Two forms, one row of buttons. A button carries the id of the form it
    // submits, which is what lets Shrani and Izbriši sit side by side without
    // nesting forms (illegal) or putting a destructive action inside the form
    // that saves.
    '<form class="fields" id="u-' + id + '" method="post" action="' +
    esc(base) + '/update">' +
    '<input type="hidden" name="id" value="' + id + '">' +
    '<div class="fhead"><label for="a-' + id + '">Opis slike</label>' +
    // The badge marks the row the storefront actually shows. It used to sit on
    // the picture; on a 132px thumbnail the word would not fit, and beside the
    // field label it is on the line the eye is already reading.
    (lead ? '<span class="badge">Glavna</span>' : "") +
    "</div>" +
    '<input id="a-' + id + '" type="text" name="alt" ' +
    'value="' + esc(m.alt) + '" maxlength="180" required>' +
    "</form>" +
    '<form class="gone" id="d-' + id + '" method="post" action="' +
    esc(base) + '/delete" ' +
    // ⚠️ THE CONFIRMATION NAMES THE PHOTOGRAPH. Ten rows carry ten buttons
    // reading "Izbriši" and this dialog used to read "Izbrišem to
    // fotografijo?" — which is true of all ten of them and identifies none.
    // Same reasoning, and the same JSON.stringify quoting, as Izbriši vse.
    "onsubmit=\"return confirm(" +
    esc(JSON.stringify(
      "Izbrišem to fotografijo?\n\n" + fileName + "\n" + m.alt +
      "\n\nTega ni mogoče razveljaviti.",
    )) + ")\">" +
    '<input type="hidden" name="id" value="' + id + '">' +
    "</form>" +
    '<div class="acts">' +
    // "Vrstni red" beside its box rather than above it: stacked, the label cost
    // every one of these rows 18px of height for one word.
    '<span class="num"><label for="s-' + id + '">Vrstni red</label>' +
    '<input id="s-' + id + '" type="number" name="sort" form="u-' +
    id + '" value="' + String(m.sort) + '" min="0" max="99"></span>' +
    // ⚠️ THE ACCESSIBLE NAME SAYS WHICH ROW, and the aria-label goes BEFORE
    // form= because panel.test pins that attribute against the button text.
    // Ten buttons all announced as "Shrani" leave a screen-reader user with no
    // way to tell which photograph they are about to delete.
    '<button class="btn btn--ghost btn--sm" type="submit" ' +
    'aria-label="Shrani — ' + esc(fileName) + '" form="u-' +
    id + '">Shrani</button>' +
    '<button class="btn btn--danger btn--sm" type="submit" ' +
    'aria-label="Izbriši — ' + esc(fileName) + '" form="d-' +
    id + '">Izbriši</button>' +
    "</div></li>"
  );
}

/** "Brez fotografij." / "1 fotografija." / "10 fotografij. Vrstni red …" */
function ledeCount(n: number): string {
  const c = photoCount(n);
  return (
    c.charAt(0).toUpperCase() + c.slice(1) +
    (n > 1 ? ". Vrstni red določa številka; najmanjša je glavna." : ".")
  );
}

export function modelPage(
  shop: string,
  slug: string,
  name: string,
  media: MediaView[],
  notice?: { kind: "ok" | "err"; text: string },
  who = "",
  enhance = false,
  describe = false,
): string {
  const base = "/admin/" + shop + "/" + slug;
  // The badge marks whichever row sorts first, because that is the one the
  // storefront actually shows — not simply the one uploaded first.
  const leadId = media.length > 0 ? media[0]!.id : "";

  return shell(
    name,
    noticeHtml(notice) +
      '<a class="back" href="/admin">← Vsi modeli</a>' +
      '<div class="head"><h1>' + esc(name) + "</h1>" +
      // ⚠️ A SENTENCE THAT STARTS WITH A COUNT STILL STARTS A SENTENCE. This
      // read "brez fotografij. Vrstni red določa številka…" on every model
      // with nothing in it — lower case, mid-thought, and then advice about
      // ordering a set that does not exist. The count is capitalised, and the
      // rule about ordering is only stated when there is more than one thing
      // to order.
      '<p class="lede">' + ledeCount(media.length) + "</p></div>" +

      "<h2>Nova fotografija</h2>" +
      // THE WHOLE CARD IS A FILE PICKER AND A PROGRESS BAR.
      //
      // It used to be a picker plus one description field per chosen file, and
      // that was the wrong shape for what this panel is for. Ten photographs
      // meant ten sentences before the button would work; the field was
      // required, so the browser refused the upload before any script ran; and
      // the descriptions collected that way were the same sentence pasted ten
      // times, which is worth nothing to a screen reader and nothing to image
      // search.
      //
      // So nothing is asked for here. Choose the files and they go: converted
      // to WebP in the browser, upscaled if a key is set, described by the
      // server from the picture it just received, and named after that
      // description. Every one of those is a thing the machine can do without
      // being told. What the operator DOES get is the list below, where every
      // photograph's description is an ordinary editable field — review after
      // the fact, which is the only place review was ever going to happen.
      '<form class="card" method="post" action="' + esc(base) +
      '/upload" enctype="multipart/form-data" id="up"' +
      // The upscaler is the one thing the BROWSER still has to know about:
      // it runs before the width ladder is drawn, so the client has to make
      // that call. The describer moved to the server and needs no flag here.
      (enhance ? ' data-enhance="on"' : "") + ">" +
      '<div class="up up--solo">' +

      '<div class="drop" id="drop">' +
      '<img id="prev" alt="" width="400" height="300">' +
      '<label for="f">Slike (JPEG, PNG, WebP)</label>' +
      // accept is a HINT to the file picker, not a guarantee — the server reads
      // the magic bytes — but narrowing it stops an operator choosing a 6 MB
      // JPEG and only learning it is refused after the upload.
      '<input id="f" name="file" type="file" multiple ' +
      'accept="image/jpeg,image/png,image/webp">' +
      '<p class="fmeta" id="fmeta">Slike lahko tudi povlečete sem — ' +
      "izberete jih lahko več hkrati. Nalaganje se začne samo.</p>" +
      "</div>" +

      '<div class="side">' +
      // ⚠️ THE RUN'S STATE SITS ABOVE THE LIST IT SUMMARISES.
      //
      // It used to sit below. Ten files make the list six hundred pixels tall,
      // so the bar that says how far through the set we are, and the line that
      // says which picture failed, were both off the bottom of the card while
      // the operator watched the rows. The one thing that answers "how long is
      // this going to take" was the one thing they could not see.
      //
      // role="status" because it is a live region now: the text changes
      // without a page load, and a screen-reader user was told none of it.
      '<div class="runst"><progress id="pr" max="100" value="0" hidden ' +
      'aria-label="Napredek nalaganja"></progress>' +
      '<p class="stline" id="stwrap" role="status"><span id="st"></span></p></div>' +
      // The chosen files, as thumbnails with a line of status each. No fields:
      // there is nothing here to fill in.
      '<ul class="picked" id="picked"></ul>' +
      // Without script nothing starts by itself, so the button is the whole
      // upload; with script it is a fallback nobody needs to press.
      '<p id="gowrap"><button class="btn" type="submit" id="go">Naloži</button></p>' +
      // The two disclosures. Neither is a control — they are what an operator
      // has to know to judge what came out the other end.
      (enhance
        ? '<p class="note-ai">Slike se samodejno izboljšajo na 2K. ' +
          "Sliko na novo nariše umetna inteligenca — po nalaganju jo poglejte, " +
          "podrobnosti izdelka se lahko spremenijo.</p>"
        : "") +
      (describe
        ? '<p class="note-ai">Opis in ime datoteke napiše umetna inteligenca ' +
          "iz same slike. Oboje lahko popravite spodaj.</p>"
        : '<p class="note-ai">Samodejnih opisov ni: nastavljen ni ' +
          "GEMINI_API_KEY. Zapišemo ime modela; opis popravite spodaj.</p>") +
      "</div>" +

      "</div></form>" +

      '<div class="head-row"><h2>Fotografije</h2>' +
      // ONE CLICK TO CLEAR A MODEL, and a confirmation that says what it will
      // cost rather than "are you sure?".
      //
      // Replacing a set meant deleting nine photographs one at a time, nine
      // confirmations and nine page loads deep. This is that, once.
      //
      // ⚠️ IT ONLY EXISTS WHEN THERE IS SOMETHING TO DELETE. A destructive
      // control on an empty list is a control whose only possible outcome is
      // an accident.
      //
      // The count travels with the form so the server can refuse a stale tab:
      // see the delete-all handler, which re-reads the set and does nothing if
      // it has changed. And the confirmation names the model and the number,
      // because the muscle memory that clears a dialog reading "Are you sure?"
      // is exactly the memory this needs to interrupt.
      (media.length === 0
        ? ""
        : '<div class="head-acts">' +
          '<form class="arrange" method="post" action="' + esc(base) + '/arrange">' +
          '<button class="btn btn--ghost btn--sm" type="submit"' +
          (describe ? "" : " disabled") + ">Razvrsti z UI</button>" +
          "</form>" +
          '<form class="clear-all" method="post" action="' + esc(base) + '/delete-all" ' +
          // ⚠️ JSON.stringify, NOT hand-rolled quoting. The message is a JS
          // string literal inside an HTML attribute, so it has to survive two
          // parsers. esc() escapes < > & and the double quote — but NOT the
          // apostrophe, so a single-quoted literal built by hand ends early on
          // any name containing one, and a backslash would start an escape
          // sequence nobody intended. JSON.stringify produces a correct
          // double-quoted literal for all of it, including the line breaks,
          // and esc() then makes it safe as an attribute value.
          "onsubmit=\"return confirm(" +
          esc(JSON.stringify(
            "Izbrišem VSE fotografije modela " + name + " (" + photoCount(media.length) + ")?" +
            "\n\nTega ni mogoče razveljaviti.",
          )) + ")\">" +
          '<input type="hidden" name="count" value="' + String(media.length) + '">' +
          '<button class="btn btn--danger btn--sm" type="submit">Izbriši vse</button>' +
          "</form></div>") +
      "</div>" +
      // ⚠️ SAY WHEN THIS REACHES THE SHOP, because it is not now.
      //
      // The storefront renders a generated index rather than querying the
      // database: handleRequest is synchronous and takes no env, so a round
      // trip inside it is a different architecture, not a refactor. The index
      // is rebuilt at deploy time. That is a defensible trade and it was
      // written down — in a source comment, where the person deleting a
      // photograph will never see it. They deleted one, watched the shop keep
      // showing it, and reasonably concluded the panel was broken.
      //
      // A tool that does something other than what it appears to do owes the
      // person using it a sentence.
      '<p class="note-ai">Spremembe se v trgovini pokažejo po naslednji ' +
      "objavi strani, ne takoj. Fotografije so tu shranjene takoj — trgovina " +
      "pa svoj seznam slik zgradi ob objavi.</p>" +
      (media.length === 0
        ? '<div class="card"><p class="empty">Ta model še nima fotografij. ' +
          "Do takrat trgovina prikaže risbo izdelka.</p></div>"
        : '<ul class="shots">' +
          media
            .map((m) => shotRow(base, m, m.id === leadId))
            .join("") +
          "</ul>") +
      "<script>" + UPLOAD_JS + "</script>",
    who,
  );
}

/**
 * Convert to WebP in the browser, at several widths, before uploading.
 *
 * WHY HERE AND NOT ON THE SERVER. Supabase's server-side image transformation
 * is a paid feature and this project is on the free plan; Cloudflare's image
 * resizing is not available on a workers.dev host either. A Worker has no
 * image encoder of its own — there is no runtime API to re-encode a JPEG — so
 * the only place a conversion can happen without adding a paid service is the
 * browser that already has the file decoded.
 *
 * It is also the better place. The bytes that cross the network are already
 * WebP and already the right size, so a 6 MB phone photograph never travels at
 * all, and the same width ladder the bundled imagery uses gets built for free
 * — which is what lets the storefront emit a real srcset for uploads.
 *
 * WITHOUT SCRIPT the form still submits, and the server refuses anything that
 * is not already WebP. That is a stated limitation on the form rather than a
 * silent one, and it is why the preview and the drag-and-drop below are
 * additions to a working form rather than the way it works.
 */
/* THE SMART UPLOADER'S SCRIPT — the router in front of the single-slot
   pipeline. Shares its moves with UPLOAD_JS (decode, WebP-verified encode,
   centre-crop to the slot's frame, the guarded upscale) but not its DOM:
   that script is married to the one-form page, and marrying it to two would
   couple every future change to both. The duplication is ~60 lines of
   canvas code and is priced in. */
const SMART_JS = `
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

  /* Centre-crop to the slot's shape, capped at its width — the same cut the
     single-slot page makes, so the two roads store the same picture. */
  function drawSlot(bmp, ar, maxW, exact){
    var sw = bmp.width || bmp.naturalWidth, sh = bmp.height || bmp.naturalHeight;
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
    /* ⚠️ NO CHECKBOX MEANS NO UPSCALE, and the colour zones deliberately
       have none. The enhancer REDRAWS a picture larger, and on a marbled
       acrylic sample that is not a sharper photograph of the colour — it is
       a new pattern in roughly that colour. A swatch is the one slot on this
       site where "not necessarily the same photograph any more" is a wrong
       answer rather than a trade-off. They also cap at 400px, so there is
       almost nothing to gain. */
    if (!ai || !ai.checked || !(srcW < maxW)) return Promise.resolve({ f: f, up: false });
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
            return drawSlot(bmp2, ar, it.max || 2048, it.exact);
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
        say("Razporejenih " + done + " od " + fs.length +
          (up ? " · " + up + " povečanih z AI" : "") +
          (skipped ? " · " + skipped + " brez mesta" : "") +
          ". Slike so na strani v nekaj minutah.", done ? "ok" : "bad");
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

const UPLOAD_JS = `
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
