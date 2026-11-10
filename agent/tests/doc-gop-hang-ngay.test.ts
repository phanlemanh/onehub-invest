// doc-gop-hang-ngay.test.ts — PL34 `doc-gop-hang-ngay`: lệnh hang-ngay (phạm vi ngày, khử trùng, đã đọc, trần ngày chi, mã
// thoát) và bước đêm pipeline/doc-gop-hang-ngay.sh. Hồ sơ: _acceptance/doc-gop-hang-ngay/ (E1–E8).
// Ca DB chạy trong BEGIN…ROLLBACK trên DB của riêng lượt (`npm test` → db/db-thu.sh --chay), ngày bài xa (2001) để dữ liệu chép
// từ DB chung không chen vào. Gateway giả ghi mã model + prompt, trả JSON dựng sẵn và tiền giả.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { MockLanguageModelV4 } from "ai/test";
import pg from "pg";
import { chayLuot } from "../src/enrich/doc-gop-s03/chay.js";
import type { TaoModel } from "../src/enrich/doc-gop-s03/doc.js";
import { chayHangNgay, DONG_CHAM_TRAN } from "../src/enrich/doc-gop-s03/hang-ngay.js";
import { FIELDS, type Field } from "../src/enrich/doc-gop-s03/o.js";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const HAI = "anthropic/claude-haiku-5.5";
const AGENT = join(import.meta.dirname, "..");
const ROOT = join(AGENT, "..");
const NGAY = "2001-01-02";
const BAY_GIO = new Date("2001-01-05T03:00:00+07:00"); // ngày chi 2001-01-05
const PNG = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000000000300010d0a2db40000000049454e44ae426082", "hex");
const SNAP = "hanoi__zalo-agent__2001-01-02T000000000";

async function withTx<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

function json17(): string {
  const o: Record<string, unknown> = {};
  for (const f of FIELDS as readonly Field[]) o[f] = { v: null, cc: null, trich: "" };
  return JSON.stringify(o);
}
type Ghi = { gateway: string; prompt: string };
/** Gateway giả: `tra(prompt)` chọn câu trả lời (hay lỗi) theo chữ bài trong prompt; tiền mỗi lời gọi `cost`. */
function gatewayGia(ghi: Ghi[], tra: (prompt: string) => string | Error = () => json17(), cost = "0.002"): TaoModel {
  return (gateway) => new MockLanguageModelV4({
    modelId: gateway,
    doGenerate: async (o: { prompt: unknown }) => {
      const prompt = JSON.stringify(o.prompt);
      ghi.push({ gateway, prompt });
      const t = tra(prompt);
      if (t instanceof Error) throw t;
      return {
        content: [{ type: "text", text: t }], finishReason: { unified: "stop", raw: "stop" },
        usage: { inputTokens: { total: 5000, noCache: 5000, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 900, text: 900, reasoning: undefined } },
        warnings: [], providerMetadata: { gateway: { cost } },
      };
    },
  } as never) as never;
}

const dem = async (c: pg.Client, bang: string) => Number((await c.query(`SELECT count(*) n FROM ${bang}`)).rows[0].n);

type Bai = { key: string; text: string; luc: string; group?: string; anh?: boolean };
/** Chèn bài stg_zalo_posts; `anh` = một ảnh có tệp trong thư mục snapshot tạm. Trả map key → post_id. */
async function chenBai(c: pg.Client, bai: Bai[]): Promise<Record<string, string>> {
  const goc = mkdtempSync(join(tmpdir(), "pl34-snap-"));
  mkdirSync(join(goc, "hanoi", SNAP, "media"), { recursive: true });
  process.env.SNAPSHOTS_DIR = goc;
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'zalo-agent', '{}'::jsonb) ON CONFLICT DO NOTHING`, [SNAP]);
  const ids: Record<string, string> = {};
  for (const [i, b] of bai.entries()) {
    const post = `pl34-${process.pid}-${b.key}`;
    ids[b.key] = post;
    const files = b.anh ? (() => {
      const ten = `media/pl34${process.pid}${i}.png`;
      const byte = Buffer.concat([PNG, Buffer.from([i])]);
      writeFileSync(join(goc, "hanoi", SNAP, ten), byte);
      return [{ file: ten, url: b.text, sha256: createHash("sha256").update(byte).digest("hex"), snapshotId: SNAP }];
    })() : [];
    const media = /^https?:\/\//.test(b.text) ? [{ url: b.text }] : [];
    await c.query(
      `INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, posted_at, text, captured_at, conversation_id, media, agent_id, media_files)
       VALUES ($1, $2, $3, $4, $5, $4, NULL, $6, NULL, $7)`,
      [post, SNAP, b.group ?? "Nhóm thử PL34", b.luc, b.text, JSON.stringify(media), JSON.stringify(files)]);
  }
  return ids;
}

const M = () => `m${process.pid}`; // dấu riêng của lượt trong chữ bài

/** Fixture AC-1: 12 bài ngày D + 1 bài D−1 + 1 bài ngày trước (X0) cùng chữ với X; tin nối T1, T2; nhãn của R và X0 ghi bằng
 * chayLuot thật. Trả post_id theo khoá và tập kỳ vọng sẽ gọi. */
async function dungNgayD(c: pg.Client) {
  const m = M();
  const ids = await chenBai(c, [
    { key: "a", text: `Bán căn A ${m} 2PN giá 3 tỷ`, luc: `${NGAY}T00:30:00+07:00` },
    { key: "b", text: `Cho thuê B ${m} 1PN 9tr`, luc: `${NGAY}T23:30:00+07:00` },
    { key: "t1", text: `Tin T bản một ${m} 3 tỷ`, luc: `${NGAY}T09:00:00+07:00` },
    { key: "t2", text: `Tin T bản hai ${m} 3,1 tỷ`, luc: `${NGAY}T10:00:00+07:00` },
    { key: "c1", text: `Chữ C ${m} căn góc\nhttps://cdn.example/${m}/c1.jpg`, luc: `${NGAY}T11:00:00+07:00` },
    { key: "c2", text: `Chữ C ${m} căn góc\nhttps://cdn.example/${m}/c2.jpg`, luc: `${NGAY}T12:00:00+07:00` },
    { key: "thu", text: `Bài thử ${m}`, luc: `${NGAY}T13:00:00+07:00`, group: "TEST" },
    { key: "sk", text: `{"clientDelMsgId":"${m}"}`, luc: `${NGAY}T14:00:00+07:00` },
    { key: "anh", text: `https://cdn.example/${m}/anh-co-tep.jpg`, luc: `${NGAY}T15:00:00+07:00`, anh: true },
    { key: "url", text: `https://cdn.example/${m}/chi-url.jpg`, luc: `${NGAY}T16:00:00+07:00` },
    { key: "r", text: `Bài R đã đọc ${m}`, luc: `${NGAY}T17:00:00+07:00` },
    { key: "x", text: `Bài X đăng lại ${m}`, luc: `${NGAY}T18:00:00+07:00` },
    { key: "truoc", text: `Bài ngày trước ${m}`, luc: "2001-01-01T23:59:00+07:00" },
    { key: "x0", text: `Bài X đăng lại ${m}`, luc: "2000-12-30T10:00:00+07:00" },
  ]);
  await c.query(`INSERT INTO sale_offer_records (offer_id, kind, first_seen, last_seen, post_ids, source) VALUES ($1, 'sale', now(), now(), $2, 'S03')`,
    [`pl34-offer-${process.pid}`, [ids.t1, ids.t2]]);
  await chayLuot({ client: c, co: { post: [ids.r, ids.x0], tranUsd: 1, runId: "pl34-truoc" }, taoModel: gatewayGia([]), log: () => {} });
  const seGoi = [ids.a, ids.b, ids.t1, ids.c1, ids.anh, ids.x];
  return { ids, seGoi };
}

const im = { log: () => {}, logLoi: () => {} };
/** post_id của một lời gọi: tìm chữ bài đặc trưng trong prompt. */
function postCuaLoi(g: Ghi, chu: Record<string, string>): string | undefined {
  return Object.entries(chu).find(([, t]) => g.prompt.includes(JSON.stringify(t).slice(1, -1).split("\\n")[0]))?.[0];
}

test("PL34-AC-1 --thu: phạm vi ngày giờ VN, gạt thử và sự kiện, khử trùng theo tin và chữ, bỏ bài đã đọc cùng post_id", async () => {
  await withTx(async (c) => {
    const { ids, seGoi } = await dungNgayD(c);
    const truoc = { sl: await dem(c, "silver_labels"), ai: await dem(c, "ai_calls") };
    const ghi: Ghi[] = [];
    const kq = await chayHangNgay({ client: c, co: { ngay: NGAY, tranNgayUsd: 20, thu: true }, bayGio: BAY_GIO, taoModel: gatewayGia(ghi), ...im });
    const t = kq.tomTat;
    assert.ok(!kq.seGoi.includes(ids.thu), "BAI THU LOT VAO PHAM VI");
    assert.ok(!kq.seGoi.includes(ids.t2), "TIN DOC HAI LAN");
    assert.ok(!kq.seGoi.includes(ids.r), "DOC LAI BAI DA DOC");
    assert.ok(kq.seGoi.includes(ids.x), "BAI DANG LAI BI BO");
    assert.ok(!kq.seGoi.includes(ids.truoc) && kq.seGoi.includes(ids.a) && kq.seGoi.includes(ids.b), "SAI NGAY GIO VN");
    assert.equal(t.tho, 12, "SAI NGAY GIO VN: tho phải là 12 bài của ngày D giờ VN");
    assert.equal(t.bai_thu, 1, "BAI THU LOT VAO PHAM VI");
    assert.equal(t.su_kien, 1);
    assert.equal(t.trung, 2, "TIN DOC HAI LAN");
    assert.equal(t.da_doc, 1, "DOC LAI BAI DA DOC");
    assert.equal(t.bo, 1);
    assert.equal(t.can_goi, 6);
    assert.deepEqual([...kq.seGoi].sort(), [...seGoi].sort(), "tập bài sẽ gọi khác tập viết trước");
    assert.equal(ghi.length, 0, "--thu không được gọi model");
    assert.equal(kq.ma, 0);
    assert.deepEqual({ sl: await dem(c, "silver_labels"), ai: await dem(c, "ai_calls") }, truoc, "--thu không được ghi");
  });
});

test("PL34-AC-1-CLI --thu không đòi khoá Gateway", () => {
  const env = { ...process.env };
  delete env.AI_GATEWAY_API_KEY;
  const r = spawnSync(process.execPath, ["--import", "tsx", "scripts/doc-gop-s03.ts", "hang-ngay", "--ngay", "2001-01-02", "--thu"], { cwd: AGENT, env, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  const dong = r.stdout.trim().split("\n").at(-1)!;
  assert.equal(JSON.parse(dong).pl34.ngay_bai, "2001-01-02");
});

test("PL34-AC-2 chạy thật: một lời gọi Haiku mỗi đơn vị, ghi nhãn bạc + ai_calls, run_id mang ngày chi, bảng khác không đổi", async () => {
  await withTx(async (c) => {
    const { seGoi } = await dungNgayD(c);
    const bang = ["sale_offers", "sale_offer_records", "enrichment_proposals", "review_queue", "eval_labels", "eval_label_items"];
    const demHet = async () => { const r: Record<string, number> = {}; for (const b of bang) r[b] = await dem(c, b); return r; };
    const truoc = await demHet();
    const ai0 = await dem(c, "ai_calls");
    const ghi: Ghi[] = [];
    const kq = await chayHangNgay({ client: c, co: { ngay: NGAY, tranNgayUsd: 20, thu: false }, bayGio: BAY_GIO, taoModel: gatewayGia(ghi), ...im });
    assert.equal(kq.ma, 0);
    assert.equal(ghi.length, 6);
    assert.ok(ghi.every((g) => g.gateway === HAI));
    const { rows } = await c.query(`SELECT post_id, run_id FROM silver_labels WHERE post_id = ANY ($1)`, [seGoi]);
    assert.deepEqual(rows.map((r) => r.post_id).sort(), [...seGoi].sort());
    for (const r of rows) assert.match(r.run_id, /^pl34-2001-01-05-b2001-01-02-/, "RUN_ID THIEU NGAY CHI");
    assert.equal(await dem(c, "ai_calls"), ai0 + 6);
    const { rows: ac } = await c.query(`SELECT viec FROM ai_calls ORDER BY id DESC LIMIT 6`);
    assert.ok(ac.every((r) => r.viec === "doc-gop-s03"));
    assert.deepEqual(await demHet(), truoc, "GHI NGOAI NHAN BAC");
  });
});

test("PL34-AC-3 chạy lại cùng ngày không gọi lại; JSON hỏng và lỗi mạng được gọi lại", async () => {
  await withTx(async (c) => {
    await dungNgayD(c);
    const co = { ngay: NGAY, tranNgayUsd: 20, thu: false };
    await chayHangNgay({ client: c, co, bayGio: BAY_GIO, taoModel: gatewayGia([]), ...im });
    const sl = await dem(c, "silver_labels");
    const ghi: Ghi[] = [];
    const kq = await chayHangNgay({ client: c, co, bayGio: BAY_GIO, taoModel: gatewayGia(ghi), ...im });
    assert.equal(ghi.length, 0, "LUOT HAI GOI LAI");
    assert.equal(await dem(c, "silver_labels"), sl);
    assert.equal(kq.tomTat.can_goi, 0, "LUOT HAI GOI LAI");
    assert.equal(kq.tomTat.da_doc, 7);
    assert.equal(kq.ma, 0);
  });
});

test("PL34-AC-3-HONG lượt hai chỉ gọi lại đơn vị JSON hỏng và đơn vị lỗi mạng", async () => {
  await withTx(async (c) => {
    await dungNgayD(c);
    const co = { ngay: NGAY, tranNgayUsd: 20, thu: false };
    const m = M();
    await chayHangNgay({ client: c, co, bayGio: BAY_GIO, ...im,
      taoModel: gatewayGia([], (p) => (p.includes(`Bán căn A ${m}`) ? "khong phai json" : p.includes(`Cho thuê B ${m}`) ? new TypeError("mang") : json17())) });
    const ghi: Ghi[] = [];
    await chayHangNgay({ client: c, co, bayGio: BAY_GIO, taoModel: gatewayGia(ghi), ...im });
    const goi = ghi.map((g) => postCuaLoi(g, { a: `Bán căn A ${m}`, b: `Cho thuê B ${m}` }));
    assert.deepEqual(goi.sort(), ["a", "b"], "JSON HONG KHONG DUOC DOC LAI");
  });
});

test("PL34-AC-3-DANG-LAI bài đăng lại ngày sau (post_id mới, cùng chữ) được gọi và có nhãn dưới post_id của nó", async () => {
  await withTx(async (c) => {
    const m = M();
    const ids = await chenBai(c, [
      { key: "p", text: `Tin P ${m} 2PN`, luc: "2001-01-02T09:00:00+07:00" },
      { key: "p2", text: `Tin P ${m} 2PN`, luc: "2001-01-03T09:00:00+07:00" },
    ]);
    await chayHangNgay({ client: c, co: { ngay: "2001-01-02", tranNgayUsd: 20, thu: false }, bayGio: BAY_GIO, taoModel: gatewayGia([]), ...im });
    const ghi: Ghi[] = [];
    const kq = await chayHangNgay({ client: c, co: { ngay: "2001-01-03", tranNgayUsd: 20, thu: false }, bayGio: BAY_GIO, taoModel: gatewayGia(ghi), ...im });
    assert.equal(ghi.length, 1, "DANG LAI KHONG CO NHAN");
    assert.deepEqual(kq.seGoi, [ids.p2]);
    const { rows } = await c.query(`SELECT count(*)::int n FROM silver_labels WHERE post_id = $1 AND json_ok`, [ids.p2]);
    assert.equal(rows[0].n, 1, "DANG LAI KHONG CO NHAN");
  });
});

test("PL34-AC-4 chạm trần giữa lượt: gọi tới trần, dừng có tên, mã 3; đối chứng trần rộng gọi hết", async () => {
  await withTx(async (c) => {
    await dungNgayD(c);
    const ghi: Ghi[] = [];
    const loi: string[] = [];
    const kq = await chayHangNgay({ client: c, co: { ngay: NGAY, tranNgayUsd: 0.015, thu: false }, bayGio: BAY_GIO, uoc: () => 0.01,
      taoModel: gatewayGia(ghi), log: () => {}, logLoi: (s) => loi.push(s) });
    assert.ok(ghi.length > 0, "TU CHOI CA LUOT");
    assert.equal(ghi.length, 3, "VUOT TRAN NGAY");
    const dong = loi.find((s) => s.includes(DONG_CHAM_TRAN)) ?? "";
    assert.match(dong, /CHAM TRAN DOC GOP HANG NGAY/);
    assert.match(dong, /0\.015/);
    assert.match(dong, /con lai 3/);
    assert.equal(kq.tomTat.cham_tran, true);
    assert.equal(kq.tomTat.con_lai, 3);
    assert.equal(kq.ma, 3);
  });
  await withTx(async (c) => {
    await dungNgayD(c);
    const ghi: Ghi[] = [];
    const kq = await chayHangNgay({ client: c, co: { ngay: NGAY, tranNgayUsd: 1, thu: false }, bayGio: BAY_GIO, uoc: () => 0.01, taoModel: gatewayGia(ghi), ...im });
    assert.equal(ghi.length, 6);
    assert.equal(kq.tomTat.cham_tran, false);
    assert.equal(kq.ma, 0);
  });
});

test("PL34-AC-4-DAT tiền thật lớn hơn ước: tổng tiền vẫn ≤ trần", async () => {
  await withTx(async (c) => {
    await dungNgayD(c);
    const ghi: Ghi[] = [];
    const kq = await chayHangNgay({ client: c, co: { ngay: NGAY, tranNgayUsd: 0.05, thu: false }, bayGio: BAY_GIO, uoc: () => 0.01,
      taoModel: gatewayGia(ghi, () => json17(), "0.03"), ...im });
    assert.equal(ghi.length, 1, "CHI THAT VUOT TRAN");
    assert.ok(kq.tomTat.usd <= 0.05, "CHI THAT VUOT TRAN");
    assert.equal(kq.ma, 3);
  });
});

async function chenTien(c: pg.Client, runId: string, usd: number) {
  await c.query(
    `INSERT INTO silver_labels (source_code, post_id, text_hash, model, prompt_version, listing_intent, json_ok, cost_usd, run_id)
     VALUES ('S03', $1, $1, 'gateway:thu', 'pl34-thu', 'unknown', true, $2, $3)`, [`pl34-tien-${process.pid}-${runId}`, usd, runId]);
}

test("PL34-AC-5 trần chia chung trong ngày chi, chi ngày khác không tính", async () => {
  await withTx(async (c) => {
    await dungNgayD(c);
    await chenTien(c, "pl34-2001-01-05-b2001-01-01-x", 0.02);
    await chenTien(c, "pl34-2001-01-04-b2001-01-01-y", 5);
    const ghi: Ghi[] = [];
    const kq = await chayHangNgay({ client: c, co: { ngay: NGAY, tranNgayUsd: 0.033, thu: false }, bayGio: BAY_GIO, uoc: () => 0.01, taoModel: gatewayGia(ghi), ...im });
    assert.ok(Math.abs(kq.tomTat.chi_ngay_truoc - 0.02) < 1e-9, "CONG CHI NGAY KHAC");
    assert.equal(ghi.length, 2, "TRAN KHONG CHIA CHUNG NGAY");
    assert.equal(kq.ma, 3);
  });
});

test("PL34-AC-5-DA-CHAM chi ngày đã ≥ trần: 0 lời gọi, dừng có tên", async () => {
  await withTx(async (c) => {
    await dungNgayD(c);
    await chenTien(c, "pl34-2001-01-05-b2001-01-01-x", 0.05);
    const ghi: Ghi[] = [];
    const loi: string[] = [];
    const kq = await chayHangNgay({ client: c, co: { ngay: NGAY, tranNgayUsd: 0.033, thu: false }, bayGio: BAY_GIO, uoc: () => 0.01,
      taoModel: gatewayGia(ghi), log: () => {}, logLoi: (s) => loi.push(s) });
    assert.equal(ghi.length, 0, "TRAN KHONG CHIA CHUNG NGAY");
    assert.ok(loi.some((s) => s.includes(DONG_CHAM_TRAN)));
    assert.equal(kq.ma, 3);
  });
});

test("PL34-AC-6 mọi lời gọi hỏng thì mã 1 gọi tên lớp hỏng; hỏng một phần thì mã 0 và đếm đúng", async () => {
  const chay = async (tra: (p: string) => string | Error) => withTx(async (c) => {
    await dungNgayD(c);
    const loi: string[] = [];
    const kq = await chayHangNgay({ client: c, co: { ngay: NGAY, tranNgayUsd: 20, thu: false }, bayGio: BAY_GIO, taoModel: gatewayGia([], tra), log: () => {}, logLoi: (s) => loi.push(s) });
    return { kq, loi: loi.join("\n") };
  });
  const a = await chay(() => new TypeError("mang"));
  assert.equal(a.kq.ma, 1);
  assert.match(a.loi, /moi loi goi hong/);
  assert.match(a.loi, /TypeError/);
  const b = await chay(() => "khong phai json");
  assert.equal(b.kq.ma, 1, "JSON HONG CA LUOT VAN THOAT 0");
  assert.match(b.loi, /moi loi goi hong/);
  assert.match(b.loi, /json-hong/);
  const m = M();
  const cc = await chay((p) => (p.includes(`Bán căn A ${m}`) ? new TypeError("mang") : p.includes(`Cho thuê B ${m}`) ? "khong phai json" : json17()));
  assert.equal(cc.kq.ma, 0);
  assert.equal(cc.kq.tomTat.loi, 1);
  assert.equal(cc.kq.tomTat.json_hong, 1);
});

test("PL34-AC-7 đầu vào sai thoát 2 trước DB và trước mọi lời gọi, thông điệp gọi tên chỗ sai", () => {
  const thuMuc = mkdtempSync(join(tmpdir(), "pl34-bang-"));
  const sai = join(thuMuc, "qwen.json");
  writeFileSync(sai, JSON.stringify({ phien_ban: 1, mac_dinh: "qwen", model: { haiku: { gateway: HAI, gia_vao: 0.1, gia_ra: 0.5 } }, o: { bathrooms: "nguoi" } }));
  const env: NodeJS.ProcessEnv = { ...process.env, DATABASE_URL: "postgresql://127.0.0.1:9/khong" };
  delete env.AI_GATEWAY_API_KEY;
  const ca: [string[], string][] = [
    [["--toan-bo"], "co khong nhan: --toan-bo"],
    [["--ngay", "2026-13-40"], "NGAY SAI KHUON: 2026-13-40"],
    [["--ngay", "hom-qua"], "NGAY SAI KHUON: hom-qua"],
    [["--tran-ngay-usd", "-1"], "TRAN SAI: -1"],
    [["--tran-ngay-usd", "abc"], "TRAN SAI: abc"],
    [["--cau-hinh", sai], "qwen"],
    [["--ngay", "2001-01-02"], "AI_GATEWAY_API_KEY"],
  ];
  for (const [args, can] of ca) {
    const r = spawnSync(process.execPath, ["--import", "tsx", "scripts/doc-gop-s03.ts", "hang-ngay", ...args], { cwd: AGENT, env, encoding: "utf8" });
    const ghim = can.startsWith("NGAY") ? "NGAY SAI VAN CHAY" : can === "AI_GATEWAY_API_KEY" ? "THIEU KHOA VAN CHAY" : "DAU VAO SAI VAN CHAY";
    assert.equal(r.status, 2, `${ghim} — ${args.join(" ")} (mã ${r.status}) ${r.stderr}`);
    assert.ok(r.stderr.includes(can), `${ghim} — ${args.join(" ")}: stderr thiếu «${can}»: ${r.stderr}`);
    assert.ok(!r.stderr.includes("ECONNREFUSED"), `${args.join(" ")}: đã chạm DB trước khi kiểm`);
  }
});

test("PL34-AC-7-GLM bảng chọn mac_dinh glm thì lời gọi đi tới mã Gateway của GLM", async () => {
  const thuMuc = mkdtempSync(join(tmpdir(), "pl34-bang-"));
  const tep = join(thuMuc, "glm.json");
  const goc = JSON.parse(readFileSync(join(AGENT, "config/doc-gop-s03.json"), "utf8"));
  writeFileSync(tep, JSON.stringify({ ...goc, mac_dinh: "glm" }));
  await withTx(async (c) => {
    await dungNgayD(c);
    const ghi: Ghi[] = [];
    await chayHangNgay({ client: c, co: { ngay: NGAY, tranNgayUsd: 20, thu: false, cauHinh: tep }, bayGio: BAY_GIO, taoModel: gatewayGia(ghi), ...im });
    assert.ok(ghi.length > 0);
    assert.ok(ghi.every((g) => g.gateway === "zai/glm-5.3-flash"), ghi.map((g) => g.gateway).join(","));
  });
});

/** Chạy bước đêm với node giả: ghi đối số mỗi lần gọi vào tệp, trả mã theo thứ tự `ma`. */
function chayBuoc(ma: number[], them: Record<string, string> = {}): { status: number | null; stderr: string; goi: string[] } {
  const thuMuc = mkdtempSync(join(tmpdir(), "pl34-buoc-"));
  const so = join(thuMuc, "goi.txt");
  const gia = join(thuMuc, "node-gia.sh");
  writeFileSync(gia, `#!/bin/bash\necho "$*" >> "${so}"\nn=$(wc -l < "${so}" | tr -d ' ')\nma=(${ma.join(" ")})\nexit "\${ma[$((n-1))]:-0}"\n`);
  chmodSync(gia, 0o755);
  const r = spawnSync("bash", [join(ROOT, "pipeline/doc-gop-hang-ngay.sh")], {
    env: { ...process.env, DOC_GOP_NODE: gia, DOC_GOP_BAY_GIO: "2026-11-08T01:00:00+07:00", ...them }, encoding: "utf8",
  });
  let goi: string[] = [];
  try { goi = readFileSync(so, "utf8").trim().split("\n"); } catch { /* không lần gọi nào */ }
  return { status: r.status, stderr: r.stderr, goi };
}

test("PL34-AC-8 bước đêm: hôm qua rồi hôm kia giờ VN, trần 20 mặc định, mã hỏng đầu tiên, bước kia vẫn chạy", () => {
  const a = chayBuoc([0, 0]);
  assert.equal(a.status, 0, a.stderr);
  assert.equal(a.goi.length, 2, "BUOC HOM KIA BI BO");
  assert.match(a.goi[0], /hang-ngay --ngay 2026-11-07 --tran-ngay-usd 20$/, "NGAY BUOC DEM SAI GIO VN");
  assert.match(a.goi[1], /hang-ngay --ngay 2026-11-06 --tran-ngay-usd 20$/, "NGAY BUOC DEM SAI GIO VN");
  const b = chayBuoc([0, 0], { DOC_GOP_TRAN_NGAY_USD: "7" });
  assert.ok(b.goi.every((g) => g.endsWith("--tran-ngay-usd 7")));
  const c3 = chayBuoc([3, 0]);
  assert.equal(c3.status, 3);
  assert.ok(c3.stderr.includes("JOB FAIL [doc-gop-hang-ngay] bước hom-qua mã 3"), c3.stderr);
  assert.equal(c3.goi.length, 2, "BUOC HOM KIA BI BO");
  const d = chayBuoc([0, 1]);
  assert.equal(d.status, 1);
  assert.ok(d.stderr.includes("JOB FAIL [doc-gop-hang-ngay] bước hom-kia mã 1"), d.stderr);
});


/** Hồ sơ doc-gop-env-rong: chạy bước đêm bằng /bin/bash (macOS: 3.2) trên một gốc kho tạm — có hay không `.env` tuỳ `coEnv`. */
function chayBuocGocTam(coEnv: boolean, tep = join(ROOT, "pipeline/doc-gop-hang-ngay.sh")): { status: number | null; stderr: string; goi: string[] } {
  const goc = mkdtempSync(join(tmpdir(), "dger-goc-"));
  for (const d of ["pipeline", "scripts/lib", "agent"]) mkdirSync(join(goc, d), { recursive: true });
  writeFileSync(join(goc, "pipeline/doc-gop-hang-ngay.sh"), readFileSync(tep, "utf8"));
  writeFileSync(join(goc, "scripts/lib/job-step.sh"), readFileSync(join(ROOT, "scripts/lib/job-step.sh"), "utf8"));
  if (coEnv) writeFileSync(join(goc, ".env"), "X=1\n");
  const so = join(goc, "goi.txt");
  const gia = join(goc, "node-gia.sh");
  writeFileSync(gia, `#!/bin/bash\necho "$*" >> "${so}"\n`);
  chmodSync(gia, 0o755);
  const r = spawnSync("/bin/bash", [join(goc, "pipeline/doc-gop-hang-ngay.sh")], {
    env: { ...process.env, DOC_GOP_NODE: gia, DOC_GOP_BAY_GIO: "2026-11-08T01:00:00+07:00" }, encoding: "utf8",
  });
  let goi: string[] = [];
  try { goi = readFileSync(so, "utf8").trim().split("\n"); } catch { /* không lần gọi nào */ }
  return { status: r.status, stderr: r.stderr, goi };
}

test("DGER-AC-1 kho không có .env: bước đêm chạy đủ hai bước, không cờ --env-file; có .env thì mang cờ", () => {
  const khong = chayBuocGocTam(false);
  assert.equal(khong.status, 0, `KHONG ENV THI HONG: ${khong.stderr}`);
  assert.equal(khong.goi.length, 2, `KHONG ENV THI HONG: ${khong.stderr}`);
  assert.ok(khong.goi.every((g) => !g.includes("--env-file")), khong.goi.join(" | "));
  const co = chayBuocGocTam(true);
  assert.equal(co.status, 0, co.stderr);
  assert.equal(co.goi.length, 2, co.stderr);
  assert.ok(co.goi.every((g) => /^--env-file=\S+\/\.env --import tsx scripts\/doc-gop-s03\.ts hang-ngay --ngay /.test(g)), `CO ENV MA MAT CO: ${co.goi.join(" | ")}`);
});

test("DGER-AC-2 đối chứng: bản trước vòng (\"${ENV_FILE[@]}\" trần) chết trên /bin/bash 3.2 khi không có .env", (t) => {
  const ban = spawnSync("/bin/bash", ["-c", "echo $BASH_VERSINFO"], { encoding: "utf8" }).stdout.trim();
  if (ban !== "3") return t.skip(`/bin/bash bản ${ban} không coi mảng rỗng là chưa đặt — đối chứng chỉ đo được trên bash 3`);
  const thuMuc = mkdtempSync(join(tmpdir(), "dger-cu-"));
  const cu = join(thuMuc, "doc-gop-hang-ngay.sh");
  const moi = readFileSync(join(ROOT, "pipeline/doc-gop-hang-ngay.sh"), "utf8");
  const ganCu = moi.replace('${ENV_FILE[@]+"${ENV_FILE[@]}"}', '"${ENV_FILE[@]}"');
  assert.notEqual(ganCu, moi, "KHONG TIM THAY CHO SUA");
  writeFileSync(cu, ganCu);
  const r = chayBuocGocTam(false, cu);
  assert.notEqual(r.status, 0, "DOI CHUNG KHONG DO");
  assert.match(r.stderr, /ENV_FILE\[@\]: unbound variable/, r.stderr);
  assert.equal(r.goi.length, 0, "DOI CHUNG KHONG DO");
});
