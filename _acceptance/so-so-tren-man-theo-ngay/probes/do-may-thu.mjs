// do-may-thu.mjs — phép đo AC-9 của SM1, gọi qua do-may-thu.sh. Trên bản chép DB máy thu: đo chênh thời gian giữa 600 có và không có phần
// số mốc, làm tươi thật hai lần, rồi so bốn số mốc với SQL đếm độc lập đọc thẳng bảng bản ghi (không qua CTE của 600). Đối chứng: cùng phép đếm
// bỏ lọc nguồn phải lệch khác 0, nếu không thì phép so không phân biệt được gì.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

import { chayLamTuoi } from "../../../pipeline/refresh-data-flow.mjs";
import { napNhanhBai } from "../../../pipeline/lib/nhanh-bai-s03.mjs";
import { dinhViKhiCoView } from "../../../pipeline/lib/than-600.mjs";

const GOC = join(import.meta.dirname, "..", "..", "..");
const pg = createRequire(join(GOC, "pipeline/package.json"))("pg");
const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(DB_URL)) {
  console.error("do-may-thu: chỉ chạy trên DB của riêng lượt oneinvest_suite_*, gọi qua do-may-thu.sh");
  process.exit(2);
}

const TRAN_CHENH_MS = 2000;
const TRAN_CHAM_TI_LE = 1.2; // Lượt có số mốc chậm hơn bản như main tối đa 20%.
const TRAN_CAU_GIAY = 300; // Một câu 600 quá trần thì phép đo đỏ, không treo.
const VONG_DO = 3;
const SQL600 = readFileSync(join(GOC, "pipeline/sql/600_data_flow.sql"), "utf8");

/** 600 như trước SM1: bỏ khoá advisory, các CTE moc_* và khoá milestones. Khuôn lệch thì ném, không đo oan. */
function boSoMoc(sql) {
  const buoc = [
    [/^SELECT pg_advisory_xact_lock\(hashtext\('s03-moc-ngay'\)\);\n/m, ""],
    [/,\n-- SM1: bốn số mốc[\s\S]*?\n\)\nINSERT INTO data_flow_snapshot/, "\nINSERT INTO data_flow_snapshot"],
    [/,\n\s*'milestones', \(SELECT items FROM moc_chuoi\)/, ""],
  ];
  return buoc.reduce((s, [tu, thanh]) => {
    const moi = s.replace(tu, thanh);
    if (moi === s) throw new Error(`do-may-thu: khuôn bỏ số mốc không khớp 600: ${tu}`);
    return moi;
  }, sql);
}

const trungVi = (ds) => [...ds].sort((a, b) => a - b)[Math.floor(ds.length / 2)];
const so = (n) => new Intl.NumberFormat("vi-VN").format(n);

const c = new pg.Client({ connectionString: DB_URL });
await c.connect();
try {
  await c.query(`SET statement_timeout = '${TRAN_CAU_GIAY}s'`);
  // Đo thời gian trên cùng một phiên, nhánh bài nạp một lần: chỉ câu 600 khác nhau giữa hai bản. Lượt đầu làm ấm bộ đệm, không tính.
  await napNhanhBai(c);
  const coMoc = await dinhViKhiCoView(c, SQL600);
  const khongMoc = await dinhViKhiCoView(c, boSoMoc(SQL600));
  await c.query(khongMoc);
  const tg = { co: [], khong: [] };
  for (let i = 0; i < VONG_DO; i++) {
    for (const [k, sql] of i % 2 ? [["co", coMoc], ["khong", khongMoc]] : [["khong", khongMoc], ["co", coMoc]]) {
      const t0 = performance.now();
      await c.query(sql);
      tg[k].push(performance.now() - t0);
    }
  }
  const [msCo, msKhong] = [trungVi(tg.co), trungVi(tg.khong)];
  const chenhMs = msCo - msKhong;

  // Hai lượt làm tươi thật, đúng đường của bước cloud-sync.
  await chayLamTuoi(c, SQL600);
  await chayLamTuoi(c, SQL600);

  const { rows: [{ ngay }] } = await c.query(`SELECT ((now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date)::text AS ngay`);
  const { rows: dong } = await c.query(
    `SELECT detail FROM dq_check_results WHERE check_name = 's03-moc-ngay' AND detail::jsonb ->> 'ngay' = $1`, [ngay]);
  const moc = dong.length ? JSON.parse(dong[0].detail) : null;

  const demSql = (loc) => `
    SELECT count(*)::int AS offers_total,
           count(*) FILTER (WHERE p.offer_id IS NOT NULL)::int AS project_linked,
           count(*) FILTER (WHERE r.hang_pct IS NOT NULL AND r.cap IN ('du_an', 'phan_khu', 'toa'))::int AS project_ranked,
           count(*) FILTER (WHERE r.hang_pct IS NOT NULL AND r.cap = 'toa')::int AS building_ranked
    FROM sale_offer_records o
    LEFT JOIN (SELECT offer_id FROM offer_project WHERE status = 'mot_du_an') p ON p.offer_id = o.offer_id
    LEFT JOIN offer_price_rank r ON r.offer_id = o.offer_id
    WHERE o.retired_at IS NULL ${loc}`;
  const { rows: [doc] } = await c.query(demSql(`AND o.source = 'S03'`));
  // Chưa có bảng nối toà: 600 giữ toa_link là CTE rỗng, nên số độc lập của «Khớp toà» là 0 theo định nghĩa.
  doc.building_linked = 0;
  const { rows: [thieuLoc] } = await c.query(demSql(`AND o.source IN ('S03', 'S05', 'S06')`));

  const { rows: [{ facts }] } = await c.query(`SELECT facts FROM data_flow_snapshot WHERE time_window = 'all'`);
  const s03 = facts.sources.find((x) => x.source === "S03");

  const BON = ["project_linked", "building_linked", "project_ranked", "building_ranked"];
  const lech = Object.fromEntries(BON.map((k) => [k, (moc?.[k] ?? NaN) - doc[k]]));
  const lechDoiChung = { offers_total: thieuLoc.offers_total - doc.offers_total, project_ranked: thieuLoc.project_ranked - doc.project_ranked };
  const dieuKien = [
    ["Đúng một dòng hôm nay", dong.length === 1, `${dong.length} dòng, ngày ${ngay}`],
    ["Mẫu số lệch 0 so với đếm độc lập", moc?.offers_total === doc.offers_total, `${so(moc?.offers_total ?? 0)} và ${so(doc.offers_total)}`],
    ...BON.map((k) => [`${k} lệch 0 so với đếm độc lập`, lech[k] === 0, `${so(moc?.[k] ?? 0)} và ${so(doc[k])}, lệch ${lech[k]}`]),
    ["project_linked khớp ô Định vị S03 (cửa sổ all)", moc?.project_linked === s03.located, `${so(moc?.project_linked ?? 0)} và ${so(s03.located)}`],
    [`Lượt có ghi số mốc chậm hơn tối đa ${TRAN_CHENH_MS} ms`, chenhMs <= TRAN_CHENH_MS, `trung vị ${msCo.toFixed(0)} ms và ${msKhong.toFixed(0)} ms, chênh ${chenhMs.toFixed(0)} ms`],
    [`Lượt có ghi số mốc chậm hơn bản như main tối đa ${Math.round((TRAN_CHAM_TI_LE - 1) * 100)}%`, msCo <= msKhong * TRAN_CHAM_TI_LE, `trung vị ${msCo.toFixed(0)} ms và ${msKhong.toFixed(0)} ms, tỉ lệ ${(msCo / msKhong).toFixed(3)}`],
    ["Đối chứng bỏ lọc nguồn lệch khác 0", lechDoiChung.offers_total !== 0 && lechDoiChung.project_ranked !== 0, `mẫu số lệch ${so(lechDoiChung.offers_total)}, project_ranked lệch ${so(lechDoiChung.project_ranked)}`],
  ];
  const dat = dieuKien.every(([, ok]) => ok);

  const md = [
    "# Phép đo AC-9: số mốc S03 trên bản chép DB máy thu",
    "",
    `- Thời điểm: ${new Date().toISOString()}, ngày VN ${ngay}`,
    `- Kết luận: ${dat ? "ĐẠT" : "ĐỎ"}`,
    `- Mẫu số (tin S03 đang rao): ${so(moc?.offers_total ?? 0)}`,
    `- Số vòng đo thời gian: ${VONG_DO} mỗi bản, sau một lượt làm ấm`,
    "",
    "| Số mốc | Dòng hôm nay | Đếm độc lập | Lệch |",
    "|---|---:|---:|---:|",
    ...BON.map((k) => `| ${k} | ${so(moc?.[k] ?? 0)} | ${so(doc[k])} | ${lech[k]} |`),
    "",
    "`building_linked` đếm độc lập bằng 0 theo định nghĩa: chưa có bảng nối toà, `toa_link` của 600 là CTE rỗng.",
    "",
    "| Điều kiện | Kết quả | Số đo |",
    "|---|---|---|",
    ...dieuKien.map(([ten, ok, chi]) => `| ${ten} | ${ok ? "đạt" : "ĐỎ"} | ${chi} |`),
    "",
  ].join("\n");
  const thuMuc = join(GOC, ".acceptance-runs/so-so-tren-man-theo-ngay");
  mkdirSync(thuMuc, { recursive: true });
  writeFileSync(join(thuMuc, "do-may-thu.md"), md);
  console.log(md);
  process.exitCode = dat ? 0 : 1;
} finally {
  await c.end().catch(() => {});
}
