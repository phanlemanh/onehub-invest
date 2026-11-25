/**
 * PB3 (data-api-dong-khi-thieu-khoa) — data-api đóng khi thiếu khoá.
 *
 * Luật (design.md §2): chỉ NODE_ENV = development hoặc test, không có VERCEL, mới được chạy không khoá. Mọi môi trường
 * khác thiếu DATA_API_KEYS thì mọi đường dữ liệu trả 503 AUTH_NOT_CONFIGURED, không truy vấn DB, và bản Node không khởi
 * động.
 *
 * Chạy trên DB thử (db/db-thu.sh oneinvest_suite_<bộ> --chay …). Danh sách đường đọc thẳng từ bảng route của app, không
 * kê tay. Module auth nạp bằng import động để bản auth.ts cũ (không có hằng thông điệp) vẫn nạp được tệp này — probe
 * pha.mjs cần tên ca đỏ chứ không cần lỗi nạp.
 */
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import net from "node:net";
import path from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const url = process.env.DATABASE_URL ?? "";
const tenDb = url.split("?")[0].split("/").pop() ?? "";
if (!tenDb.includes("_suite_")) {
  throw new Error(`PB3 từ chối chạy: DATABASE_URL phải trỏ DB thử oneinvest_suite_* (đang là «${tenDb || "trống"}»)`);
}

// ── Môi trường: gán từng ca, trả lại nguyên trạng cuối lượt ──────────────────────────────────────────────────────────
const KHOA_ENV = ["NODE_ENV", "VERCEL", "DATA_API_KEYS", "DATA_API_KEYS_BACKUP"] as const;
type EnvCa = Partial<Record<(typeof KHOA_ENV)[number], string>>;
const ENV_GOC: EnvCa = Object.fromEntries(KHOA_ENV.map((k) => [k, process.env[k]]));
function datEnv(e: EnvCa) {
  for (const k of KHOA_ENV) {
    const v = e[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}
// Nạp module ở môi trường mở, không khoá — bản auth.ts cũ chốt biến lúc nạp, nên bản cũ sẽ «mở» suốt lượt (chiều đỏ).
datEnv({ NODE_ENV: "test" });

const { pool } = await import("../src/db/client.js");
const { default: app } = await import("../src/app.js");
const authMod = (await import("../src/middleware/auth.js")) as Record<string, unknown>;
const THONG_DIEP = typeof authMod.MISSING_KEYS_MESSAGE === "string" ? authMod.MISSING_KEYS_MESSAGE : null;

// ── Bộ đếm truy vấn DB ────────────────────────────────────────────────────────────────────────────────────────────
let soTruyVan = 0;
const queryGoc = pool.query.bind(pool);
(pool as unknown as { query: (...a: unknown[]) => unknown }).query = (...a: unknown[]) => {
  soTruyVan += 1;
  return (queryGoc as (...b: unknown[]) => unknown)(...a);
};

// ── Chuỗi canh của AC-6: mọi thân trả về, stdout, stderr gom lại để soát ────────────────────────────────────────────
const CANH = `CANH-KHOA-PB3-${randomUUID()}`;
const gom: { noi: string; vanBan: string }[] = [];

async function goi(duong: string, headers: Record<string, string> = {}) {
  const res = await app.request(duong, { headers });
  const vanBan = await res.text();
  gom.push({ noi: `thân ${duong}`, vanBan });
  let than: Record<string, unknown> | null = null;
  try {
    than = JSON.parse(vanBan) as Record<string, unknown>;
  } catch {
    than = null;
  }
  return { status: res.status, than };
}

// ── Danh sách đường /v1 đọc từ bảng route của app ────────────────────────────────────────────────────────────────
const DUONG_V1 = [
  ...new Set(
    app.routes
      .filter((r) => r.method === "GET" && r.path.startsWith("/v1"))
      .map((r) => r.path.replace(/\/:[^/]+/g, "/mau")),
  ),
];

const MOI_TRUONG_DONG: { ten: string; env: EnvCa }[] = [
  { ten: "production", env: { NODE_ENV: "production" } },
  { ten: "NODE_ENV vắng", env: {} },
  { ten: "staging", env: { NODE_ENV: "staging" } },
  { ten: "development+VERCEL", env: { NODE_ENV: "development", VERCEL: "1" } },
  { ten: "test+VERCEL", env: { NODE_ENV: "test", VERCEL: "1" } },
];
const KHOA_RONG: { ten: string; v: string | undefined }[] = [
  { ten: "biến vắng", v: undefined },
  { ten: "chuỗi rỗng", v: "" },
  { ten: "chỉ dấu phẩy", v: " , ," },
];

function laLoiDong(than: Record<string, unknown> | null): boolean {
  const e = than?.error as { code?: unknown; message?: unknown } | undefined;
  return e?.code === "AUTH_NOT_CONFIGURED" && typeof e.message === "string" && e.message.length > 0;
}

after(async () => {
  datEnv(ENV_GOC);
  await pool.end();
});

test("PB3-AC-1 môi trường đóng, khoá rỗng → 503", async () => {
  console.log(`PB3 đường /v1 đếm được: ${DUONG_V1.length}`);
  assert.ok(DUONG_V1.length > 5, `PB3 chỉ đếm được ${DUONG_V1.length} đường /v1, mong > 5 (thiếu đường chi tiết)`);

  const loi: string[] = [];
  let soAssert = 0;
  const truyVanTruoc = soTruyVan;
  for (const mt of MOI_TRUONG_DONG) {
    for (const kr of KHOA_RONG) {
      datEnv({ ...mt.env, DATA_API_KEYS: kr.v });
      const nhan = `${mt.ten}/${kr.ten}`;
      for (const duong of DUONG_V1) {
        for (const headers of [{}, { authorization: "Bearer khoa-gia-pb3" }]) {
          const r = await goi(duong, headers);
          soAssert += 1;
          if (r.status !== 503 || !laLoiDong(r.than)) {
            loi.push(`PB3 đóng: ${nhan}/${duong} trả ${r.status}, mong 503 AUTH_NOT_CONFIGURED`);
          }
        }
      }
      const h = await goi("/health");
      soAssert += 1;
      if (h.status !== 503 || h.than?.status !== "misconfigured") {
        loi.push(`PB3 đóng: ${nhan}//health trả ${h.status} ${String(h.than?.status)}, mong 503 misconfigured`);
      }
      const o = await goi("/openapi.json");
      soAssert += 1;
      if (o.status !== 200) loi.push(`PB3 đóng: ${nhan}//openapi.json trả ${o.status}, mong 200`);
    }
  }
  console.log(`PB3 số assert trạng thái: ${soAssert}`);
  assert.equal(soAssert, 15 * (2 * DUONG_V1.length + 2));
  const truyVanDong = soTruyVan - truyVanTruoc;
  if (truyVanDong !== 0) loi.push(`PB3 đóng mà vẫn truy vấn DB: ${truyVanDong}`);

  // Đường lạ dưới /v1 khi đóng: 503, không 404 (Review Focus 4 — ngoài phép đếm).
  datEnv({ NODE_ENV: "production" });
  const la = await goi("/v1/khong-co");
  if (la.status !== 503) loi.push(`PB3 đóng: production/biến vắng//v1/khong-co trả ${la.status}, mong 503`);

  // Đối chứng: bộ đếm truy vấn còn sống — môi trường mở gọi /v1/markets phải truy vấn.
  datEnv({ NODE_ENV: "test" });
  const truocMo = soTruyVan;
  await goi("/v1/markets");
  if (soTruyVan - truocMo <= 0) loi.push("PB3 bộ đếm truy vấn chết: môi trường mở /v1/markets không ghi truy vấn nào");

  assert.equal(loi.length, 0, loi.join(" | "));
});

test("PB3-AC-1b NODE_ENV viết hoa hay có khoảng trắng vẫn đóng", async () => {
  const loi: string[] = [];
  for (const ne of ["Development", " development", "TEST"]) {
    datEnv({ NODE_ENV: ne });
    const r = await goi("/v1/markets");
    if (r.status !== 503) loi.push(`PB3 đóng: NODE_ENV «${ne}» trả ${r.status}, mong 503`);
  }
  assert.equal(loi.length, 0, loi.join(" | "));
});

test("PB3-AC-2 môi trường mở, khoá rỗng → mở như cũ", async () => {
  const loi: string[] = [];
  for (const ne of ["development", "test"]) {
    datEnv({ NODE_ENV: ne });
    const r = await goi("/v1/markets");
    if (r.status !== 200) loi.push(`PB3 mở: ${ne} trả ${r.status}, mong 200`);
  }
  assert.equal(loi.length, 0, loi.join(" | "));
});

test("PB3-AC-3 có khoá → xác thực như cũ", async () => {
  const k1 = `${CANH}-mot`;
  const k2 = `${CANH}-hai`;
  const loi: string[] = [];
  for (const ne of ["production", "development"]) {
    datEnv({ NODE_ENV: ne, DATA_API_KEYS: ` ${k1} , ${k2} ` });
    const ca: [string, string, Record<string, string>, number][] = [
      ["không header", "/v1/markets", {}, 401],
      ["khoá sai", "/v1/markets", { authorization: "Bearer khoa-sai-pb3" }, 401],
      ["Bearer rỗng", "/v1/markets", { authorization: "Bearer " }, 401],
      ["Bearer khoá một", "/v1/markets", { authorization: `Bearer ${k1}` }, 200],
      ["X-API-Key khoá hai", "/v1/markets", { "x-api-key": k2 }, 200],
      ["/health không header", "/health", {}, 200],
      ["/openapi.json không header", "/openapi.json", {}, 200],
    ];
    for (const [ten, duong, headers, mong] of ca) {
      const r = await goi(duong, headers);
      if (r.status !== mong) loi.push(`PB3 có khoá: ${ne}/${ten} trả ${r.status}, mong ${mong}`);
      if (mong === 401 && (r.than?.error as { code?: unknown } | undefined)?.code !== "UNAUTHORIZED") {
        loi.push(`PB3 có khoá: ${ne}/${ten} thiếu mã UNAUTHORIZED`);
      }
    }
  }
  assert.equal(loi.length, 0, loi.join(" | "));
});

test("PB3-AC-4 đọc biến ở mỗi lời gọi", async () => {
  const buoc: [EnvCa, number][] = [
    [{ NODE_ENV: "production" }, 503],
    [{ NODE_ENV: "production", DATA_API_KEYS: "khoa-gia-pb3-ac4" }, 401],
    [{ NODE_ENV: "production" }, 503],
  ];
  const loi: string[] = [];
  for (const [i, [env, mong]] of buoc.entries()) {
    datEnv(env);
    const r = await goi("/v1/markets");
    if (r.status !== mong) loi.push(`PB3 chốt biến lúc nạp: bước ${i + 1} trả ${r.status}, mong ${mong}`);
  }
  assert.equal(loi.length, 0, loi.join(" | "));
});

// ── AC-5: tiến trình con src/index.ts ───────────────────────────────────────────────────────────────────────────────
const DAPI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const conSong = new Set<ChildProcess>();
after(() => {
  for (const con of conSong) con.kill("SIGKILL");
});

function congTrong(): Promise<number> {
  return new Promise((ok, loi) => {
    const s = net.createServer();
    s.on("error", loi);
    s.listen(0, "127.0.0.1", () => {
      const port = (s.address() as net.AddressInfo).port;
      s.close(() => ok(port));
    });
  });
}

function khoiDong(ten: string, envCa: EnvCa, port: number) {
  const env: NodeJS.ProcessEnv = { PATH: process.env.PATH, DATABASE_URL: process.env.DATABASE_URL, PORT: String(port) };
  for (const [k, v] of Object.entries(envCa)) if (v !== undefined) env[k] = v;
  const con = spawn(process.execPath, ["--import", "tsx", "src/index.ts"], { cwd: DAPI, env, stdio: ["ignore", "pipe", "pipe"] });
  conSong.add(con);
  let out = "";
  let err = "";
  con.stdout?.on("data", (d) => (out += String(d)));
  con.stderr?.on("data", (d) => (err += String(d)));
  const thoat = new Promise<number | null>((ok) =>
    con.on("exit", (code) => {
      conSong.delete(con);
      ok(code);
    }),
  );
  const ghiLai = () => {
    gom.push({ noi: `stdout ${ten}`, vanBan: out }, { noi: `stderr ${ten}`, vanBan: err });
  };
  return { con, thoat, out: () => out, err: () => err, ghiLai };
}

const cho = (ms: number) => new Promise<"het-gio">((ok) => setTimeout(() => ok("het-gio"), ms));

function congMo(port: number): Promise<boolean> {
  return new Promise((ok) => {
    const s = net.connect(port, "127.0.0.1");
    s.on("connect", () => {
      s.destroy();
      ok(true);
    });
    s.on("error", () => ok(false));
  });
}

async function healthTrong10s(port: number): Promise<number | null> {
  const han = Date.now() + 10_000;
  while (Date.now() < han) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/health`);
      if (r.status === 200) return 200;
    } catch {
      // chưa lắng nghe — thử lại
    }
    await cho(200);
  }
  return null;
}

test("PB3-AC-5 index.ts không khởi động khi thiếu khoá", async () => {
  const loi: string[] = [];
  if (THONG_DIEP === null) loi.push("PB3 thiếu hằng thông điệp MISSING_KEYS_MESSAGE trong auth.ts");

  const caDong: { ten: string; env: EnvCa }[] = [
    { ten: "production khoá rỗng", env: { NODE_ENV: "production", DATA_API_KEYS_BACKUP: CANH } },
    { ten: "NODE_ENV vắng khoá rỗng", env: { DATA_API_KEYS_BACKUP: CANH } },
  ];
  for (const ca of caDong) {
    const port = await congTrong();
    const p = khoiDong(ca.ten, ca.env, port);
    const kq = await Promise.race([p.thoat, cho(10_000)]);
    if (kq === "het-gio") {
      loi.push(`PB3 khởi động: ${ca.ten} không thoát trong 10 giây`);
      if (await congMo(port)) loi.push(`PB3 khởi động: ${ca.ten} đang nhận kết nối ở cổng ${port}`);
      p.con.kill("SIGKILL");
      await p.thoat;
    } else {
      if (kq === 0 || kq === null) loi.push(`PB3 khởi động: ${ca.ten} thoát mã ${String(kq)}, mong khác 0`);
      if (THONG_DIEP !== null && !p.err().includes(THONG_DIEP)) {
        loi.push(`PB3 khởi động: ${ca.ten} stderr thiếu nguyên câu thông điệp ghim`);
      }
      if (await congMo(port)) loi.push(`PB3 khởi động: ${ca.ten} cổng ${port} vẫn nhận kết nối`);
    }
    p.ghiLai();
  }

  const caDoiChung: { ten: string; env: EnvCa }[] = [
    { ten: "production có khoá", env: { NODE_ENV: "production", DATA_API_KEYS: `${CANH}-khoi-dong` } },
    { ten: "development không khoá", env: { NODE_ENV: "development" } },
  ];
  for (const ca of caDoiChung) {
    const port = await congTrong();
    const p = khoiDong(ca.ten, ca.env, port);
    const ma = await healthTrong10s(port);
    if (ma !== 200) loi.push(`PB3 khởi động: ${ca.ten} không trả /health 200 trong 10 giây (stderr: ${p.err().slice(0, 200)})`);
    p.con.kill("SIGTERM");
    await Promise.race([p.thoat, cho(5_000)]);
    p.ghiLai();
  }

  assert.equal(loi.length, 0, loi.join(" | "));
});

test("PB3-AC-6 không lộ giá trị khoá", async () => {
  // Ca production khoá rỗng, chuỗi canh nằm ở biến khoá phụ.
  datEnv({ NODE_ENV: "production", DATA_API_KEYS_BACKUP: CANH });
  await goi("/v1/markets");
  await goi("/health");

  const coCanh = (s: string) => s.includes(CANH);
  // Đối chứng: bộ dò bắt được chuỗi canh cấy vào một thân giả.
  assert.ok(coCanh(JSON.stringify({ error: { message: `x ${CANH} y` } })), "PB3 bộ dò chuỗi canh chết");

  const lo = gom.filter((g) => coCanh(g.vanBan)).map((g) => g.noi);
  assert.equal(lo.length, 0, `PB3 lộ giá trị khoá ở ${[...new Set(lo)].join(", ")}`);
  assert.ok(gom.length > 0, "PB3 không gom được thân nào để soát");
});
