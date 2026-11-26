// node --test scripts/s05-slo.test.mjs
// Hồ sơ s05-slo-theo-lich (docs/plan/danh-gia-observability-s05-2510.md §5 P3): từ 7/11 S05 thu 2 lượt/tuần (thứ Ba + thứ
// Sáu 06:00) — SLO S05 = 96 giờ (khoảng dài nhất thứ Sáu → thứ Ba) ở cả hai bản chép định nghĩa độ tươi. Gọi readFreshness
// THẬT của scripts/lib/freshness.mjs (CLI) và app/src/lib/freshness.ts (/ops; Node 24 nạp thẳng TS) trên client giả — không DB.
// NK1 so-nguon-kho-khai-bao (21/11): nhịp thôi là hằng trong hai bản — hai bản đọc `cadence_hours` của sổ, chỗ ghi DUY NHẤT là
// migration 122. Tên ca giữ nguyên (evals của hồ sơ s05-slo-theo-lich đòi đúng tên); số đọc từ 122 qua scripts/lib/so-nguon-122.mjs,
// đối chứng «SLO 12» là bản đột biến của chính tệp 122.
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { after, test } from "node:test";

import * as cli from "./lib/freshness.mjs";
import { cadenceMap122, doc122 } from "./lib/so-nguon-122.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SQL_12 = doc122().replace("('S05', 'flow',  96)", "('S05', 'flow',  12)");
const app = await import(pathToFileURL(path.join(REPO, "app/src/lib/freshness.ts")).href);
const BAN = [["CLI", cli], ["app", app]];

const tmps = [];
after(() => tmps.forEach((d) => rmSync(d, { recursive: true, force: true })));

/** Client giả: chỉ S05 active, nhịp từ migration 122 (`sql` = bản đột biến cho đối chứng); probe trả một thành phố. */
function client(last, sql) {
  const row = { code: "S05", source_ids: ["s05hook"], cadence_hours: cadenceMap122(sql).S05, stg_tables: [], measured_markets: null };
  return {
    async query(sql) {
      if (sql.includes("FROM source_registry")) return { rows: [row] };
      return { rows: [{ city: "hanoi", last: last.toISOString() }] };
    },
  };
}
const H = 3.6e6;
async function s05(ban, last, now, sql) {
  const rows = (await ban.readFreshness(client(last, sql), { now })).filter((r) => r.code === "S05");
  assert.equal(rows.length, 1, "phải đúng một hàng S05");
  return rows[0];
}

test("S5-AC-1 bảng SLO hai bản: S05 = 96, các mã khác giữ nguyên", async () => {
  const MONG = { S01: 192, S02: 840, S03: 72, S05: 96, S06: 36, S08: 192 };
  // Mã khai thêm sau (S10, S11 — khai-slo-s10-s11) không phạm luật này: bảng đủ đã ghim ở check-freshness AC-5.
  const bang = cadenceMap122();
  assert.deepEqual(Object.fromEntries(Object.keys(MONG).map((k) => [k, bang[k]])), MONG, "S5-AC-1 bảng nhịp của migration 122");
  for (const [ten, ban] of BAN) {
    const r = await s05(ban, new Date("2026-11-10T00:00:00Z"), new Date("2026-11-10T01:00:00Z"));
    assert.equal(r.sloHours, 96, `S5-AC-1 bảng SLO bản ${ten}`);
  }
});

// Lịch thứ Ba + thứ Sáu 06:00 (giờ VN = 23:00 UTC hôm trước) — lượt đầu thứ Ba 4/11/2026.
const T0 = new Date("2026-11-03T23:00:00Z");
const LUOT = [0, 72, 168, 240, 336].map((h) => new Date(T0.getTime() + h * H));
const GIO = 336; // h = 1 … 336: trọn 14 ngày sau lượt đầu
/** Lượt gần nhất TRƯỚC `now` — giờ trùng một lượt thu được đánh giá trước khi tính lượt đó (chạm tuổi 96). */
const luotTruoc = (now) => LUOT.filter((t) => t < now).at(-1);

async function quet(ban, sql) {
  let stale = 0;
  let max = 0;
  let dem = 0;
  for (let h = 1; h <= GIO; h++) {
    const now = new Date(T0.getTime() + h * H);
    const r = await s05(ban, luotTruoc(now), now, sql);
    if (r.status === "stale") stale++;
    else assert.equal(r.status, "fresh");
    max = Math.max(max, r.ageHours);
    dem++;
  }
  return { stale, max, dem };
}

test("S5-AC-2 lịch 2 lượt/tuần chạy đúng → S05 xanh mọi giờ ở cả hai bản; bản SLO 12 đỏ phần lớn", async () => {
  for (const [ten, ban] of BAN) {
    const q = await quet(ban);
    assert.equal(q.dem, GIO, `S5-AC-2 ${ten}: số giờ đã quét`);
    assert.equal(q.max, 96, `S5-AC-2 ${ten}: tuổi lớn nhất của lịch phải là 96`);
    assert.equal(q.stale, 0, `S5-AC-2 ${ten}: lịch đúng mà S05 đỏ ${q.stale} giờ`);
  }
  // Đối chứng: bản 122 đột biến giữ SLO 12 (giá trị trước vòng) đỏ ở phần lớn các giờ của cùng lịch.
  assert.notEqual(SQL_12, doc122(), "đột biến không đổi gì — không thấy dòng S05 96 trong migration 122");
  assert.equal(cadenceMap122(SQL_12).S05, 12, "bản đột biến phải thật sự được đọc");
  const q = await quet(cli, SQL_12);
  assert.ok(q.stale >= 168, `đối chứng: bản SLO 12 chỉ đỏ ${q.stale}/${GIO} giờ`);
});

const NOW = new Date("2026-11-10T12:00:00Z");
const truoc = (phut) => new Date(NOW.getTime() - phut * 60_000);

test("S5-AC-3 biên 96 giờ / 96 giờ 59 phút → fresh, 97 giờ → stale ở cả hai bản; chữ hiển thị nêu SLO mới", async () => {
  for (const [ten, ban] of BAN) {
    assert.equal((await s05(ban, truoc(96 * 60), NOW)).status, "fresh", `S5-AC-3 ${ten}: tuổi 96 giờ`);
    assert.equal((await s05(ban, truoc(96 * 60 + 59), NOW)).status, "fresh", `S5-AC-3 ${ten}: tuổi 96 giờ 59 phút`);
    assert.equal((await s05(ban, truoc(97 * 60), NOW)).status, "stale", `S5-AC-3 ${ten}: tuổi 97 giờ`);
  }
  const quaCli = await s05(cli, truoc(97 * 60), NOW);
  assert.equal(cli.describe(quaCli), "S05/hanoi: quá hạn — 97 giờ (SLO 96 giờ)", "S5-AC-3 chữ check-freshness");
  const quaApp = await s05(app, truoc(97 * 60), NOW);
  assert.equal(app.fmtOverdue(quaApp.ageHours, quaApp.sloHours), "trễ 1 giờ", "S5-AC-3 chữ /ops (trễ)");
  assert.equal(app.fmtAge(quaApp.sloHours), "4 ngày", "S5-AC-3 chữ /ops (SLO)");
  // Đối chứng: nhịp 12 (bản 122 đột biến) nói «SLO 12 giờ».
  assert.match(cli.describe(await s05(cli, truoc(97 * 60), NOW, SQL_12)), /SLO 12 giờ/, "đối chứng: bản SLO 12 phải nói SLO 12 giờ");
});

// ---- AC-6: không nơi thứ ba ghi SLO S05 ----
const GOC_QUET = ["app/src", "scripts", "pipeline", "data-api/src", "agent/src", ".claude/skills", "db/migrations"];
const DUOI = /\.(ts|tsx|mjs|js|sql|md)$/;
/** Ma trận viết trước các dạng ghi SLO S05 có trong kho: khoá đối tượng «S05: N», chữ «S05 ≤ N giờ/ngày», bộ đôi
 *  «["S05", N]», SQL «WHEN 'S05' THEN N». Mỗi dạng có một mẫu đối chứng ở ca S5-AC-6. */
const DANG = [
  ["khoá", /S05["']?\s*:\s*(\d+)\b(?!\s*\/)/g, (n) => Number(n)],
  ["chữ", /S05\s*≤\s*(\d+)\s*(giờ|ngày)/g, (n, dv) => (dv === "ngày" ? Number(n) * 24 : Number(n))],
  ["bộ đôi", /\[\s*["']S05["']\s*,\s*(\d+)\s*\]/g, (n) => Number(n)],
  ["sql", /WHEN\s+'S05'\s+THEN\s+(\d+)/g, (n) => Number(n)],
  ["sổ 122", /\(\s*'S05'\s*,\s*'(?:flow|stock)'\s*,\s*(\d+)\s*\)/g, (n) => Number(n)],
];

function tepQuet() {
  const out = [];
  const di = (rel) => {
    let ds;
    try {
      ds = readdirSync(path.join(REPO, rel), { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of ds) {
      const r = path.join(rel, e.name);
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      if (e.isDirectory()) di(r);
      else if (DUOI.test(e.name) && !/\.test\./.test(e.name)) out.push({ rel: r, text: readFileSync(path.join(REPO, r), "utf8") });
    }
  };
  GOC_QUET.forEach(di);
  return out;
}
const khop = (tep) =>
  tep.flatMap(({ rel, text }) =>
    DANG.flatMap(([dang, re, chuan]) => [...text.matchAll(re)].map((m) => ({ rel, dang, gio: chuan(m[1], m[2]) }))),
  );

// Tên ca giữ theo hồ sơ s05-slo-theo-lich. Từ NK1 hai bản chép không còn ghi SLO: chỗ ghi duy nhất là sổ nguồn, khai ở
// migration 122 (dạng «sổ 122»); hai bản đọc nó từ DB.
test("S5-AC-6 chỉ hai bản chép ghi SLO S05 (= 96); cloud /ops lấy readFreshness của bản CLI", () => {
  const tep = tepQuet();
  const k = khop(tep);
  // Mọi chỗ ghi SLO S05 (bất kể dạng, kể cả chữ mô tả) đều bằng 96 giờ; giá trị máy đọc chỉ ở migration 122, hai bản chép
  // không còn khoá nhịp.
  assert.ok(k.length > 0 && k.every((x) => x.gio === 96), `S5-AC-6 còn chỗ ghi SLO S05 khác 96 giờ: ${JSON.stringify(k.filter((x) => x.gio !== 96))}`);
  assert.deepEqual(k.filter((x) => x.dang === "sổ 122").map((x) => x.rel), ["db/migrations/122_source_registry_family_cadence.sql"], "S5-AC-6 giá trị máy đọc phải ở đúng migration 122");
  for (const rel of ["app/src/lib/freshness.ts", "scripts/lib/freshness.mjs"])
    assert.ok(!k.some((x) => x.rel === rel && x.dang === "khoá"), `S5-AC-6 bản chép ${rel} còn khoá nhịp S05`);
  const push = readFileSync(path.join(REPO, "pipeline/push-ops-facts.mjs"), "utf8");
  assert.match(push, /import \{[^}]*\breadFreshness\b[^}]*\} from "\.\.\/scripts\/lib\/freshness\.mjs"/, "S5-AC-6 push-ops-facts không lấy readFreshness của bản CLI");
  // Đối chứng: mỗi dạng của ma trận, ghi giá trị cũ ở một tệp giả, đều bị bắt (4 dạng = 4 lần bắt).
  const MAU_GIA = ["const X = { S05: 12 };", " *   S05 ≤ 12 giờ   ghi chú", 'const T = [["S05", 12]];', "CASE code WHEN 'S05' THEN 12 END", "    ('S05', 'flow',  12),"];
  for (const [i, text] of MAU_GIA.entries()) {
    const bat = khop([{ rel: `gia-${i}`, text }]);
    assert.deepEqual(bat.map((x) => [x.dang, x.gio]), [[DANG[i][0], 12]], `đối chứng dạng «${DANG[i][0]}» không bị bắt: ${text}`);
  }
  assert.equal(MAU_GIA.length, DANG.length, "mỗi dạng một mẫu đối chứng");
});
