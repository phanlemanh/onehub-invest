// media-wiring.test.mjs — NH1 `media-canonical-reso`: khai RESO của bảng media (E2, NH-AC-1) và dòng bước đêm (E11, NH-AC-10).
// Không cần DB: đọc tệp migration, pipeline/mappings.yaml và hai script đêm.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const doc = (rel) => readFileSync(path.join(ROOT, rel), "utf8");

// Field DD 2.1 của resource Media cho từng cột (design §2.1); null = ngoài DD, phải có rationale + checked_on.
const DD = {
  media_key: "MediaKey",
  resource_record_key: "ResourceRecordKey",
  originating_system_name: "OriginatingSystemName",
  originating_system_resource_record_key: "OriginatingSystemResourceRecordKey",
  media_url: "MediaURL",
  media_order: "Order",
  local_file: null,
  media_modification_timestamp: "MediaModificationTimestamp",
};

/** Tên cột trong CREATE TABLE media của tệp migration (không chép tay). */
export function cotMigration(sql) {
  const than = sql.match(/CREATE TABLE IF NOT EXISTS media \(([\s\S]*?)\n\);/)?.[1];
  if (!than) throw new Error("không thấy CREATE TABLE media trong migration");
  return than
    .split("\n")
    .map((l) => l.match(/^ {2}([a-z_]+)\s+(text|integer|timestamptz)\b/)?.[1])
    .filter(Boolean);
}

/** Ném khi khối media của mappings.yaml lệch cột migration hay field DD. */
export function kiemMappings(mappingsText, sql) {
  const media = parse(mappingsText).media;
  if (!media?.fields) throw new Error("mappings.yaml thiếu khối media.fields");
  for (const c of cotMigration(sql)) {
    const f = media.fields[c];
    if (!f) throw new Error(`mappings.yaml thiếu cột ${c}`);
    if (f.dd !== DD[c]) throw new Error(`cột ${c}: dd ${f.dd} ≠ ${DD[c]}`);
    if (f.dd === null && !(f.rationale && f.checked_on)) throw new Error(`cột ${c} ngoài DD thiếu rationale/checked_on`);
  }
  if (media.dd_resource !== "Media" || media.dd_version !== "2.1") throw new Error("khối media phải khai dd_resource Media, dd_version 2.1");
}

/**
 * Ném khi script đêm không có đúng một bước transform-media cho nguồn, đứng ngay sau bước transform của nguồn.
 * Bước gọi qua `job_run` hoặc `buoc` (zalo-import-daily: `buoc` chia lượt nhanh/lượt đủ, hàng s03-len-nhanh-nac-1).
 */
export function kiemBuocDem(script, ten, { job, transform, nguon, chen = null }) {
  const dong = script.split("\n");
  const goi = (l) => /^(job_run|buoc) /.exec(l)?.[1];
  const media = dong.flatMap((l, i) => (/\btransform-media\b/.test(l) && goi(l) ? [i] : []));
  if (media.length !== 1) throw new Error(`${ten}: cần đúng một bước transform-media, thấy ${media.length}`);
  const g = goi(dong[media[0]]);
  const mong = `${g} ${job} transform-media node "$ROOT/pipeline/transform-media.mjs" ${nguon}`;
  if (dong[media[0]] !== mong) throw new Error(`${ten}: bước media phải là «${mong}»`);
  // `chen` (DA45, AC-1 ký 19/11): đúng MỘT bước tên ấy được đứng giữa transform và media — bước lạ, hai bước, hay đảo thứ tự vẫn đỏ.
  let truoc = media[0] - 1;
  if (chen) {
    // bước khai chen có mặt đúng một lần trong script, và đúng ở chỗ liền trước media
    const viTri = dong.flatMap((l, i) => (l.startsWith(`${g} ${job} ${chen} `) ? [i] : []));
    if (viTri.length !== 1 || viTri[0] !== truoc) truoc = -1;
    else truoc -= 1;
  }
  if (!dong[truoc]?.startsWith(`${g} ${job} ${transform} `)) {
    throw new Error(`${ten}: bước media phải đứng ngay sau ${transform}${chen ? ` (hoặc sau đúng một bước ${chen} liền sau ${transform})` : ""}`);
  }
}

const DEM = [
  ["scripts/chotot-daily.sh", { job: "chotot-daily", transform: "transform-chotot", nguon: "S06" }],
  ["scripts/zalo-import-daily.sh", { job: "zalo-import-daily", transform: "transform-zalo", nguon: "S03 S05", chen: "phuong-tu-du-an" }],
];

test("NH-AC-1 mappings khai bảng media", () => {
  const sql = doc("db/migrations/053_media.sql");
  assert.deepEqual(cotMigration(sql), Object.keys(DD), "cột migration lệch design §2.1");
  kiemMappings(doc("pipeline/mappings.yaml"), sql);
  assert.match(sql, /KHÔNG sync cloud/, "đầu 053 phải có dòng KHÔNG sync cloud");
  // Chiều đỏ: bản sao mappings bỏ mục media_order → đỏ gọi tên cột thiếu.
  const thieu = doc("pipeline/mappings.yaml").replace(/\n {4}media_order:\n(?: {6}.*\n)+/, "\n");
  assert.throws(() => kiemMappings(thieu, sql), /thiếu cột media_order/);
});

test("NH-AC-10 chạy hằng đêm", () => {
  for (const [rel, kv] of DEM) kiemBuocDem(doc(rel), rel, kv);
  // Chiều đỏ: bản sao đặt bước media trước bước transform → đỏ gọi tên script.
  const [rel, kv] = DEM[0];
  const l = doc(rel).split("\n");
  const i = l.findIndex((x) => x.includes("transform-media"));
  [l[i - 1], l[i]] = [l[i], l[i - 1]];
  const dir = mkdtempSync(path.join(tmpdir(), "nh1-dem-"));
  writeFileSync(path.join(dir, "chotot-daily.sh"), l.join("\n"));
  assert.throws(() => kiemBuocDem(readFileSync(path.join(dir, "chotot-daily.sh"), "utf8"), rel, kv), /scripts\/chotot-daily\.sh: bước media phải đứng ngay sau transform-chotot/);
});

test("NH-AC-10 bước chen giữa (DA45): đúng một bước phuong-tu-du-an được nhận; bước lạ, hai bước, đảo thứ tự đều đỏ", () => {
  const [rel, kv] = DEM[1];
  const goc = doc(rel);
  kiemBuocDem(goc, rel, kv);
  const l = goc.split("\n");
  const iP = l.findIndex((x) => x.startsWith("buoc zalo-import-daily phuong-tu-du-an "));
  const iT = iP - 1;
  assert.ok(l[iT].startsWith("buoc zalo-import-daily transform-zalo "), "bản gốc: phuong-tu-du-an liền sau transform-zalo");
  const sua = (f) => { const x = [...l]; f(x); return x.join("\n"); };
  const loi = /scripts\/zalo-import-daily\.sh: bước media phải đứng ngay sau transform-zalo/;
  // 1) bước lạ thay chỗ phuong-tu-du-an
  assert.throws(() => kiemBuocDem(sua((x) => { x[iP] = x[iP].replace("phuong-tu-du-an", "buoc-la"); }), rel, kv), loi);
  // 2) hai bước chen giữa (thêm một bước lạ sau phuong-tu-du-an)
  assert.throws(() => kiemBuocDem(sua((x) => { x.splice(iP + 1, 0, 'buoc zalo-import-daily buoc-la node "$ROOT/x.mjs"'); }), rel, kv), loi);
  // 2b) hai bước phuong-tu-du-an
  assert.throws(() => kiemBuocDem(sua((x) => { x.splice(iP, 0, x[iP]); }), rel, kv), loi);
  // 3) đảo thứ tự: phuong-tu-du-an lên trước transform-zalo
  assert.throws(() => kiemBuocDem(sua((x) => { [x[iT], x[iP]] = [x[iP], x[iT]]; }), rel, kv), loi);
  // không khai `chen` (như chotot-daily) thì chính bước phuong-tu-du-an cũng đỏ
  assert.throws(() => kiemBuocDem(goc, rel, { ...kv, chen: null }), loi);
});
