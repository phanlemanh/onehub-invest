#!/usr/bin/env node
// bi-danh-viet-tat-phan-khu-that.mjs — DA51 E9: trên bản chép DB máy thu chạy trọn chuỗi thẻ → áp → đo → kiểm → đảo, so từng ô với
// bảng kỳ vọng. DB máy thu chỉ bị đọc (db/db-thu.sh chép sang DB của lượt rồi xoá). Chỉ in số, không in chữ bài.
// Lệch một ô → thoát 1 nêu ô. Chạy ở máy thu: node pipeline/scripts/bi-danh-viet-tat-phan-khu-that.mjs
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import pg from "pg";
import { GOC, MAY_CHU } from "./db-thu-dbv.mjs";
import { BANG_VIET_TAT } from "../lib/phan-khu-s16-bi-danh.mjs";
import { apBiDanh, daoBiDanh, doBiDanh, dungThe, kiemBiDanh } from "./bi-danh-viet-tat-phan-khu.mjs";

const TRONG = process.env.BDV_THAT_TRONG === "1";
const TEN = TRONG ? new URL(process.env.DATABASE_URL ?? "postgres://x/").pathname.slice(1) : null;
// Đích kỳ vọng (bảng phủ ca §2.1, đúng cả trước lẫn sau DA46) và sàn từng tên = 80% số tin chỉ đọc được nhờ tên (§2.2, 20/11).
const DICH = { ori: 44, rb: 48, bs: 387, gh: 43 };
const SAN = { ori: 333, rb: 108, bs: 282, gh: 190 };
const TANG_TOI_THIEU = 800;
const loi = [];
const o = (ten, dat, thuc, mong) => {
  console.log(`${dat ? "  " : "✗ "}${ten}: ${JSON.stringify(thuc)}${dat ? "" : ` (kỳ vọng ${mong})`}`);
  if (!dat) loi.push(ten);
};

async function main() {
  if (!TRONG) {
    const ten = `oneinvest_suite_bdvthat_${process.pid}`;
    const dbThu = (...a) => spawnSync("bash", [join(GOC, "db/db-thu.sh"), ten, ...a], { cwd: GOC, stdio: ["ignore", "ignore", "inherit"], env: { ...process.env, DATABASE_URL: "" } });
    if (dbThu().status !== 0) { console.error("không chép được DB máy thu"); process.exitCode = 2; return; }
    const r = spawnSync(process.execPath, process.argv.slice(1), { cwd: GOC, stdio: "inherit", env: { ...process.env, DATABASE_URL: `${MAY_CHU}/${ten}`, BDV_THAT_TRONG: "1" } });
    dbThu("--xoa");
    process.exitCode = r.status ?? 1;
    return;
  }
  if (!/^oneinvest_suite_bdvthat_[0-9]+$/.test(TEN)) { console.error(`từ chối: DB «${TEN}» không phải DB của lượt này`); process.exitCode = 2; return; }
  const c = new pg.Client({ connectionString: `${MAY_CHU}/${TEN}` });
  await c.connect();
  try {
    const dau = async () => (await c.query(`SELECT md5(string_agg(id || '|' || aliases::text || '|' || meta::text, ',' ORDER BY id)) AS d
                                            FROM asset_nodes WHERE id = ANY($1)`, [Object.values(DICH)])).rows[0].d;
    const truocDau = await dau();
    const the = await dungThe(c, { dem: false });
    const gan = Object.fromEntries(the.dong.map((d) => [d.vt, d.node_id]));
    o("đích của bốn tên tắt", JSON.stringify(gan) === JSON.stringify(DICH), gan, JSON.stringify(DICH));
    o("tên không gán", the.dong.every((d) => d.node_id != null), the.dong.filter((d) => d.node_id == null).length, "0");
    const truocDo = await doBiDanh(c);
    const ap = await apBiDanh(c, { bam: the.bam, nguoi: "bdv-that" });
    o("áp ghi bốn tên", ap.so === BANG_VIET_TAT.length, ap.so, String(BANG_VIET_TAT.length));
    const sau = await doBiDanh(c, { ruleId: ap.rule_id });
    console.log(`  đo: tin ${sau.tin} · trước ${sau.truoc} · sau ${sau.sau} (chưa áp: ${truocDo.sau})`);
    o("số tin đọc được phân khu tăng", sau.sau - sau.truoc >= TANG_TOI_THIEU, sau.sau - sau.truoc, `≥ ${TANG_TOI_THIEU}`);
    o("tin mất phân khu cũ", sau.mat === 0, sau.mat, "0");
    o("số đo trước áp bằng vế «trước» sau áp", truocDo.sau === sau.truoc, [truocDo.sau, sau.truoc], "bằng nhau");
    for (const [vt, san] of Object.entries(SAN)) o(`tin chỉ đọc được nhờ «${vt}»`, (sau.theoTen[vt] ?? 0) >= san, sau.theoTen[vt] ?? 0, `≥ ${san}`);
    const kiem = await kiemBiDanh(c, { ruleId: ap.rule_id });
    o("lệnh kiểm sau áp", kiem.ok, kiem.loi, "0 lỗi");
    await daoBiDanh(c, { ruleId: ap.rule_id, nguoi: "bdv-that" });
    o("đảo về dấu vân tay trước áp", (await dau()) === truocDau, await dau(), truocDau);
  } finally {
    await c.end();
  }
  console.log(loi.length ? `E9: ${loi.length} ô lệch — ${loi.join("; ")}` : "E9: đạt");
  if (loi.length) process.exitCode = 1;
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; });
