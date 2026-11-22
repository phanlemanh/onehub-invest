// tran-tien-agent.itest.ts — MH1 model-may-sang-haiku AC-5 (trần tiền mỗi lượt) và AC-10 (đường ghi đề xuất với đầu ra dạng Haiku).
// CLI enrich-run THẬT (tiến trình con) trên DB thử của riêng lượt (db/db-thu.sh oneinvest_suite_<…> --chay), Gateway giả và máy
// giả MTPLX trong tiến trình test. Từ chối mọi DB không mang tên oneinvest_suite_<…>. Chiều đỏ AC-5: chép agent/ ra thư mục tạm
// (node_modules symlink), bỏ điểm dừng trần trong run.ts, chạy cùng ca → hàm kiểm phải đỏ đúng thông điệp ghim.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";
import { insertOffer } from "./helpers/db.js";
import { moAnthropic, moMtplx, type MayAnthropic } from "./helpers/gateway-gia.js";

const DB = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(DB)) throw new Error(`từ chối: DB thử phải là oneinvest_suite_<…> (DATABASE_URL=${DB || "<trống>"})`);
const AGENT = join(import.meta.dirname, "..");
const HAIKU = "anthropic/claude-haiku-5.5";
/** ai_calls.model của đường thẳng: `<đường>:<mã gọi>`; mã gọi Messages API của Haiku 5.5. */
const SO_HAIKU = "anthropic:claude-haiku-5-5";
const MA_GOI = "claude-haiku-5-5";
const TIEN_TO = `mh1t${Date.now().toString(36)}`;
let gw: MayAnthropic; // máy giả của đường đầu theo bảng của kho: Anthropic thẳng (MH1, Mạnh 22/11)
let mtplx: Awaited<ReturnType<typeof moMtplx>>;
let db: pg.Client;

before(async () => {
  gw = await moAnthropic();
  mtplx = await moMtplx();
  db = new pg.Client({ connectionString: DB, application_name: "tran-tien-agent-itest" });
  await db.connect();
  await db.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('mh1t', 'test', 'S03', '{}') ON CONFLICT (snapshot_id) DO NOTHING`);
});
after(async () => {
  await db?.end();
  await gw?.dong();
  await mtplx?.dong();
});

let soCa = 0;
/** Gieo n tin S03 thiếu loại hình, mỗi tin một bài nguồn có chữ đủ dài để cần LLM. */
async function gieo(n: number): Promise<string[]> {
  const ca = ++soCa;
  const ids: string[] = [];
  for (let i = 1; i <= n; i++) {
    const id = `${TIEN_TO}_${ca}_${i}`;
    await db.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, group_name) VALUES ($1, 'mh1t', $2, 'Nhóm thử MH1')`, [
      `p_${id}`, `Bán gấp căn 2pn tầng trung phố Ba Đình, sẵn sổ, giá thương lượng — mã ${id}`,
    ]);
    await insertOffer(db, { offer_id: id, post_ids: [`p_${id}`], property_type: "unknown" });
    ids.push(id);
  }
  return ids;
}

function cli(agentDir: string, args: string[]): Promise<{ ma: number | null; out: string }> {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, ["--import", "tsx", "scripts/enrich-run.ts", ...args], {
      cwd: agentDir,
      env: { ...process.env, DATABASE_URL: DB, ANTHROPIC_BASE_URL: gw.url, ANTHROPIC_API_KEY: "khoa-gia", AI_GATEWAY_BASE_URL: "http://127.0.0.1:9/gw-khong-dung", AI_GATEWAY_API_KEY: "khoa-gia", MTPLX_URL: mtplx.url, LIMIT: "50" },
    });
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (out += d));
    const hen = setTimeout(() => p.kill("SIGKILL"), 240_000);
    p.on("error", reject);
    p.on("close", (ma) => {
      clearTimeout(hen);
      resolve({ ma, out });
    });
  });
}

/** Chép agent/ ra thư mục tạm (node_modules symlink), thay một chuỗi trong một tệp. */
async function voiDotBien(tep: string, cu: string, moi: string, fn: (d: string) => Promise<void>) {
  const d = mkdtempSync(join(tmpdir(), "mh1-dot-bien-"));
  try {
    for (const x of ["src", "scripts", "config", "package.json", "tsconfig.json"]) cpSync(join(AGENT, x), join(d, x), { recursive: true });
    symlinkSync(join(AGENT, "node_modules"), join(d, "node_modules"));
    const p = join(d, tep);
    const src = readFileSync(p, "utf8");
    assert.ok(src.includes(cu), `đột biến không khớp chuỗi trong ${tep}`);
    writeFileSync(p, src.replace(cu, moi));
    await fn(d);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
}

const TRA_JSON = '{"property_type":"apartment","bedrooms":2,"confidence":0.9}';
// Mỗi lời gọi tốn (100000 × 0,1 + 1000 × 0,5) / 1e6 = 0,0105 USD; ước tối đa lời kế ≈ 0,0021 USD (chữ vào + 4096 token ra).
// Trần 0,022: lời 1 (0 + 0,0021) qua, lời 2 (0,0105 + 0,0021) qua, lời 3 (0,021 + 0,0021 = 0,0231) vượt → dừng, đúng 2 lời gọi.
const TRAN_HAI_LOI = "0.022";

/** Hàm kiểm dùng chung cho ca thật và chiều đỏ AC-5. */
function kiemTran(kq: { ma: number | null; out: string }, soGoi: number, k: number) {
  if (soGoi > k) assert.fail(`MH1 AC-5 chạy ${soGoi} lời gọi khi trần chỉ đủ ${k}\n${kq.out.slice(-600)}`);
  assert.equal(soGoi, k, `MH1 AC-5 số lời gọi ${soGoi} khác ${k}`);
  assert.equal(kq.ma, 4, `MH1 AC-5 mã thoát ${kq.ma} khác 4: ${kq.out.slice(-300)}`);
  assert.match(kq.out, /hết trần: đã chi 0\.0210 USD \/ trần 0\.022 USD/, "MH1 AC-5 dòng tổng kết thiếu đã chi và trần");
}

test("MH1 AC-5 enrich-run --tran-usd đủ hai lời gọi: chạy đúng 2, thoát 4, ai_calls 2 dòng mã Haiku với token; trần lớn chạy hết", async () => {
  const ids = await gieo(5);
  const luc = (await db.query("SELECT now() AS t")).rows[0].t;
  gw.datLai();
  gw.macDinh = { text: TRA_JSON, vao: 100000, ra: 1000 };
  const kq = await cli(AGENT, ["--offers", ids.join(","), "--tran-usd", TRAN_HAI_LOI]);
  kiemTran(kq, gw.yeuCau.length, 2);
  const { rows } = await db.query(
    `SELECT model, input_tokens, output_tokens FROM ai_calls WHERE viec = 'enrich-text' AND at >= $1 ORDER BY id`, [luc]);
  assert.deepEqual(rows.map((r) => [r.model, r.input_tokens, r.output_tokens]), [[SO_HAIKU, 100000, 1000], [SO_HAIKU, 100000, 1000]],
    "MH1 AC-5 ai_calls không đủ 2 dòng mã Haiku kèm token");
  assert.ok(gw.yeuCau.every((y) => y.model === MA_GOI));
  // Trần lớn: chạy hết ba tin còn lại, thoát 0.
  gw.datLai();
  gw.macDinh = { text: TRA_JSON, vao: 100, ra: 20 };
  const het = await cli(AGENT, ["--offers", ids.slice(2).join(","), "--tran-usd", "1"]);
  assert.equal(het.ma, 0, `MH1 AC-5 trần lớn phải thoát 0: ${het.out.slice(-300)}`);
  assert.equal(gw.yeuCau.length, 3, "MH1 AC-5 trần lớn phải gọi đủ 3 tin");
  assert.equal(mtplx.dem(), 0, "MH1 AC-5 đã gọi MTPLX");
});

test("chiều đỏ MH1 AC-5: bản sao bỏ điểm dừng trần → hàm kiểm đỏ «chạy 3 lời gọi khi trần chỉ đủ 2»", async () => {
  await voiDotBien("src/enrich/run.ts", "if (canLLM && opts.tran && !opts.tran.coTheGoi(", "if (false && canLLM && opts.tran && !opts.tran.coTheGoi(", async (d) => {
    const ids = await gieo(3);
    gw.datLai();
    gw.macDinh = { text: TRA_JSON, vao: 100000, ra: 1000 };
    const kq = await cli(d, ["--offers", ids.join(","), "--tran-usd", TRAN_HAI_LOI]);
    assert.throws(() => kiemTran(kq, gw.yeuCau.length, 2), /MH1 AC-5 chạy 3 lời gọi khi trần chỉ đủ 2/);
  });
});

// ---------- AC-10 ----------
/** Năm đầu ra thô viết trước: hai JSON trần, hai cùng JSON bọc khối mã, một chuỗi không phải JSON. */
const NAM_DAU_RA = [TRA_JSON, TRA_JSON, "```json\n" + TRA_JSON + "\n```", "Đây là kết quả:\n```json\n" + TRA_JSON + "\n```", "Tôi không chắc về tin này."];
/** Bộ đề xuất e2_llm viết trước cho một tin đọc được TRA_JSON (trường, giá trị, lối) — mọi tin đọc được phải ra đúng bộ này. */
const DE_XUAT_KY_VONG = [["bedrooms", "2", "review"], ["property_type", "apartment", "review"]];
/** Số viết trước cho năm tin của AC-10: đề xuất LLM đi lối duyệt (luật 7 — LLM không tự áp), nên «đã áp» 0 và «chờ duyệt»
 *  bằng bốn tin đọc được × hai trường = 8; DB phải có đúng 8 dòng e2_llm chờ duyệt của năm tin. */
const DA_AP_KY_VONG = 0;
const CHO_DUYET_KY_VONG = 8;

test("MH1 AC-10 đường ghi đề xuất với đầu ra dạng Haiku: khối mã ghi như JSON trần, đầu ra hỏng 0 đề xuất, cột model mã Haiku", async () => {
  const ids = await gieo(5);
  gw.datLai();
  gw.hang.push(...NAM_DAU_RA.map((text) => ({ text, vao: 100, ra: 20 })));
  const kq = await cli(AGENT, ["--offers", ids.join(",")]);
  assert.equal(gw.yeuCau.length, 5, `MH1 AC-10 phải gọi đúng 5 lời: ${kq.out.slice(-300)}`);
  // Tin ↔ đầu ra: lời gọi thứ i mang mã tin trong chữ bài.
  const theoTin = new Map<string, string>();
  gw.yeuCau.forEach((y, i) => {
    const id = ids.find((x) => y.thanChu.includes(x));
    assert.ok(id, `MH1 AC-10 lời gọi ${i} không mang mã tin`);
    theoTin.set(id!, NAM_DAU_RA[i]);
  });
  const deXuat = async (id: string) =>
    (await db.query(`SELECT field, value_key, route, model FROM enrichment_proposals WHERE offer_id = $1 AND source = 'e2_llm' ORDER BY field`, [id])).rows;
  const tran = [...theoTin].filter(([, o]) => o === TRA_JSON).map(([id]) => id);
  const khoiMa = [...theoTin].filter(([, o]) => o.includes("```")).map(([id]) => id);
  const hong = [...theoTin].filter(([, o]) => !o.includes("{")).map(([id]) => id);
  assert.deepEqual([tran.length, khoiMa.length, hong.length], [2, 2, 1]);
  for (const id of [...tran, ...khoiMa]) {
    const rs = await deXuat(id);
    assert.deepEqual(rs.map((r) => [r.field, r.value_key, r.route]), DE_XUAT_KY_VONG, `MH1 AC-10 thiếu đề xuất của đầu ra khối mã (${id})`);
    assert.ok(rs.every((r) => r.model === HAIKU), `MH1 AC-10 cột model khác mã Haiku (${id})`);
  }
  assert.equal((await deXuat(hong[0])).length, 0, "MH1 AC-10 đầu ra hỏng vẫn sinh đề xuất");
  assert.match(kq.out, /không đọc được 1/, "MH1 AC-10 tổng kết không đếm đầu ra hỏng");
  // Số đề xuất được áp: tổng kết và DB cùng bằng số viết trước (không chỉ bằng nhau — 0 = 0 không chứng gì).
  const daAp = Number(kq.out.match(/đã áp: (\d+)/)?.[1] ?? NaN);
  const apDb = Number((await db.query(`SELECT count(*) n FROM enrichment_proposals WHERE offer_id = ANY($1) AND applied_at IS NOT NULL`, [ids])).rows[0].n);
  assert.deepEqual([daAp, apDb], [DA_AP_KY_VONG, DA_AP_KY_VONG], `MH1 AC-10 «đã áp» tổng kết ${daAp}, DB ${apDb} — kỳ vọng ${DA_AP_KY_VONG}`);
  // Đối chứng dương cho đường ghi: số chờ duyệt của tổng kết và DB cùng bằng số viết trước (khác 0).
  const choDuyet = Number(kq.out.match(/chờ duyệt: (\d+)/)?.[1] ?? NaN);
  const choDb = Number((await db.query(`SELECT count(*) n FROM enrichment_proposals WHERE offer_id = ANY($1) AND source = 'e2_llm' AND route = 'review' AND status = 'queued'`, [ids])).rows[0].n);
  assert.deepEqual([choDuyet, choDb], [CHO_DUYET_KY_VONG, CHO_DUYET_KY_VONG], `MH1 AC-10 «chờ duyệt» tổng kết ${choDuyet}, DB ${choDb} — kỳ vọng ${CHO_DUYET_KY_VONG}`);
});
