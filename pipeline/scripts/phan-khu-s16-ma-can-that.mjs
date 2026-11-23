#!/usr/bin/env node
// phan-khu-s16-ma-can-that.mjs — DA53 gop-nut-trung-ma-can-s16 E8: trên bản chép DB máy thu chạy trọn chuỗi thẻ nối → nối → kiểm → đo
// bên đọc và bộ gắn PL20 → đảo, so từng ô với bảng kỳ vọng. DB máy thu chỉ bị đọc (pg_dump của db/db-thu.sh). Chỉ in số, không in mã
// khu, toà, căn hay tên nguồn. Lệch một ô → thoát 1 nêu ô. Ngoài CI.
// Bộ gắn PL20 ghim sha e27d1e690 (nhánh feat/ghep-tin-vao-danh-muc): đọc từ worktree P4_WT, HEAD khác sha → thoát 2; đo trước và sau
// trên cùng sha.
// Chạy ở máy thu: node pipeline/scripts/phan-khu-s16-ma-can-that.mjs
import { execFileSync, spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";
import { GOC, MAY_CHU } from "./db-thu-dbv.mjs";
import { CAN_CU_NOI, apNoi, daoNoi, dungKeHoachNoi, kiemNoi } from "../phan-khu-s16.mjs";
import { docTenPhanKhu } from "../lib/phan-khu-s16-bi-danh.mjs";
import { kiemBiDanh } from "./bi-danh-viet-tat-phan-khu.mjs";

const TRONG = process.env.GNT_THAT_TRONG === "1";
const TEN = TRONG ? new URL(process.env.DATABASE_URL ?? "postgres://x/").pathname.slice(1) : null;
// Worktree nằm dưới checkout chính (cha của thư mục .git chung), không dưới worktree đang chạy.
const gocChinh = () => dirname(resolve(GOC, execFileSync("git", ["-C", GOC, "rev-parse", "--git-common-dir"], { encoding: "utf8" }).trim()));
const P4_WT = process.env.P4_WT ?? join(gocChinh(), ".claude/worktrees/ghep-tin-vao-danh-muc");
const P4_SHA = "e27d1e690";
const LUOT_DA46 = 3, LUOT_DA51 = 4;
const MOI = 389, GIU = 48;
const loi = [];
const o = (ten, thuc, mong) => {
  const ok = JSON.stringify(thuc) === JSON.stringify(mong);
  console.log(`${ok ? "  " : "✗ "}${ten}: ${JSON.stringify(thuc)}${ok ? "" : ` (kỳ vọng ${JSON.stringify(mong)})`}`);
  if (!ok) loi.push(ten);
};
const nguong = (ten, thuc, dat, moTa) => {
  console.log(`${dat ? "  " : "✗ "}${ten}: ${JSON.stringify(thuc)}${dat ? "" : ` (cần ${moTa})`}`);
  if (!dat) loi.push(ten);
};

async function main() {
  if (!TRONG) {
    const ten = `oneinvest_suite_gntthat_${process.pid}`;
    const dbThu = (...a) => spawnSync("bash", [join(GOC, "db/db-thu.sh"), ten, ...a], { cwd: GOC, stdio: ["ignore", "ignore", "inherit"], env: { ...process.env, DATABASE_URL: "" } });
    if (dbThu().status !== 0) { console.error("không chép được DB máy thu"); process.exitCode = 2; return; }
    const r = spawnSync(process.execPath, process.argv.slice(1), { cwd: GOC, stdio: "inherit", env: { ...process.env, DATABASE_URL: `${MAY_CHU}/${ten}`, GNT_THAT_TRONG: "1" } });
    dbThu("--xoa");
    process.exitCode = r.status ?? 1;
    return;
  }
  if (!/^oneinvest_suite_gntthat_[0-9]+$/.test(TEN)) { console.error(`từ chối: DB «${TEN}» không phải DB của lượt này`); process.exitCode = 2; return; }
  let sha;
  try { sha = execFileSync("git", ["-C", P4_WT, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(); } catch { sha = ""; }
  if (!sha.startsWith(P4_SHA)) { console.error(`bộ gắn PL20 phải ở sha ${P4_SHA} (P4_WT=${P4_WT}), đang ở «${sha || "không đọc được"}»`); process.exitCode = 2; return; }
  console.log(`  bộ gắn PL20 sha: ${sha.slice(0, 9)}`);
  const { docDauVao, tinhGan } = await import(pathToFileURL(join(P4_WT, "pipeline/lib/ghep-tin-danh-muc-doc.mjs")).href);

  const c = new pg.Client({ connectionString: `${MAY_CHU}/${TEN}` });
  await c.connect();
  const vanTay = async () => (await c.query(`SELECT md5(string_agg(id || ':' || COALESCE(parent_id::text, '') || ':' || meta::text || ':' || aliases::text, ',' ORDER BY id)) AS h FROM asset_nodes`)).rows[0].h;
  const demToa = async (id) => (await c.query("SELECT count(*)::int AS n FROM v_toa_nut_vung WHERE region_node_id = $1", [id])).rows[0].n;
  const duAnGiu = async () => (await c.query("SELECT parent_id::text AS p FROM asset_nodes WHERE id = $1", [GIU])).rows[0].p;
  const demPhanKhu = async (duAn) => (await docTenPhanKhu(c)).filter((r) => r.du_an === duAn).length;
  const pl20 = async () => {
    const { dem } = tinhGan(await docDauVao(c));
    return { gan: dem.gan, xung_dot: dem.xung_dot, chu_model_khac: dem.ly_do?.["chu-model-khac"] ?? 0 };
  };
  try {
    // Lượt nối mã căn đã áp trên máy thu thì đảo trên bản chép để đo lại từ trạng thái trước áp. Lượt DA46 giữ nguyên.
    const { rows: [n389] } = await c.query("SELECT meta FROM asset_nodes WHERE id = $1", [MOI]);
    const daNoi = Number(n389?.meta?.noi?.rule_id ?? 0);
    if (daNoi && daNoi !== LUOT_DA46) await daoNoi(c, { ruleId: daNoi, nguoi: "do-thu" });
    o("tien_de_kiem_da46", (await kiemNoi(c, { ruleId: LUOT_DA46 })).ok, true);
    o("tien_de_kiem_da51", (await kiemBiDanh(c, { ruleId: LUOT_DA51 })).ok, true);

    const vt0 = await vanTay();
    const gp = await duAnGiu();
    const pk0 = await demPhanKhu(gp);
    const p0 = await pl20();
    const kh = await dungKeHoachNoi(c);
    o("cap_ma_can", kh.cap.filter((x) => x.can_cu === "ma-can-s16").map((x) => [x.moi_id, x.cu_id, x.trung, x.tien_to, x.tong]), [[MOI, GIU, 8, 16, 16]]);
    o("cap_s09", kh.cap.filter((x) => x.can_cu === "toa-s09").length, 0);
    o("can_nguoi", kh.can_nguoi.map((x) => [x.moi_id, x.nut, x.ly_do]), [[398, [42], "it-trung"]]);
    o("khong_noi_396", kh.khong_noi.filter((x) => x.moi_id === 396).map((x) => [x.ly_do, x.voi_id]), [["duoi-nguong-ma-can", 30]]);
    o("the_khong_ghi", await vanTay(), vt0);
    o("toa_truoc", [await demToa(GIU), await demToa(MOI)], [17, 1]);
    o("phan_khu_truoc", pk0, 13);

    const kq = await apNoi(c, { bam: kh.bam, nguoi: "do-thu" });
    o("so_cap_noi", kq.so, 1);
    o("toa_sau", [await demToa(GIU), await demToa(MOI)], [18, 0]);
    o("phan_khu_sau", await demPhanKhu(gp), 12);
    o("kiem_luot_moi", await kiemNoi(c, { ruleId: kq.rule_id }), { ok: true, loi: [] });
    o("kiem_da46_sau_noi", (await kiemNoi(c, { ruleId: LUOT_DA46 })).ok, true);
    o("kiem_da51_sau_noi", (await kiemBiDanh(c, { ruleId: LUOT_DA51 })).ok, true);

    const p1 = await pl20();
    console.log(`  PL20 trước: ${JSON.stringify(p0)} · sau: ${JSON.stringify(p1)}`);
    nguong("pl20_gan_them", p1.gan - p0.gan, p1.gan - p0.gan >= 80, "≥ 80");
    nguong("pl20_chu_model_khac_giam", p0.chu_model_khac - p1.chu_model_khac, p0.chu_model_khac - p1.chu_model_khac >= 80, "≥ 80");
    nguong("pl20_xung_dot_tang", p1.xung_dot - p0.xung_dot, p1.xung_dot - p0.xung_dot <= 5, "≤ 5");

    await daoNoi(c, { ruleId: kq.rule_id, nguoi: "do-thu" });
    o("dao_van_tay", await vanTay(), vt0);
    o("kiem_da46_sau_dao", (await kiemNoi(c, { ruleId: LUOT_DA46 })).ok, true);
    o("kiem_da51_sau_dao", (await kiemBiDanh(c, { ruleId: LUOT_DA51 })).ok, true);
    const { rows: [l] } = await c.query("SELECT can_cu, dao_by FROM project_link_rules WHERE id = $1", [kq.rule_id]);
    o("dong_luat", [l.can_cu, l.dao_by], [CAN_CU_NOI, "do-thu"]);
  } finally {
    await c.end();
  }
  if (loi.length) { console.error(`lệch ${loi.length} ô: ${loi.join(", ")}`); process.exitCode = 1; } else console.log("đạt: mọi ô khớp bảng kỳ vọng");
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; });
