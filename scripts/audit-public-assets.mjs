/**
 * Nothing in public/ may be a page.
 *
 * ⚠️ THIS DIRECTORY IS ROUTING, AND IT OUTRANKS THE WORKER. Cloudflare's
 * static-assets docs are explicit: "if a requested URL matches a file in the
 * static assets directory, that file will be served — without invoking Worker
 * code." So public/ answers on EVERY host this Worker is routed to, and the
 * Worker's host rules never run for those paths.
 *
 * For fonts and favicons that is the point. For anything HTML-shaped it is the
 * duplicate-host bug the tenant registry throws at import to prevent, let back
 * in through a directory nobody thinks of as routing: the shop's markup would
 * answer 200 on www and on both spellings of the alias domain, with no 301, no
 * canonical of its own and no noindex — the shop competing with a copy of
 * itself for its own head term, which is the thing aliasDomains exists to stop.
 *
 * index.html and 404.html are worse than the general case. With
 * assets.not_found_handling set they become the fallback for paths matching no
 * file at all, and since compatibility date 2025-04-01 navigation requests
 * prefer asset serving by default — so those two would answer for routes that
 * do not exist as files, ahead of the Worker, on every host.
 *
 * wrangler.jsonc has said "nothing HTML-shaped may ever be put in this
 * directory" since the binding was added. This is that sentence with something
 * behind it.
 */
import { readdirSync } from "node:fs";

const ROOT = new URL("../public/", import.meta.url);

/** Extensions a browser will render as a document rather than fetch as data. */
const PAGE = /\.(html?|xhtml|shtml)$/i;

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? walk(new URL(e.name + "/", dir))
      : [new URL(e.name, dir).pathname.slice(ROOT.pathname.length)],
  );
}

const pages = walk(ROOT).filter((f) => PAGE.test(f));

if (pages.length > 0) {
  console.error(
    "public/ ships " + pages.length + " page(s), which bypass the Worker on " +
      "every host — including the alias domains that must only ever 301:\n" +
      pages.map((f) => "    public/" + f).join("\n") +
      "\n\nServe pages from src/worker.ts, or the shop competes with a copy " +
      "of itself. See the note at the top of this file.",
  );
  process.exit(1);
}

console.log("public/ ships no pages — the host rules in the Worker still decide.");
