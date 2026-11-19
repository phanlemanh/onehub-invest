// khong-pha.mjs — E7 (AC-7): bước gắn cuối lượt nạp không phá lượt nạp. Chạy dưới db/db-thu.sh trên bản chép DB máy thu.
// Đối chứng là lượt nạp khi DB chưa có 117 (bước gắn chỉ cảnh báo), rồi so với lượt nạp có bước gắn trên cùng dữ liệu.
// --cay-bai-thu: cấy một bài thử đã được gắn; lệnh phải thoát 1 và gọi tên bài (chiều đỏ của phép kiểm bài thử).
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const URL_DB = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(URL_DB)) { console.error("khong-pha: chỉ chạy trên DB oneinvest_suite_*"); process.exit(2); }

const pg = createRequire(`${ROOT}/pipeline/package.json`)("pg");
const nap = (t) => import(pathToFileURL(`${ROOT}/pipeline/lib/${t}`).href);
const { testMarker } = await nap("test-posts.mjs");
const { buocGhepToa } = await nap("ghep-tin-danh-muc-ghi.mjs");
const RULE_IDS = ["ghep-toa-cot", "ghep-toa-cot-chuan", "ghep-toa-chu-model", "ghep-toa-model"];
const TRAN_GIAY = 60;

const do_ = (ten, them = "") => { console.error(`ĐỎ: ${ten} ${them}`); process.exit(1); };
const dat = (ten, dk, them = "") => { if (!dk) do_(ten, them); console.log(`đạt: ${ten}${them ? ` · ${them}` : ""}`); };
const mig = (t) => readFileSync(`${ROOT}/db/migrations/${t}`, "utf8");
const c = new pg.Client({ connectionString: URL_DB });
await c.connect();
const mot = async (sql, p = []) => (await c.query(sql, p)).rows[0];

/** Bài thử đang mang dòng gắn sống. */
async function baiThuDuocGan() {
  const { rows } = await c.query(
    `SELECT DISTINCT ON (s.post_id) s.post_id, s.snapshot_id, s.agent_id, s.text, s.group_name
       FROM stg_zalo_posts s JOIN field_assertions f ON f.subject_key = 'S03:' || s.post_id
      WHERE f.retracted_at IS NULL AND f.rule_id = ANY ($1::text[]) ORDER BY s.post_id, s.captured_at DESC`, [RULE_IDS]);
  return rows.filter((p) => testMarker(p)).map((p) => p.post_id);
}

await c.query(mig("113_thuoc_tinh_can_s16.sql"));
await c.query(mig("118_v_s16_gia_cdt_loai_mo_ho.sql"));

if (process.argv.includes("--cay-bai-thu")) {
  await c.query(mig("117_ghep_toa_tren_tin.sql"));
  await buocGhepToa(c, { log: () => {} });
  const { post } = await mot(`SELECT split_part(subject_key, ':', 2) AS post FROM field_assertions WHERE retracted_at IS NULL AND rule_id = ANY ($1::text[]) ORDER BY id LIMIT 1`, [RULE_IDS]);
  await c.query(`UPDATE stg_zalo_posts SET text = coalesce(text, '') || ' trycloudflare.com' WHERE post_id = $1`, [post]);
  const thu = await baiThuDuocGan();
  await c.end();
  do_("bài thử được gắn:", thu.join(", ") || "(phép kiểm không thấy bài vừa cấy)");
}

/** Gốc snapshot: biến môi trường, không có thì lấy từ checkout chính của kho. */
function gocSnapshot() {
  if (process.env.SNAPSHOT_ROOT) return process.env.SNAPSHOT_ROOT;
  const r = spawnSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: ROOT, encoding: "utf8" });
  return path.join(path.dirname(r.stdout.trim()), "collector/snapshots");
}
/**
 * 40 snapshot S03 mới nhất đã yên từ hai giờ trở lên. Máy thu vẫn ghi snapshot mới trong lúc đo, nên danh sách được chốt một lần
 * ở đầu phép đo và bỏ các thư mục còn đang ghi.
 */
function chonSnapshot(goc) {
  const moc = Date.now() - 2 * 3600_000;
  return readdirSync(goc, { withFileTypes: true }).filter((d) => d.isDirectory())
    .flatMap((d) => readdirSync(path.join(goc, d.name), { withFileTypes: true }).filter((s) => s.isDirectory() && s.name.includes("zalo")).map((s) => path.join(goc, d.name, s.name)))
    .filter((d) => statSync(d).mtimeMs < moc)
    .sort((a, b) => path.basename(b).localeCompare(path.basename(a))).slice(0, 40);
}
/** Băm danh sách tệp (đường dẫn, cỡ, giờ sửa) của các snapshot đã chốt; đọc từ đĩa, không mở nội dung. */
function bamSnapshot(goc, dirs) {
  const h = createHash("sha256"); let so = 0;
  const di = (p) => { for (const e of readdirSync(p, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const f = path.join(p, e.name);
    if (e.isDirectory()) di(f); else if (e.isFile()) { const s = statSync(f); h.update(`${path.relative(goc, f)}|${s.size}|${s.mtimeMs}\n`); so++; } } };
  dirs.forEach(di);
  return { bam: h.digest("hex"), so };
}
const dau = () => mot(
  `SELECT (SELECT md5(string_agg(offer_id || '|' || coalesce(project_node_id::text, '') || '|' || status, ',' ORDER BY offer_id)) FROM offer_project) AS du_an,
          (SELECT count(*)::int FROM sale_offer_records WHERE source = 'S03') AS tin,
          (SELECT coalesce(sum(cardinality(post_ids)), 0)::int FROM sale_offer_records WHERE source = 'S03') AS bai`);
function napLai() {
  const r = spawnSync(process.execPath, ["transform-zalo.mjs"], { cwd: `${ROOT}/pipeline`, encoding: "utf8", env: process.env, timeout: 15 * 60_000, maxBuffer: 64 * 1024 * 1024 });
  return { ma: r.status, ra: `${r.stdout ?? ""}\n${r.stderr ?? ""}`, canhBao: `${r.stdout ?? ""}\n${r.stderr ?? ""}`.split("\n").filter((l) => l.includes("JOB WARN [ghep-toa]")) };
}

const goc = gocSnapshot();
const dirSnap = chonSnapshot(goc);
const snap0 = bamSnapshot(goc, dirSnap);
dat("gốc snapshot có tệp", snap0.so > 0, `${snap0.so} tệp`);

// 1. Đối chứng: DB chưa có 117.
dat("bản chép chưa có 117", (await mot(`SELECT to_regclass('public.offer_building') IS NULL AS chua`)).chua);
const a = napLai();
dat("thiếu 117: lượt nạp thoát 0", a.ma === 0, a.ma === 0 ? "" : a.ra.slice(-800));
dat("thiếu 117: đúng một dòng cảnh báo", a.canhBao.length === 1, a.canhBao.join(" | "));
const goc1 = await dau();

// 2. Có 117: bước gắn lần đầu trong trần thời gian, rồi lượt nạp đầy đủ.
await c.query(mig("117_ghep_toa_tren_tin.sql"));
const t0 = Date.now(); const canhBao = [];
await buocGhepToa(c, { log: (s) => canhBao.push(s) });
const giay = (Date.now() - t0) / 1000;
dat("bước gắn lần đầu không cảnh báo", canhBao.length === 0, canhBao.join(" | "));
dat(`bước gắn xong trong ${TRAN_GIAY} giây`, giay <= TRAN_GIAY, `${giay.toFixed(1)} giây`);
const b = napLai();
dat("có 117: lượt nạp thoát 0", b.ma === 0, b.ma === 0 ? "" : b.ra.slice(-800));
dat("có 117: không cảnh báo", b.canhBao.length === 0, b.canhBao.join(" | "));
dat("có 117: bước gắn đã chạy và không đổi gì", /ghep-toa: .* chèn 0 · rút 0/.test(b.ra), (b.ra.match(/ghep-toa: .*/) ?? [""])[0]);
const sau = await dau();
dat("offer_project giống đối chứng từng tin", sau.du_an === goc1.du_an);
dat("số tin, số bài nạp bằng đối chứng", sau.tin === goc1.tin && sau.bai === goc1.bai, `${sau.tin} tin, ${sau.bai} bài`);
const thu = await baiThuDuocGan();
dat("bài thử sinh 0 dòng", thu.length === 0, thu.slice(0, 5).join(", "));

// 3. Cấy lỗi khi ghi: lượt nạp vẫn xong, đúng một cảnh báo.
await c.query(`UPDATE field_assertions SET retracted_at = now(), retract_reason = 'thu-pl20' WHERE id = (SELECT id FROM field_assertions WHERE retracted_at IS NULL AND rule_id = ANY ($1::text[]) ORDER BY id LIMIT 1)`, [RULE_IDS]);
await c.query(`CREATE FUNCTION pl20_cay_loi() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.rule_id LIKE 'ghep-toa-%' THEN RAISE EXCEPTION 'cay-loi-ghi'; END IF; RETURN NEW; END $$`);
await c.query(`CREATE TRIGGER pl20_cay_loi BEFORE INSERT ON field_assertions FOR EACH ROW EXECUTE FUNCTION pl20_cay_loi()`);
const e = napLai();
await c.query(`DROP TRIGGER pl20_cay_loi ON field_assertions; DROP FUNCTION pl20_cay_loi()`);
dat("cấy lỗi: lượt nạp thoát 0", e.ma === 0, e.ma === 0 ? "" : e.ra.slice(-800));
dat("cấy lỗi: đúng một dòng cảnh báo", e.canhBao.length === 1 && e.canhBao[0].includes("cay-loi-ghi"), e.canhBao.join(" | "));
const sauLoi = await dau();
dat("cấy lỗi: số bài nạp bằng đối chứng", sauLoi.tin === goc1.tin && sauLoi.bai === goc1.bai);

const snap1 = bamSnapshot(goc, dirSnap);
dat("snapshot không đổi", snap1.bam === snap0.bam && snap1.so === snap0.so);
await c.end();
console.log("XANH: bước gắn không phá lượt nạp");
