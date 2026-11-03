// do-sdt-trong-duong.mjs — hồ sơ _acceptance/sdt-trong-ten-duong AC-4: thước trên bản chép DB máy thu (db/db-thu.sh).
// Chạy thật transform S06 + resolve-properties rồi đếm giá trị đường mang dãy số; chỉ in số đếm, không in giá trị. Vi phạm → in dòng, thoát 1.
//   --chi-doc                 chỉ đếm, không chạy gì (dùng được trên DB máy thu sau job đêm)
//   --gai-sdt <bảng>:<dạng>   gài một giá trị mang số vào phép đếm; bảng tin|can|log, dạng lien|ngan
//   --gai-mat-duong           bỏ đường của một tin nguồn sạch trước phép so, cần bản chép đã chạy xong
//   --gai-can-doi             đổi một ô căn sạch trước phép so
//   --gai-in-so               in một dòng mang dãy số bịa
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

import { docDuong } from "../lib/dac-trung-s06.mjs";
import { mintOfferId } from "../lib/offer-key.mjs";
import { chayResolve } from "../resolve-properties.mjs";
import { runTransformChotot } from "../transform-chotot.mjs";

const PIPE = join(import.meta.dirname, "..");
const MAU_SO_TOI_THIEU = 40_000;
const O_SACH_TOI_THIEU = 1_000;
const argv = process.argv.slice(2);
const co = (ten) => argv.includes(ten);
const CHI_DOC = co("--chi-doc");
const iGai = argv.indexOf("--gai-sdt");
const GAI = iGai >= 0 ? argv[iGai + 1].split(":") : null;
const SO_SANH = !CHI_DOC || co("--gai-mat-duong") || co("--gai-can-doi");
const DB_URL = process.env.DATABASE_URL ?? "";
if (!CHI_DOC && !/\/oneinvest_[a-z0-9_]+$/.test(DB_URL)) {
  console.error("do-sdt-trong-duong: lượt ghi cần DATABASE_URL trỏ DB thử oneinvest_<dãy>_<việc> (bash db/db-thu.sh …)");
  process.exit(2);
}

/** Định nghĩa độc lập với MAU_DAY_SO: gộp chữ số cách nhau một dấu, rồi tìm từ 9 chữ số liền. */
const coSo = (s) => /\d{9}/.test(s.replace(/(\d)[ .-](?=\d)/g, "$1"));
/** Định nghĩa rộng, chỉ in: tới ba ký tự không phải chữ, không phải số giữa hai chữ số. */
const coSoRong = (s) => /\d(?:[^\p{L}\d]{0,3}\d){8,}/u.test(s);
const dem = (rows) => rows.filter((r) => coSo(r.v)).length;

// Mọi dòng in của lượt, kể cả của transform và resolve, đều được giữ lại để kiểm «không dòng nào chứa dãy số».
let daIn = "";
const ghiGoc = process.stdout.write.bind(process.stdout);
process.stdout.write = (chu, ...con) => { daIn += String(chu); return ghiGoc(chu, ...con); };

async function doc(c) {
  const tin = (await c.query("SELECT offer_id, street_raw v FROM sale_offers WHERE street_raw IS NOT NULL")).rows;
  const can = (await c.query("SELECT id, street v FROM properties WHERE street IS NOT NULL")).rows;
  // Mục street và mục gỡ đều đi lên cloud cùng enrichment_log; bỏ thời điểm và khoá tin, không phải giá trị đường.
  const log = (await c.query(`SELECT e - 'at' - 'offer_id' j FROM properties p, jsonb_array_elements(p.enrichment_log) e
    WHERE e->>'field' = 'street' OR e->>'src' = 'go-sdt-duong'`)).rows.map((r) => ({ v: Object.values(r.j).join(" | ") }));
  return { tin, can, log };
}
const inDong = (nhan, s) => console.log(`${nhan}: tin ${dem(s.tin)} trên ${s.tin.length} · căn ${dem(s.can)} trên ${s.can.length} · nhật ký căn ${dem(s.log)} trên ${s.log.length}`);

/** Job đêm có hai bước thước chạy, cùng tệp, không đối số, transform trước; dòng comment không tính. Đây là đọc chữ tệp, không chạy job. */
function jobDung(job) {
  const [t, r] = [/^[ \t]*job_run chotot-daily transform-chotot node "\$ROOT\/pipeline\/transform-chotot\.mjs"[ \t]*$/m, /^[ \t]*job_run chotot-daily resolve-properties node "\$ROOT\/pipeline\/resolve-properties\.mjs"[ \t]*$/m].map((m) => job.search(m));
  return t >= 0 && r > t;
}
function kiemJobDem(vipham) {
  const job = readFileSync(join(PIPE, "../scripts/chotot-daily.sh"), "utf8");
  const dat = jobDung(job);
  if (jobDung(job.replace(/^([ \t]*job_run chotot-daily transform-chotot)/m, "# $1"))) vipham.push("đối chứng dòng job đã comment sai — phép đo vô nghĩa");
  console.log(`job đêm có transform rồi resolve, không đối số: ${dat ? "đúng" : "SAI"}`);
  if (!dat) vipham.push("job đêm khác hai bước của thước");
}

async function chay() {
  const c = new pg.Client({ connectionString: DB_URL || undefined });
  await c.connect();
  const vipham = [];
  try {
    console.log(`DB: ${(await c.query("SELECT current_database() d")).rows[0].d}`);
    const nguon = (await c.query(`SELECT list_id, payload->>'street_name' v FROM stg_chotot_ads
      WHERE price > 0 AND size_m2 > 0 AND NULLIF(btrim(payload->>'street_name'), '') IS NOT NULL`)).rows;
    const nguonSo = nguon.filter((r) => coSo(r.v));
    console.log(`tin nguồn có đường: ${nguon.length}; mang dãy số: ${nguonSo.length}; trong đó có chữ, bị bỏ cả chuỗi: ${nguonSo.filter((r) => /\p{L}/u.test(r.v)).length}`);
    console.log(`chuỗi nguồn theo định nghĩa rộng mà định nghĩa hẹp không bắt (chỉ in): ${nguon.filter((r) => coSoRong(r.v) && !coSo(r.v)).length}`);
    if (!nguonSo.length) vipham.push("không có tin nguồn mang số — phép đo vô nghĩa");

    const truoc = await doc(c);
    inDong("trước", truoc);
    let giay = 0;
    if (!CHI_DOC) {
      if (!dem(truoc.tin) || !dem(truoc.can)) vipham.push("trước khi chạy tin hoặc căn không có giá trị mang số — phép đo vô nghĩa");
      const t0 = Date.now();
      await runTransformChotot(c);
      await chayResolve(c);
      giay = (Date.now() - t0) / 1000;
    }
    const sau = await doc(c);
    inDong("sau", sau);

    if (GAI) sau[GAI[0]].push({ v: GAI[1] === "lien" ? "0900000001" : "0900 000 001" });
    const con = dem(sau.tin) + dem(sau.can) + dem(sau.log);
    console.log(`giá trị còn số: ${con}`);
    if (con) vipham.push(`đường còn số: ${con} giá trị`);

    // Cả hai phép so chỉ chạy khi nguồn và tin cùng lượt: --chi-doc trên DB máy thu sau job đêm có stg mới hơn tin. Cờ gài sửa dữ liệu đầu vào, qua đúng phép so.
    if (SO_SANH) {
      const sauTin = new Map(sau.tin.map((r) => [r.offer_id, r.v]));
      // Quan hệ với nguồn: tin nguồn sạch còn sống mang đúng chữ bộ đọc ra.
      const song = new Set((await c.query("SELECT offer_id FROM sale_offers WHERE source = 'S06'")).rows.map((r) => r.offer_id));
      const sach = nguon.map((r) => ({ id: mintOfferId("S06", String(r.list_id)), ra: docDuong(r.v) })).filter((r) => r.ra !== null && song.has(r.id));
      if (co("--gai-mat-duong") && sach.length) sauTin.delete(sach[0].id);
      const lech = sach.filter((r) => sauTin.get(r.id) !== r.ra).length;
      console.log(`mẫu số tin nguồn sạch: ${sach.length}`);
      console.log(`tin nguồn sạch lệch chữ: ${lech}`);
      if (sach.length < MAU_SO_TOI_THIEU) vipham.push(`mẫu số dưới ${MAU_SO_TOI_THIEU}: ${sach.length}`);
      if (lech) vipham.push(`tin nguồn sạch lệch chữ: ${lech}`);

      const canSach = truoc.can.filter((r) => !coSo(r.v));
      const sauCan = new Map(sau.can.map((r) => [r.id, r.v]));
      if (co("--gai-can-doi") && canSach.length) sauCan.set(canSach[0].id, `${canSach[0].v} đổi`);
      const canDoi = canSach.filter((r) => sauCan.get(r.id) !== r.v).length;
      console.log(`ô căn đường sạch: ${canSach.length}; đổi hoặc mất: ${canDoi}`);
      if (canSach.length < O_SACH_TOI_THIEU) vipham.push(`ô căn sạch dưới ${O_SACH_TOI_THIEU}: ${canSach.length}`);
      if (canDoi) vipham.push(`ô căn đường sạch đổi hoặc mất: ${canDoi}`);
    }
    if (!CHI_DOC) {
      const rut = (await c.query(`SELECT count(*)::int n FROM field_assertions WHERE retract_reason = 'chua-sdt'`)).rows[0].n;
      const go = (await c.query(`SELECT count(*)::int n FROM properties p, jsonb_array_elements(p.enrichment_log) e WHERE e->>'src' = 'go-sdt-duong'`)).rows[0].n;
      console.log(`phát biểu rút chua-sdt: ${rut}; mục go-sdt-duong: ${go}`);
      if (!rut || !go) vipham.push("lượt chạy không rút phát biểu hoặc không gỡ ô — phép đo vô nghĩa");
    }
    console.log(`thời gian transform + resolve: ${giay.toFixed(0)} giây`);
    return vipham;
  } finally {
    await c.end();
  }
}

/** Chiều đỏ trên chính bản chép: cùng lệnh, chỉ đọc, phải thoát 1, ghim đúng thông điệp, không in dãy số. */
function chungDo(vipham) {
  const toi = join(PIPE, "scripts/do-sdt-trong-duong.mjs");
  const ca = ["tin", "can", "log"].flatMap((b) => ["lien", "ngan"].map((d) => [["--gai-sdt", `${b}:${d}`], "đường còn số"]));
  ca.push([["--gai-mat-duong"], "tin nguồn sạch lệch chữ: 1"], [["--gai-can-doi"], "ô căn đường sạch đổi hoặc mất: 1"], [["--gai-in-so"], "dòng in chứa dãy số"]);
  for (const [cac, ghim] of ca) {
    const r = spawnSync(process.execPath, [toi, "--chi-doc", ...cac], { encoding: "utf8", env: process.env, maxBuffer: 1e8 });
    // Ca --gai-in-so in dãy số bịa theo chủ ý; lời báo của ca nào cũng không được lặp lại giá trị.
    const dat = r.status === 1 && r.stdout.includes(`VI PHẠM: ${ghim}`) && (cac[0] === "--gai-in-so" || !coSo(r.stdout));
    console.log(`chiều đỏ ${cac.join(" ")}: thoát ${r.status}, ${dat ? "đúng thông điệp" : "SAI"}`);
    if (!dat) vipham.push(`chiều đỏ ${cac.join(" ")} không ra «${ghim}»`);
  }
  const chung = spawnSync(process.execPath, [toi], { encoding: "utf8", env: { ...process.env, DATABASE_URL: "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" } });
  console.log(`trỏ vào DB dùng chung: thoát ${chung.status}`);
  if (chung.status !== 2) vipham.push("thước không từ chối DB dùng chung");
}

// Đối chứng dương của định nghĩa độc lập; số là số bịa.
const vipham = [];
for (const [s, mong] of [["0900000001", true], ["0900 000 001", true], ["a/c 0900.000.001", true], ["12345678 Lê Lợi", false], ["Số 277 Đường 3/2", false]]) {
  if (coSo(s) !== mong) vipham.push("đối chứng định nghĩa dãy số sai — phép đo vô nghĩa");
}
kiemJobDem(vipham);
vipham.push(...await chay());
if (!CHI_DOC) chungDo(vipham);
if (co("--gai-in-so")) console.log("0900000001");
const dongSo = daIn.split("\n").filter(coSo).length;
console.log(`dòng in chứa dãy số của lượt này: ${dongSo}`);
if (dongSo) vipham.push(`dòng in chứa dãy số: ${dongSo}`);
for (const v of vipham) console.log(`VI PHẠM: ${v}`);
process.exit(vipham.length ? 1 : 0);
