#!/usr/bin/env node
// rut-lo-ghi-tam.mjs — NB10 ghi-tam-do-sau-co-han: lệnh người cho lô ghi tạm (migration 129).
//   --lo <mã>                                   chạy thử: in số giá trị, số tin sẽ đổi; không ghi gì
//   --lo <mã> --ghi --nguoi hitl:<tên> --ly-do <…>   rút cả lô (rut_lo_ghi_tam → revert_enrichment)
//   --ket-qua <mã> dat|khong-dat --nguoi hitl:<tên>  ghi kết quả đo bù (ghi_ket_qua_do_bu)
//   --mo-o <trường> --nguoi hitl:<tên>               mở lại ô đã dừng tự ghi
//   --het-han                                   rút mọi lô quá hạn đo bù chưa có kết quả (actor máy, không cần lượt làm giàu)
//   --danh-sach                                 in mọi lô và ô đang dừng
// Mọi lệnh ghi chạy trong một giao dịch; lỗi thì lui lại, thoát 1. Sai đối số thoát 2.
import pg from "pg";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

export function docDoiSo(argv) {
  const lay = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  const co = (k) => argv.includes(k);
  const a = {
    lo: lay("--lo"), ghi: co("--ghi"), nguoi: lay("--nguoi"), lyDo: lay("--ly-do"),
    ketQua: co("--ket-qua") ? { lo: lay("--ket-qua"), gia_tri: argv[argv.indexOf("--ket-qua") + 2] } : null,
    moO: lay("--mo-o"), hetHan: co("--het-han"), danhSach: co("--danh-sach"),
  };
  const loi = [];
  const lenh = [a.lo !== undefined, a.ketQua !== null, a.moO !== undefined, a.hetHan, a.danhSach].filter(Boolean).length;
  if (lenh !== 1) loi.push("chọn đúng một lệnh: --lo | --ket-qua | --mo-o | --het-han | --danh-sach");
  const canNguoi = (a.lo !== undefined && a.ghi) || a.ketQua !== null || a.moO !== undefined;
  if (canNguoi && !/^hitl:.+/.test(a.nguoi ?? "")) loi.push("lệnh ghi cần --nguoi hitl:<tên>");
  if (a.lo !== undefined && a.ghi && !(a.lyDo ?? "").trim()) loi.push("rút lô cần --ly-do <lý do>");
  if (a.ketQua && !["dat", "khong-dat"].includes(a.ketQua.gia_tri)) loi.push("--ket-qua <mã> dat|khong-dat");
  return { a, loi };
}

export async function chay(c, a) {
  const ra = [];
  if (a.danhSach) {
    const { rows } = await c.query(`SELECT g.ma, g.field, g.trang_thai, g.ket_qua_do_bu, g.han_do_bu::text AS han, g.doc_lap,
        (SELECT count(*)::int FROM enrichment_proposals e WHERE e.lo_id = g.ma AND e.status = 'applied') AS so
       FROM ghi_tam_lo g ORDER BY g.mo_luc, g.ma`);
    for (const r of rows) ra.push(`${r.ma} · ${r.field} · ${r.trang_thai} · đo bù ${r.ket_qua_do_bu} · hạn ${r.han} · độc lập ${r.doc_lap} · ${r.so} giá trị`);
    const { rows: o } = await c.query(`SELECT field, lo_ma, ly_do FROM ghi_tam_o WHERE dung ORDER BY field`);
    for (const r of o) ra.push(`ô dừng: ${r.field} (lô ${r.lo_ma}: ${r.ly_do})`);
    return { ma: 0, ra };
  }
  if (a.lo !== undefined) {
    const { rows: [l] } = await c.query(`SELECT ma, field, trang_thai FROM ghi_tam_lo WHERE ma = $1`, [a.lo]);
    if (!l) return { ma: 1, ra: [`không có lô ${a.lo}`] };
    const { rows: [d] } = await c.query(
      `SELECT count(*)::int AS gia_tri, count(DISTINCT offer_id)::int AS tin FROM enrichment_proposals
        WHERE lo_id = $1 AND status = 'applied'`, [a.lo]);
    if (!a.ghi) {
      ra.push(`chạy thử: lô ${a.lo} (${l.field}, ${l.trang_thai}) — ${d.gia_tri} giá trị · ${d.tin} tin sẽ đổi; thêm --ghi để rút`);
      return { ma: 0, ra };
    }
    const { rows: [r] } = await c.query(`SELECT rut_lo_ghi_tam($1, $2, $3, false) AS n`, [a.lo, a.nguoi, a.lyDo]);
    ra.push(`đã rút lô ${a.lo}: ${r.n} giá trị (${d.tin} tin)`);
    return { ma: 0, ra };
  }
  if (a.ketQua) {
    const { rows: [r] } = await c.query(`SELECT ghi_ket_qua_do_bu($1, $2, $3) AS n`, [a.ketQua.lo, a.ketQua.gia_tri, a.nguoi]);
    ra.push(a.ketQua.gia_tri === "dat"
      ? `lô ${a.ketQua.lo} đạt: ${r.n} giá trị thôi mang cờ ghi tạm`
      : `lô ${a.ketQua.lo} không đạt: đã rút ${r.n} giá trị, dừng tự ghi trường của lô`);
    return { ma: 0, ra };
  }
  if (a.moO !== undefined) {
    const { rowCount } = await c.query(
      `UPDATE ghi_tam_o SET dung = false, mo_lai_boi = $2, luc = now() WHERE field = $1 AND dung`, [a.moO, a.nguoi]);
    if (rowCount) {
      await c.query(`INSERT INTO ops_audit (actor, action, env, detail) VALUES ($1, 'ghi-tam:mo-o', 'local', $2)`,
        [a.nguoi, { field: a.moO }]);
    }
    ra.push(rowCount ? `đã mở lại ô ${a.moO}` : `ô ${a.moO} không dừng — không đổi gì`);
    return { ma: 0, ra };
  }
  const { rows } = await c.query(`SELECT ma, field, han_do_bu::text AS han, da_rut FROM xet_han_ghi_tam()`);
  if (rows.length === 0) ra.push("không lô nào quá hạn đo bù");
  for (const r of rows) ra.push(`✗ lô ${r.ma} quá hạn đo bù ${r.han} — đã rút ${r.da_rut} giá trị, dừng tự ghi ${r.field}`);
  return { ma: 0, ra };
}

async function main() {
  const { a, loi } = docDoiSo(process.argv.slice(2));
  if (loi.length) { for (const l of loi) console.error(`rut-lo-ghi-tam: ${l}`); process.exit(2); }
  const c = new pg.Client({ connectionString: DB_URL, application_name: "rut-lo-ghi-tam" });
  await c.connect();
  try {
    await c.query("BEGIN");
    const { ma, ra } = await chay(c, a);
    await c.query(ma === 0 ? "COMMIT" : "ROLLBACK");
    for (const l of ra) console.log(l);
    process.exitCode = ma;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    console.error(`rut-lo-ghi-tam: ${e instanceof Error ? e.message : e}`);
    process.exitCode = 1;
  } finally {
    await c.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
