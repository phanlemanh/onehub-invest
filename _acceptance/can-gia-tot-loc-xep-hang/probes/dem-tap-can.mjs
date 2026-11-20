#!/usr/bin/env node
// Đếm tập Căn giá tốt trên DB máy thu, chỉ đọc: cùng điều kiện với dealsSql (app/src/lib/deals.ts), mỗi căn một dòng.
// Dùng: node _acceptance/can-gia-tot-loc-xep-hang/probes/dem-tap-can.mjs [mã nút dự án]
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const goc = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const { Client } = createRequire(resolve(goc, "app/package.json"))("pg");
const duAn = process.argv[2] ?? null;

const c = new Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
await c.connect();
await c.query("SET default_transaction_read_only = on");
const { rows } = await c.query(
  `WITH loc AS (
     SELECT o.offer_id, o.source, h.cap, h.nut, coalesce(h.can_xac_minh, false) AS can_xac_minh, o.last_seen,
            coalesce((SELECT min(po.property_id)::text FROM property_offers po WHERE po.offer_id = o.offer_id), o.offer_id) AS can_key
     FROM offer_price_rank h
     JOIN sale_offers o ON o.offer_id = h.offer_id
     WHERE h.kind = 'sale' AND h.nhan IS NOT NULL
       AND o.last_seen >= now() - interval '45 days'
       AND h.duoi_trung_vi_pct >= 5 AND h.duoi_trung_vi_pct <= 50
       AND ($1::text IS NULL OR (h.cap = 'du_an' AND h.nut = $1))
   ), gom AS (
     SELECT DISTINCT ON (can_key) * FROM loc ORDER BY can_key, last_seen DESC, offer_id
   )
   SELECT count(*)::int AS tong,
          count(*) FILTER (WHERE can_xac_minh)::int AS can_xac_minh,
          count(*) FILTER (WHERE cap = 'du_an')::int AS cap_du_an,
          count(*) FILTER (WHERE cap = 'du_an' AND source = 'S03')::int AS cap_du_an_s03
   FROM gom`,
  [duAn],
);
await c.end();
console.log(JSON.stringify({ du_an: duAn, ...rows[0] }));
