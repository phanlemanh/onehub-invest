// the-dia-chi-nhom-that.mjs — phép đo trên BẢN CHÉP DB máy thu cho hồ sơ the-dia-chi-nhom-s03 (TG1), E7 và E8.
// Chỉ chạy trên DB tên oneinvest_u1_tg1 (dựng bằng `bash db/db-thu.sh oneinvest_u1_tg1`); từ chối DB oneinvest của máy thu.
//   node pipeline/scripts/the-dia-chi-nhom-that.mjs --dem [--ghi <tệp.md>]   E7: áp 108, dựng nháp, so số đếm độc lập, sàn điền ô
//   node pipeline/scripts/the-dia-chi-nhom-that.mjs --chat-luong              E8: nhóm sổ một dự án, dựng nháp bỏ sổ, đếm trùng
// Số đếm độc lập viết bằng SQL riêng — không dùng hàm của lệnh dựng nháp — để hai đường cùng sai thì mới lọt.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { demLop, docDuLieu, dungTheoNhom, ghiNhap } from "./the-dia-chi-nhom.mjs";

const GOC = join(dirname(fileURLToPath(import.meta.url)), "../..");
const DB_THU = "oneinvest_u1_tg1";
const SAN_CHAT_LUONG = 9;
const LOP = ["so_mot_du_an", "so_chua_ghi", "so_nhieu_du_an", "ngoai_so", "so_khong_bai"];

// Khoá thật của nhóm bằng SQL (cùng nghĩa với khoaNhomThat nhưng viết riêng).
const KHOA = (cot) => `regexp_replace(${cot}, '^([^:]+:)?group:(?=.)', '')`;
const SQL_LOP = `
  WITH g AS (SELECT DISTINCT ${KHOA("conversation_id")} AS k FROM stg_zalo_posts WHERE conversation_id IS NOT NULL),
       u AS (SELECT ${KHOA("group_key")} AS k, project_node_ids FROM collection_units WHERE source_code = 'S03'),
       uk AS (SELECT k, count(DISTINCT p) AS so_da FROM u LEFT JOIN LATERAL unnest(u.project_node_ids) p ON true GROUP BY k)
  SELECT CASE WHEN uk.k IS NULL THEN 'ngoai_so' WHEN g.k IS NULL THEN 'so_khong_bai'
              WHEN uk.so_da = 0 THEN 'so_chua_ghi' WHEN uk.so_da = 1 THEN 'so_mot_du_an' ELSE 'so_nhieu_du_an' END AS lop,
         count(*)::int AS n
    FROM g FULL JOIN uk ON uk.k = g.k GROUP BY 1`;

function moDb() {
  const url = process.env.DATABASE_URL ?? `postgres://oneinvest:oneinvest@localhost:5433/${DB_THU}`;
  const ten = url.split("?")[0].split("/").pop();
  if (ten !== DB_THU) {
    console.error(`the-dia-chi-nhom-that: chỉ chạy trên bản chép ${DB_THU} (đang trỏ ${ten}) — dựng bằng: bash db/db-thu.sh ${DB_THU}`);
    process.exit(2);
  }
  return new pg.Client({ connectionString: url });
}

async function dem(c, tepGhi) {
  const t0 = performance.now();
  await c.query(readFileSync(join(GOC, "db/migrations/108_the_dia_chi_nhom.sql"), "utf8"));
  const d = await docDuLieu(c);
  const nhap = dungTheoNhom(d);
  await c.query("BEGIN");
  let ghi;
  try { ghi = await ghiNhap(c, nhap); await c.query("COMMIT"); } catch (e) { await c.query("ROLLBACK"); throw e; }
  const giay = +((performance.now() - t0) / 1000).toFixed(2);

  const docLap = Object.fromEntries((await c.query(SQL_LOP)).rows.map((r) => [r.lop, r.n]));
  const coBaiDocLap = LOP.filter((l) => l !== "so_khong_bai").reduce((s, l) => s + (docLap[l] ?? 0), 0);
  const soThe = (await c.query(`SELECT count(*)::int n FROM group_address_cards`)).rows[0].n;
  const lopMay = demLop(nhap);
  // Nhóm trong sổ không bài: khoá thật của sổ không có trong nháp (lệnh không dựng thẻ cho chúng).
  const khoaNhap = new Set(nhap.map((n) => n.group_key));
  const khoaSo = new Set(d.so.map((r) => r.group_key.replace(/^(?:[^:]+:)?group:(?=.)/, "")));
  lopMay.so_khong_bai = [...khoaSo].filter((k) => !khoaNhap.has(k)).length;

  const sau = (await c.query(`
    SELECT count(*)::int AS nhom5,
           count(*) FILTER (WHERE cardinality(project_node_ids) > 0)::int AS du_an,
           count(*) FILTER (WHERE area_id IS NOT NULL)::int AS phuong,
           count(*) FILTER (WHERE subzone_node_id IS NOT NULL)::int AS phan_khu,
           count(*) FILTER (WHERE purpose IS NOT NULL)::int AS muc_dich
      FROM group_address_cards WHERE (evidence->>'so_bai_doc')::int >= 5`)).rows[0];
  const nua = sau.nhom5 / 2;

  const loi = [];
  if (soThe !== coBaiDocLap) loi.push(`số thẻ ${soThe} ≠ số nhóm có bài đếm độc lập ${coBaiDocLap}`);
  for (const l of LOP) if ((lopMay[l] ?? 0) !== (docLap[l] ?? 0)) loi.push(`lớp ${l}: lệnh ${lopMay[l] ?? 0} ≠ độc lập ${docLap[l] ?? 0}`);
  if (sau.nhom5 === 0) loi.push("không nhóm nào có từ 5 bài đọc — sàn điền ô không đo được");
  if (sau.muc_dich < nua) loi.push(`ô bán/thuê ${sau.muc_dich}/${sau.nhom5} dưới một nửa`);
  if (sau.du_an < nua) loi.push(`ô dự án ${sau.du_an}/${sau.nhom5} dưới một nửa`);

  const dong = [
    `# Số chạy thử TG1 trên bản chép ${DB_THU}`,
    "",
    `Chạy lúc ${new Date().toISOString()} · ${giay} giây (áp 108 + đọc + dựng nháp + ghi) · ghi ${JSON.stringify(ghi)}`,
    "",
    "| Lớp | Lệnh dựng nháp | Đếm độc lập |",
    "|---|---|---|",
    ...LOP.map((l) => `| ${l} | ${lopMay[l] ?? 0} | ${docLap[l] ?? 0} |`),
    `| **nhóm có bài / số thẻ** | **${soThe}** | **${coBaiDocLap}** |`,
    "",
    `Nhóm có từ 5 bài đọc: ${sau.nhom5} (sàn một nửa = ${nua})`,
    "",
    "| Ô | Nhóm có giá trị |",
    "|---|---|",
    `| dự án | ${sau.du_an} |`,
    `| phường | ${sau.phuong} |`,
    `| phân khu | ${sau.phan_khu} |`,
    `| bán/thuê | ${sau.muc_dich} |`,
    "",
    loi.length ? `**ĐỎ**: ${loi.join("; ")}` : "**ĐẠT**",
  ];
  console.log(dong.join("\n"));
  if (tepGhi) {
    mkdirSync(dirname(tepGhi), { recursive: true });
    writeFileSync(tepGhi, dong.join("\n") + "\n");
  }
  return loi.length ? 1 : 0;
}

async function chatLuong(c) {
  const d = await docDuLieu(c);
  const coSo = dungTheoNhom(d).filter((n) => n.lop === "so_mot_du_an");
  const boSo = new Map(dungTheoNhom(d, { boSo: true }).map((n) => [n.group_key, n]));
  const ten = new Map(d.duAn.map((p) => [p.id, p.name]));
  let khop = 0;
  for (const n of coSo) {
    const so = n.so_du_an[0];
    const nhap = boSo.get(n.group_key)?.du_an ?? [];
    const ok = nhap[0] === so;
    if (ok) khop++;
    console.log(`${n.unit_code}\tsổ: ${ten.get(so) ?? so}\tnháp: ${nhap.map((id) => ten.get(id) ?? id).join(", ") || "(trống)"}\t${ok ? "khớp" : "không"}`);
  }
  console.log(`khớp ${khop}/${coSo.length} (đạt khi từ ${SAN_CHAT_LUONG})`);
  return coSo.length > 0 && khop >= SAN_CHAT_LUONG ? 0 : 1;
}

async function main(argv) {
  const c = moDb();
  await c.connect();
  try {
    if (argv.includes("--dem")) {
      const i = argv.indexOf("--ghi");
      return await dem(c, i >= 0 ? argv[i + 1] : null);
    }
    if (argv.includes("--chat-luong")) return await chatLuong(c);
    console.error("the-dia-chi-nhom-that: cần --dem hoặc --chat-luong");
    return 2;
  } finally {
    await c.end();
  }
}

main(process.argv.slice(2)).then((code) => process.exit(code), (e) => { console.error(String(e?.message ?? e)); process.exit(1); });
