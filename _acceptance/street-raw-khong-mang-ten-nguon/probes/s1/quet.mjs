// quet.mjs — bảng phủ ca S1 của PL39: đếm (không in giá trị) ô của các bảng lên cloud mà bộ soát tầng A của sync-cloud trúng.
// Cùng lõi với bộ chặn: docSourceNameEntries + guardValues (findSourceNames). Chỉ đọc (default_transaction_read_only).
// Chạy: DATABASE_URL=... node quet.mjs  → JSON {sale_offers:{<source>:{<cột>:{co_chu, trung}}}, sellers:{…}, properties:{…}, o_trung:[…]}
import pg from "../../../../pipeline/node_modules/pg/lib/index.js";
import { docSourceNameEntries } from "../../../../pipeline/lib/source-name-entries.mjs";
import { guardValues } from "../../../../pipeline/lib/tier-a-guard.mjs";
import { CLOUD_ALLOW } from "../../../../pipeline/sync-cloud.mjs";

const c = new pg.Client({ connectionString: process.env.DATABASE_URL, options: "-c default_transaction_read_only=on" });
await c.connect();
try {
  const entries = await docSourceNameEntries(c);
  if (!entries.length) throw new Error("sổ nguồn rỗng — không đo được");
  const out = { sale_offers: {}, sellers: {}, properties: {}, o_trung: [], che_luc_sync: { sale_offers: ["seller_name", "seller_phone"] } };
  const dem = (bucket, col, v) => {
    if (v == null || typeof v === "number" || typeof v === "boolean") return false;
    const b = (bucket[col] ??= { co_chu: 0, trung: 0 });
    b.co_chu++;
    const hit = guardValues(v instanceof Date ? v.toISOString() : v, entries).length > 0;
    if (hit) b.trung++;
    return hit;
  };
  const cols = (t) => CLOUD_ALLOW[t].map((x) => `"${x}"`).join(", ");
  for (const r of (await c.query(`SELECT ${cols("sale_offers")} FROM sale_offers`)).rows) {
    const bk = (out.sale_offers[r.source] ??= {});
    for (const col of CLOUD_ALLOW.sale_offers) if (dem(bk, col, r[col])) out.o_trung.push({ bang: "sale_offers", khoa: r.offer_id, nguon: r.source, cot: col, kind: r.kind, first_seen: r.first_seen, do_dai: String(r[col]).length });
  }
  for (const r of (await c.query(`SELECT ${cols("sellers")} FROM sellers`)).rows)
    for (const col of CLOUD_ALLOW.sellers) if (dem(out.sellers, col, r[col])) out.o_trung.push({ bang: "sellers", khoa: r.phone_hash, cot: col });
  for (const r of (await c.query(`SELECT ${cols("properties")} FROM properties`)).rows)
    for (const col of CLOUD_ALLOW.properties) if (dem(out.properties, col, r[col])) out.o_trung.push({ bang: "properties", khoa: r.id, cot: col });
  console.log(JSON.stringify(out, null, 1));
} finally {
  await c.end();
}
