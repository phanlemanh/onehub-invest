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
    writeFileSync(path.join(dir, "vong-doi.mjs"), readFileSync(path.join(path.dirname(LENH_MJS), "vong-doi.mjs"), "utf8"));
    writeFileSync(path.join(dir, "lenh.mjs"), goc.replace(dong, "for (let i = 1; i <= 1 && i + doan.length <= duong.length; i++) {"));
    const D = await import(pathToFileURL(path.join(dir, "lenh.mjs")).href);
    const lech = maTran().filter(([, cmd, muon]) => JSON.stringify(D.kiemLenh(cmd)) !== JSON.stringify(muon)).map(([ten]) => ten);
    assert.deepEqual(lech, M.KHOA_CAM.map((k) => `cam ${k} sau 3`), `đột biến lệch: ${lech.join(", ")}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
