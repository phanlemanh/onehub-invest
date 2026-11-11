// do-khu-vuc-tu-dung-moi AC-3 (ba chiều của `kiem-tin-rao-gan-khu-vuc.mjs --thu` trên cùng DB local) · AC-4 (hàm so
// băm đỏ đúng bảng — thuần) · AC-5 (E8 của tin-rao-gan-khu-vuc-dung khai thay bởi AC-2 — đọc tĩnh).
// Chạy: node --test scripts/kiem-tin-rao-gan-khu-vuc.test.mjs
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { createRequire } from "node:module";

import { khuVucKhopTen, phuongHopLe, coDanhBa } from "../pipeline/lib/osm.mjs";
import { BANG_GHI, chup, soBam } from "./kiem-tin-rao-gan-khu-vuc.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "scripts/kiem-tin-rao-gan-khu-vuc.mjs");

// Mỗi lượt chạy trên DB của riêng lượt (db/db-thu.sh --chay chép từ bản mẫu, xoá khi xong), không trên DB dùng chung:
// trên `oneinvest` các job khác (nạp 15 phút) ghi property_offers trong lúc đo làm băm ROLLBACK lệch, và hai lượt song song
// tranh khoá 33033 tới quá giờ (do-san-sl1-kdm S4 r1). Trên CI db-thu.sh chạy thẳng lệnh (ca nằm trong ci-bo-qua.json).
// Một lượt ~3,5 phút khi máy rảnh, 7:40 khi các dãy khác đang chấm — trần mỗi lượt 900 giây.
const DB_THU = path.join(ROOT, "db/db-thu.sh");
const chay = (...args) => {
  const r = spawnSync("bash", [DB_THU, "oneinvest_suite_kdm", "--chay", process.execPath, SCRIPT, "--thu", ...args],
    { cwd: ROOT, encoding: "utf8", timeout: 900_000 });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
};
const dongMoi = (out) => [...out.matchAll(/^mồi (S0\d) (offer_\w+) → /gm)].map((m) => ({ nguon: m[1], id: m[2] }));

test("KDM-AC-3 ba chiều trên cùng DB", { timeout: 2_700_000 }, () => {
  const xanh = chay();
  assert.equal(xanh.code, 0, `bản thường phải exit 0:\n${xanh.out}`);
  assert.match(xanh.out, /^ok {3}trạng thái trước có 6 tin mồi trỏ khu vực không hợp lệ \(\+ \d+ tin thật\)$/m);
  assert.match(xanh.out, /^kiem-tin-rao-gan: PASS$/m);

  const khongSua = chay("--pha", "khong-sua");
  assert.equal(khongSua.code, 1, `--pha khong-sua phải exit 1:\n${khongSua.out}`);
  const moi = dongMoi(khongSua.out);
  assert.equal(moi.length, 6, "phải có sáu dòng tin mồi");
  const hong = khongSua.out.match(/^FAIL .* tin trỏ khu vực không hợp lệ hay khu vực mồi: (.*)$/m);
  assert.ok(hong, `khong-sua: thiếu dòng FAIL khối sau:\n${khongSua.out}`);
  for (const m of moi) assert.ok(hong[1].includes(m.id), `khong-sua: dòng FAIL không gọi tên tin mồi ${m.id}`);
  for (const s of ["S03", "S05", "S06"]) assert.match(khongSua.out, new RegExp(`^FAIL ${s}: 2 tin mồi → 0 về phường cũ$`, "m"));

  const moLoc = chay("--pha", "mo-loc");
  assert.equal(moLoc.code, 1, `--pha mo-loc phải exit 1:\n${moLoc.out}`);
  const roi = moLoc.out.match(/^FAIL .* tin trỏ khu vực không hợp lệ hay khu vực mồi: (.*)$/m);
  assert.ok(roi, `mo-loc: thiếu dòng FAIL «… tin trỏ khu vực mồi»:\n${moLoc.out}`);
  assert.ok(dongMoi(moLoc.out).some((m) => roi[1].includes(m.id)), `mo-loc: dòng FAIL không gọi tên tin mồi nào — ${roi[1]}`);
});

test("KDM-AC-4 so băm đỏ đúng bảng", () => {
  const goc = Object.fromEntries([...BANG_GHI, "ops_audit"].map((t, i) => [t, { n: i, h: `h${i}` }]));
  assert.deepEqual(soBam(goc, structuredClone(goc)), [], "băm bằng nhau → không bảng nào lệch");
  const sau = structuredClone(goc);
  sau.review_queue.h = "khac";
  sau.ops_audit.n += 1;
  assert.deepEqual(soBam(goc, sau), ["review_queue", "ops_audit"], "phải gọi đúng hai bảng lệch");
});

/** Lỗi khai thay của E8 trong một evals.yaml, [] khi đúng. */
export function kiemE8(yaml) {
  const khoi = Object.fromEntries(yaml.split(/^ {2}- id: /m).slice(1).map((b) => [b.split("\n")[0].trim(), b]));
  const loi = [];
  const e8 = khoi.E8 ?? "";
  if (!/^ {4}status: not-run$/m.test(e8)) loi.push("E8 thiếu status: not-run");
  if (!/^ {4}superseded_by: do-khu-vuc-tu-dung-moi#AC-2$/m.test(e8)) loi.push("E8 thiếu superseded_by: do-khu-vuc-tu-dung-moi#AC-2");
  if (!/^ {4}cmd: config:executors\.script\.tin_rao_gan_do$/m.test(e8)) loi.push("E8 đổi cmd");
  for (const id of ["E1", "E2", "E3", "E4", "E5", "E6", "E7"]) {
    if (!khoi[id]) loi.push(`${id} vắng`);
    else if (/^ {4}(status|superseded_by):/m.test(khoi[id])) loi.push(`${id} khai status/superseded_by`);
  }
  return loi;
}

test("KDM-AC-5 E8 cũ khai thay bởi AC-2", () => {
  const yaml = readFileSync(path.join(ROOT, "_acceptance/tin-rao-gan-khu-vuc-dung/evals.yaml"), "utf8");
  assert.deepEqual(kiemE8(yaml), []);
  const doc = readFileSync(path.join(ROOT, "docs/superpowers/specs/2026-10-26-do-khu-vuc-tu-dung-moi-design.md"), "utf8");
  assert.ok(doc.includes("`tin-rao-gan-khu-vuc-dung/E8`"), "design doc thiếu thẻ tin-rao-gan-khu-vuc-dung/E8");
  // Chiều đỏ: bản chép bỏ superseded_by
  const hong = yaml.replace(/^ {4}superseded_by: .*\n/m, "");
  assert.ok(kiemE8(hong).some((l) => l.startsWith("E8 thiếu superseded_by")), "bỏ superseded_by mà hàm kiểm không gọi tên E8");
});

// do-san-sl1-kdm AC-2 (KDM-PX1): thước coi hợp lệ đúng bằng điều kiện khớp tên của bên ghi (khuVucKhopTen, PX1/084) —
// ba ô trong MỘT giao dịch ROLLBACK trên DB local: xã có admin_code không OSM · không OSM không mã · xã có mã mang lac.
test("KDM-PX1 thước khớp vị từ bên ghi ở ba ô; bản phuongHopLe lệch; ROLLBACK không để lại mồi", async () => {
  const pg = createRequire(path.join(ROOT, "app/package.json"))("pg");
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await c.connect();
  const tien = `vn-zz-px1-${process.pid}`;
  const O = [
    { o: "ma", meta: { source: "dvhc" }, ma: `px1-${process.pid}-a` },
    { o: "khong-ma", meta: { source: "moi-khong-osm" }, ma: null },
    { o: "lac", meta: { source: "dvhc", lac: true }, ma: `px1-${process.pid}-b` },
  ];
  try {
    const coMa = await coDanhBa(c);
    assert.ok(coMa, "KDM-PX1: DB local chưa áp 084 — ca này đo nhánh đã áp");
    await c.query("BEGIN");
    // Khu vực cha tự dựng trong giao dịch: DB của CI dựng từ migration không có thị trường nào (FK parent_id).
    const cha = `${tien}-cha`;
    await c.query(
      `INSERT INTO areas (id, parent_id, region_type, name, country_code, meta) VALUES ($1, NULL, 'market', 'KDM-PX1 cha', 'vn', '{}'::jsonb)`,
      [cha],
    );
    for (const x of O) {
      await c.query(
        `INSERT INTO areas (id, parent_id, region_type, name, country_code, meta, admin_code)
         VALUES ($1, $5, 'submarket', $2, 'vn', $3::jsonb, $4)`,
        [`${tien}-${x.o}`, `KDM-PX1 ${x.o}`, JSON.stringify(x.meta), x.ma, cha],
      );
      await c.query(
        `INSERT INTO sale_offer_records (offer_id, originating_system_key, source, kind, price_vnd, area_m2, confidence,
           first_seen, last_seen, n_reposts, post_ids, area_id)
         VALUES ($1, $2, 'S03', 'sale', 3e9, 60, 'medium', now(), now(), 1, $3, $4)`,
        [`offer_px1_${process.pid}_${x.o}`, `S03|px1_${process.pid}_${x.o}`, [`px1_${process.pid}_${x.o}`], `${tien}-${x.o}`],
      );
    }
    const { rows } = await c.query(
      `SELECT a.id, (${khuVucKhopTen("a.", coMa)}) AS hop FROM areas a WHERE a.id LIKE $1 AND a.region_type = 'submarket'`, [`${tien}-%`]);
    const benGhi = new Map(rows.map((r) => [r.id, r.hop]));
    const thuoc = await chup(c, coMa);
    const doc = (snap) => Object.fromEntries(O.map((x) => [x.o, snap.get(`offer_px1_${process.pid}_${x.o}`)?.hop_le]));
    const ghi = Object.fromEntries(O.map((x) => [x.o, benGhi.get(`${tien}-${x.o}`)]));
    assert.deepEqual(doc(thuoc), ghi, "KDM-PX1: thước lệch vị từ khớp tên của bên ghi");
    assert.equal(ghi.ma, true, "KDM-PX1: xã danh bạ có admin_code phải hợp lệ theo bên ghi");
    assert.equal(ghi["khong-ma"], false, "KDM-PX1: khu vực không OSM không mã phải không hợp lệ");
    // Chiều đỏ cùng fixture: thước dựng bằng phuongHopLe (bản trước vòng) lệch bên ghi ở ô xã có mã.
    const cu = doc(await chup(c, coMa, phuongHopLe("a.")));
    assert.notDeepEqual(cu, ghi, "KDM-PX1: bản phuongHopLe mà không lệch bên ghi — thước không phân biệt được");
    assert.equal(cu.ma, false, "KDM-PX1: bản phuongHopLe phải đếm xã có mã là không hợp lệ");
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    const { rows: [{ n }] } = await c.query("SELECT count(*)::int n FROM areas WHERE id LIKE $1", [`${tien}-%`]);
    await c.end();
    assert.equal(n, 0, "KDM-PX1: còn khu vực mồi sau ROLLBACK");
  }
});
