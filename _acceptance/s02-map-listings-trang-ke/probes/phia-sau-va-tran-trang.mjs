// s02-map-listings-trang-ke — AC-4, AC-5 (ZT viết, 27/11). Chạy trên collector/dist đã build; profile là thư mục tạm dựng bằng số,
// fetch là bản giả — không lời mạng thật nào. Tên nguồn không gõ ở đây: tệp tìm theo hàm nó xuất, origin đọc từ tệp dist.
//   AC-4: bản ghi trang kế mà call() trả → bộ đọc phía sau (biểu thức của pipeline/transform-airdna.mjs, rút từ chính tệp đó)
//         lấy đúng mã thị trường từ payload.url. Chiều đỏ: bộ đọc đòi hậu tố «@» thì trượt.
//   AC-5: nguồn trả đủ 15000 căn mãi (lặp lại trang đầu, hoặc trang mới mãi) → vòng phân trang dừng trong ≤ 11 lời map_listings.
//         Bản giả tự chặn ở lời thứ 30 để phép đo không chạy mãi.
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execSync } from "node:child_process";

const ROOT = execSync("git rev-parse --show-toplevel", { cwd: dirname(fileURLToPath(import.meta.url)) }).toString().trim();
const DIST = join(ROOT, "collector", "dist", "collectors");
const timTep = (dau) => readdirSync(DIST).find((t) => t.endsWith(".js") && readFileSync(join(DIST, t), "utf8").includes(dau));
const BOTHU = join(DIST, timTep("export function docExpAppToken"));
const PHIEN = join(DIST, timTep("export function docPhienTuProfile"));
const ORIGIN = /const APP_ORIGIN = "([^"]+)"/.exec(readFileSync(BOTHU, "utf8"))?.[1];
const TRANSFORM = readFileSync(join(ROOT, "pipeline", "transform-airdna.mjs"), "utf8");
const dongDoc = TRANSFORM.split("\n").find((d) => d.includes("map_listings") && d.includes("url?.match("));
const RE_DOC = dongDoc ? new RegExp(/url\?\.match\(\/(.*)\/\)/.exec(dongDoc)[1]) : null;

const varint = (n) => { const r = []; while (n >= 0x80) { r.push((n & 0x7f) | 0x80); n = Math.floor(n / 128); } r.push(n); return Buffer.from(r); };
function dungProfile(khoa) {
  const dir = mkdtempSync(join(tmpdir(), "s02-trang-ke-"));
  const kho = join(dir, "Default", "Local Storage", "leveldb");
  mkdirSync(kho, { recursive: true });
  const gt = Buffer.concat([Buffer.from([1]), Buffer.from(JSON.stringify({ fusionAuthRefreshToken: "rt-gia" }), "latin1")]);
  const dau = Buffer.alloc(12); dau.writeUInt32LE(1, 0); dau.writeUInt32LE(1, 8);
  const batch = Buffer.concat([dau, Buffer.from([1]), varint(khoa.length), Buffer.from(khoa), varint(gt.length), gt]);
  const h = Buffer.alloc(7); h.writeUInt16LE(batch.length, 4); h[6] = 1;
  writeFileSync(join(kho, "000003.log"), Buffer.concat([h, batch]));
  return dir;
}
const json = (s, b) => new Response(JSON.stringify(b), { status: s, headers: { "content-type": "application/json" } });
const jwt = () => `e30.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 600 })).toString("base64url")}.x`;
const trang = (dau) => ({ payload: { listings: Array.from({ length: 15000 }, (_, i) => ({ property_id: `abnb_${dau + i}` })) } });

let do_ = false;
const bao = (dat, ten) => { console.log(`${dat ? "đạt" : "ĐỎ"}: ${ten}`); if (!dat) do_ = true; };

// ---- AC-4
{
  const m = await import(pathToFileURL(BOTHU).href);
  const ctx = { rateLimit: { take: async () => {} }, log: () => {}, failed: 0, getToken: () => jwt(), refreshToken: async () => {} };
  const it = await m.call("POST", "/v1/market/47/map_listings@15000", { pagination: { page_size: 15000, offset: 15000 } }, ctx,
    async () => json(200, trang(0)));
  const ma = RE_DOC ? it?.payload?.url?.match(RE_DOC)?.[1] : undefined;
  bao(!!RE_DOC && ma === "47", `bản thật · AC-4 bộ đọc phía sau lấy mã thị trường từ payload.url của trang kế (thực: ${ma ?? "không khớp"}${RE_DOC ? "" : ", không rút được biểu thức"})`);
  const reDot = /\/market\/(\d+)\/map_listings@\d+/;
  bao(!it?.payload?.url?.match(reDot), "bản đột biến (bộ đọc đòi hậu tố @ trong url) bị bắt");
}

// ---- AC-5
async function vong(kieu) {
  const { khoaLocalStorage } = await import(pathToFileURL(PHIEN).href);
  const profile = dungProfile(khoaLocalStorage(ORIGIN, "auth"));
  process.env.S02_PROFILE_DIR = `${profile}/`;
  process.env.AIRDNA_MARKETS = "47";
  process.env.AIRDNA_SUB_LISTINGS = "0";
  let soTrang = 0;
  const dong = [];
  globalThis.fetch = async (url) => {
    const u = String(url);
    if (u.includes("/v1/fetch_id_token")) return json(200, { id_token: "id-gia" });
    if (u.includes("/v1/fetch_app_token")) return json(200, { token: jwt() });
    if (u.includes("/map_listings")) {
      soTrang++;
      if (soTrang >= 30) throw new Error("bản giả tự chặn ở lời thứ 30");
      if (kieu === "cuoi" && soTrang === 2) return json(200, { payload: { listings: trang(15000).payload.listings.slice(0, 623) } });
      return json(200, trang(kieu === "lap" ? 0 : soTrang * 15000));
    }
    return json(500, {});
  };
  const m = await import(pathToFileURL(BOTHU).href + `?k=${Math.random()}`);
  const boThu = Object.values(m).find((v) => v && typeof v === "object" && typeof v.collect === "function");
  try {
    await boThu.collect({ city: { id: "hanoi" }, rateLimit: { take: async () => {} }, log: (...a) => dong.push(a.join(" ")),
      checkpoint: { get: () => undefined, set: () => {}, save: async () => {} }, paths: { snapshotRoot: profile, stateDir: profile } });
  } catch { /* lượt dừng vì chốt là kết cục hợp lệ */ }
  rmSync(profile, { recursive: true, force: true });
  const lyDo = dong.filter((d) => /map_listings/.test(d) && /(dừng|trần|lặp)/i.test(d)).length;
  return { n: soTrang, lyDo };
}
for (const [kieu, ten] of [["lap", "nguồn bỏ qua offset, trả lại trang đầu mãi"], ["moi", "nguồn trả trang mới đủ 15000 căn mãi"]]) {
  const { n, lyDo } = await vong(kieu);
  bao(n <= 11 && lyDo === 1, `bản thật · AC-5 ${ten} → vòng phân trang dừng trong ≤ 11 lời map_listings, một dòng lý do (thực: ${n} lời${n >= 30 ? ", chạm chặn của bản giả — vòng không trần" : ""}, ${lyDo} dòng lý do)`);
}
{
  const { n, lyDo } = await vong("cuoi");
  bao(n === 2 && lyDo === 0, `bản thật · AC-5 vế không bắn: trang cuối 623 căn → dừng sau 2 lời, không dòng lý do (thực: ${n} lời, ${lyDo} dòng)`);
}

console.log(do_ ? "ĐỎ" : "XANH");
process.exit(do_ ? 1 : 0);
