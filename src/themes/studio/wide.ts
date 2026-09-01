/**
 * STUDIO — WHAT A BIG SCREEN GETS.
 *
 * ⚠️ THIS FILE IS CONCATENATED LAST, AND THAT IS ITS WHOLE ARCHITECTURE.
 *
 * The rules here are the final word on width, and they have to be able to
 * outrank a declaration made anywhere else in the theme. A media query adds
 * NO SPECIFICITY — this cost a full round: the first version of the page
 * block lived 1600 lines into page.ts, and `.st-enq-lead`, declared further
 * down the same file, simply won on source order. Prose on /primerjava
 * widened and prose on /kontakt did not, from one rule that looked correct.
 *
 * Living at the end of page.ts fixed it and left a booby trap: anything ever
 * appended to that file would silently break it again. A module that is last
 * in STUDIO_CSS cannot be undercut by accident, and it puts every wide-screen
 * decision in one place instead of eight media queries in eight files.
 *
 * ⚠️ WHAT BELONGS HERE: a width or a type size that only applies above the
 * desktop tier. NOT colour, NOT spacing rhythm, NOT anything a section module
 * can express itself. If a rule here is fighting a module rather than
 * extending it, the module is wrong and this is the wrong place to fix it.
 *
 * ---------------------------------------------------------------------------
 * THE SHAPE OF THE PROBLEM, MEASURED, BECAUSE IT WAS REPORTED FIVE TIMES
 *
 * "The site does not use the width of the screen." Every previous round read
 * that as a measure problem and widened a measure. It was three problems
 * stacked, and each round fixed the innermost one it could see:
 *
 *   1. THE BAND.  --studio-container was a constant 1560px, so above a
 *      1640px viewport the page simply stopped growing: 85% of a 1920 screen,
 *      64% of a 2560 one. Fixed in tokens.ts's wide tier — see the note there.
 *   2. THE MEASURE.  Running text is capped in rem while --t-body was a fixed
 *      16px, so widening a column could only ever mean LONGER LINES. Fixed by
 *      scaling the two together, which spends nothing: 38rem/16px, 60rem/20px
 *      and 72rem/24px are all ~88 characters. A big screen gets bigger type
 *      AND a fuller page, which is what a big screen should get anyway.
 *   3. THE STRUCTURE.  Lists, panels and option rows had inherited caps meant
 *      for sentences. A rule is not prose and does not have a measure.
 *
 * Rungs rather than a clamp because --t-body is consumed by dozens of
 * components whose own paddings are absolute; three tested steps are
 * verifiable and a continuous function is not.
 */
export const STUDIO_WIDE_CSS = `
  /* ================= §9 The wide tier ================= */

  /* ---- Rung one: 1400 and up -------------------------------------------
   *
   * --wide-measure is the reading measure at this rung and --t-body the size
   * it is set at. They move TOGETHER, which is the fix the first four rounds
   * were missing: 38rem/16px, 60rem/20px, 66rem/22px and 72rem/24px are all
   * about 88 characters a line, because this face draws ~0.543em per
   * character. So the column grows and the line does not.
   *
   *          measure   size   px     characters
   *   base     38rem   16px   608           ~70
   *   ≥1400    60rem   20px   960           ~88
   *   ≥1920    66rem   22px  1056           ~88
   *   ≥2400    72rem   24px  1152           ~88
   *
   * ⚠️ IT STARTS AT 1400, NOT AT THE BAND'S 1640. Below 1400 the band is the
   * viewport and there is no void to fix; between 1400 and 1640 the band is
   * still growing toward its old 1560 cap and the page wants the measure
   * before it wants the extra millimetre of gutter. The two tiers are
   * deliberately not the same breakpoint and neither depends on the other.
   *
   * ⚠️ 24px BODY TEXT AT THE TOP RUNG IS NOT A TYPO. It is the size a 2400px
   * layout has to set at for a paragraph to be a column rather than a ribbon,
   * and it is read from further away than a laptop. Re-measure the character
   * figure if the body face changes; every number above depends on it.
   *
   * ⚠️ THE TYPE BUMP GOES ON PROSE ROOTS, NOT ON .st-shop OR :root. --t-body
   * across the whole shop section would resize every product card's name,
   * meta and price along with the sentences, and a card is a fixed
   * composition around a photograph. .st-shop-head and .st-hub-outro contain
   * nothing but prose, which is why they are named rather than their parent. */
  @media (min-width: 1400px) {
    :root[data-theme="studio"] .st-page,
    :root[data-theme="studio"] .st-fnd,
    :root[data-theme="studio"] .st-shop-head,
    :root[data-theme="studio"] .st-hub-outro {
      --wide-measure: 60rem;
      --t-body: 20px;
      --t-lead: 24px;
    }

    /* THE DOCUMENT PAGES.
     *
     * ⚠️ THE MEASURE IS SET TWICE AND OVERRIDING EITHER ALONE DOES NOTHING.
     * page.ts caps .st-page-block at 38rem AND caps .st-page-p, .st-page-a,
     * .st-page-step-p and .st-page-li at 38rem each. Three rounds of this
     * looked like the same bug because each one lifted one of the two.
     *
     * ⚠️ AND :not(--wide), because an earlier attempt capped the comparison
     * table along with the sentences. A --wide block is a table, a figure or
     * a gallery; it takes the whole band.
     *
     * TWO-COLUMN TEXT WAS TRIED AND REJECTED. CSS columns split each block
     * mid-paragraph: "Globina in vstop" rendered its heading in the left
     * column with its own first sentence continuing at the top of the right
     * one. The reading order was unrecoverable. */
    :root[data-theme="studio"] .st-page-block:not(.st-page-block--wide),
    :root[data-theme="studio"] .st-page-p,
    :root[data-theme="studio"] .st-page-a,
    :root[data-theme="studio"] .st-page-step-p,
    :root[data-theme="studio"] .st-page-li,
    :root[data-theme="studio"] .st-page-list,
    :root[data-theme="studio"] .st-page-lead,
    /* The closing panel's two lines carry the same 38rem and would otherwise
     * sit visibly narrower than the prose above them. */
    :root[data-theme="studio"] .st-page-cta-h,
    :root[data-theme="studio"] .st-page-cta-p,
    /* The enquiry lead lands on the measure too, which is the number the form
     * below takes — so the heading, the lead-in and the form share one right
     * edge. ⚠️ AND THE FORM IS ON THIS LIST, which the note in page.ts
     * claimed was already true and was not: .st-enq carries its own 44rem, so
     * at the old 60rem block cap the lead ran to 960 and the form stopped at
     * 704. The rows are two-up, so a field is half of whatever this is — at
     * the top rung about 560px, which is the same proportion the 44rem cap
     * gave at the base measure. */
    :root[data-theme="studio"] .st-enq-lead,
    :root[data-theme="studio"] .st-page-block--wide:has(> .st-enq),
    :root[data-theme="studio"] .st-enq,
    /* The collection and hub standfirst — one half of a two-column head, so
     * at 2560 it was a 640px paragraph running twelve lines down a 1160px
     * column. */
    :root[data-theme="studio"] .st-shop-intro {
      max-inline-size: var(--wide-measure);
    }
    /* A rung tighter, and the ratios are the ones these already had: 0.9 is
     * 34rem/38rem to three places, 0.79 is 30rem/38rem. The quiet devices
     * stay quieter than the prose they sit under rather than collapsing onto
     * one number. */
    :root[data-theme="studio"] .st-page-chosen,
    :root[data-theme="studio"] .st-fnd-skip > p,
    :root[data-theme="studio"] .st-fnd-more,
    :root[data-theme="studio"] .st-fnd-visit,
    :root[data-theme="studio"] .st-fnd-notes .st-fnd-note,
    :root[data-theme="studio"] .st-hub-outro-sec > * {
      max-inline-size: calc(var(--wide-measure) * 0.9);
    }
    :root[data-theme="studio"] .st-fnd h1,
    :root[data-theme="studio"] .st-fnd-lead,
    :root[data-theme="studio"] .st-fnd-why {
      max-inline-size: var(--wide-measure);
    }
    :root[data-theme="studio"] .st-fnd-opt b + span {
      max-inline-size: calc(var(--wide-measure) * 0.79);
    }

    /* ⚠️ THE BODY TRACK, WHICH IS THE OTHER HALF OF THE BLOCK CAP. page.ts
     * gives a page with nothing wide on it a fixed 38rem body column so the
     * grid box cannot grow past its own text — right, and stated in the old
     * measure. Left alone it pins /piskotki and /vodniki at 608px while the
     * block cap above says 1152, and the page is narrow again for a reason
     * nothing in this file explains. Same selectors as page.ts so the
     * specificity matches and source order settles it. */
    :root[data-theme="studio"] .st-page-grid:not(:has(.st-page-block--wide)) {
      grid-template-columns: minmax(0, 16rem) minmax(0, var(--wide-measure));
    }
    :root[data-theme="studio"] .st-page-grid--solo:not(:has(.st-page-block--wide)) {
      grid-template-columns: minmax(0, var(--wide-measure));
    }

    /* ROWS THAT CARRY A LABEL AND A VALUE.
     *
     * Every one of these is a label column plus a value column, and every one
     * had the value column written as a fixed 38rem — the base reading
     * measure, spelled out again inside a component. So the block around them
     * grew and the rows inside it did not: on /kontakt at 2560 the contact
     * tiles and the imprint spanned the band while "Kaj je v ponudbi" and
     * "Kaj sledi", directly between them, stopped 350px short. Two right
     * edges on one page reads as breakage even when neither is wrong.
     *
     * 1fr rather than the measure, because the block ALREADY caps at the
     * measure: the value column filling what is left of it cannot produce a
     * longer line than the paragraphs above it. One cap, in one place.
     *
     * ⚠️ THE STEPS' CONTAINER ONLY. page.ts puts the tracks on the <ol> and
     * gives each row "grid-template-columns: subgrid" so the title column is
     * sized by the longest title on the page rather than per row; restating
     * tracks on .st-page-step would overwrite that and put every paragraph
     * back on its own left edge. The row keeps its own tracks only where
     * subgrid does not exist, which is where they are still doing the job. */
    :root[data-theme="studio"] .st-page-frow {
      grid-template-columns: minmax(0, 12rem) minmax(0, 1fr);
    }
    :root[data-theme="studio"] .st-page-steps {
      grid-template-columns: auto fit-content(14rem) minmax(0, 1fr);
    }
    @supports not (grid-template-columns: subgrid) {
      :root[data-theme="studio"] .st-page-step {
        grid-template-columns: auto fit-content(14rem) minmax(0, 1fr);
      }
    }

  }

  /* ---- Rung two: 1920 and up ------------------------------------------- */
  @media (min-width: 1920px) {
    :root[data-theme="studio"] .st-page,
    :root[data-theme="studio"] .st-fnd,
    :root[data-theme="studio"] .st-shop-head,
    :root[data-theme="studio"] .st-hub-outro {
      --wide-measure: 66rem;
      --t-body: 22px;
      --t-lead: 26px;
    }
  }

  /* ---- Rung three: 2400 and up -----------------------------------------
   *
   * /izbira's model list earns a third column here: it sits in .st-fnd-in,
   * which is the whole band, so three tracks are ~730px each. Its two-column
   * rule is NOT here — it engages at 1100, where the arithmetic says two rows
   * fit, and lives beside the list in finder.ts with the reasoning.
   *
   * ⚠️ THE FAQ DOES NOT, AND THE ATTEMPT IS RECORDED BECAUSE IT LOOKS RIGHT.
   * The questions are independent, so columns would break no reading order —
   * but .st-page-qa is inside a plain block, and a plain block caps at the
   * MEASURE rather than at the band (isWide() lists steps and cta and
   * deliberately omits Q&A: a question and its answer are two paragraphs).
   * Two columns of 1152 is two columns of 556, which at 24px body is about 42
   * characters — narrower than what it replaced, which is the exact fault
   * this file exists to remove. A column count has to be read against the
   * container that survives, not the one on the screen. */
  @media (min-width: 2400px) {
    :root[data-theme="studio"] .st-page,
    :root[data-theme="studio"] .st-fnd,
    :root[data-theme="studio"] .st-shop-head,
    :root[data-theme="studio"] .st-hub-outro {
      --wide-measure: 72rem;
      --t-body: 24px;
      --t-lead: 28px;
    }
    :root[data-theme="studio"] .st-fnd-list {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
`;
