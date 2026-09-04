/**
 * THE ADMIN'S DESIGN LAYER: one stylesheet, one document wrapper, one nav.
 *
 * Deliberately NOT the studio theme — this is a back office, and a tool that
 * dresses up as its own shopfront invites people to treat it as a page to
 * design. System fonts, no imagery but the photographs themselves, one pass,
 * no framework.
 *
 * It shares the shop's VOCABULARY and only that: the mark from
 * themes/studio/brand.ts, the same near-black ink, the same two radii. The
 * greys are the studio theme's own tokens rather than new ones, and that
 * matters beyond taste — those values carry computed contrast ratios
 * (--ink-mute is 5.17:1 on white and 4.54:1 on the panel grey, both above the
 * 4.5:1 AA floor the European Accessibility Act makes a legal requirement
 * here). A fresh grey is a fresh ratio nobody checked.
 *
 * Controls are 44px tall and never smaller than 24x24 (WCAG 2.2 SC 2.5.8),
 * every focusable thing has a visible focus ring, and every hover transition
 * is dropped under prefers-reduced-motion.
 *
 * ⚠️ SEPARATED FROM THE PAGES ON PURPOSE. This is the vocabulary every
 * surface is drawn in; the surfaces are what gets added to. Kept in one file
 * with them, a stylesheet 440 lines long sits above every page anyone opens
 * to edit, and the rules above get scrolled past rather than read.
 *
 * Extracted from panel.ts unchanged, byte for byte.
 */

import { esc } from "../render/sections";

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

/* ---- chrome: sidebar + topbar ----------------------------------------
   Ported from the chassis repo's admin (components/admin/layout). Its
   geometry is stated there as named constants and is reproduced here
   exactly, because the numbers are the design:

     ADMIN_SIDEBAR_WIDTH        256    the column, open
     ADMIN_SIDEBAR_MOBILE_WIDTH 280    the drawer, which is wider than the
                                       column because a thumb needs the room
     ADMIN_TOPBAR height        48 / 64 (mobile / md)
     ADMIN_CONTENT_MAX_PX       1400
     ADMIN_MOBILE_BREAKPOINT    768    below this the sidebar is a drawer
     ADMIN_GUTTER               16 / 24 / 40
     ADMIN_ROW regular          min-height 44, padding 12/10
     ADMIN_RADIUS               6      (rounded-md)

   ⚠️ THE DRAWER IS CSS ONLY. This panel already needs JavaScript for the
   image pipeline, and that is the one thing it may need it for — a menu
   that cannot open without a script is a back office nobody can navigate
   when the script fails. A checkbox drives it, the label is the button,
   and the whole thing works with scripting off. */

.shell{display:flex;min-height:100vh}

.top{position:fixed;top:0;left:0;right:0;z-index:30;height:48px;
  background:var(--ink);color:var(--card);display:flex;align-items:center;
  gap:12px;padding:0 16px}
@media (min-width:768px){.top{height:64px;padding:0 24px}}
.top :where(a,button):focus-visible{outline-color:var(--card)}

.home{display:inline-flex;align-items:center;gap:10px;min-height:44px;
  color:var(--card);text-decoration:none;font-weight:600;letter-spacing:.005em;
  white-space:nowrap}
.mark{width:22px;height:22px;display:block;flex:none}
.acct{display:flex;align-items:center;gap:12px;margin-left:auto;min-width:0}
.who{color:var(--on-dark-mute);font-size:13px;max-width:34ch;min-width:0;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.out{font:inherit;font-size:14px;min-height:36px;padding:7px 13px;cursor:pointer;
  background:transparent;color:var(--card);border:1px solid var(--on-dark-mute);
  border-radius:var(--r-ctrl)}
.out:hover{background:#2e2e2e}
/* ⚠️ THE WORD GOES, THE ACCOUNT STAYS. At 390 the bar cannot hold a burger,
   the brand, the account and the sign-out, and what gives way is the brand.
   The account is the half that has to stay legible: it is how somebody
   notices they are signed in as a colleague before they delete a colleague's
   photographs. The mark still links home and the link still announces its
   name; the phone simply does not print it.

   This rule was in the old top bar and I dropped it rebuilding the chrome —
   the e-mail came back as "jur…", which is the failure it exists to stop. */
@media (max-width:559px){
  .home span{position:absolute;width:1px;height:1px;margin:-1px;padding:0;
    border:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
  .home{min-width:44px;justify-content:center}
}

/* The drawer's switch. Off-screen, not display:none — a hidden input is not
   focusable, and the label that controls it has to be reachable by keyboard. */
.navsw{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;
  clip-path:inset(50%)}
.burger{display:inline-flex;align-items:center;justify-content:center;
  width:44px;height:44px;margin-left:-10px;cursor:pointer;color:var(--card);
  border-radius:var(--r-ctrl);flex:none}
.burger svg{width:20px;height:20px;display:block}
.navsw:focus-visible+.burger{outline:2px solid var(--card);outline-offset:2px}
@media (min-width:768px){.burger{display:none}}

.side{position:fixed;top:48px;bottom:0;left:0;width:280px;z-index:30;
  background:var(--card);border-right:1px solid var(--line);
  padding:16px 12px;overflow-y:auto;
  transform:translateX(-100%);transition:transform .18s ease}
.navsw:checked~.shell .side{transform:none}
.scrim{position:fixed;inset:48px 0 0;z-index:20;background:#15151566;
  opacity:0;pointer-events:none;transition:opacity .18s ease}
.navsw:checked~.shell .scrim{opacity:1;pointer-events:auto}
@media (prefers-reduced-motion:reduce){
  .side,.scrim{transition:none}
}
@media (min-width:768px){
  .side{top:64px;width:256px;transform:none;padding:20px 12px}
  .scrim{display:none}
}

/* The shop switcher, above the groups. Only rendered where there is more than
   one shop — see shell() — so these rules cost nothing on a single-shop
   panel. Full width because a shop name is long and a cramped select is how
   somebody switches to the wrong one. */
.shopsw{display:flex;flex-direction:column;gap:8px;margin:0 0 18px;
  padding:0 4px 16px;border-bottom:1px solid var(--line)}
.shopsw select{font:inherit;font-size:14px;min-height:44px;padding:10px 12px;
  width:100%;color:var(--ink-body);background:var(--card);
  border:1px solid var(--line-ctrl);border-radius:var(--r-ctrl)}
.shopsw button{font:inherit;font-size:14px;min-height:40px;padding:9px 14px;
  cursor:pointer;color:var(--card);background:var(--ink);border:0;
  border-radius:var(--r-ctrl)}
.shopsw button:hover{background:#2e2e2e}

.sidegrp{margin:0 0 18px}
.sidegrp:last-child{margin-bottom:0}
.sidegrp h2{font-size:11px;line-height:16px;letter-spacing:.09em;
  text-transform:uppercase;color:var(--mute);margin:0 0 6px;padding:0 12px;
  font-weight:600}
.side a{display:flex;align-items:center;gap:10px;min-height:44px;
  padding:10px 12px;border-radius:var(--r-ctrl);color:var(--ink-body);
  text-decoration:none;font-size:14px;line-height:20px}
.side a:hover{background:var(--paper)}
.side a[aria-current=page]{background:var(--ink);color:var(--card);
  font-weight:500}
.side svg{width:16px;height:16px;flex:none}

.main{flex:1;min-width:0;padding-top:48px}
@media (min-width:768px){.main{padding-top:64px;padding-left:256px}}
.wrap{max-width:1400px;margin:0 auto;padding:20px 16px 96px}
@media (min-width:640px){.wrap{padding:24px 24px 96px}}
@media (min-width:1024px){.wrap{padding:28px 40px 96px}}

/* Off the screen, still in the accessible name. */
.vh{position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;
  overflow:hidden;clip-path:inset(50%);white-space:nowrap}

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

export function doc(title: string, body: string): string {
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
/**
 * THE PANEL'S SECTIONS, IN THE ORDER THEY DESERVE ATTENTION.
 *
 * ⚠️ THIS LIST EXISTS BECAUSE THE PANEL HAD NO NAVIGATION AT ALL. The bar
 * carried a brand and a logout; everything else lived on one dashboard, and
 * getting from the colours to the enquiries meant going back and scrolling
 * past six sections. Every subpage's back-link also said "Nazaj na izdelke" —
 * back to PRODUCTS — which stopped being true the day the dashboard grew a
 * blog, then reviews, then enquiries, then colours.
 *
 * The order is by who is waiting. An enquiry is a person expecting an answer,
 * so it is first and it is first on the dashboard too. Photographs and posts
 * are the daily work. Colours, site pictures and reviews are set up once and
 * touched rarely.
 */
/**
 * THE SIDEBAR, IN GROUPS.
 *
 * Six flat links became three named groups, which is the chassis repo's own
 * arrangement and the reason its sidebar reads at a glance: a back office is
 * not a menu, it is a set of jobs, and "Katalog" tells somebody where to look
 * for a photograph without their having to read six labels first.
 *
 * The icon is a path in a 24-box, drawn inline — no sprite, no font, nothing
 * to load. Each is a stroke path so it inherits currentColor and turns white
 * on the active row without a second rule.
 */
export const NAV_GROUPS: readonly {
  readonly title: string;
  readonly items: readonly (readonly [string, string, string, string])[];
}[] = [
  {
    title: "Katalog",
    items: [
      ["izdelki", "/admin", "Modeli", "M4 7h16M4 12h16M4 17h10"],
      ["slike", "/admin/slike", "Slike strani", "M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5"],
      ["barve", "/admin/barve", "Barve", "M12 3a9 9 0 1 0 0 18h2a3 3 0 0 0 0-6h-1a2 2 0 0 1 0-4h2a4 4 0 0 0-3-8Z"],
    ],
  },
  {
    title: "Vsebina",
    items: [
      ["blog", "/admin/blog", "Blog", "M5 4h11l3 3v13H5zM8 10h8M8 14h6"],
      ["mnenja", "/admin/mnenja", "Mnenja", "M4 5h16v11H9l-5 4z"],
    ],
  },
  {
    title: "Stranke",
    items: [
      ["povprasevanja", "/admin/povprasevanja", "Povpraševanja", "M4 6h16v12H4zM4 7l8 6 8-6"],
    ],
  },
];

