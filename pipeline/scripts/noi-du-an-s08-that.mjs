#!/usr/bin/env node
// noi-du-an-s08-that.mjs — DA55 soat-noi-s08-danh-ba E7 (AC-7): trên bản chép DB máy thu chạy trọn chuỗi thẻ → áp → kiểm → đo → đảo,
// so từng ô. DB máy thu chỉ bị đọc (pg_dump của db/db-thu.sh). Chỉ in số, không in mã hay tên nguồn. Lệch một ô → thoát 1 nêu ô.
// Ô trên màn đọc bằng chính docDanhBa của app, nên chạy dưới tsx từ thư mục app:
//   cd app && node --import tsx ../pipeline/scripts/noi-du-an-s08-that.mjs
// Bộ gắn PL20 ghim sha e27d1e690 (nhánh feat/ghep-tin-vao-danh-muc), đọc từ worktree P4_WT; HEAD khác sha → thoát 2. Ngoài CI.
import { execFileSync, spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";
import { GOC, MAY_CHU } from "./db-thu-dbv.mjs";

const TRONG = process.env.NS8_THAT_TRONG === "1";
const TEN = TRONG ? new URL(process.env.DATABASE_URL ?? "postgres://x/").pathname.slice(1) : null;
const gocChinh = () => dirname(resolve(GOC, execFileSync("git", ["-C", GOC, "rev-parse", "--git-common-dir"], { encoding: "utf8" }).trim()));
const P4_WT = process.env.P4_WT ?? join(gocChinh(), ".claude/worktrees/ghep-tin-vao-danh-muc");
const P4_SHA = "e27d1e690";
const loi = [];
const o = (ten, thuc, mong) => {
  const ok = JSON.stringify(thuc) === JSON.stringify(mong);
  console.log(`${ok ? "  " : "✗ "}${ten}: ${JSON.stringify(thuc)}${ok ? "" : ` (kỳ vọng ${JSON.stringify(mong)})`}`);
  if (!ok) loi.push(ten);
};

async function main() {
  if (!TRONG) {
    const ten = `oneinvest_suite_ns8that_${process.pid}`;
    const dbThu = (...a) => spawnSync("bash", [join(GOC, "db/db-thu.sh"), ten, ...a], { cwd: GOC, stdio: ["ignore", "ignore", "inherit"], env: { ...process.env, DATABASE_URL: "" } });
    if (dbThu().status !== 0) { console.error("không chép được DB máy thu"); process.exitCode = 2; return; }
    const r = spawnSync(process.execPath, [...process.execArgv, ...process.argv.slice(1)], { cwd: process.cwd(), stdio: "inherit",
      env: { ...process.env, DATABASE_URL: `${MAY_CHU}/${ten}`, NS8_THAT_TRONG: "1" } });
    dbThu("--xoa");
    process.exitCode = r.status ?? 1;
    return;
  }
  if (!/^oneinvest_suite_ns8that_[0-9]+$/.test(TEN)) { console.error(`từ chối: DB «${TEN}» không phải DB của lượt này`); process.exitCode = 2; return; }
  let sha;
  try { sha = execFileSync("git", ["-C", P4_WT, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(); } catch { sha = ""; }
  if (!sha.startsWith(P4_SHA)) { console.error(`bộ gắn PL20 phải ở sha ${P4_SHA} (P4_WT=${P4_WT}), đang ở «${sha || "không đọc được"}»`); process.exitCode = 2; return; }
  console.log(`  bộ gắn PL20 sha: ${sha.slice(0, 9)}`);
  const { docDauVao, tinhGan } = await import(pathToFileURL(join(P4_WT, "pipeline/lib/ghep-tin-danh-muc-doc.mjs")).href);
  const { apTheLuat, daoTheLuat, dungTheLuat, kiemLuot } = await import("../noi-du-an-s08-luat.mjs");
  const { dungKeHoachNoi } = await import("../phan-khu-s16.mjs");
  const { demNga } = await import(pathToFileURL(join(GOC, "_acceptance/soat-noi-s08-danh-ba/probes/bang-phu.mjs")).href);
  const { docDanhBa } = await import(pathToFileURL(join(GOC, "app/src/lib/ops/registry/doc.ts")).href);

  const c = new pg.Client({ connectionString: `${MAY_CHU}/${TEN}` });
  await c.connect();
  const vanTay = async (sql) => (await c.query(`SELECT md5(coalesce(string_agg(row_to_json(t)::text, '' ORDER BY 1), '')) AS h FROM (${sql}) t`)).rows[0].h;
  const ids0 = (await c.query("SELECT array_agg(id ORDER BY id) AS a FROM asset_nodes")).rows[0].a;
  const vtNut = () => vanTay(`SELECT * FROM asset_nodes WHERE id = ANY('{${ids0.join(",")}}'::bigint[]) ORDER BY id`);
  const vtTay = () => vanTay("SELECT project_id, asset_node_id, status, ly_do FROM s08_project_links ORDER BY 1");
  const o8 = async () => {
    const s = (await docDanhBa(c)).tong.danhMuc.find((x) => x.source === "S08");
    return { noi_co_san: s.daNoi - s.noiUngVien, noi_ung_vien: s.noiUngVien, chua_noi: s.chuaNoi, da_nap: s.daNap };
  };
  const pl20 = async () => {
    const { dem } = tinhGan(await docDauVao(c));
    return { gan: dem.gan, xung_dot: dem.xung_dot, chu_model_khac: dem.ly_do?.["chu-model-khac"] ?? 0 };
  };
  try {
    o("tien_de_chua_co_luat_s08", (await c.query("SELECT count(*)::int AS n FROM project_link_rules WHERE source = 'S08'")).rows[0].n, 0);
    const dem = await demNga(c);
    console.log(`  bảng phủ đếm lại: ${JSON.stringify(dem)}`);
    const vtN0 = await vtNut(), vtT0 = await vtTay();
    const man0 = await o8();
    const da53 = (await dungKeHoachNoi(c)).bam;
    const p0 = await pl20();
    o("man_truoc", man0, { noi_co_san: dem.giu_tay, noi_ung_vien: 0, chua_noi: dem.tong - dem.giu_tay, da_nap: dem.tong });

    const the = await dungTheLuat(c);
    const tong = (k) => the.tong[k]?.du_an ?? 0;
    o("nga_the", { giu_tay: tong("giu_tay"), noi: tong("noi"), the_cap: tong("the_cap"), duc: tong("duc"), tu_choi: tong("tu_choi"), nut_moi: the.soNutMoi },
      { giu_tay: dem.giu_tay, noi: dem.noi, the_cap: dem.the_cap, duc: dem.duc, tu_choi: dem.tu_choi, nut_moi: dem.nut_moi });
    o("the_khong_ghi", [await vtNut(), await vtTay()], [vtN0, vtT0]);

    // Thứ tự nguồn với DA42: cấy một nút ứng viên S09 chưa biết tỉnh trùng tên một dự án sẽ đúc → dự án đó ra thẻ từng cặp.
    const mau = the.ds.find((d) => d.kq.status === "duc" && the.ds.filter((x) => x.kq.nhom === d.kq.nhom).length === 1);
    await c.query("BEGIN");
    try {
      const { rows: [n9] } = await c.query(`INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, catalog_tier, meta)
        VALUES ('project', $1, 'ns8-that-s09-cay', ARRAY[lower($1)], '{}', 'mot_loi_khai', '{"nguon_ung_vien":"S09"}') RETURNING id::int AS id`, [mau.ten]);
      const t9 = await dungTheLuat(c);
      const k9 = t9.ds.find((d) => d.ma === mau.ma).kq;
      o("s09_truoc_nga", [k9.status, k9.ly_do, k9.ung_vien], ["chua_noi", "nut-khong-tinh", [n9.id]]);
      o("s09_truoc_nut_moi", t9.soNutMoi, the.soNutMoi - 1);
    } finally { await c.query("ROLLBACK"); }

    const kq = await apTheLuat(c, { bam: the.bam, nguoi: "do-thu" });
    o("nut_moi_da_duc", kq.soNutMoi, dem.nut_moi);
    o("kiem_luot", await kiemLuot(c), { hai_nut: 0, lech_tinh: 0, thieu_trang_thai: 0 });
    // Nút đích của ngả «nối nút có sẵn» có thể chính là nút ứng viên của nguồn khác (S06 đúc, mot_loi_khai): màn đếm nó vào nút ứng viên.
    const { rows: [uv] } = await c.query("SELECT count(*)::int AS n FROM asset_nodes WHERE id = ANY($1) AND catalog_tier = 'mot_loi_khai'",
      [the.ds.filter((d) => d.kq.status === "noi").map((d) => d.kq.node_id)]);
    const noiVaoUngVien = the.ds.filter((d) => d.kq.status === "noi").length === 0 ? 0
      : (await c.query("SELECT count(*)::int AS n FROM unnest($1::bigint[]) x(id) JOIN asset_nodes n ON n.id = x.id WHERE n.catalog_tier = 'mot_loi_khai'",
        [the.ds.filter((d) => d.kq.status === "noi").map((d) => d.kq.node_id)])).rows[0].n;
    console.log(`  ngả nối vào nút có sẵn mà nút là ứng viên nguồn khác: ${noiVaoUngVien} dự án (${uv.n} nút)`);
    o("man_sau", await o8(), { noi_co_san: dem.giu_tay + dem.noi - noiVaoUngVien, noi_ung_vien: dem.duc + noiVaoUngVien, chua_noi: dem.tu_choi + dem.the_cap, da_nap: dem.tong });
    o("nut_co_san_va_bang_tay_sau_ap", [await vtNut(), await vtTay()], [vtN0, vtT0]);
    const { rows: [g] } = await c.query(`
      WITH n AS (SELECT id FROM asset_nodes WHERE meta ->> 'nguon' = 'S08')
      SELECT (SELECT count(*)::int FROM offer_project WHERE project_node_id IN (SELECT id FROM n)) AS tin,
             (SELECT count(*)::int FROM offer_price_rank WHERE nut IN (SELECT id::text FROM n)) AS hang`);
    o("nut_ung_vien_khong_tin_khong_hang", g, { tin: 0, hang: 0 });
    o("bam_da53_khong_doi", (await dungKeHoachNoi(c)).bam, da53);
    const p1 = await pl20();
    console.log(`  PL20 trước: ${JSON.stringify(p0)} · sau: ${JSON.stringify(p1)}`);
    o("pl20_khong_doi", p1, p0);
    const { rows: biDanh } = await c.query(`SELECT DISTINCT n.name FROM registry_aliases a JOIN asset_nodes n ON a.object_key = 'node:' || n.id
       WHERE a.source = 'S08' AND a.retired_at IS NULL AND n.id = ANY('{${ids0.join(",")}}'::bigint[]) ORDER BY 1`);
    console.log(`  nút có sẵn nhận bí danh S08 (hồ sơ áp): ${biDanh.map((r) => r.name).join(" · ")}`);

    await daoTheLuat(c, { ruleId: kq.rule_id, nguoi: "do-thu" });
    o("man_sau_dao", await o8(), man0);
    o("nut_co_san_va_bang_tay_sau_dao", [await vtNut(), await vtTay()], [vtN0, vtT0]);
  } finally {
    await c.end();
  }
  if (loi.length) { console.error(`lệch ${loi.length} ô: ${loi.join(", ")}`); process.exitCode = 1; } else console.log("đạt: mọi ô khớp bảng kỳ vọng");
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; });
