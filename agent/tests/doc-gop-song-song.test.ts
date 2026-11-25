// doc-gop-song-song.test.ts — HT6 `doc-gop-song-song-va-luot-bu`: đọc gộp gọi song song có trần (AC-1…AC-5), trần thời gian riêng
// và mã 75 (AC-6), lượt bù theo khoảng ngày (AC-7), khoá một lượt (AC-9). Hồ sơ: _acceptance/doc-gop-song-song-va-luot-bu/.
// Model giả là client Anthropic trong tiến trình (độ trễ, lỗi tiêm theo bài); bộ đếm «đang bay» đọc ở model giả, không từ chayLuot.
// Ca DB chạy trong BEGIN…ROLLBACK trên DB của riêng lượt (`npm test` → db/db-thu.sh --chay), ngày bài 2001 để dữ liệu thật không chen vào.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import pg from "pg";
import { chayLuot, type TomTatChay } from "../src/enrich/doc-gop-s03/chay.js";
import type { TaoAnthropic } from "../src/enrich/doc-gop-s03/doc.js";
import { chayBu, chayHangNgay, docCoBu, KHOA_LUOT, MA_DANG_CO_LUOT, MA_HET_GIO } from "../src/enrich/doc-gop-s03/hang-ngay.js";
import { FIELDS, type Field } from "../src/enrich/doc-gop-s03/o.js";
import type { The } from "../src/enrich/doc-gop-s03/the.js";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const AGENT = join(import.meta.dirname, "..");
const ROOT = join(AGENT, "..");
const ENV_KHOA = { ANTHROPIC_API_KEY: "khoa-gia", AI_GATEWAY_API_KEY: "khoa-gia" };

/** Bảng chọn tạm: Haiku theo `duong`, có/không tự lùi. */
function cauHinh(duong: string[], tuLui: boolean): string {
  const goc = JSON.parse(readFileSync(join(AGENT, "config/doc-gop-s03.json"), "utf8"));
  goc.model.haiku.duong = duong;
  goc.tu_lui = tuLui;
  const tep = join(mkdtempSync(join(tmpdir(), "ht6-cau-")), "doc-gop-s03.json");
  writeFileSync(tep, JSON.stringify(goc));
  return tep;
}
const CAU_A = cauHinh(["anthropic"], false);

function json17(): string {
  const o: Record<string, unknown> = {};
  for (const f of FIELDS as readonly Field[]) o[f] = { v: null, cc: null, trich: "" };
  return JSON.stringify(o);
}
const ngu = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Dem = { bay: number; bayMax: number; goi: string[]; batDau: number[] };
/** Client Anthropic giả: trễ `ms`, `loi(post)` trả lỗi (ném) hay null; usage cho tiền = vao*0,1/1e6 (gia Haiku trong bảng chọn). */
function anthropicGia(dem: Dem, o: { ms?: number; loi?: (post: string) => object | null; vao?: number; jsonHong?: (post: string) => boolean; sauBay?: () => void } = {}): TaoAnthropic {
  return () => ({
    messages: {
      create: async (req: { messages: { content: { type: string; text?: string }[] }[] }) => {
        const chu = req.messages[0].content.map((c) => c.text ?? "").join(" ");
        const post = /bai-(\S+)/.exec(chu)?.[1] ?? "?";
        dem.bay++;
        dem.bayMax = Math.max(dem.bayMax, dem.bay);
        dem.goi.push(post);
        dem.batDau.push(Date.now());
        o.sauBay?.();
        try {
          await ngu(o.ms ?? 20);
          const l = o.loi?.(post);
          if (l) throw l;
          return {
            content: [{ type: "text", text: o.jsonHong?.(post) ? "khong phai json" : json17() }], stop_reason: "end_turn",
            usage: { input_tokens: o.vao ?? 5000, output_tokens: 0 },
          };
        } finally {
          dem.bay--;
        }
      },
    },
  }) as never;
}
const moiDem = (): Dem => ({ bay: 0, bayMax: 0, goi: [], batDau: [] });

/** Thẻ giả (không DB): chữ mang «bai-<id>» để model giả biết bài nào. */
const cacThe = (n: number, tien = "x"): The[] =>
  Array.from({ length: n }, (_, i) => ({ post_id: `${tien}${i}`, text_hash: `h${tien}${i}`, group_name: null, group_note: null, text: `bai-${tien}${i} ban can ho`, anh: [], anh_thieu: 0 }));
/** Client DB giả: nhận mọi câu ghi, đếm. */
type DbGia = { query: (s: string, p?: unknown[]) => Promise<{ rows: unknown[]; rowCount: number }> };
const dbGia = () => { const ghi: unknown[] = []; const client: DbGia = { query: async (_s, p) => { ghi.push(p); return { rows: [], rowCount: 1 }; } }; return { ghi, client }; };
const im = () => {};

async function luot(the: The[], o: { songSong?: number; dem: Dem; tao: TaoAnthropic; tran?: number; cau?: string; uoc?: number; hetGio?: Date; goiDenTran?: boolean; nhip?: { tamDungMs?: number; tangLaiMs?: number }; nhat?: string[] }): Promise<TomTatChay & { ghiDb: number }> {
  const db = dbGia();
  const kq = await chayLuot({
    client: db.client as never, the, taoAnthropic: o.tao, recordCall: async () => {}, env: ENV_KHOA, songSong: o.songSong, nhip: o.nhip, goiDenTran: o.goiDenTran,
    uoc: o.uoc === undefined ? undefined : () => o.uoc!, log: (s) => o.nhat?.push(s),
    co: { post: the.map((t) => t.post_id), tranUsd: o.tran ?? 100, cauHinh: o.cau ?? CAU_A, runId: "ht6-test", hetGio: o.hetGio ?? null },
  });
  return { ...kq, ghiDb: db.ghi.length };
}

test("HT6-AC-1 đang bay lớn nhất đúng bằng số đặt; 4 lời nhanh hơn nửa bản tuần tự; mặc định 1", async () => {
  const d4 = moiDem();
  const t0 = Date.now();
  const k4 = await luot(cacThe(40), { songSong: 4, dem: d4, tao: anthropicGia(d4, { ms: 25 }) });
  const ms4 = Date.now() - t0;
  assert.equal(d4.bayMax, 4, `HT6-AC-1 đang bay lớn nhất ${d4.bayMax} ≠ 4`);
  assert.equal(k4.goi, 40);
  assert.equal(k4.bayMax, 4);
  const d1 = moiDem();
  const t1 = Date.now();
  await luot(cacThe(40), { songSong: 1, dem: d1, tao: anthropicGia(d1, { ms: 25 }) });
  const ms1 = Date.now() - t1;
  assert.equal(d1.bayMax, 1, `HT6-AC-1 đang bay lớn nhất ${d1.bayMax} ≠ 1`);
  assert.ok(ms4 < ms1 / 2, `HT6-AC-1 song song không nhanh hơn: ${ms4} ms so với ${ms1} ms`);
  const dm = moiDem();
  await luot(cacThe(8), { dem: dm, tao: anthropicGia(dm, { ms: 5 }) });
  assert.equal(dm.bayMax, 1, "HT6-AC-1 mặc định không còn tuần tự");
});

test("HT6-AC-1 chiều đỏ: bộ đếm của model giả thấy phát không trần (Promise.all) — thước không mù", async () => {
  const d = moiDem();
  const tao = anthropicGia(d, { ms: 10 });
  const c = tao();
  await Promise.all(Array.from({ length: 12 }, (_, i) => (c as unknown as { messages: { create: (r: unknown) => Promise<unknown> } }).messages.create({ messages: [{ content: [{ type: "text", text: `bai-r${i}` }] }] })));
  assert.equal(d.bayMax, 12, "bộ đếm đang bay của model giả không thấy phát song song");
});

test("HT6-AC-2 trần tiền không vượt khi chạy 4 lời cùng lúc; dừng có tên, đếm khớp", async () => {
  const d = moiDem();
  const nhat: string[] = [];
  // 100.000 token vào × 0,1 USD/triệu = 0,01 USD mỗi lời; ước cũng 0,01.
  const k = await luot(cacThe(20), { songSong: 4, dem: d, tao: anthropicGia(d, { ms: 15, vao: 100_000 }), tran: 0.055, uoc: 0.01, goiDenTran: true, nhat });
  assert.ok(k.usd <= 0.055 + 1e-9, `HT6-AC-2 vượt trần: ${k.usd}`);
  assert.ok(k.goi <= 5, `HT6-AC-2 vượt trần: ${k.goi} lời`);
  assert.equal(k.dungTran, true);
  assert.equal(k.goi + k.conLai, 20, "HT6-AC-2 đã gọi + còn lại ≠ cần gọi");
  assert.ok(nhat.some((s) => s.startsWith("cham tran 0.055 USD")), nhat.join("\n"));
});

test("HT6-AC-3 hết tiền có đường lùi: một dòng chuyen-duong, mọi bài có nhãn đúng một lần", async () => {
  const d = moiDem();
  const cau = cauHinh(["anthropic", "gateway"], true);
  // Đường anthropic hết tiền từ lời thứ 3; đường gateway giả trả JSON đủ (MockLanguageModel không cần — dùng taoModel giả).
  let thu = 0;
  const { MockLanguageModelV4 } = await import("ai/test");
  const db = dbGia();
  const daGhi = new Map<string, number>();
  const kq = await chayLuot({
    client: { query: async (s: string, p?: unknown[]) => { if (p && /silver_labels/.test(s)) daGhi.set(String(p[1]), (daGhi.get(String(p[1])) ?? 0) + 1); return db.client.query(s, p); } } as never,
    the: cacThe(12), env: ENV_KHOA, songSong: 4, recordCall: async () => {}, log: im,
    taoAnthropic: anthropicGia(d, { ms: 10, loi: () => (++thu >= 3 ? { status: 402, error: { type: "error", error: { type: "billing_error" } } } : null) }),
    taoModel: (g) => new MockLanguageModelV4({
      modelId: g,
      doGenerate: async () => ({ content: [{ type: "text", text: json17() }], finishReason: { unified: "stop", raw: "stop" },
        usage: { inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 10, text: 10, reasoning: undefined } }, warnings: [] }),
    } as never) as never,
    co: { post: [], tranUsd: 100, cauHinh: cau, runId: "ht6-ac3" },
  });
  assert.equal(kq.chuyenDuong.length, 1, `HT6-AC-3 số dòng chuyen-duong ${kq.chuyenDuong.length}`);
  assert.equal(kq.dung, null);
  assert.equal(daGhi.size, 12, `HT6-AC-3 mất bài: ${daGhi.size}/12 có nhãn`);
  assert.ok([...daGhi.values()].every((n) => n === 1), "HT6-AC-3 bài có nhãn hai lần");
});

test("HT6-AC-3 hết tiền không đường lùi: không lời nào phát sau khi lỗi về, mã dừng het-tien; 401 dừng khoa", async () => {
  const d = moiDem();
  let loiVe = -1;
  let n = 0;
  const kq = await luot(cacThe(30), {
    songSong: 4, dem: d,
    tao: anthropicGia(d, { ms: 15, loi: () => { n++; if (n === 3) { loiVe = d.goi.length; return { status: 402 }; } return null; } }),
  });
  assert.equal(kq.dung, "het-tien");
  // Lỗi về lúc đã phát `loiVe` lời; sau đó chỉ các lời đang bay (≤ 3) được phép đã phát — không lời mới.
  assert.ok(d.goi.length <= loiVe + 3, `HT6-AC-3 phát sau lớp dừng: ${d.goi.length} lời, lỗi về ở lời ${loiVe}`);
  assert.ok(kq.goi < 30);
  const d2 = moiDem();
  const k2 = await luot(cacThe(10), { songSong: 4, dem: d2, tao: anthropicGia(d2, { ms: 5, loi: () => ({ status: 401 }) }) });
  assert.equal(k2.dung, "khoa");
});

test("HT6-AC-4 429: lượt chạy hết, bài lỗi không ghi, hạ nhịp rồi tăng lại", async () => {
  const d = moiDem();
  const nhat: string[] = [];
  let n = 0;
  const bayTheoThoi: number[] = [];
  const kq = await luot(cacThe(40), {
    songSong: 4, dem: d, nhat, nhip: { tamDungMs: 30, tangLaiMs: 80 },
    tao: anthropicGia(d, { ms: 20, loi: () => (++n <= 3 ? { status: 429 } : null), sauBay: () => bayTheoThoi.push(d.bay) }),
  });
  assert.equal(kq.dung, null);
  assert.equal(kq.goi, 40, "HT6-AC-4 lượt dừng giữa chừng");
  assert.equal(kq.loi, 3);
  assert.equal(kq.ghiDb, 37, `HT6-AC-4 bài lỗi 429 vẫn ghi nhãn: ${kq.ghiDb}`);
  assert.ok(nhat.some((s) => s.startsWith("han-muc: ha con")), "HT6-AC-4 không hạ nhịp");
  // Sau lỗi: một quãng chỉ ≤ 3 cùng lúc, rồi về lại 4.
  const sauLoi = bayTheoThoi.slice(6);
  assert.ok(sauLoi.some((b) => b < 4), "HT6-AC-4 không hạ nhịp");
  assert.ok(nhat.some((s) => s.startsWith("han-muc: tang lai 4")), `HT6-AC-4 không tăng lại nhịp\n${nhat.join("\n")}`);
  assert.equal(Math.max(...bayTheoThoi.slice(-10)), 4, "HT6-AC-4 không tăng lại nhịp");
});

test("HT6-AC-6 hết giờ giữa lượt: không lời nào phát sau mốc, lời đang bay được ghi, cờ hetGio", async () => {
  const d = moiDem();
  const moc = new Date(Date.now() + 120);
  const kq = await luot(cacThe(60), { songSong: 2, dem: d, tao: anthropicGia(d, { ms: 40 }), hetGio: moc });
  assert.equal(kq.hetGio, true);
  assert.ok(d.batDau.every((t) => t < moc.getTime()), "HT6-AC-6 phát sau mốc");
  assert.equal(kq.ghiDb, kq.goi, "HT6-AC-6 lời đang bay không được ghi");
  assert.equal(kq.goi + kq.conLai, 60);
  assert.ok(kq.conLai > 0);
});

// ── Ca DB ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const SNAP = "hanoi__zalo-agent__2001-01-02T000000000";
const BAY_GIO = new Date("2001-01-06T03:00:00+07:00");

async function moi(): Promise<pg.Client> { const c = new pg.Client({ connectionString: DB_URL }); await c.connect(); return c; }
async function withTx<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = await moi();
  try { await c.query("BEGIN"); return await fn(c); } finally { await c.query("ROLLBACK").catch(() => {}); await c.end(); }
}
/** n bài chữ mỗi ngày (giờ VN 10:00), chữ mang «bai-<key>». */
async function chenNgay(c: pg.Client, ngay: string, n: number, tien: string): Promise<string[]> {
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'zalo-agent', '{}'::jsonb) ON CONFLICT DO NOTHING`, [SNAP]);
  const ids: string[] = [];
  for (let i = 0; i < n; i++) {
    const post = `ht6-${process.pid}-${tien}${i}`;
    ids.push(post);
    await c.query(
      `INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, posted_at, text, captured_at, conversation_id, media, agent_id, media_files)
       VALUES ($1, $2, 'Nhóm thử HT6', $3, $4, $3, NULL, '[]', NULL, '[]')`,
      [post, SNAP, `${ngay}T10:${String(i).padStart(2, "0")}:00+07:00`, `bai-${tien}${i} ban can ho ${process.pid} so ${i}`]);
  }
  return ids;
}

test("HT6-AC-5 song song 4 và tuần tự ghi cùng tập nhãn; mỗi lời một dòng ai_calls; không gọi đôi", async () => {
  const chay = (ss: number) => withTx(async (c) => {
    await chenNgay(c, "2001-01-02", 16, "s");
    const d = moiDem();
    const kq = await chayHangNgay({
      client: c, bayGio: BAY_GIO, log: im, logLoi: im, co: { ngay: "2001-01-02", tranNgayUsd: 20, thu: false, cauHinh: CAU_A, songSong: ss },
      taoAnthropic: anthropicGia(d, { ms: 10, jsonHong: (p) => p.endsWith("3") || p.endsWith("7") }),
    });
    const { rows } = await c.query(`SELECT post_id, model, json_ok FROM silver_labels WHERE run_id LIKE 'pl34-2001-01-06-%' ORDER BY post_id`);
    const ai = Number((await c.query(`SELECT count(*) n FROM ai_calls WHERE trace LIKE 'pl34-2001-01-06-%'`)).rows[0].n);
    return { tap: rows.map((r) => `${r.post_id}|${r.model}|${r.json_ok}`), ai, goi: kq.tomTat.goi, lap: d.goi.length - new Set(d.goi).size };
  });
  const a = await chay(1), b = await chay(4);
  assert.ok(a.tap.length > 0 && a.tap.some((x) => x.endsWith("|true")) && a.tap.some((x) => x.endsWith("|false")), "HT6-AC-5 đối chứng dương: tập rỗng hay thiếu một loại json_ok");
  assert.deepEqual(b.tap.map((x) => x.replace(/^ht6-\d+-/, "")), a.tap.map((x) => x.replace(/^ht6-\d+-/, "")), "HT6-AC-5 tập nhãn khác nhau giữa 1 và 4");
  assert.equal(b.ai, b.goi, "HT6-AC-5 số dòng ai_calls ≠ số lời gọi");
  assert.equal(b.lap, 0, "HT6-AC-5 một bài bị gọi hai lần");
});

test("HT6-AC-6 hang-ngay hết giờ: mã 75, dòng WARN nêu ngày và số còn lại; chạy lại đọc đúng phần còn lại", async () => {
  await withTx(async (c) => {
    await chenNgay(c, "2001-01-02", 30, "g");
    const loi: string[] = [];
    const d = moiDem();
    const k1 = await chayHangNgay({
      client: c, bayGio: BAY_GIO, log: im, logLoi: (s) => loi.push(s), taoAnthropic: anthropicGia(d, { ms: 40 }),
      co: { ngay: "2001-01-02", tranNgayUsd: 20, thu: false, cauHinh: CAU_A, songSong: 2, hetGio: new Date(Date.now() + 150) },
    });
    assert.equal(k1.ma, MA_HET_GIO, `HT6-AC-6 mã ${k1.ma}`);
    assert.ok(k1.tomTat.con_lai > 0);
    assert.ok(loi.includes(`JOB WARN [doc-gop-hang-ngay] het-gio: 2001-01-02 con lai ${k1.tomTat.con_lai} loi goi`), loi.join("\n"));
    const d2 = moiDem();
    const k2 = await chayHangNgay({ client: c, bayGio: BAY_GIO, log: im, logLoi: im, taoAnthropic: anthropicGia(d2, { ms: 1 }), co: { ngay: "2001-01-02", tranNgayUsd: 20, thu: false, cauHinh: CAU_A, songSong: 4 } });
    assert.equal(k2.ma, 0);
    assert.equal(d2.goi.length, k1.tomTat.con_lai, "HT6-AC-6 chạy lại không đọc đúng phần còn lại");
    assert.equal(new Set([...d.goi, ...d2.goi]).size, d.goi.length + d2.goi.length, "HT6-AC-6 chạy lại gọi lại bài đã đọc");
  });
});

/** Bước đêm với node giả: ghi đối số + hai biến HT6 mỗi lần gọi; `--thu` in dòng «… 7 can goi …»; mã theo thứ tự `ma`. */
function chayBuoc(ma: number[], them: Record<string, string> = {}): { status: number | null; stderr: string; goi: string[]; t0: number } {
  const thuMuc = mkdtempSync(join(tmpdir(), "ht6-buoc-"));
  const so = join(thuMuc, "goi.txt");
  const gia = join(thuMuc, "node-gia.sh");
  writeFileSync(gia, `#!/bin/bash\necho "$* SS=$DOC_GOP_SONG_SONG HG=$DOC_GOP_HET_GIO" >> "${so}"\ncase "$*" in *--thu*) echo "hang-ngay x (chi y): 9 bai tho, 8 don vi, 1 da doc, 7 can goi, uoc 0.01 USD"; exit 0;; esac\nn=$(grep -vc -- '--thu' "${so}" | tr -d ' ')\nma=(${ma.join(" ")})\nexit "\${ma[$((n-1))]:-0}"\n`);
  chmodSync(gia, 0o755);
  const env: Record<string, string | undefined> = { ...process.env, DOC_GOP_NODE: gia, DOC_GOP_BAY_GIO: "2026-11-08T01:00:00+07:00", ...them };
  if (!("DOC_GOP_SONG_SONG" in them)) delete env.DOC_GOP_SONG_SONG;
  if (!("DOC_GOP_TRAN_GIAY" in them)) delete env.DOC_GOP_TRAN_GIAY;
  const t0 = Date.now();
  const r = spawnSync("bash", [join(ROOT, "pipeline/doc-gop-hang-ngay.sh")], { env: env as NodeJS.ProcessEnv, encoding: "utf8" });
  let goi: string[] = [];
  try { goi = readFileSync(so, "utf8").trim().split("\n"); } catch { /* không lần gọi nào */ }
  return { status: r.status, stderr: r.stderr, goi, t0 };
}
const hg = (dong: string) => Date.parse(/HG=(\S+)/.exec(dong)?.[1] ?? "");

test("HT6-AC-6 bước đêm: mặc định 4 lời cùng lúc và mốc chung = bây giờ + 9000 s; hôm qua hết giờ thì bỏ hôm kia có ngày và số; mã 75", () => {
  const a = chayBuoc([0, 0]);
  assert.equal(a.status, 0, a.stderr);
  assert.equal(a.goi.length, 2);
  assert.ok(a.goi.every((g) => g.includes("SS=4")), `HT6-AC-6 số lời cùng lúc mặc định: ${a.goi.join(" | ")}`);
  assert.equal(hg(a.goi[0]), hg(a.goi[1]), "HT6-AC-6 hai bước khác mốc hết giờ");
  assert.ok(Math.abs(hg(a.goi[0]) - (a.t0 + 9000e3)) < 60e3, `HT6-AC-6 mốc mặc định lệch: ${a.goi[0]}`);
  const b = chayBuoc([0, 0], { DOC_GOP_TRAN_GIAY: "60", DOC_GOP_SONG_SONG: "2" });
  assert.ok(Math.abs(hg(b.goi[0]) - (b.t0 + 60e3)) < 30e3);
  assert.ok(b.goi.every((g) => g.includes("SS=2")));
  const c = chayBuoc([75]);
  assert.equal(c.status, 75, c.stderr);
  assert.ok(c.stderr.includes("JOB WARN [doc-gop-hang-ngay] het-gio: bo buoc hom-kia 2026-11-06 con lai 7"), `HT6-AC-6 dòng bỏ hôm kia\n${c.stderr}`);
  assert.equal(c.goi.filter((g) => !g.includes("--thu")).length, 1, "HT6-AC-6 hôm kia vẫn chạy sau khi hết giờ");
  const d = chayBuoc([0, 75]);
  assert.equal(d.status, 75);
  const e = chayBuoc([3, 75]);
  assert.equal(e.status, 3, "HT6-AC-6 mã lỗi 3 phải thắng 75");
  // PL34-AC-8 giữ nguyên: đối số không đổi (hai biến đi bằng môi trường).
  assert.match(a.goi[0], /hang-ngay --ngay 2026-11-07 --tran-ngay-usd 20 SS=/);
});

test("HT6-AC-7 bu --thu: từng ngày + dòng tổng, 0 lời model, 0 dòng ghi; chạy thật đọc ngày cũ trước, run_id -bu-, trần lượt", async () => {
  await withTx(async (c) => {
    await chenNgay(c, "2001-01-02", 3, "a");
    await chenNgay(c, "2001-01-03", 3, "b");
    await chenNgay(c, "2001-01-04", 3, "c");
    const nhat: string[] = [];
    const d = moiDem();
    const thu = await chayBu({ client: c, bayGio: BAY_GIO, log: (s) => nhat.push(s), logLoi: im, taoAnthropic: anthropicGia(d), co: { tu: "2001-01-02", den: "2001-01-04", tranNgayUsd: 20, tranLuotUsd: null, cauHinh: CAU_A, thu: true } });
    assert.equal(thu.ma, 0);
    for (const n of ["2001-01-02", "2001-01-03", "2001-01-04"]) assert.ok(nhat.some((s) => s.startsWith(`hang-ngay ${n}`)), `HT6-AC-7 thiếu dòng ngày ${n}`);
    assert.ok(nhat.some((s) => s.startsWith("bu tong 2001-01-02..2001-01-04: 3 ngay")), nhat.join("\n"));
    assert.equal(thu.tong.can_goi, 9);
    assert.equal(d.goi.length, 0, "HT6-AC-7 --thu gọi model");
    assert.equal(Number((await c.query(`SELECT count(*) n FROM silver_labels WHERE run_id LIKE 'pl34-2001-01-06-%'`)).rows[0].n), 0, "HT6-AC-7 --thu ghi nhãn");
    const that = await chayBu({ client: c, bayGio: BAY_GIO, log: im, logLoi: im, taoAnthropic: anthropicGia(d, { ms: 1 }), co: { tu: "2001-01-02", den: "2001-01-04", tranNgayUsd: 20, tranLuotUsd: null, cauHinh: CAU_A, thu: false, songSong: 1 } });
    assert.equal(that.ma, 0);
    assert.deepEqual(d.goi.map((p) => p[0]), ["a", "a", "a", "b", "b", "b", "c", "c", "c"], `HT6-AC-7 không đọc ngày cũ trước: ${d.goi.join(",")}`);
    const run = (await c.query(`SELECT DISTINCT run_id FROM silver_labels WHERE run_id LIKE 'pl34-2001-01-06-%'`)).rows.map((r) => r.run_id as string);
    assert.ok(run.length === 3 && run.every((r) => r.includes("-bu-")), run.join(","));
  });
  await withTx(async (c) => {
    await chenNgay(c, "2001-01-02", 6, "t");
    const d = moiDem();
    // ước ~0,0005 USD/lời; trần lượt 0,0012 → dừng sau ~2 lời, mã 3.
    const kq = await chayBu({ client: c, bayGio: BAY_GIO, log: im, logLoi: im, taoAnthropic: anthropicGia(d, { ms: 1 }), co: { tu: "2001-01-02", den: "2001-01-02", tranNgayUsd: 20, tranLuotUsd: 0.0012, cauHinh: CAU_A, thu: false } });
    assert.equal(kq.ma, 3, "HT6-AC-7 trần lượt không chặn");
    assert.ok(kq.tong.usd <= 0.0012 + 1e-9);
  });
});

test("HT6-AC-7 khoảng sai thoát 2 trước khi nối DB", () => {
  for (const [args, mau] of [
    [["--tu", "2001-1-2", "--den", "2001-01-04"], /NGAY SAI KHUON/],
    [["--tu", "2001-01-05", "--den", "2001-01-04"], /KHOANG NGUOC/],
    [["--tu", "2001-01-01", "--den", "2001-01-20"], /KHOANG QUA DAI/],
  ] as const) {
    assert.throws(() => docCoBu([...args]), mau);
    const r = spawnSync(process.execPath, ["--import", "tsx", "scripts/doc-gop-s03.ts", "bu", ...args, "--thu"],
      { cwd: AGENT, env: { ...process.env, DATABASE_URL: "postgres://127.0.0.1:9/z" }, encoding: "utf8" });
    assert.equal(r.status, 2, `HT6-AC-7 ${args.join(" ")}: mã ${r.status}\n${r.stderr}`);
    assert.doesNotMatch(r.stderr, /ECONNREFUSED/);
  }
});

test("HT6-AC-9 lượt thật thứ hai lúc khoá đang giữ: mã 6, 0 lời model, 0 dòng ghi; --thu vẫn chạy; nhả khoá thì chạy bình thường", async () => {
  const giu = await moi();
  try {
    await giu.query(`SELECT pg_advisory_lock($1, $2)`, KHOA_LUOT);
    await withTx(async (c) => {
      await chenNgay(c, "2001-01-02", 4, "k");
      const loi: string[] = [];
      const d = moiDem();
      const k = await chayHangNgay({ client: c, bayGio: BAY_GIO, log: im, logLoi: (s) => loi.push(s), taoAnthropic: anthropicGia(d), co: { ngay: "2001-01-02", tranNgayUsd: 20, thu: false, cauHinh: CAU_A } });
      assert.equal(k.ma, MA_DANG_CO_LUOT, `HT6-AC-9 chạy chồng: mã ${k.ma}`);
      assert.equal(d.goi.length, 0, "HT6-AC-9 chạy chồng");
      assert.ok(loi.some((s) => s.startsWith("JOB FAIL [doc-gop-s03] dang-co-luot-khac")), loi.join("\n"));
      assert.equal(Number((await c.query(`SELECT count(*) n FROM silver_labels WHERE run_id LIKE 'pl34-2001-01-06-%'`)).rows[0].n), 0);
      const thu = await chayHangNgay({ client: c, bayGio: BAY_GIO, log: im, logLoi: im, co: { ngay: "2001-01-02", tranNgayUsd: 20, thu: true, cauHinh: CAU_A } });
      assert.equal(thu.ma, 0);
      await giu.query(`SELECT pg_advisory_unlock($1, $2)`, KHOA_LUOT);
      const k2 = await chayHangNgay({ client: c, bayGio: BAY_GIO, log: im, logLoi: im, taoAnthropic: anthropicGia(d, { ms: 1 }), co: { ngay: "2001-01-02", tranNgayUsd: 20, thu: false, cauHinh: CAU_A } });
      assert.equal(k2.ma, 0);
      assert.equal(d.goi.length, 4, "HT6-AC-9 đối chứng dương: nhả khoá mà không chạy");
    });
  } finally {
    await giu.query(`SELECT pg_advisory_unlock_all()`).catch(() => {});
    await giu.end();
  }
});
