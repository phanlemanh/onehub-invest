// enrich-giao-dich.test.ts — hồ sơ enrich-chay-sau-nap: mỗi tin một giao dịch ngắn, đếm lỗi LLM, đếm thật, dấu đã thử.
// Chạy trong withTx (BEGIN…ROLLBACK trên Postgres local); giao dịch của tin là SAVEPOINT. LLM và E1 tiêm bằng stub;
// lỗi ghi tiêm bằng client bọc ném lỗi phía JS (Postgres không thấy lỗi, giao dịch ngoài không bị huỷ).
// Chiều đỏ: bản đột biến chép CẠNH tệp thật (tên bắt đầu «.dot-bien-»), nạp động, xoá ngay sau ca.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type pg from "pg";

import type { ContextResult } from "../src/agents/context-resolver.js";
import { parseEnrichOutput } from "../src/agents/enrich-text.js";
import { runEnrich, giaoDichSavepoint, type GiaoDich, type LlmFn, type ResolveFn } from "../src/enrich/run.js";
import { dongTongKet, maThoat, type DemLuot } from "../src/enrich/tong-ket.js";
import { withTx, insertOffer } from "./helpers/db.js";

const FIXTURES: { output: string }[] = JSON.parse(
  readFileSync(join(import.meta.dirname, "fixtures/llm-outputs.json"), "utf8"),
);
const LLM_OK = parseEnrichOutput(FIXTURES[0].output); // apartment · 2pn · «phố Ba Đình»
assert.ok(LLM_OK);

const ctx = (o: Partial<ContextResult> = {}): ContextResult => ({
  projectSlug: null, projectName: null, projectCandidates: [], propertyType: null,
  buildingHint: null, areaHint: null, matchedBy: "", ...o,
});
/** E1 có loại nhà nhưng không có dự án → vẫn cần LLM. */
const CAN_LLM: ResolveFn = async () => ctx({ propertyType: "apartment", matchedBy: "group_name" });
/** E1 đủ dự án + loại, văn bản đủ wc/đặc điểm/địa chỉ → needsLLM false. */
const KHONG_LLM: ResolveFn = async () =>
  ctx({ projectSlug: "du-an-thu", propertyType: "apartment", matchedBy: "group_name" });
const TEXT_LLM = "Bán gấp căn 2pn tầng trung phố Ba Đình, sẵn sổ, giá thương lượng";
const TEXT_DU = "Bán căn 2pn 2 wc phố Ba Đình, sẵn sổ, nội thất đầy đủ";

type KieuLlm = "ok" | "loi" | "rac";
/** Stub LLM theo hàng đợi (thứ tự gọi = thứ tự tin); ghi độ sâu giao dịch lúc được gọi. */
function llmTheo(kieu: KieuLlm[], doSau: () => number, thay: number[]): LlmFn {
  let i = 0;
  return async () => {
    thay.push(doSau());
    const k = kieu[i++] ?? "ok";
    if (k === "loi") return { result: null, model: "qwen27b", tracePath: null, loi: "APICallError" };
    if (k === "rac") return { result: null, model: "qwen27b", tracePath: "traces/t.jsonl" };
    return { result: LLM_OK, model: "qwen27b", tracePath: "traces/t.jsonl" };
  };
}

/** Bọc giaoDichSavepoint, đếm độ sâu để kiểm LLM được gọi NGOÀI giao dịch của tin. */
function giaoDichDem(c: pg.Client) {
  const goc = giaoDichSavepoint(c);
  let sau = 0;
  const gd: GiaoDich = async (fn) => {
    sau++;
    try { return await goc(fn); } finally { sau--; }
  };
  return { gd, doSau: () => sau };
}

/** Client bọc: ném lỗi (phía JS) ở câu ghi thứ k của tin `hong`. */
function clientHong(c: pg.Client, hong: string, k: number): pg.Client {
  let dang = false;
  let dem = 0;
  let daNem = false;
  const query = async (text: unknown, params?: unknown[]) => {
    const sql = typeof text === "string" ? text : "";
    if (/^\s*INSERT INTO enrichment_proposals/.test(sql)) dang = params?.[1] === hong;
    if (dang && !daNem && /^\s*(INSERT|UPDATE|SELECT apply_enrichment)/.test(sql) && ++dem === k) {
      daNem = true;
      throw Object.assign(new Error("boom (thử lỗi ghi)"), { code: "XX000" });
    }
    return (c.query as (t: unknown, p?: unknown[]) => Promise<pg.QueryResult>)(text, params);
  };
  return new Proxy(c, {
    get(t, p) {
      if (p === "query") return query;
      const v = Reflect.get(t, p);
      return typeof v === "function" ? v.bind(t) : v;
    },
  }) as pg.Client;
}

let seq = 0;
async function tin(c: pg.Client, text = TEXT_LLM): Promise<string> {
  const id = `t_gd_${String(++seq).padStart(4, "0")}`;
  await c.query(
    `INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('t', 'test', 'S03', '{}')
     ON CONFLICT (snapshot_id) DO NOTHING`,
  );
  await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, group_name) VALUES ($1, 't', $2, 'Nhóm thử')`, [
    `p_${id}`, text,
  ]);
  await insertOffer(c, { offer_id: id, post_ids: [`p_${id}`], property_type: "unknown" });
  return id;
}

const so = async (c: pg.Client, sql: string, p: unknown[]) => Number((await c.query(sql, p)).rows[0].n);
const deXuat = (c: pg.Client, id: string, runId: string) =>
  so(c, `SELECT count(*) n FROM enrichment_proposals WHERE offer_id=$1 AND run_id=$2`, [id, runId]);
const theCho = (c: pg.Client, id: string) =>
  so(c, `SELECT count(*) n FROM review_queue WHERE item_id=$1 AND status='pending'`, [`enrich:${id}`]);
const phatBieu = (c: pg.Client, id: string) =>
  so(c, `SELECT count(*) n FROM field_assertions WHERE subject_key=$1 AND method <> 'legacy'`, [`S03:p_${id}`]);
const daThu = (c: pg.Client, id: string) =>
  so(c, `SELECT count(*) n FROM ops_audit WHERE action='enrich:thu' AND detail->>'offer_id'=$1`, [id]);

type RunFn = typeof runEnrich;
let soDotBien = 0;
/** Nạp bản đột biến chép cạnh tệp thật (tên mới mỗi lần — ESM giữ cache theo đường dẫn); xoá ngay sau khi chạy fn. */
async function voiDotBien<M, T>(tep: string, doi: [string, string], fn: (m: M) => Promise<T>): Promise<T> {
  const goc = join(import.meta.dirname, "../src/enrich", tep);
  const src = readFileSync(goc, "utf8");
  assert.ok(src.includes(doi[0]), `đột biến không khớp chuỗi trong ${tep}: ${doi[0]}`);
  const p = join(import.meta.dirname, "../src/enrich", `.dot-bien-${process.pid}-${++soDotBien}-${tep}`);
  writeFileSync(p, src.replace(doi[0], doi[1]));
  try {
    return await fn((await import(pathToFileURL(p).href)) as M);
  } finally {
    rmSync(p, { force: true });
  }
}

// ── EC-AC-2 ─────────────────────────────────────────────────────────────────────────────────────────────────
async function kiemCoLapLoi(c: pg.Client, run: RunFn) {
  const [t1, t2, t3] = [await tin(c), await tin(c), await tin(c)];
  const { gd, doSau } = giaoDichDem(c);
  const thay: number[] = [];
  const runId = `test-gd-${seq}`;
  const { dem } = await run({
    client: clientHong(c, t2, 2), runId, dry: false, limit: 50, offerIds: [t1, t2, t3],
    llm: llmTheo(["ok", "ok", "ok"], doSau, thay), resolve: CAN_LLM, buildings: [], giaoDich: gd,
  });
  assert.equal(await deXuat(c, t2, runId), 0, "EC-AC-2 tin hỏng để lại đề xuất");
  assert.equal(await theCho(c, t2), 0, "EC-AC-2 tin hỏng để lại thẻ chờ");
  assert.equal(await phatBieu(c, t2), 0, "EC-AC-2 tin hỏng để lại phát biểu");
  assert.equal(await daThu(c, t2), 0, "EC-AC-2 tin hỏng có dấu đã thử");
  for (const t of [t1, t3]) {
    assert.ok((await deXuat(c, t, runId)) > 0, `EC-AC-2 tin lành ${t} không có đề xuất`);
    assert.equal(await daThu(c, t), 1, `EC-AC-2 tin lành ${t} thiếu dấu đã thử`);
  }
  assert.deepEqual(dem.loiGhi, [{ offer_id: t2, loi: "XX000" }], "EC-AC-2 loiGhi phải gọi tên tin hai");
  assert.equal(maThoat(dem), 2, "EC-AC-2 mã thoát");
  assert.deepEqual(thay, [0, 0, 0], "EC-AC-2 LLM gọi trong giao dịch mở");
}

test("EC-AC-2 cô lập lỗi ghi", async () => {
  await withTx((c) => kiemCoLapLoi(c, runEnrich));
});

test("EC-AC-2 chiều đỏ: bỏ giaoDich (ghi thẳng) → tin hỏng để lại đề xuất", async () => {
  await withTx((c) =>
    voiDotBien<{ runEnrich: RunFn }, void>("run.ts", ["const t = await giaoDich(ghi);", "const t = await ghi();"], (m) =>
      assert.rejects(kiemCoLapLoi(c, m.runEnrich), /EC-AC-2 tin hỏng để lại đề xuất/)),
  );
});

// ── EC-AC-3 ─────────────────────────────────────────────────────────────────────────────────────────────────
type Hang = { ten: string; llm: KieuLlm[] | null; hong: number; goi: number; loi: number; khongDoc: number };
const MA_TRAN: Hang[] = [
  { ten: "không gọi 0/0", llm: null, hong: 0, goi: 0, loi: 0, khongDoc: 0 },
  { ten: "sống 0/3", llm: ["ok", "ok", "ok"], hong: 0, goi: 3, loi: 0, khongDoc: 0 },
  { ten: "hỏng dưới nửa 1/3", llm: ["ok", "loi", "ok"], hong: 1, goi: 3, loi: 1, khongDoc: 0 },
  { ten: "hỏng từ nửa 2/3", llm: ["loi", "rac", "ok"], hong: 2, goi: 3, loi: 1, khongDoc: 1 },
  { ten: "lỗi hết 3/3", llm: ["loi", "loi", "loi"], hong: 3, goi: 3, loi: 3, khongDoc: 0 },
  { ten: "không đọc được hết 3/3", llm: ["rac", "rac", "rac"], hong: 3, goi: 3, loi: 0, khongDoc: 3 },
];
const MA_LANH = [0, 0, 0, 3, 3, 3];
const MA_HONG = [2, 2, 2, 2, 2, 2];

type O = { hang: Hang; ghiHong: boolean; dem: DemLuot; e1: number; thay: number[] };

/** So mã thoát của 12 ô với bảng viết trước; gom mọi ô lệch rồi ném một lần (thông điệp ghim theo lớp lệch). */
function kiemMaTran(o: O[], ma: (d: DemLuot) => number) {
  const lech: string[] = [];
  let soAssert = 0;
  for (const x of o) {
    const i = MA_TRAN.indexOf(x.hang);
    const muon = (x.ghiHong ? MA_HONG : MA_LANH)[i];
    const duoc = ma(x.dem);
    soAssert++;
    if (duoc === muon) continue;
    if (x.ghiHong && duoc === 3) lech.push(`chết LLM che lỗi ghi (${x.hang.ten})`);
    else if (x.dem.llmKhongDoc > 0 && duoc === 0) lech.push(`không đọc được hết mà thoát 0 (${x.hang.ten})`);
    else lech.push(`${x.hang.ten}${x.ghiHong ? " · tin hai ghi hỏng" : ""}: mã ${duoc}, muốn ${muon}`);
  }
  assert.equal(soAssert, 12, "EC-AC-3 số assert mã thoát phải bằng 12 ô");
  if (lech.length) assert.fail(`EC-AC-3 ${lech.join("; ")}`);
}

test("EC-AC-3 ma trận LLM × ghi", async () => {
  await withTx(async (c) => {
    const o: O[] = [];
    for (const ghiHong of [false, true]) {
      for (const hang of MA_TRAN) {
        const text = hang.llm ? TEXT_LLM : TEXT_DU;
        const ids = [await tin(c, text), await tin(c, text), await tin(c, text)];
        const { gd, doSau } = giaoDichDem(c);
        const thay: number[] = [];
        const runId = `test-mt-${seq}`;
        const { dem } = await runEnrich({
          client: ghiHong ? clientHong(c, ids[1], 2) : c, runId, dry: false, limit: 50, offerIds: ids,
          llm: llmTheo(hang.llm ?? [], doSau, thay), resolve: hang.llm ? CAN_LLM : KHONG_LLM,
          buildings: [], giaoDich: gd,
        });
        const e1 = await so(c, `SELECT count(*) n FROM enrichment_proposals WHERE run_id=$1 AND source='e1_rule'`, [runId]);
        o.push({ hang, ghiHong, dem, e1, thay });
      }
    }
    kiemMaTran(o, maThoat);
    for (const x of o) {
      const ten = `${x.hang.ten}${x.ghiHong ? " · ghi hỏng" : ""}`;
      assert.deepEqual([x.dem.llmGoi, x.dem.llmLoi, x.dem.llmKhongDoc], [x.hang.goi, x.hang.loi, x.hang.khongDoc], ten);
      const dong = dongTongKet(x.dem);
      assert.ok(
        dong.includes(`LLM hỏng ${x.hang.hong}/${x.hang.goi} (lỗi ${x.hang.loi} · không đọc được ${x.hang.khongDoc})`),
        `EC-AC-3 dòng tổng kết ${ten}: ${dong.join(" / ")}`,
      );
      assert.equal(dong.includes(`⚠ LLM hỏng 1/3`), x.hang.hong === 1, `EC-AC-3 dòng ⚠ ${ten}`);
      if (!x.ghiHong && maThoat(x.dem) === 3) assert.ok(x.e1 > 0, `EC-AC-3 ${ten} thoát 3 mà không có đề xuất E1`);
      assert.ok(x.thay.every((d) => d === 0), `EC-AC-3 ${ten}: LLM gọi trong giao dịch mở`);
    }
    // Chiều đỏ, cùng 12 ô: hai bản đột biến của luật mã thoát.
    await voiDotBien<{ maThoat: typeof maThoat }, void>(
      "tong-ket.ts",
      [
        "  if (d.loiGhi.length > 0) return 2;\n  if (d.llmGoi > 0 && 2 * hong(d) >= d.llmGoi) return 3;",
        "  if (d.llmGoi > 0 && 2 * hong(d) >= d.llmGoi) return 3;\n  if (d.loiGhi.length > 0) return 2;",
      ],
      async (m) => assert.throws(() => kiemMaTran(o, m.maThoat), /chết LLM che lỗi ghi/),
    );
    await voiDotBien<{ maThoat: typeof maThoat }, void>(
      "tong-ket.ts",
      ["const hong = (d: DemLuot) => d.llmLoi + d.llmKhongDoc;", "const hong = (d: DemLuot) => d.llmLoi;"],
      async (m) => assert.throws(() => kiemMaTran(o, m.maThoat), /không đọc được hết mà thoát 0/),
    );
  });
});

// ── EC-AC-4 ─────────────────────────────────────────────────────────────────────────────────────────────────
function kiemLuotHai(soMoi: number) {
  assert.equal(soMoi, 0, "EC-AC-4 lượt hai đếm đề xuất trùng");
}

test("EC-AC-4 đếm đúng", async () => {
  await withTx(async (c) => {
    const ids = [await tin(c), await tin(c)];
    const chay = (runId: string) =>
      runEnrich({
        client: c, runId, dry: false, limit: 50, offerIds: ids,
        llm: llmTheo(["ok", "ok"], () => 0, []), resolve: CAN_LLM, buildings: [],
      });
    const r1 = await chay("test-dem-1");
    const dem = (sql: string) => so(c, `SELECT count(*) n FROM enrichment_proposals WHERE run_id='test-dem-1' ${sql}`, []);
    assert.ok(r1.dem.deXuatMoi > 0, "EC-AC-4 lượt một không ghi đề xuất nào (đối chứng dương)");
    assert.equal(r1.dem.deXuatMoi, await dem(""), "EC-AC-4 đề xuất mới ≠ số dòng của run_id");
    assert.equal(r1.dem.daAp, await dem("AND status='applied'"), "EC-AC-4 đã áp ≠ số dòng applied");
    assert.equal(r1.dem.choDuyet, await dem("AND status='queued' AND route='review'"), "EC-AC-4 chờ duyệt ≠ số dòng queued");
    const truoc = await so(c, `SELECT count(*) n FROM enrichment_proposals WHERE offer_id = ANY($1)`, [ids]);
    const r2 = await chay("test-dem-2");
    kiemLuotHai(r2.dem.deXuatMoi);
    assert.equal(r2.dem.daAp, 0, "EC-AC-4 lượt hai áp lại");
    assert.equal(await so(c, `SELECT count(*) n FROM enrichment_proposals WHERE offer_id = ANY($1)`, [ids]), truoc,
      "EC-AC-4 lượt hai thêm dòng đề xuất");
    // Chiều đỏ, cùng lượt hai: đếm theo kết quả định tuyến (cách cũ) thì báo đề xuất trùng là mới.
    const s = r2.summary;
    assert.throws(() => kiemLuotHai(s.direct + s.corroborated + s.review), /EC-AC-4 lượt hai đếm đề xuất trùng/);
  });
});

// ── AC-9 mức hàm ────────────────────────────────────────────────────────────────────────────────────────────
test("EC-AC-9 dấu đã thử: LLM ném lỗi → không dấu; LLM sống → đúng một dấu", async () => {
  await withTx(async (c) => {
    const [a, b] = [await tin(c), await tin(c)];
    await runEnrich({
      client: c, runId: "test-thu", dry: false, limit: 50, offerIds: [a, b],
      llm: llmTheo(["loi", "ok"], () => 0, []), resolve: CAN_LLM, buildings: [],
    });
    assert.ok((await so(c, `SELECT count(*) n FROM enrichment_proposals WHERE offer_id=$1 AND source='e1_rule'`, [a])) > 0,
      "EC-AC-9 tin LLM lỗi vẫn phải ghi E1");
    assert.equal(await daThu(c, a), 0, "EC-AC-9 tin LLM lỗi có dấu đã thử");
    assert.equal(await daThu(c, b), 1, "EC-AC-9 tin LLM sống phải có đúng một dấu đã thử");
  });
});
