#!/usr/bin/env node
// khong-goi-8000.mjs — MH1 model-may-sang-haiku AC-1: không lời gọi nào tới MTPLX (:8000) khi chạy đủ bộ lệnh có gọi model của làn
// Claude, và mã sản xuất không còn nhắc MTPLX. Chạy trên DB thử của riêng lượt:
//   bash db/db-thu.sh oneinvest_suite_mh1 --chay node _acceptance/model-may-sang-haiku/probes/khong-goi-8000.mjs
// Dựng Anthropic giả (khuôn Messages API, qua ANTHROPIC_BASE_URL — đường đầu của bảng agent/config/model-agent.json từ 22/11),
// Gateway giả (đếm yêu cầu theo lệnh) và máy giả ở cổng MTPLX_URL (đếm mọi yêu cầu), gieo hai tin S03 và một cặp ghép căn,
// chạy năm lệnh: enrich-run --offers, chấm cặp của judge-run (chamMotLuot — CLI judge-run đóng băng V7 nên đo qua hàm nó dùng),
// nhan-bac-run --model haiku --thu, vlm-anh-run --model haiku --thu, smoke. Rồi quét mã theo danh sách loại trừ đóng.
// Cờ phá thử (chiều đỏ): --cay-qwen thêm một lệnh gọi thẳng MTPLX_URL → đỏ «AC-1 <lệnh> gọi MTPLX <n> lần»;
//   --cay-chuoi cấy qwen27b vào một tệp tạm dưới scripts/ và một tệp tạm dưới agent/src → đỏ gọi tên từng tệp. Tệp cấy xoá khi
//   probe dừng. Lệnh đi thẳng Anthropic theo bảng của kho (enrich-run, judge-run, smoke) phải có anthropic ≥ 1.
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const GOC = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const AGENT = join(GOC, "agent");
const require = createRequire(join(AGENT, "package.json"));
const pg = require("pg");
const DB = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(DB)) {
  console.error(`từ chối: chỉ chạy trên DB thử oneinvest_suite_<…> (DATABASE_URL=${DB || "<trống>"})`);
  process.exit(2);
}
const CAY_QWEN = process.argv.includes("--cay-qwen");
const CAY_CHUOI = process.argv.includes("--cay-chuoi");
const loi = [];

// ---- máy giả ----
let lenhHienTai = "";
const demGw = new Map();
const nghe = (sv) => new Promise((r) => sv.listen(0, "127.0.0.1", () => r(sv.address().port)));
const gw = createServer((req, res) => {
  req.resume();
  req.on("end", () => {
    demGw.set(lenhHienTai, (demGw.get(lenhHienTai) ?? 0) + 1);
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({
      content: [{ type: "text", text: '{"property_type":"apartment","intent":"offer","kind":"sale","confidence":0.8,"quote":"","loai_anh":"khac","lo_nguon":false,"giai_thich":"thử"}' }],
      finishReason: { unified: "stop", raw: "stop" },
      usage: { inputTokens: { total: 50, noCache: 50 }, outputTokens: { total: 10, text: 10 } },
      warnings: [],
    }));
  });
});
// Anthropic giả: thân có `tools` mà tin cuối là chữ người dùng → trả một khối tool_use cho tool đầu (smoke đòi gọi tool); còn lại
// trả chữ JSON như Gateway giả.
const demAn = new Map();
let soTin = 0;
const an = createServer((req, res) => {
  let s = "";
  req.on("data", (d) => (s += d));
  req.on("end", () => {
    demAn.set(lenhHienTai, (demAn.get(lenhHienTai) ?? 0) + 1);
    let than = {};
    try { than = JSON.parse(s); } catch { /* giữ rỗng */ }
    const cuoi = Array.isArray(than.messages) ? than.messages[than.messages.length - 1] : null;
    const doiTool = Array.isArray(than.tools) && than.tools.length && typeof cuoi?.content === "string";
    soTin += 1;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({
      id: `msg_gia_${soTin}`, type: "message", role: "assistant", model: String(than.model ?? ""),
      content: doiTool
        ? [{ type: "tool_use", id: `toolu_gia_${soTin}`, name: than.tools[0].name, input: {} }]
        : [{ type: "text", text: '{"property_type":"apartment","confidence":0.8,"giai_thich":"thử"}' }],
      stop_reason: doiTool ? "tool_use" : "end_turn", stop_sequence: null, usage: { input_tokens: 50, output_tokens: 10 },
    }));
  });
});
const demMt = new Map();
const mt = createServer((req, res) => {
  req.resume();
  req.on("end", () => {
    demMt.set(lenhHienTai, (demMt.get(lenhHienTai) ?? 0) + 1);
    res.writeHead(500);
    res.end("{}");
  });
});
const URL_GW = `http://127.0.0.1:${await nghe(gw)}/gw`;
const URL_AN = `http://127.0.0.1:${await nghe(an)}`;
const URL_MT = `http://127.0.0.1:${await nghe(mt)}/v1`;
const ENV = {
  ...process.env, DATABASE_URL: DB, AI_GATEWAY_BASE_URL: URL_GW, AI_GATEWAY_API_KEY: "khoa-gia", ANTHROPIC_BASE_URL: URL_AN,
  ANTHROPIC_API_KEY: "khoa-gia", MTPLX_URL: URL_MT,
};
/** Lệnh đi qua runAgent theo bảng của kho: đường đầu là Anthropic thẳng. */
const DI_THANG = new Set(["enrich-run --offers", "judge-run (chamMotLuot)", "smoke"]);

// ---- gieo ----
const db = new pg.Client({ connectionString: DB, application_name: "mh1-khong-goi-8000" });
await db.connect();
const T = `mh1p${Date.now().toString(36)}`;
const ids = [`${T}_a`, `${T}_b`];
await db.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('mh1p', 'test', 'S03', '{}') ON CONFLICT (snapshot_id) DO NOTHING`);
for (const id of ids) {
  await db.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, group_name) VALUES ($1, 'mh1p', $2, 'Nhóm thử MH1')`,
    [`p_${id}`, `Bán gấp căn 2pn tầng trung phố Ba Đình, sẵn sổ, giá 3,2 tỷ — mã ${id}`]);
  await db.query(`INSERT INTO sale_offers (offer_id, kind, confidence, first_seen, last_seen, source, property_type, post_ids, originating_system_key, price_vnd, area_m2)
                  VALUES ($1, 'sale', 'high', now(), now(), 'S03', 'unknown', $2, $3, 3200000000, 70)`, [id, [`p_${id}`], `p_${id}`]);
}
// Chỉ chấm cặp cấy: gác cặp và thẻ chờ có sẵn của bản chép (DB thử xoá khi lệnh dừng).
await db.query(`UPDATE property_candidates SET status = 'pending' WHERE status = 'needs_llm'`);
await db.query(`UPDATE review_queue SET status = 'deferred', decided_by = 'mh1-gac' WHERE item_type = 'entity_match' AND status IN ('pending', 'deferred')`);
await db.query(`INSERT INTO property_candidates (offer_a, offer_b, score, status) VALUES ($1, $2, 0.7, 'needs_llm')`, ids);
await db.end();

// ---- chạy lệnh ----
const tam = mkdtempSync(join(tmpdir(), "mh1-khong-goi-8000-"));
const tepJudge = join(tam, "cham-cap.mts");
writeFileSync(tepJudge, `import pg from "${join(AGENT, "node_modules/pg/lib/index.js")}";
import { chamMotLuot } from "${join(AGENT, "scripts/judge-run.ts")}";
import { queryPair } from "${join(AGENT, "src/tools/native.ts")}";
const c = new pg.Client({ connectionString: process.env.DATABASE_URL }); await c.connect();
const dem = await chamMotLuot(c, { queryPair: (a, b) => queryPair(a, b, c) });
console.log(JSON.stringify(dem)); await c.end();
`);
const tepCayQwen = join(tam, "cay-qwen.mjs");
writeFileSync(tepCayQwen, `await fetch(process.env.MTPLX_URL + "/chat/completions", { method: "POST", body: "{}" }).catch(() => {});`);

function chay(ten, args) {
  return new Promise((resolve) => {
    lenhHienTai = ten;
    const p = spawn(process.execPath, args, { cwd: AGENT, env: ENV });
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (out += d));
    const hen = setTimeout(() => p.kill("SIGKILL"), 300_000);
    p.on("close", (ma) => {
      clearTimeout(hen);
      resolve({ ma, out });
    });
  });
}
const LENH = [
  ["enrich-run --offers", ["--import", "tsx", "scripts/enrich-run.ts", "--offers", ids.join(",")]],
  ["judge-run (chamMotLuot)", ["--import", "tsx", tepJudge]],
  ["nhan-bac-run --model haiku --thu", ["--import", "tsx", "scripts/nhan-bac-run.ts", "--model", "haiku", "--limit", "1", "--thu"]],
  ["vlm-anh-run --model haiku --thu", ["--import", "tsx", "scripts/vlm-anh-run.ts", "--model", "haiku", "--limit", "1", "--thu"]],
  ["smoke", ["--import", "tsx", "scripts/smoke.ts"]],
  ...(CAY_QWEN ? [["cay-qwen (phá thử)", [tepCayQwen]]] : []),
];
for (const [ten, args] of LENH) {
  const kq = await chay(ten, args);
  const m = demMt.get(ten) ?? 0;
  const g = demGw.get(ten) ?? 0;
  const a = demAn.get(ten) ?? 0;
  console.log(`${ten}: mtplx ${m} · anthropic ${a} · gateway ${g} · mã ${kq.ma}`);
  const duoi = `(mã ${kq.ma}): ${kq.out.slice(-300).replace(/\s+/g, " ")}`;
  if (m > 0) loi.push(`AC-1 ${ten} gọi MTPLX ${m} lần`);
  if (ten === "cay-qwen (phá thử)") continue;
  if (a + g < 1) loi.push(`AC-1 ${ten} không gọi model cloud nào ${duoi}`);
  if (DI_THANG.has(ten) && a < 1) loi.push(`AC-1 ${ten} không đi Anthropic thẳng theo bảng của kho ${duoi}`);
}
gw.close();
an.close();
mt.close();

// ---- quét mã sản xuất ----
const VUNG = ["agent/src", "agent/scripts", "pipeline/lib", "scripts"];
const MAU = /MTPLX_URL|qwen27b|127\.0\.0\.1:8000/;
/** Danh sách loại trừ đóng (AC-1): tệp test và chữ trong dữ liệu giả của một bài thử. */
const LOAI_TEP = new Set(["scripts/smoke-review-queue.mjs"]);
const laTest = (p) => /\.(test|itest)\.[cm]?[jt]sx?$/.test(p);
const tepCay = [];
if (CAY_CHUOI) {
  for (const thu of ["scripts", "agent/src"]) {
    const t = join(GOC, thu, `mh1-cay-${Date.now().toString(36)}.mjs`);
    writeFileSync(t, `// tệp cấy phá thử\nconst m = "qwen27b";\n`);
    tepCay.push(t);
  }
}
let loai = 0;
const di = (d) => {
  for (const ten of readdirSync(d)) {
    if (ten === "node_modules" || ten.startsWith(".")) continue;
    const p = join(d, ten);
    const st = statSync(p);
    if (st.isDirectory()) { di(p); continue; }
    if (!/\.(m?[jt]s|cjs|sh|json)$/.test(ten)) continue;
    const r = relative(GOC, p);
    if (!MAU.test(readFileSync(p, "utf8"))) continue;
    if (laTest(r) || LOAI_TEP.has(r)) { loai += 1; continue; }
    loi.push(`AC-1 mã sản xuất còn nhắc MTPLX/qwen27b: ${r}`);
  }
};
try {
  for (const v of VUNG) di(join(GOC, v));
} finally {
  for (const t of tepCay) rmSync(t, { force: true });
  rmSync(tam, { recursive: true, force: true });
}
console.log(`quét mã: ${VUNG.join(", ")} · loại ${loai} tệp (danh sách loại trừ đóng: tệp test, ${[...LOAI_TEP].join(", ")})`);
if (loi.length) {
  for (const l of loi) console.error(`ĐỎ ${l}`);
  process.exit(1);
}
console.log("AC-1 ĐẠT: 0 lời gọi MTPLX, mỗi lệnh gọi model cloud (enrich-run, judge-run, smoke đi Anthropic thẳng), mã sản xuất sạch");
