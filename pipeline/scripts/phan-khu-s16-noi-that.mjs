#!/usr/bin/env node
// phan-khu-s16-noi-that.mjs — DA46 noi-phan-khu-trung-s16 E9: trên bản chép DB máy thu chạy trọn chuỗi thẻ nối → áp → kiểm → dựng lại →
// đảo, so từng ô với bảng kỳ vọng. DB máy thu chỉ bị đọc. Chỉ in số, không in mã khu, mã toà hay tên nguồn. Lệch một ô → thoát 1 nêu ô.
// Chạy ở máy thu: node pipeline/scripts/phan-khu-s16-noi-that.mjs (tự chép DB máy thu sang DB của lượt rồi xoá khi xong).
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import pg from "pg";
import { GOC, MAY_CHU } from "./db-thu-dbv.mjs";
import { dung } from "../danh-ba-vat-the.mjs";
import { CAN_CU, CAN_CU_NOI, apNoi, daoNoi, dungKeHoachNoi, dungTheLuat, kiemNoi } from "../phan-khu-s16.mjs";

const TRONG = process.env.NPS_THAT_TRONG === "1";
const TEN = TRONG ? new URL(process.env.DATABASE_URL ?? "postgres://x/").pathname.slice(1) : null;
const KHU = ["vinhomes-ocean-park-1", "vinhomes-ocean-park-2", "vinhomes-ocean-park-3", "vinhomes-smart-city", "vinhomes-grand-park"];
// [nút mới, nút giữ lại, toà có S09, tổng toà]
const CAP = [[382, 23, 6, 7], [388, 43, 5, 5], [391, 40, 4, 4], [392, 42, 15, 15], [394, 41, 11, 11], [395, 33, 3, 3], [397, 27, 5, 5]];
const SAU = { 41: 11, 42: 16, 40: 4, 23: 7, 43: 5, 33: 3, 27: 5 };
const loi = [];
const o = (ten, thuc, mong) => {
  const ok = JSON.stringify(thuc) === JSON.stringify(mong);
  console.log(`${ok ? "  " : "✗ "}${ten}: ${JSON.stringify(thuc)}${ok ? "" : ` (kỳ vọng ${JSON.stringify(mong)})`}`);
  if (!ok) loi.push(ten);
};

async function main() {
  if (!TRONG) {
    // Chép mới từ DB máy thu, không dùng bản mẫu: phép đo cần đúng trạng thái sau luật số 2, bản mẫu có thể cũ hơn lượt áp đó.
    const ten = `oneinvest_suite_npsthat_${process.pid}`;
    const dbThu = (...a) => spawnSync("bash", [join(GOC, "db/db-thu.sh"), ten, ...a], { cwd: GOC, stdio: ["ignore", "ignore", "inherit"], env: { ...process.env, DATABASE_URL: "" } });
    if (dbThu().status !== 0) { console.error("không chép được DB máy thu"); process.exitCode = 2; return; }
    const r = spawnSync(process.execPath, process.argv.slice(1), { cwd: GOC, stdio: "inherit", env: { ...process.env, DATABASE_URL: `${MAY_CHU}/${ten}`, NPS_THAT_TRONG: "1" } });
    dbThu("--xoa");
    process.exitCode = r.status ?? 1;
    return;
  }
  if (!/^oneinvest_suite_npsthat_[0-9]+$/.test(TEN)) { console.error(`từ chối: DB «${TEN}» không phải DB của lượt này`); process.exitCode = 2; return; }
  const c = new pg.Client({ connectionString: `${MAY_CHU}/${TEN}` });
  await c.connect();
  const dungLai = (lan) => dung(c, { khuSlugs: KHU, log: () => {}, runId: `nps-that-${lan}` });
  const toaTheoNut = async () => new Map((await c.query("SELECT building_key, region_node_id::int AS id FROM v_toa_nut_vung")).rows.map((r) => [r.building_key, r.id]));
  const vanTay = async () => (await c.query(`SELECT md5(string_agg(id || ':' || COALESCE(parent_id::text, '') || ':' || meta::text || ':' || aliases::text, ',' ORDER BY id)) AS h FROM asset_nodes`)).rows[0].h;
  const soNut = async () => (await c.query("SELECT count(*)::int AS n FROM asset_nodes")).rows[0].n;
  try {
    const { rows: luat } = await c.query("SELECT id::int AS id FROM project_link_rules WHERE source = 'S16' AND can_cu = $1 AND dao_at IS NULL", [CAN_CU]);
    if (!luat.length) { console.error("DB máy thu chưa có luật phân khu S16 số 2 — không có gì để đo"); process.exitCode = 2; return; }
    // Việc nối đã áp trên máy thu thì đảo trên bản chép để đo lại từ trạng thái trước áp.
    const { rows: daNoi } = await c.query("SELECT id::int AS id FROM project_link_rules WHERE source = 'S16' AND can_cu = $1 AND dao_at IS NULL", [CAN_CU_NOI]);
    for (const l of daNoi) await daoNoi(c, { ruleId: l.id, nguoi: "do-thu" });
    await dungLai("on-dinh");

    const vt0 = await vanTay();
    const toa0 = await toaTheoNut();
    const nut0 = await soNut();
    const kh = await dungKeHoachNoi(c);
    o("cap", kh.cap.map((x) => [x.moi_id, x.cu_id, x.co_s09, x.tong_toa]), CAP);
    o("doi_chung_the_khong_ghi", await vanTay(), vt0);
    console.log(`  ca không nối: ${kh.khong_noi.length}`);

    const kq = await apNoi(c, { bam: kh.bam, nguoi: "do-thu" });
    o("so_cap_ap", kq.so, CAP.length);
    const toa1 = await toaTheoNut();
    const doi = [...toa1].filter(([k, v]) => toa0.get(k) !== v);
    const dichDung = new Map(CAP.map(([m, cu]) => [m, cu]));
    o("toa_doi_nut", doi.length, 50);
    o("toa_doi_sai_dich", doi.filter(([k, v]) => dichDung.get(toa0.get(k)) !== v).length, 0);
    const dem = (id) => [...toa1.values()].filter((v) => v === id).length;
    for (const [id, n] of Object.entries(SAU)) o(`toa_nut_${id}`, dem(Number(id)), n);
    o("toa_o_nut_nghi", CAP.reduce((t, [m]) => t + dem(m), 0), 0);
    o("cha_nut_nghi", (await c.query("SELECT id::int AS id, parent_id::int AS p FROM asset_nodes WHERE id = ANY($1) ORDER BY id", [CAP.map((x) => x[0])])).rows.map((r) => r.p), CAP.map((x) => x[1]));
    o("kiem_sau_ap", await kiemNoi(c, { ruleId: kq.rule_id }), { ok: true, loi: [] });
    const the = await dungTheLuat(c);
    o("the_luat_da_gan", the.dong.filter((d) => d.nut === "da-co").length, 61);
    o("the_luat_moi", the.dong.filter((d) => d.nut === "moi").length, 0);

    const dungLan = await dungLai("sau-noi");
    o("dung_lai_khoa_moi", dungLan.khoa_moi, 0);
    o("dung_lai_so_nut", await soNut(), nut0);
    o("kiem_sau_dung", await kiemNoi(c, { ruleId: kq.rule_id }), { ok: true, loi: [] });

    await daoNoi(c, { ruleId: kq.rule_id, nguoi: "do-thu" });
    o("dao_van_tay", await vanTay(), vt0);
    const toa2 = await toaTheoNut();
    o("dao_toa_lech", [...toa2].filter(([k, v]) => toa0.get(k) !== v).length, 0);
  } finally {
    await c.end();
  }
  if (loi.length) { console.error(`lệch ${loi.length} ô: ${loi.join(", ")}`); process.exitCode = 1; } else console.log("đạt: mọi ô khớp bảng kỳ vọng");
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; });
