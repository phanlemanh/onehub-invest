// node --test scripts/vn-day.test.mjs
// ON8 `gio-ops-gio-vn` AC-6: số đẩy lên cloud (zaloFlow, funnel «hôm nay») gom theo ngày VN, cùng khoá ngày với
// «Luồng 7 ngày» của app. Đo bên ghi thật — pipeline/lib/ops-flow.mjs, hàm push-ops-facts.mjs gọi — trên lược đồ tạm
// của DB local (search_path chỉ lược đồ tạm, bảng tạo từ cột thật). Không import push-ops-facts.mjs: tệp đó chạy main()
// (đẩy lên cloud) ngay khi nạp — chỉ đọc mã nguồn của nó. Tên ca mở đầu bằng mã AC (GV-AC-6).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import pg from "pg";

import { parseLog, zaloFlow } from "../lib/ops-flow.mjs";
import * as pipe from "../lib/vn-day.mjs";

const PIPE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.resolve(PIPE, "..");
const app = await import(pathToFileURL(path.join(REPO, "app/src/lib/format.ts")).href);

const SCHEMA = `gio_vn_pipe_${process.pid}`;
const BASE_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const NOW = Date.parse("2026-10-24T05:00:00Z"); // 12:00 VN ngày 24
const admin = new pg.Client({ connectionString: BASE_URL });
let client = null;
let dbErr = null;

before(async () => {
  try {
    await admin.connect();
    await admin.query(`CREATE SCHEMA "${SCHEMA}"`);
    for (const b of ["stg_zalo_posts", "sale_offers"]) await admin.query(`CREATE TABLE "${SCHEMA}".${b} AS SELECT * FROM public.${b} WITH NO DATA`);
    // 23:30 VN ngày 23 và 00:30 VN ngày 24; tin Zalo thật mang snapshot zalo-agent, một tin mock không được đếm.
    for (const t of ["2026-10-23T16:30:00Z", "2026-10-23T17:30:00Z"]) {
      await admin.query(`INSERT INTO "${SCHEMA}".stg_zalo_posts (captured_at, snapshot_id) VALUES ($1, 'hcmc__zalo-agent__x')`, [t]);
      await admin.query(`INSERT INTO "${SCHEMA}".sale_offers (first_seen) VALUES ($1)`, [t]);
    }
    await admin.query(`INSERT INTO "${SCHEMA}".stg_zalo_posts (captured_at, snapshot_id) VALUES ('2026-10-23T17:40:00Z', 'mock__x')`);
    const u = new URL(BASE_URL);
    u.searchParams.set("options", `-c search_path=${SCHEMA}`);
    client = new pg.Client({ connectionString: u.toString() });
    await client.connect();
  } catch (e) {
    dbErr = e.message;
  }
});
after(async () => {
  await client?.end().catch(() => {});
  await admin.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`).catch(() => {});
  await admin.end().catch(() => {});
});
const canDb = () => assert.equal(dbErr, null, `DB local :5433 không tới được — eval đòi chạy thật: ${dbErr}`);

test("GV-AC-6 hàm dựng zaloFlow/funnel bản pipeline trên lược đồ tạm", async () => {
  canDb();
  assert.deepEqual(await zaloFlow(client, { now: NOW }), {
    "2026-10-23": { offers: 1, posts: 1 },
    "2026-10-24": { offers: 1, posts: 1 },
  });
  // Funnel: dòng log đúng khuôn hook (`${new Date().toISOString()} ${line}`, collector/openclaw/handler.js).
  const dong = (t) => `${new Date(t).toISOString()} post 202 group=nhom-thu {"accepted":1}`;
  const { funnel } = parseLog([dong("2026-10-23T16:30:00Z"), dong("2026-10-23T17:30:00Z")].join("\n"), { now: NOW });
  assert.equal(funnel.today.messages, 1, "hôm nay (ngày VN 24) chỉ có dòng 17:30Z");
  assert.equal(funnel.last7.messages, 2);
});

test("GV-AC-6 vnDayKey bản pipeline cùng ma trận khoá ngày", () => {
  const MA_TRAN = [
    ["2026-10-23T12:13:00Z", "2026-10-23"],
    ["2026-10-23T16:59:00Z", "2026-10-23"],
    ["2026-10-23T17:00:00Z", "2026-10-24"],
    ["2026-10-23T17:30:00Z", "2026-10-24"],
    ["2026-10-24T00:30:12+07:00", "2026-10-24"],
  ];
  for (const [t, mong] of MA_TRAN) {
    assert.equal(pipe.vnDayKey(Date.parse(t)), mong, `pipeline ${t}`);
    assert.equal(app.vnDayKey(Date.parse(t)), mong, `app ${t}`);
  }
  assert.equal(pipe.vnDayStart("2026-10-24").toISOString(), app.vnDayStart("2026-10-24").toISOString());
});

/** Thước tĩnh của số đẩy lên cloud: không còn gom ngày UTC; dùng hàm lib. */
function quetFacts(text) {
  const t = text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
  const vp = [];
  if (/\b[a-z_]+::date\b/.test(t)) vp.push("::date thiếu AT TIME ZONE");
  if (/\b(date_trunc|to_char)\((?![^)]*AT TIME ZONE)/.test(t)) vp.push("date_trunc/to_char thiếu AT TIME ZONE");
  if (/toISOString\(\)\.slice\(0, ?10\)/.test(t)) vp.push("khoá ngày toISOString");
  return vp;
}

test("GV-AC-6 push-ops-facts dùng hàm lib, không còn ::date/date_trunc/to_char thiếu AT TIME ZONE", () => {
  const facts = readFileSync(path.join(PIPE, "push-ops-facts.mjs"), "utf8");
  assert.deepEqual(quetFacts(facts), []);
  assert.match(facts, /import \{ parseLog, zaloFlow \} from "\.\/lib\/ops-flow\.mjs"/, "push-ops-facts phải gọi hàm lib");
  assert.doesNotMatch(facts, /function parseLog\(/, "không còn bản parseLog riêng trong push-ops-facts");
  assert.deepEqual(quetFacts(readFileSync(path.join(PIPE, "lib/ops-flow.mjs"), "utf8")), []);
});

test("GV-AC-6 bản sao push-ops-facts dùng captured_at::date::text → thước báo", () => {
  const goc = readFileSync(path.join(PIPE, "push-ops-facts.mjs"), "utf8");
  const sao = goc + '\nconst _cu = "SELECT captured_at::date::text d FROM stg_zalo_posts";\n';
  assert.notEqual(sao, goc);
  assert.deepEqual(quetFacts(sao), ["::date thiếu AT TIME ZONE"]);
});
