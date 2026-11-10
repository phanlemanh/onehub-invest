// mau.mjs — lay-mau-khu-trung-theo-tin E2 (AC-2, AC-3, AC-4): chạy lệnh label-sample THẬT trên DB thử oneinvest_gn2.
// Dữ liệu giả nằm trong lược đồ riêng `gn2_mau` (bảng LIKE bảng public), lệnh trỏ vào lược đồ đó qua search_path, nên bài thật
// của bản chép không lẫn vào. Không đọc, không ghi DB máy thu. In mã thẻ và số, không in chữ bài.
// Chạy: node _acceptance/lay-mau-khu-trung-theo-tin/probes/mau.mjs
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PIPE = path.join(ROOT, "pipeline");
const pg = createRequire(path.join(PIPE, "package.json"))("pg");
const DB = "oneinvest_gn2_mau"; // tên riêng: lượt chấm chạy E2 và E7 song song
const SCHEMA = "gn2_mau";
const URL_DB = `postgres://oneinvest:oneinvest@localhost:5433/${DB}`;
const URL_LENH = `${URL_DB}?options=${encodeURIComponent(`-c search_path=${SCHEMA},public`)}`;
const BANG = ["stg_zalo_posts", "sale_offer_records", "collection_units", "eval_label_items", "eval_labels", "ops_audit"];

// Bài giả viết trước. Số mong đợi viết tay ngay dưới, không tính lại từ dữ liệu.
const SNAP = "hanoi__zalo-agent__2026-11-07T000000";
const NHOM = "Nhóm Thử Gee Một";
const BAI = [
  ["g01", "Bán căn 2PN view hồ https://img.example/a.jpg"],
  ["g02", "Bán căn 2PN view hồ https://img.example/b.jpg"], // cùng chữ khác link → trùng g01
  ["g03", "Cho thuê studio full đồ"],
  ["g04", "Cho thuê studio full đồ, giá mới"], // cùng tin gn2_o1 với g03
  ["g05", "Studio full đồ còn trống"], // cùng tin gn2_o1
  ["g06", "Xem căn tại https://abc.trycloudflare.com/x"], // bài thử noi-dung
  ["g07", "Căn 2PN đăng trên [Tên sàn]"], // bài thử noi-dung
  ["g08", '[{"clientDelMsgId":"1","globalDelMsgId":"2"}]'], // sự kiện thu hồi
  ["g09", "[Ở được liền] Bán căn 3PN"],
  ["g10", "Bán shophouse mặt đường"],
  ["g11", "Bán đất nền 100m2"],
  ["g12", "Cho thuê kho 200m2"],
];
const TIN = [["gn2_o1", ["g03", "g04", "g05"]], ["gn2_o2", ["g10"]]];
const MONG = { bo_vi_trung: 3, noi_dung: 2, bo_su_kien: 1, so_the: 6 };

let thoat = 0;
const loi = (s) => { console.log(s); thoat = 1; };

function lenh(args) {
  return execFileSync("node", [path.join(PIPE, "label-sample.mjs"), ...args], { cwd: ROOT, env: { ...process.env, DATABASE_URL: URL_LENH }, encoding: "utf8" });
}
const so = (out, ten) => Number((out.match(new RegExp(`${ten} (\\d+)`)) ?? [])[1]);

async function dung(c) {
  await c.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
  await c.query(`CREATE SCHEMA ${SCHEMA}`);
  for (const b of BANG) await c.query(`CREATE TABLE ${SCHEMA}.${b} (LIKE public.${b} INCLUDING ALL)`);
  const { rows: [{ unit_type }] } = await c.query("SELECT unit_type FROM public.collection_units LIMIT 1");
  await c.query(`INSERT INTO ${SCHEMA}.collection_units (source_code, group_key, name, unit_code, unit_type) VALUES ('S03', 'gn2-nhom-1', $1, 'S03-N999', $2)`, [NHOM, unit_type]);
  for (const [id, text] of BAI) {
    await c.query(`INSERT INTO ${SCHEMA}.stg_zalo_posts (post_id, snapshot_id, text, group_name, conversation_id, agent_id, posted_at, captured_at)
      VALUES ($1, $2, $3, $4, 'gn2-nhom-1', 'openclaw-hook', now(), now())`, [id, SNAP, text, NHOM]);
  }
  for (const [offer, ids] of TIN) {
    await c.query(`INSERT INTO ${SCHEMA}.sale_offer_records (offer_id, kind, first_seen, last_seen, source, post_ids) VALUES ($1, 'sale', now(), now(), 'S03', $2)`, [offer, ids]);
  }
}

/** Thẻ của một lát theo khoá trùng tính bằng chính lib của vòng; hai thẻ chung khoá là lỗi. */
async function kiemLat(c, lib, lat) {
  const { rows } = await c.query(`SELECT ref_id FROM ${SCHEMA}.eval_label_items WHERE lat = $1 ORDER BY ref_id`, [lat]);
  const tinCua = new Map(TIN.flatMap(([o, ids]) => ids.map((i) => [i, o])));
  const text = new Map(BAI);
  const khoa = rows.map((r) => lib.khoaTrung({ post_id: r.ref_id, text: text.get(r.ref_id) }, tinCua));
  return { ref: rows.map((r) => r.ref_id), chung: khoa.length - new Set(khoa).size };
}

async function banDot(tep, a, b) {
  const goc = path.join(PIPE, "lib", tep);
  const src = readFileSync(goc, "utf8");
  if (!src.includes(a)) throw new Error(`chỗ đột biến không còn: ${a}`);
  const dir = mkdtempSync(path.join(path.dirname(goc), ".gn2-mau-"));
  try {
    writeFileSync(path.join(dir, tep), src.replace(a, b).replace(/from "\.\/([^"]+)"/g, (_m, rel) => `from ${JSON.stringify(pathToFileURL(path.join(path.dirname(goc), rel)).href)}`));
    return await import(pathToFileURL(path.join(dir, tep)).href);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

execFileSync("bash", [path.join(ROOT, "db/db-thu.sh"), DB, "--neu-chua-co"], { stdio: "inherit" });
const c = new pg.Client({ connectionString: URL_DB });
await c.connect();
try {
  await dung(c);
  const lib = await import(pathToFileURL(path.join(PIPE, "lib/eval-labels.mjs")).href);
  const tp = await import(pathToFileURL(path.join(PIPE, "lib/test-posts.mjs")).href);

  // Lát thường và lát theo nhóm, chạy lệnh thật.
  const outs = {
    "gn2-thuong": lenh(["--lat", "gn2-thuong", "--n", "50", "--seed", "s1", "--nhom-khop", "Gee"]),
    "gn2-nhom": lenh(["--lat", "gn2-nhom", "--seed", "s1", "--theo-nhom", "--moi-nhom-lon", "50", "--moi-nhom-nho", "5", "--so-nhom-lon", "1", "--nhom-khop", "Gee"]),
  };
  for (const [lat, out] of Object.entries(outs)) {
    const k = await kiemLat(c, lib, lat);
    if (k.chung === 0 && k.ref.length === MONG.so_the) console.log(`ok khong hai the chung khoa (${lat}, ${k.ref.length} the)`);
    else loi(`THE TRUNG TRONG LAT: ${lat} chung ${k.chung}, so the ${k.ref.length}/${MONG.so_the}`);
    if (so(out, "bo_vi_trung") === MONG.bo_vi_trung) console.log(`ok bo vi trung = ${MONG.bo_vi_trung} (${lat})`);
    else loi(`BO VI TRUNG LECH: ${lat} ${so(out, "bo_vi_trung")}`);
    if (so(out, "bo_su_kien") === MONG.bo_su_kien) console.log(`ok bo_su_kien = ${MONG.bo_su_kien} (${lat})`);
    else loi(`SU KIEN VAO MAU: ${lat} ${so(out, "bo_su_kien")}`);
    const dau = JSON.parse((out.match(/gat_theo_dau (\{[^\n]*\})/) ?? [])[1] ?? "{}");
    if (dau["noi-dung"] === MONG.noi_dung) console.log(`ok bai thu bi gat = ${MONG.noi_dung} (${lat})`);
    else loi(`BAI THU VAO MAU: ${lat} ${JSON.stringify(dau)}`);
  }

  // Tất định: cùng seed trên lát tên khác cho cùng tập ref_id.
  lenh(["--lat", "gn2-thuong-2", "--n", "50", "--seed", "s1", "--nhom-khop", "Gee"]);
  const a = (await kiemLat(c, lib, "gn2-thuong")).ref.join(","), b = (await kiemLat(c, lib, "gn2-thuong-2")).ref.join(",");
  if (a === b) console.log("ok tat dinh"); else loi("KHONG TAT DINH");

  // ops_audit ghi dấu noi-dung qua đúng loadStgPosts + auditRejected.
  await c.query(`SET search_path = ${SCHEMA}, public`);
  const { rejected } = await tp.loadStgPosts(c, "zalo");
  await tp.auditRejected(c, "S03", rejected);
  const { rows: au } = await c.query(`SELECT detail FROM ops_audit WHERE action = 'transform:reject-test' ORDER BY id DESC LIMIT 1`);
  if (au[0]?.detail?.by_marker?.["noi-dung"] === MONG.noi_dung) console.log(`ok ops_audit noi-dung = ${MONG.noi_dung}`);
  else loi(`OPS_AUDIT LECH: ${JSON.stringify(au[0]?.detail)}`);

  // Chiều đỏ trên cùng bộ bài: sampler khử theo textHash cũ; testMarker không đọc chữ.
  const posts = BAI.map(([post_id, text]) => ({ post_id, text })).filter((p) => !tp.testMarker({ snapshot_id: SNAP, group_name: NHOM, text: p.text }));
  const tinCua = new Map(TIN.flatMap(([o, ids]) => ids.map((i) => [i, o])));
  const cu = await banDot("eval-labels.mjs", "    const khoa = khoaTrung(p, tinCua) ?? `p:${p.post_id}`;", "    const khoa = `h:${textHash(p.text)}`;");
  const chonCu = cu.chonMau(posts, { n: 50, seed: "s1", tinCua }).chon.map((r) => lib.khoaTrung({ post_id: r.ref_id, text: new Map(BAI).get(r.ref_id) }, tinCua));
  if (chonCu.length > new Set(chonCu).size) console.log("ok doi chung do: THE TRUNG TRONG LAT");
  else loi("DOI CHUNG KHONG DO: textHash cu");
  const khongDoc = await banDot("test-posts.mjs", '  if (NOI_DUNG_TEST.test((row.text ?? "").normalize("NFC"))) return "noi-dung";\n', "");
  const lot = BAI.filter(([, text]) => !khongDoc.testMarker({ snapshot_id: SNAP, group_name: NHOM, text })).length - BAI.filter(([, text]) => !tp.testMarker({ snapshot_id: SNAP, group_name: NHOM, text })).length;
  if (lot === MONG.noi_dung) console.log("ok doi chung do: BAI THU VAO MAU");
  else loi(`DOI CHUNG KHONG DO: testMarker ${lot}`);
} finally {
  await c.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`).catch(() => {});
  await c.end();
  execFileSync("bash", [path.join(ROOT, "db/db-thu.sh"), DB, "--xoa"], { stdio: "inherit" });
}
console.log(thoat === 0 ? "MAU OK" : "MAU LOI");
process.exit(thoat);
