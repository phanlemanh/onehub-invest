#!/usr/bin/env node
// Đường đo ngưỡng của ON5 `luong-7-ngay-dung-so` (AC-8) trên DB local THẬT: «Ngày có tin S03 qua cổng: cột tin rao bằng số
// tin S03 của ngày đó, không lớn hơn số post». Số của khối `luong7` (đúng hàm bên ghi dùng) so với một đường đếm độc lập:
// tin S03 xếp theo ngày đăng của bài sớm nhất trong `post_ids` (không qua `first_seen`). Chỉ đọc; từ chối DB không phải
// localhost. Chạy: node scripts/luong-7-ngay-do.mjs
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { luong7 } from "../pipeline/lib/ops-flow.mjs";
import { dbUrl } from "./lib/ops-app.mjs";

// Root repo không có node_modules — mượn pg từ app/ (AGENTS.md bẫy 6).
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pg = createRequire(path.join(ROOT, "app/package.json"))("pg");

const VN = "Asia/Ho_Chi_Minh";
/** Tin S03 theo ngày VN của bài sớm nhất nối với tin — đường độc lập với `first_seen`. $1 = ngày cũ nhất (YYYY-MM-DD). */
const DOC_LAP_SQL = `SELECT d, count(*)::int n FROM (
  SELECT (min(p.posted_at) AT TIME ZONE '${VN}')::date::text d FROM sale_offers o JOIN stg_zalo_posts p ON p.post_id = ANY(o.post_ids)
  WHERE o.source = 'S03' GROUP BY o.offer_id) x WHERE d >= $1 GROUP BY 1`;
/** Bản sai để chiều đỏ: tin MỌI nguồn theo ngày first_seen. */
const MOI_NGUON_SQL = `SELECT (first_seen AT TIME ZONE '${VN}')::date::text d, count(*)::int n FROM sale_offers WHERE (first_seen AT TIME ZONE '${VN}')::date >= $1::date GROUP BY 1`;
const NGUON_KHAC_SQL = `SELECT count(*)::int n FROM sale_offers WHERE source <> 'S03' AND (first_seen AT TIME ZONE '${VN}')::date >= $1::date`;

const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};

/** Lỗi ngưỡng theo ngày: tin rao ≠ đường độc lập, hoặc tin rao > bài thô. */
export function loiNguong(days, docLap) {
  const out = [];
  for (const d of days) {
    const m = docLap.get(d.day) ?? 0;
    if (d.s03Offers !== m) out.push(`${d.day}: tin rao ${d.s03Offers} ≠ đường độc lập ${m}`);
    if (d.s03Offers > d.s03Posts) out.push(`${d.day}: tin rao ${d.s03Offers} > bài thô ${d.s03Posts}`);
  }
  return out;
}

const client = new pg.Client({ connectionString: dbUrl() });
await client.connect();
try {
  const days = await luong7(client, { now: Date.now() });
  const oldest = days[0].day;
  const docLap = new Map((await client.query(DOC_LAP_SQL, [oldest])).rows.map((r) => [r.d, r.n]));
  const loi = loiNguong(days, docLap);
  for (const d of days) {
    const cua = loi.filter((l) => l.startsWith(`${d.day}:`));
    check(cua.length === 0, cua.length === 0 ? `${d.day}: tin rao S03 ${d.s03Offers} = đường độc lập ${docLap.get(d.day) ?? 0} ≤ bài thô ${d.s03Posts}` : cua.join(" | "));
  }
  const k = days.filter((d) => d.s03Offers > 0).length;
  check(k >= 1, k >= 1 ? `${k} ngày có tin S03` : "không có ngày nào có tin S03 trong 7 ngày — ngưỡng chưa thử được");

  // Chiều đỏ: cùng phép đo trên số đếm mọi nguồn phải báo ít nhất một ngày.
  const khac = (await client.query(NGUON_KHAC_SQL, [oldest])).rows[0].n;
  if (khac === 0) console.log(`bỏ chiều đỏ: 0 tin nguồn khác S03 trong 7 ngày (đếm: ${khac})`);
  else {
    const moi = new Map((await client.query(MOI_NGUON_SQL, [oldest])).rows.map((r) => [r.d, r.n]));
    const sai = loiNguong(days.map((d) => ({ ...d, s03Offers: moi.get(d.day) ?? 0 })), docLap);
    check(sai.length > 0, sai.length > 0 ? `chiều đỏ: số đếm mọi nguồn → báo ${sai[0].split(":")[0]} (${khac} tin nguồn khác)` : `chiều đỏ: số đếm mọi nguồn (${khac} tin nguồn khác) KHÔNG bị báo`);
  }
} finally {
  await client.end();
}

console.log(fails.length === 0 ? "\nluong-7-ngay-do: PASS" : `\nluong-7-ngay-do: FAIL (${fails.length})`);
process.exit(fails.length === 0 ? 0 : 1);
