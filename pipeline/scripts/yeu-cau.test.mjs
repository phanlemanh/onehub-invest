// yeu-cau.test.mjs — bảng Yêu cầu, phần không cần DB (YC-AC-n ↔ _acceptance/bang-yeu-cau/evals.yaml): khai RESO của bảng
// (YC-AC-2). Ca đỏ chạy trên bản sao đột biến chép cạnh tệp thật rồi xoá.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { KIEM_ENUM } from "../dq-enum-vocab.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const doc = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
let nBan = 0;

/** Tên cột trong CREATE TABLE inquiry_records của tệp migration (không chép tay). */
function cotMigration(sql) {
  const than = sql.match(/CREATE TABLE IF NOT EXISTS inquiry_records \(([\s\S]*?)\n\);/)?.[1];
  if (!than) throw new Error("không thấy CREATE TABLE inquiry_records trong migration 058");
  return than.split("\n").map((l) => l.match(/^ {2}([a-z_0-9]+)\s+[a-z]/)?.[1]).filter(Boolean);
}

/** Ném khi khối inquiries của sổ thiếu cột của migration, sai resource, hoặc cột ngoài DD thiếu rationale. */
function kiemKhoiInquiries(mappingsText, sql) {
  const k = parse(mappingsText).inquiries;
  if (!k?.fields) throw new Error("mappings.yaml thiếu khối inquiries.fields");
  if (k.dd_resource !== "SavedSearch" || k.dd_version !== "2.1") throw new Error("khối inquiries phải khai dd_resource SavedSearch, dd_version 2.1");
  if (k.table !== "inquiry_records") throw new Error("khối inquiries phải trỏ bảng inquiry_records");
  const cot = cotMigration(sql);
  if (cot.length < 19) throw new Error(`migration 058 chỉ đọc được ${cot.length} cột`);
  for (const c of cot) {
    const f = k.fields[c];
    if (!f) throw new Error(`mappings.yaml thiếu cột ${c}`);
    if (!f.dd && !(f.rationale && f.checked_on)) throw new Error(`cột ${c} ngoài DD thiếu rationale/checked_on`);
  }
}

test("YC-AC-2 sổ: khối inquiries (SavedSearch) đủ cột, DQ enum hai mục, CONTEXT «Yêu cầu» đã sửa", () => {
  const sql = doc("db/migrations/058_inquiry_records.sql");
  kiemKhoiInquiries(doc("pipeline/mappings.yaml"), sql);
  for (const cot of ["kind", "property_type"]) {
    assert.ok(KIEM_ENUM.some((m) => m.bang === "inquiries" && m.cot === cot && m.truc === cot), `KIEM_ENUM thiếu (inquiries, ${cot})`);
  }
  const ctx = doc("CONTEXT.md");
  const muc = ctx.split("\n").find((l) => l.startsWith("**Yêu cầu**:"));
  assert.ok(muc, "CONTEXT thiếu mục «Yêu cầu»");
  assert.ok(!muc.includes("bảng lưu yêu cầu và ghép với listing là tính năng sau"), "CONTEXT còn câu «tính năng sau»");
  assert.ok(muc.includes("inquiries"), "CONTEXT «Yêu cầu» không nhắc bảng inquiries");
});

test("YC-AC-2 đối chứng: bản sao sổ bỏ rationale của post_ids → lỗi gọi tên post_ids", () => {
  const goc = doc("pipeline/mappings.yaml");
  const dotBien = goc.replace(/(\n {4}post_ids:\n {6}dd: null\n) {6}rationale: >\n(?: {8}.*\n)+/, "$1");
  assert.notEqual(dotBien, goc, "bản sao đột biến không đổi gì");
  const tep = path.join(ROOT, "pipeline", `mappings.dot-bien-${process.pid}-${++nBan}.yaml`);
  writeFileSync(tep, dotBien);
  try {
    assert.throws(() => kiemKhoiInquiries(readFileSync(tep, "utf8"), doc("db/migrations/058_inquiry_records.sql")), /post_ids/);
  } finally {
    rmSync(tep, { force: true });
  }
});
