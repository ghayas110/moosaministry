/**
 * Reset script — wipes test orders, inventory logs, and purchase orders,
 * then restores ingredients to their seeded stock levels.
 *
 *   node scripts/reset-data.mjs
 *
 * Reads creds from .env.local (NEXT_PUBLIC_SANITYS_* + SANITY_API_WRITE_TOKEN).
 * Idempotent: safe to run more than once.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@sanity/client";

// --- env loader (no dotenv dep) ---
const envText = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of envText.split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const projectId = process.env.NEXT_PUBLIC_SANITYS_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITYS_DATASET;
const token = process.env.SANITY_API_WRITE_TOKEN;
if (!projectId || !dataset || !token) {
  console.error("Missing Sanity credentials in .env.local");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-10-01",
  useCdn: false,
  token,
});

// Original seed values (id → { currentStock, lastRestocked? })
const SEED = {
  "0f86c5e4-b598-49bd-8b0c-50c76eecd4e1": { stock: 25, last: "2026-04-25T08:00:00Z" }, // Beef Brisket
  "3a7f5822-69ab-442e-8f0d-467437dac6bd": { stock: 18, last: "2026-04-26T08:00:00Z" }, // Chicken Thigh
  "bb0a03db-d3dc-4ab4-81e4-3248cfee0382": { stock: 40 }, // Dumpling Wrappers
  "b2a08f2b-9d0f-4c06-a896-f051c1037293": { stock: 15 }, // Wheat Noodles
  "04c9177b-d9ae-4c05-ab28-a9bb9feb9798": { stock: 8 },  // Glass Noodles
  "df885825-0a58-4f6f-a2c4-479e8e0cff07": { stock: 30 }, // Korean Rice
  "f6815007-7af0-4f49-af53-67d69b458b9d": { stock: 12 }, // Nori Seaweed
  "1f37ace6-8891-462d-86db-01b1ab3a2495": { stock: 6 },  // Kimchi
  "95405c8c-c6a3-4e2b-96be-7e4d5b2d4e58": { stock: 4 },  // Gochujang
  "4da2c995-4ca6-40e7-bdf8-c710555bce36": { stock: 5 },  // Sesame Oil
  "438dda5b-cd70-4ef0-be3f-0c3df30ccd76": { stock: 3 },  // Spring Onions
  "9d14c87b-e54f-414e-a949-452543deb401": { stock: 120 }, // Eggs
  "89e7e35d-713a-4706-a81a-dd8e724026b3": { stock: 24 }, // Soju
};

async function deleteByType(type) {
  // Fetch every doc of this type, including drafts
  const ids = await client.fetch(
    `*[_type == $type]._id`,
    { type }
  );
  if (ids.length === 0) {
    console.log(`  · ${type}: nothing to delete`);
    return;
  }
  // Delete in chunks; Sanity tx caps at 500 mutations per request
  const CHUNK = 100;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const slice = ids.slice(i, i + CHUNK);
    const tx = client.transaction();
    for (const id of slice) tx.delete(id);
    await tx.commit({ visibility: "async" });
  }
  console.log(`  ✓ ${type}: deleted ${ids.length} document(s)`);
}

async function resetIngredients() {
  let touched = 0;
  for (const [id, seed] of Object.entries(SEED)) {
    // Patch both published and draft if either exists
    for (const target of [id, `drafts.${id}`]) {
      const exists = await client.fetch(`defined(*[_id==$id][0])`, { id: target });
      if (!exists) continue;
      const patch = client.patch(target).set({
        currentStock: seed.stock,
        ...(seed.last ? { lastRestocked: seed.last } : { lastRestocked: null }),
      });
      await patch.commit({ visibility: "async" });
      touched++;
    }
  }
  console.log(`  ✓ ingredients: reset ${touched} record(s) to seeded stock levels`);
}

(async () => {
  console.log(`→ Resetting Sanity dataset "${dataset}" on project ${projectId}\n`);

  console.log("Deleting transactional data:");
  await deleteByType("order");
  await deleteByType("inventoryLog");
  await deleteByType("purchaseOrder");

  console.log("\nRestoring ingredient stock levels:");
  await resetIngredients();

  console.log("\n✓ Done. Categories, menu items, suppliers, ingredients, tables, and staff were preserved.");
})().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
