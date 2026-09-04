/**
 * /admin/povprasevanja — the enquiries a visitor wrote.
 *
 * ⚠️ READ, AND MARK HANDLED. It does not delete: an enquiry is a customer's
 * message and the shop's record of it, and a list that can be emptied by a
 * misclick is a list that loses one.
 *
 * Lifted out of handleAdmin unchanged.
 */

import { NOTICES } from "./notices";
import { deleteEnquiry, isStatus, listEnquiries, updateEnquiry } from "../enquiries";
import { enquiryListPage } from "../enquiries-panel";
import type { AdminCtx } from "./ctx";
import { page, seeOther } from "./ctx";

export async function handle(c: AdminCtx): Promise<Response | null> {
  const { admin, api, parts, request, shopKey, url } = c;
  // ⚠️ THE SURFACE OWNS ITS OWN GUARD. In the if-chain this was the
  // condition of the branch; extracted without it, the body ran for every
  // request and the first surface in the table answered the whole panel.
  // Returning null is how a surface says "not mine" — see Surface in ctx.
  if (parts[1] !== "povprasevanja") return null;
    const id = parts[2];

    if (id && request.method === "POST") {
      if (parts[3] === "izbris") {
        await deleteEnquiry(api, shopKey, id);
        return seeOther("/admin/povprasevanja?m=enq-deleted");
      }
      const form = await request.formData();
      const statusRaw = String(form.get("status") ?? "");
      await updateEnquiry(api, shopKey, id, {
        // An unknown status is DROPPED rather than defaulted: a select whose
        // value did not survive the round trip should leave the row alone,
        // not quietly move it to "nova".
        ...(isStatus(statusRaw) ? { status: statusRaw } : {}),
        note: String(form.get("note") ?? ""),
      });
      return seeOther("/admin/povprasevanja?m=enq-saved");
    }

    const notice = url.searchParams.get("m")
      ? ({
          kind: "ok",
          text:
            (Object.hasOwn(NOTICES, url.searchParams.get("m")!)
              ? NOTICES[url.searchParams.get("m")!]
              : undefined) ?? "Shranjeno.",
        } as const)
      : undefined;
    return page(enquiryListPage(await listEnquiries(api, shopKey), admin.email, notice));
  return null;
}
