/**
 * /admin/site-sort — the smart uploader's endpoint, POST only.
 *
 * The largest single handler in the panel, and the one that most wanted its
 * own file: it takes a batch of photographs, classifies each against the
 * site's slots and the colour catalogue, and answers JSON the browser draws
 * progress from. It was 198 lines in the middle of a router.
 */

import { FinishKind } from "../../catalog/finish-image";
import { assignSlots, classify, slotOptions } from "../assign";
import { ensureFinish, nameFromFilename } from "../finishes";
import { looksLikeColourName, nameColour, nameColourAvailable, uniqueColourName } from "../name-colour";
import { stemOf } from "../site-images";
import { Api } from "../supabase";
import type { AdminCtx } from "./ctx";
import { json, page, seeOther } from "./ctx";

export async function handle(c: AdminCtx): Promise<Response | null> {
  const { admin, api, env, parts, request, shopKey, url } = c;
  // The surface owns its own guard — see the note in blog.ts on what
  // extracting a branch without its condition did the first time.
  if (parts[1] !== "site-sort" || request.method !== "POST") return null;
    const form = await request.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length === 0) return json({ error: "Ni slik." }, 400);

    // WHICH CATALOGUE, read first because it sets the batch ceiling. Default
    // is the whole site — the flow this endpoint was built for.
    // "barva"/"obloga" narrow it to one colour list, which is a different and
    // much easier question: sixteen near-identical slot notes inside a
    // 46-option prompt is not a catalogue a model can choose from, and the
    // owner drops the colour samples as their own batch anyway.
    const scope = form.get("scope");
    const kind: FinishKind | null =
      scope === "barva" ? "barva" : scope === "obloga" ? "obloga" : null;

    // A ceiling, said plainly: the site has seventeen slots, and a batch of
    // fifty is either a mistake or the product catalogue, which has its own
    // uploader.
    //
    // ⚠️ THE COLOUR CEILING IS HIGHER BECAUSE THE COST IS LOWER. Twenty is
    // sized for the classifier — one Gemini round trip per picture. A colour
    // drop makes no model call at all (the name is the filename), so the only
    // cost is the bytes, which the two size caps below already bound. The
    // owner's instruction was to drop ALL the colours at once, and a
    // supplier's chart is not obliged to stop at twenty.
    const cap = kind ? 60 : 20;
    if (files.length > cap) {
      return json({ error: "Največ " + cap + " slik naenkrat." }, 400);
    }
    // The shipped client sends ~200 KB probes; the server cannot rely on
    // that, and each file is base64d into a Gemini payload. Per-file and
    // whole-batch caps keep a direct caller from buffering the isolate out.
    if (files.some((f) => f.size > 4 * 1024 * 1024)) {
      return json({ error: "Posamezna slika za razvrščanje sme meriti do 4 MB." }, 413);
    }
    if (files.reduce((n, f) => n + f.size, 0) > 24 * 1024 * 1024) {
      return json({ error: "Celoten izbor sme meriti do 24 MB." }, 413);
    }

    // THE FILENAMES, sent alongside because the probes are not the originals.
    // The client downsamples each picture to a ~200 KB JPEG before posting,
    // and names those p0.jpg…pN.jpg so the server can answer by position — so
    // the one piece of evidence that settles most of a colour drop outright
    // has to travel separately. Positional, same length as `files`, and only
    // read when a colour list is in play.
    const names = form.getAll("names").map((v) => (typeof v === "string" ? v : ""));

    // ⚠️ A COLOUR DROP IS NOT A CLASSIFICATION PROBLEM ANY MORE.
    //
    // It used to be: a fixed list of transcribed names, and the job was to
    // decide which of them each photograph belonged to — filename first, then
    // a model looking at a marbled acrylic and guessing which trade name it
    // was, which is a question nobody in this repository can answer.
    //
    // The list now comes FROM the photographs, so there is nothing to guess.
    // The file is called "Oyster Opal.jpg" because the operator named it after
    // the chart, and that IS the colour's name. No network call, no
    // confidence rating, no proposal to confirm — and, importantly, no
    // invented trade name, which is the one thing catalog/pola.ts is emphatic
    // that this project must never produce.
    //
    // A file whose name folds to nothing is simply refused, with the reason
    // said plainly: rename it after the colour and drop it again.
    if (kind) {
      const api: Api = { env, token: admin.token };

      // ⚠️ THE FILENAME FIRST, THE MODEL ONLY WHERE IT CARRIES NOTHING.
      //
      // Somebody who names a file "Oyster Opal.jpg" is reading the
      // manufacturer's chart, and this code is not: their name is better than
      // any description a model can give and is kept untouched. The model is
      // asked about "Screenshot 2026-08-28 at 10.20.46" and its like — which
      // is what actually landed here, six times, and put six screenshot
      // filenames on the product pages as colour names.
      //
      // What comes back is a DESCRIPTION of the pixels, never a guess at a
      // trade name; admin/name-colour.ts says why that line is drawn where it
      // is. When the model is unreachable the filename stands, which is the
      // behaviour this replaces.
      //
      // ⚠️ WHERE EACH NAME CAME FROM IS CARRIED, NOT RE-DERIVED. The first
      // version inferred it — "the filename was junk, so the model must have
      // named it" — which reports "po odtenku na sliki" for a colour the
      // model failed on and that fell back to the junk filename anyway. That
      // is the silent no-op again, this time wearing a label that says it
      // worked. The source travels with the name.
      const proposed: { name: string; from: "file" | "model" | "failed" }[] =
        files.map((_, i) => {
          const fromFile = nameFromFilename(names[i] ?? "");
          return looksLikeColourName(fromFile)
            ? { name: fromFile, from: "file" as const }
            : { name: "", from: "failed" as const };
        });

      // ⚠️ FOUR AT A TIME, NOT SIXTY IN A ROW. The colour ceiling is 60 files
      // because a colour drop was a pure filename read and cost no round
      // trip; naming makes each unnamed file one. Sixty sequential model
      // calls is a minute of wall clock inside one request and sixty
      // subrequests before a single row is written — an isolate limit, not a
      // slow page. Four at a time keeps the whole batch to about fifteen
      // rounds and leaves subrequest headroom for the writes that follow.
      const need = proposed.map((p, i) => (p.name === "" ? i : -1)).filter((i) => i >= 0);
      for (let k = 0; k < need.length; k += 4) {
        const slice = need.slice(k, k + 4);
        const got = await Promise.all(
          slice.map(async (i) => {
            const f = files[i]!;
            try {
              return await nameColour(env, await f.arrayBuffer(), f.type || "image/jpeg", kind);
            } catch {
              return null;
            }
          }),
        );
        slice.forEach((i, j) => {
          const answer = got[j];
          // The filename is still the fallback — it is a poor name, not no
          // name — but the row says so, so a screenshot name never arrives
          // claiming the model chose it.
          proposed[i] = answer
            ? { name: answer, from: "model" }
            : { name: nameFromFilename(names[i] ?? ""), from: "failed" };
        });
      }

      // Names claimed earlier in this same drop. Two greys both described as
      // "Temno siva" fold to one slug and the second overwrites the first —
      // one colour where the operator uploaded two.
      const taken = new Set<string>();
      const items = [];
      const modelOff = !nameColourAvailable(env);
      for (let i = 0; i < files.length; i++) {
        const raw = proposed[i]?.name ?? "";
        const from = proposed[i]?.from ?? "failed";
        const name = raw === "" ? "" : uniqueColourName(raw, taken);
        if (name !== "") taken.add(name.trim().toLowerCase());
        const finish = name === "" ? null : await ensureFinish(api, shopKey, kind, name);
        items.push(
          finish
            ? {
                i,
                stem: kind + "-" + finish.slug,
                label: finish.name,
                ar: "1:1",
                max: 400,
                exact: true,
                // Which road the name came down, because an operator who sees
                // a name they did not write should be told who wrote it.
                reason:
                  from === "model"
                    ? 'Barva "' + finish.name + '" po odtenku na sliki.'
                    : from === "file"
                      ? 'Barva "' + finish.name + '" po imenu datoteke.'
                      : 'Ime "' + finish.name + '" je iz imena datoteke — ' +
                        (modelOff
                          ? "samodejno poimenovanje ni nastavljeno."
                          : "barve ni bilo mogoče prepoznati na sliki.") +
                        " Popravite ga na strani Barve." }
            : {
                i,
                stem: null,
                label: null,
                ar: null,
                max: null,
                exact: false,
                reason: "Imena barve ni bilo mogoče določiti — ne iz imena " +
                  "datoteke ne iz same slike. Datoteko poimenujte po barvi " +
                  "(npr. »Oyster Opal.jpg«) in poskusite znova." },
        );
      }
      return json({ items });
    }

    const options = slotOptions();
    const classified: (Awaited<ReturnType<typeof classify>>)[] = [];
    const deadModels = new Set<string>();
    for (let i = 0; i < files.length; i++) {
      classified.push(
        await classify(
          env,
          await files[i]!.arrayBuffer(),
          files[i]!.type || "image/jpeg",
          options,
          deadModels,
        ),
      );
    }
    const assigned = assignSlots(classified, options);
    return json({
      items: assigned.map((a, i) => ({
        i,
        stem: a.slot ? stemOf(a.slot.key) : null,
        label: a.slot ? a.slot.label : null,
        ar: a.slot?.ratio ? a.slot.ratio[0] + ":" + a.slot.ratio[1] : null,
        max: a.slot ? a.slot.maxWidth : null,
        exact: a.slot?.exact === true,
        reason: a.reason })) });
  return null;
}
