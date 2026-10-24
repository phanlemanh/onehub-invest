// capture-ops-facts.mjs — chạy push-ops-facts.mjs THẬT, bắt payload qua một máy chủ thu tạm (INGEST_URL). Dùng cho phép
// đo ON7 `ops-nhan-ma-nguon` (pipeline/scripts/ops-nhan-ma-nguon.test.mjs, app/tests/ops-nhan-ma-nguon-cloud.test.tsx).
// HOME và ONEINVEST_ROOT là cây tạm (log job do người gọi đưa vào); DATABASE_URL mặc định là DB local (chỉ đọc).
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import http from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findSourceNames } from "../lib/mask-source-names.mjs";

export const PUSH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "push-ops-facts.mjs");

/** Bản sao push-ops-facts đã qua `fn` (đột biến cho chiều đỏ) trong thư mục tạm, lib + node_modules trỏ về bản thật.
 *  `fn` không đổi gì → ném lỗi (khuôn đột biến lệch mã nguồn thì phép đo không được xanh oan). */
export function mutantPush(file, fn) {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "ops-facts-mut-")));
  for (const d of ["node_modules", "lib"]) if (!existsSync(path.join(dir, d))) symlinkSync(path.join(path.dirname(PUSH), d), path.join(dir, d));
  const src = readFileSync(PUSH, "utf8");
  const out = fn(src);
  if (out === src) throw new Error(`khuôn đột biến ${file} không khớp mã nguồn push-ops-facts`);
  writeFileSync(path.join(dir, file), out);
  return path.join(dir, file);
}

/** Chuỗi kết nối DB local dựng bằng URL — literal có user bị hook bí mật bắt nhầm. */
export function localDbUrl() {
  const u = new URL("postgres://placeholder/oneinvest");
  u.hostname = "localhost"; u.port = "5433"; u.username = "oneinvest"; u.password = "oneinvest";
  return u.toString();
}

/** logs: { "<tên tệp trong pipeline/logs>": "<nội dung>" }. Trả { code, stdout, stderr, payload, posts } — posts = số POST máy chủ thu nhận. */
/** home: { "<đường tương đối HOME tạm>": "<nội dung>" } — vd cấu hình tài khoản `.openclaw/openclaw.json`. */
export async function captureOpsFacts({ script = PUSH, logs = {}, env = {}, args = [], home: homeFiles = {} } = {}) {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), "ops-facts-")));
  const home = path.join(root, ".home");
  mkdirSync(path.join(home, ".oneinvest"), { recursive: true });
  writeFileSync(path.join(home, ".oneinvest/cloud.env"), "CLOUD_OPS_API_TOKEN=gia\n");
  mkdirSync(path.join(root, "pipeline/logs"), { recursive: true });
  for (const [name, text] of Object.entries(logs)) writeFileSync(path.join(root, "pipeline/logs", name), text);
  for (const [rel, text] of Object.entries(homeFiles)) {
    mkdirSync(path.dirname(path.join(home, rel)), { recursive: true });
    writeFileSync(path.join(home, rel), text);
  }

  let body = "";
  let posts = 0;
  const server = http.createServer((req, res) => {
    if (req.method === "POST") posts++;
    req.on("data", (d) => { body += d; });
    req.on("end", () => { res.writeHead(200, { "content-type": "application/json" }); res.end("{}"); });
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  try {
    const { code, stdout, stderr } = await new Promise((resolve) => {
      const c = spawn(process.execPath, [script, ...args], {
        cwd: path.dirname(script),
        env: {
          PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin`,
          HOME: home,
          ONEINVEST_ROOT: root,
          INGEST_URL: `http://127.0.0.1:${server.address().port}/api/v1/ops/ingest`,
          DATABASE_URL: localDbUrl(),
          ...env,
        },
      });
      let err = "";
      let out = "";
      c.stderr.on("data", (d) => { err += d; });
      c.stdout.on("data", (d) => { out += d; });
      c.on("close", (code) => resolve({ code, stdout: out, stderr: err }));
    });
    return { code, stdout, stderr, payload: body ? JSON.parse(body) : null, posts };
  } finally {
    server.close();
    rmSync(root, { recursive: true, force: true });
  }
}

/** Mọi giá trị chuỗi của payload mang tên thật: ["<đường JSON> <mã>"]. exempt: đường (regex) được miễn có tên. */
export function payloadLeaks(payload, entries, exempt = []) {
  const out = [];
  const walk = (v, p) => {
    if (exempt.some((re) => re.test(p))) return;
    if (typeof v === "string") for (const h of findSourceNames(v, entries)) out.push(`${p} ${h.code}`);
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${p}[${i}]`));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, p ? `${p}.${k}` : k);
  };
  walk(payload, "");
  return out;
}

/** Hai đường miễn có tên (hợp đồng ON7 AC-4): tên nhóm S03 tầng C; tài khoản thu → NT2. */
export const EXEMPT = [/^zaloGroups\[\d+\]\.name$/, /^zaloAccounts(\[|$)/];
