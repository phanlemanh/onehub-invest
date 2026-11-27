// s02-cua-api — AC-13 (ZT viết, 27/11; gap-probe F1): bị chặn ở lời dữ liệu đầu tiên thì CẢ LƯỢT dừng — collect() ném
// LoiBiChan, không còn lời fetch nào sau lời bị chặn, thị trường thứ hai không được gọi. Vế không bắn: HTTP 500 chỉ là
// lời lỗi lẻ, lượt đi tiếp sang thị trường thứ hai. Chiều đỏ: bản chép dist mà call() nuốt LoiBiChan.
// Chạy trên collector/dist đã build. Profile là thư mục tạm dựng bằng số; fetch là bản giả — không lời mạng thật nào.
// Tên nguồn không gõ ở đây: tệp tìm theo hàm nó xuất, origin đọc từ chính tệp dist.
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execSync } from "node:child_process";

const ROOT = execSync("git rev-parse --show-toplevel", { cwd: dirname(fileURLToPath(import.meta.url)) }).toString().trim();
const DIST = join(ROOT, "collector", "dist");
const timTep = (thuMuc, dau) => {
  const ten = readdirSync(thuMuc).find((t) => t.endsWith(".js") && readFileSync(join(thuMuc, t), "utf8").includes(dau));
  if (!ten) throw new Error(`không thấy tệp dist có ${dau}`);
  return ten;
};
const TEN_BOTHU = timTep(join(DIST, "collectors"), "export function docExpAppToken");
const TEN_PHIEN = timTep(join(DIST, "collectors"), "export function docPhienTuProfile");
const ORIGIN = /const APP_ORIGIN = "([^"]+)"/.exec(readFileSync(join(DIST, "collectors", TEN_BOTHU), "utf8"))?.[1];
if (!ORIGIN) throw new Error("không đọc được origin ứng dụng từ tệp dist");

// --- profile giả: một tệp nhật ký LevelDB, một bản ghi FULL, một WriteBatch một mục
const varint = (n) => { const r = []; while (n >= 0x80) { r.push((n & 0x7f) | 0x80); n = Math.floor(n / 128); } r.push(n); return Buffer.from(r); };
function dungProfile(khoa, duoiCat = false) {
  const dir = mkdtempSync(join(tmpdir(), "s02-dung-ca-luot-"));
  const kho = join(dir, "Default", "Local Storage", "leveldb");
  mkdirSync(kho, { recursive: true });
  const giaTri = Buffer.concat([Buffer.from([1]), Buffer.from(JSON.stringify({ fusionAuthRefreshToken: "rt-gia" }), "latin1")]);
  const dau = Buffer.alloc(12); dau.writeUInt32LE(1, 0); dau.writeUInt32LE(0, 4); dau.writeUInt32LE(1, 8);
  const batch = Buffer.concat([dau, Buffer.from([1]), varint(khoa.length), Buffer.from(khoa), varint(giaTri.length), giaTri]);
  const h = Buffer.alloc(7); h.writeUInt16LE(batch.length, 4); h[6] = 1;
  // duoiCat: thêm bản ghi thứ hai (số thứ tự lớn hơn) bị cắt giữa chừng — như tệp đang ghi dở lúc lượt đọc
  const duoi = duoiCat ? Buffer.concat([Buffer.from([0, 0, 0, 0, 0xff, 0x00, 1]), Buffer.from(batch.subarray(0, 20))]) : Buffer.alloc(0);
  if (duoiCat) duoi.writeUInt32LE(2, 7);
  writeFileSync(join(kho, "000003.log"), Buffer.concat([h, batch, duoi]));
  return dir;
}
const jwt = (exp) => `e30.${Buffer.from(JSON.stringify({ exp })).toString("base64url")}.x`;
const json = (status, body, extra = {}) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...extra } });

async function mot(distGoc, kieu) {
  const { khoaLocalStorage } = await import(pathToFileURL(join(distGoc, "collectors", TEN_PHIEN)).href + `?k=${Math.random()}`);
  const profile = dungProfile(khoaLocalStorage(ORIGIN, "auth"));
  process.env.S02_PROFILE_DIR = `${profile}/`;
  process.env.AIRDNA_MARKETS = "901,902";
  process.env.AIRDNA_SUB_LISTINGS = "0";
  const urls = [];
  let lanDuLieu = 0;
  globalThis.fetch = async (url) => {
    const u = String(url);
    urls.push(u);
    if (u.includes("/v1/fetch_id_token")) return json(200, { id_token: "id-gia" });
    if (u.includes("/v1/fetch_app_token")) return json(200, { token: jwt(Math.floor(Date.now() / 1000) + 600) });
    lanDuLieu++;
    if (lanDuLieu > 1 || kieu === "500") return json(500, { loi: 1 });
    if (kieu === "429") return json(429, { loi: 1 });
    if (kieu === "thu-thach") return new Response("<html>x</html>", { status: 403, headers: { "content-type": "text/html", "cf-mitigated": "challenge" } });
    return json(403, { loi: 1 });
  };
  const m = await import(pathToFileURL(join(distGoc, "collectors", TEN_BOTHU)).href + `?k=${Math.random()}`);
  const boThu = Object.values(m).find((v) => v && typeof v === "object" && typeof v.collect === "function");
  const dong = [];
  let soTake = 0;
  let loi = null;
  try {
    await boThu.collect({
      city: { id: "hanoi" }, rateLimit: { take: async () => { soTake++; } }, log: (...a) => dong.push(a.join(" ")),
      checkpoint: { get: () => undefined, set: () => {}, save: async () => {} }, paths: { snapshotRoot: profile, stateDir: profile },
    });
  } catch (e) { loi = e; }
  rmSync(profile, { recursive: true, force: true });
  const duLieu = urls.filter((u) => !u.includes("/v1/fetch_"));
  return { loi, laBiChan: loi instanceof m.LoiBiChan, duLieu, dong, soTake, soFetch: urls.length };
}

async function kiem(distGoc, nhan) {
  const ket = [];
  for (const kieu of ["429", "thu-thach", "403"]) {
    const r = await mot(distGoc, kieu);
    const soChan = r.dong.filter((d) => d.startsWith("BỊ CHẶN [S02]")).length;
    const dat = r.laBiChan && r.duLieu.length === 1 && !r.duLieu.some((u) => u.includes("902")) && soChan === 1;
    ket.push({ dat, ten: `${nhan} · ${kieu} ở lời dữ liệu đầu → collect() ném LoiBiChan, 1 lời dữ liệu, 0 lời cho thị trường 902, 1 dòng BỊ CHẶN (thực: ${r.laBiChan ? "LoiBiChan" : r.loi ? r.loi.constructor.name : "không ném"}, ${r.duLieu.length} lời, ${soChan} dòng)` });
  }
  const r = await mot(distGoc, "500");
  const dat = !r.laBiChan && r.duLieu.some((u) => u.includes("902"));
  ket.push({ dat: r.soTake === r.soFetch, ten: `${nhan} · mỗi lời gửi (cả hai lời cấp token và mọi lời dữ liệu) đúng một take() (thực: ${r.soTake} take, ${r.soFetch} lời)` });
  ket.push({ dat, ten: `${nhan} · vế không bắn: 500 là lời lỗi lẻ, lượt đi tiếp tới thị trường 902 (thực: ${r.duLieu.filter((u) => u.includes("902")).length} lời cho 902)` });
  return ket;
}

// AC-2(g): đuôi nhật ký ghi dở → bỏ đuôi, dùng bản ghi nguyên vẹn trước nó, không ném
async function duoiCat(distGoc) {
  const { khoaLocalStorage, docPhienTuProfile } = await import(pathToFileURL(join(distGoc, "collectors", TEN_PHIEN)).href + `?k=${Math.random()}`);
  const khoa = khoaLocalStorage(ORIGIN, "auth");
  const dir = dungProfile(khoa, true);
  try { const r = docPhienTuProfile(dir, khoa); return r?.fusionAuthRefreshToken === "rt-gia" ? "đọc bản nguyên vẹn" : `trả ${JSON.stringify(r)}`; }
  catch (e) { return `ném: ${e.message.slice(0, 60)}`; }
  finally { rmSync(dir, { recursive: true, force: true }); }
}

let do_ = false;
{ const r = await duoiCat(DIST); const dat = r === "đọc bản nguyên vẹn";
  console.log(`${dat ? "đạt" : "ĐỎ"}: bản thật · AC-2(g) đuôi nhật ký ghi dở → bỏ đuôi, đọc bản nguyên vẹn, không ném (thực: ${r})`); if (!dat) do_ = true; }
for (const k of await kiem(DIST, "bản thật")) { console.log(`${k.dat ? "đạt" : "ĐỎ"}: ${k.ten}`); if (!k.dat) do_ = true; }

// chiều đỏ: bản chép dist (trong collector/ để resolve node_modules), call() nuốt LoiBiChan
const tam = mkdtempSync(join(ROOT, "collector", ".dot-bien-dung-ca-luot-"));
try {
  cpSync(DIST, tam, { recursive: true });
  const tep = join(tam, "collectors", TEN_BOTHU);
  const goc = readFileSync(tep, "utf8");
  const doi = goc.replace("err instanceof LoiBiChan ||", "");
  if (doi === goc) { console.log("ĐỎ: không cấy được bản đột biến (mã đã đổi chỗ)"); do_ = true; }
  else {
    writeFileSync(tep, doi);
    const bat = (await kiem(tam, "đột biến")).filter((k) => k.ten.includes("LoiBiChan")).some((k) => !k.dat);
    console.log(bat ? "đạt: bản đột biến (call() nuốt LoiBiChan, lượt đi tiếp) bị bắt" : "ĐỎ: bản đột biến (call() nuốt LoiBiChan) KHÔNG bị bắt");
    if (!bat) do_ = true;
  }
  cpSync(DIST, tam, { recursive: true });
  const goc2 = readFileSync(tep, "utf8");
  const doi2 = goc2.replace(/(const doFetch = async \(\) => \{\s*)await ctx\.rateLimit\.take\(\);/, "$1");
  if (doi2 === goc2) { console.log("ĐỎ: không cấy được bản đột biến bỏ take() (mã đã đổi chỗ)"); do_ = true; }
  else {
    writeFileSync(tep, doi2);
    const bat = (await kiem(tam, "đột biến")).filter((k) => k.ten.includes("take()")).some((k) => !k.dat);
    console.log(bat ? "đạt: bản đột biến (call() gửi lời không qua take()) bị bắt" : "ĐỎ: bản đột biến (call() bỏ take()) KHÔNG bị bắt");
    if (!bat) do_ = true;
  }
} finally { rmSync(tam, { recursive: true, force: true }); }

console.log(do_ ? "ĐỎ" : "XANH");
process.exit(do_ ? 1 : 0);
