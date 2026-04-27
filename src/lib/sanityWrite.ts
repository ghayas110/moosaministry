import { sanityWriteClient } from "@/sanity/client";

/**
 * Delete a document by ID (also drafts.<id>) and gracefully ignore "missing".
 */
export async function deleteDoc(id: string) {
  try {
    await sanityWriteClient.delete(id);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (!msg.includes("not found")) throw err;
  }
  try {
    await sanityWriteClient.delete(`drafts.${id}`);
  } catch {
    /* ignore */
  }
}

/**
 * Patch (set) a document and publish (i.e. apply on the live doc).
 */
export async function patchDoc(id: string, set: Record<string, unknown>, unset?: string[]) {
  let p = sanityWriteClient.patch(id).set(set);
  if (unset && unset.length) p = p.unset(unset);
  return p.commit();
}
