// do-sdt-trong-duong.mjs — hồ sơ _acceptance/sdt-trong-ten-duong AC-4: thước trên bản chép DB máy thu (db/db-thu.sh). Chỉ in số đếm, không in giá trị.
// Hai bước vì transform + resolve mất gần 2 giờ, còn lượt chấm không chạy được lệnh nền dài trong worktree cô lập (loi-kit-long-running.md của DS1):
//   --chay                    chạy thật transform S06 + resolve trên DB thử, ghi ảnh trước và băm mã vào bảng do_sdt_luot của bản chép
//   (không cờ)                đọc bản chép vừa chạy, từ chối nếu băm mã lệch, đếm và so; vi phạm → in dòng, thoát 1
//   --chi-doc                 chỉ đếm, không cần lượt chạy (dùng được trên DB máy thu sau job đêm)
//   --gai-sdt <bảng>:<dạng>   gài một giá trị mang số vào phép đếm; bảng tin|can|log, dạng lien|ngan
//   --gai-mat-duong           bỏ đường của một tin nguồn sạch trước phép so, cần bản chép đã chạy xong
//   --gai-can-doi             đổi một ô căn sạch trước phép so
//   --gai-in-so               in một dòng mang dãy số bịa
//   --gai-bam                 coi băm mã là lệch
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
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
const CHAY = co("--chay");
const CHI_DOC = co("--chi-doc");
const iGai = argv.indexOf("--gai-sdt");
const GAI = iGai >= 0 ? argv[iGai + 1].split(":") : null;
const SO_SANH = !CHI_DOC || co("--gai-mat-duong") || co("--gai-can-doi");
const DB_URL = process.env.DATABASE_URL ?? "";
// --chay luôn là lượt ghi, kể cả khi đi kèm --chi-doc.
if ((CHAY || !CHI_DOC) && !/\/oneinvest_[a-z0-9_]+$/.test(DB_URL)) {
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
const demDongSo = () => daIn.split("\n").filter(coSo).length;

/** Băm mã mà lượt chạy thực thi: mọi tệp lib của pipeline và hai tệp đầu vào. Thước và test không tính. */
function bamMa() {
  const tep = [...readdirSync(join(PIPE, "lib")).filter((f) => f.endsWith(".mjs")).sort().map((f) => join("lib", f)), "transform-chotot.mjs", "resolve-properties.mjs"];
  const h = createHash("sha256");
  for (const f of tep) h.update(f).update(readFileSync(join(PIPE, f)));
  return h.digest("hex");
}

async function doc(c) {
  const tin = (await c.query("SELECT offer_id, street_raw v FROM sale_offers WHERE street_raw IS NOT NULL")).rows;
  const can = (await c.query("SELECT id, street v FROM properties WHERE street IS NOT NULL")).rows;
  // Mục street và mục gỡ đều đi lên cloud cùng enrichment_log; bỏ thời điểm và khoá tin, không phải giá trị đường.
  const log = (await c.query(`SELECT e - 'at' - 'offer_id' j FROM properties p, jsonb_array_elements(p.enrichment_log) e
    WHERE e->>'field' = 'street' OR e->>'src' = 'go-sdt-duong'`)).rows.map((r) => ({ v: Object.values(r.j).join(" | ") }));
  return { tin, can, log };
}
const dongDem = (s) => `tin ${s.tin} trên ${s.tinN} · căn ${s.can} trên ${s.canN} · nhật ký căn ${s.log} trên ${s.logN}`;
const tomTat = (s) => ({ tin: dem(s.tin), tinN: s.tin.length, can: dem(s.can), canN: s.can.length, log: dem(s.log), logN: s.log.length });

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

/** Bước --chay: ghi ảnh trước và băm mã vào chính bản chép, để lượt đọc so được mà không phải chạy lại. */
async function chayLuot(c) {
  const vipham = [];
  console.log(`DB: ${(await c.query("SELECT current_database() d")).rows[0].d}`);
  const truoc = await doc(c);
  const ta = tomTat(truoc);
  console.log(`trước: ${dongDem(ta)}`);
  if (!ta.tin || !ta.can) vipham.push("trước khi chạy tin hoặc căn không có giá trị mang số — phép đo vô nghĩa");
  const bam = bamMa();
  const t0 = Date.now();
  await runTransformChotot(c);
  await chayResolve(c);
  const giay = (Date.now() - t0) / 1000;
  if (bam !== bamMa()) vipham.push("mã đổi trong lúc chạy — lượt này không dùng được");
  await c.query("CREATE TABLE do_sdt_luot (id int PRIMARY KEY DEFAULT 1, du_lieu jsonb NOT NULL)");
  const can_sach = truoc.can.filter((r) => !coSo(r.v)).map((r) => ({ id: String(r.id), v: r.v }));
  const nam = { bam, truoc: ta, can_sach, dong_so: demDongSo(), giay: Math.round(giay), xong: new Date().toISOString() };
  await c.query("INSERT INTO do_sdt_luot (du_lieu) VALUES ($1)", [JSON.stringify(nam)]);
  console.log(`thời gian transform + resolve: ${nam.giay} giây; băm mã: ${bam.slice(0, 12)}`);
  return vipham;
}

async function chay() {
  const c = new pg.Client({ connectionString: DB_URL || undefined });
  await c.connect();
  const vipham = [];
  try {
    if (CHAY) return await chayLuot(c);
    console.log(`DB: ${(await c.query("SELECT current_database() d")).rows[0].d}`);

    let luot = null;
    if (!CHI_DOC) {
      const co_bang = (await c.query("SELECT to_regclass('do_sdt_luot') b")).rows[0].b;
      luot = co_bang ? (await c.query("SELECT du_lieu FROM do_sdt_luot")).rows[0]?.du_lieu : null;
      if (!luot) { vipham.push("bản chép chưa có lượt --chay"); return vipham; }
      const bam = co("--gai-bam") ? "lech" : bamMa();
      if (bam !== luot.bam) { vipham.push("bản chép không phải của mã này: băm lệch, chạy lại --chay"); return vipham; }
      console.log(`lượt chạy xong ${luot.xong}, ${luot.giay} giây, băm mã ${luot.bam.slice(0, 12)} khớp mã hiện tại`);
      console.log(`trước: ${dongDem(luot.truoc)}`);
      if (!luot.truoc.tin || !luot.truoc.can) vipham.push("trước khi chạy tin hoặc căn không có giá trị mang số — phép đo vô nghĩa");
      console.log(`dòng in chứa dãy số của lượt chạy: ${luot.dong_so}`);
      if (luot.dong_so) vipham.push(`dòng in chứa dãy số: ${luot.dong_so}`);
    }

    const nguon = (await c.query(`SELECT list_id, payload->>'street_name' v FROM stg_chotot_ads
      WHERE price > 0 AND size_m2 > 0 AND NULLIF(btrim(payload->>'street_name'), '') IS NOT NULL`)).rows;
    const nguonSo = nguon.filter((r) => coSo(r.v));
    console.log(`tin nguồn có đường: ${nguon.length}; mang dãy số: ${nguonSo.length}; trong đó có chữ, bị bỏ cả chuỗi: ${nguonSo.filter((r) => /\p{L}/u.test(r.v)).length}`);
    console.log(`chuỗi nguồn theo định nghĩa rộng mà định nghĩa hẹp không bắt (chỉ in): ${nguon.filter((r) => coSoRong(r.v) && !coSo(r.v)).length}`);
    if (!nguonSo.length) vipham.push("không có tin nguồn mang số — phép đo vô nghĩa");

    const sau = await doc(c);
    console.log(`sau: ${dongDem(tomTat(sau))}`);

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

      const canSach = luot ? luot.can_sach : sau.can.filter((r) => !coSo(r.v)).map((r) => ({ id: String(r.id), v: r.v }));
      const sauCan = new Map(sau.can.map((r) => [String(r.id), r.v]));
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
    return vipham;
  } finally {
    await c.end();
  }
}

/** Chiều đỏ trên chính bản chép: cùng lệnh, chỉ đọc, phải thoát 1, ghim đúng thông điệp, không in dãy số. */
function chungDo(vipham) {
  const toi = join(PIPE, "scripts/do-sdt-trong-duong.mjs");
  const ca = ["tin", "can", "log"].flatMap((b) => ["lien", "ngan"].map((d) => [["--chi-doc", "--gai-sdt", `${b}:${d}`], "đường còn số"]));
  ca.push([["--chi-doc", "--gai-mat-duong"], "tin nguồn sạch lệch chữ: 1"], [["--chi-doc", "--gai-can-doi"], "ô căn đường sạch đổi hoặc mất: 1"], [["--chi-doc", "--gai-in-so"], "dòng in chứa dãy số"], [["--gai-bam"], "bản chép không phải của mã này"]);
  for (const [cac, ghim] of ca) {
    const r = spawnSync(process.execPath, [toi, ...cac], { encoding: "utf8", env: process.env, maxBuffer: 1e8 });
    // Ca --gai-in-so in dãy số bịa theo chủ ý; lời báo của ca nào cũng không được lặp lại giá trị.
    const dat = r.status === 1 && r.stdout.includes(`VI PHẠM: ${ghim}`) && (cac[1] === "--gai-in-so" || !coSo(r.stdout));
    console.log(`chiều đỏ ${cac.join(" ")}: thoát ${r.status}, ${dat ? "đúng thông điệp" : "SAI"}`);
    if (!dat) vipham.push(`chiều đỏ ${cac.join(" ")} không ra «${ghim}»`);
  }
  for (const them of [[], ["--chay"], ["--chay", "--chi-doc"]]) {
    const chung = spawnSync(process.execPath, [toi, ...them], { encoding: "utf8", env: { ...process.env, DATABASE_URL: "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" } });
    console.log(`trỏ vào DB dùng chung ${them.join(" ")}: thoát ${chung.status}`);
    if (chung.status !== 2) vipham.push("thước không từ chối DB dùng chung");
  }
}

// Đối chứng dương của định nghĩa độc lập; số là số bịa.
const vipham = [];
for (const [s, mong] of [["0900000001", true], ["0900 000 001", true], ["a/c 0900.000.001", true], ["12345678 Lê Lợi", false], ["Số 277 Đường 3/2", false]]) {
  if (coSo(s) !== mong) vipham.push("đối chứng định nghĩa dãy số sai — phép đo vô nghĩa");
}
if (!CHAY) kiemJobDem(vipham);
vipham.push(...await chay());
const hopLe = !vipham.some((v) => /--chay|băm lệch/.test(v));
if (!CHAY && !CHI_DOC && !co("--gai-bam") && hopLe) chungDo(vipham);
if (co("--gai-in-so")) console.log("0900000001");
const dongSo = demDongSo();
console.log(`dòng in chứa dãy số của lượt này: ${dongSo}`);
if (dongSo) vipham.push(`dòng in chứa dãy số: ${dongSo}`);
for (const v of vipham) console.log(`VI PHẠM: ${v}`);
process.exit(vipham.length ? 1 : 0);
