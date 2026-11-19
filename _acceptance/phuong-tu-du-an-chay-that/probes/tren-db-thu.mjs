// Phép đo DA45 trên DB thử chép từ máy thu (DATABASE_URL do db/db-thu.sh đặt). Mỗi chế độ in dòng «ok …»/«FAIL …», thoát 1 khi có FAIL.
// Gốc kho suy từ vị trí tệp; lệnh thật chạy bằng tiến trình con như chuỗi nạp gọi.
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = execFileSync("git", ["-C", DIR, "rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
const HS = path.join(ROOT, "_acceptance/phuong-tu-du-an-chay-that");
const LENH = path.join(ROOT, "pipeline/scripts/phuong-tu-du-an.mjs");
const pg = createRequire(path.join(ROOT, "pipeline/package.json"))("pg");
const RULE = "phuong-tu-du-an";
const che = process.argv[2];
const thamSo = process.argv.slice(3);
if (!process.env.DATABASE_URL || /\/oneinvest(\?|$)/.test(process.env.DATABASE_URL)) {
  console.error("tren-db-thu: chỉ chạy trên DB thử (qua tren-db-thu.sh), không chạy trên DB chung"); process.exit(2);
}
const hong = [];
const kt = (ok, msg) => { console.log(`${ok ? "ok  " : "FAIL"} ${msg}`); if (!ok) hong.push(msg); };
const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();

function lenh(args) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [LENH, ...args, "--json"], { encoding: "utf8", env: process.env, timeout: 900_000 });
  return { ma: r.status, out: `${r.stdout}${r.stderr}`, giay: (Date.now() - t0) / 1000 };
}
function transformZalo() {
  const r = spawnSync(process.execPath, [path.join(ROOT, "pipeline/transform-zalo.mjs")], { cwd: path.join(ROOT, "pipeline"), encoding: "utf8", env: process.env, timeout: 1_800_000 });
  if (r.status !== 0) throw new Error(`transform-zalo thoát ${r.status}: ${`${r.stdout}${r.stderr}`.slice(-600)}`);
}
const soSong = async () => (await c.query("SELECT count(*)::int n FROM field_assertions WHERE rule_id = $1 AND retracted_at IS NULL", [RULE])).rows[0].n;
async function bamS03() {
  const { rows } = await c.query(`SELECT offer_id, area_id, field_provenance -> 'area_id' AS fp FROM sale_offer_records WHERE source = 'S03' ORDER BY offer_id`);
  return createHash("sha256").update(JSON.stringify(rows)).digest("hex");
}
async function soPhuong() {
  const { rows: [r] } = await c.query(`SELECT count(*) FILTER (WHERE a.region_type = 'submarket')::int co, count(*)::int tong
    FROM sale_offers s LEFT JOIN areas a ON a.id = s.area_id WHERE s.source = 'S03'`);
  return r;
}
async function apDau() { const r = lenh(["--ghi"]); if (r.ma !== 0) throw new Error(`--ghi lượt đầu thoát ${r.ma}: ${r.out.slice(-400)}`); return r; }

// Phân ô theo bảng phủ ca: SQL độc lập, viết trước, không gọi mã của lệnh.
const SQL_O = `
WITH tin AS (SELECT r.offer_id, r.area_id, a.region_type rt, a.parent_id tinh_cot, offer_subject_keys(r.source, r.originating_system_key, r.post_ids) sk
               FROM sale_offer_records r LEFT JOIN areas a ON a.id = r.area_id WHERE r.source = 'S03'),
nut AS (SELECT n.id::text id,
          (SELECT count(*) FROM unnest(coalesce(n.area_ids,'{}')) x JOIN areas w ON w.id = x AND w.region_type = 'submarket') w,
          (SELECT min(x) FROM unnest(coalesce(n.area_ids,'{}')) x JOIN areas w ON w.id = x AND w.region_type = 'submarket') p
          FROM asset_nodes n WHERE n.node_type = 'project'),
da AS (SELECT t.offer_id, count(DISTINCT fa.value) so_da, min(n.p) FILTER (WHERE n.w = 1) p, bool_or(n.w > 1) nhieu
         FROM tin t JOIN field_assertions fa ON fa.subject_key = ANY (t.sk) AND fa.field = 'project_node_id' AND fa.retracted_at IS NULL
                                              AND fa.resource_name = 'Property'
         LEFT JOIN nut n ON n.id = fa.value GROUP BY 1),
the AS (SELECT t.offer_id, array_agg(DISTINCT fa.value) vs FROM tin t
          JOIN field_assertions fa ON fa.subject_key = ANY (t.sk) AND fa.field = 'area_id' AND fa.retracted_at IS NULL AND fa.rule_id = 'dia-chi-the-nhom'
          JOIN areas w ON w.id = fa.value AND w.region_type = 'submarket' GROUP BY 1)
SELECT t.offer_id, t.area_id cot, aw.parent_id tinh_moi, t.area_id AS tinh_cu, d.p,
  CASE WHEN t.area_id IS NULL THEN 'trong' WHEN t.rt = 'submarket' THEN 'phuong' ELSE 'tinh' END o_cot,
  CASE WHEN d.offer_id IS NULL THEN 'khong' WHEN d.so_da > 1 THEN 'nhieu' WHEN d.p IS NOT NULL THEN 'mot-phuong' ELSE 'khong-phuong' END o_da,
  CASE WHEN th.offer_id IS NULL THEN 'khong' WHEN d.p IS NULL THEN 'co' WHEN th.vs = ARRAY[d.p] THEN 'trung' ELSE 'khac' END o_the
FROM tin t LEFT JOIN da d USING (offer_id) LEFT JOIN the th USING (offer_id) LEFT JOIN areas aw ON aw.id = d.p`;

if (che === "chot-luot-dau") {
  kt(await soSong() === 0, "DB chép từ máy thu chưa có phát biểu sống của luật (tiền đề)");
  const b0 = await bamS03();
  const r = lenh(["--ghi", "--noi-tiep"]);
  kt(r.ma === 0, `--ghi --noi-tiep khi chưa áp thoát 0 (được ${r.ma})`);
  kt(/chưa áp lượt đầu/.test(r.out), "in «chưa áp lượt đầu»");
  kt(await soSong() === 0, "chưa áp: 0 phát biểu được chèn");
  kt(await bamS03() === b0, "chưa áp: cột tin S03 không đổi");
  await apDau();
  const n1 = await soSong();
  kt(n1 > 0, `đối chứng dương: lượt đầu áp tay ghi ${n1} phát biểu`);
  // mô phỏng bài cần phát biểu mới: rút một dòng, lệnh nối tiếp phải ghi lại đúng một
  await c.query(`UPDATE field_assertions SET retracted_at = clock_timestamp(), retract_reason = 'pct-thu' WHERE id = (SELECT min(id) FROM field_assertions WHERE rule_id = $1 AND retracted_at IS NULL)`, [RULE]);
  const r2 = lenh(["--ghi", "--noi-tiep"]);
  kt(r2.ma === 0 && await soSong() === n1, `đã áp: --noi-tiep ghi lại phát biểu còn thiếu (sống ${await soSong()}/${n1})`);
}

if (che === "chay-lai") {
  await apDau();
  const n1 = await soSong(); const p1 = await soPhuong();
  transformZalo();
  const r = lenh(["--ghi", "--noi-tiep"]);
  const kq = JSON.parse(r.out.trim().split("\n").filter((l) => l.startsWith("{")).pop() ?? "{}");
  kt(r.ma === 0, `lần hai thoát 0 (được ${r.ma})`);
  kt(await soSong() === n1, `lần hai sau transform-zalo thật: số phát biểu sống không đổi (${n1} → ${await soSong()})`);
  const p2 = await soPhuong();
  kt(p2.co >= p1.co, `số tin có phường không giảm sau transform-zalo và lần hai (${p1.co} → ${p2.co})`);
  // chiều đỏ của chính phép đo: rút một dòng thì lần kế phải chèn đúng một
  await c.query(`UPDATE field_assertions SET retracted_at = clock_timestamp(), retract_reason = 'pct-thu' WHERE id = (SELECT min(id) FROM field_assertions WHERE rule_id = $1 AND retracted_at IS NULL)`, [RULE]);
  lenh(["--ghi", "--noi-tiep"]);
  kt(await soSong() === n1, "đối chứng: thiếu một phát biểu thì lần kế ghi lại đúng một");
  void kq;
}

if (che === "tin-moi") {
  // phân ô TRƯỚC lượt ghi: sau lượt ghi mọi tin một-phường đã ở ô «phuong», không còn ứng viên
  const o = (await c.query(SQL_O)).rows;
  await apDau();
  const mot = o.find((x) => x.o_da === "mot-phuong" && x.o_the !== "khac" && x.o_cot !== "phuong");
  const khong = o.find((x) => x.o_da === "khong-phuong");
  if (!mot || !khong) { kt(false, `DB chép không có tin ứng viên (một-phường: ${!!mot}, không-phường: ${!!khong})`); await c.end(); process.exit(1); }
  // «tin mới»: đưa tin về trạng thái chưa nhận phường (rút phát biểu kế thừa, xoá dấu cột), rồi cho chuỗi thật chạy
  const { rows: [g] } = await c.query(`SELECT field_provenance -> 'area_id' ->> 'goc' AS goc FROM sale_offer_records WHERE offer_id = $1`, [mot.offer_id]);
  await c.query(`UPDATE field_assertions fa SET retracted_at = clock_timestamp(), retract_reason = 'pct-tin-moi'
    FROM sale_offer_records r WHERE r.offer_id = $1 AND fa.subject_key = ANY (offer_subject_keys(r.source, r.originating_system_key, r.post_ids))
      AND fa.rule_id = $2 AND fa.retracted_at IS NULL`, [mot.offer_id, RULE]);
  await c.query(`SELECT resolve_offer_fields(ARRAY[$1]::text[])`, [mot.offer_id]);
  const truoc = (await c.query(`SELECT area_id FROM sale_offer_records WHERE offer_id = $1`, [mot.offer_id])).rows[0].area_id;
  kt(truoc === (g.goc ?? null), `tin ${mot.offer_id} về cột gốc ${truoc} trước khi chạy chuỗi`);
  const cotKhong = (await c.query(`SELECT area_id FROM sale_offer_records WHERE offer_id = $1`, [khong.offer_id])).rows[0].area_id;
  transformZalo();
  const r = lenh(["--ghi", "--noi-tiep"]);
  kt(r.ma === 0, `bước phường thoát 0 (được ${r.ma})`);
  const sau = (await c.query(`SELECT area_id, field_provenance -> 'area_id' ->> 'nguon' AS nguon FROM sale_offer_records WHERE offer_id = $1`, [mot.offer_id])).rows[0];
  kt(sau.area_id === mot.p && sau.nguon === "du-an", `tin mới nhận phường dự án ${mot.p}, nhãn du-an (được ${sau.area_id}, ${sau.nguon})`);
  const sauKhong = (await c.query(`SELECT area_id FROM sale_offer_records WHERE offer_id = $1`, [khong.offer_id])).rows[0].area_id;
  kt(sauKhong === cotKhong, `đối chứng: tin thuộc dự án không có phường giữ cột ${cotKhong} (được ${sauKhong})`);
}

if (che === "ma-tran") {
  const M = JSON.parse(readFileSync(path.join(HS, "ma-tran-o.json"), "utf8")).o;
  const sai = thamSo.includes("--o-sai") ? thamSo[thamSo.indexOf("--o-sai") + 1] : null;
  const truoc = (await c.query(SQL_O)).rows;
  await apDau();
  const sau = new Map((await c.query(`SELECT offer_id, area_id FROM sale_offer_records WHERE source = 'S03'`)).rows.map((x) => [x.offer_id, x.area_id]));
  let soAssert = 0;
  for (const o of M) {
    const tin = truoc.filter((x) => x.o_cot === o.cot && x.o_da === o.du_an && x.o_the === o.the);
    const ketQua = o.ma === sai ? (o.ket_qua === "giu-nguyen-cot" ? "nhan-phuong-du-an" : "giu-nguyen-cot") : o.ket_qua;
    const lech = tin.filter((x) => (ketQua === "giu-nguyen-cot" ? sau.get(x.offer_id) !== x.cot : sau.get(x.offer_id) !== x.p));
    soAssert += 1;
    kt(lech.length === 0, `ô ${o.ma}: ${tin.length} tin, kết quả ${ketQua}${lech.length ? ` — lệch ${lech.length}: ${lech.slice(0, 3).map((x) => x.offer_id).join(", ")}` : ""}`);
  }
  kt(soAssert === M.length, `số phép kiểm bằng số ô (${soAssert}/${M.length})`);
  const doiTinh = truoc.filter((x) => x.o_cot === "tinh" && x.p && x.tinh_moi && x.tinh_moi !== x.tinh_cu && sau.get(x.offer_id) === x.p);
  console.log(`tin đổi tỉnh: ${doiTinh.length} — ${doiTinh.map((x) => `${x.offer_id} ${x.tinh_cu}→${x.tinh_moi}`).join("; ")}`);
  let sct = ""; try { sct = readFileSync(path.join(HS, "ap-may-thu/so-chay-thu.md"), "utf8"); } catch { /* vắng */ }
  const thieu = doiTinh.filter((x) => !sct.includes(x.offer_id));
  kt(thieu.length === 0, `so-chay-thu.md liệt kê đủ ${doiTinh.length} tin đổi tỉnh${thieu.length ? ` — thiếu ${thieu.map((x) => x.offer_id).join(", ")}` : ""}`);
}

if (che === "ap-lui") {
  for (const t of ["README.md", "sao-luu.sh", "lui.sql", "kiem-sau.sql", "so-chay-thu.md"]) {
    let co = false; try { co = readFileSync(path.join(HS, "ap-may-thu", t), "utf8").trim().length > 0; } catch { /* vắng */ }
    kt(co, `hồ sơ áp có ${t}`);
  }
  const b0 = await bamS03(); const n0 = await soSong();
  await apDau();
  kt(await bamS03() !== b0, "đối chứng: lượt ghi làm đổi cột tin S03");
  const lui = readFileSync(path.join(HS, "ap-may-thu/lui.sql"), "utf8");
  if (!thamSo.includes("--bo-lui")) await c.query(lui);
  transformZalo();
  lenh(["--ghi", "--noi-tiep"]);
  kt(await soSong() === n0, `sau khi lùi và chạy lại chuỗi: phát biểu sống của luật về ${n0} (được ${await soSong()})`);
  kt(await bamS03() === b0, "sau khi lùi và chạy lại chuỗi: băm area_id + field_provenance của tin S03 bằng trước khi áp");
}

if (che === "thoi-gian") {
  const CUA_SO = `SELECT count(*) FILTER (WHERE a.region_type = 'submarket')::int co, count(*)::int tong FROM sale_offers s
    LEFT JOIN areas a ON a.id = s.area_id WHERE s.source = 'S03' AND s.first_seen >= '2026-11-13' AND s.first_seen < '2026-11-20'`;
  const p0 = await soPhuong(); const w0 = (await c.query(CUA_SO)).rows[0];
  const r1 = await apDau();
  const r2 = lenh(["--ghi", "--noi-tiep"]);
  const p1 = await soPhuong(); const w1 = (await c.query(CUA_SO)).rows[0];
  console.log(`toàn kho: ${p0.co}/${p0.tong} → ${p1.co}/${p1.tong} · cửa sổ 13–19/11: ${w0.co}/${w0.tong} → ${w1.co}/${w1.tong}`);
  console.log(`giây lượt đầu: ${r1.giay.toFixed(1)} · giây lượt lặp: ${r2.giay.toFixed(1)}`);
  kt(r2.ma === 0 && r2.giay <= 60, `lượt lặp không có gì mới xong trong 60 giây (${r2.giay.toFixed(1)} giây)`);
  const sct = readFileSync(path.join(HS, "ap-may-thu/so-chay-thu.md"), "utf8");
  for (const k of ["Mốc đo", "Tử số toàn kho", "Mẫu số toàn kho", "Cửa sổ 13–19/11", "Giây lượt đầu"]) {
    kt(new RegExp(`^- ${k}: \\S`, "m").test(sct), `so-chay-thu.md có dòng «${k}»`);
  }
}

await c.end();
console.log(hong.length ? `FAIL ${hong.length} chỗ (${che})` : `ok   ${che}: đạt`);
process.exit(hong.length ? 1 : 0);
