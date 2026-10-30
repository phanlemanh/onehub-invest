// media-wiring.test.mjs — NH1 `media-canonical-reso`: khai RESO của bảng media (E2, NH-AC-1). Ca bước đêm (E11, NH-AC-10)
// chờ Mạnh quyết cách nối (Hỏi-3: dãy bước của job đêm đang ghim ở hồ sơ đã ký).
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

/** Ném khi script đêm không có đúng một bước transform-media cho nguồn, đứng ngay sau bước transform của nguồn. */
export function kiemBuocDem(script, ten, { job, transform, nguon }) {
  const dong = script.split("\n");
  const media = dong.flatMap((l, i) => (/\btransform-media\b/.test(l) && l.startsWith("job_run ") ? [i] : []));
  if (media.length !== 1) throw new Error(`${ten}: cần đúng một bước transform-media, thấy ${media.length}`);
  const mong = `job_run ${job} transform-media node "$ROOT/pipeline/transform-media.mjs" ${nguon}`;
  if (dong[media[0]] !== mong) throw new Error(`${ten}: bước media phải là «${mong}»`);
  if (!dong[media[0] - 1]?.startsWith(`job_run ${job} ${transform} `)) throw new Error(`${ten}: bước media phải đứng ngay sau ${transform}`);
}

const DEM = [
  ["scripts/chotot-daily.sh", { job: "chotot-daily", transform: "transform-chotot", nguon: "S06" }],
  ["scripts/zalo-import-daily.sh", { job: "zalo-import-daily", transform: "transform-zalo", nguon: "S03 S05" }],
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
