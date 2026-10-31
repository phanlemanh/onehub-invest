// judge-nguong.test.ts — PL25 `judge-nguong-la-code` AC-1 (E1) + AC-2a (E2): luật ngưỡng ghép căn là code, prompt không
// mang số ngưỡng. Không DB, không model. Ma trận viết trước; mỗi phép đo có đối chứng đỏ cùng fixture, thông điệp ghim.
// Thêm hồ sơ `judge-giu-quyet-dinh-nguoi` AC-5 (E5): luật so phường cùng khoá với thẻ duyệt /ops/review.
// Thêm hồ sơ `phuong-so` PS-AC-2 (E2) + PS-AC-3 (E3), thay KP-AC-2/KP-AC-3 của `khoa-phuong-chung-phuong-so`: phường số
// mang cấp và bỏ số 0 đầu ở cả hai bản.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { join } from "node:path";
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
  type SoPhuong,
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
  { o: 1, ten: "giá 5% dt lệch 1 m² cùng phường cùng loại", p: cap(goc, voi({ perm2: 105 * TR, area: 51 })), ky_vong: "yes" },
  { o: 2, ten: "giá/m² lệch 41%", p: cap(goc, voi({ perm2: 170 * TR, area: 51 })), ky_vong: "no" },
  { o: 3, ten: "khác phường", p: cap(goc, voi({ perm2: 105 * TR, area: 51, phuong: "Gò Vấp" })), ky_vong: "no" },
  { o: 4, ten: "khác loại", p: cap(goc, voi({ perm2: 105 * TR, area: 51, loai: "can_ho" })), ky_vong: "no" },
  { o: 5, ten: "giá/m² lệch 20%", p: cap(goc, voi({ perm2: 125 * TR, area: 51 })), ky_vong: "unsure" },
  { o: 6, ten: "thiếu diện tích một bên", p: cap(goc, voi({ perm2: 105 * TR, area: null })), ky_vong: "unsure" },
  {
    o: 7,
    ten: "phường viết khác dạng",
    p: cap(voi({ phuong: "Phường Bình Thạnh" }), voi({ perm2: 105 * TR, area: 51, phuong: "binh thanh" })),
    ky_vong: "yes",
  },
  { o: 8, ten: "loại unknown một bên", p: cap(goc, voi({ perm2: 105 * TR, area: 51, loai: "unknown" })), ky_vong: "unsure" },
  { o: 9, ten: "chỉ một bên có phường", p: cap(goc, voi({ perm2: 105 * TR, area: 51, phuong: null })), ky_vong: "unsure" },
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
  assert.deepEqual({ ...NGUONG }, { giaM2YesMax: 0.15, giaM2NoMin: 0.3, dienTichLamTronM2: 1, dienTichCanHoMax: 0.1 });
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

// S4 r3 (AC-1): cặp lệch ĐÚNG bằng ngưỡng về toán (a = k·b) phải so ra như nhau, không theo sai số dấu phẩy động.
const lechTho = (x: number | null, y: number | null) =>
  x === null || y === null || x <= 0 || y <= 0 ? null : Math.abs(x - y) / Math.max(x, y);

/** Quét n = 1..2000 phần mười: căn hộ diện tích lệch đúng 0,1 (sai số cách đo — HD2: chưa vượt, nên «yes»), giá/m² lệch
 *  đúng 0,15 và 0,30 (unsure). Kết luận không được phụ thuộc sai số dấu phẩy động. */
function kiemDungNguong(lechFn = lech): number {
  let n = 0;
  for (let i = 1; i <= 2000; i++) {
    const b = i / 10;
    const ca: [string, PairData, KetLuan][] = [
      ["dt 0,1 căn hộ", cap(voi({ area: (b * 9) / 10, loai: "apartment" }), voi({ perm2: 105 * TR, area: b, loai: "apartment" })), "yes"],
      ["giá 0,15", cap(voi({ perm2: ((b * 85) / 100) * TR }), voi({ perm2: b * TR })), "unsure"],
      ["giá 0,30", cap(voi({ perm2: ((b * 70) / 100) * TR }), voi({ perm2: b * TR })), "unsure"],
    ];
    for (const [ten, p, ky] of ca) {
      const kq = apNguong(p, lechFn).same_house;
      assert.equal(kq, ky, `AC-1 đúng ngưỡng lệch theo sai số máy: ${ten} ở b=${b} ra ${kq}`);
      n++;
    }
  }
  return n;
}

test("AC-1 lệch đúng bằng ngưỡng — kết luận không phụ thuộc sai số dấu phẩy động", () => {
  assert.equal(kiemDungNguong(), 6000);
  // ca hội đồng nêu: 19,8 vs 22 m² — tính thô dưới 0,1 nhưng phải là đúng ngưỡng (căn hộ: chưa vượt sai số cách đo)
  const p = cap(voi({ area: 19.8, loai: "apartment" }), voi({ perm2: 105 * TR, area: 22, loai: "apartment" }));
  assert.ok(lechTho(19.8, 22)! < NGUONG.dienTichCanHoMax);
  const kq = apNguong(p);
  assert.equal(kq.same_house, "yes");
  assert.equal(kq.lech.dien_tich, NGUONG.dienTichCanHoMax);
  assert.ok(lyDoChu(kq).includes("diện tích khớp trong sai số (19,8 ↔ 22 m² · 10,0%)"));
});

test("AC-1 đối chứng đỏ: so độ lệch thô thì quét đúng ngưỡng bắt được", () => {
  assert.throws(() => kiemDungNguong(lechTho), /AC-1 đúng ngưỡng lệch theo sai số máy/);
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
    { p: cap(voi({ area: 45.25, loai: "apartment" }), voi({ perm2: 105 * TR, area: 50, loai: "apartment" })), ky_vong: "yes", cau: "diện tích khớp trong sai số", so: "45,25 ↔ 50 m² · 9,5%" },
    { p: cap(voi({ area: 44.9, loai: "apartment" }), voi({ perm2: 105 * TR, area: 50, loai: "apartment" })), ky_vong: "no", cau: "diện tích khác", so: "44,9 ↔ 50 m² · 10,2%" },
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

// ── hồ sơ judge-giu-quyet-dinh-nguoi AC-4, AC-5: so phường cùng khoá với thẻ duyệt
const TEP_APP = join(import.meta.dirname, "../../app/src/lib/ops/review-can-cu.ts");
/** Rút NGUYÊN VĂN một hàm (hay hằng mũi tên một dòng) theo tên từ tệp app. */
function rut(nguon: string, ten: string): string {
  const m =
    nguon.match(new RegExp(`^(?:export )?function ${ten}\\([\\s\\S]*?\\n}`, "m")) ??
    nguon.match(new RegExp(`^const ${ten} = .*;$`, "m"));
  assert.ok(m, `PS-AC-2 không rút được ${ten} từ review-can-cu.ts`);
  return m[0].replace(/^export /, "");
}
/** Dựng soPhuong của thẻ duyệt từ chính tệp app: rút thân, bỏ kiểu, chạy. */
function soPhuongApp(): (a: string | null, b: string | null) => SoPhuong {
  const nguon = readFileSync(TEP_APP, "utf8");
  const ma = ["trong", "khoa", "soGiaTri", "khoaPhuong", "soPhuong"].map((t) => rut(nguon, t)).join("\n");
  return new Function(`${stripTypeScriptTypes(ma)}\nreturn soPhuong;`)();
}

/** chuanHoaPhuong trước vòng (judge-entity.ts tại 14f5851d), chép nguyên văn — chỉ để đối chứng đỏ. */
function chuanHoaPhuong(s: string | null): string | null {
  if (!s) return null;
  const t = s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/^\s*(phuong|p\.|p)\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
  return t || null;
}
/** Luật so phường cũ dưới dạng tham số so phường của apNguong. */
const soPhuongCu = (a: string | number | null, b: string | number | null): SoPhuong => {
  const pa = chuanHoaPhuong(a === null ? null : String(a));
  const pb = chuanHoaPhuong(b === null ? null : String(b));
  return pa === null || pb === null ? "thieu" : pa === pb ? "khop" : "lech";
};

const NHAN_LY_DO: Record<string, SoPhuong> = { cung_phuong: "khop", khac_phuong: "lech", thieu_phuong: "thieu" };
/** Cặp tin số đo ô (1) ma trận AC-1 PL25 (giá/m² lệch 5%, dt lệch 4%, cùng loại), chỉ khác tên phường. */
const capPhuong = (a: string | null, b: string | null) => cap(voi({ phuong: a }), voi({ perm2: 105 * TR, area: 51, phuong: b }));

/** Ma trận viết trước — ĐÚNG 32 cặp (evals.yaml E2): 21 ô của KP-AC-2 theo thứ tự cũ, ô (21) «Phường 12 | phuong-12» nay
 *  khop; rồi 11 ô phường số mới. */
const MA_TRAN_PHUONG: [string | null, string | null, SoPhuong][] = [
  ["Phương Liệt", "Phường Phương Liệt", "khop"],
  ["Phương Liệt", "Phương Mai", "lech"],
  ["Phượng Dực", "Xã Phượng Dực", "khop"],
  ["Xã Kim Chung", "kim-chung", "khop"],
  ["Xã Kim Chung", "Xã Kim Nỗ", "lech"],
  ["Thị trấn Đông Anh", "Đông Anh", "khop"],
  ["Thị trấn Đông Anh", "Thị trấn Trâu Quỳ", "lech"],
  ["P.Bến Nghé", "Phường Bến Nghé", "khop"],
  ["P. Bến Nghé", "Bến Nghé", "khop"],
  ["P.Bến Nghé", "P.Đa Kao", "lech"],
  ["Phường Bình Thạnh", "binh-thanh", "khop"],
  ["tay-nam", "Phường Tây Mỗ", "lech"],
  ["Phường 12", "Phường 12", "khop"],
  ["Phường 12", "P.12", "khop"],
  ["Phường 12", "Phường 13", "lech"],
  ["Phường", "Bình Thạnh", "thieu"],
  [null, "Bình Thạnh", "thieu"],
  ["", "Bình Thạnh", "thieu"],
  ["Phường 12", "P. 12", "khop"],
  ["Phường 1", "Phường 12", "lech"],
  ["Phường 12", "phuong-12", "khop"],
  ["Phường 01", "Phường 1", "khop"],
  ["Phường 12", "P12", "khop"],
  ["Phường 12", "phuong 12", "khop"],
  ["Xã 12", "xa-12", "khop"],
  ["Thị trấn 12", "thi-tran-12", "khop"],
  ["12", "12", "khop"],
  ["Phường 12".normalize("NFD"), "Phường 12", "khop"],
  ["Xã 12", "Phường 12", "lech"],
  ["Thị trấn 12", "Phường 12", "lech"],
  ["12", "Phường 12", "lech"],
  ["Phường 12A", "Phường 12", "lech"],
];

/** Một assert so ba nhãn: thẻ duyệt (bản rút từ app), mong đợi, luật. `apNguongFn` mặc định là apNguong thật. */
function kiemPhuong(
  a: string | null,
  b: string | null,
  kyVong: SoPhuong,
  app: ReturnType<typeof soPhuongApp>,
  soFn?: typeof soPhuongCu,
  apNguongFn: typeof apNguong = apNguong,
) {
  const the = app(a, b);
  const ma = (soFn ? apNguongFn(capPhuong(a, b), lech, soFn) : apNguongFn(capPhuong(a, b))).ly_do
    .map((l) => l.ma)
    .find((m) => m in NHAN_LY_DO);
  const luat = ma ? NHAN_LY_DO[ma] : undefined;
  assert.ok(the === kyVong && luat === kyVong, `PS-AC-2 luật lệch thẻ duyệt ở: ${a} | ${b} (thẻ ${the}, luật ${luat}, kỳ vọng ${kyVong})`);
}
function kiemMaTran(app: ReturnType<typeof soPhuongApp>, soFn?: typeof soPhuongCu, apNguongFn?: typeof apNguong): number {
  let n = 0;
  for (const [a, b, ky] of MA_TRAN_PHUONG) {
    kiemPhuong(a, b, ky, app, soFn, apNguongFn);
    kiemPhuong(b, a, ky, app, soFn, apNguongFn);
    n += 2;
  }
  return n;
}

/** khoaPhuong + soPhuong trước vòng phuong-so (judge-entity.ts tại 4704315b), chép nguyên văn — chỉ để đối chứng đỏ. */
function khoaPhuongCu(v: string): string {
  return v
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/^(?:(?:phường|xã|thị trấn)(?:\s+|$)|p\.\s*)/u, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function soPhuongTruoc(a: string | number | null, b: string | number | null): SoPhuong {
  if (a === null || b === null) return "thieu";
  const ka = khoaPhuongCu(String(a));
  const kb = khoaPhuongCu(String(b));
  if (ka === "" || kb === "") return "thieu";
  return ka === kb ? "khop" : "lech";
}

/** Bản chép judge-entity.ts thật bỏ dòng nhánh phường số của khoaPhuong — ghi tệp .ts tạm cạnh tests, nạp qua tsx để
 *  chạy apNguong mặc định của bản chép. */
async function apNguongBanChepCu(): Promise<typeof apNguong> {
  const tep = join(import.meta.dirname, "../src/agents/judge-entity.ts");
  const goc = readFileSync(tep, "utf8");
  const sau = goc
    .replace(/^ {2}if \(so\) return .*\n/m, "")
    .replace(/from "\.\.\/(runtime|tools)\//g, (_m, d) => `from "${join(import.meta.dirname, "../src", d)}/`);
  assert.notEqual(sau.length, goc.length, "PS-AC-2 không thấy dòng nhánh phường số trong judge-entity.ts");
  const f = join(import.meta.dirname, `.kp-cu-${process.pid}.ts`);
  writeFileSync(f, sau);
  try {
    return ((await import(f)) as { apNguong: typeof apNguong }).apNguong;
  } finally {
    rmSync(f, { force: true });
  }
}

test("PS-AC-2 phường khớp thẻ duyệt — 32 cặp, hai chiều, apNguong mặc định, bản rút từ tệp app", () => {
  assert.equal(MA_TRAN_PHUONG.length, 32);
  assert.equal(kiemMaTran(soPhuongApp()), 64);
});

test("PS-AC-2 đối chứng đỏ: khoaPhuong cũ tiêm qua tham số, bản chép judge-entity.ts bỏ nhánh phường số, tên hàm không có", async () => {
  const app = soPhuongApp();
  assert.throws(() => kiemMaTran(app, soPhuongTruoc), /PS-AC-2 luật lệch thẻ duyệt ở: Phường 12 \| phuong-12/);
  const apCu = await apNguongBanChepCu();
  assert.throws(() => kiemMaTran(app, undefined, apCu), /PS-AC-2 luật lệch thẻ duyệt ở: Phường 12 \| phuong-12/);
  assert.throws(() => kiemMaTran(app, soPhuongCu), /PS-AC-2 luật lệch thẻ duyệt ở: Phương Liệt \| Phường Phương Liệt/);
  assert.throws(() => rut(readFileSync(TEP_APP, "utf8"), "khoaPhuongKhongCo"), /PS-AC-2 không rút được khoaPhuongKhongCo từ review-can-cu.ts/);
});

/** Ma trận viết trước — 5 ô (evals.yaml E5). */
const MA_TRAN_AC5: [string, string, KetLuan, string][] = [
  ["Phương Liệt", "Phường Phương Liệt", "yes", "cung_phuong"],
  ["Xã Kim Chung", "kim-chung", "yes", "cung_phuong"],
  ["P.Bến Nghé", "Phường Bến Nghé", "yes", "cung_phuong"],
  ["Thị trấn Đông Anh", "Đông Anh", "yes", "cung_phuong"],
  ["Phương Liệt", "Phương Mai", "no", "khac_phuong"],
];
function kiemAC5(a: string, b: string, kyVong: KetLuan, ma: string, soFn?: typeof soPhuongCu) {
  const kq = apNguong(capPhuong(a, b), lech, soFn);
  assert.ok(kq.same_house === kyVong && kq.ly_do.some((l) => l.ma === ma), `AC-5 luật sai ở ô: ${a} | ${b} (ra ${kq.same_house})`);
}

test("AC-5 cùng phường ghi khác kiểu ra yes — 5 ô, hai chiều", () => {
  let n = 0;
  for (const [a, b, ky, ma] of MA_TRAN_AC5) {
    kiemAC5(a, b, ky, ma);
    kiemAC5(b, a, ky, ma);
    n += 2;
  }
  assert.equal(n, 10);
});

test("AC-5 đối chứng đỏ: chuanHoaPhuong cũ ra no ở ô Phương Liệt | Phường Phương Liệt", () => {
  const [a, b, ky, ma] = MA_TRAN_AC5[0];
  assert.throws(() => kiemAC5(a, b, ky, ma, soPhuongCu), /AC-5 luật sai ở ô: Phương Liệt \| Phường Phương Liệt/);
});

/** Ma trận viết trước — 4 ô (evals.yaml E3), cùng cặp số đo với AC-5. */
const MA_TRAN_PS3: [string, string, KetLuan, string][] = [
  ["Phường 12", "P.12", "yes", "cung_phuong"],
  ["Phường 01", "Phường 1", "yes", "cung_phuong"],
  ["Phường 12", "Phường 21", "no", "khac_phuong"],
  ["Xã 12", "Phường 12", "no", "khac_phuong"],
];
function kiemPS3(a: string, b: string, kyVong: KetLuan, ma: string, soFn?: typeof soPhuongCu) {
  const kq = soFn ? apNguong(capPhuong(a, b), lech, soFn) : apNguong(capPhuong(a, b));
  assert.ok(kq.same_house === kyVong && kq.ly_do.some((l) => l.ma === ma), `PS-AC-3 luật sai ở ô: ${a} | ${b} (ra ${kq.same_house})`);
}
function kiemMaTranPS3(soFn?: typeof soPhuongCu): number {
  let n = 0;
  for (const [a, b, ky, ma] of MA_TRAN_PS3) {
    kiemPS3(a, b, ky, ma, soFn);
    kiemPS3(b, a, ky, ma, soFn);
    n += 2;
  }
  return n;
}

test("PS-AC-3 phường số ra yes/no — 4 ô, hai chiều, apNguong mặc định", () => {
  assert.equal(kiemMaTranPS3(), 8);
});

test("PS-AC-3 đối chứng đỏ: khoaPhuong cũ ra no ở ô Phường 01 | Phường 1", () => {
  assert.throws(() => kiemMaTranPS3(soPhuongTruoc), /PS-AC-3 luật sai ở ô: Phường 01 \| Phường 1/);
});
