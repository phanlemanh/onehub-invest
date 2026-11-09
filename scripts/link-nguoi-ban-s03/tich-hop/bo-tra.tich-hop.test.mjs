// bo-tra.tich-hop.test.mjs — thước cổng của làn Claude cho AC-1, AC-2, AC-3, AC-4, AC-9 (link-nguoi-ban-s03; giám sát duyệt 09/11,
// XONG U1-0911-5). scripts/link-nguoi-ban-s03/tich-hop.mjs chép tệp này vào thư mục src của extension trên cây OpenClaw tạm (nền +
// extension.patch áp bằng git apply thật) dưới tên lnb-tich-hop.test.ts rồi chạy bằng vitest của cây nguồn.
//
// Mọi thứ đo là mã THẬT của .patch và của upstream:
// - Provider thật của monitor.ts khởi bộ tra; bộ tra thật (seller-lookup.ts) chạy với đồng hồ giả của vitest.
// - Chỉ module kênh bị thay: hàm lấy API bộ nghe tin đang nối trả API giả; start…Listener trả bộ nghe tin giả giữ onMessage/onError
//   của monitor thật; mọi hàm xuất khác mà bộ tra gọi tới (xác định bằng ngăn xếp lời gọi) bị đếm là lời cấm.
// - API giả là Proxy đếm MỌI thuộc tính bị đọc; getUserInfo đi qua đúng hàm giải phản hồi của thư viện kênh (resolveResponse) với
//   Response HTTP dựng sẵn, nên lỗi 401, 429, lỗi máy chủ, lỗi lạ và kết quả thành công đều có dạng do thư viện sinh, không viết tay.
// - Collector giả là máy chủ HTTP thật trên cổng tạm. Mã tệp chặn hợp lệ đọc từ bảng «Tệp chặn» của docs/ops/runtime-map.md.
// Kho không viết tên thư mục extension hay tên module kênh: tên đọc lúc chạy từ chính mã của bộ tra và từ khoá xuất của module.
// Mỗi phép đo có đối chứng trên cùng dữ liệu: vế dương chứng minh thước đếm được, vế âm là lời hứa của hợp đồng.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { spawnSync } from "node:child_process";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as http from "node:http";
import * as net from "node:net";
import * as os from "node:os";
import * as path from "node:path";
import { createRequire } from "node:module";

/** setTimeout thật, giữ trước khi đồng hồ giả của vitest thay hàm toàn cục. */
const SET_TIMEOUT_THAT = globalThis.setTimeout;
const DAY = path.dirname(new URL(import.meta.url).pathname);
const ROOT = process.env.LNB_ROOT; // gốc kho onehub (đọc tài liệu, script tiền kiểm và phán lùi)
const PATCH = process.env.LNB_PATCH;
const NGUON_TRA = fs.readFileSync(path.join(DAY, "seller-lookup.ts"), "utf8");
const NGUON_MON = fs.readFileSync(path.join(DAY, "monitor.ts"), "utf8");

// Hàm lấy API mà bộ tra dùng khi chạy thật = hàm trong phụ thuộc mặc định của nó (layApi: () => <hàm>()); module = dòng import hàm đó.
const KHOP_LAY = NGUON_TRA.match(/layApi:\s*\(\)\s*=>\s*(\w+)\(/);
if (!KHOP_LAY) throw new Error("bộ tra không có phụ thuộc mặc định layApi: () => <hàm>() — không biết bộ tra lấy API thật từ đâu");
const HAM_LAY_API = KHOP_LAY[1];
const KHOP_MOD = NGUON_TRA.match(new RegExp(`import \\{[^}]*\\b${HAM_LAY_API}\\b[^}]*\\} from "(\\.\\/[^"]+)";`));
if (!KHOP_MOD) throw new Error(`bộ tra không import ${"<hàm lấy API>"} từ một module cùng thư mục`);
const MOD_KENH = KHOP_MOD[1];

// ── Thư viện kênh thật (gói phụ thuộc «*-js» của extension) ──
const GOI_EXT = JSON.parse(fs.readFileSync(path.join(DAY, "..", "package.json"), "utf8"));
const TEN_THU_VIEN = Object.keys(GOI_EXT.dependencies ?? {}).find((k) => /-js$/.test(k));
function gocGoi(ten) {
  let d = path.dirname(createRequire(path.join(DAY, "x.js")).resolve(ten));
  for (;;) {
    const p = path.join(d, "package.json");
    if (fs.existsSync(p) && JSON.parse(fs.readFileSync(p, "utf8")).name === ten) return d;
    const len = path.dirname(d);
    if (len === d) throw new Error(`không tìm thấy gói thư viện kênh`);
    d = len;
  }
}
const THU_VIEN = gocGoi(TEN_THU_VIEN);
// Bản CommonJS của cùng mã thư viện (bản ESM nạp ngoài vite vỡ ở phần tương thích module của một phụ thuộc).
const { resolveResponse } = createRequire(path.join(DAY, "x.js"))(path.join(THU_VIEN, "dist", "cjs", "utils.cjs"));
const CTX = { options: { logging: false } };
/** Phản hồi HTTP → kết quả hoặc lỗi, qua đúng hàm của thư viện (không mã hoá — dữ liệu dựng sẵn). */
const quaThuVien = (res) => resolveResponse(CTX, res, undefined, false);
const phanHoiDung = (data) => new Response(JSON.stringify({ error_code: 0, data }), { status: 200 });
/** Tên các hàm của lớp API thư viện (apis.d.ts) — tập lời gọi API có thể có. */
const HAM_API = new Set([...fs.readFileSync(path.join(THU_VIEN, "dist", "apis.d.ts"), "utf8").matchAll(/^\s{4}(\w+): ReturnType</gm)]
  .map((m) => m[1]));

// Mã tệp chặn hợp lệ — bảng «Tệp chặn» của runtime-map (nguồn duy nhất).
const RUNTIME_MAP = ROOT ? fs.readFileSync(path.join(ROOT, "docs", "ops", "runtime-map.md"), "utf8") : "";
const MA_CHAN = new Set([...(RUNTIME_MAP.split("**Tệp chặn**")[1] ?? "").split("**Tắt")[0].matchAll(/`([a-z0-9-]+)`/g)].map((m) => m[1]));
const KHUON_CHAN = (t) => {
  const m = String(t ?? "").trim().match(/^([a-z0-9-]+)(?: (\d{1,5}))?$/);
  return !!m && MA_CHAN.has(m[1]);
};

// ── Trạng thái một ca ──
let ca;
const KHUNG = new Date("2026-11-10T19:00:00Z"); // 02:00 giờ VN 11/11 — trong khung 01:00–05:00
const NGOAI_KHUNG = new Date("2026-11-10T23:00:00Z"); // 06:00 giờ VN 11/11
const NGAY_VN = "2026-11-11";
const MA = (n, tu = 1000) => Array.from({ length: n }, (_, i) => String(tu + i));
const DC = ["9001", "9002"]; // mã đối chứng (người đã gửi tin trong 24 giờ)
const PII = ["+84900000000", "PII-TEN-CANARY", "PII-ANH-CANARY", "2000-01-01-CANARY"];

/** Hồ sơ trả về cho các mã gửi đi: mặc định có username và đủ trường PII; `dac[ma]` đè (undefined = không trả mã đó). */
function hoSo(ids, dac = {}, khongDoi = []) {
  const changed = {};
  for (const id of ids) {
    const ma = String(id).replace(/_0$/, "");
    if (khongDoi.includes(ma)) continue;
    if (Object.prototype.hasOwnProperty.call(dac, ma)) { if (dac[ma] !== undefined) changed[`${ma}_0`] = dac[ma]; continue; }
    changed[`${ma}_0`] = { userId: ma, username: `u${ma}`, phoneNumber: PII[0], displayName: PII[1], avatar: PII[2], dob: PII[3] };
  }
  return { changed_profiles: changed, unchanged_profiles: Object.fromEntries(khongDoi.map((m) => [`${m}_0`, {}])) };
}

/** Lời gọi bắt nguồn từ bộ tra (ngăn xếp có seller-lookup) — để quy lời gọi module kênh cho đúng bên. */
const tuBoTra = () => /seller-lookup\.ts/.test(new Error().stack ?? "");

function taoApi() {
  return new Proxy({}, {
    get(_t, p) {
      if (typeof p === "symbol" || p === "then") return undefined; // Promise dò thenable — không phải lời gọi
      ca.truyCap.push(p);
      if (p === "getUserInfo") return (ids) => { ca.goiApi.push({ ids: [...ids], luc: Date.now() }); return ca.traLoi(ids); };
      return () => { ca.goiCam.push(`api.${p}`); throw new Error(`bộ chạy cấm api.${p}`); };
    },
  });
}

async function khoiCollector(trangThai) {
  const nhan = [];
  const server = http.createServer((req, res) => {
    let b = "";
    req.on("data", (d) => (b += d)).on("end", () => {
      nhan.push({ auth: req.headers.authorization ?? "", body: b ? JSON.parse(b) : null });
      res.writeHead(trangThai(), { "content-type": "application/json" }).end(JSON.stringify({ accepted: 1 }));
    });
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", () => r()));
  return { server, nhan, url: `http://127.0.0.1:${server.address().port}/s03-ho-so` };
}

/** Nạp lại module (vòng hẹn giờ của bộ tra sống ở mức module) với module kênh giả. */
async function napModule() {
  vi.resetModules();
  vi.doMock(MOD_KENH, async (importOriginal) => {
    const goc = await importOriginal();
    ca.kenhGoc = Object.keys(goc);
    const ra = {};
    for (const [k, v] of Object.entries(goc)) {
      if (typeof v !== "function") { ra[k] = v; continue; }
      if (/^start\w+Listener$/.test(k)) {
        ra[k] = async (p) => { ca.nghe.push(p); return { stop: () => { ca.ngheDung++; } }; };
      } else if (/^normalize\w+InboundMessage$/.test(k)) {
        ra[k] = (m) => m?.data?.testNormalizedMessage ?? null;
      } else {
        ra[k] = async (...a) => {
          if (tuBoTra()) { ca.goiCam.push(k); throw new Error(`bộ chạy cấm ${k}`); }
          ca.goiMonitor.push(k);
          return /^(list|resolve)\w*(Entries|Groups|Friends)/.test(k) ? (a[0]?.entries ?? []).map((e) => ({ input: e, resolved: true, id: e })) : null;
        };
      }
    }
    // Luôn có hàm lấy API ở bản giả để đo phần còn lại; ca riêng [E1] kiểm module kênh THẬT có hàm này.
    ra[HAM_LAY_API] = () => { ca.layApi++; return ca.api; };
    return ra;
  });
  const monitor = await import("./monitor.js");
  const ten = Object.keys(monitor).find((k) => /^monitor\w+Provider$/.test(k));
  if (!ten) throw new Error("monitor.ts không xuất hàm Provider");
  const tra = await import("./seller-lookup.js");
  return { provider: monitor[ten], tra };
}

const runtimeLog = () => ({ log: (l) => ca.logs.push(String(l)), error: (l) => ca.logs.push(String(l)) });

/** Provider tối thiểu: bộ tra khởi ở đầu đường khởi động; Provider ném ở bước sau (thiếu tài khoản) — chỉ đường khởi bộ tra chạy. */
async function khoiProvider(provider, them = {}) {
  await provider({ runtime: runtimeLog(), ...them }).catch(() => undefined);
}

/** Provider đầy đủ: chạy tới bước gắn bộ nghe tin (giả) — trả { chay, ac, nghe, trangThai } để đẩy onMessage/onError của monitor thật. */
async function khoiProviderDayDu(provider) {
  const runtimeMod = await import("./runtime.js");
  const datRuntime = Object.entries(runtimeMod).find(([k]) => /^set\w+Runtime$/.test(k))?.[1];
  datRuntime({ logging: { shouldLogVerbose: () => false } });
  const helpers = await import("./test-helpers.js");
  const taoEnv = Object.entries(helpers).find(([k]) => /^create\w+RuntimeEnv$/.test(k))?.[1];
  const env = taoEnv();
  const goc = { log: env.log, error: env.error };
  env.log = (...a) => { ca.logs.push(a.map(String).join(" ")); return goc.log?.(...a); };
  env.error = (...a) => { ca.logs.push(a.map(String).join(" ")); return goc.error?.(...a); };
  // Hàng đợi ingress thử như upstream (ingress.test-support): mã kênh = tên gói extension, thư mục trạng thái riêng của ca.
  const { createChannelIngressQueueForTests } = await import("openclaw/plugin-sdk/channel-ingress-test-runtime");
  const stateDir = path.join(path.dirname(ca.dir), "state");
  fs.mkdirSync(stateDir, { recursive: true });
  const hangDoi = createChannelIngressQueueForTests({ channelId: GOI_EXT.name.split("/").pop(), accountId: "default", stateDir });
  const trangThai = [];
  const ac = new AbortController();
  const soNghe = ca.nghe.length;
  const chay = provider({
    account: { accountId: "default", enabled: true, profile: "default", authenticated: true, config: {} },
    config: {}, runtime: env, abortSignal: ac.signal, statusSink: (s) => trangThai.push(s), ingressQueue: hangDoi,
  }).catch((e) => ({ loi: e }));
  for (let i = 0; i < 200 && ca.nghe.length === soNghe; i++) await new Promise((r) => setImmediate(r));
  if (ca.nghe.length === soNghe) throw new Error("Provider đầy đủ không tới bước gắn bộ nghe tin");
  return { chay, ac, nghe: ca.nghe[ca.nghe.length - 1], trangThai };
}

/** Dấu tiến triển của ca: số lời, log, tệp việc, collector — đứng yên nghĩa là vòng của bộ tra đã xong. */
const coDai = (t) => { try { return fs.statSync(tep(t)).size; } catch { return -1; } }; // tệp có thể bị đổi tên giữa readdir và stat
const dauTienTrien = () => JSON.stringify([ca.goiApi.length, ca.logs.length, ca.nhanCollector.length,
  fs.readdirSync(ca.dir).map((t) => `${t}:${coDai(t)}`)]);

/**
 * Cho đồng hồ giả chạy `ms`, rồi nhường vòng sự kiện thật (fs, HTTP) tới khi dấu tiến triển đứng yên qua 40 lượt nhường liền,
 * tối đa 5 giây thật. Số lượt nhường cố định thì phụ thuộc tốc độ máy — đo sai chiều «0 lời» khi vòng chưa kịp xong.
 */
async function choChay(ms) {
  await vi.advanceTimersByTimeAsync(ms);
  const het = performance.now() + 5000;
  let cu = dauTienTrien(), yen = 0;
  while (yen < 40 && performance.now() < het) {
    await new Promise((r) => SET_TIMEOUT_THAT(r, 2));
    await vi.advanceTimersByTimeAsync(0);
    const moi = dauTienTrien();
    yen = moi === cu ? yen + 1 : 0;
    cu = moi;
  }
}

const tep = (ten) => path.join(ca.dir, ten);
const ghi = (ten, noiDung) => fs.writeFileSync(tep(ten), noiDung);
const doc = (ten) => (fs.existsSync(tep(ten)) ? fs.readFileSync(tep(ten), "utf8") : null);
const xoa = (ten) => fs.rmSync(tep(ten), { force: true });
const yeuCau = (mas, doiChung = DC) => ghi("yeu-cau.json", JSON.stringify({ mas, doi_chung: doiChung }));
const maGoi = (i) => ca.goiApi[i].ids.map((x) => String(x).replace(/_0$/, ""));
const dongCollector = () => ca.nhanCollector.flatMap((n) => n.body?.dong ?? []);
/** Băm cả cây HOME giả (cấu hình OpenClaw, tệp phiên) — đổi một byte là băm đổi. */
function bamCay(goc) {
  const h = crypto.createHash("sha256");
  const di = (d) => { for (const t of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const p = path.join(d, t.name); h.update(p.slice(goc.length));
    if (t.isDirectory()) di(p); else h.update(fs.readFileSync(p));
  } };
  di(goc);
  return h.digest("hex");
}
/** Mọi chữ bộ tra để lại ngoài collector: tệp trong thư mục việc + log. */
const chuDeLai = () => [...fs.readdirSync(ca.dir).map((t) => fs.readFileSync(tep(t), "utf8")), ...ca.logs].join("\n");

beforeEach(async () => {
  const goc = fs.mkdtempSync(path.join(os.tmpdir(), "lnb-th-"));
  const dir = path.join(goc, "viec");
  const home = path.join(goc, "home");
  fs.mkdirSync(dir); fs.mkdirSync(path.join(home, ".openclaw"), { recursive: true });
  // Cấu hình OpenClaw và tệp phiên giả trong HOME giả — bộ tra không được chạm.
  fs.writeFileSync(path.join(home, ".openclaw", "openclaw.json"), JSON.stringify({ channels: { kenh: { enabled: true } } }));
  fs.mkdirSync(path.join(home, ".openclaw", "credentials"), { recursive: true });
  fs.writeFileSync(path.join(home, ".openclaw", "credentials", "phien.json"), JSON.stringify({ cookie: "PHIEN-CANARY" }));
  let maCol = 202;
  const col = await khoiCollector(() => maCol);
  ca = {
    dir, home, logs: [], goiApi: [], truyCap: [], goiCam: [], goiMonitor: [], nhanCollector: col.nhan, server: col.server,
    nghe: [], ngheDung: 0, layApi: 0, kenhGoc: [], datCollector: (m) => { maCol = m; },
    traLoi: async (ids) => quaThuVien(phanHoiDung(hoSo(ids))), api: undefined,
  };
  ca.api = taoApi();
  process.env.HOME = home;
  process.env.S03_LOOKUP_DIR = dir;
  process.env.S03_COLLECTOR_URL = col.url;
  process.env.S03_COLLECTOR_KEY = "khoa-thu";
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "setTimeout", "clearTimeout", "Date"] });
  vi.setSystemTime(KHUNG);
});

afterEach(async () => {
  vi.useRealTimers();
  await new Promise((r) => ca.server.close(() => r()));
  fs.rmSync(path.dirname(ca.dir), { recursive: true, force: true });
  vi.doUnmock(MOD_KENH);
  vi.resetModules();
});

// ═════════════════════════════ E1 — AC-1 ═════════════════════════════
describe("[E1] AC-1 bộ tra qua đường khởi động Provider thật", () => {
  it("[E1] module kênh THẬT có hàm lấy API bộ nghe tin đang nối mà bộ tra dùng (đối chứng: module nạp được, có start…Listener)", async () => {
    await napModule(); // nạp qua bản giả để lấy danh sách khoá xuất của module thật (importOriginal)
    expect(ca.kenhGoc.some((k) => /^start\w+Listener$/.test(k)), "đối chứng: đọc được khoá xuất của module kênh thật").toBe(true);
    expect(ca.kenhGoc.includes(HAM_LAY_API),
      "module kênh thật phải xuất hàm lấy API mà bộ tra gọi khi chạy thật — thiếu thì mỗi vòng ném lỗi, bộ tra không bao giờ gọi").toBe(true);
  });

  it("[E1] Provider khởi hai lần → đúng một vòng hẹn giờ (đối chứng: vòng đó ra thêm đúng 1 lời ở chu kỳ kế)", async () => {
    const { provider } = await napModule();
    ghi("luot-lon.txt", "bat");
    yeuCau(MA(3));
    await khoiProvider(provider);
    await khoiProvider(provider);
    await choChay(60_000);
    expect(ca.goiApi.length, "một chu kỳ 60 giây sau hai lần khởi Provider: đúng 1 lời (hai vòng sẽ ra 2)").toBe(1);
    yeuCau(MA(3, 2000));
    await choChay(60_000);
    expect(ca.goiApi.length, "đối chứng: vòng duy nhất vẫn sống, chu kỳ kế ra thêm đúng 1 lời").toBe(2);
  });

  it("[E1] bộ nghe tin khởi động lại hai lần → vẫn một vòng; mốc lời cuối đọc lại từ đĩa (đối chứng: mốc đủ cũ thì gọi)", async () => {
    const { provider } = await napModule();
    ghi("luot-lon.txt", "bat");
    for (let i = 0; i < 2; i++) { // khởi rồi huỷ Provider như khi bộ nghe tin nối lại
      const ac = new AbortController();
      await khoiProvider(provider, { abortSignal: ac.signal });
      ac.abort();
    }
    await khoiProvider(provider);
    yeuCau(MA(3));
    ghi("moc-60s.txt", String(Date.now() + 60_000 - 30_000)); // lời trước (của lần nối cũ) 30 giây trước chu kỳ kế
    await choChay(60_000);
    expect(ca.goiApi.length, "mốc trên đĩa mới 30 giây: 0 lời (cách lời trước ≥ 60 giây tính qua khởi động lại)").toBe(0);
    await choChay(60_000);
    expect(ca.goiApi.length, "đối chứng: chu kỳ kế (mốc đã 90 giây) ra đúng 1 lời — một vòng").toBe(1);
  });

  it("[E1] mỗi lời ≤ 20 mã người bán (cộng tối đa 2 mã đối chứng)", async () => {
    const { provider } = await napModule();
    yeuCau(MA(25));
    await khoiProvider(provider);
    await choChay(60_000);
    expect(ca.goiApi.length, "đối chứng: lượt thử ra đúng 1 lời").toBe(1);
    const goi = maGoi(0);
    expect(goi.filter((m) => !DC.includes(m)).length, "≤ 20 mã người bán mỗi lời").toBeLessThanOrEqual(20);
    expect(goi.filter((m) => DC.includes(m)).length, "2 mã đối chứng đi cùng lời").toBe(2);
  });

  it("[E1] 21 mã → 2 lời cách nhau ≥ 60 giây, đủ 21 mã", async () => {
    const { provider } = await napModule();
    ghi("luot-lon.txt", "bat");
    yeuCau(MA(21));
    await khoiProvider(provider);
    for (let i = 0; i < 3; i++) await choChay(60_000);
    expect(ca.goiApi.length, "21 mã cần đúng 2 lời").toBe(2);
    const da = new Set([...maGoi(0), ...maGoi(1)].filter((m) => !DC.includes(m)));
    expect(da.size, "hai lời phủ đủ 21 mã").toBe(21);
    expect(ca.goiApi[1].luc - ca.goiApi[0].luc, "hai lời cách nhau ≥ 60 giây").toBeGreaterThanOrEqual(60_000);
  });

  it("[E1] lời thứ 31 trong ngày bằng 0 (đối chứng: lời thứ 30 vẫn đi)", async () => {
    const { provider } = await napModule();
    ghi("luot-lon.txt", "bat");
    yeuCau(MA(3));
    ghi(`dem-${NGAY_VN}.txt`, "30");
    await khoiProvider(provider);
    await choChay(60_000);
    expect(ca.goiApi.length, "đã 30 lời trong ngày VN: lời 31 bằng 0").toBe(0);
    ghi(`dem-${NGAY_VN}.txt`, "29");
    await choChay(60_000);
    expect(ca.goiApi.length, "đối chứng: mới 29 lời thì lời 30 đi").toBe(1);
  });

  it("[E1] ngoài 01:00–05:00 giờ VN bằng 0 (đối chứng: trong khung thì gọi)", async () => {
    const { provider } = await napModule();
    vi.setSystemTime(NGOAI_KHUNG);
    yeuCau(MA(3));
    await khoiProvider(provider);
    await choChay(60_000);
    expect(ca.goiApi.length, "06:00 giờ VN: 0 lời").toBe(0);
    vi.setSystemTime(KHUNG);
    await choChay(60_000);
    expect(ca.goiApi.length, "đối chứng: 02:00 giờ VN cùng tệp yêu cầu thì 1 lời").toBe(1);
  });

  it("[E1] ghép theo userId của hồ sơ trả về (khoá có _0), đúng bốn loại kết quả", async () => {
    const { provider } = await napModule();
    const mas = ["1001", "1002", "1003", "1004", "1005"];
    ca.traLoi = async (ids) => quaThuVien(phanHoiDung(hoSo(ids, {
      1002: { userId: "1002", username: "", phoneNumber: PII[0] },
      1003: { userId: "7777", username: "u-lech" }, // userId khác khoá
      1005: undefined, // không trả
    }, ["1004"]))); // nhóm không đổi
    yeuCau(mas);
    await khoiProvider(provider);
    await choChay(60_000);
    const loai = Object.fromEntries(dongCollector().map((d) => [d.ma_tai_khoan, [d.loai, d.username]]));
    expect(loai, "bốn loại theo userId: có username, không username, không rõ (lệch userId hay nhóm không đổi), không tìm thấy").toEqual({
      1001: ["co-username", "u1001"], 1002: ["khong-username", ""], 1003: ["khong-ro", ""], 1004: ["khong-ro", ""],
      1005: ["khong-tim-thay", ""],
    });
  });

  it("[E1] hằng trần trong mã ≥ sàn hợp đồng", async () => {
    const { tra } = await napModule();
    const T = tra.TRAN;
    expect([T.maMoiLoi <= 20, T.giayGiuaLoi >= 60, T.loiMoiNgay <= 30, T.treMs <= 15_000, T.khungBatDauGio >= 1, T.khungKetThucGio <= 5],
      "≤20 mã/lời, ≥60 giây giữa hai lời, ≤30 lời/ngày, ≤15 giây chờ, khung trong 01:00–05:00").toEqual([true, true, true, true, true, true]);
  });

  describe("[E1] should-NOT-fire: 0 lời gọi, 0 đăng nhập, băm HOME không đổi", () => {
    const CA = [
      ["không có bộ nghe tin đang nối", () => { ca.api = undefined; yeuCau(MA(3)); }, "khong-co-phien"],
      ["bộ nhớ đệm API trống (hàm lấy API trả rỗng)", () => { ca.api = null; yeuCau(MA(3)); }, "khong-co-phien"],
      ["không có tệp yêu cầu", () => {}, null],
      ["tệp yêu cầu rỗng", () => ghi("yeu-cau.json", ""), null],
      ["tệp yêu cầu sai khuôn", () => ghi("yeu-cau.json", "{\"mas\":[\"12a\"]}"), "sai-khuon-yeu-cau"],
    ];
    for (const [ten, dung, chan] of CA) {
      it(`[E1] ${ten}`, async () => {
        const { provider } = await napModule();
        dung();
        const bam = bamCay(ca.home);
        await khoiProvider(provider);
        await choChay(60_000);
        expect(ca.goiApi.length, "0 lời getUserInfo").toBe(0);
        expect(ca.goiCam, "0 lời đăng nhập, tạo client, hàm bọc hay API khác").toEqual([]);
        expect(bamCay(ca.home), "băm HOME (cấu hình OpenClaw, tệp phiên) không đổi").toBe(bam);
        if (chan) expect(doc("chan.txt")?.trim(), `tệp chặn ${chan}`).toBe(chan);
        // Đối chứng trên cùng thư mục: điều kiện đủ thì bộ tra gọi.
        ca.api = taoApi(); xoa("chan.txt"); yeuCau(MA(3));
        await choChay(60_000);
        expect(ca.goiApi.length, "đối chứng: đủ bộ nghe tin và tệp yêu cầu thì 1 lời").toBe(1);
      });
    }
  });
});

// ═════════════════════════════ E2 — AC-2 ═════════════════════════════
describe("[E2] AC-2 lỗi kênh: dừng cả lượt, không thử lại, tệp chặn chỉ có mã lý do", () => {
  const CANARY = "LOI-THO-CANARY";
  const LOI = [
    ["HTTP 401", () => new Response("", { status: 401 })],
    ["HTTP 429", () => new Response("", { status: 429 })],
    ["lỗi máy chủ (error_code)", () => new Response(JSON.stringify({ error_code: 105, error_message: `${CANARY} server` }), { status: 200 })],
    ["giới hạn tần suất (error_code)", () => new Response(JSON.stringify({ error_code: 221, error_message: `${CANARY} too many requests` }), { status: 200 })],
    ["lỗi lạ (thân không phải JSON)", () => new Response(`<html>${CANARY}</html>`, { status: 200 })],
  ];
  for (const [ten, phanHoi] of LOI) {
    it(`[E2] ${ten}: dừng sau đúng lời gây lỗi, 0 thử lại; xoá tệp chặn thì chạy lại được`, async () => {
      const { provider } = await napModule();
      ghi("luot-lon.txt", "bat");
      ca.traLoi = async () => quaThuVien(phanHoi());
      yeuCau(MA(3));
      await khoiProvider(provider);
      await choChay(60_000);
      expect(ca.goiApi.length, "đúng 1 lời gây lỗi").toBe(1);
      const chan = doc("chan.txt");
      expect(KHUON_CHAN(chan), `tệp chặn chỉ một mã lý do trong bảng runtime-map (kèm mã số): «${String(chan).slice(0, 40)}»`).toBe(true);
      expect(chuDeLai().includes(CANARY), "không chép thông điệp thô của lỗi vào tệp chặn hay log").toBe(false);
      await choChay(60_000);
      await choChay(60_000);
      expect(ca.goiApi.length, "tệp chặn còn: 0 lời thêm, không thử lại").toBe(1);
      ca.traLoi = async (ids) => quaThuVien(phanHoiDung(hoSo(ids)));
      xoa("chan.txt");
      await choChay(60_000);
      expect(ca.goiApi.length, "đối chứng: xoá tệp chặn thì chạy lại được").toBe(2);
    });
  }

  it("[E2] lời không trả: tệp chặn trong 15 giây + ε, 0 lời kế, kết quả về muộn bị bỏ", async () => {
    const { provider } = await napModule();
    ghi("luot-lon.txt", "bat");
    let traMuon;
    ca.traLoi = (ids) => new Promise((r) => { traMuon = () => r(quaThuVien(phanHoiDung(hoSo(ids)))); });
    yeuCau(MA(3));
    await khoiProvider(provider);
    await choChay(60_000);
    expect(ca.goiApi.length, "lời đã đi").toBe(1);
    expect(doc("chan.txt"), "chưa tới 15 giây thì chưa chặn").toBe(null);
    await choChay(15_000 + 500);
    expect(KHUON_CHAN(doc("chan.txt")) && /^het-15s/.test(doc("chan.txt")), "tệp chặn het-15s trong 15 giây + ε").toBe(true);
    traMuon();
    await choChay(60_000);
    expect(dongCollector().length + (doc("spool-ho-so.jsonl") ?? "").trim().length, "kết quả về muộn: 0 dòng tới collector hay spool").toBe(0);
    expect(ca.goiApi.length, "0 lời kế").toBe(1);
  });

  it("[E2] bộ nghe tin báo lỗi qua monitor thật 10 giây sau lời 1 → lời 2 bằng 0, chặn listener-dong-sau-goi, in dung-goi-Manh", async () => {
    const { provider } = await napModule();
    ghi("luot-lon.txt", "bat");
    const p = await khoiProviderDayDu(provider);
    yeuCau(MA(3));
    await choChay(60_000);
    expect(ca.goiApi.length, "đối chứng: lời 1 đã đi qua Provider đầy đủ").toBe(1);
    await choChay(10_000);
    p.nghe.onError(new Error("kenh listener closed (3003): KICKOUT"));
    yeuCau(MA(3, 2000));
    await choChay(60_000);
    expect(ca.goiApi.length, "lời 2 bằng 0").toBe(1);
    expect(doc("chan.txt")?.trim(), "tệp chặn listener-dong-sau-goi").toBe("listener-dong-sau-goi");
    expect(ca.logs.some((l) => /dung-goi-Manh/.test(l)), "log in dung-goi-Manh").toBe(true);
  });

  it("[E2] đóng rồi nối lại khi KHÔNG còn tệp yêu cầu → vẫn chặn listener-dong-sau-goi", async () => {
    const { provider } = await napModule();
    const p = await khoiProviderDayDu(provider);
    yeuCau(MA(3));
    await choChay(60_000);
    expect(ca.goiApi.length, "đối chứng: lượt thử đã gọi").toBe(1);
    await choChay(5 * 60_000);
    p.nghe.onError(new Error("kenh listener closed (3003): KICKOUT"));
    await p.chay;
    await khoiProviderDayDu(provider); // nối lại — API lại có
    xoa("yeu-cau.json"); xoa("yeu-cau.da-xu.json");
    await choChay(60_000);
    expect(doc("chan.txt")?.trim(), "đóng trong 30 phút sau lời rồi nối lại, không còn yêu cầu: vẫn tệp chặn").toBe("listener-dong-sau-goi");
  });

  it("[E2] sự kiện đóng quá 30 phút sau lời → không chặn (đối chứng: trong 30 phút thì chặn)", async () => {
    const { provider } = await napModule();
    const p = await khoiProviderDayDu(provider);
    yeuCau(MA(3));
    await choChay(60_000);
    expect(ca.goiApi.length, "lời đã đi").toBe(1);
    await choChay(31 * 60_000);
    p.nghe.onError(new Error("kenh listener closed (3003): KICKOUT"));
    await p.chay;
    const p2 = await khoiProviderDayDu(provider);
    await choChay(60_000);
    expect(doc("chan.txt"), "đóng 31 phút sau lời: không chặn").toBe(null);
    // Đối chứng trên cùng thư mục: lời mới (lượt lớn), đóng 1 phút sau lời đó → chặn.
    ghi("luot-lon.txt", "Manh-bat-09-11");
    yeuCau(MA(3, 2000));
    await choChay(60_000);
    expect(ca.goiApi.length, "đối chứng: lời mới đã đi").toBe(2);
    await choChay(60_000);
    p2.nghe.onError(new Error("kenh listener closed (3003): KICKOUT"));
    await p2.chay;
    await khoiProviderDayDu(provider);
    await choChay(60_000);
    expect(doc("chan.txt")?.trim(), "đối chứng: đóng 1 phút sau lời thì chặn listener-dong-sau-goi").toBe("listener-dong-sau-goi");
  });

  it("[E2] bộ tra lỗi không đóng hay khởi lại bộ nghe tin; handler vẫn nhận tin", async () => {
    const { provider } = await napModule();
    const p = await khoiProviderDayDu(provider);
    ca.traLoi = async () => quaThuVien(new Response("", { status: 429 }));
    yeuCau(MA(3));
    await choChay(60_000);
    expect(ca.goiApi.length, "lời gây lỗi đã đi").toBe(1);
    expect(KHUON_CHAN(doc("chan.txt")), "đối chứng: bộ tra đã dừng vì lỗi (có tệp chặn)").toBe(true);
    const truoc = p.trangThai.filter((s) => s && "lastInboundAt" in s).length;
    await p.nghe.onMessage({ data: { testNormalizedMessage: null } }).catch(() => undefined);
    expect(p.trangThai.filter((s) => s && "lastInboundAt" in s).length, "handler của monitor vẫn nhận tin sau lỗi").toBe(truoc + 1);
    expect(ca.ngheDung, "bộ tra không đóng bộ nghe tin").toBe(0);
    expect(ca.nghe.length, "bộ tra không khởi lại bộ nghe tin").toBe(1);
  });
});

// ═════════════════════════════ E3 — AC-3 ═════════════════════════════
describe("[E3] AC-3 lượt thử mặc định, đối chứng, lượt lớn", () => {
  it("[E3] mặc định là thử: đúng 1 lời ≤ 20 + 2 mã, có dấu đã thử, không chạy lần hai khi dấu còn; đầu ra chỉ số đếm", async () => {
    const { provider } = await napModule();
    yeuCau(MA(25));
    await khoiProvider(provider);
    await choChay(60_000);
    expect(ca.goiApi.length, "đúng 1 lời").toBe(1);
    expect(maGoi(0).length, "≤ 20 + 2 mã").toBeLessThanOrEqual(22);
    expect(doc("da-thu.txt") !== null, "có dấu đã thử").toBe(true);
    yeuCau(MA(5, 3000));
    await choChay(60_000);
    await choChay(60_000);
    expect(ca.goiApi.length, "dấu còn: 0 lời lần hai").toBe(1);
    expect(dongCollector().some((d) => d.username === "u1000"), "đối chứng: username có trong dữ liệu chảy về collector").toBe(true);
    const dong = ca.logs.filter((l) => /seller-lookup/.test(l));
    expect(dong.length, "có dòng số đếm").toBeGreaterThan(0);
    const KHUON = /^\[seller-lookup\] loi_goi=\d+ co-username=\d+ khong-username=\d+ khong-ro=\d+ khong-tim-thay=\d+( doi_chung=[a-z,-]+)?( chan=[a-z0-9 -]+)?$/;
    expect(dong.filter((l) => !KHUON.test(l)), "mọi dòng log chỉ số đếm bốn loại và kết quả đối chứng").toEqual([]);
    const dauRa = [...ca.logs, doc("chan.txt") ?? "", doc("da-thu.txt") ?? ""].join("\n");
    expect(dauRa.match(/\bu\d{4}\b|PII-|\+84\d+/g), "không username hay chuỗi đánh dấu trong đầu ra (log, tệp chặn, dấu đã thử)").toBe(null);
  });

  const DOI_CHUNG_SAI = [
    ["mã đối chứng không tìm thấy", { 9001: undefined }],
    ["userId của đối chứng lệch mã gửi", { 9001: { userId: "5555", username: "x" } }],
  ];
  for (const [ten, dac] of DOI_CHUNG_SAI) {
    it(`[E3] ${ten} → tệp chặn khac-khong-gian-ma (đối chứng: đối chứng đúng thì không chặn)`, async () => {
      const { provider } = await napModule();
      ghi("luot-lon.txt", "bat");
      yeuCau(MA(3));
      await khoiProvider(provider);
      await choChay(60_000);
      expect(doc("chan.txt"), "đối chứng: đối chứng đúng thì không chặn").toBe(null);
      ca.traLoi = async (ids) => quaThuVien(phanHoiDung(hoSo(ids, dac)));
      yeuCau(MA(3, 2000));
      await choChay(60_000);
      expect(doc("chan.txt")?.trim(), "tệp chặn khac-khong-gian-ma").toBe("khac-khong-gian-ma");
    });
  }

  const KHONG_LUOT_LON = [["không có tệp điều khiển", null], ["tệp điều khiển rỗng", ""], ["tệp điều khiển chỉ khoảng trắng", "  \n"]];
  for (const [ten, noiDung] of KHONG_LUOT_LON) {
    it(`[E3] ${ten} → không vào lượt lớn (đối chứng: có giá trị người đặt thì vào)`, async () => {
      const { provider } = await napModule();
      if (noiDung !== null) ghi("luot-lon.txt", noiDung);
      yeuCau(MA(3));
      await khoiProvider(provider);
      await choChay(60_000);
      yeuCau(MA(3, 2000));
      await choChay(60_000);
      expect(ca.goiApi.length, "chỉ lượt thử: 1 lời").toBe(1);
      ghi("luot-lon.txt", "Manh-bat-09-11");
      await choChay(60_000);
      expect(ca.goiApi.length, "đối chứng: người đặt giá trị thì lượt lớn chạy tiếp").toBe(2);
    });
  }

  it("[E3] lượt lớn: mỗi tệp yêu cầu xử một lần (đổi tên đã xử, nhịp sau 0 lời) và giữ trần ≤ 20 mã", async () => {
    const { provider } = await napModule();
    ghi("luot-lon.txt", "Manh-bat-09-11");
    yeuCau(MA(20));
    await khoiProvider(provider);
    await choChay(60_000);
    expect(ca.goiApi.length, "đối chứng: lượt lớn gọi").toBe(1);
    expect([doc("yeu-cau.json"), doc("yeu-cau.da-xu.json") !== null], "tệp yêu cầu đã đổi tên đã xử").toEqual([null, true]);
    await choChay(60_000);
    expect(ca.goiApi.length, "nhịp sau, không có tệp mới: 0 lời").toBe(1);
    expect(maGoi(0).filter((m) => !DC.includes(m)).length, "trần ≤ 20 mã").toBeLessThanOrEqual(20);
  });
});

// ═════════════════════════════ E4 — AC-4 ═════════════════════════════
describe("[E4] AC-4 ranh giới lời gọi và trường giữ lại", () => {
  // TypeScript có API JS (5.x) của kho onehub — cây OpenClaw dùng bản native không có createSourceFile.
  const ts = createRequire(path.join(ROOT, "app", "x.js"))("typescript");
  const cay = (ten, nguon) => ts.createSourceFile(ten, nguon, ts.ScriptTarget.Latest, true);
  const goiThuocTinh = (sf) => {
    const ra = [];
    const di = (n) => { if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)) ra.push(n.expression.name.text); ts.forEachChild(n, di); };
    di(sf);
    return ra;
  };
  const dinhDanh = (sf) => {
    const ra = new Set();
    const di = (n) => { if (ts.isIdentifier(n)) ra.add(n.text); ts.forEachChild(n, di); };
    di(sf);
    return ra;
  };
  const nenMonitor = () => {
    const tuongDoi = fs.readFileSync(PATCH, "utf8").match(/^\+\+\+ b\/(extensions\/[^/\s]+\/src\/monitor\.ts)$/m)?.[1];
    const r = spawnSync("git", ["-C", process.env.LNB_OPENCLAW_SRC, "show", `${process.env.LNB_NEN_SHA}:${tuongDoi}`], { encoding: "utf8" });
    if (r.status !== 0) throw new Error("không đọc được monitor.ts của nền");
    return r.stdout;
  };

  it("[E4] lời gọi API mới của diff extension chỉ có getUserInfo (đếm trên AST nền và bản vá, theo danh sách hàm API của thư viện)", () => {
    expect(HAM_API.size, "đối chứng: đọc được danh sách hàm API của thư viện").toBeGreaterThan(50);
    expect(HAM_API.has("getUserInfo"), "đối chứng: getUserInfo là hàm API của thư viện").toBe(true);
    const dem = (ds) => ds.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map());
    const truoc = dem(goiThuocTinh(cay("m.ts", nenMonitor())).filter((x) => HAM_API.has(x)));
    const sau = dem([...goiThuocTinh(cay("m.ts", NGUON_MON)), ...goiThuocTinh(cay("s.ts", NGUON_TRA))].filter((x) => HAM_API.has(x)));
    const them = [...sau].filter(([k, n]) => n > (truoc.get(k) ?? 0)).map(([k]) => k);
    expect(them, "lời gọi API mới duy nhất là getUserInfo").toEqual(["getUserInfo"]);
  });

  it("[E4] bộ tra không tham chiếu hàm bọc tự đăng nhập, login, loginQR, tạo client; không listen, createServer, route HTTP", () => {
    const id = [...dinhDanh(cay("s.ts", NGUON_TRA))];
    const cam = id.filter((x) => /^with\w+Api$|^login|QR|^create\w+$|^createServer$|^listen$|^new\w+Client$/i.test(x) && x !== HAM_LAY_API);
    expect(cam, "định danh bị cấm trong bộ tra").toEqual([]);
    const goiMon = goiThuocTinh(cay("m.ts", NGUON_MON));
    const goiNen = goiThuocTinh(cay("m.ts", nenMonitor()));
    const dem = (ds, x) => ds.filter((y) => y === x).length;
    expect(["listen", "createServer"].map((x) => dem(goiMon, x) - dem(goiNen, x)), "monitor không thêm listen hay createServer").toEqual([0, 0]);
  });

  it("[E4] chạy với API giả có bẫy: chỉ đọc getUserInfo; 0 hàm cấm; 0 máy chủ mới; HOME không đổi", async () => {
    const { provider } = await napModule();
    const lis = vi.spyOn(net.Server.prototype, "listen"); // mọi máy chủ (http, net) đều đi qua listen của net.Server
    const bam = bamCay(ca.home);
    yeuCau(MA(5));
    await khoiProvider(provider);
    await choChay(60_000);
    expect(ca.goiApi.length, "đối chứng: bộ tra đã gọi").toBe(1);
    expect([...new Set(ca.truyCap)], "thuộc tính API bị đọc: chỉ getUserInfo").toEqual(["getUserInfo"]);
    expect(ca.goiCam, "0 lời login, loginQR, tạo client, send*, reaction, typing, seen, delivered, friend, requestOldMessages").toEqual([]);
    expect(lis.mock.calls.length, "0 lần mở cổng nghe (listen, createServer, route HTTP mới)").toBe(0);
    expect(bamCay(ca.home), "băm cấu hình OpenClaw và tệp phiên không đổi").toBe(bam);
    lis.mockRestore();
  });

  it("[E4] marker bộ canh còn trong monitor dựng từ nền + .patch (đối chứng: nền có marker)", () => {
    const co = (s) => s.includes("pluginHooks") && s.includes("SuppressMessageReceivedHooks");
    expect(co(nenMonitor()), "đối chứng: monitor nền có marker bộ canh").toBe(true);
    expect(co(NGUON_MON), "monitor sau .patch giữ marker bộ canh").toBe(true);
  });

  it("[E4] monitor gọi khoiDongTuEnv đúng một lần trong đường khởi động Provider; import ở khối đầu; diff đủ ngữ cảnh", async () => {
    const sf = cay("m.ts", NGUON_MON);
    const loiGoi = [];
    const di = (n, ham) => {
      const ten = ts.isFunctionDeclaration(n) && n.name ? n.name.text : ham;
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === "khoiDongTuEnv") loiGoi.push(ten);
      ts.forEachChild(n, (c) => di(c, ten));
    };
    di(sf, null);
    expect(loiGoi.length, "đúng một lời GỌI khoiDongTuEnv trong monitor").toBe(1);
    expect(/^monitor\w+Provider$/.test(loiGoi[0] ?? ""), "lời gọi nằm trong hàm Provider").toBe(true);
    const cauLenh = sf.statements;
    const viTri = cauLenh.findIndex((s) => ts.isImportDeclaration(s) && /seller-lookup/.test(s.moduleSpecifier.text));
    expect(viTri >= 0 && cauLenh.slice(0, viTri).every((s) => ts.isImportDeclaration(s)), "import bộ tra nằm ở khối import đầu tệp").toBe(true);
    const khoi = fs.readFileSync(PATCH, "utf8").split(/^diff --git /m).find((k) => /\/src\/monitor\.ts/.test(k.split("\n")[0])) ?? "";
    const hunk = khoi.split(/^@@/m).slice(1);
    expect(hunk.length, "đối chứng: .patch có khối sửa monitor").toBeGreaterThan(0);
    expect(hunk.map((h) => h.split("\n").filter((l) => l.startsWith(" ")).length).every((n) => n >= 3), "mỗi hunk monitor có ≥ 3 dòng ngữ cảnh (không -U0)").toBe(true);
    // Lời gọi thật qua Provider: đếm bằng bọc hàm khi Provider khởi.
    vi.resetModules();
    let dem = 0;
    vi.doMock("./seller-lookup.js", async (io) => { const g = await io(); return { ...g, khoiDongTuEnv: (...a) => { dem++; return g.khoiDongTuEnv(...a); } }; });
    const { provider } = await napModule().catch(() => ({}));
    vi.doUnmock("./seller-lookup.js");
    if (provider) { await khoiProvider(provider); await khoiProvider(provider); }
    expect(dem, "mỗi lần Provider khởi gọi khoiDongTuEnv đúng một lần").toBe(2);
  });

  it("[E4] kết quả trong bộ nhớ sau khi nhận chỉ giữ userId, username: 0 trường PII ra collector, spool, tệp chặn, log", async () => {
    const { provider, tra } = await napModule();
    const kq = tra.phanLoai(hoSo(["1001"]), ["1001"]);
    expect(Object.keys(kq[0]).sort(), "đối tượng kết quả chỉ có mã, loại, username").toEqual(["loai", "ma", "username"]);
    ca.datCollector(503); // collector từ chối → spool cũng phải sạch
    yeuCau(MA(3));
    await khoiProvider(provider);
    await choChay(60_000);
    expect((doc("spool-ho-so.jsonl") ?? "").length, "đối chứng: lô đã vào spool").toBeGreaterThan(0);
    const tatCa = [chuDeLai(), JSON.stringify(ca.nhanCollector)].join("\n");
    expect(PII.filter((x) => tatCa.includes(x)), "0 chuỗi PII (SĐT, tên, ảnh, ngày sinh)").toEqual([]);
  });
});

// ═════════════════════════════ E9 — AC-9 ═════════════════════════════
describe("[E9] AC-9 tiền kiểm, phán lùi, tắt giữa lượt", () => {
  const thuMuc = () => path.join(ROOT, "collector", "openclaw", "tests", "link-nguoi-ban");
  const chayNode = (tep, args) => spawnSync(process.execPath, [path.join(thuMuc(), tep), ...args], { encoding: "utf8" });

  it("[E9] tiền kiểm: bản đúng qua; có tệp yêu cầu, có tệp lượt lớn, có lời gọi API mới ngoài getUserInfo → thoát khác 0, in không được khởi động lại", () => {
    const sach = fs.mkdtempSync(path.join(os.tmpdir(), "lnb-tk-"));
    try {
      const dung = chayNode("tien-kiem-ho-so.mjs", [sach, PATCH]);
      expect(dung.status, `đối chứng: bản đúng qua tiền kiểm (${(dung.stderr || dung.stdout).slice(0, 120)})`).toBe(0);
      const them = path.join(sach, "x.patch");
      const goc = fs.readFileSync(PATCH, "utf8");
      fs.writeFileSync(them, goc.replace(/(\+\s*const resp = await Promise\.race\(\[)/, "+    await api.sendMessage(\"x\", \"y\");\n$1"));
      const HONG = [
        ["có tệp yêu cầu", () => fs.writeFileSync(path.join(sach, "yeu-cau.json"), "{}"), PATCH],
        ["có tệp điều khiển lượt lớn", () => fs.writeFileSync(path.join(sach, "luot-lon.txt"), "bat"), PATCH],
        ["lời gọi API mới ngoài getUserInfo", () => {}, them],
      ];
      for (const [ten, dat, patch] of HONG) {
        for (const t of ["yeu-cau.json", "luot-lon.txt"]) fs.rmSync(path.join(sach, t), { force: true });
        dat();
        const r = chayNode("tien-kiem-ho-so.mjs", [sach, patch]);
        expect(r.status, `${ten}: thoát khác 0`).not.toBe(0);
        expect(/không được khởi động lại/i.test(r.stdout + r.stderr), `${ten}: in «không được khởi động lại»`).toBe(true);
      }
      expect(goc !== fs.readFileSync(them, "utf8"), "đối chứng: bản .patch hỏng thật sự có thêm lời gọi").toBe(true);
    } finally { fs.rmSync(sach, { recursive: true, force: true }); }
  });

  it("[E9] lệnh đo trước–sau có trong kho và in dòng đóng bộ nghe tin, PID gateway, số post 202 trong 30 phút", () => {
    const ung = [path.join(ROOT, "collector", "openclaw", "tests", "link-nguoi-ban"), path.join(ROOT, "scripts")]
      .flatMap((d) => (fs.existsSync(d) ? fs.readdirSync(d).map((t) => path.join(d, t)) : []))
      .filter((p) => /truoc-sau|do-sau/.test(path.basename(p)));
    expect(ung.length, "THIẾU lệnh đo trước–sau (dòng đóng bộ nghe tin, PID gateway, số post 202 trong 30 phút)").toBeGreaterThan(0);
  });

  it("[E9] phán lùi đọc dòng đóng bộ nghe tin đúng khuôn log gateway thật (đối chứng: log thật trên máy có dòng ấy)", async () => {
    const mod = await import(/* @vite-ignore */ path.join(thuMuc(), "phai-lui-ho-so.mjs"));
    const that = path.join(os.homedir(), "Library", "Logs", "openclaw", "gateway.log");
    const HOME_THAT = process.env.LNB_HOME_THAT;
    const logThat = path.join(HOME_THAT ?? "", "Library", "Logs", "openclaw", "gateway.log");
    const p = fs.existsSync(logThat) ? logThat : that;
    expect(fs.existsSync(p), "đối chứng: có gateway.log thật trên máy").toBe(true);
    const dongThat = fs.readFileSync(p, "utf8").split("\n").filter((l) => /listener (closed|error)/.test(l));
    expect(dongThat.length, "đối chứng: log thật có dòng đóng bộ nghe tin").toBeGreaterThan(0);
    expect(mod.docDongDongListener(dongThat.join("\n")).length, "phán lùi đọc được mọi dòng đóng bộ nghe tin của log thật").toBe(dongThat.length);
  });

  it("[E9] phán lùi: đóng 20 giây sau lời → dung-goi-Manh (kể cả dạng giống 26/10); log không có lời gọi thì không lùi theo luật này", async () => {
    const mod = await import(/* @vite-ignore */ path.join(thuMuc(), "phai-lui-ho-so.mjs"));
    // Dòng log do monitor thật ghi (runtime.error) khi bộ nghe tin báo lỗi, gắn tiền tố thời gian theo khuôn log gateway.
    const { provider } = await napModule();
    const pr = await khoiProviderDayDu(provider);
    pr.nghe.onError(new Error("kenh listener closed (3003): KICKOUT_BY_WORKER"));
    await pr.chay;
    const dongMon = ca.logs.find((l) => /listener error/.test(l));
    expect(dongMon, "đối chứng: monitor thật ghi dòng listener error").toBeTruthy();
    const moc = Date.now();
    const vn = (t) => new Date(t + 7 * 3600_000).toISOString().replace("Z", "+07:00");
    const log = `${vn(moc + 20_000)} [kenh] [default] ${dongMon}\n`;
    expect(mod.phanLuiHoSo(moc, mod.docDongDongListener(log), moc + 60_000).phan, "đóng 20 giây sau lời: dung-goi-Manh").toBe("dung-goi-Manh");
    expect(mod.phanLuiHoSo(null, mod.docDongDongListener(log), moc + 60_000).phan, "không có lời gọi: luật này không phán").toBe("khong-phai-luat-nay");
  });

  const TAT = [
    ["đặt tệp chặn sau lời 1", () => ghi("chan.txt", "khong-co-phien")],
    ["xoá tệp yêu cầu sau lời 1", () => { xoa("yeu-cau.json"); }],
  ];
  for (const [ten, tat] of TAT) {
    it(`[E9] lượt 3 lời, ${ten} → lời 2, 3 bằng 0 (đối chứng: không tắt thì đủ 3 lời)`, async () => {
      const { provider } = await napModule();
      ghi("luot-lon.txt", "Manh-bat-09-11");
      await khoiProvider(provider);
      const lam = async (tatSau1) => {
        const dau = ca.goiApi.length;
        for (let i = 0; i < 3; i++) {
          if (!(tatSau1 && i > 0)) yeuCau(MA(3, 4000 + 10 * (dau + i)));
          await choChay(60_000);
          if (tatSau1 && i === 0) tat();
        }
        return ca.goiApi.length - dau;
      };
      expect(await lam(false), "đối chứng: không tắt thì 3 lời").toBe(3);
      xoa("chan.txt");
      expect(await lam(true), `${ten}: chỉ lời 1`).toBe(1);
    });
  }

  it("[E9] đường tắt trong runbook không có lệnh khởi động lại", () => {
    const rb = fs.readFileSync(path.join(ROOT, "docs", "ops", "runbook-openclaw-hook.md"), "utf8");
    const tat = (rb.split("## Bộ tra hồ sơ người bán S03")[1] ?? "").match(/\*\*Tắt:\*\*[^\n]*(\n(?!\n)[^\n]*)*/)?.[0] ?? "";
    expect(tat.length, "đối chứng: runbook có mục Tắt của bộ tra").toBeGreaterThan(0);
    expect(/launchctl|kickstart|systemctl|pkill|kill\s|gateway (re)?start|openclaw .*restart/i.test(tat), "mục Tắt không có lệnh khởi động lại").toBe(false);
  });
});
