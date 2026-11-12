// transform-s10.itest.mjs — hồ sơ _acceptance/s10-bang-hang-vao-danh-ba (DA29): migration 089, bộ nạp thật trên lượt thu S10
// 11/11, lệnh nối transform-s10.mjs, view quỹ căn theo nút. Chỉ chạy trên DB của riêng lượt (db/db-thu.sh oneinvest_suite_s10 --chay):
// DB ấy bị xoá khi lệnh dừng, nên các bước ghi thật (áp 089, bộ nạp, lệnh nối) không chạm DB dùng chung. Snapshot đọc lúc chạy ở
// máy thu; không chép mã hay tên dự án S10 vào kho (sổ danh-ba-toa-truc-can#d-20261106T221027Z-7).
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { basename, join } from "node:path";
import { test } from "node:test";

import pg from "pg";

import { bocS10, duBoLoc } from "../lib/s10-bang-hang.mjs";

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(DB_URL)) {
  throw new Error("transform-s10.itest: cần DATABASE_URL trỏ DB của riêng lượt oneinvest_suite_*, không chạy trên oneinvest");
}
const HERE = import.meta.dirname;
const GOC = join(HERE, "../..");
const MIG = readFileSync(join(GOC, "db/migrations/089_s10_bang_hang.sql"), "utf8");
const NAP = join(GOC, "pipeline/import-airbnb.mjs");
const NOI = join(GOC, "pipeline/transform-s10.mjs");
// Snapshot nằm ở checkout chính (collector/snapshots, gitignored); worktree thì suy từ git common dir.
const chinh = () => {
  const r = spawnSync("git", ["-C", GOC, "rev-parse", "--path-format=absolute", "--git-common-dir"], { encoding: "utf8" });
  return join(r.stdout.trim(), "..");
};
const THU_MUC_SNAP = process.env.S10_SNAPSHOT_GOC ?? join(chinh(), "collector/snapshots/vn");
const NGAY_LUOT = "vn__s10-bang-hang__2026-11-11T";

/** Mọi snapshot của lượt thu S10 11/11 (một snapshot = một project_id, cộng một snapshot cây dự án). */
function luotThu() {
  assert.ok(existsSync(THU_MUC_SNAP), `S10-AC-2: không thấy thư mục snapshot ${THU_MUC_SNAP}`);
  const ds = readdirSync(THU_MUC_SNAP).filter((d) => d.startsWith(NGAY_LUOT)).sort().map((d) => join(THU_MUC_SNAP, d));
  assert.ok(ds.length >= 100, `S10-AC-2: lượt 11/11 chỉ có ${ds.length} snapshot`);
  return ds;
}
function itemsCua(dir) {
  return readdirSync(dir).filter((f) => /^items-\d+\.json\.gz$/.test(f)).sort()
    .flatMap((f) => { const d = JSON.parse(gunzipSync(readFileSync(join(dir, f))).toString("utf8")); return Array.isArray(d) ? d : d.items; });
}
const ketNoi = async () => { const c = new pg.Client({ connectionString: DB_URL }); await c.connect(); return c; };
const chay = (tep, args, env = {}) =>
  spawnSync(process.execPath, [tep, ...args], { encoding: "utf8", cwd: GOC, env: { ...process.env, DATABASE_URL: DB_URL, ...env } });
/** Cột COT_S10 rút từ chính bộ nạp — không chép tay danh sách. */
function cotNap() {
  const m = readFileSync(NAP, "utf8").match(/const COT_S10 = \[([\s\S]*?)\];/);
  assert.ok(m, "S10-AC-1: không rút được COT_S10 từ import-airbnb.mjs");
  return [...m[1].matchAll(/"([a-z0-9_]+)"/g)].map((x) => x[1]);
}
const BON = ["stg_s10_stock", "stg_s10_project", "s10_project_links", "s10_quy_can_du_an"];
const bamLuocDo = async (c) => (await c.query(
  `SELECT md5(coalesce(string_agg(x, E'\\n' ORDER BY x), '')) h FROM (
     SELECT table_name || '.' || column_name || ':' || data_type || ':' || is_nullable x FROM information_schema.columns WHERE table_name = ANY ($1)
     UNION ALL SELECT conrelid::regclass || '.' || conname || ':' || pg_get_constraintdef(oid) FROM pg_constraint
      WHERE conrelid::regclass::text = ANY ($1)
     UNION ALL SELECT 'view:' || pg_get_viewdef('s10_quy_can_du_an'::regclass)) s`, [BON])).rows[0].h;

// Thứ tự: AC-2 chiều đỏ (DB chưa có 089) → AC-1 (áp 089) → AC-2 (nạp thật) → AC-3 (nối) → AC-4 (view). node:test chạy tuần tự.
const ca = { dir: null, snap: [] };

test("S10-AC-2 đỏ: DB chưa áp 089 thì bộ nạp in CHUA-AP-089, không tạo bảng", async () => {
  const c = await ketNoi();
  try {
    assert.equal((await c.query("SELECT to_regclass('stg_s10_stock') r")).rows[0].r, null, "S10-AC-2: DB của lượt đã có stg_s10_stock trước 089");
    ca.snap = luotThu();
    const mot = ca.snap.find((d) => itemsCua(d).some((it) => it.kind === "stock_table"));
    const r = chay(NAP, [mot]);
    assert.match(r.stdout, /CHUA-AP-089/, `S10-AC-2: bộ nạp không in CHUA-AP-089 khi thiếu 089\n${r.stdout}${r.stderr}`);
    assert.equal((await c.query("SELECT to_regclass('stg_s10_stock') r")).rows[0].r, null, "S10-AC-2: bộ nạp tự tạo bảng");
  } finally { await c.end(); }
});

test("S10-AC-1 089 đúng khuôn bộ nạp, chạy lại không đổi lược đồ, ràng buộc chặn dòng sai", async () => {
  const c = await ketNoi();
  try {
    await c.query(MIG);
    const h1 = await bamLuocDo(c);
    await c.query(MIG);
    assert.equal(await bamLuocDo(c), h1, "S10-AC-1: áp 089 lần hai đổi lược đồ");
    const cotBang = async () => new Set((await c.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'stg_s10_stock'")).rows.map((r) => r.column_name));
    const thieu = (s) => cotNap().filter((x) => !s.has(x));
    assert.deepEqual(thieu(await cotBang()), [], "S10-AC-1: stg_s10_stock thiếu cột COT_S10");
    // Chiều đỏ: bản bảng thiếu một cột của COT_S10 → phép so gọi tên cột.
    await c.query("BEGIN");
    await c.query("ALTER TABLE stg_s10_stock DROP COLUMN remarks_raw CASCADE");
    assert.deepEqual(thieu(await cotBang()), ["remarks_raw"], "S10-AC-1: phép so cột không gọi tên cột bị bỏ");
    await c.query("ROLLBACK");
    const tuChoi = async (sql, ma, nhan) => {
      await c.query("BEGIN");
      await assert.rejects(c.query(sql), (e) => e.code === ma, `S10-AC-1: không chặn ${nhan}`);
      await c.query("ROLLBACK");
    };
    await tuChoi(`INSERT INTO stg_s10_project (project_id, snapshot_id) VALUES ('x', 's'), ('x', 's')`, "23505", "hai dòng nhãn NULL cùng (snapshot, dự án)");
    await tuChoi(`INSERT INTO s10_project_links (project_id, status) VALUES ('x', 'noi')`, "23514", "noi thiếu nút");
    await tuChoi(`INSERT INTO s10_project_links (project_id, status) VALUES ('x', 'chua_noi')`, "23514", "chua_noi thiếu lý do");
    await tuChoi(`INSERT INTO s10_project_links (project_id, status, ly_do) VALUES ('x', 'la', 'y')`, "23514", "trạng thái lạ");
  } finally { await c.end(); }
});

test("S10-AC-2 bộ nạp ghi đủ dòng bộ bóc trả, nạp lại không thêm", { timeout: 1_800_000 }, async () => {
  const c = await ketNoi();
  try {
    // T = Σ dòng bộ bóc trả, K = số stock_id khác nhau mỗi snapshot, C = dòng trùng chéo 177↔178 (cùng snapshot).
    let tong = 0, khac = 0, cheo = 0, lech = 0;
    const khoaCheo = []; // "<snapshot>|<stock_id>" có ở cả 177 và 178
    for (const d of ca.snap) {
      const thay = new Map();
      for (const it of itemsCua(d)) {
        if (it.kind !== "stock_table" || !duBoLoc(it)) continue;
        const b = bocS10(it); lech += b.lechKhuon;
        const bt = String(it.meta?.request?.block_type);
        for (const r of b.dong) {
          tong++;
          if (!thay.has(r.stock_id)) { thay.set(r.stock_id, new Set([bt])); khac++; }
          else { cheo++; thay.get(r.stock_id).add(bt); }
        }
      }
      for (const [id, s] of thay) if (s.has("177") && s.has("178")) khoaCheo.push(`${basename(d)}|${id}`);
    }
    assert.ok(tong > 0, "S10-AC-2: lượt 11/11 không có dòng nào đủ bộ lọc");
    assert.equal(tong, khac + cheo, "S10-AC-2: đếm độc lập không khép");
    let trungIn = 0;
    for (const d of ca.snap) {
      const r = chay(NAP, [d]);
      assert.equal(r.status, 0, `S10-AC-2: bộ nạp thoát ${r.status}\n${r.stdout}${r.stderr}`);
      assert.doesNotMatch(r.stdout, /CHUA-AP-089/, "S10-AC-2: bộ nạp in CHUA-AP-089 sau khi áp 089");
      const m = r.stdout.match(/dòng S10[^\n]*trùng (\d+)\)/);
      if (/dòng S10/.test(r.stdout)) {
        assert.ok(m, `S10-AC-2: dòng tổng kết thiếu «trùng <số>» — ${d}\n${r.stdout}`);
        trungIn += Number(m[1]);
      }
    }
    assert.equal(trungIn, cheo, `S10-AC-2: bộ nạp in tổng trùng ${trungIn}, đếm độc lập ${cheo}`);
    const dem = async () => (await c.query(
      `SELECT count(*)::int n, count(*) FILTER (WHERE unit_number IS NULL AND status_raw IS NULL AND property_sub_type_raw IS NULL)::int lech
         FROM stg_s10_stock WHERE snapshot_id LIKE $1`, [`${NGAY_LUOT}%`])).rows[0];
    const a = await dem();
    assert.deepEqual([a.n, a.lech], [khac, lech], `S10-AC-2: stg_s10_stock khác số stock_id khác nhau (T ${tong} = K ${khac} + C ${cheo})`);
    // Căn trùng chéo giữ dòng của bảng 177.
    assert.ok(khoaCheo.length > 0, "S10-AC-2: lượt 11/11 không có căn trùng chéo 177↔178 — ca giữ 177 không được đo");
    const { rows: [g] } = await c.query(
      `SELECT count(*) FILTER (WHERE block_type = 177)::int n177, count(*)::int n FROM stg_s10_stock
        WHERE snapshot_id || '|' || stock_id = ANY($1::text[])`, [khoaCheo]);
    assert.deepEqual([g.n, g.n177], [khoaCheo.length, khoaCheo.length],
      `S10-AC-2: ${khoaCheo.length} căn trùng chéo, stg có ${g.n} dòng, ${g.n177} dòng bảng 177`);
    for (const d of ca.snap) chay(NAP, [d]);
    assert.deepEqual(await dem(), a, "S10-AC-2: nạp lại thêm dòng");
  } finally { await c.end(); }
});

// ---- AC-3: lệnh nối ----
const DONG_HOP_LE = /^(noi \d+ · chua_noi \d+|thu: khong ghi|da ghi|loi: [a-z-]+(?: [0-9A-Z]+)?)$/;
const boDau = (s) => (s ?? "").normalize("NFD").replace(/\p{M}/gu, "").replace(/[đĐ]/g, "d").toLowerCase();

test("S10-AC-3 lệnh nối: noi/chua_noi đúng, --thu không ghi, chạy lại không đổi, bảy lỗi tệp và tên nhiều giá trị không ghi", { timeout: 600_000 }, async () => {
  const c = await ketNoi();
  const thuMuc = join(GOC, "research-local"); mkdirSync(thuMuc, { recursive: true });
  const tep = join(thuMuc, `s10-noi-thu-${process.pid}.json`);
  const tepLo = join(GOC, `s10-noi-khong-bo-qua-${process.pid}.json`);
  try {
    // Tên dự án do bộ nạp v11 thật ghi (AC-2 đã nạp); thêm một dự án mồi hai nhãn để đo luật gộp.
    const { rows: [moi] } = await c.query(
      `SELECT project_id, snapshot_id FROM stg_s10_project ORDER BY project_id LIMIT 1`);
    assert.ok(moi, "S10-AC-3: bộ nạp không ghi stg_s10_project");
    await c.query(`INSERT INTO stg_s10_project (project_id, du_an, phan_khu, project_label, snapshot_id, captured_at)
                   SELECT project_id, du_an, phan_khu, 'Nhãn thứ hai S10-AC-3', snapshot_id, captured_at FROM stg_s10_project
                    WHERE project_id = $1 AND snapshot_id = $2 LIMIT 1`, [moi.project_id, moi.snapshot_id]);
    const { rows: duAn } = await c.query(
      `SELECT DISTINCT ON (project_id) project_id, du_an FROM stg_s10_project ORDER BY project_id, captured_at DESC`);
    // Chọn dự án có tên riêng không nằm trong tên dự án khác (để không sinh lỗi ung-vien-bi-sot thật).
    const chon = duAn.find((d) => d.du_an && boDau(d.du_an).length >= 6
      && duAn.filter((x) => boDau(x.du_an).includes(boDau(d.du_an))).length === 1);
    assert.ok(chon, "S10-AC-3: không tìm được dự án có tên riêng để nối");
    const { rows: [nut] } = await c.query(
      `INSERT INTO asset_nodes (node_type, name, slug) VALUES ('project', 'Nút thử S10', $1) RETURNING id, slug`, [`s10-thu-${process.pid}`]);
    const { rows: [toa] } = await c.query(
      `INSERT INTO asset_nodes (node_type, name, slug) VALUES ('building', 'Toà thử S10', $1) RETURNING slug`, [`s10-toa-thu-${process.pid}`]);
    const tinHieu = boDau(chon.du_an);
    const bang = (sua = {}) => ({ noi: [{ project_id: chon.project_id, slug: nut.slug, tin_hieu: tinHieu }],
      tu_khoa_lat: { [nut.slug]: [tinHieu] }, loai: [], ...sua });
    const chup = async () => (await c.query(
      `SELECT count(*)::int n, md5(coalesce(string_agg(project_id || '|' || coalesce(asset_node_id::text, '') || '|' || status || '|' || coalesce(ly_do, '') || '|' || updated_at, ',' ORDER BY project_id), '')) h
         FROM s10_project_links`)).rows[0];
    const goi = (args, t = tep) => {
      const r = chay(NOI, ["--tep", t, ...args]);
      for (const dong of r.stdout.split("\n").filter(Boolean)) assert.match(dong, DONG_HOP_LE, `S10-AC-3: stdout lạ «${dong}»`);
      return r;
    };
    // --thu không ghi.
    writeFileSync(tep, JSON.stringify(bang()));
    const truoc = await chup();
    assert.equal(goi(["--thu"]).status, 0);
    assert.deepEqual(await chup(), truoc, "S10-AC-3: --thu ghi bảng nối");
    // Ghi thật.
    assert.equal(goi([]).status, 0);
    const { rows: links } = await c.query("SELECT project_id, asset_node_id, status, ly_do FROM s10_project_links");
    const noi = links.filter((l) => l.status === "noi");
    assert.deepEqual(noi.map((l) => [l.project_id, String(l.asset_node_id)]), [[chon.project_id, String(nut.id)]], "S10-AC-3: dòng noi sai");
    assert.equal(links.length, duAn.length, "S10-AC-3: không phải mọi dự án đều có dòng");
    assert.ok(links.filter((l) => l.status === "chua_noi").every((l) => l.ly_do), "S10-AC-3: chua_noi thiếu lý do");
    // Chạy lại không đổi (kể cả dự án hai nhãn).
    const sau1 = await chup();
    assert.equal(goi([]).status, 0);
    assert.deepEqual(await chup(), sau1, "S10-AC-3: chạy lại đổi bảng nối");
    // Lỗi: mỗi tệp sai in đúng mã, thoát 1, bảng không đổi.
    const khac = duAn.find((d) => d.project_id !== chon.project_id);
    const LOI = [
      ["slug-khong-co", bang({ noi: [{ project_id: chon.project_id, slug: "khong-co-slug-nay", tin_hieu: tinHieu }] })],
      ["nut-khong-phai-project", bang({ noi: [{ project_id: chon.project_id, slug: toa.slug, tin_hieu: tinHieu }], tu_khoa_lat: { [toa.slug]: [tinHieu] } })],
      ["du-an-hai-dong", bang({ noi: [{ project_id: chon.project_id, slug: nut.slug, tin_hieu: tinHieu }, { project_id: chon.project_id, slug: nut.slug, tin_hieu: tinHieu }] })],
      ["project-id-la", bang({ noi: [{ project_id: "999999999", slug: nut.slug, tin_hieu: tinHieu }] })],
      ["tin-hieu-khong-khop", bang({ noi: [{ project_id: chon.project_id, slug: nut.slug, tin_hieu: "zzz khong co" }], tu_khoa_lat: { [nut.slug]: ["zzz khong co"] } })],
      ["ung-vien-bi-sot", bang({ tu_khoa_lat: { [nut.slug]: [tinHieu, boDau(khac.du_an)] } })],
    ];
    for (const [ma, b] of LOI) {
      writeFileSync(tep, JSON.stringify(b));
      const r = goi([]);
      assert.equal(r.status, 1, `S10-AC-3: lỗi ${ma} không thoát 1`);
      assert.ok(r.stdout.split("\n").includes(`loi: ${ma}`), `S10-AC-3: không in «loi: ${ma}»\n${r.stdout}`);
      assert.deepEqual(await chup(), sau1, `S10-AC-3: lỗi ${ma} vẫn ghi`);
    }
    writeFileSync(tepLo, JSON.stringify(bang()));
    const rLo = goi([], tepLo);
    assert.equal(rLo.status, 1);
    assert.match(rLo.stdout, /^loi: tep-khong-bi-bo-qua$/m, "S10-AC-3: tệp không bị git bỏ qua vẫn được đọc");
    // Tên dự án nhiều giá trị ở snapshot mới nhất.
    writeFileSync(tep, JSON.stringify(bang()));
    await c.query(`INSERT INTO stg_s10_project (project_id, du_an, project_label, snapshot_id, captured_at)
                   SELECT project_id, 'Tên khác S10-AC-3', 'Nhãn ba S10-AC-3', snapshot_id, captured_at FROM stg_s10_project
                    WHERE project_id = $1 AND snapshot_id = $2 LIMIT 1`, [moi.project_id, moi.snapshot_id]);
    const rTen = goi([]);
    assert.equal(rTen.status, 1);
    assert.match(rTen.stdout, /^loi: du-an-nhieu-ten$/m, "S10-AC-3: tên dự án nhiều giá trị không báo lỗi");
    assert.deepEqual(await chup(), sau1, "S10-AC-3: lỗi tên nhiều giá trị vẫn ghi");
    await c.query(`DELETE FROM stg_s10_project WHERE du_an = 'Tên khác S10-AC-3'`);
    ca.noi = { project_id: chon.project_id, nut: nut.id };
    ca.chuaNoi = links.find((l) => l.status === "chua_noi").project_id;
  } finally {
    rmSync(tep, { force: true }); rmSync(tepLo, { force: true });
    await c.end();
  }
});

test("S10-AC-4 view quỹ căn theo nút: mỗi căn bản mới nhất, dự án chưa nối không có dòng", async () => {
  const c = await ketNoi();
  try {
    const dem = async () => (await c.query("SELECT count(*)::int n FROM s10_quy_can_du_an WHERE asset_node_id = $1", [ca.noi.nut])).rows[0].n;
    const { rows: [{ n: mong }] } = await c.query(
      "SELECT count(DISTINCT stock_id)::int n FROM stg_s10_stock WHERE project_id = $1", [ca.noi.project_id]);
    assert.ok(mong > 0, "S10-AC-4: dự án đã nối không có căn nào");
    assert.equal(await dem(), mong, "S10-AC-4: số dòng view khác số stock_id của dự án");
    // Snapshot sau cùng stock_id, trạng thái khác.
    const { rows: [goc] } = await c.query(
      `SELECT * FROM stg_s10_stock WHERE project_id = $1 AND block_type IN (
         SELECT block_type FROM stg_s10_stock WHERE project_id = $1 GROUP BY 1 HAVING count(DISTINCT stock_id) >= 2)
       ORDER BY stock_id LIMIT 1`, [ca.noi.project_id]);
    assert.ok(goc, "S10-AC-4: dự án đã nối không có loại khối nào từ hai sản phẩm");
    await c.query(
      `INSERT INTO stg_s10_stock (stock_id, source_id, project_id, block_type, status_raw, snapshot_id, captured_at, raw_row)
       VALUES ($1, $2, $3, $4, 'Trạng thái mới S10-AC-4', 'snap-sau-S10-AC-4', $5::timestamptz + interval '1 day', $6)`,
      [goc.stock_id, goc.source_id, goc.project_id, goc.block_type, goc.captured_at, goc.raw_row]);
    assert.equal(await dem(), mong, "S10-AC-4: snapshot sau làm tăng số dòng view");
    const { rows: [v] } = await c.query(
      "SELECT status_raw FROM s10_quy_can_du_an WHERE asset_node_id = $1 AND stock_id = $2", [ca.noi.nut, goc.stock_id]);
    assert.equal(v.status_raw, "Trạng thái mới S10-AC-4", "S10-AC-4: view không lấy snapshot mới nhất");
    // Snapshot sau chỉ còn một sản phẩm của (dự án, loại khối) này: sản phẩm khác coi như đã rút khỏi bảng (con_trong_bang = false).
    const { rows: tt } = await c.query(
      `SELECT stock_id, con_trong_bang FROM s10_quy_can_du_an WHERE asset_node_id = $1 AND block_type = $2`, [ca.noi.nut, goc.block_type]);
    assert.ok(tt.find((r) => r.stock_id === goc.stock_id)?.con_trong_bang === true, "S10-AC-4: sản phẩm có ở snapshot mới nhất bị gắn đã rút");
    const rut = tt.filter((r) => r.stock_id !== goc.stock_id);
    assert.ok(rut.length > 0 && rut.every((r) => r.con_trong_bang === false), "S10-AC-4: sản phẩm vắng ở snapshot mới nhất vẫn gắn còn trong bảng");
    // Chiều đỏ: cùng phép đếm trên bảng thô (không chọn bản mới nhất) thì dư một dòng.
    const { rows: [{ n: tho }] } = await c.query("SELECT count(*)::int n FROM stg_s10_stock WHERE project_id = $1", [ca.noi.project_id]);
    assert.ok(tho > mong, "S10-AC-4: thước không phân biệt được bản view bỏ chọn snapshot mới nhất");
    const { rows: [{ n: chuaNoi }] } = await c.query("SELECT count(*)::int n FROM s10_quy_can_du_an WHERE project_id = $1", [ca.chuaNoi]);
    assert.equal(chuaNoi, 0, "S10-AC-4: dự án chưa nối có dòng trong view");
  } finally { await c.end(); }
});
