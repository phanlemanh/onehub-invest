// s16-soat.test.mjs — DA33 nap-s16-vao-danh-ba E9 (AC-9): mã đăng nhập S16 không rời máy; tên nguồn thật không vào diff.
// Token tổng hợp dài (dạng id thật), không giá trị thật nào của nguồn.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import pg from "pg";
import { BANG_CAM_S16, kiemBangDay, soatDuLieu, soatS16, thongDiepS16 } from "./s16-soat.mjs";
import { FILL, syncOnce } from "../sync-cloud.mjs";

const MA = "QZ9.081101", TOA_ID = "1700000000001_4242", KHU_ID = "1700000000002_7777";
const TOKEN = new Set([MA, TOA_ID, KHU_ID]);
const sach = new Map([["asset_nodes", [JSON.stringify({ id: 1, name: "Q Khu", meta: { a: "QZ9.08" } })]]]);

test("DA33-AC-9 (a) bảng stg S16 hay bảng vật thể trong danh sách đẩy → dừng trước khi gửi, nêu bảng", async () => {
  assert.equal(kiemBangDay(FILL), null, "FILL thật đang chứa bảng cấm");
  for (const t of ["stg_s16_can", "units"]) {
    let goi = 0;
    await assert.rejects(
      syncOnce({ local: {}, exec: async () => { goi++; return []; }, log: () => {}, fill: [...FILL, t] }),
      (e) => e.phase === "scan" && e.message.includes(t), `DA33-AC-9 (a) ${t} không bị chặn`);
    assert.equal(goi, 0, `DA33-AC-9 (a) ${t}: đã gọi cloud trước khi chặn`);
  }
  assert.equal(BANG_CAM_S16.length, 5);
});

const ca = [
  ["(b) mã căn trong asset_nodes", new Map([["asset_nodes", [JSON.stringify({ id: 2, name: `Căn ${MA}`, meta: {} })]]]), MA, "asset_nodes.name"],
  ["(c) toa_id trong asset_nodes", new Map([["asset_nodes", [JSON.stringify({ id: 3, meta: { s16: [TOA_ID] } })]]]), TOA_ID, "asset_nodes.meta"],
  ["(d) mã căn ở bảng khác trong FILL", new Map([...sach, ["sale_offers", [JSON.stringify({ offer_id: "o1", block_raw: MA.toLowerCase() })]]]), MA, "sale_offers.block_raw"],
];
for (const [ten, data, gt, noi] of ca) {
  test(`DA33-AC-9 ${ten} → trúng, thông điệp nêu bảng.cột, không giá trị`, () => {
    const hit = soatDuLieu(data, TOKEN);
    assert.ok(hit, `DA33-AC-9 ${ten} không bị bắt`);
    assert.equal(`${hit.bang}.${hit.cot}`, noi);
    const m = thongDiepS16(hit);
    assert.ok(!m.includes(gt) && !m.toUpperCase().includes(gt.toUpperCase()), `DA33-AC-9 ${ten}: thông điệp lộ giá trị`);
  });
}

test("DA33-AC-9 (e) toa_id trong evidence một thẻ → soatS16 trả đường, không giá trị", () => {
  const the = { item_id: "s16:abcd", evidence: { nguon: "S16", khoa_toa: ["bld_X"], x: [{ y: `toà ${TOA_ID}` }] } };
  assert.deepEqual(soatS16(the, TOKEN), { duong: "evidence.x[0].y" });
  assert.equal(soatS16({ item_id: "s16:abcd", evidence: { nguon: "S16", s16_ref: "0123456789abcdef" } }, TOKEN), null);
});

test("DA33-AC-9 payload sạch → xanh; mã trong chuỗi dài hơn không khớp nhầm (ca âm)", () => {
  assert.equal(soatDuLieu(sach, TOKEN), null);
  assert.equal(soatDuLieu(new Map([["asset_nodes", [JSON.stringify({ a: `${MA}X`, b: `X${TOA_ID}` })]]]), TOKEN), null,
    "ca âm: chuỗi con bị bắt nhầm");
  assert.equal(soatDuLieu(sach, null), null);
});

// ---- Tầng A: tên nguồn thật không nằm trong tệp hàng này thêm hay đổi ----
const GOC = join(import.meta.dirname, "../..");
async function tokenTangA() {
  const ra = new Set();
  const bang = [];
  // Tên thư mục bản thu S16 ở máy thu (tầng A) — phần sau «s16-».
  for (const d of [join(GOC, "collector/snapshots/vn"), join(homedir(), "dev/onehub-invest/collector/snapshots/vn")]) {
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d)) {
      const m = /^vn__s16-(.+?)__/.exec(f);
      if (m) { ra.add(m[1].toLowerCase()); ra.add(m[1].toLowerCase().replace(/-/g, " ")); }
    }
  }
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  try {
    await c.connect();
    await c.query("SET default_transaction_read_only = on");
    const { rows } = await c.query(`SELECT DISTINCT lower(x) AS x FROM (SELECT real_name AS x FROM source_registry
                                      UNION ALL SELECT unnest(source_ids) FROM source_registry) s WHERE length(x) >= 5`);
    for (const r of rows) ra.add(r.x);
    // Tên bảng có sẵn của DB (vd bảng snapshot chung mang tên một nguồn từ đời đầu) không phải lần lộ tên mới.
    bang.push(...(await c.query("SELECT lower(table_name) AS t FROM information_schema.tables WHERE table_schema = 'public'")).rows.map((r) => r.t));
  } catch { /* máy không có DB local */ } finally { await c.end().catch(() => {}); }
  return { tk: ra, bang: bang.sort((a, b) => b.length - a.length) };
}
/** Dòng «+» của diff mang token tầng A, sau khi bỏ tên bảng có sẵn: [[tệp, số dòng]]. Không trả token. */
function dongLo(diff, tk, bang) {
  const trung = new Map();
  let tep = null;
  for (const l of diff.split("\n")) {
    if (l.startsWith("+++ ")) { tep = l.slice(6); continue; }
    if (!l.startsWith("+")) continue;
    let noi = l.toLowerCase();
    for (const b of bang) if (noi.includes(b)) noi = noi.split(b).join(" ");
    if ([...tk].some((x) => noi.includes(x))) trung.set(tep, (trung.get(tep) ?? 0) + 1);
  }
  return [...trung];
}
test("DA33-AC-9 tệp hàng này thêm hay đổi không mang tên nguồn thật", async (t) => {
  const { tk, bang } = await tokenTangA();
  if (!tk.size) { t.skip("máy này không có sổ nguồn hay thư mục bản thu — không có token tầng A để soát"); return; }
  let base;
  try { base = execFileSync("git", ["-C", GOC, "merge-base", "HEAD", "origin/main"], { encoding: "utf8" }).trim(); }
  catch { t.skip("không có origin/main"); return; }
  // Chỉ dòng hàng này thêm (diff -U0, dòng «+»), trừ tệp máy sinh (bản đồ, lộ trình) và ảnh.
  const diff = execFileSync("git", ["-C", GOC, "diff", "-U0", base, "--", ".", ":!*.png", ":!LO-TRINH.html", ":!PRODUCT-MAP.md"],
    { encoding: "utf8", maxBuffer: 64 << 20 });
  const t0 = [...tk][0];
  const doiChung = dongLo(`+++ b/q.mjs\n+const x = "${t0}";\n+const y = "${bang[0] ?? "q"}";`, tk, bang);
  assert.deepEqual(doiChung, [["q.mjs", 1]], "đối chứng tầng A: dòng cấy token không bị bắt");
  const trung = dongLo(diff, tk, bang);
  assert.deepEqual(trung, [], `dòng thêm mang tên nguồn thật (${trung.length} tệp)`);
});
