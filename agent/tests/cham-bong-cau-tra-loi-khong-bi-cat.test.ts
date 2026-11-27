// cham-bong-cau-tra-loi-khong-bi-cat.test.ts — hàng sửa bộ chạy chấm bóng NB1: trần token ra theo số ô, lời gọi chạm trần ghi «bi-cat».
// Tên ca bắt đầu bằng mã AC để probe _acceptance/cham-bong-cau-tra-loi-khong-bi-cat/probes/cham.sh lọc. Mã nguồn nạp theo
// CHAM_BONG_SRC (mặc định «cham-bong») để probe đột biến chạy cùng bộ ca trên bản sao đã sửa. Không cần DB: Truy giả trả dòng thẻ.
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const SRC = process.env.CHAM_BONG_SRC ?? "cham-bong";
const DOC = (await import(`../src/enrich/${SRC}/doc.js`)) as typeof import("../src/enrich/cham-bong/doc.js");
const CHAY = (await import(`../src/enrich/${SRC}/chay.js`)) as typeof import("../src/enrich/cham-bong/chay.js");
const PR = (await import(`../src/enrich/${SRC}/prompt.js`)) as typeof import("../src/enrich/cham-bong/prompt.js");
const KHO = (await import(`../src/enrich/${SRC}/kho.js`)) as typeof import("../src/enrich/cham-bong/kho.js");
const BC = (await import(`../src/enrich/${SRC}/bao-cao.js`)) as typeof import("../src/enrich/cham-bong/bao-cao.js");
const CH = (await import(`../src/enrich/${SRC}/cau-hinh.js`)) as typeof import("../src/enrich/cham-bong/cau-hinh.js");
type ModelCham = import("../src/enrich/cham-bong/cau-hinh.js").ModelCham;
type CauHinhCham = import("../src/enrich/cham-bong/cau-hinh.js").CauHinhCham;
type GoiModel = import("../src/enrich/cham-bong/doc.js").GoiModel;
type LopGoi = import("../src/enrich/cham-bong/doc.js").LopGoi;
type OCham = import("../src/enrich/cham-bong/ket-cuc.js").OCham;
type AiCallRecord = import("../src/runtime/ai-call-log.js").AiCallRecord;

const O5: OCham[] = ["bathrooms", "bedrooms", "block_raw", "street_raw", "property_type"];
const BAI = "Bán căn hộ 2PN 2WC toà S1.03 đường Nguyễn Văn Linh, nội thất đầy đủ.";
const JSON_DU = JSON.stringify({ bathrooms: { v: "2", trich: "2WC", can_cu: "Bài ghi 2WC." } });
const JSON_CUT = '{"bathrooms":{"v":"2","trich":"2WC","can_cu":"Bài gh';
const MH: ModelCham = { khoa: "haiku", gateway: "anthropic/claude-haiku-5.5", duong: ["anthropic", "gateway"], gia_vao: 0.1, gia_ra: 0.5 };
const MD: ModelCham = { khoa: "deepseek", gateway: "deepseek/deepseek-v4.1-flash-1017", duong: ["gateway"], gia_vao: 0.3, gia_ra: 1.2 };
const CAU: CauHinhCham = { phien_ban: 1, prompt_version: "cb-v1", tran_usd: 3, model: [MH, MD] };
const tam = () => mkdtempSync(join(tmpdir(), "cb-cat-"));
const docJsonl = (p: string) => (existsSync(p) ? readFileSync(p, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);

/** Dòng thẻ như CAU_THE trả, cho Truy giả. Chữ bài mang mã thẻ để mỗi thẻ có khoá dùng lại riêng. */
const dongThe = (review_id: number, o: OCham[], text = `${BAI} Mã ${review_id}.`) => ({
  review_id, offer_id: `offer_${review_id}`, co_tin: true, source: "S03", text, group_name: "Nhóm A",
  de_xuat: o.map((f, i) => ({ id: review_id * 10 + i, field: f, value: "2", source: "e2_llm", o_da_co: false })),
});
const truyGia = (rows: unknown[]) => async () => ({ rows });
const chayGia = (rows: unknown[], goi: GoiModel, thuMuc: string, them: Record<string, unknown> = {}) =>
  CHAY.chay({ truy: truyGia(rows), cauHinh: CAU, cheDo: "thu", goi, recordCallDb: async () => {}, thuMuc, runId: `r${Date.now()}${Math.random()}`, env: {}, ...them });

// ---------- AC-1: trần token ra theo số ô ----------
test("AC-1 tranTokenRa theo số ô: ma trận n = 1..5 viết tay", () => {
  const MONG = [1000, 1600, 2200, 2800, 3400];
  for (let n = 1; n <= 5; n++) assert.equal(DOC.tranTokenRa(n), MONG[n - 1], `n=${n}: trần ${DOC.tranTokenRa(n)}, mong ${MONG[n - 1]}`);
});

test("AC-1 docMot truyền trần 400 + 600 × n của thẻ tới lớp gọi", async () => {
  for (let n = 1; n <= 5; n++) {
    let nhan = -1;
    const goi: GoiModel = async (_m, _d, _p, maxRa) => { nhan = maxRa; return { text: JSON_DU, vao: 1, ra: 1 }; };
    await DOC.docMot({ model: MD, dauVao: { text: BAI, group_name: null, o: O5.slice(0, n) }, goi, recordCall: async () => {}, trace: "t" });
    assert.equal(nhan, 400 + 600 * n, `n=${n}: trần ${nhan}, mong ${400 + 600 * n}`);
  }
});

const lopGia = (o: { stop?: string | null; finish?: string; text?: string } = {}) => {
  const bat: { anthropic: number[]; gateway: number[] } = { anthropic: [], gateway: [] };
  const lop: LopGoi = {
    anthropic: async (q) => { bat.anthropic.push(q.max_tokens); return { content: [{ type: "text", text: o.text ?? JSON_DU }], usage: { input_tokens: 10, output_tokens: 20 }, stop_reason: o.stop ?? "end_turn" }; },
    gateway: async (q) => { bat.gateway.push(q.maxOutputTokens); return { text: o.text ?? JSON_DU, usage: { inputTokens: 10, outputTokens: 20 }, finishReason: o.finish ?? "stop" }; },
  };
  return { bat, goi: DOC.taoGoiModel(lop) };
};

test("AC-1 lớp gọi: trần vào max_tokens (Anthropic) và maxOutputTokens (Gateway)", async () => {
  const g = lopGia();
  const p = { system: "s", user: "u" };
  await g.goi(MH, "anthropic", p, DOC.tranTokenRa(3));
  await g.goi(MD, "gateway", p, DOC.tranTokenRa(3));
  assert.deepEqual(g.bat.anthropic, [2200], `anthropic max_tokens ${g.bat.anthropic}, mong 2200`);
  assert.deepEqual(g.bat.gateway, [2200], `gateway maxOutputTokens ${g.bat.gateway}, mong 2200`);
});

// ---------- AC-2: chạm trần → bi-cat ----------
test("AC-2 lớp gọi nhận ra hết token: stop_reason max_tokens, finishReason length", async () => {
  const p = { system: "s", user: "u" };
  const ca: [string, ReturnType<typeof lopGia>, ModelCham, "anthropic" | "gateway", boolean][] = [
    ["anthropic max_tokens", lopGia({ stop: "max_tokens" }), MH, "anthropic", true],
    ["anthropic end_turn", lopGia({ stop: "end_turn" }), MH, "anthropic", false],
    ["gateway length", lopGia({ finish: "length" }), MD, "gateway", true],
    ["gateway stop", lopGia({ finish: "stop" }), MD, "gateway", false],
  ];
  for (const [ten, g, m, d, mong] of ca) {
    const r = await g.goi(m, d, p, 1000);
    assert.equal(r.cat, mong, `${ten}: cat=${r.cat}, mong ${mong}`);
  }
});

test("AC-2 lời gọi bị cắt là lỗi bi-cat (JSON cụt hay JSON tách được), một dòng sổ có token thật", async () => {
  for (const [ten, text] of [["JSON cụt", JSON_CUT], ["JSON tách được", JSON_DU]] as const) {
    const so: AiCallRecord[] = [];
    const goi: GoiModel = async () => ({ text, vao: 500, ra: 1600, cat: true });
    const k = await DOC.docMot({ model: MD, dauVao: { text: BAI, group_name: null, o: ["bathrooms", "bedrooms"] }, goi, recordCall: async (r) => { so.push(r); }, trace: "t" });
    assert.ok(!k.ok && k.loi === "bi-cat", `${ten}: ok=${k.ok} loi=${k.ok ? "-" : k.loi}, mong bi-cat`);
    assert.equal(so.length, 1, `${ten}: ${so.length} dòng sổ, mong 1`);
    assert.equal(so[0].loi, "bi-cat", `${ten}: sổ loi=${so[0].loi}, mong bi-cat`);
    assert.equal(so[0].outputTokens, 1600, `${ten}: sổ token ra ${so[0].outputTokens}, mong 1600`);
  }
  // Đối chứng dương: cùng chữ JSON đầy đủ, không bị cắt → đọc thành công.
  const goiOk: GoiModel = async () => ({ text: JSON_DU, vao: 500, ra: 300, cat: false });
  const k = await DOC.docMot({ model: MD, dauVao: { text: BAI, group_name: null, o: ["bathrooms"] }, goi: goiOk, recordCall: async () => {}, trace: "t" });
  assert.ok(k.ok && k.o.bathrooms.v === "2", "đối chứng dương: JSON đầy đủ không bị cắt phải đọc thành công");
});

test("AC-2 lần đọc bi-cat không vào kho dùng lại và không sinh kết cục", async () => {
  const thuMuc = tam();
  const goi: GoiModel = async (m) => (m.khoa === "haiku" ? { text: JSON_DU, vao: 1, ra: 1600, cat: true } : { text: JSON_DU, vao: 1, ra: 1 });
  const tk = await chayGia([dongThe(1, ["bathrooms"])], goi, thuMuc);
  const kho = docJsonl(join(thuMuc, "kho.jsonl"));
  assert.equal(kho.length, 1, `kho ${kho.length} dòng, mong 1 (chỉ lần đọc DeepSeek)`);
  assert.equal(kho[0].doc.gateway, MD.gateway, "kho nhận lần đọc bị cắt");
  const kc = docJsonl(join(thuMuc, tk.run_id, "ket-qua.jsonl")).filter((d) => d.loai === "ket-cuc");
  assert.equal(kc.length, 1);
  assert.equal(kc[0].ket_cuc, null, `kết cục ${kc[0].ket_cuc}, mong null (thẻ chưa đủ hai kết quả)`);
});

// ---------- AC-3: json-hong vẫn riêng ----------
test("AC-3 ma trận cắt × JSON tách được: 4 ô viết tay", async () => {
  const BANG: [string, boolean, string, string][] = [
    ["không cắt + JSON tách được", false, JSON_DU, "ok"],
    ["không cắt + JSON hỏng", false, JSON_CUT, "json-hong"],
    ["cắt + JSON tách được", true, JSON_DU, "bi-cat"],
    ["cắt + JSON hỏng", true, JSON_CUT, "bi-cat"],
  ];
  for (const [ten, cat, text, mong] of BANG) {
    const goi: GoiModel = async () => ({ text, vao: 1, ra: 1, cat });
    const k = await DOC.docMot({ model: MD, dauVao: { text: BAI, group_name: null, o: ["bathrooms"] }, goi, recordCall: async () => {}, trace: "t" });
    const nhan = k.ok ? "ok" : k.loi;
    assert.equal(nhan, mong, `ô ${ten}: ${nhan}, mong ${mong}`);
  }
});

// ---------- AC-4: đếm lỗi theo lý do ----------
test("AC-4 tong-ket loi_theo_ly_do và dòng báo cáo: ok, bi-cat, json-hong, lỗi 500, ok, bi-cat", async () => {
  const thuMuc = tam();
  let i = 0;
  const goi: GoiModel = async () => {
    i++;
    if (i === 2 || i === 6) return { text: JSON_CUT, vao: 1, ra: 1600, cat: true };
    if (i === 3) return { text: "không biết", vao: 1, ra: 5 };
    if (i === 4) throw Object.assign(new Error("Internal"), { status: 500 });
    return { text: JSON_DU, vao: 1, ra: 1 };
  };
  const tk = await chayGia([dongThe(1, ["bathrooms"]), dongThe(2, ["bathrooms"]), dongThe(3, ["bathrooms"])], goi, thuMuc);
  assert.equal(i, 6, `số lời gọi ${i}, mong 6`);
  assert.equal(tk.loi_goi, 4, `loi_goi ${tk.loi_goi}, mong 4`);
  const MONG = { "bi-cat": 2, "json-hong": 1, "may-chu": 1 };
  assert.deepEqual(tk.loi_theo_ly_do, MONG, `loi_theo_ly_do ${JSON.stringify(tk.loi_theo_ly_do)}, mong ${JSON.stringify(MONG)}`);
  const tep = JSON.parse(readFileSync(join(thuMuc, tk.run_id, "tong-ket.json"), "utf8"));
  assert.deepEqual(tep.loi_theo_ly_do, MONG, "tong-ket.json thiếu hay lệch loi_theo_ly_do");
  assert.equal(Object.values(tep.loi_theo_ly_do as Record<string, number>).reduce((a, b) => a + b, 0), tep.loi_goi, "tổng loi_theo_ly_do khác loi_goi");
  const bc = BC.inBaoCao(BC.baoCao(join(thuMuc, tk.run_id)));
  assert.match(bc, /Lỗi theo lý do: .*bi-cat 2/, "báo cáo thiếu «bi-cat 2»");
  assert.match(bc, /json-hong 1/, "báo cáo thiếu «json-hong 1»");
});

// ---------- AC-5: ước chi lời gọi đầu ----------
test("AC-5 uocDau dùng trần token ra của thẻ: n = 1, 3, 5", () => {
  for (const n of [1, 3, 5]) {
    const o = O5.slice(0, n);
    const t = dongThe(1, o);
    const p = PR.loiNhac({ text: t.text, group_name: t.group_name, o });
    const mong = ((p.system.length + p.user.length) / 3 * MH.gia_vao + (400 + 600 * n) * MH.gia_ra) / 1e6;
    const nhan = CHAY.uocDau(MH, t as never);
    assert.ok(Math.abs(nhan - mong) < 1e-12, `n=${n}: ước ${nhan}, mong ${mong}`);
  }
});

test("AC-5 trần tiền giữa ước 1 ô và ước 5 ô: thẻ 5 ô dừng trước lời gọi đầu, thẻ 1 ô gọi", async () => {
  const t1 = dongThe(1, O5.slice(0, 1)), t5 = dongThe(1, O5);
  const u1 = CHAY.uocDau(MH, t1 as never), u5 = CHAY.uocDau(MH, t5 as never);
  assert.ok(u5 > u1, `ước 5 ô ${u5} phải lớn hơn ước 1 ô ${u1}`);
  const tran = (u1 + u5) / 2;
  for (const [ten, row, mong] of [["thẻ 5 ô", t5, 0], ["thẻ 1 ô", t1, 1]] as const) {
    let n = 0;
    const goi: GoiModel = async () => { n++; return { text: JSON_DU, vao: 1, ra: 1 }; };
    await chayGia([row], goi, tam(), { tranUsd: tran });
    assert.ok(mong === 0 ? n === 0 : n >= 1, `${ten}: ${n} lời gọi, mong ${mong === 0 ? 0 : "≥ 1"}`);
  }
});

// ---------- AC-6: khoá dùng lại không đổi ----------
test("AC-6 cấu hình giữ cb-v1; khoaDung bằng băm ghim tính trên main b28bdbd3d trước khi sửa", () => {
  assert.equal(CH.napCauHinhCham().cauHinh.prompt_version, "cb-v1", "prompt_version đổi — 57 lần đọc lượt 1 sẽ bị đọc lại");
  const t = { text: "Bán căn 2PN 2WC toà S1.03, đường Nguyễn Văn Linh.", group_name: "Nhóm A", de_xuat: [
    { id: 1, field: "bathrooms" as OCham, value: "2", source: "e2_llm" as const, o_da_co: false },
    { id: 2, field: "block_raw" as OCham, value: "S1.03", source: "e2_llm" as const, o_da_co: false }] };
  const GHIM: [string, string][] = [
    ["anthropic/claude-haiku-5.5", "9040bc84816e59a875ea7b6b19f5bbc6638b5f44c95429a4986eb9436bbe77b3"],
    ["deepseek/deepseek-v4.1-flash-1017", "6a9927cf138162f5cedea888c9e9119d43e112ac42464b322ecbbbe948b74bf7"],
  ];
  for (const [g, h] of GHIM) {
    const k = KHO.khoaDung(t, { gateway: g }, "cb-v1");
    assert.equal(k, h, `khoá dùng lại lệch cho ${g}: ${k}, ghim ${h}`);
  }
});

test("AC-6 chạy lại sau lượt có một lời gọi lỗi chỉ gọi đúng cặp còn thiếu", async () => {
  const thuMuc = tam();
  const rows = [dongThe(1, ["bathrooms"]), dongThe(2, ["bathrooms", "bedrooms"]), dongThe(3, ["block_raw"])];
  let i = 0;
  await chayGia(rows, async () => { i++; return i === 4 ? { text: JSON_CUT, vao: 1, ra: 1600, cat: true } : { text: JSON_DU, vao: 1, ra: 1 }; }, thuMuc);
  assert.equal(i, 6);
  let n = 0;
  const tk = await chayGia(rows, async () => { n++; return { text: JSON_DU, vao: 1, ra: 1 }; }, thuMuc);
  assert.equal(n, 1, `lần hai gọi ${n}, mong đúng 1`);
  assert.equal(tk.dung_lai, 5, `dùng lại ${tk.dung_lai}, mong 5`);
});

// ---------- AC-8: rào chi dừng sớm thì báo cáo nói rõ là dừng vì trần ----------
test("AC-8 lượt dừng vì trần: báo cáo có dòng DỪNG VÌ TRẦN kèm thẻ đủ / còn lại / đã chi; lượt trọn không có dòng ấy", async () => {
  const rows = [dongThe(1, ["bathrooms"]), dongThe(2, ["bathrooms"]), dongThe(3, ["bathrooms"])];
  const goi: GoiModel = async () => ({ text: JSON_DU, vao: 1000, ra: 300 });
  const u = CHAY.uocDau(MH, rows[0] as never);
  const thuA = tam();
  const tkA = await chayGia(rows, goi, thuA, { tranUsd: u * 1.5 });
  assert.ok(tkA.dung_vi_tran, "lượt phải dừng vì trần");
  assert.ok(tkA.the_du < tkA.so_the, `thẻ đủ ${tkA.the_du}/${tkA.so_the}, mong thiếu thẻ`);
  const bcA = BC.inBaoCao(BC.baoCao(join(thuA, tkA.run_id)));
  const mong = new RegExp(`DỪNG VÌ TRẦN [0-9.e-]+ USD .*thẻ đủ hai kết quả ${tkA.the_du}/3, còn ${3 - tkA.the_du} thẻ chưa đủ, đã chi [0-9.]+ USD`);
  assert.match(bcA, mong, `báo cáo lượt dừng vì trần thiếu dòng rõ lý do:\n${bcA}`);
  // Đối chứng dương: lượt trọn không có dòng dừng vì trần.
  const thuB = tam();
  const tkB = await chayGia(rows, goi, thuB);
  assert.ok(!tkB.dung_vi_tran && tkB.the_du === 3, "lượt trọn phải đủ 3 thẻ");
  assert.doesNotMatch(BC.inBaoCao(BC.baoCao(join(thuB, tkB.run_id))), /DỪNG VÌ TRẦN [0-9]/, "lượt trọn vẫn in dòng dừng vì trần");
});
