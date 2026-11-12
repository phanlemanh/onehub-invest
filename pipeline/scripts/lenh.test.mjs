// lenh.test.mjs — hồ sơ _acceptance/so-lenh-bo-ap (TV4), ca «SL-AC-5» và «SL-AC-5b»: hàm kiểm khuôn lệnh, bản .mjs
// (máy thu) và bản TS (route cloud) trên CÙNG ma trận viết trước; danh sách loại và khoá cấm rút từ ADR-0015. Thuần, không DB.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import * as M from "../lib/lenh.mjs";
import { khoaCamTuAdr, loaiTuAdr } from "./so-lenh-fixture.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const LENH_MJS = path.join(DIR, "..", "lib", "lenh.mjs");
const LENH_TS = path.join(DIR, "..", "..", "app", "src", "lib", "lenh.ts");

async function napTs() {
  const { tsImport } = await import(pathToFileURL(path.join(DIR, "..", "..", "app", "node_modules", "tsx", "dist", "esm", "api", "index.mjs")).href);
  return tsImport(pathToFileURL(LENH_TS).href, import.meta.url);
}

/** Đối tượng lồng theo đoạn của khoá cấm (bỏ `.*`): `channels.zalo` → {channels: {zalo: true}}. */
const long = (khoa) => khoa.replace(/\.\*$/, "").split(".").reduceRight((v, k) => ({ [k]: v }), true);
const pause = (payload) => ({ type: "source.pause", target: "S05", payload });

/** Ma trận viết trước: [tên ô, lệnh, kết quả kỳ vọng]. */
function maTran() {
  const o = [
    ["hop-le pause", pause({ reason: "het credit", resume_when: "credit reset 7/11" }), { ok: true }],
    ["hop-le resume", { type: "source.resume", target: "S05", payload: {} }, { ok: true }],
    ["loai la", { type: "source.purge", target: "S05", payload: {} }, { ok: false, ly_do: "loai-la:source.purge" }],
    ["loai chua co bo ap", { type: "unit.create", target: "S05", payload: {} }, { ok: false, ly_do: "loai-chua-co-bo-ap:unit.create" }],
    ["target S5", { type: "source.pause", target: "S5", payload: { reason: "x" } }, { ok: false, ly_do: "target-sai-khuon" }],
    ["target s05", { type: "source.pause", target: "s05", payload: { reason: "x" } }, { ok: false, ly_do: "target-sai-khuon" }],
    ["reason vang", pause({}), { ok: false, ly_do: "thieu-reason" }],
    ["reason rong", pause({ reason: "" }), { ok: false, ly_do: "thieu-reason" }],
    ["reason trang", pause({ reason: "   " }), { ok: false, ly_do: "thieu-reason" }],
    ["khoa thua", pause({ reason: "x", extra: 1 }), { ok: false, ly_do: "khoa-thua:extra" }],
  ];
  for (const k of M.KHOA_CAM) {
    o.push([`cam ${k} sau 1`, pause({ reason: "x", ...long(k) }), { ok: false, ly_do: `khoa-cam:${k}` }]);
    o.push([`cam ${k} sau 3`, pause({ reason: "x", a: { b: long(k) } }), { ok: false, ly_do: `khoa-cam:${k}` }]);
  }
  return o;
}

/** Ô thêm của Review Focus: payload không phải đối tượng. */
const O_PAYLOAD = [
  ["payload chuoi", pause("het credit"), { ok: false, ly_do: "payload-sai-khuon" }],
  ["payload mang", pause(["het credit"]), { ok: false, ly_do: "payload-sai-khuon" }],
  ["payload null", pause(null), { ok: false, ly_do: "payload-sai-khuon" }],
];

test("SL-AC-5 kiemLenh .mjs đúng từng ô của ma trận viết trước (32 ô + 3 ô payload)", () => {
  const o = maTran();
  assert.equal(o.length, 32, "ma trận phải đủ 2 + 1 + 1 + 2 + 3 + 1 + 11×2 = 32 ô");
  for (const [ten, cmd, muon] of [...o, ...O_PAYLOAD]) assert.deepEqual(M.kiemLenh(cmd), muon, `ô «${ten}»`);
});

test("SL-AC-5 danh sách loại và khoá cấm bằng đúng văn bản ADR-0015 §4, §7", () => {
  const loai = loaiTuAdr();
  const cam = khoaCamTuAdr();
  assert.equal(loai.length, 14, `ADR-0015 §4 rút ra ${loai.length} loại`);
  assert.equal(cam.length, 11, `ADR-0015 §7 rút ra ${cam.length} khoá cấm`);
  assert.deepEqual([...M.LOAI_LENH], loai);
  assert.deepEqual([...M.KHOA_CAM], cam);
});

test("SL-AC-5b bản TS trả giống hệt bản .mjs trên mọi ô; danh sách hai bản bằng nhau", async () => {
  const T = await napTs();
  assert.deepEqual([...T.LOAI_LENH], [...M.LOAI_LENH]);
  assert.deepEqual([...T.LOAI_CO_BO_AP], [...M.LOAI_CO_BO_AP]);
  assert.deepEqual([...T.KHOA_CAM], [...M.KHOA_CAM]);
  for (const [ten, cmd] of [...maTran(), ...O_PAYLOAD]) assert.deepEqual(T.kiemLenh(cmd), M.kiemLenh(cmd), `ô «${ten}» lệch hai bản`);
});

test("SL-AC-5 đối chứng đỏ: đột biến chỉ khớp khoá cấm từ gốc payload thì đúng 11 ô độ sâu 3 lệch", async () => {
  const goc = readFileSync(LENH_MJS, "utf8");
  const dong = "for (let i = 0; i + doan.length <= duong.length; i++) {";
  assert.equal(goc.split(dong).length, 2, "không thấy đúng một vòng khớp khoá cấm để đột biến");
  const dir = mkdtempSync(path.join(tmpdir(), "lenh-db-"));
  try {
    for (const f of ["vong-doi.mjs", "loai-lenh.mjs"]) writeFileSync(path.join(dir, f), readFileSync(path.join(path.dirname(LENH_MJS), f), "utf8"));
    writeFileSync(path.join(dir, "lenh.mjs"), goc.replace(dong, "for (let i = 1; i <= 1 && i + doan.length <= duong.length; i++) {"));
    const D = await import(pathToFileURL(path.join(dir, "lenh.mjs")).href);
    const lech = maTran().filter(([, cmd, muon]) => JSON.stringify(D.kiemLenh(cmd)) !== JSON.stringify(muon)).map(([ten]) => ten);
    assert.deepEqual(lech, M.KHOA_CAM.map((k) => `cam ${k} sau 3`), `đột biến lệch: ${lech.join(", ")}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ---- Hồ sơ _acceptance/so-lenh-sua-sau-tv4: «SS-AC-1», «SS-AC-2» — resume_when sai kiểu bị chặn ở khuôn ----
const NHANH_RW = 'if (type === "source.pause" && rw !== undefined && rw !== null && typeof rw !== "string") {';
const goNhanh = (s) => {
  assert.equal(s.split(NHANH_RW).length, 2, "không thấy đúng một nhánh resume_when để gỡ");
  return s.replace(NHANH_RW, "if (false) {");
};
const SAI_KIEU = { ok: false, ly_do: "resume-when-sai-khuon" };
/** Ma trận viết trước 9 ô: 4 sai kiểu, 5 hợp lệ. */
function maTranRw() {
  const o = [
    ["rw so", pause({ reason: "x", resume_when: 5 }), SAI_KIEU],
    ["rw true", pause({ reason: "x", resume_when: true }), SAI_KIEU],
    ["rw doi tuong", pause({ reason: "x", resume_when: {} }), SAI_KIEU],
    ["rw mang", pause({ reason: "x", resume_when: [] }), SAI_KIEU],
    ["rw vang", pause({ reason: "x" }), { ok: true }],
    ["rw null", pause({ reason: "x", resume_when: null }), { ok: true }],
    ["rw rong", pause({ reason: "x", resume_when: "" }), { ok: true }],
    ["rw trang", pause({ reason: "x", resume_when: "  " }), { ok: true }],
    ["rw chu", pause({ reason: "x", resume_when: "khi hết hạn mức" }), { ok: true }],
  ];
  assert.equal(o.length, 9, "ma trận resume_when phải đủ 9 ô");
  return o;
}

test("SS-AC-1 kiemLenh .mjs: resume_when số, đúng/sai, đối tượng, mảng bị chặn; vắng, null, chuỗi nhận (9 ô)", async () => {
  const o = maTranRw();
  for (const [ten, cmd, muon] of o) assert.deepEqual(M.kiemLenh(cmd), muon, `ô «${ten}»`);
  // Đối chứng đỏ: bản sao gỡ nhánh resume_when thì đúng 4 ô sai kiểu lệch.
  const dir = mkdtempSync(path.join(tmpdir(), "lenh-rw-"));
  try {
    for (const f of ["vong-doi.mjs", "loai-lenh.mjs"]) writeFileSync(path.join(dir, f), readFileSync(path.join(path.dirname(LENH_MJS), f), "utf8"));
    writeFileSync(path.join(dir, "lenh.mjs"), goNhanh(readFileSync(LENH_MJS, "utf8")));
    const D = await import(pathToFileURL(path.join(dir, "lenh.mjs")).href);
    const lech = o.filter(([, cmd, muon]) => JSON.stringify(D.kiemLenh(cmd)) !== JSON.stringify(muon)).map(([ten]) => ten);
    assert.deepEqual(lech, ["rw so", "rw true", "rw doi tuong", "rw mang"], "đối chứng đỏ resume-when-sai-khuon: ô lệch khác kỳ vọng");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("SS-AC-2 bản TS và bản .mjs trả giống hệt nhau trên 44 ô (9 ô resume_when + 35 ô SL-AC-5)", async () => {
  const o = [...maTranRw(), ...maTran(), ...O_PAYLOAD];
  assert.equal(o.length, 44, "hợp ma trận phải đúng 44 ô");
  const T = await napTs();
  for (const [ten, cmd] of o) assert.deepEqual(T.kiemLenh(cmd), M.kiemLenh(cmd), `ô «${ten}» lệch hai bản`);
  // Đối chứng đỏ: bản sao lenh.ts gỡ nhánh thì đúng 4 ô lệch.
  const dir = mkdtempSync(path.join(path.dirname(LENH_TS), ".lenh-rw-"));
  try {
    const tep = path.join(dir, "lenh.ts");
    writeFileSync(tep, goNhanh(readFileSync(LENH_TS, "utf8")));
    const { tsImport } = await import(pathToFileURL(path.join(DIR, "..", "..", "app", "node_modules", "tsx", "dist", "esm", "api", "index.mjs")).href);
    const D = await tsImport(pathToFileURL(tep).href, import.meta.url);
    const lech = o.filter(([, cmd]) => JSON.stringify(D.kiemLenh(cmd)) !== JSON.stringify(M.kiemLenh(cmd))).map(([ten]) => ten);
    assert.deepEqual(lech, ["rw so", "rw true", "rw doi tuong", "rw mang"], `đối chứng đỏ: ô lệch ${lech.join(", ")}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
