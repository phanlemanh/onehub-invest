// judge-nguong.test.ts — PL25 `judge-nguong-la-code` AC-1 (E1) + AC-2a (E2): luật ngưỡng ghép căn là code, prompt không
// mang số ngưỡng. Không DB, không model. Ma trận viết trước; mỗi phép đo có đối chứng đỏ cùng fixture, thông điệp ghim.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { PairData } from "../src/tools/native.js";
import { TR, cap, kiemKhongNguong, type Tin } from "./judge-chung.js";
import {
  NGUONG,
  apNguong,
  buildJudgeInput,
  judgeEntityAgent,
  lech,
  lyDoChu,
  parseGiaiThich,
  phanTram,
  type KetLuan,
} from "../src/agents/judge-entity.js";

const dao = (p: PairData): PairData => ({
  a: { ...p.b, text: p.a.text } as PairData["a"],
  b: { ...p.a, subject: p.b.subject } as PairData["b"],
  score: p.score,
  signals: p.signals,
});

const goc: Tin = { perm2: 100 * TR, area: 50, phuong: "Bình Thạnh", loai: "nha_pho" };
const voi = (o: Partial<Tin>): Tin => ({ ...goc, ...o });

/** Ma trận viết trước — 12 ô; ô 10–12 sát ngưỡng. */
const MA_TRAN: { o: number; ten: string; p: PairData; ky_vong: KetLuan }[] = [
  { o: 1, ten: "giá 5% dt 4% cùng phường cùng loại", p: cap(goc, voi({ perm2: 105 * TR, area: 52 })), ky_vong: "yes" },
  { o: 2, ten: "giá/m² lệch 41%", p: cap(goc, voi({ perm2: 170 * TR, area: 52 })), ky_vong: "no" },
  { o: 3, ten: "khác phường", p: cap(goc, voi({ perm2: 105 * TR, area: 52, phuong: "Gò Vấp" })), ky_vong: "no" },
  { o: 4, ten: "khác loại", p: cap(goc, voi({ perm2: 105 * TR, area: 52, loai: "can_ho" })), ky_vong: "no" },
  { o: 5, ten: "giá/m² lệch 20%", p: cap(goc, voi({ perm2: 125 * TR, area: 52 })), ky_vong: "unsure" },
  { o: 6, ten: "thiếu diện tích một bên", p: cap(goc, voi({ perm2: 105 * TR, area: null })), ky_vong: "unsure" },
  {
    o: 7,
    ten: "phường viết khác dạng",
    p: cap(voi({ phuong: "Phường Bình Thạnh" }), voi({ perm2: 105 * TR, area: 52, phuong: "binh thanh" })),
    ky_vong: "yes",
  },
  { o: 8, ten: "loại unknown một bên", p: cap(goc, voi({ perm2: 105 * TR, area: 52, loai: "unknown" })), ky_vong: "unsure" },
  { o: 9, ten: "chỉ một bên có phường", p: cap(goc, voi({ perm2: 105 * TR, area: 52, phuong: null })), ky_vong: "unsure" },
  { o: 10, ten: "giá/m² lệch đúng 0,15", p: cap(voi({ perm2: 85 * TR }), voi({ perm2: 100 * TR })), ky_vong: "unsure" },
  { o: 11, ten: "100 vs 140 — phân biệt mẫu số", p: cap(goc, voi({ perm2: 140 * TR })), ky_vong: "unsure" },
  { o: 12, ten: "giá/m² lệch đúng 0,30", p: cap(voi({ perm2: 70 * TR }), voi({ perm2: 100 * TR })), ky_vong: "unsure" },
];

/** Hàm kiểm dùng chung cho ca thật và đối chứng đỏ. */
function kiemO(o: number, p: PairData, ky_vong: KetLuan, lechFn = lech) {
  const xuoi = apNguong(p, lechFn).same_house;
  const nguoc = apNguong(dao(p), lechFn).same_house;
  assert.ok(xuoi === ky_vong && nguoc === ky_vong, `AC-1 luật sai ở ô: ${o} (xuôi ${xuoi}, ngược ${nguoc}, kỳ vọng ${ky_vong})`);
}

test("AC-1 hằng NGUONG khai một chỗ", () => {
  assert.deepEqual({ ...NGUONG }, { giaM2YesMax: 0.15, dienTichYesMax: 0.1, giaM2NoMin: 0.3 });
});

test("AC-1 ma trận luật — 12 ô, hai chiều A↔B", () => {
  let n = 0;
  for (const c of MA_TRAN) {
    kiemO(c.o, c.p, c.ky_vong);
    n++;
  }
  assert.equal(n, 12);
});

test("AC-1 đối chứng đỏ: dt lệch 12% ở ô 1 thôi yes", () => {
  const p = cap(voi({ area: 44 }), voi({ perm2: 105 * TR, area: 50 }));
  assert.throws(() => kiemO(1, p, "yes"), /AC-1 luật sai ở ô: 1/);
});

test("AC-1 đối chứng đỏ: mẫu số min ở ô 11 ra no", () => {
  const lechMin = (x: number | null, y: number | null) =>
    x === null || y === null ? null : Math.abs(x - y) / Math.min(x, y);
  const o11 = MA_TRAN.find((c) => c.o === 11)!;
  assert.equal(apNguong(o11.p, lechMin).same_house, "no");
  assert.throws(() => kiemO(11, o11.p, "unsure", lechMin), /AC-1 luật sai ở ô: 11/);
});

// Prompt cũ trước vòng (git 2e25631c agent/src/agents/judge-entity.ts) — vật đỏ của phép soi.
const PROMPT_CU = `Quy tắc:
- "yes": giá/m² lệch <15%, diện tích lệch <10%, cùng phường, cùng loại hình
- "no": giá/m² lệch >30%, hoặc khác phường, hoặc khác loại hình rõ rệt
- "unsure": mọi trường hợp khác`;

test("AC-2 prompt không ngưỡng — prompt hệ thống + đầu vào ô 1–9", () => {
  kiemKhongNguong(judgeEntityAgent.systemPrompt);
  let n = 0;
  for (const c of MA_TRAN.filter((x) => x.o <= 9)) {
    kiemKhongNguong(buildJudgeInput(c.p, apNguong(c.p)));
    n++;
  }
  assert.equal(n, 9);
});

test("AC-2 đối chứng đỏ: prompt cũ bị hàm soi bắt", () => {
  assert.throws(() => kiemKhongNguong(PROMPT_CU), /AC-2 prompt chứa ngưỡng/);
});

// S4 r1–r2 (AC-2): lệch sát và ĐÚNG ngưỡng — prompt chỉ mang lời định tính, số đo chỉ ở thẻ (lyDoChu); lời đi đúng kết luận.
test("AC-2 sát ngưỡng — prompt không mang số đo, kể cả lệch đúng bằng ngưỡng", () => {
  const SAT: { p: PairData; ky_vong: KetLuan; cau: string; so: string }[] = [
    { p: cap(voi({ perm2: 85.1 * TR }), voi({ perm2: 100 * TR })), ky_vong: "yes", cau: "giá/m² sát nhau", so: "14,9%" },
    { p: cap(voi({ perm2: 85 * TR }), voi({ perm2: 100 * TR })), ky_vong: "unsure", cau: "giá/m² lệch vừa", so: "15,0%" },
    { p: cap(voi({ perm2: 70.4 * TR }), voi({ perm2: 100 * TR })), ky_vong: "unsure", cau: "giá/m² lệch vừa", so: "29,6%" },
    { p: cap(voi({ perm2: 70 * TR }), voi({ perm2: 100 * TR })), ky_vong: "unsure", cau: "giá/m² lệch vừa", so: "30,0%" },
    { p: cap(voi({ perm2: 69.97 * TR }), voi({ perm2: 100 * TR })), ky_vong: "no", cau: "giá/m² lệch xa", so: "30,0%" },
    { p: cap(voi({ perm2: 69.6 * TR }), voi({ perm2: 100 * TR })), ky_vong: "no", cau: "giá/m² lệch xa", so: "30,4%" },
    { p: cap(voi({ area: 45.25 }), voi({ perm2: 105 * TR, area: 50 })), ky_vong: "yes", cau: "diện tích sát nhau", so: "9,5%" },
    { p: cap(voi({ area: 45 }), voi({ perm2: 105 * TR, area: 50 })), ky_vong: "unsure", cau: "diện tích lệch đáng kể", so: "10,0%" },
  ];
  let n = 0;
  for (const s of SAT) {
    const kq = apNguong(s.p);
    assert.equal(kq.same_house, s.ky_vong, `kết luận sai ở «${s.so}»`);
    const l = kq.ly_do.find((x) => x.cau === s.cau);
    assert.ok(l, `thiếu «${s.cau}»: ${kq.ly_do.map((x) => x.cau).join("; ")}`);
    assert.equal(l.so, s.so);
    kiemKhongNguong(buildJudgeInput(s.p, kq));
    assert.ok(lyDoChu(kq).includes(`${s.cau} (${s.so})`), `thẻ thiếu số đo «${s.so}»`);
    n++;
  }
  assert.equal(n, 8);
});

test("AC-2 đối chứng đỏ: hàm soi bắt số đo ở đúng ngưỡng, kể cả khuôn có phần thập phân", () => {
  for (const x of [0.15, 0.1, 0.3]) assert.throws(() => kiemKhongNguong(phanTram(x)), /AC-2 prompt chứa ngưỡng/);
  // định dạng cũ Math.round in «15%» cho lệch 0,149
  assert.throws(() => kiemKhongNguong(`giá/m² lệch ${Math.round(0.149 * 100)}%`), /AC-2 prompt chứa ngưỡng/);
  // cùng fixture lệch đúng 0,15: nếu số đo lọt vào prompt thì hàm soi bắt
  const p = cap(voi({ perm2: 85 * TR }), voi({ perm2: 100 * TR }));
  const kq = apNguong(p);
  const roRi = buildJudgeInput(p, kq) + kq.ly_do.map((l) => (l.so ? `\n- ${l.cau} ${l.so}` : "")).join("");
  assert.throws(() => kiemKhongNguong(roRi), /AC-2 prompt chứa ngưỡng: 15,0%/);
});

test("parseGiaiThich chỉ rút lời giải thích", () => {
  assert.equal(parseGiaiThich('{"same_house":"no","giai_thich":"GT-MAU"}'), "GT-MAU");
  assert.equal(parseGiaiThich("khong phai json"), null);
  assert.equal(parseGiaiThich('{"giai_thich":"  "}'), null);
});
