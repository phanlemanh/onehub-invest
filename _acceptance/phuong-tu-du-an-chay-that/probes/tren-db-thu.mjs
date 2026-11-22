// Phép đo DA45 trên DB thử chép từ máy thu (DATABASE_URL do db/db-thu.sh đặt). Mỗi chế độ in dòng «ok …»/«FAIL …», thoát 1 khi có FAIL.
// Gốc kho suy từ vị trí tệp; lệnh thật chạy bằng tiến trình con như chuỗi nạp gọi.
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = execFileSync("git", ["-C", DIR, "rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
const HS = path.join(ROOT, "_acceptance/phuong-tu-du-an-chay-that");
const LENH = path.join(ROOT, "pipeline/scripts/phuong-tu-du-an.mjs");
const pg = createRequire(path.join(ROOT, "pipeline/package.json"))("pg");
const RULE = "phuong-tu-du-an";
// luật đóng dấu dự án lúc nạp mà transform-zalo ghi (thẻ nhóm, DV6 từ chữ bài): bài sao từ bài có dự án theo các luật này nhận lại dự án
const { RULE_ID: RULE_THE, LUAT_DV6 } = await import(pathToFileURL(path.join(ROOT, "pipeline/lib/dia-chi-the-nhom.mjs")).href);
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
/** Chạy lệnh ở nền (không chặn probe) — cho ca lùi trùng lượt nạp. */
function chayNen(args) {
  const ch = spawn(process.execPath, [LENH, ...args, "--json"], { env: process.env });
  const kq = { xong: false, out: "" };
  ch.stdout.on("data", (d) => { kq.out += d; }); ch.stderr.on("data", (d) => { kq.out += d; });
  kq.p = new Promise((res) => ch.on("close", (ma) => { kq.xong = true; res({ ma, out: kq.out }); }));
  return kq;
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
  CASE WHEN th.offer_id IS NULL THEN 'khong' WHEN d.p IS NULL OR d.so_da > 1 THEN 'co' WHEN th.vs = ARRAY[d.p] THEN 'trung' ELSE 'khac' END o_the
FROM tin t LEFT JOIN da d USING (offer_id) LEFT JOIN the th USING (offer_id) LEFT JOIN areas aw ON aw.id = d.p`;

/** Tin nguồn để sao thành bài mới (S4-r2, AC-4 đòi bài mới nạp qua transform-zalo thật): tin một bài, chữ bài không nêu phường
 *  (khoá gom tính cả người đăng, nên bài sao mang người đăng mới thành tin mới), dự án do luật đóng dấu lúc nạp. */
async function tinNguon(ids) {
  const { rows } = await c.query(`SELECT r.offer_id, r.post_ids[1] AS post_id,
      (SELECT array_agg(DISTINCT fa.value ORDER BY fa.value) FROM field_assertions fa
        WHERE fa.subject_key = ANY (offer_subject_keys(r.source, r.originating_system_key, r.post_ids))
          AND fa.field = 'project_node_id' AND fa.retracted_at IS NULL) AS du_an
    FROM sale_offer_records r JOIN sale_offers s USING (offer_id)
   WHERE r.offer_id = ANY ($1::text[]) AND cardinality(r.post_ids) = 1 AND s.phuong_raw IS NULL
     AND EXISTS (SELECT 1 FROM field_assertions fa WHERE fa.subject_key = ANY (offer_subject_keys(r.source, r.originating_system_key, r.post_ids))
                   AND fa.field = 'project_node_id' AND fa.retracted_at IS NULL AND fa.rule_id = ANY ($2::text[]))
   ORDER BY (SELECT bool_or(fa.rule_id = $3) FROM field_assertions fa
              WHERE fa.subject_key = ANY (offer_subject_keys(r.source, r.originating_system_key, r.post_ids))
                AND fa.field = 'project_node_id' AND fa.retracted_at IS NULL) DESC NULLS LAST, r.offer_id
   LIMIT 1`, [ids, [RULE_THE, ...LUAT_DV6], RULE_THE]);
  return rows[0] ?? null;
}
/** Bài mới: sao bài nguồn vào stg_zalo_posts với mã bài, người đăng, giờ đăng mới — transform-zalo thật đọc nó như bài vừa nạp. */
async function baiMoi(postId, hauTo) {
  const cols = (await c.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema()
    AND table_name = 'stg_zalo_posts' ORDER BY ordinal_position`)).rows.map((x) => x.column_name);
  const moi = `${postId}-pct-${hauTo}`;
  const thay = { post_id: "$2", sender_id: "$3", posted_at: "clock_timestamp()", captured_at: "clock_timestamp()" };
  const q = (k) => `"${k}"`;
  const r = await c.query(`INSERT INTO stg_zalo_posts (${cols.map(q).join(", ")})
    SELECT ${cols.map((k) => thay[k] ?? q(k)).join(", ")} FROM stg_zalo_posts WHERE post_id = $1 ORDER BY captured_at DESC LIMIT 1`,
    [postId, moi, `pct-nguoi-${hauTo}`]);
  if (r.rowCount !== 1) throw new Error(`không sao được bài ${postId}`);
  // Nhãn đọc bài (silver_labels) gắn theo mã bài: dự án «chu_bai» của transform-zalo đọc từ đây. Sao nhãn của bài nguồn sang bài mới
  // để bài mới mang đúng dự án như bài nguồn (đo 20/11: mọi dự án không có phường trên tin S03 đều từ chu_bai).
  const nc = (await c.query(`SELECT column_name, column_default, data_type FROM information_schema.columns WHERE table_schema = current_schema()
    AND table_name = 'silver_labels' ORDER BY ordinal_position`)).rows;
  const giu = nc.filter((x) => !(x.column_name === "label_id" && x.column_default != null));
  const chon = giu.map((x) => (x.column_name === "post_id" ? "$2::text" : x.column_name === "label_id" ? `${q("label_id")} || '-pct-${hauTo}'` : q(x.column_name)));
  await c.query(`INSERT INTO silver_labels (${giu.map((x) => q(x.column_name)).join(", ")}) SELECT ${chon.join(", ")} FROM silver_labels WHERE post_id = $1`,
    [postId, moi]);
  return moi;
}
/** Tin đang chứa một bài, kèm dự án sống trên các bài của tin. */
async function tinCuaBai(pid) {
  return (await c.query(`SELECT r.offer_id, r.area_id, r.field_provenance -> 'area_id' ->> 'nguon' AS nguon, r.post_ids,
      (SELECT array_agg(DISTINCT fa.value ORDER BY fa.value) FROM field_assertions fa
        WHERE fa.subject_key = ANY (offer_subject_keys(r.source, r.originating_system_key, r.post_ids))
          AND fa.field = 'project_node_id' AND fa.retracted_at IS NULL) AS du_an,
      (SELECT count(*)::int FROM field_assertions fa
        WHERE fa.subject_key = ANY (offer_subject_keys(r.source, r.originating_system_key, r.post_ids))
          AND fa.rule_id = $2 AND fa.retracted_at IS NULL) AS song
    FROM sale_offer_records r WHERE r.source = 'S03' AND $1 = ANY (r.post_ids)`, [pid, RULE])).rows[0] ?? null;
}
const tinS03 = async () => new Set((await c.query(`SELECT offer_id FROM sale_offer_records WHERE source = 'S03'`)).rows.map((x) => x.offer_id));

/** Cấy hai tin nhiều dự án trên DB thử (dữ liệu thật có ít ca này): một ca dự án thứ hai cùng phường, một ca khác phường.
 *  Lấy tin một-phường có thẻ ở cột tỉnh và cột trống; chép mọi phát biểu project_node_id của tin sang nút dự án thứ hai. */
async function cayNhieuDuAn() {
  const o = (await c.query(SQL_O)).rows;
  const ra = [];
  for (const [cot, cung] of [["tinh", true], ["trong", false]]) {
    for (const x of o.filter((y) => y.o_cot === cot && y.o_da === "mot-phuong" && y.o_the === "trung")) {
      const { rows: [n2] } = await c.query(`
        WITH nut AS (SELECT n.id::text id, (SELECT min(v) FROM unnest(coalesce(n.area_ids,'{}')) v JOIN areas w ON w.id = v AND w.region_type = 'submarket') p,
                            (SELECT count(*) FROM unnest(coalesce(n.area_ids,'{}')) v JOIN areas w ON w.id = v AND w.region_type = 'submarket') w
                       FROM asset_nodes n WHERE n.node_type = 'project')
        SELECT nut.id FROM nut WHERE nut.w = 1 AND ${cung ? "nut.p = $1" : "nut.p <> $1"}
          AND nut.id NOT IN (SELECT fa.value FROM field_assertions fa JOIN sale_offer_records r ON fa.subject_key = ANY (offer_subject_keys(r.source, r.originating_system_key, r.post_ids))
                              WHERE r.offer_id = $2 AND fa.field = 'project_node_id' AND fa.retracted_at IS NULL)
        ORDER BY nut.id LIMIT 1`, [x.p, x.offer_id]);
      if (!n2) continue;
      const ins = await c.query(`INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, method_version, rule_id, evidence, observed_at, run_id)
        SELECT fa.resource_name, fa.subject_key, fa.field, $2, fa.evidence_tier, fa.method, fa.method_version, fa.rule_id, fa.evidence, fa.observed_at, 'pct-cay-nhieu-du-an'
          FROM field_assertions fa JOIN sale_offer_records r ON fa.subject_key = ANY (offer_subject_keys(r.source, r.originating_system_key, r.post_ids))
         WHERE r.offer_id = $1 AND fa.field = 'project_node_id' AND fa.retracted_at IS NULL AND fa.resource_name = 'Property'`, [x.offer_id, n2.id]);
      // luật xét theo từng bài: cấy cho MỌI bài có phát biểu dự án của tin, không thì bài còn lại vẫn cho tin nhận phường
      if (ins.rowCount >= 1) { ra.push({ offer_id: x.offer_id, cung }); break; }
    }
  }
  kt(ra.length === 2, `cấy đủ hai tin nhiều dự án (cùng phường, khác phường): ${ra.map((t) => t.offer_id).join(", ")}`);
  return ra;
}

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
  // bài mới thật (S4-r2): sao một bài của tin vừa nhận phường thành bài mới, transform-zalo thật nạp nó, lệnh nối tiếp ghi cho bài ấy
  const ung = await tinNguon((await c.query(`SELECT offer_id FROM sale_offer_records
    WHERE source = 'S03' AND field_provenance -> 'area_id' ->> 'nguon' = 'du-an'`)).rows.map((x) => x.offer_id));
  if (!ung) kt(false, "DB chép không có tin nguồn để sao bài mới (tin một bài, dự án do luật đóng dấu lúc nạp)");
  else {
    const b = await baiMoi(ung.post_id, "chot");
    transformZalo();
    const t0 = await tinCuaBai(b);
    kt(t0 && (t0.du_an ?? []).join() === ung.du_an.join() && t0.song === 0,
      `tiền đề: bài mới ${b} qua transform-zalo mang dự án ${ung.du_an}, chưa có phát biểu của luật (được ${t0?.du_an}, ${t0?.song})`);
    const r2 = lenh(["--ghi", "--noi-tiep"]);
    const t1 = await tinCuaBai(b);
    kt(r2.ma === 0 && t1?.song >= 1, `đã áp: --noi-tiep ghi phát biểu cho bài mới nạp qua transform-zalo (thoát ${r2.ma}, phát biểu sống của bài ${t1?.song})`);
  }
}

if (che === "chay-lai") {
  const phuongCuaTin = async () => new Map((await c.query(`SELECT r.offer_id, r.area_id FROM sale_offer_records r
    JOIN areas a ON a.id = r.area_id AND a.region_type = 'submarket' WHERE r.source = 'S03'`)).rows.map((x) => [x.offer_id, x.area_id]));
  await apDau();
  const n1 = await soSong(); const t1 = await phuongCuaTin();
  transformZalo();
  const r = lenh(["--ghi", "--noi-tiep"]);
  const kq = JSON.parse(r.out.trim().split("\n").filter((l) => l.startsWith("{")).pop() ?? "{}");
  kt(r.ma === 0, `lần hai thoát 0 (được ${r.ma})`);
  // đếm của chính lần chạy, không phải số ròng: rút 1 chèn 1 vẫn đỏ ở đây
  kt(kq.chen === 0 && kq.rut === 0 && kq.tin === 0, `lần hai sau transform-zalo thật: 0 chèn, 0 rút, 0 tin phân xử lại (được ${kq.chen}, ${kq.rut}, ${kq.tin})`);
  kt(await soSong() === n1, `số phát biểu sống không đổi (${n1} → ${await soSong()})`);
  // theo từng tin: tin nào đã có phường vẫn giữ đúng phường ấy
  const t2 = await phuongCuaTin();
  const mat = [...t1].filter(([id, a]) => t2.get(id) !== a);
  kt(t1.size > 0 && mat.length === 0, `${t1.size} tin đã có phường đều giữ phường${mat.length ? ` — mất/đổi ${mat.length}: ${mat.slice(0, 3).map(([id]) => id).join(", ")}` : ""}`);
  // chiều đỏ của chính phép đo: rút một dòng thì lần kế báo chèn đúng một
  await c.query(`UPDATE field_assertions SET retracted_at = clock_timestamp(), retract_reason = 'pct-thu' WHERE id = (SELECT min(id) FROM field_assertions WHERE rule_id = $1 AND retracted_at IS NULL)`, [RULE]);
  const r3 = lenh(["--ghi", "--noi-tiep"]);
  const kq3 = JSON.parse(r3.out.trim().split("\n").filter((l) => l.startsWith("{")).pop() ?? "{}");
  kt(kq3.chen === 1 && await soSong() === n1, `đối chứng: thiếu một phát biểu thì lần kế báo chèn 1 (được ${kq3.chen}), sống về ${n1}`);
}

if (che === "tin-moi") {
  // S4-r2: bài mới THẬT — sao bài của tin có sẵn vào stg_zalo_posts (mã bài, người đăng, giờ đăng mới), transform-zalo thật nạp nó
  // thành tin mới, rồi bước phường chạy như chuỗi gọi. Ứng viên và mốc đối chứng lấy TRƯỚC lượt ghi đầu.
  const o = (await c.query(SQL_O)).rows;
  const nMot = await tinNguon(o.filter((x) => x.o_da === "mot-phuong" && x.o_the !== "khac" && x.o_cot !== "phuong").map((x) => x.offer_id));
  const nKhong = await tinNguon(o.filter((x) => x.o_da === "khong-phuong").map((x) => x.offer_id));
  if (!nMot || !nKhong) { kt(false, `DB chép không có tin nguồn (một-phường: ${!!nMot}, không-phường: ${!!nKhong})`); await c.end(); process.exit(1); }
  const pMot = o.find((x) => x.offer_id === nMot.offer_id).p;
  await apDau();
  const bMot = await baiMoi(nMot.post_id, "mot");
  const bKhong = await baiMoi(nKhong.post_id, "khong");
  const cu = await tinS03();
  transformZalo();
  const t1 = await tinCuaBai(bMot); const k1 = await tinCuaBai(bKhong);
  kt(t1 && !cu.has(t1.offer_id) && t1.post_ids.length === 1 && (t1.du_an ?? []).join() === nMot.du_an.join(),
    `bài mới ${bMot} qua transform-zalo thành tin mới mang dự án ${nMot.du_an} (được ${t1?.offer_id}, ${t1?.du_an})`);
  kt(t1 && t1.nguon !== "du-an" && t1.song === 0, `trước bước phường: tin mới chưa có phát biểu của luật, chưa mang nhãn du-an (cột ${t1?.area_id}, nhãn ${t1?.nguon})`);
  kt(k1 && !cu.has(k1.offer_id) && k1.post_ids.length === 1 && (k1.du_an ?? []).join() === nKhong.du_an.join(),
    `đối chứng: bài mới ${bKhong} qua transform-zalo thành tin mới mang dự án không có phường ${nKhong.du_an} (được ${k1?.offer_id}, ${k1?.du_an})`);
  const r = lenh(["--ghi", "--noi-tiep"]);
  kt(r.ma === 0, `bước phường thoát 0 (được ${r.ma})`);
  const t2 = await tinCuaBai(bMot); const k2 = await tinCuaBai(bKhong);
  kt(t2?.area_id === pMot && t2?.nguon === "du-an", `tin mới nhận phường dự án ${pMot}, nhãn du-an (được ${t2?.area_id}, ${t2?.nguon})`);
  kt(k1 && k2 && k2.area_id === k1.area_id && k2.nguon !== "du-an",
    `đối chứng: tin mới thuộc dự án không có phường giữ cột ${k1?.area_id} (được ${k2?.area_id}, nhãn ${k2?.nguon})`);
}

if (che === "ma-tran") {
  const M = JSON.parse(readFileSync(path.join(HS, "ma-tran-o.json"), "utf8")).o;
  const sai = thamSo.includes("--o-sai") ? thamSo[thamSo.indexOf("--o-sai") + 1] : null;
  // Ô «nhiều dự án»: dữ liệu thật 19/11 không còn tin nào (TG2 đóng dấu một dự án mỗi bài), nên probe cấy hai tin trên DB thử:
  // chép phát biểu dự án của một tin một-phường có thẻ sang một dự án thứ hai — một ca hai dự án CÙNG phường, một ca KHÁC phường.
  const cay = await cayNhieuDuAn();
  const truoc = (await c.query(SQL_O)).rows;
  await apDau();
  const sau = new Map((await c.query(`SELECT offer_id, area_id FROM sale_offer_records WHERE source = 'S03'`)).rows.map((x) => [x.offer_id, x.area_id]));
  let phu = 0;
  for (const o of M) {
    const tin = truoc.filter((x) => x.o_cot === o.cot && x.o_da === o.du_an && x.o_the === o.the);
    phu += tin.length;
    const ketQua = o.ma === sai ? (o.ket_qua === "giu-nguyen-cot" ? "nhan-phuong-du-an" : "giu-nguyen-cot") : o.ket_qua;
    const lech = tin.filter((x) => (ketQua === "giu-nguyen-cot" ? sau.get(x.offer_id) !== x.cot : sau.get(x.offer_id) !== x.p));
    // ô rỗng không được tự đạt: phép kiểm từng ô chỉ có nghĩa khi ô có tin
    kt(tin.length > 0 && lech.length === 0, `ô ${o.ma}: ${tin.length} tin (lúc soát ${o.so_luc_do}), kết quả ${ketQua}${tin.length ? "" : " — ô rỗng"}${lech.length ? ` — lệch ${lech.length}: ${lech.slice(0, 3).map((x) => x.offer_id).join(", ")}` : ""}`);
  }
  // phủ lớp: mọi tin S03 rơi vào đúng một ô của ma trận (các ô rời nhau theo cách dựng), không tin nào ngoài ma trận
  const ngoai = truoc.filter((x) => !M.some((o) => x.o_cot === o.cot && x.o_da === o.du_an && x.o_the === o.the));
  const nhom = {}; for (const x of ngoai) { const k = `${x.o_cot}·${x.o_da}·${x.o_the}`; nhom[k] = (nhom[k] ?? 0) + 1; }
  kt(ngoai.length === 0 && phu === truoc.length, `ma trận phủ hết ${truoc.length} tin S03 (trong ô ${phu})${ngoai.length ? ` — ngoài ô: ${JSON.stringify(nhom)}` : ""}`);
  // lời hứa chung, không qua ô: mọi tin vốn có cột cấp phường giữ nguyên cột
  const doiPhuong = truoc.filter((x) => x.o_cot === "phuong" && sau.get(x.offer_id) !== x.cot);
  const soPhuongTruoc = truoc.filter((x) => x.o_cot === "phuong").length;
  kt(soPhuongTruoc > 0 && doiPhuong.length === 0, `${soPhuongTruoc} tin vốn có cột cấp phường: 0 bị đổi${doiPhuong.length ? ` — đổi ${doiPhuong.length}: ${doiPhuong.slice(0, 3).map((x) => x.offer_id).join(", ")}` : ""}`);
  // tin cấy nhiều dự án: rơi đúng ô nhiều dự án và giữ cột
  for (const t of cay) {
    const x = truoc.find((y) => y.offer_id === t.offer_id);
    kt(x?.o_da === "nhieu" && x.o_the === "co" && sau.get(t.offer_id) === x.cot,
      `tin cấy hai dự án ${t.cung ? "cùng" : "khác"} phường ${t.offer_id}: ô ${x?.o_cot}·${x?.o_da}·${x?.o_the}, cột ${x?.cot} → ${sau.get(t.offer_id)}`);
  }
  // tin đổi tỉnh: đối chứng dương (tập không rỗng), số đếm và từng cặp tỉnh cũ → tỉnh mới phải có trong so-chay-thu.md
  const doiTinh = truoc.filter((x) => x.o_cot === "tinh" && x.p && x.tinh_moi && x.tinh_moi !== x.tinh_cu && sau.get(x.offer_id) === x.p);
  console.log(`tin đổi tỉnh: ${doiTinh.length} — ${doiTinh.map((x) => `${x.offer_id} ${x.tinh_cu}→${x.tinh_moi}`).join("; ")}`);
  let sct = ""; try { sct = readFileSync(path.join(HS, "ap-may-thu/so-chay-thu.md"), "utf8"); } catch { /* vắng */ }
  const soGhi = Number(/^## Tin đổi tỉnh khi nhận phường dự án \((\d+) tin/m.exec(sct)?.[1] ?? NaN);
  kt(doiTinh.length > 0 && soGhi === doiTinh.length, `so-chay-thu.md ghi ${soGhi} tin đổi tỉnh, đo được ${doiTinh.length}`);
  const thieu = doiTinh.filter((x) => !sct.includes(`- ${x.offer_id} ${x.tinh_cu} → ${x.tinh_moi}`));
  kt(thieu.length === 0, `so-chay-thu.md liệt kê đủ ${doiTinh.length} cặp tin · tỉnh cũ → tỉnh mới${thieu.length ? ` — thiếu ${thieu.map((x) => `${x.offer_id} ${x.tinh_cu} → ${x.tinh_moi}`).join(", ")}` : ""}`);
}

if (che === "ap-lui") {
  for (const t of ["README.md", "sao-luu.sh", "lui.sql", "kiem-sau.sql", "so-chay-thu.md"]) {
    let co = false; try { co = readFileSync(path.join(HS, "ap-may-thu", t), "utf8").trim().length > 0; } catch { /* vắng */ }
    kt(co, `hồ sơ áp có ${t}`);
  }
  // AC-6 (đổi lời 19/11, P3-209): area_id so nguyên văn; field_provenance so với bản trước khi áp đã phân xử lại một lượt
  const bamCot = async () => createHash("sha256").update(JSON.stringify((await c.query(
    `SELECT offer_id, area_id FROM sale_offer_records WHERE source = 'S03' ORDER BY offer_id`)).rows)).digest("hex");
  const cot0 = await bamCot(); const n0 = await soSong(); const b0 = await bamS03();
  // chụp trạng thái trước khi áp để dựng bản so «trước khi áp, phân xử lại một lượt» sau khi đo
  await c.query(`CREATE TEMP TABLE pct_s0 AS SELECT offer_id, area_id, field_provenance FROM sale_offer_records WHERE source = 'S03'`);
  // Bước 1 — sao lưu: chạy chính sao-luu.sh trên DB thử (tên DB và thư mục ra qua biến môi trường), đếm dòng tệp chép
  const db = new URL(process.env.DATABASE_URL).pathname.slice(1);
  const ra = mkdtempSync(path.join(tmpdir(), "da45-sao-luu-"));
  const sl = spawnSync("bash", [path.join(HS, "ap-may-thu/sao-luu.sh")], { encoding: "utf8", env: { ...process.env, DA45_DB: db, DA45_SAO_LUU_DIR: ra } });
  const dong = (re) => { const f = readdirSync(ra).find((x) => re.test(x)); return f ? readFileSync(path.join(ra, f), "utf8").split("\n").filter(Boolean).length - 1 : -1; };
  const soTin = (await c.query(`SELECT count(*)::int n FROM sale_offer_records WHERE source = 'S03'`)).rows[0].n;
  kt(sl.status === 0 && dong(/phat-bieu/) === n0 && dong(/tin-s03/) >= soTin,
    `sao-luu.sh chạy trên DB thử: thoát ${sl.status}, chép ${dong(/phat-bieu/)}/${n0} phát biểu, ${dong(/tin-s03/)} dòng tin S03 (≥ ${soTin} tin; ô jsonb nhiều dòng)`);
  // Bước 2 — áp
  await apDau();
  kt(await bamS03() !== b0, "đối chứng: lượt ghi làm đổi cột tin S03");
  // Bước 3 — kiểm sau: chạy chính kiem-sau.sql, so từng số với đếm độc lập của probe
  const ks = await c.query(readFileSync(path.join(HS, "ap-may-thu/kiem-sau.sql"), "utf8"));
  const kv = Object.assign({}, ...(Array.isArray(ks) ? ks : [ks]).map((r) => r.rows[0] ?? {}));
  const pk = await soPhuong(); const nk = await soSong();
  const duAn = (await c.query(`SELECT count(*)::int n FROM sale_offer_records WHERE field_provenance -> 'area_id' ->> 'nguon' = 'du-an'`)).rows[0].n;
  kt(Number(kv.co_phuong) === pk.co && Number(kv.tong) === pk.tong && Number(kv.phat_bieu_song) === nk && nk > 0 && Number(kv.tin_nhan_du_an) === duAn && duAn > 0,
    `kiem-sau.sql sau khi áp: có phường ${kv.co_phuong}/${kv.tong} (probe ${pk.co}/${pk.tong}), phát biểu sống ${kv.phat_bieu_song} (probe ${nk}), tin nhãn du-an ${kv.tin_nhan_du_an} (probe ${duAn})`);
  // README chạy được như ghi (S4-r2): dựng đúng lệnh `psql …` README định nghĩa, chỉ thay tên DB bằng DB thử, chạy lệnh kiểm sau
  const readme = readFileSync(path.join(HS, "ap-may-thu/README.md"), "utf8");
  kt(!/psql … -f /.test(readme), "README không dùng `psql … -f <tệp>` (psql trong container không thấy tệp trên máy)");
  const dinhNghia = /`psql …` = `([^`]+)`/.exec(readme)?.[1] ?? "";
  const lenhKs = /4\. \*\*Lệnh kiểm sau:\*\* `psql … ([^`]+)`/.exec(readme)?.[1] ?? "";
  const ksThat = spawnSync("bash", ["-c", `${dinhNghia.replace(/ -d oneinvest(?=\s|$)/, ` -d ${db}`)} ${lenhKs}`], { cwd: ROOT, encoding: "utf8" });
  kt(/ -d oneinvest(\s|$)/.test(dinhNghia) && lenhKs && ksThat.status === 0 && new RegExp(`\\b${nk}\\b`).test(ksThat.stdout),
    `README bước 4 chạy đúng như ghi trên DB thử: thoát ${ksThat.status}, in phat_bieu_song ${nk}${ksThat.status ? ` — ${`${ksThat.stderr}`.slice(-200)}` : ""}`);
  // mục 5 (Cách lùi) tự đủ: lui.sql qua «<», kiểm sau lùi với phat_bieu_song = 0, chạy lại hạng giá, kiểm bản cloud
  const d5 = readme.indexOf("5. **Cách lùi"); const muc5 = d5 < 0 ? "" : readme.slice(d5, readme.indexOf("`psql …` =", d5));
  kt(/< _acceptance\/phuong-tu-du-an-chay-that\/ap-may-thu\/lui\.sql/.test(muc5) && /kiem-sau\.sql/.test(muc5) && /`phat_bieu_song` = 0/.test(muc5)
      && /node pipeline\/xep-hang-gia\.mjs/.test(muc5) && /cloud/.test(muc5),
    "README mục 5 (Cách lùi) kê lui.sql qua «<», kiem-sau.sql với phat_bieu_song = 0, lệnh chạy lại hạng giá và kiểm bản cloud");
  // Bước 4 — lùi
  const lui = readFileSync(path.join(HS, "ap-may-thu/lui.sql"), "utf8");
  if (!thamSo.includes("--bo-lui")) {
    // Lùi trùng lượt nạp (S4-r2): lùi đang giữ khoá của luật thì lượt nối tiếp khởi động lúc ấy phải chờ, rồi bỏ qua sau khi lùi
    // commit — không chèn lại phát biểu vừa rút. Lượt nối tiếp qua chốt «đã áp» ngoài giao dịch (luật còn dòng sống) rồi mới chờ khoá.
    const L = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await L.connect();
    await L.query("BEGIN");
    await L.query("SELECT pg_advisory_xact_lock(hashtext($1))", [RULE]);
    const con = chayNen(["--ghi", "--noi-tiep"]);
    let cho = false;
    for (let i = 0; i < 600 && !cho && !con.xong; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      cho = (await c.query(`SELECT count(*)::int n FROM pg_locks WHERE locktype = 'advisory' AND NOT granted`)).rows[0].n > 0;
    }
    kt(cho, "lùi trùng lượt nạp: lượt nối tiếp chờ khoá của luật trong lúc lùi giữ khoá");
    await L.query(lui); // BEGIN của tệp chỉ cảnh báo (đang trong giao dịch); COMMIT của tệp commit cả giao dịch giữ khoá
    await L.end();
    const kn = await con.p;
    const songN = await soSong();
    kt(kn.ma === 0 && /"bo_qua":true/.test(kn.out) && songN === 0,
      `lùi trùng lượt nạp: lượt nối tiếp thoát ${kn.ma}, ${/"bo_qua":true/.test(kn.out) ? "bỏ qua" : "KHÔNG bỏ qua"}, phát biểu sống sau lùi ${songN}`);
  }
  transformZalo();
  lenh(["--ghi", "--noi-tiep"]);
  kt(await soSong() === n0, `sau khi lùi và chạy lại chuỗi: phát biểu sống của luật về ${n0} (được ${await soSong()})`);
  kt(await bamCot() === cot0, "sau khi lùi và chạy lại chuỗi: băm area_id của tin S03 bằng trước khi áp");
  const b3 = await bamS03();
  await c.query(`CREATE TEMP TABLE pct_s3 AS SELECT offer_id, area_id, field_provenance FROM sale_offer_records WHERE source = 'S03'`);
  // Bản so: trạng thái trước khi áp, rồi phân xử lại một lượt đúng các tin mà lượt lùi đổi phát biểu (dòng của luật đã rút).
  // Phát biểu của luật đã rút nên bộ phân xử không thấy chúng — kết quả là «trước khi áp, phân xử lại một lượt».
  const { rows: dung } = await c.query(`SELECT DISTINCT r.offer_id FROM sale_offer_records r
    JOIN field_assertions fa ON fa.subject_key = ANY (offer_subject_keys(r.source, r.originating_system_key, r.post_ids))
     AND fa.rule_id = $1 WHERE r.source = 'S03'`, [RULE]);
  await c.query(`UPDATE sale_offer_records r SET area_id = s.area_id, field_provenance = s.field_provenance FROM pct_s0 s WHERE s.offer_id = r.offer_id`);
  kt(await bamS03() === b0, "dựng bản so: chép lại trạng thái trước khi áp đúng từng byte");
  await c.query(`SELECT resolve_offer_fields($1::text[])`, [dung.map((x) => x.offer_id)]);
  const bSo = await bamS03();
  console.log(`bản so: phân xử lại ${dung.length} tin có phát biểu của luật; ${bSo === b0 ? "trùng" : "khác"} trạng thái trước khi áp nguyên văn`);
  if (b3 !== bSo) {
    // chẩn đoán: tin lệch, theo nhóm (có trong tập phân xử lại hay không) và khoá provenance lệch
    const { rows: lech } = await c.query(`SELECT r.offer_id, r.offer_id = ANY ($1::text[]) AS trong_tap,
        s.field_provenance -> 'area_id' AS sau_chuoi, r.field_provenance -> 'area_id' AS ban_so,
        (SELECT array_agg(k) FROM (SELECT k FROM jsonb_object_keys(coalesce(s.field_provenance,'{}') || coalesce(r.field_provenance,'{}')) k
          WHERE s.field_provenance -> k IS DISTINCT FROM r.field_provenance -> k) x) AS khoa
      FROM sale_offer_records r JOIN pct_s3 s USING (offer_id)
      WHERE r.source = 'S03' AND (r.area_id IS DISTINCT FROM s.area_id OR r.field_provenance IS DISTINCT FROM s.field_provenance)`,
      [dung.map((x) => x.offer_id)]);
    console.log(`lệch ${lech.length} tin: trong tập ${lech.filter((x) => x.trong_tap).length} · ngoài tập ${lech.filter((x) => !x.trong_tap).length}`);
    for (const x of lech.slice(0, 5)) console.log(JSON.stringify(x).slice(0, 400));
    const ids = [...new Set(lech.flatMap((x) => (x.sau_chuoi?.goi_y ?? []).flatMap((g) => g.ids)))];
    const { rows: fa } = await c.query(`SELECT rule_id, method, retracted_at IS NOT NULL AS da_rut, retract_reason, count(*)::int n
      FROM field_assertions WHERE id = ANY ($1::bigint[]) GROUP BY 1,2,3,4 ORDER BY 1,2,3`, [ids]);
    console.log("phát biểu trong goi_y sau chuỗi của tin lệch: " + JSON.stringify(fa));
  }
  kt(b3 === bSo, "sau khi lùi và chạy lại chuỗi: băm area_id + field_provenance bằng bản trước khi áp đã phân xử lại một lượt");
}

if (che === "doi-chung-resolve") {
  // Đối chứng cho E6: chỉ gọi resolve_offer_fields trên tin S03 cột trống, KHÔNG có phát biểu nào của luật phường.
  // Tin đổi ở đây là dấu cũ có từ trước, không do luật phường sinh ra. Chỉ in số, không đỏ.
  kt(await soSong() === 0, "tiền đề: chưa có phát biểu sống của luật phường");
  const snap = async () => new Map((await c.query(`SELECT offer_id, area_id, field_provenance -> 'area_id' fp FROM sale_offer_records WHERE source = 'S03'`)).rows
    .map((r) => [r.offer_id, JSON.stringify([r.area_id, r.fp])]));
  const ids = (await c.query(`SELECT offer_id FROM sale_offer_records WHERE source = 'S03' AND area_id IS NULL AND field_provenance -> 'area_id' IS NULL`)).rows.map((r) => r.offer_id);
  const s0 = await snap();
  await c.query("SELECT resolve_offer_fields($1::text[])", [ids]);
  const s1 = await snap();
  const doi = [...s0].filter(([k, v]) => s1.get(k) !== v).map(([k]) => k);
  const doiCot = doi.filter((k) => JSON.parse(s0.get(k))[0] !== JSON.parse(s1.get(k))[0]);
  console.log(`tin S03 cột trống chưa có dấu: ${ids.length} · đổi field_provenance sau một lượt resolve: ${doi.length} · đổi area_id: ${doiCot.length}`);
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
  // mỗi dòng phải mang SỐ (không phải chữ bất kỳ), và số ghi phải khớp phép đo trên bản chép này
  const so = (k) => { const m = new RegExp(`^- ${k}: (.*)$`, "m").exec(sct); return m ? (m[1].match(/\d[\d.,]*/g) ?? []).map((x) => Number(x.replace(/\./g, "").replace(",", "."))) : []; };
  const moc = new RegExp("^- Mốc đo: .*\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}Z", "m").test(sct);
  kt(moc, "so-chay-thu.md có mốc đo dạng ISO (yyyy-mm-ddThh:mmZ)");
  const [tu0, tu1] = so("Tử số toàn kho"); const [mau] = so("Mẫu số toàn kho");
  const [cs0, cs1, csMau] = so("Cửa sổ 13–19/11"); const [giay] = so("Giây lượt đầu");
  kt([tu0, tu1, mau, cs0, cs1, csMau, giay].every((x) => Number.isFinite(x)), `so-chay-thu.md đủ số: tử ${tu0} → ${tu1}, mẫu ${mau}, cửa sổ ${cs0} → ${cs1}/${csMau}, giây ${giay}`);
  // S4-r2: số ghi trôi theo bản chép — db/db-thu.sh dựng lại bản mẫu mỗi 24 giờ hay khi lược đồ DB chung đổi, kho S03 lớn thêm
  // khoảng 2% mỗi ngày (20/11: mẫu số 7.657 lúc 04:38Z, 7.795 lúc 05:5xZ sau một lần dựng lại). Nên so trong khoảng: số đếm lệch
  // tối đa 5% (hay 10 tin với số nhỏ), tỉ lệ có phường lệch tối đa 1 điểm (toàn kho) và 2 điểm (cửa sổ). Ngoài khoảng vẫn đỏ, gọi tên số.
  const gan = (ghi, do_) => Math.abs(ghi - do_) <= Math.max(10, 0.05 * do_);
  const ti = (a, b) => (b ? (100 * a) / b : 0);
  kt(gan(tu0, p0.co), `tử số trước lượt ghi: ghi ${tu0}, đo ${p0.co} (lệch tối đa 5% hay 10 tin)`);
  kt(gan(mau, p1.tong), `mẫu số toàn kho: ghi ${mau}, đo ${p1.tong} (lệch tối đa 5%)`);
  kt(Math.abs(ti(tu1, mau) - ti(p1.co, p1.tong)) <= 1, `tỉ lệ có phường toàn kho sau lượt ghi: ghi ${ti(tu1, mau).toFixed(1)}%, đo ${ti(p1.co, p1.tong).toFixed(1)}% (lệch tối đa 1 điểm)`);
  kt(gan(cs0, w0.co) && gan(csMau, w1.tong), `cửa sổ 13–19/11: ghi ${cs0} trước, mẫu ${csMau}; đo ${w0.co}, ${w1.tong} (lệch tối đa 5% hay 10 tin)`);
  kt(Math.abs(ti(cs1, csMau) - ti(w1.co, w1.tong)) <= 2, `tỉ lệ có phường cửa sổ 13–19/11 sau lượt ghi: ghi ${ti(cs1, csMau).toFixed(1)}%, đo ${ti(w1.co, w1.tong).toFixed(1)}% (lệch tối đa 2 điểm)`);
  kt(Math.abs(giay - r1.giay) <= Math.max(30, r1.giay), `giây lượt đầu ghi ${giay} cùng cỡ phép đo ${r1.giay.toFixed(1)}`);
}

await c.end();
console.log(hong.length ? `FAIL ${hong.length} chỗ (${che})` : `ok   ${che}: đạt`);
process.exit(hong.length ? 1 : 0);
