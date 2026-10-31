// idem-063.mjs — hàng phat-bieu-db-do-tren-main AC-5 (E5): áp 063 trên bản chép DB máy thu, trong giao dịch ROLLBACK.
// Lượt 1 sửa dữ liệu lệch (có dòng audit), sau đó phân xử lại đổi 0 và cắt chuyển thử lệch 0; lượt 2 đổi 0 và không ghi
// audit. In thời gian một lượt apply_enrichment trước/sau 063 (thông tin). Chiều đỏ: chỉ nạp phần hàm của 063 (bỏ mục 4)
// → cắt chuyển thử còn lệch. Chỉ chạy trên DB thử chưa áp 063 (bash db/db-thu.sh oneinvest_p2_idem).
// Chạy: DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_idem node pipeline/scripts/idem-063.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { catChuyen } from "../phat-bieu-cat-chuyen.mjs";
import { writeOffers } from "../lib/write-offers.mjs";
import { mintOfferId } from "../lib/offer-key.mjs";
import { HAM_063 } from "../lib/nap-045.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const MIG_063 = readFileSync(join(ROOT, "db/migrations/063_phat_bieu_theo_bai_dang.sql"), "utf8");
const DB_URL = process.env.DATABASE_URL ?? "";
const HONG = [];
const dong = (s) => console.log(s);

const SEED_AT = new Date("2026-10-20T00:00:00Z");
const tin = (osk, posts) => ({
  offer_id: mintOfferId("TST", osk), originating_system_key: osk, kind: "sale", confidence: "high",
  first_seen: SEED_AT, last_seen: SEED_AT, n_reposts: posts.length, post_ids: posts,
  price_tier: "P1", area_m2: 50, price_perm2: 100_000_000,
});

async function main() {
  if (!DB_URL) throw new Error("thiếu DATABASE_URL — trỏ vào DB thử");
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  const one = async (sql, p = []) => (await c.query(sql, p)).rows[0];
  try {
    const { ten } = await one("SELECT current_database() AS ten");
    if (ten === "oneinvest") throw new Error("từ chối chạy trên DB oneinvest dùng chung — phép đo GHI, dùng DB thử");
    if ((await one("SELECT to_regprocedure('offers_chung_chu_the(text[])') IS NOT NULL AS co")).co) {
      throw new Error(`${ten} đã áp 063 — dựng lại DB thử (bash db/db-thu.sh ${ten})`);
    }
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    const demAudit = async () => (await one("SELECT count(*)::int AS n FROM ops_audit WHERE action = 'phat-bieu:phan-xu-lai-063'")).n;
    const bam = async () => (await one(`SELECT md5(string_agg(concat_ws('|', offer_id, property_type, bedrooms, bathrooms, street_raw,
      block_raw, field_provenance::text), E'\\n' ORDER BY offer_id)) AS h FROM sale_offer_records`)).h;

    /** Một lượt apply_enrichment trên hai tin thử chung post, đo ms; ROLLBACK về savepoint. */
    const doAp = async (nhan) => {
      await c.query(`SAVEPOINT do_${nhan}`);
      const A = tin(`idem063-${nhan}-p`, [`idem063-${nhan}-p`]);
      const B = tin(`idem063-${nhan}-b`, [`idem063-${nhan}-b`, `idem063-${nhan}-p`]);
      await writeOffers(c, "TST", [A, B]);
      const { id } = await one(`INSERT INTO enrichment_proposals (run_id, offer_id, field, value, value_key, source, route, evidence)
        VALUES ('idem-063', $1, 'property_type', 'apartment', 'apartment', 'e2_llm', 'direct', '{}'::jsonb) RETURNING id`, [A.offer_id]);
      const t0 = performance.now();
      await c.query("SELECT apply_enrichment($1, 'enrich-run:idem-063')", [[Number(id)]]);
      const ms = Math.round(performance.now() - t0);
      await c.query(`ROLLBACK TO SAVEPOINT do_${nhan}`);
      return ms;
    };
    /** Cắt chuyển thử (ghi legacy + phân xử toàn bộ) trong savepoint, trả số ô lệch. */
    const lechCatChuyen = async () => {
      await c.query("SAVEPOINT cc");
      const r = await catChuyen(c, { actor: "idem-063:thu" });
      await c.query("ROLLBACK TO SAVEPOINT cc");
      return r.lech.length;
    };

    const msTruoc = await doAp("truoc");

    // Chiều đỏ: chỉ phần hàm của 063 (không mục 4) → dữ liệu lệch nằm lại.
    await c.query("SAVEPOINT doi_chung");
    await c.query(HAM_063);
    const k = await lechCatChuyen();
    await c.query("ROLLBACK TO SAVEPOINT doi_chung");
    dong(`idem-063 đối chứng: cắt chuyển lệch ${k}`);
    if (k === 0) HONG.push("chiều đỏ không đỏ — bản chép không có dữ liệu lệch, phép đo không phân biệt được");

    // Lượt 1.
    const a0 = await demAudit();
    await c.query(MIG_063);
    const a1 = await demAudit();
    const au = await one(`SELECT detail FROM ops_audit WHERE action = 'phat-bieu:phan-xu-lai-063' ORDER BY id DESC LIMIT 1`);
    dong(`idem-063 lượt 1: xét ${au?.detail?.offers ?? "?"} · đổi ${au?.detail?.offers_changed ?? 0} · dòng audit +${a1 - a0}`);
    if (a1 - a0 !== 1 || !(au?.detail?.offers_changed > 0)) HONG.push("lượt 1 không ghi đúng một dòng audit có số đổi > 0");

    const r0 = (await one("SELECT resolve_offer_fields(NULL) AS r")).r;
    const lech = await lechCatChuyen();
    dong(`idem-063 sau áp: resolve(NULL) đổi ${r0.offers_changed} · cắt chuyển lệch ${lech}`);
    if (r0.offers_changed !== 0 || lech !== 0) HONG.push("sau áp 063 dữ liệu vẫn chưa bằng kết quả phân xử");

    // Lượt 2.
    const h1 = await bam();
    await c.query(MIG_063);
    const h2 = await bam();
    const a2 = await demAudit();
    dong(`idem-063 lượt 2: đổi ${h1 === h2 ? 0 : "≠0"} · dòng audit +${a2 - a1}`);
    if (h1 !== h2 || a2 !== a1) HONG.push("lượt 2 đổi dữ liệu hoặc ghi thêm audit");

    const msSau = await doAp("sau");
    dong(`idem-063 thời gian: một lượt apply_enrichment ${msTruoc} ms trước 063 · ${msSau} ms sau 063`);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
  if (HONG.length) {
    console.error(`idem-063: lệch — ${HONG.join("; ")}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(`idem-063: ${e.message}`);
  process.exit(1);
});
