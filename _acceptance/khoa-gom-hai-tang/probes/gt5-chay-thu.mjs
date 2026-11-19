#!/usr/bin/env node
// GT5 E10 — lệnh con của chay-thu.sh (DATABASE_URL = DB thử oneinvest_gt5_*; DB chung bị từ chối).
//   thong-ke <truoc.json> <sau.json>   số tin trước/sau, theo khu (nút dự án), số tin chạm lát hai-khu-ghep-b
//   cat-lat <n>                          chuyển bài S03 có captured_at trong n ngày cuối sang bảng gt5_hoan; in danh sách ngày
//   tra-lat <yyyy-mm-dd>                 trả bài của một ngày từ gt5_hoan về stg_zalo_posts
//   thanh-phan <a.json> <b.json>         hai bản chụp cùng thành phần tin (tập bài mỗi tin), không xét offer_id
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const pg = (await import(join(ROOT, "pipeline/node_modules/pg/lib/index.js"))).default;
const [lenh, ...a] = process.argv.slice(2);
const docJson = (p) => JSON.parse(readFileSync(p, "utf8"));

if (lenh === "thanh-phan") {
  const tp = (o) => new Set(Object.values(o).map((p) => p.join(",")));
  const [A, B] = [tp(docJson(a[0])), tp(docJson(a[1]))];
  const lech = [...A].filter((x) => !B.has(x)).length + [...B].filter((x) => !A.has(x)).length;
  console.log(`phát lại ${A.size} tin · một lượt ${B.size} tin · thành phần lệch ${lech}`);
  if (lech) { console.log("ĐỎ: phát lại theo ngày ra thành phần khác một lượt toàn bộ"); process.exit(1); }
  console.log("đạt: phát lại theo ngày ra cùng thành phần");
  process.exit(0);
}
const URL_ = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_gt5_[a-z0-9_]+$/.test(URL_.replace(/\?.*$/, ""))) { console.error("ĐỎ: DATABASE_URL phải là DB thử oneinvest_gt5_*"); process.exit(2); }
const c = new pg.Client({ connectionString: URL_ });
await c.connect();
try {
  if (lenh === "thong-ke") {
    console.log(`số tin S03 sống: trước ${Object.keys(docJson(a[0])).length} → sau ${Object.keys(docJson(a[1])).length}`);
    const k = await c.query(`SELECT coalesce(op.project_node_id::text, '(chưa gắn dự án)') k, count(*) n FROM sale_offer_records r
                               LEFT JOIN offer_project op USING (offer_id) WHERE r.source = 'S03' AND r.retired_at IS NULL GROUP BY 1 ORDER BY 2 DESC LIMIT 6`);
    console.log(`theo khu (id nút dự án): ${k.rows.map((r) => `${r.k} ${r.n}`).join(" · ")}`);
    const l = await c.query(`SELECT (SELECT count(*) FROM eval_label_items WHERE lat = 'hai-khu-ghep-b') bai,
                                    (SELECT count(DISTINCT r.offer_id) FROM sale_offer_records r JOIN eval_label_items e
                                       ON e.lat = 'hai-khu-ghep-b' AND e.post_id = ANY(r.post_ids) WHERE r.source = 'S03' AND r.retired_at IS NULL) n`)
      .catch(() => ({ rows: [{ bai: "?", n: "?" }] }));
    console.log(`lát hai-khu-ghep-b: ${l.rows[0].bai} bài · chạm ${l.rows[0].n} tin (lát chưa nạp thì 0; tệp đóng băng PL20 rút sau DA46)`);
  } else if (lenh === "cat-lat") {
    await c.query(`CREATE TABLE gt5_hoan AS SELECT * FROM stg_zalo_posts
                    WHERE captured_at > (SELECT max(captured_at) FROM stg_zalo_posts) - make_interval(days => $1::int)`, [Number(a[0])]);
    await c.query(`DELETE FROM stg_zalo_posts WHERE captured_at >= (SELECT min(captured_at) FROM gt5_hoan)`);
    const d = await c.query(`SELECT DISTINCT (captured_at AT TIME ZONE 'UTC')::date::text d FROM gt5_hoan ORDER BY 1`);
    console.log(d.rows.map((r) => r.d).join(" "));
  } else if (lenh === "tra-lat") {
    const r = await c.query(`INSERT INTO stg_zalo_posts SELECT * FROM gt5_hoan WHERE (captured_at AT TIME ZONE 'UTC')::date = $1::date`, [a[0]]);
    console.log(`  trả ${r.rowCount} bài ngày ${a[0]}`);
  } else { console.error("lệnh: thong-ke | cat-lat | tra-lat | thanh-phan"); process.exit(2); }
} finally { await c.end(); }
