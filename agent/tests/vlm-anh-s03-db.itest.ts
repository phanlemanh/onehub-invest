// vlm-anh-s03-db.itest.ts — hồ sơ _acceptance/vlm-anh-tin-s03, phần cần DB máy thu: ghi nhãn (VLM-AC-4), không đụng canonical (VLM-AC-5),
// lỗi và trần (VLM-AC-6), chấm phiếu (VLM-AC-7), đếm và rút mẫu (VLM-AC-8), đọc mỗi ảnh một lần (VLM-AC-10). Mọi ca ghi DB trong
// BEGIN … ROLLBACK, chỉ in số. Máy chủ HTTP giả thay Gateway và MTPLX; không ảnh nào rời máy. Ca spawn CLI chỉ dùng --thu.
// Tệp nằm ngoài glob tests/*.test.ts — CI (DB trống) không chạy; chạy: node --import tsx --test tests/vlm-anh-s03-db.itest.ts
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";
// @ts-expect-error — mô-đun .mjs của pipeline, không có kiểu
import { FILL } from "../../pipeline/sync-cloud.mjs";
// @ts-expect-error — mô-đun .mjs của pipeline, không có kiểu
import { demNhan, dichPhieu, docPhieu, ghiPhieu, kiemLoThat, napTapDoc, NHAN_TRONG, ROOT, rutMau } from "../../pipeline/lib/vlm-anh.mjs";
// @ts-expect-error — mô-đun .mjs của pipeline, không có kiểu
import { docDongAnh, inDem } from "../../pipeline/vlm-anh-s03.mjs";

type Phan = { text?: string; status?: number; cost?: string };
const tra = (x: Record<string, unknown> = {}) => ({ text: JSON.stringify({ loai_anh: "bang-gia", lo_nguon: false, price_vnd: null, property_type: null, bedrooms_total: null, living_area_m2: null, unit_number: null, building_name: null, subdivision_name: null, quote: "", ...x }) });
const yeuCau: { sha: string; model: string; than: string }[] = [];
/** Kịch bản theo sha: một phần trả lời, một dãy (mỗi lượt lấy một), hoặc hàm theo tên model. */
const kich = new Map<string, Phan | Phan[] | ((model: string) => Phan)>();
const datLai = () => { yeuCau.length = 0; kich.clear(); };

function shaTrongThan(j: any): string {
  const parts = [...(j.prompt ?? []), ...(j.messages ?? [])].flatMap((m: any) => (Array.isArray(m.content) ? m.content : []));
  const p = parts.find((x: any) => x.type === "file" || x.type === "image_url");
  const b64 = p?.type === "file" ? String(p.data?.data ?? p.data) : String(p?.image_url?.url).replace(/^data:[^,]*,/, "");
  return createHash("sha256").update(Buffer.from(b64, "base64")).digest("hex");
}
const sv = createServer((req, res) => {
  let s = "";
  req.on("data", (d) => (s += d));
  req.on("end", () => {
    const gw = (req.url ?? "").includes("/language-model");
    const sha = shaTrongThan(JSON.parse(s));
    const model = gw ? String(req.headers["ai-language-model-id"]) : "qwen";
    yeuCau.push({ sha, model, than: s });
    const k = kich.get(sha);
    const p: Phan = !k ? tra() : typeof k === "function" ? k(model) : Array.isArray(k) ? (k.shift() ?? tra()) : k;
    res.setHeader("content-type", "application/json");
    if (p.status) { res.writeHead(p.status); res.end(JSON.stringify({ error: { message: "canh-thong-diep-loi", type: p.status === 401 ? "authentication_error" : "internal_server_error" } })); return; }
    res.end(JSON.stringify(gw
      ? { content: [{ type: "text", text: p.text }], finishReason: { unified: "stop", raw: "stop" }, usage: { inputTokens: { total: 1600, noCache: 1600 }, outputTokens: { total: 200, text: 200 } }, warnings: [], ...(p.cost ? { providerMetadata: { gateway: { cost: p.cost } } } : {}) }
      : { id: "x", object: "chat.completion", created: 1, model: "m", choices: [{ index: 0, message: { role: "assistant", content: p.text }, finish_reason: "stop" }], usage: { prompt_tokens: 1600, completion_tokens: 200, total_tokens: 1800 } }));
  });
});
await new Promise<void>((r) => sv.listen(0, "127.0.0.1", r));
const CONG = (sv.address() as AddressInfo).port;
const URL_GW = `http://127.0.0.1:${CONG}/gw`;
const URL_MTPLX = `http://127.0.0.1:${CONG}/v1`;
const CONG_CHET = "http://127.0.0.1:9/khong-co";
process.env.AI_GATEWAY_BASE_URL = URL_GW;
process.env.AI_GATEWAY_API_KEY = "khoa-gia";
process.env.MTPLX_URL = URL_MTPLX;
(globalThis as { AI_SDK_LOG_WARNINGS?: boolean }).AI_SDK_LOG_WARNINGS = false;
const { chamPhieu, hoiTuTep, PROMPT_SHA, PROMPT_VERSION, SQL_GHI_ANH, TEN_MODEL, thamSoGhiAnh } = await import("../src/agents/vlm-anh-s03.js");
const { chayLenh } = await import("../scripts/vlm-anh-run.js");

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const GOC = mkdtempSync(join(tmpdir(), "vlm-db-"));
const SNAP = "hanoi__zalo-agent__2099-05-05T000000";
const PHIEU_TAM = `research-local/vlm-test-${process.pid}`;
const RUN_TAM = `vlm-test-${process.pid}`;
after(() => {
  sv.close();
  rmSync(GOC, { recursive: true, force: true });
  rmSync(join(ROOT, PHIEU_TAM), { recursive: true, force: true });
});

// chup: REPEATABLE READ — lệnh đêm ghi properties song song, READ COMMITTED thấy dòng của phiên khác giữa hai lần băm.
async function withTx<T>(fn: (c: pg.Client) => Promise<T>, chup = false): Promise<T> {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query(chup ? "BEGIN ISOLATION LEVEL REPEATABLE READ" : "BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33034)");
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1]);
let soAnh = 0;
/** Ghi một ảnh thật vào thư mục tạm; trả entry media_files đúng khuôn collector. */
function anhMoi() {
  soAnh += 1;
  const bytes = Buffer.concat([JPEG, Buffer.from(`anh-db-${process.pid}-${soAnh}`)]);
  const dir = join(GOC, "hanoi", SNAP, "media");
  mkdirSync(dir, { recursive: true });
  const ten = `t-${soAnh}.jpg`;
  writeFileSync(join(dir, ten), bytes);
  return { file: `media/${ten}`, sha256: createHash("sha256").update(bytes).digest("hex"), tep: join(dir, ten) };
}

const chuThieuGia = (id: string) => `Bán căn hộ 2PN 70m2 mồi ${id}`;
const chuThieuLoai = (id: string) => `Giá 3,2 tỷ 70m2 sổ đỏ mồi ${id}`;
async function moiBai(c: pg.Client, post_id: string, text: string, media: { file: string; sha256: string }[], extra: { snapshot?: string; sender?: string; conv?: string; luc?: string; group?: string } = {}) {
  const snap = extra.snapshot ?? SNAP;
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'zalo-agent', '{}') ON CONFLICT (snapshot_id) DO NOTHING`, [snap]);
  await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, conversation_id, sender_id, sender_name, text, posted_at, media_files)
    VALUES ($1, $2, 'openclaw-hook', $3, $4, $5, 'Người mồi', $6, $7, $8::jsonb)`,
    [post_id, snap, extra.group ?? "Nhóm mồi VLM", extra.conv ?? `conv-${post_id}`, extra.sender ?? `sender-${post_id}`, text, extra.luc ?? "2099-05-05T08:00:00Z", JSON.stringify(media.map((m) => ({ file: m.file, sha256: m.sha256, snapshotId: SNAP })))]);
}

const soCuoc: { ok: boolean }[] = [];
async function chay(c: pg.Client, model: string, them: string[] = [], dep: object = {}) {
  const log: string[] = [];
  const ma = await chayLenh(["--model", model, ...them, "--limit", "1000"], { client: c, napOpts: { goc: GOC }, hoiOpts: { recordCall: async (r: { ok: boolean }) => { soCuoc.push(r); } }, log: (s: string) => log.push(s), ghiTrace: false, ...dep });
  return { ma, log: log.join("\n") };
}
const dongCua = async (c: pg.Client, loc: string) => (await c.query(`SELECT * FROM silver_labels WHERE post_id LIKE $1 AND probabilities->>'nguon' = 'anh' ORDER BY post_id, model`, [loc])).rows;

// ---------- VLM-AC-4 ----------
test("VLM-AC-4 ghi đúng khoá, giữ dòng chữ KC1, hai bài cùng chữ hai dòng, hai model hai dòng, chạy lại 0 dòng 0 gọi, dòng lỗi được thay", async () => {
  datLai();
  await withTx(async (c) => {
    const a = anhMoi(), b = anhMoi(), loi = anhMoi();
    const chung = chuThieuGia("cung-chu");
    await moiBai(c, "t_vlm_a", chung, [a]);
    await moiBai(c, "t_vlm_b", chung, [b]);
    await moiBai(c, "t_vlm_loi", chuThieuGia("loi"), [loi]);
    await c.query(`INSERT INTO silver_labels (source_code, post_id, text_hash, model, prompt_version, listing_intent, kind, json_ok, run_id) VALUES ('S03', 't_vlm_a', 'h-chu', 'test:kc1', 'nb-s03-v2', 'offer', 'sale', true, 'r-kc1')`);
    kich.set(a.sha256, tra({ price_vnd: 3200000000, property_type: "apartment", bedrooms_total: 2, living_area_m2: 70, unit_number: "S2.05", building_name: "S2", subdivision_name: "Dự án mồi", quote: "Giá 3,2 tỷ gọi 0912345678" }));
    kich.set(b.sha256, tra({ price_vnd: 4e9, quote: "4 tỷ" }));
    kich.set(loi.sha256, [{ status: 500 }, tra({ price_vnd: 5e9 })]);

    const mot = await chay(c, "qwen");
    assert.equal(mot.ma, 0);
    assert.equal(yeuCau.length, 3);
    const dong = await dongCua(c, "t_vlm_%");
    assert.deepEqual(dong.map((d) => d.post_id), ["t_vlm_a", "t_vlm_b", "t_vlm_loi"], "VLM-AC-4 hai bài cùng chữ phải ra hai dòng");
    const d = dong[0];
    assert.equal(d.prompt_version, "vlm-s03-v1");
    assert.equal(d.model, TEN_MODEL.qwen);
    assert.equal(d.listing_intent, "unknown");
    assert.equal(d.kind, null);
    assert.equal(d.quote_ok, null, "VLM-AC-4 quote_ok phải NULL");
    assert.ok(d.quote.includes("Giá 3,2 tỷ") && !d.quote.includes("0912345678"), "VLM-AC-4 quote còn SĐT");
    const p = d.probabilities;
    assert.equal(p.nguon, "anh");
    assert.equal(p.prompt_sha, PROMPT_SHA);
    assert.deepEqual([p.price_vnd, p.property_type, p.bedrooms_total, p.living_area_m2, p.unit_number, p.building_name, p.subdivision_name], [3200000000, "apartment", 2, 70, "S2.05", "S2", "Dự án mồi"]);
    assert.deepEqual([p.so_anh, p.so_anh_ghep, p.ly_do], [1, 0, ["thieu_gia"]]);
    assert.equal(p.anh.length, 1);
    assert.equal(p.anh[0].sha256, a.sha256);
    assert.equal(p.anh[0].quote, d.quote, "VLM-AC-4 mảng anh thiếu quote từng ảnh");
    assert.ok(!/"file"|\.jpg|snapshot/.test(JSON.stringify(p)), "VLM-AC-4 nhãn mang tên tệp");
    assert.equal(dong[2].error_kind !== null, true, "VLM-AC-4 dòng lỗi phải mang error_kind");
    assert.equal((await c.query(`SELECT count(*)::int n FROM silver_labels WHERE post_id = 't_vlm_a' AND model = 'test:kc1'`)).rows[0].n, 1, "VLM-AC-4 dòng chữ KC1 bị mất");

    yeuCau.length = 0;
    const hai = await chay(c, "qwen");
    assert.equal(hai.ma, 0);
    assert.deepEqual(yeuCau.map((y) => y.sha), [loi.sha256], "VLM-AC-4 lượt hai chỉ được gọi lại ảnh lỗi");
    const sau = await dongCua(c, "t_vlm_%");
    assert.equal(sau.length, 3, "VLM-AC-4 chạy lại nhân dòng");
    assert.equal(sau[2].error_kind, null, "VLM-AC-4 dòng lỗi không được thay");
    assert.equal(sau[2].probabilities.price_vnd, 5e9);
    assert.equal(sau[0].run_id, dong[0].run_id, "VLM-AC-4 dòng tốt bị ghi đè");

    yeuCau.length = 0;
    await chay(c, "qwen");
    assert.equal(yeuCau.length, 0, "VLM-AC-4 lượt ba phải 0 lần gọi");

    await chay(c, "haiku");
    assert.equal((await dongCua(c, "t_vlm_a")).length, 2, "VLM-AC-4 cùng bài hai model phải hai dòng");
  });
});

test("VLM-AC-4 đổi nội dung prompt giữ bản → mã 2, 0 yêu cầu; đổi bản → có yêu cầu và dòng mới", async () => {
  datLai();
  await withTx(async (c) => {
    await moiBai(c, "t_vlm_p", chuThieuGia("p"), [anhMoi()]);
    assert.equal((await chay(c, "qwen")).ma, 0);
    assert.equal(yeuCau.length, 1);
    yeuCau.length = 0;
    const lech = await chay(c, "qwen", [], { prompt: { version: PROMPT_VERSION, cauHoi: "Đọc ảnh khác đi", sha: "sha-khac" } });
    assert.equal(lech.ma, 2, "VLM-AC-4 đổi nội dung giữ bản phải thoát 2");
    assert.equal(yeuCau.length, 0, "VLM-AC-4 đổi nội dung giữ bản vẫn gửi yêu cầu");
    const moi = await chay(c, "qwen", [], { prompt: { version: "vlm-s03-thu", cauHoi: "Đọc ảnh khác đi", sha: "sha-khac" } });
    assert.equal(moi.ma, 0);
    assert.equal(yeuCau.length, 1, "VLM-AC-4 đổi bản phải có yêu cầu mới");
    assert.ok(yeuCau[0].than.includes("Đọc ảnh khác đi"));
    assert.equal((await dongCua(c, "t_vlm_p")).length, 2, "VLM-AC-4 đổi bản phải có dòng mới");
  });
});

test("VLM-AC-4 câu ghi: dòng tốt không bị đè kể cả khi ghi trùng khoá; dòng lỗi được thay", async () => {
  await withTx(async (c) => {
    const dong = (run_id: string, error_kind: string | null, price: number) => ({ source_code: "S03", post_id: "t_vlm_sql", text_hash: "h", model: "test:vlm", prompt_version: "v-thu", listing_intent: "unknown", kind: null, probability: null, probabilities: { nguon: "anh", price_vnd: price }, quote: null, quote_ok: null, json_ok: true, error_kind, latency_ms: 1, cost_usd: null, run_id });
    const ghi = async (d: ReturnType<typeof dong>) => (await c.query(SQL_GHI_ANH, thamSoGhiAnh(d as never))).rowCount;
    const doc = async () => (await c.query(`SELECT run_id, error_kind FROM silver_labels WHERE post_id = 't_vlm_sql'`)).rows;
    assert.equal(await ghi(dong("r1", "Loi", 1)), 1);
    assert.equal(await ghi(dong("r2", null, 2)), 1, "VLM-AC-4 dòng lỗi không được thay");
    assert.deepEqual(await doc(), [{ run_id: "r2", error_kind: null }]);
    assert.equal(await ghi(dong("r3", null, 3)), 0, "VLM-AC-4 dòng tốt bị ghi đè");
    assert.deepEqual(await doc(), [{ run_id: "r2", error_kind: null }]);
  });
});

// ---------- VLM-AC-3 trên chuỗi thật ----------
test("VLM-AC-3 chuỗi thật từ dòng stg: chữ bài, nhóm, người gửi, snapshot, tên tệp không có trong thân yêu cầu", async () => {
  datLai();
  await withTx(async (c) => {
    const a = anhMoi(), g = anhMoi();
    const luc = "2099-05-05T08:00:00Z", sau = "2099-05-05T08:00:30Z";
    await moiBai(c, "t_vlm_canh_chu", "Bán căn hộ 2PN chữ-canh-77 gọi 0912345678", [a], { sender: "sender-canh-77", conv: "conv-canh-77", group: "Nhóm-canh-77", luc });
    await moiBai(c, "t_vlm_canh_anh", "https://f1.zdn.vn/canh77/anh.jpg", [g], { sender: "sender-canh-77", conv: "conv-canh-77", group: "Nhóm-canh-77", luc: sau });
    assert.equal((await chay(c, "deepseek")).ma, 0);
    assert.equal(yeuCau.length, 2, "VLM-AC-3 phải hỏi cả ảnh riêng lẫn ảnh ghép");
    assert.deepEqual(yeuCau.map((y) => y.model), ["deepseek/deepseek-v4.1-flash-1017", "deepseek/deepseek-v4.1-flash-1017"]);
    for (const y of yeuCau) {
      for (const canh of ["chữ-canh-77", "0912345678", "zdn.vn", "sender-canh-77", "conv-canh-77", "Nhóm-canh-77", "Người mồi", SNAP, "t_vlm_canh", a.file, g.file]) {
        if (y.than.includes(canh)) assert.fail(`VLM-AC-3 lộ khỏi máy: «${canh}»`);
      }
    }
    const [d] = await dongCua(c, "t_vlm_canh_chu");
    assert.deepEqual([d.probabilities.so_anh, d.probabilities.so_anh_ghep], [1, 1], "VLM-AC-3 đếm ảnh riêng và ảnh ghép sai");
  });
});

// ---------- VLM-AC-5 ----------
const BANG_GIU = ["sale_offer_records", "sale_offers", "properties", "listing_records", "stg_zalo_posts", "media"];
async function bamBang(c: pg.Client): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const t of BANG_GIU) out[t] = (await c.query(`SELECT count(*)::text || ':' || coalesce(md5(string_agg(x::text, '|' ORDER BY x::text)), '') AS h FROM ${t} x`)).rows[0].h;
  return out;
}
function kiemGiu(truoc: Record<string, string>, sau: Record<string, string>) {
  const lech = BANG_GIU.filter((t) => truoc[t] !== sau[t]);
  if (lech.length) assert.fail(`VLM-AC-5 ghi ngoài bảng nhãn bạc: ${lech.join(", ")}`);
}
function kiemKhongLenCloud(fill: unknown[]) {
  const ten = fill.map((x) => (typeof x === "string" ? x : (x as { table?: string; name?: string }).table ?? (x as { name?: string }).name));
  assert.ok(ten.includes("areas"), "VLM-AC-5 đối chứng dương: không đọc được tên bảng từ FILL (areas vắng)");
  if (ten.includes("silver_labels")) assert.fail("VLM-AC-5 nhãn bạc lên cloud: silver_labels nằm trong FILL của sync-cloud");
}

test("VLM-AC-5 lô bài thật, backend giả: sáu bảng không đổi, silver_labels tăng đúng N > 0, không lên cloud", async () => {
  datLai();
  await withTx(async (c) => {
    const truoc = await bamBang(c);
    const dem = async () => (await c.query(`SELECT count(*)::int n FROM silver_labels`)).rows[0].n;
    const n0 = await dem();
    const log: string[] = [];
    const ma = await chayLenh(["--model", "deepseek", "--limit", "5"], { client: c, hoiOpts: { recordCall: async () => {} }, log: (s: string) => log.push(s), ghiTrace: false });
    assert.equal(ma, 0);
    const n = (await dem()) - n0;
    assert.ok(n > 0, "VLM-AC-5 lô thật không có bài nào");
    assert.equal(n, 5, "VLM-AC-5 silver_labels phải tăng đúng số bài");
    kiemGiu(truoc, await bamBang(c));
    console.log(`VLM-AC-5 sáu bảng giữ nguyên · silver_labels +${n} · ${yeuCau.length} yêu cầu tới máy giả`);
  }, true);
  kiemKhongLenCloud(FILL);
});

test("chiều đỏ VLM-AC-5: có dòng ghi thêm vào stg → bộ so đỏ ghim; silver_labels trong FILL → đỏ ghim", async () => {
  await withTx(async (c) => {
    const truoc = await bamBang(c);
    await moiBai(c, "t_vlm_do5", chuThieuGia("do"), []);
    assert.throws(() => kiemGiu(truoc, {} as Record<string, string>), /VLM-AC-5 ghi ngoài bảng nhãn bạc/);
    const sau = await bamBang(c);
    assert.throws(() => kiemGiu(truoc, sau), /VLM-AC-5 ghi ngoài bảng nhãn bạc: stg_zalo_posts/);
  }, true);
  assert.throws(() => kiemKhongLenCloud([...FILL, "silver_labels"]), /VLM-AC-5 nhãn bạc lên cloud/);
});

// ---------- VLM-AC-6 ----------
test("VLM-AC-6 ma trận lỗi qua Gateway giả: đủ dòng; lỗi mạng và JSON hỏng gọi lại; giá trị lạ không gọi lại; ai_calls đủ", async () => {
  datLai();
  soCuoc.length = 0;
  await withTx(async (c) => {
    const MA_TRAN = [
      { id: "jsonhong", p: { text: "không phải json" }, loi: /^json-hong$/, goiLai: true },
      { id: "loailai", p: tra({ property_type: "lau-dai", price_vnd: 1e9 }), loi: null, la: "property_type", goiLai: false },
      { id: "giachu", p: tra({ price_vnd: "3 tỷ", property_type: "house" }), loi: null, la: "price_vnd", goiLai: false },
      { id: "khoasai", p: { status: 401 }, loi: /Error$/, goiLai: true },
      { id: "maychu", p: { status: 500 }, loi: /Error$/, goiLai: true },
    ];
    assert.equal(MA_TRAN.length, 5);
    const anh = new Map<string, { sha256: string }>();
    for (const x of MA_TRAN) {
      const a = anhMoi();
      anh.set(x.id, a);
      kich.set(a.sha256, x.p);
      await moiBai(c, `t_vlm6_${x.id}`, chuThieuGia(x.id), [a]);
    }
    assert.equal((await chay(c, "haiku")).ma, 0, "VLM-AC-6 lỗi một ảnh không được dừng lô");
    assert.equal(yeuCau.length, 5);
    assert.equal(soCuoc.length, 5, "VLM-AC-6 ai_calls thiếu dòng");
    const dong = await dongCua(c, "t_vlm6_%");
    assert.equal(dong.length, 5, "VLM-AC-6 thiếu dòng nhãn");
    for (const x of MA_TRAN) {
      const d = dong.find((r) => r.post_id === `t_vlm6_${x.id}`);
      if (x.loi) {
        assert.match(String(d.error_kind), x.loi, `VLM-AC-6 ${x.id} error_kind sai`);
        assert.ok(!String(d.error_kind).includes("canh-thong-diep-loi"), "VLM-AC-6 error_kind chép thông điệp");
      } else {
        assert.equal(d.error_kind, null, `VLM-AC-6 ${x.id} không được tính lỗi`);
        assert.ok(d.probabilities.truong_la.includes(x.la), `VLM-AC-6 ${x.id} thiếu truong_la`);
      }
    }
    assert.equal(dong.find((r) => r.post_id === "t_vlm6_loailai").probabilities.price_vnd, 1e9, "VLM-AC-6 giá trị lạ làm mất trường khác");
    assert.equal(dong.find((r) => r.post_id === "t_vlm6_giachu").probabilities.property_type, "house", "VLM-AC-6 giá chữ làm mất trường khác");
    yeuCau.length = 0;
    await chay(c, "haiku");
    const goiLai = MA_TRAN.filter((x) => x.goiLai).map((x) => anh.get(x.id)!.sha256).sort();
    assert.deepEqual(yeuCau.map((y) => y.sha).sort(), goiLai, "VLM-AC-6 lượt sau phải gọi lại đúng ảnh lỗi");
  });
});

const execTs = (args: string[], env: Record<string, string>) => new Promise<{ ma: number; out: string }>((res) => {
  execFile(process.execPath, ["--import", "tsx", "scripts/vlm-anh-run.ts", ...args], { cwd: join(import.meta.dirname, ".."), env: { ...process.env, AI_GATEWAY_API_KEY: "khoa-gia", ...env } }, (e, stdout, stderr) => {
    res({ ma: e ? Number((e as { code?: number }).code ?? 1) : 0, out: `${stdout}${stderr}` });
  });
});
async function moDb<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try { return await fn(c); } finally { await c.end(); }
}
const demSilver = () => moDb(async (c) => (await c.query(`SELECT count(*)::int n FROM silver_labels`)).rows[0].n as number);
let soRun = 0;
const runMoi = () => `${RUN_TAM}-${++soRun}`;
async function donRun(id: string) {
  await moDb((c) => c.query(`DELETE FROM ai_calls WHERE trace = $1`, [id]));
  rmSync(join(import.meta.dirname, "../traces", `${id}.jsonl`), { force: true });
}

test("VLM-AC-6 CLI thật: thiếu model và model lạ trả 2, Qwen và DeepSeek chạy qua máy giả, --thu giữ số dòng, trần trả 4 ở lô", async () => {
  datLai();
  assert.equal((await execTs([], { AI_GATEWAY_BASE_URL: CONG_CHET, MTPLX_URL: CONG_CHET })).ma, 2, "VLM-AC-6 thiếu --model phải trả 2");
  assert.equal((await execTs(["--model", "decisions"], { AI_GATEWAY_BASE_URL: CONG_CHET, MTPLX_URL: CONG_CHET })).ma, 2, "VLM-AC-6 --model decisions phải trả 2");
  const truoc = await demSilver();

  const r1 = runMoi();
  try {
    const qwen = await execTs(["--model", "qwen", "--limit", "1", "--thu", "--run-id", r1], { AI_GATEWAY_BASE_URL: CONG_CHET, MTPLX_URL: URL_MTPLX });
    assert.equal(qwen.ma, 0, `VLM-AC-6 --model qwen phải chạy được: ${qwen.out.slice(0, 200)}`);
    assert.match(qwen.out, /đã xử 1 bài/);
  } finally { await donRun(r1); }

  yeuCau.length = 0;
  const r2 = runMoi();
  try {
    const ds = await execTs(["--model", "deepseek", "--limit", "1", "--thu", "--run-id", r2], { AI_GATEWAY_BASE_URL: URL_GW, MTPLX_URL: CONG_CHET });
    assert.equal(ds.ma, 0, `VLM-AC-6 --model deepseek phải chạy được: ${ds.out.slice(0, 200)}`);
    assert.ok(yeuCau.length >= 1, "VLM-AC-6 deepseek không có yêu cầu tới máy giả");
    const ghi = await moDb(async (c) => (await c.query(`SELECT count(*)::int n FROM ai_calls WHERE trace = $1`, [r2])).rows[0].n);
    assert.equal(ghi, yeuCau.length, "VLM-AC-6 ai_calls không đủ dòng theo số yêu cầu");
  } finally { await donRun(r2); }

  yeuCau.length = 0;
  const r3 = runMoi();
  try {
    // Máy giả không kèm chi phí: 1600 + 200 token theo đơn giá Haiku = 0,00026 USD mỗi ảnh; trần 0,0004 chỉ đủ một ảnh.
    const dung = await execTs(["--model", "haiku", "--limit", "50", "--thu", "--tran-usd", "0.0004", "--run-id", r3], { AI_GATEWAY_BASE_URL: URL_GW, MTPLX_URL: CONG_CHET });
    assert.equal(dung.ma, 4, `VLM-AC-6 trần ở lô phải trả 4: ${dung.out.slice(0, 200)}`);
    assert.equal(yeuCau.length, 1, "VLM-AC-6 trần không dừng trước ảnh vượt khi trả lời không kèm chi phí");
  } finally { await donRun(r3); }

  assert.equal(await demSilver(), truoc, "VLM-AC-6 --thu đổi số dòng silver_labels");
});

// ---------- VLM-AC-7 ----------
const CHU_CANH = "chữ-bài-canh-phiếu";
type Dac = { nhan: Record<string, unknown>; tra?: Phan | ((m: string) => Phan); ghep?: boolean; soBai?: number };
/** Phiếu do hàm rút mẫu thật sinh, rồi điền đáp án viết tay; ảnh là tệp thật trong thư mục tạm. */
function phieu(dac: Dac[]) {
  datLai();
  soCuoc.length = 0;
  const tap: unknown[] = [];
  const theoSha = new Map<string, Dac>();
  dac.forEach((d, i) => {
    const a = anhMoi();
    theoSha.set(a.sha256, d);
    for (let b = 0; b < (d.soBai ?? 1); b++) {
      tap.push({ post_id: `p${i}-${b}`, text: `${CHU_CANH} ${i}`, text_hash: "h", ly_do: ["thieu_gia"], anh: [{ sha256: a.sha256, tep: a.tep, local: a.file, mime: "image/jpeg", nguon: d.ghep ? "ghep" : "rieng" }] });
    }
  });
  const hang = rutMau(tap, { n: dac.length, seed: "ac7" });
  assert.equal(hang.length, dac.length, "VLM-AC-7 phiếu thiếu ảnh");
  for (const h of hang) {
    const d = theoSha.get(h.sha256)!;
    h.nhan = { ...NHAN_TRONG, ...d.nhan };
    if (d.tra) kich.set(h.sha256, d.tra);
  }
  return hang;
}
const cham = (model: "haiku" | "deepseek" | "qwen", hang: unknown[], tranUsd = 5) => chamPhieu({ model, hang: hang as never, tranUsd, hoi: hoiTuTep(model, { recordCall: async (r: { ok: boolean }) => { soCuoc.push(r); } }) });
const G = 1e9;

test("VLM-AC-7 ma trận phiếu: số viết tay từng thước; chỉ ảnh đã gắn có yêu cầu; ai_calls đủ", async () => {
  const hang = phieu([
    { nhan: { gia: G, bedrooms_total: 3 }, tra: tra({ price_vnd: G * 1.005 }), soBai: 3 }, // lệch 0,5%: đúng
    { nhan: { gia: G }, tra: tra({ price_vnd: G * 1.02 }) }, // lệch 2%: sai
    { nhan: { gia: G }, tra: tra({}) }, // có giá mà model rỗng: sai
    { nhan: { gia: "khong-co-gia" }, tra: tra({ price_vnd: 5e8 }) }, // không có giá mà đọc ra giá
    { nhan: { gia: "khong-co-gia" }, tra: tra({}) },
    { nhan: { gia: "khong-co-mot-gia" }, tra: tra({ price_vnd: 7e8 }) }, // loại khỏi mẫu
    { nhan: { loai_hinh: "apartment" }, tra: tra({ property_type: "apartment" }) },
    { nhan: { loai_hinh: "house" }, tra: tra({}) }, // model rỗng: sai
    { nhan: { loai_hinh: "khong-the-hien" }, tra: tra({ property_type: "apartment" }) }, // loại khỏi mẫu
    { nhan: {} }, // ô trống: không gửi
    { nhan: { gia: 2 * G, thuoc_bai: false, lo_nguon: true, bedrooms_total: 2 }, tra: tra({ price_vnd: 2 * G, lo_nguon: true, bedrooms_total: 2 }) },
    { nhan: { gia: 3 * G, lo_nguon: true }, tra: tra({ price_vnd: 3 * G, lo_nguon: false }), ghep: true },
  ]);
  const b = await cham("haiku", hang);
  assert.equal(yeuCau.length, 11, "VLM-AC-7 số yêu cầu phải bằng số ảnh đã gắn");
  assert.equal(soCuoc.length, 11, "VLM-AC-7 ai_calls thiếu dòng");
  assert.deepEqual([b.daGan, b.oTrong, b.khongThuocBai], [11, 1, 1]);
  assert.deepEqual([b.gia.n, b.gia.dung, b.gia.khongCoGia, b.gia.khongGiaMaDocRa, b.gia.khongCoMotGia], [5, 3, 2, 1, 1], "VLM-AC-7 thước giá sai");
  assert.equal(b.gia.tile, 0.6);
  assert.deepEqual([b.loaiHinh.n, b.loaiHinh.dung, b.loaiHinh.khongTheHien], [2, 1, 1], "VLM-AC-7 thước loại hình sai");
  assert.deepEqual([b.loNguon.nguoiDanh, b.loNguon.modelGanDung], [2, 1], "VLM-AC-7 lộ nguồn sai");
  assert.deepEqual([b.nhom.rieng.n, b.nhom.rieng.gia.n, b.nhom.rieng.gia.dung, b.nhom.ghep.n, b.nhom.ghep.gia.dung], [10, 4, 2, 1, 1], "VLM-AC-7 tách riêng và ghép sai");
  assert.equal(b.ketLuan, "chua-du-mau");
  assert.equal(b.them.bedrooms_total.n, 2);
  assert.equal(b.them.bedrooms_total.tile, 0.5);
  assert.equal(b.them.bedrooms_total.tileTrongSo, 0.25, "VLM-AC-7 trọng số theo số bài dùng chung sai");
});

const bo = (n: number, dungGia: number, dungLoai: number): Dac[] => Array.from({ length: n }, (_, i) => ({
  nhan: { gia: G, loai_hinh: "apartment", bedrooms_total: 2 },
  tra: tra({ price_vnd: i < dungGia ? G : G * 2, property_type: i < dungLoai ? "apartment" : "house", bedrooms_total: 9 }),
}));

test("VLM-AC-7 ngưỡng: 27/30 đạt; 26/30 không đạt; 29 ảnh chưa đủ mẫu; trường thêm sai không đổi cờ đạt", async () => {
  const dat = await cham("haiku", phieu(bo(30, 27, 30)));
  assert.equal(dat.ketLuan, "dat", "VLM-AC-7 27/30 phải đạt");
  assert.equal(dat.them.bedrooms_total.tile, 0, "VLM-AC-7 trường thêm vẫn phải in số");
  assert.equal((await cham("haiku", phieu(bo(30, 26, 30)))).ketLuan, "khong-dat", "VLM-AC-7 26/30 không được đạt");
  assert.equal((await cham("haiku", phieu(bo(30, 30, 26)))).ketLuan, "khong-dat", "VLM-AC-7 loại hình 26/30 không được đạt");
  assert.equal((await cham("haiku", phieu(bo(29, 29, 29)))).ketLuan, "chua-du-mau", "VLM-AC-7 29 ảnh phải chưa đủ mẫu");
});

test("VLM-AC-7 model trả rỗng toàn bộ không đạt: 9 ảnh không giá, 9 ảnh không thể hiện loại hình", async () => {
  const khongGia = await cham("haiku", phieu(Array.from({ length: 9 }, () => ({ nhan: { gia: "khong-co-gia", loai_hinh: "apartment" }, tra: tra({}) }))));
  assert.notEqual(khongGia.ketLuan, "dat", "VLM-AC-7 ca không giá trả rỗng không được đạt");
  assert.equal(khongGia.gia.n, 0);
  const khongLoai = await cham("haiku", phieu(Array.from({ length: 9 }, () => ({ nhan: { gia: G, loai_hinh: "khong-the-hien" }, tra: tra({}) }))));
  assert.notEqual(khongLoai.ketLuan, "dat", "VLM-AC-7 ca không loại hình trả rỗng không được đạt");
  // Có đủ mẫu mà rỗng toàn bộ thì là không đạt, không phải chưa đủ mẫu.
  assert.equal((await cham("haiku", phieu(Array.from({ length: 30 }, () => ({ nhan: { gia: G, loai_hinh: "house" }, tra: tra({}) }))))).ketLuan, "khong-dat");
});

test("VLM-AC-7 model A đạt giá, model B đạt loại hình thì không model nào đạt", async () => {
  const dac: Dac[] = Array.from({ length: 30 }, () => ({
    nhan: { gia: G, loai_hinh: "apartment" },
    tra: (m: string) => (m.includes("haiku") ? tra({ price_vnd: G, property_type: "house" }) : tra({ price_vnd: 2 * G, property_type: "apartment" })),
  }));
  const hang = phieu(dac);
  const a = await cham("haiku", hang);
  const b = await cham("deepseek", hang);
  assert.deepEqual([a.gia.ketLuan, a.loaiHinh.ketLuan, a.ketLuan], ["dat", "khong-dat", "khong-dat"], "VLM-AC-7 model A");
  assert.deepEqual([b.gia.ketLuan, b.loaiHinh.ketLuan, b.ketLuan], ["khong-dat", "dat", "khong-dat"], "VLM-AC-7 model B");
});

test("VLM-AC-7 nhóm ghép 14 ảnh chưa đủ mẫu riêng, 15 ảnh đủ", async () => {
  const dac = (n: number): Dac[] => Array.from({ length: n }, () => ({ nhan: { gia: G }, tra: tra({ price_vnd: G }), ghep: true }));
  assert.equal((await cham("haiku", phieu(dac(14)))).nhom.ghep.ketLuan, "chua-du-mau", "VLM-AC-7 ghép 14 ảnh");
  assert.equal((await cham("haiku", phieu(dac(15)))).nhom.ghep.ketLuan, "du-mau");
});

test("VLM-AC-7 lệnh --gold: in bảng, không chữ bài, không đổi silver_labels; trần trả 4 ở CLI thật", async () => {
  const hang = phieu(bo(3, 3, 3));
  const out = `${PHIEU_TAM}/gold.jsonl`;
  const tep = ghiPhieu(out, hang);
  assert.ok(readFileSync(tep, "utf8").includes(CHU_CANH), "VLM-AC-7 đối chứng dương: phiếu phải có chữ bài canh");
  const truoc = await demSilver();
  const log: string[] = [];
  const ma = await chayLenh(["--model", "haiku", "--gold", tep], { log: (s: string) => log.push(s), hoiOpts: { recordCall: async () => {} } });
  assert.equal(ma, 0);
  assert.equal(yeuCau.length, 3);
  const inRa = log.join("\n");
  assert.match(inRa, /KẾT LUẬN: chưa đủ mẫu/);
  assert.match(inRa, /giá: 3\/3 = 100\.0%/);
  assert.ok(!inRa.includes(CHU_CANH), "VLM-AC-7 đầu ra có chữ bài");
  assert.ok(!inRa.includes(".jpg"), "VLM-AC-7 đầu ra có tên tệp");
  assert.equal(await demSilver(), truoc, "VLM-AC-7 --gold đổi silver_labels");

  yeuCau.length = 0;
  const r = runMoi();
  try {
    const dung = await execTs(["--model", "haiku", "--gold", tep, "--tran-usd", "0.0004", "--run-id", r], { AI_GATEWAY_BASE_URL: URL_GW, MTPLX_URL: CONG_CHET });
    assert.equal(dung.ma, 4, `VLM-AC-6 trần ở --gold phải trả 4: ${dung.out.slice(0, 200)}`);
    assert.equal(yeuCau.length, 1, "VLM-AC-6 trần ở --gold không dừng trước ảnh vượt");
  } finally { await donRun(r); }
});

// ---------- VLM-AC-8 ----------
test("VLM-AC-8 đếm trên dòng ghi thật: số viết tay từng lý do, model, loại ảnh; bốn nhóm cộng bằng tập đọc", async () => {
  datLai();
  await withTx(async (c) => {
    const dat = (id: string, text: string, p: Phan) => { const a = anhMoi(); kich.set(a.sha256, p); return moiBai(c, id, text, [a]).then(() => a); };
    await dat("t_vlm8_tot", chuThieuGia("tot"), tra({ price_vnd: G }));
    await dat("t_vlm8_loai", chuThieuGia("loai"), tra({ property_type: "apartment", loai_anh: "so-do" }));
    await dat("t_vlm8_rong", chuThieuGia("rong"), tra({ loai_anh: "noi-that" }));
    await dat("t_vlm8_loi", chuThieuGia("loi"), { status: 500 });
    await dat("t_vlm8_lh", chuThieuLoai("lh"), tra({ property_type: "house", loai_anh: "so-do" }));
    const doi = await dat("t_vlm8_doi", chuThieuGia("doi"), tra({ price_vnd: 2 * G }));
    const lo = anhMoi();
    kich.set(lo.sha256, tra({ lo_nguon: true, loai_anh: "qr-quang-cao" }));
    for (let i = 0; i < 10; i++) await moiBai(c, `t_vlm8_nguon${"abcdefghij"[i]}`, chuThieuGia(`nguon${"abcdefghij"[i]}`), [lo]);
    assert.equal((await chay(c, "qwen")).ma, 0);
    assert.equal(yeuCau.length, 7, "VLM-AC-8 ảnh dùng 10 bài phải chỉ một yêu cầu");
    // Sau lần đọc: một bài chưa đọc, một bài thêm ảnh.
    const moi = anhMoi();
    await moiBai(c, "t_vlm8_chua", chuThieuGia("chua"), [anhMoi()]);
    await c.query(`UPDATE stg_zalo_posts SET media_files = $1::jsonb WHERE post_id = 't_vlm8_doi'`, [JSON.stringify([doi, moi].map((m) => ({ file: m.file, sha256: m.sha256, snapshotId: SNAP })))]);
    // Toàn lô 401 ở model khác không làm tăng nhãn tốt: bài chưa có dòng vẫn chưa đọc sau khi đã có dòng lỗi được đếm là lỗi.
    for (const y of [...kich.keys()]) kich.set(y, { status: 401 });
    assert.equal((await chay(c, "haiku")).ma, 0);

    const { tap } = await napTapDoc(c, { goc: GOC });
    const dong = (await docDongAnh(c)).filter((r: { post_id: string }) => r.post_id.startsWith("t_vlm8_"));
    const d = demNhan(tap, dong);
    assert.equal(d.tapDoc, 17);
    assert.deepEqual(d.theoLyDo, { thieu_gia: 16, thieu_loai_hinh: 1 }, "VLM-AC-8 lý do sai");
    assert.equal(d.luotAnh, 18);
    assert.equal(d.anhKhacNhau, 9);
    const q = d.models.find((m: { model: string }) => m.model === TEN_MODEL.qwen);
    assert.deepEqual([q.tot, q.rong, q.loi, q.chuaDoc], [4, 11, 1, 1], "VLM-AC-8 bốn nhóm Qwen sai");
    assert.equal(q.tot + q.rong + q.loi + q.chuaDoc, d.tapDoc, "VLM-AC-8 bốn nhóm không cộng bằng tập đọc");
    assert.equal(q.lapDung, 3, "VLM-AC-8 bài thiếu giá chỉ có loại hình không được tính lấp đúng");
    assert.deepEqual(q.lapTheoLyDo, { thieu_gia: 2, thieu_loai_hinh: 1 });
    assert.deepEqual(q.anhTheoLoai, { "bang-gia": 2, "so-do": 2, "noi-that": 1, "qr-quang-cao": 1 }, "VLM-AC-8 ảnh theo loại sai");
    assert.deepEqual([q.anhLoNguon, q.baiLoNguon], [1, 10], "VLM-AC-8 ảnh lộ nguồn dùng 10 bài phải là 1 ảnh, 10 bài");
    assert.equal(q.tapAnhDoi, 1, "VLM-AC-8 bài thêm ảnh sau lần đọc phải tính tập ảnh đã đổi");
    assert.deepEqual([q.dungChung10.bai, q.dungChung10.rong, q.dungChung10.tot], [10, 10, 0], "VLM-AC-8 nhóm dùng từ 10 bài sai");
    assert.equal(q.shaChuaDoc, 3, "VLM-AC-8 ước thời gian phải tính theo sha chưa đọc");
    const h = d.models.find((m: { model: string }) => m.model === TEN_MODEL.haiku);
    assert.equal(h.tot, 0, "VLM-AC-8 lô 401 làm tăng nhãn tốt");
    assert.equal(h.tot + h.rong + h.loi + h.chuaDoc, d.tapDoc);
    assert.ok(h.loi > 0);
    assert.ok(!inDem(d).includes("Bán căn hộ"), "VLM-AC-8 bảng đếm có chữ bài");
    assert.deepEqual(kiemLoThat(d), [], "VLM-AC-9 có dòng Qwen tốt và nhóm cộng đúng thì phải đạt");
  });
});

test("VLM-AC-8 rút mẫu trên dòng stg: mỗi sha một lần, đủ ba tầng, đủ khoá, cùng seed cùng phiếu, không dự đoán, nối đuôi không đè đáp án", async () => {
  datLai();
  await withTx(async (c) => {
    const chung = anhMoi();
    for (let i = 0; i < 10; i++) await moiBai(c, `t_vlmr_c${"abcdefghij"[i]}`, chuThieuGia(`c${"abcdefghij"[i]}`), [chung]);
    const riengs = [anhMoi(), anhMoi(), anhMoi()];
    for (const [i, a] of riengs.entries()) await moiBai(c, `t_vlmr_r${"abc"[i]}`, chuThieuGia(`r${"abc"[i]}`), [a]);
    const ghep = anhMoi();
    await moiBai(c, "t_vlmr_chu", chuThieuGia("chu"), [], { sender: "s9", conv: "v9", luc: "2099-05-05T08:00:00Z" });
    await moiBai(c, "t_vlmr_anh", "https://example.test/a.jpg", [ghep], { sender: "s9", conv: "v9", luc: "2099-05-05T08:00:30Z" });
    const { tap } = await napTapDoc(c, { goc: GOC });
    const a = rutMau(tap, { n: 5, seed: "s" });
    assert.deepEqual(a, rutMau(tap, { n: 5, seed: "s" }), "VLM-AC-8 cùng seed phải cùng phiếu");
    assert.equal(new Set(a.map((h: { sha256: string }) => h.sha256)).size, 5, "VLM-AC-8 sha lặp trong phiếu");
    assert.deepEqual([...new Set(a.map((h: { tang: string }) => h.tang))].sort(), ["co-luot-ghep", "con-lai", "dung-tu-10-bai"], "VLM-AC-8 thiếu tầng");
    const hc = a.find((h: { sha256: string }) => h.sha256 === chung.sha256);
    assert.deepEqual([hc.so_bai_dung_chung, hc.so_luot_rieng, hc.so_luot_ghep, hc.tep], [10, 10, 0, chung.tep], "VLM-AC-8 khoá phiếu sai");
    const hg = a.find((h: { sha256: string }) => h.sha256 === ghep.sha256);
    assert.equal(hg.bai_dai_dien.post_id, "t_vlmr_chu", "VLM-AC-8 bài đại diện phải là bài có ảnh qua ghép");
    assert.ok(!JSON.stringify(a).match(/du_doan|price_vnd|property_type/), "VLM-AC-8 phiếu có dự đoán");

    const out = `${PHIEU_TAM}/rut.jsonl`;
    ghiPhieu(out, a.slice(0, 2).map((h: { nhan: object }) => ({ ...h, nhan: { ...h.nhan, gia: 123 } })));
    const cu = docPhieu(dichPhieu(out));
    const them = rutMau(tap, { n: 5, seed: "s", boQua: new Set(cu.map((h: { sha256: string }) => h.sha256)) });
    assert.equal(them.length, 3, "VLM-AC-8 rút thêm phải bỏ ảnh đã có");
    ghiPhieu(out, them);
    const sau = docPhieu(dichPhieu(out));
    assert.equal(sau.length, 5);
    assert.equal(sau[0].nhan.gia, 123, "VLM-AC-8 rút thêm đè đáp án đã gắn");
  });
});

test("VLM-AC-8 lệnh pipeline thật: đích ngoài research-local bị từ chối; rút trên DB thật ra phiếu; chọn bài thật > 0, không bài thử", async () => {
  const lenh = (args: string[]) => new Promise<{ ma: number; out: string }>((res) => {
    execFile(process.execPath, ["pipeline/vlm-anh-s03.mjs", ...args], { cwd: ROOT }, (e, stdout, stderr) => res({ ma: e ? Number((e as { code?: number }).code ?? 1) : 0, out: `${stdout}${stderr}` }));
  });
  assert.equal((await lenh(["--rut-mau", "--n", "3", "--seed", "x", "--out", join(GOC, "p.jsonl")])).ma, 2, "VLM-AC-8 đích ngoài research-local phải bị từ chối");
  assert.ok(!existsSync(join(GOC, "p.jsonl")), "VLM-AC-8 đích ngoài vẫn có tệp");
  const out = `${PHIEU_TAM}/that.jsonl`;
  const r = await lenh(["--rut-mau", "--n", "6", "--seed", "x", "--out", out]);
  assert.equal(r.ma, 0, r.out.slice(0, 200));
  const hang = docPhieu(dichPhieu(out));
  assert.equal(hang.length, 6);
  assert.equal(new Set(hang.map((h: { sha256: string }) => h.sha256)).size, 6);
  const dem = await lenh(["--dem"]);
  assert.equal(dem.ma, 0);
  assert.match(dem.out, /tập đọc [1-9]/, "VLM-AC-8 tập đọc thật rỗng");

  await withTx(async (c) => {
    const { tap } = await napTapDoc(c);
    assert.ok(tap.length > 0, "VLM-AC-8 chọn bài trên stg thật ra 0");
    const a = anhMoi();
    await moiBai(c, "t_vlm_bai_thu", chuThieuGia("thu"), [a], { snapshot: "hanoi__mock__2099" });
    await moiBai(c, "t_vlm_bai_that", chuThieuGia("that"), [a]);
    const ids = (await napTapDoc(c, { goc: GOC })).tap.map((b: { post_id: string }) => b.post_id);
    assert.ok(ids.includes("t_vlm_bai_that"), "VLM-AC-8 đối chứng: bài thật cùng ảnh phải được chọn");
    assert.ok(!ids.includes("t_vlm_bai_thu"), "VLM-AC-8 bài thử lọt vào tập đọc");
  });
  for (const tep of ["pipeline/vlm-anh-s03.mjs", "pipeline/lib/vlm-anh.mjs"]) {
    const ma = readFileSync(join(ROOT, tep), "utf8");
    assert.ok(!/from\s+["'](ai|@ai-sdk\/[^"']+)["']/.test(ma) && !/\bfetch\s*\(/.test(ma), `VLM-AC-8 ${tep} có mã gọi model`);
  }
});

// ---------- VLM-AC-10 ----------
test("VLM-AC-10 ma trận: số yêu cầu bằng số sha khác nhau; dòng riêng mỗi bài; gộp đúng; lô hai chỉ gọi ảnh chưa đọc tốt", async () => {
  datLai();
  await withTx(async (c) => {
    const chung = anhMoi(), giaA = anhMoi(), giaB = anhMoi(), coGia = anhMoi(), rong = anhMoi(), tot = anhMoi(), loi = anhMoi(), lo = anhMoi();
    kich.set(chung.sha256, tra({ property_type: "apartment", quote: "Quote lượt đầu" }));
    kich.set(giaA.sha256, tra({ price_vnd: G }));
    kich.set(giaB.sha256, tra({ price_vnd: 2 * G }));
    kich.set(coGia.sha256, tra({ price_vnd: 3 * G }));
    kich.set(tot.sha256, tra({ price_vnd: 4 * G }));
    kich.set(loi.sha256, [{ status: 500 }, tra({ bedrooms_total: 2 })]);
    kich.set(lo.sha256, tra({ lo_nguon: true, loai_anh: "qr-quang-cao" }));
    const MA_TRAN = [["t_vlm10_ca", [chung]], ["t_vlm10_cb", [chung]], ["t_vlm10_cc", [chung]], ["t_vlm10_trai", [giaA, giaB]], ["t_vlm10_mot", [coGia, rong]], ["t_vlm10_loi", [tot, loi]], ["t_vlm10_lo", [lo]]] as const;
    for (const [id, m] of MA_TRAN) await moiBai(c, id, chuThieuGia(id.slice(8)), [...m]);
    assert.equal((await chay(c, "qwen")).ma, 0);
    assert.equal(yeuCau.length, 8, "VLM-AC-10 số yêu cầu phải bằng số sha khác nhau");
    assert.equal(new Set(yeuCau.map((y) => y.sha)).size, 8);
    const dong = Object.fromEntries((await dongCua(c, "t_vlm10_%")).map((d) => [d.post_id, d]));
    assert.equal(Object.keys(dong).length, 7, "VLM-AC-10 mỗi bài phải có dòng riêng");
    for (const id of ["t_vlm10_ca", "t_vlm10_cb", "t_vlm10_cc"]) assert.equal(dong[id].probabilities.anh[0].so_bai_dung_chung, 3, "VLM-AC-10 so_bai_dung_chung sai");
    const trai = dong.t_vlm10_trai.probabilities;
    assert.equal(trai.price_vnd, null, "VLM-AC-10 hai giá khác nhau phải rỗng");
    assert.deepEqual(trai.xung_dot, ["price_vnd"]);
    const mot = dong.t_vlm10_mot.probabilities;
    assert.equal(mot.price_vnd, 3 * G, "VLM-AC-10 giá + rỗng phải ra giá");
    assert.deepEqual(mot.xung_dot, []);
    const li = dong.t_vlm10_loi;
    assert.ok(li.error_kind, "VLM-AC-10 bài có ảnh lỗi phải mang error_kind");
    assert.equal(li.probabilities.price_vnd, 4 * G, "VLM-AC-10 bài có ảnh lỗi phải giữ kết quả ảnh tốt");

    // Lô hai: bài mới cùng ảnh đã đọc + ảnh lỗi đọc lại. Đúng một yêu cầu.
    yeuCau.length = 0;
    await moiBai(c, "t_vlm10_moi", chuThieuGia("moi"), [chung]);
    assert.equal((await chay(c, "qwen")).ma, 0);
    assert.deepEqual(yeuCau.map((y) => y.sha), [loi.sha256], "VLM-AC-10 lô hai chỉ được gọi ảnh chưa đọc tốt");
    const [moi] = await dongCua(c, "t_vlm10_moi");
    assert.equal(moi.probabilities.anh[0].quote, "Quote lượt đầu", "VLM-AC-10 quote dùng lại phải khớp lượt đầu");
    assert.equal(moi.probabilities.anh[0].so_bai_dung_chung, 4, "VLM-AC-10 so_bai_dung_chung phải tính lại trên cả tập đọc");
    assert.equal(moi.latency_ms, 0);
    const [liSau] = await dongCua(c, "t_vlm10_loi");
    assert.equal(liSau.error_kind, null, "VLM-AC-10 lô sau phải xoá lỗi");
    assert.deepEqual([liSau.probabilities.price_vnd, liSau.probabilities.bedrooms_total], [4 * G, 2]);

    // Đổi model thì không dùng lại kết quả.
    yeuCau.length = 0;
    await chay(c, "haiku", ["--limit", "1"]);
    assert.ok(yeuCau.length >= 1, "VLM-AC-10 đổi model phải có yêu cầu");
  });
});

test("VLM-AC-10 --limit 1 vẫn tính so_bai_dung_chung trên cả tập đọc", async () => {
  datLai();
  await withTx(async (c) => {
    const a = anhMoi();
    for (const id of ["t_vlm10x_a", "t_vlm10x_b", "t_vlm10x_c"]) await moiBai(c, id, chuThieuGia(id.slice(9)), [a]);
    await chay(c, "qwen", ["--limit", "1"]);
    const dong = await dongCua(c, "t_vlm10x_%");
    assert.equal(dong.length, 1);
    assert.equal(dong[0].probabilities.anh[0].so_bai_dung_chung, 3, "VLM-AC-10 so_bai_dung_chung chỉ tính trong lô");
  });
});

test("VLM-AC-10 đối chứng hai chiều nhãn lộ nguồn: cùng ảnh, true và false đều đúng một yêu cầu và có dòng, chỉ khác nhãn", async () => {
  const ket: Record<string, { soYeuCau: number; lo: boolean; so: number; soDong: number }> = {};
  for (const lo of [true, false]) {
    datLai();
    await withTx(async (c) => {
      const a = anhMoi();
      kich.set(a.sha256, tra({ lo_nguon: lo }));
      await moiBai(c, "t_vlm10l", chuThieuGia("l"), [a]);
      await chay(c, "qwen");
      const d = await dongCua(c, "t_vlm10l");
      ket[String(lo)] = { soYeuCau: yeuCau.length, lo: d[0]?.probabilities.anh[0].lo_nguon, so: d[0]?.probabilities.so_anh_lo_nguon, soDong: d.length };
    });
  }
  assert.deepEqual(ket.true, { soYeuCau: 1, lo: true, so: 1, soDong: 1 }, "VLM-AC-10 ảnh lộ nguồn phải vẫn được đọc và gắn nhãn");
  assert.deepEqual(ket.false, { soYeuCau: 1, lo: false, so: 0, soDong: 1 }, "VLM-AC-10 ảnh sạch không được gắn nhãn");
});
