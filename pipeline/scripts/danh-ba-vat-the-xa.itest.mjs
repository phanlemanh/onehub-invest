// danh-ba-vat-the-xa.itest.mjs — hồ sơ nut-du-an-tro-xa-moi (DV1) E3, E4, E6: lệnh --sua-xa thật trên DB của riêng lượt
// chép từ máy thu (db/db-thu.sh --chay — có danh bạ xã PX1, 20 nút mang mã cũ, 69 toà đã dựng). Không bao giờ ghi DB
// `oneinvest`. Ngoài CI. Chạy:
//   bash db/db-thu.sh oneinvest_suite_dv1 --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-xa.itest.mjs
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";
import { TEP_XA, dung, napBangXa, suaXaNut } from "../danh-ba-vat-the.mjs";
import { THONG_DIEP, demTheoKhu, khuDaDung, xaMoiCuaNut } from "../lib/danh-ba-vat-the.mjs";

const GOC = join(import.meta.dirname, "../..");
const LENH = join(GOC, "pipeline/danh-ba-vat-the.mjs");
const URL_LUOT = process.env.DATABASE_URL;
const TAM = mkdtempSync(join(tmpdir(), "dv1-"));
const TEP_THAT = JSON.parse(readFileSync(TEP_XA, "utf8"));

// Bảng vàng (thiết kế §3): tên xã/phường mới của 15 nút cấp xã — viết tay, không tính từ tệp.
const VANG = {
  "vinhomes-ocean-park-1": ["Gia Lâm"], "vinhomes-ocean-park-2": ["Nghĩa Trụ"], "vinhomes-smart-city": ["Tây Mỗ"],
  "vinhomes-riverside": ["Phúc Lợi"], "ecopark": ["Phụng Công"], "kdt-van-khe": ["Hà Đông"], "masteri-west-heights": ["Tây Mỗ"],
  "vinhomes-central-park": ["Thạnh Mỹ Tây"], "masteri-thao-dien": ["An Khánh"], "estella-heights": ["Bình Trưng"],
  "the-global-city": ["Bình Trưng"], "empire-city": ["An Khánh"], "vinhomes-grand-park": ["Long Bình"],
  "phu-my-hung": ["Tân Hưng", "Tân Mỹ"], "vinhomes-golden-river": ["Sài Gòn"],
};
const boTienTo = (s) => s.replace(/^(Phường|Xã|Thị trấn|Đặc khu)\s+/u, "").normalize("NFC");

let c;
before(async () => {
  assert.ok(URL_LUOT, "cần DATABASE_URL của DB riêng lượt (db/db-thu.sh --chay)");
  c = new pg.Client({ connectionString: URL_LUOT });
  await c.connect();
  const { rows: [r] } = await c.query("SELECT current_database() AS db");
  if (r.db === "oneinvest") { await c.end(); throw new Error("DV1 itest ghi thật: từ chối DB dùng chung oneinvest"); }
});
after(async () => { await c?.end(); });

const chay = (...args) => spawnSync(process.execPath, [LENH, "--sua-xa", ...args], { encoding: "utf8", cwd: join(GOC, "pipeline") });
const chup = async () => Object.fromEntries((await c.query(
  "SELECT slug, area_ids FROM asset_nodes WHERE node_type = 'project' ORDER BY slug")).rows.map((r) => [r.slug, [...r.area_ids].sort()]));
const tongKet = (out) => JSON.parse(out.split("\n").find((l) => l.startsWith("tong_ket ")).slice(9));
const tepTam = (ten, sua) => { const t = structuredClone(TEP_THAT); sua(t.nut); const p = join(TAM, ten); writeFileSync(p, JSON.stringify(t)); return p; };
async function mongDoi(tep = TEP_THAT) {
  const bang = await napBangXa(c, tep.nut);
  return Object.fromEntries(Object.entries(tep.nut).map(([s, m]) => [s, xaMoiCuaNut(m, bang).area_ids]));
}
/** Nút lệch bảng vàng: tên khu vực (bỏ tiền tố) của mã suy ra khác bảng. */
async function lechVang(mong) {
  const lech = [];
  for (const [s, ten] of Object.entries(VANG)) {
    const { rows } = await c.query("SELECT name FROM areas WHERE id = ANY($1)", [mong[s] ?? []]);
    if (rows.map((r) => boTienTo(r.name)).sort().join("|") !== [...ten].sort().join("|")) lech.push(s);
  }
  return lech;
}

test("DV1-AC-4 chặn trước khi ghi: ba tệp hỏng và hai đích sai thoát 2 gọi tên, 0 nút đổi, 0 kết nối", async () => {
  const truoc = await chup();
  const o = [
    [tepTam("chon.json", (n) => { n["vinhomes-grand-park"].chon = ["27094"]; }), "vinhomes-grand-park: chon-ngoai-dich"],
    [tepTam("thieu.json", (n) => { delete n["ecopark"]; }), "thiếu nút ecopark"],
    [tepTam("la.json", (n) => { n["khu-la"] = n["ecopark"]; }), "slug lạ khu-la"],
  ];
  for (const [tep, loi] of o) {
    const r = chay("--db", URL_LUOT, "--tep", tep);
    assert.equal(r.status, 2, `DV1-AC-4 ${loi}: mã thoát ${r.status} ${r.stderr}`);
    assert.ok(r.stderr.includes(loi), `DV1-AC-4 stderr thiếu «${loi}»: ${r.stderr}`);
    const sau = await chup();
    for (const s of Object.keys(truoc)) assert.deepEqual(sau[s], truoc[s], `DV1-AC-4 ${loi}: nút ${s} đổi`);
  }
  // Đích sai: bộ nghe TCP giả đếm kết nối; không URL nào trỏ :5433.
  let ketNoi = 0;
  const sv = createServer((s) => { ketNoi += 1; s.destroy(); });
  await new Promise((ok) => sv.listen(0, "127.0.0.1", ok));
  const cong = sv.address().port;
  try {
    const a = chay("--db", `postgres://127.0.0.1:${cong}/oneinvest`);
    assert.equal(a.status, 2, `DV1-AC-4 thiếu --db-that: ${a.stderr}`);
    assert.ok(a.stderr.includes(THONG_DIEP.thieuCo), `DV1-AC-4 stderr thiếu thông điệp thiếu cờ: ${a.stderr}`);
    const b = chay("--db", `postgres://db.vi-du.invalid:${cong}/oneinvest_dbv_x`, "--db-that");
    assert.equal(b.status, 2, `DV1-AC-4 máy chủ ngoài: ${b.stderr}`);
    assert.ok(b.stderr.includes(THONG_DIEP.ngoai), `DV1-AC-4 stderr thiếu thông điệp ngoài máy: ${b.stderr}`);
    assert.equal(ketNoi, 0, "DV1-AC-4 lệnh đã mở kết nối tới đích bị từ chối");
  } finally {
    sv.close();
  }
  // Đối chứng dương: tệp thật trên cùng DB, chạy thử --thu, thoát 0 và không ghi.
  const d = chay("--db", URL_LUOT, "--thu");
  assert.equal(d.status, 0, `DV1-AC-4 đối chứng dương tệp thật: ${d.stderr}`);
  assert.deepEqual(await chup(), truoc, "DV1-AC-4 --thu đã ghi");
});

test("DV1-AC-3 lệnh ghi đúng 20/20 nút theo tệp, in bảng cũ → mới, chạy lại đổi 0; --thu không ghi", async () => {
  const truoc = await chup();
  const mong = await mongDoi();
  // Đối chứng: ảnh đầu ca lệch tệp ở ≥ 15 nút — phép so phân biệt được mã cũ.
  const lechDau = Object.keys(mong).filter((s) => (truoc[s] ?? []).join(",") !== mong[s].join(","));
  assert.ok(lechDau.length >= 15, `DV1-AC-3 ${lechDau.join(", ")} lệch tệp — chỉ ${lechDau.length} nút, đối chứng yếu`);
  const t = chay("--db", URL_LUOT, "--thu");
  assert.equal(t.status, 0, t.stderr);
  assert.deepEqual(await chup(), truoc, "DV1-AC-3 --thu đã ghi");
  const r = chay("--db", URL_LUOT);
  assert.equal(r.status, 0, `DV1-AC-3 lệnh: ${r.stderr}`);
  const sau = await chup();
  assert.equal(Object.keys(sau).length, 20, "DV1-AC-3 số nút dự án");
  for (const s of Object.keys(mong)) assert.deepEqual(sau[s], mong[s], `DV1-AC-3 ${s} lệch tệp`);
  const { rows: ma } = await c.query("SELECT id, region_type, admin_code FROM areas WHERE id = ANY($1)", [Object.values(sau).flat()]);
  const theoId = new Map(ma.map((m) => [m.id, m]));
  for (const [s, ids] of Object.entries(sau)) {
    for (const id of ids) {
      const a = theoId.get(id);
      assert.ok(a, `DV1-AC-3 ${s}: mã ${id} không có trong areas`);
      if (TEP_THAT.nut[s].cap === "xa") assert.ok(a.region_type === "submarket" && a.admin_code, `DV1-AC-3 ${s}: ${id} không phải xã có mã`);
      else assert.equal(a.region_type, "market", `DV1-AC-3 ${s}: ${id} không phải thị trường`);
    }
  }
  for (const s of lechDau) assert.ok(r.stdout.split("\n").some((l) => l.startsWith(`${s} · `) && l.includes(" → ")), `DV1-AC-3 thiếu dòng bảng ${s}`);
  const r2 = chay("--db", URL_LUOT);
  assert.equal(r2.status, 0, r2.stderr);
  assert.deepEqual({ doi: tongKet(r2.stdout).doi, rut: tongKet(r2.stdout).rut }, { doi: 0, rut: 0 }, "DV1-AC-3 chạy lại còn đổi");
});

test("DV1-AC-3 vàng: tên xã mới của 15 nút cấp xã bằng bảng viết trước; sửa một mã xã cũ thì đỏ", async () => {
  assert.deepEqual(await lechVang(await mongDoi()), [], "DV1-AC-3 lệch bảng vàng");
  const hong = structuredClone(TEP_THAT);
  hong.nut["vinhomes-smart-city"].xa_cu = [{ ...hong.nut["vinhomes-smart-city"].xa_cu[1], old_code: "00634" }];
  hong.nut["vinhomes-smart-city"].chon = ["00637"];
  assert.ok((await lechVang(await mongDoi(hong))).includes("vinhomes-smart-city"), "DV1-AC-3 vinhomes-smart-city lệch bảng vàng");
});

const toaDuoi = async (slug) => (await c.query(
  `SELECT b.building_key FROM buildings b JOIN asset_nodes n ON n.id = b.region_node_id
     LEFT JOIN asset_nodes p ON p.id = n.parent_id
    WHERE n.slug = $1 OR p.slug = $1 ORDER BY 1`, [slug])).rows.map((r) => r.building_key);
const phuongSong = async (keys) => (await c.query(
  `SELECT subject_key, value FROM field_assertions WHERE retracted_at IS NULL AND resource_name = 'Building' AND field = 'area_id'
      AND method = 'registry_inherit' AND subject_key = ANY($1) ORDER BY 1, 2`, [keys])).rows;
async function gieoPhuong(slug, area, keys) {
  await c.query("UPDATE asset_nodes SET area_ids = $2 WHERE slug = $1", [slug, [area]]);
  for (const k of keys) {
    await c.query(`INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, evidence, observed_at, run_id)
                   VALUES ('Building', $1, 'area_id', $2, 'inferred', 'registry_inherit', '{"nut_vung":"dv1-thu"}'::jsonb, now(), 'dv1-thu')
                   ON CONFLICT DO NOTHING`, [k, area]);
  }
}
const anhToa = async () => (await c.query("SELECT building_key, upi FROM buildings ORDER BY 1")).rows;
const demKhu = async () => Object.fromEntries([...(await demTheoKhu(c)).entries()]);

test("DV1-AC-6 dựng lại danh bạ: toà, trục, căn, UPI giữ nguyên; phường cũ bị rút, toà nhận phường mới; nút nhiều phường không để phường kế thừa", async () => {
  const gp = await toaDuoi("vinhomes-grand-park");
  const op1 = await toaDuoi("vinhomes-ocean-park-1");
  assert.ok(gp.length > 0 && op1.length > 0, "DV1-AC-6 bản chép phải có toà dưới hai khu");
  const anhTruoc = await anhToa();
  const demTruoc = await demKhu();
  // Ô rút: Grand Park về một phường cũ có trong areas, gieo phường kế thừa cũ cho mọi toà; sửa xã rồi dựng lại.
  await gieoPhuong("vinhomes-grand-park", "vn-hcmc-long-truong", gp);
  const r = chay("--db", URL_LUOT);
  assert.equal(r.status, 0, r.stderr);
  const { rows: rutRows } = await c.query(
    `SELECT count(*)::int AS n FROM field_assertions WHERE subject_key = ANY($1) AND value = 'vn-hcmc-long-truong'
        AND method = 'registry_inherit' AND (retracted_at IS NULL OR retract_reason IS DISTINCT FROM 'sua-xa-nut')`, [gp]);
  assert.equal(rutRows[0].n, 0, "DV1-AC-6 phường cũ chưa bị rút với lý do sua-xa-nut");
  await dung(c, { khuSlugs: await khuDaDung(c), runId: "dv1-dung-1" });
  const song = await phuongSong(gp);
  for (const k of gp) {
    const v = song.filter((x) => x.subject_key === k).map((x) => x.value);
    assert.deepEqual(v, ["vn-hcmc-long-binh"], v.length > 1 ? `DV1-AC-6 toà ${k} hai phường sống` : `DV1-AC-6 toà ${k} phường ${v}`);
  }
  assert.deepEqual(await anhToa(), anhTruoc, "DV1-AC-6 UPI hay khoá toà đổi");
  assert.deepEqual(await demKhu(), demTruoc, "DV1-AC-6 số toà, trục, căn đổi");

  // Chiều đỏ: bỏ bước rút thì toà giữ hai phường sống.
  await gieoPhuong("vinhomes-grand-park", "vn-hcmc-long-truong", gp);
  await suaXaNut(c, { rut: false });
  await dung(c, { khuSlugs: await khuDaDung(c), runId: "dv1-dung-do" });
  const do2 = await phuongSong(gp);
  assert.ok(gp.some((k) => do2.filter((x) => x.subject_key === k).length > 1), "đối chứng: bỏ rút mà không toà nào hai phường sống");

  // Ô nhiều phường: Ocean Park 1 chuyển từ Gia Lâm sang Gia Lâm + Bát Tràng (Đa Tốn tách) — toà còn 0 phường kế thừa.
  const nhieu = tepTam("nhieu.json", (n) => { n["vinhomes-ocean-park-1"].chon = ["00565", "00577"]; });
  await suaXaNut(c, { tep: nhieu, rut: false });
  assert.ok((await phuongSong(op1)).length > 0, "đối chứng: bỏ rút mà toà Ocean Park 1 không còn phường kế thừa");
  await suaXaNut(c, {});
  await suaXaNut(c, { tep: nhieu });
  await dung(c, { khuSlugs: await khuDaDung(c), runId: "dv1-dung-2" });
  for (const x of await phuongSong(op1)) assert.fail(`DV1-AC-6 toà ${x.subject_key} giữ phường kế thừa của nút nhiều phường`);
});
