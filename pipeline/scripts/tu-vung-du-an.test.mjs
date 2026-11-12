// tu-vung-du-an.test.mjs — từ vựng dự án theo mục 39 (hàng DA4 tu-vung-du-an-muc-39).
// Hồ sơ nghiệm thu: _acceptance/tu-vung-du-an-muc-39 (AC-1…AC-6). Tên ca mở đầu bằng mã TV39-AC-n.
// Ca thuần: đọc CONTEXT.md, ba ADR, pipeline/mappings.yaml; AC-6 chạy vocab.mjs trên cây thật và trên bản chép tạm.
// Mỗi bộ kiểm là một hàm ném lỗi gọi tên chỗ thiếu; ca đối chứng chạy cùng hàm trên bản đột biến trong bộ nhớ.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

import { TARGETS } from "../lib/vocab-core.mjs";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const doc = (rel) => readFileSync(join(REPO, rel), "utf8").normalize("NFC");
const CONTEXT = doc("CONTEXT.md");
const ADR = {
  "0011": "docs/adr/0011-reso-first-data-law.md",
  "0013": "docs/adr/0013-kien-truc-du-lieu-tin-can-reso.md",
  "0016": "docs/adr/0016-danh-ba-vat-the-va-nguoi.md",
};
const MAPPINGS = "pipeline/mappings.yaml";
const DAU = "Sửa đổi 2026-11-11 (ROADMAP §3 mục 39)";

/** Khối thuật ngữ `**<tên>**: …` tới dòng trống kế tiếp (null khi vắng). */
function khoi(text, ten) {
  const dong = text.split("\n");
  const i = dong.findIndex((l) => l.startsWith(`**${ten}**`) && /^\*\*[^*]+\*\*( \([^)]*\))?:/.test(l));
  if (i < 0) return null;
  let j = i + 1;
  while (j < dong.length && dong[j].trim() !== "") j++;
  return dong.slice(i, j).join("\n");
}
const avoid = (k) => ((k.match(/^_Avoid_:\s*(.+)$/m) ?? [])[1] ?? "").split(",").map((s) => s.trim().toLowerCase());

// ------------------------------------------------------------------------------------------------ AC-1
function kiemAc1(text) {
  if (/^\*\*Khu đô thị\*\*:/m.test(text)) throw new Error("TV39-AC-1 còn thuật ngữ Khu đô thị");
  const da = khoi(text, "Dự án");
  if (!da) throw new Error("TV39-AC-1 thiếu thuật ngữ Dự án");
  for (const can of ["Code: `project`", "RESO: SubdivisionName", "quy mô", "khu đô thị", "đại đô thị", "dự án cha", "parent_id", "khác chủ đầu tư", "mở bán riêng"])
    if (!da.toLowerCase().includes(can.toLowerCase())) throw new Error(`TV39-AC-1 Dự án thiếu «${can}»`);
  if (avoid(da).includes("dự án")) throw new Error("TV39-AC-1 Dự án còn tránh chính chữ dự án");
  const pk = khoi(text, "Phân khu");
  if (!pk) throw new Error("TV39-AC-1 thiếu thuật ngữ Phân khu");
  if (!pk.includes("cùng chủ đầu tư")) throw new Error("TV39-AC-1 Phân khu thiếu «cùng chủ đầu tư»");
  if (avoid(pk).includes("dự án con")) throw new Error("TV39-AC-1 Phân khu còn tránh dự án con");
}

test("TV39-AC-1 CONTEXT có thuật ngữ Dự án thay Khu đô thị, Phân khu theo chủ đầu tư", () => {
  kiemAc1(CONTEXT);
});

test("TV39-AC-1 đối chứng: chèn lại khối Khu đô thị hay tránh dự án con ở Phân khu → đỏ", () => {
  const cu = CONTEXT.replace(/^\*\*Dự án\*\*:/m, "**Khu đô thị**: cũ\n\n**Dự án**:");
  assert.notEqual(cu, CONTEXT);
  assert.throws(() => kiemAc1(cu), /TV39-AC-1 còn thuật ngữ Khu đô thị/);
  const pk = khoi(CONTEXT, "Phân khu");
  const tranh = CONTEXT.replace(pk, pk.replace(/^_Avoid_:\s*/m, "_Avoid_: dự án con, "));
  assert.throws(() => kiemAc1(tranh), /TV39-AC-1 Phân khu còn tránh dự án con/);
  const da = khoi(CONTEXT, "Dự án");
  assert.throws(() => kiemAc1(CONTEXT.replace(da, da.replaceAll("mở bán riêng", "bán"))), /TV39-AC-1 Dự án thiếu «mở bán riêng»/);
});

// ------------------------------------------------------------------------------------------------ AC-2
const MA_TRAN_AC2 = {
  "Danh mục dự án": ["S08"],
  "Mức gắn": ["căn", "trục", "toà", "phân khu", "dự án", "xã/phường"],
  "Trạng thái dự án": ["Sắp mở bán", "Đang mở bán", "Đã bàn giao", "DevelopmentStatus", "SalesStatus", "HandoverDate"],
  "Mã định danh nhà nước": ["BuildingId", "ma_nha_nuoc", "ParcelNumber"],
  "Tin sơ cấp": ["MarketTier", "Bán", "thước giá", "metrics"],
  "Độ đủ hồ sơ": ["bảy nhóm", "M0", "M5"],
};
function kiemAc2(text) {
  let thay = 0;
  for (const [ten, can] of Object.entries(MA_TRAN_AC2)) {
    const k = khoi(text, ten);
    if (!k) throw new Error(`TV39-AC-2 thiếu thuật ngữ ${ten}`);
    thay++;
    if (!/^- Code:.*RESO:/m.test(k)) throw new Error(`TV39-AC-2 ${ten} thiếu dòng Code · RESO`);
    if (!/^_Avoid_:/m.test(k)) throw new Error(`TV39-AC-2 ${ten} thiếu dòng _Avoid_`);
    for (const c of can) if (!k.includes(c)) throw new Error(`TV39-AC-2 ${ten} thiếu ${c}`);
  }
  return thay;
}

test("TV39-AC-2 sáu thuật ngữ mới đủ mục bắt buộc", () => {
  assert.equal(kiemAc2(CONTEXT), 6);
});

test("TV39-AC-2 đối chứng: bỏ khối Tin sơ cấp hay bỏ huy hiệu Đã bàn giao → đỏ gọi tên", () => {
  const tsc = khoi(CONTEXT, "Tin sơ cấp");
  assert.throws(() => kiemAc2(CONTEXT.replace(tsc, "")), /TV39-AC-2 thiếu thuật ngữ Tin sơ cấp/);
  const tt = khoi(CONTEXT, "Trạng thái dự án");
  assert.throws(() => kiemAc2(CONTEXT.replace(tt, tt.replaceAll("Đã bàn giao", "Xong"))), /TV39-AC-2 Trạng thái dự án thiếu Đã bàn giao/);
});

// ------------------------------------------------------------------------------------------------ AC-3
const MA_TRAN_AC3 = {
  Duplex: ["nhà hai hộ", "UnitTypeType", "local"],
  YearBuilt: ["được phép đưa vào sử dụng"],
  NewConstructionYN: ["sơ cấp"],
  PropertySubtype: ["PropertySubType", "chữ hoa"],
};
function bay(text) {
  const m = text.match(/^\*\*Bẫy tên RESO\*\*:[^\n]*\n((?:- [^\n]*\n?)+)/m);
  if (!m) throw new Error("TV39-AC-3 thiếu khối Bẫy tên RESO");
  return m[1].split("\n").filter((l) => l.startsWith("- "));
}
function kiemAc3(text) {
  const g = bay(text);
  if (g.length !== 4) throw new Error(`TV39-AC-3 số bẫy ${g.length} ≠ 4`);
  for (const [f, can] of Object.entries(MA_TRAN_AC3)) {
    const d = g.find((l) => l.includes(`\`${f}\``));
    if (!d) throw new Error(`TV39-AC-3 thiếu bẫy ${f}`);
    for (const c of can) if (!d.includes(c)) throw new Error(`TV39-AC-3 bẫy ${f} thiếu «${c}»`);
  }
}

test("TV39-AC-3 khối Bẫy tên RESO có đúng bốn bẫy", () => {
  kiemAc3(CONTEXT);
});

test("TV39-AC-3 đối chứng: bỏ bẫy YearBuilt hay thêm bẫy thứ năm → đỏ", () => {
  const g = bay(CONTEXT);
  const yb = g.find((l) => l.includes("`YearBuilt`"));
  assert.throws(() => kiemAc3(CONTEXT.replace(`${yb}\n`, "")), /TV39-AC-3 số bẫy 3 ≠ 4/);
  assert.throws(() => kiemAc3(CONTEXT.replace(yb, yb.replace("`YearBuilt`", "`YearBuiltX`"))), /TV39-AC-3 thiếu bẫy YearBuilt/);
  assert.throws(() => kiemAc3(CONTEXT.replace(`${yb}\n`, `${yb}\n- \`Thua\` thừa\n`)), /TV39-AC-3 số bẫy 5 ≠ 4/);
});

// ------------------------------------------------------------------------------------------------ AC-4
/** Phần của ADR từ tiêu đề khớp `dau` tới tiêu đề cùng hoặc cao cấp hơn kế tiếp. */
function muc(text, dau) {
  const dong = text.split("\n");
  const i = dong.findIndex((l) => /^#{2,3} /.test(l) && dau.test(l));
  if (i < 0) return null;
  const cap = dong[i].match(/^#+/)[0].length;
  let j = i + 1;
  while (j < dong.length && !(dong[j].match(/^#+ /) && dong[j].match(/^#+/)[0].length <= cap)) j++;
  return dong.slice(i, j).join("\n");
}
const MA_TRAN_AC4 = [
  { adr: "0011", ten: "Quyết định 2", dau: /^## Quyết định 2\b/, can: [], nhan: true },
  { adr: "0013", ten: "§2", dau: /^### 2\. /, can: [], nhan: true },
  { adr: "0016", ten: "§1", dau: /^### 1\. /, can: ["dự án"] },
  { adr: "0016", ten: "§3", dau: /^### 3\. /, can: ["parent_id"] },
  { adr: "0016", ten: "§7", dau: /^### 7\. /, can: ["nút vùng", "chủ đầu tư", "phường", "id phát biểu gốc"] },
];
function kiemAc4(docs) {
  for (const m of MA_TRAN_AC4) {
    const p = muc(docs[m.adr], m.dau);
    if (!p) throw new Error(`TV39-AC-4 ${m.adr} thiếu mục ${m.ten}`);
    if (!p.includes(DAU)) throw new Error(`TV39-AC-4 ${m.adr} ${m.ten} thiếu dấu sửa đổi`);
    for (const c of m.can) if (!p.includes(c)) throw new Error(`TV39-AC-4 ${m.adr} ${m.ten} thiếu «${c}»`);
    if (m.nhan) {
      // dòng bảng hiện hành của project: có `project` và SubdivisionName, không nằm trong khối «lưu vết»
      const dong = p.split("\n").filter((l) => l.startsWith("|") && l.includes("SubdivisionName") && l.includes("`project`"));
      if (!dong.length || dong.some((l) => !/\*\*Dự án\*\*|Dự án — `project`/.test(l) || /Khu đô thị — `project`|\*\*Khu đô thị\*\*/.test(l)))
        throw new Error(`TV39-AC-4 ${m.adr} ${m.ten} nhãn chưa đổi`);
    }
  }
}
const ADR_DOC = Object.fromEntries(Object.entries(ADR).map(([k, p]) => [k, doc(p)]));

test("TV39-AC-4 ba ADR mang dấu sửa đổi mục 39 ở năm mục", () => {
  kiemAc4(ADR_DOC);
});

test("TV39-AC-4 đối chứng: 0016 §7 mất dấu, 0011 giữ nhãn Khu đô thị → đỏ gọi tên", () => {
  const p7 = muc(ADR_DOC["0016"], /^### 7\. /);
  assert.throws(() => kiemAc4({ ...ADR_DOC, "0016": ADR_DOC["0016"].replace(p7, p7.replaceAll(DAU, "")) }), /TV39-AC-4 0016 §7 thiếu dấu sửa đổi/);
  const q2 = muc(ADR_DOC["0011"], /^## Quyết định 2\b/);
  const dong = q2.split("\n").find((l) => l.startsWith("|") && l.includes("SubdivisionName") && l.includes("`project`"));
  const cu = ADR_DOC["0011"].replace(dong, dong.replace(/\*\*Dự án\*\*/, "**Khu đô thị**"));
  assert.throws(() => kiemAc4({ ...ADR_DOC, "0011": cu }), /TV39-AC-4 0011 Quyết định 2 nhãn chưa đổi/);
});

// ------------------------------------------------------------------------------------------------ AC-5
function kiemAc5(y) {
  const f = y.canonical?.fields ?? {};
  const s08 = y.sources?.S08 ?? {};
  const chu = (o) => JSON.stringify(o ?? "");
  if (f.property_type?.dd !== "PropertySubType") throw new Error("TV39-AC-5 property_type.dd");
  if (f.block_raw?.dd !== "BuildingName") throw new Error("TV39-AC-5 block_raw.dd");
  if (/asset_nodes|ComplexName/.test(chu([f.block_raw.rationale, f.block_raw.note]))) throw new Error("TV39-AC-5 block_raw còn asset_nodes/ComplexName");
  if (String(s08.fields?.project_id ?? "").includes("chỉ local")) throw new Error("TV39-AC-5 project_id");
  const pn = String(s08.fields?.project_name ?? "");
  if (!pn.includes("SubdivisionName") || pn.includes("ComplexName")) throw new Error("TV39-AC-5 S08 project_name");
  if (String(s08.label ?? "").includes("chỉ nội bộ")) throw new Error("TV39-AC-5 S08 label");
  const pol = String(s08.policy ?? "");
  if (pol.includes("chỉ nội bộ") || !pol.includes("công khai") || !pol.includes("tầng A")) throw new Error("TV39-AC-5 S08 policy");
  if (!pol.includes("stg_s08_inventory") || !pol.includes("không sync")) throw new Error("TV39-AC-5 policy thiếu luật stg");
  for (const [duong, v] of la(y)) {
    if (/node_type\s*=\s*building/.test(v)) throw new Error(`TV39-AC-5 còn nối toà asset_nodes tại ${duong}`);
    if (v.includes("ComplexName") && !COMPLEX_DUOC.includes(duong)) throw new Error(`TV39-AC-5 còn nối toà ComplexName tại ${duong}`);
  }
}
// ComplexName hợp lệ duy nhất: phân khu S08 (Building.ComplexName, ADR-0013 §2)
const COMPLEX_DUOC = ["sources.S08.fields.subdivision_name"];
/** Mọi chuỗi lá của cây yaml, kèm đường dẫn chấm. */
function la(o, p = "") {
  if (typeof o === "string") return [[p, o]];
  if (o && typeof o === "object") return Object.entries(o).flatMap(([k, v]) => la(v, p ? `${p}.${k}` : k));
  return [];
}
const Y = YAML.parse(doc(MAPPINGS));

test("TV39-AC-5 mappings.yaml khai đúng ba dòng và bỏ nhãn chỉ nội bộ của S08", () => {
  kiemAc5(Y);
});

test("TV39-AC-5 đối chứng: mỗi ô đưa giá trị cũ về → đỏ gọi tên ô", () => {
  const sao = () => structuredClone(Y);
  const dot = [
    ["property_type.dd", (y) => { y.canonical.fields.property_type.dd = "PropertyType"; }],
    ["block_raw.dd", (y) => { y.canonical.fields.block_raw.dd = null; }],
    ["block_raw còn asset_nodes/ComplexName", (y) => { y.canonical.fields.block_raw.rationale = "tòa chuẩn hoá qua asset_nodes node_type=building (≈ComplexName)"; }],
    ["S08 project_name", (y) => { y.sources.S08.fields.project_name = "→ Building.ComplexName khi đối chiếu tay (DN1)"; }],
    ["S08 label", (y) => { y.sources.S08.label = "danh mục dự án (quỹ căn chủ đầu tư — chỉ nội bộ, AGENTS.md luật 5)"; }],
    ["S08 policy", (y) => { y.sources.S08.policy = "không tái xuất nguyên văn lên cổng Invest / API công khai; chỉ dựng danh mục căn + hiệu chuẩn"; }],
    ["project_id", (y) => { y.sources.S08.fields.project_id = "khoá nối qua s08_project_links (migration 074); chỉ local"; }],
    ["còn nối toà asset_nodes tại sources.S08.fields.block_code", (y) => { y.sources.S08.fields.block_code = "→ asset_nodes node_type=building (≈ComplexName)"; }],
  ];
  let bat = 0;
  for (const [o, f] of dot) {
    const y = sao();
    f(y);
    assert.throws(() => kiemAc5(y), new RegExp(`TV39-AC-5 ${o.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), o);
    bat++;
  }
  assert.equal(bat, 8);
  // policy cũ không có câu stg: đột biến chỉ xoá câu stg khỏi policy mới
  const y = sao();
  y.sources.S08.policy = String(y.sources.S08.policy).replace(/stg_s08_inventory[^;.]*[;.]?/, "");
  assert.throws(() => kiemAc5(y), /TV39-AC-5 policy thiếu luật stg/);
});

// ------------------------------------------------------------------------------------------------ AC-6
const TEP_QUY_MO = ["CONTEXT.md", ...Object.values(ADR), MAPPINGS];
function kiemQuyMo(docs) {
  for (const [p, t] of Object.entries(docs))
    t.split("\n").forEach((l, i) => {
      if (/khu đô thị/iu.test(l) && !l.includes("quy mô")) throw new Error(`TV39-AC-6 ${p}:${i + 1} khu đô thị không ở nghĩa quy mô`);
    });
}
const vocab = (root, ...a) => spawnSync(process.execPath, [join(REPO, "pipeline", "vocab.mjs"), "--root", root, ...a], { encoding: "utf8" });
const bam = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");

test("TV39-AC-6 vocab --check xanh, --write không đổi tệp sinh, khu đô thị chỉ ở nghĩa quy mô", () => {
  const r = vocab(REPO, "--check");
  assert.equal(r.status, 0, `TV39-AC-6 vocab lệch sổ: ${r.stdout}${r.stderr}`);
  const tam = mkdtempSync(join(tmpdir(), "tv39-"));
  try {
    const tep = [MAPPINGS, "CONTEXT.md", ...Object.values(TARGETS)];
    for (const p of new Set(tep)) {
      mkdirSync(dirname(join(tam, p)), { recursive: true });
      cpSync(join(REPO, p), join(tam, p));
    }
    const truoc = Object.fromEntries([...new Set(tep)].map((p) => [p, bam(join(tam, p))]));
    const w = vocab(tam, "--write");
    assert.equal(w.status, 0, w.stderr);
    const doi = [...new Set(tep)].filter((p) => bam(join(tam, p)) !== truoc[p]);
    assert.deepEqual(doi, [], "TV39-AC-6 vocab --write đổi tệp sinh");
    // đối chứng: thêm một giá trị enum mới vào sổ của bản tạm → --check lệch
    const y = readFileSync(join(tam, MAPPINGS), "utf8");
    const moi = y.replace("      - { code: apartment, label_vi: Căn hộ, dd_lookup: Condominium }", "      - { code: apartment, label_vi: Căn hộ, dd_lookup: Condominium }\n      - { code: tv39_thu, label_vi: Thử, local: true, rationale: thử }");
    assert.notEqual(moi, y, "bản tạm phải chứa dòng apartment của trục property_type");
    writeFileSync(join(tam, MAPPINGS), moi);
    const lech = vocab(tam, "--check");
    assert.equal(lech.status, 1, `TV39-AC-6 vocab lệch sổ phải đỏ trên bản tạm: ${lech.stdout}${lech.stderr}`);
    const that = Object.fromEntries(Object.values(TARGETS).map((p) => [p, bam(join(REPO, p))]));
    const w2 = vocab(tam, "--write");
    assert.equal(w2.status, 0, w2.stderr);
    const doiTam = Object.values(TARGETS).filter((p) => bam(join(tam, p)) !== truoc[p]);
    const doiThat = Object.values(TARGETS).filter((p) => bam(join(REPO, p)) !== that[p]);
    assert.ok(doiTam.length >= 1, "TV39-AC-6 --write trên bản tạm phải đổi tệp sinh của bản tạm");
    assert.deepEqual(doiThat, [], "TV39-AC-6 write ghi ngoài root");
  } finally {
    rmSync(tam, { recursive: true, force: true });
  }
  kiemQuyMo(Object.fromEntries(TEP_QUY_MO.map((p) => [p, doc(p)])));
});

test("TV39-AC-6 đối chứng: thêm dòng «Khu đô thị Ocean Park» → đỏ gọi tên tệp và dòng", () => {
  const docs = Object.fromEntries(TEP_QUY_MO.map((p) => [p, doc(p)]));
  const n = docs["CONTEXT.md"].split("\n").length + 1;
  assert.throws(() => kiemQuyMo({ ...docs, "CONTEXT.md": `${docs["CONTEXT.md"]}\nKhu đô thị Ocean Park` }), new RegExp(`TV39-AC-6 CONTEXT.md:${n} khu đô thị không ở nghĩa quy mô`));
});
