#!/usr/bin/env node
// danh-ba-s16-cau-truc-that.mjs — DA37 danh-ba-s16-thang-cau-truc E2b, E9, E10: trên bản chép DB máy thu áp 111, dựng thẻ luật phân khu S16 rồi áp đúng băm, dựng năm khu; so tám ô với bảng kỳ vọng của AC-10; rồi chạy đường
// lùi có đích của hàng (lui/) và so dấu vân tay trước áp. DB máy thu chỉ bị đọc (pg_dump). Chỉ in số — không mã căn, toa_id,
// khu_id hay tên nguồn. Lệch một ô → thoát 1 nêu ô.   Chạy ở máy thu: node pipeline/scripts/danh-ba-s16-cau-truc-that.mjs
// Bản chép: script tự chạy lại mình qua `db/db-thu.sh oneinvest_suite_s37that --chay` — DB của lượt sinh bằng `createdb -T` từ
// bản mẫu oneinvest_suite_mau (pg_dump DB máy thu một lần, giữ 24 giờ, dựng lại khi lược đồ đổi), xoá khi lệnh dừng. Không tự
// pg_dump mỗi lượt (GS 18/11: DB máy thu sau DA33 chép mất 16 phút). Hàng khác đo trên bản chép dùng cùng khuôn.
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";
import { GOC, MAY_CHU, apTep } from "./db-thu-dbv.mjs";
import { dung } from "../danh-ba-vat-the.mjs";
import { apTheLuat, daoTheLuat, dungTheLuat } from "../phan-khu-s16.mjs";
import { soatDuLieu, tokenS16 } from "../lib/s16-soat.mjs";

const TRONG = process.env.S37_THAT_TRONG === "1";
const TEN = TRONG ? new URL(process.env.DATABASE_URL ?? "postgres://x/").pathname.slice(1) : null;
const LUI = join(GOC, "_acceptance/danh-ba-s16-thang-cau-truc/lui");
const KHU = ["vinhomes-ocean-park-1", "vinhomes-ocean-park-2", "vinhomes-ocean-park-3", "vinhomes-smart-city", "vinhomes-grand-park"];
const MONG = { khu: 61, nut: 61, mo_ho: 0, toa_treo_truoc: 109, toa_treo_sau: 0, can_gop: 2, the_nghi: 2, mo_ho_cho: 38, trung_ten_cho: 20,
  doi_goc: 0, khoa_lan_hai: 0, toa_mot_khu: 218, toa_nhieu_khu: 0, soat_asset_nodes: 0 };
const loi = [];
const o = (ten, thuc) => { const ok = Math.abs(thuc - MONG[ten]) === 0; console.log(`${ok ? "  " : "✗ "}${ten}: ${thuc} (kỳ vọng ${MONG[ten]})`); if (!ok) loi.push(ten); };
const sh = (cmd, args, env = {}) => execFileSync(cmd, args, { cwd: GOC, encoding: "utf8", env: { ...process.env, ...env }, maxBuffer: 1 << 26 });
const vanTay = () => sh("bash", [join(LUI, "dau-van-tay.sh"), TEN]).split("\n").filter(Boolean);

const TOA16 = `SELECT DISTINCT object_key FROM registry_aliases WHERE source = 'S16' AND kind = 'ma_nguon' AND retired_at IS NULL
                AND object_key LIKE 'bld\\_%' AND value ~ '^[^/]+/[^/]+$'`;
async function main() {
  if (!TRONG) {
    // Chạy lại chính mình trong DB của lượt; mã thoát của lượt là mã thoát của script.
    const r = spawnSync("bash", [join(GOC, "db/db-thu.sh"), "oneinvest_suite_s37that", "--chay", process.execPath, ...process.argv.slice(1)],
      { cwd: GOC, stdio: "inherit", env: { ...process.env, DATABASE_URL: "", S37_THAT_TRONG: "1" } });
    process.exitCode = r.status ?? 1;
    return;
  }
  if (!/^oneinvest_suite_s37that_[0-9]+$/.test(TEN)) { console.error(`từ chối: DB «${TEN}» không phải DB của lượt db-thu --chay`); process.exitCode = 2; return; }
  const c = new pg.Client({ connectionString: `${MAY_CHU}/${TEN}` });
  await c.connect();
  const mot = async (s, p = []) => (await c.query(s, p)).rows[0];
  const treo = async () => (await mot(`SELECT count(*)::int AS n FROM v_toa_nut_vung v JOIN asset_nodes n ON n.id = v.region_node_id
                                         WHERE n.node_type = 'project' AND v.building_key IN (${TOA16})`)).n;
  const bamGoc = async () => (await mot("SELECT md5(string_agg(building_key || ':' || region_node_id, ',' ORDER BY building_key)) AS h FROM buildings")).h;
  try {
    const vt0 = vanTay();
    o("toa_treo_truoc", await treo());
    const goc0 = await bamGoc();
    apTep(TEN, join(GOC, "db/migrations/111_v_toa_nut_vung_s16.sql"));
    apTep(TEN, join(GOC, "db/migrations/114_v_toa_nut_vung_s16_bam.sql"));
    // E2b: khu của toà S16 từ bản thu có danh sách khu
    const k = await mot(`WITH t AS (SELECT a.object_key, count(DISTINCT st.du_an || '/' || st.khu_id) AS nk FROM registry_aliases a
        JOIN stg_s16_toa st ON st.du_an = split_part(a.value, '/', 1) AND st.toa_id = split_part(a.value, '/', 2)
        JOIN stg_s16_khu kh ON kh.snapshot_id = st.snapshot_id AND kh.du_an = st.du_an AND kh.khu_id = st.khu_id
       WHERE a.object_key IN (${TOA16}) GROUP BY 1)
      SELECT count(*) FILTER (WHERE nk = 1)::int AS mot, count(*) FILTER (WHERE nk > 1)::int AS nhieu FROM t`);
    o("toa_mot_khu", k.mot); o("toa_nhieu_khu", k.nhieu);
    // AC-3, AC-10: thẻ luật rồi áp đúng băm
    const the = await dungTheLuat(c);
    const dem = (nut) => the.dong.filter((d) => d.nut === nut).length;
    o("khu", the.dong.length); o("nut", dem("moi") + dem("san") + dem("da-co")); o("mo_ho", dem("mo-ho"));
    console.log(`  thẻ luật: nút mới ${dem("moi")} · nút sẵn ${dem("san")} · đã gán ${dem("da-co")}`);
    const T0 = (await mot("SELECT now()::text AS t")).t;
    const ap = await apTheLuat(c, { bam: the.bam, nguoi: "thu-s37" });
    const tk = await dung(c, { khuSlugs: KHU, log: () => {}, runId: `dbv-s37-${Date.now()}` });
    const T1 = (await mot("SELECT now()::text AS t")).t;
    o("toa_treo_sau", await treo());
    // asset_nodes đi cloud: sau áp thẻ luật, bộ soát S16 của sync-cloud (DA33) không bắt token nào (meta chỉ mang băm khu — 114)
    const nodes = new Map([["asset_nodes", (await c.query("SELECT row_to_json(x)::text AS j FROM asset_nodes x")).rows.map((r) => r.j)]]);
    const hit = soatDuLieu(nodes, await tokenS16(c));
    o("soat_asset_nodes", hit ? 1 : 0);
    if (hit) console.log(`  bộ soát dừng ở ${hit.bang}.${hit.cot}`);
    o("can_gop", Object.values(tk.s16.khu).reduce((a, t) => a + (t.can_s08_gop ?? 0), 0));
    const the2 = async (loai, st) => (await mot(`SELECT count(*)::int AS n FROM review_queue WHERE item_id LIKE 's16:%' AND evidence ->> 'loai' = $1 AND status = $2`, [loai, st])).n;
    o("the_nghi", await the2("can-lech-toa", "rejected"));
    o("mo_ho_cho", await the2("can-mo-ho", "pending"));
    o("trung_ten_cho", await the2("toa-trung-ten", "pending"));
    o("doi_goc", (await bamGoc()) === goc0 ? 0 : 1);
    const lech = (await c.query("SELECT du_an, cap_nguon, loai, so FROM v_lech_cau_truc_s16 ORDER BY 1, 2, 3")).rows;
    console.log("  lệch cấu trúc theo cặp nguồn:");
    for (const r of lech) console.log(`    ${r.du_an} · ${r.cap_nguon} · ${r.loai}: ${r.so}`);
    const tk2 = await dung(c, { khuSlugs: KHU, log: () => {}, runId: `dbv-s37b-${Date.now()}` });
    o("khoa_lan_hai", tk2.khoa_moi + (tk2.s16.khoa_moi ?? 0));
    // E9: đường lùi có đích — tệp khoá theo mốc của lượt một (không phải lượt hai)
    const tam = mkdtempSync(join(tmpdir(), "s37-"));
    const tep = join(tam, "khoa.tsv");
    writeFileSync(tep, sh("bash", [join(LUI, "ghi-khoa.sh"), tk.s16.moc, T0, T1], { DB: TEN }));
    const sai = spawnSync("bash", [join(LUI, "go-khoa.sh"), tep, "oneinvest_suite_khong_co"], { encoding: "utf8" });
    console.log(`  go-khoa tệp sai DB: thoát ${sai.status}`);
    if (sai.status !== 4) loi.push("go-khoa-sai-db");
    sh("bash", [join(LUI, "go-khoa.sh"), tep, TEN]);
    if (ap.rule_id) await daoTheLuat(c, { ruleId: ap.rule_id, nguoi: "thu-s37" });
    apTep(TEN, join(LUI, "lui-111.sql"));
    const vt1 = vanTay();
    const so = (a) => a.filter((l) => !l.startsWith("#"));
    const lechVt = so(vt0).filter((l, i) => l !== so(vt1)[i]);
    console.log(`  dấu vân tay sau lùi: ${lechVt.length ? `LỆCH ${lechVt.map((l) => l.split(" ")[0]).join(", ")}` : "trùng trước áp"}`);
    if (lechVt.length) loi.push("van-tay");
    console.log(`  phần dư: ${vt1.filter((l) => l.startsWith("# du")).join(" · ")}`);
    // Chiều đỏ của thước dấu vân tay: một thẻ lệch không về pending → thước phải lệch đúng bảng review_queue
    await c.query(`UPDATE review_queue SET status = 'rejected' WHERE id = (SELECT min(id) FROM review_queue WHERE evidence ->> 'loai' = 'can-lech-toa')`);
    const doCo = so(vanTay()).some((l, i) => l.startsWith("review_queue") && l !== so(vt0)[i]);
    console.log(`  đối chứng: thẻ lệch không về pending → dấu vân tay ${doCo ? "bắt được" : "KHÔNG bắt"}`);
    if (!doCo) loi.push("doi-chung-the-lech");
    rmSync(tam, { recursive: true, force: true });
  } finally {
    await c.end().catch(() => {});
  }
  if (loi.length) { console.log(`LỆCH: ${loi.join(", ")}`); process.exitCode = 1; } else console.log("OK");
}
main().catch((e) => { console.error(e.message); process.exitCode = 1; });
