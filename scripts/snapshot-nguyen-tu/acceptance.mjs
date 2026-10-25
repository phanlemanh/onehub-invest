#!/usr/bin/env node
/**
 * Eval máy cho hồ sơ snapshot-nguyen-tu (2510-8 — snapshot ghi vào '.<id>.partial' rồi đổi tên ở finalize;
 * hai tệp bọc nạp bỏ qua thư mục đang ghi / thiếu manifest).
 *
 *   node scripts/snapshot-nguyen-tu/acceptance.mjs <dang-ghi|trung-ms|ten-that-co-san>
 *
 * Chạy SnapshotWriter của bản build collector (collector/dist) trên thư mục gốc TẠM; không đụng collector/snapshots
 * thật, không mở cổng, không ghi DB. `Date` được ghim trong tiến trình này để ép hai writer cùng mili-giây.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gunzipSync } from "node:zlib";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
// SNT_STORAGE (tuỳ chọn) trỏ bản storage khác để đối chứng — mặc định bản build của kho
const { SnapshotWriter } = await import(pathToFileURL(process.env.SNT_STORAGE ?? join(ROOT, "collector/dist/core/storage.js")).href);

let failures = 0;
const check = (ok, line) => { console.log(`${ok ? "ok  " : "FAIL"} ${line}`); if (!ok) failures++; };
const finish = (tag) => { if (failures) { console.log(`${tag} FAIL (${failures} mục)`); process.exit(1); } console.log(`${tag} PASS`); };

const RealDate = Date;
const pinDate = (iso) => {
  const t = new RealDate(iso).getTime();
  globalThis.Date = class extends RealDate { constructor(...a) { super(...(a.length ? a : [t])); } static now() { return t; } };
};
const unpin = () => { globalThis.Date = RealDate; };
const COV = { discovered: 1, captured: 1, failed: 0, methods: { acc: 1 } };
const item = (i) => ({ source: "acc-src", sourceId: `acc-${i}`, kind: "post", fetchedAt: "2026-10-25T00:00:00Z", payload: { i }, meta: { city: "acc" } });
const ls = (d) => (existsSync(d) ? readdirSync(d).sort() : []);
/** Thư mục tên thật trọn vẹn: có manifest, mọi tệp trong manifest có mặt và khớp sha256, items đọc lại đúng. */
function tronVen(dir, want) {
  if (!existsSync(join(dir, "manifest.json"))) return "thiếu manifest";
  const m = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  for (const f of m.files) {
    const p = join(dir, f.name);
    if (!existsSync(p)) return `thiếu ${f.name}`;
    if (createHash("sha256").update(readFileSync(p)).digest("hex") !== f.sha256) return `sha256 lệch ${f.name}`;
  }
  const items = m.files.filter((f) => f.name.startsWith("items-")).flatMap((f) => JSON.parse(gunzipSync(readFileSync(join(dir, f.name)))));
  const ids = items.map((x) => x.sourceId).sort().join(",");
  return ids === want.sort().join(",") ? "ok" : `items lệch: ${ids}`;
}

// AC-1, AC-2: trong lúc ghi chỉ có '.<id>.partial'; finalize đổi tên ra thư mục tên thật trọn vẹn
async function modeDangGhi() {
  const R = mkdtempSync(join(tmpdir(), "acc-snt-"));
  try {
    const w = new SnapshotWriter(R, "acc", "acc-src");
    await w.write([item(1), item(2)]);
    await w.addExtraFile("media/a.bin", Buffer.from("acc-media"));
    const city = join(R, "acc");
    check(!existsSync(join(city, w.snapshotId)), "đang ghi (sau write + tải media): thư mục tên thật CHƯA có");
    check(ls(city).length === 1 && ls(city)[0] === `.${w.snapshotId}.partial`, `chỉ có một thư mục ẩn '.<id>.partial' (${ls(city).join(", ")})`);
    check(!existsSync(join(city, `.${w.snapshotId}.partial`, "manifest.json")), "manifest chưa có trước finalize");
    await w.finalize(COV);
    check(ls(city).length === 1 && ls(city)[0] === w.snapshotId, `sau finalize: chỉ còn thư mục tên thật (${ls(city).join(", ")})`);
    const tv = tronVen(join(city, w.snapshotId), ["acc-1", "acc-2"]);
    check(tv === "ok", `thư mục tên thật trọn vẹn: manifest + items + media khớp sha256 (${tv})`);
    check(existsSync(join(city, w.snapshotId, "media/a.bin")), "tệp media nằm trong thư mục tên thật");
  } finally { rmSync(R, { recursive: true, force: true }); }
  finish("DANG-GHI");
}

// AC-3: hai writer cùng mili-giây — trước khi A finalize, và sau khi A đã finalize — luôn ra hai snapshot riêng, không mất item
async function modeTrungMs() {
  const R = mkdtempSync(join(tmpdir(), "acc-snt-"));
  try {
    pinDate("2026-10-25T10:00:00.123Z");
    const A = new SnapshotWriter(R, "acc", "acc-src");
    await A.write([item("a1")]);
    const B = new SnapshotWriter(R, "acc", "acc-src"); // cùng ms, A chưa finalize
    await B.write([item("b1")]);
    await A.finalize(COV);
    const C = new SnapshotWriter(R, "acc", "acc-src"); // cùng ms, A đã finalize
    await C.write([item("c1")]);
    await B.finalize(COV);
    await C.finalize(COV);
    unpin();
    const ids = [A.snapshotId, B.snapshotId, C.snapshotId];
    check(new Set(ids).size === 3, `ba writer cùng ms ra ba id khác nhau (${ids.join(" · ")})`);
    const city = join(R, "acc");
    check(ls(city).filter((d) => d.startsWith(".")).length === 0, "không còn thư mục '.partial' nào");
    for (const [w, want] of [[A, ["acc-a1"]], [B, ["acc-b1"]], [C, ["acc-c1"]]]) {
      const tv = tronVen(join(city, w.snapshotId), want);
      check(tv === "ok", `${w.snapshotId}: trọn vẹn, đúng item của chính nó (${tv})`);
    }
  } finally { unpin(); rmSync(R, { recursive: true, force: true }); }
  finish("TRUNG-MS");
}

// AC-3: thư mục tên thật có sẵn (bản cũ / crash kiểu cũ) cùng id → writer mới lấy hậu tố, không đụng thư mục cũ
async function modeTenThatCoSan() {
  const R = mkdtempSync(join(tmpdir(), "acc-snt-"));
  try {
    pinDate("2026-10-25T10:00:00.456Z");
    const probe = new SnapshotWriter(R, "acc", "acc-src");
    const sid = probe.snapshotId;
    rmSync(join(R, "acc", `.${sid}.partial`), { recursive: true });
    mkdirSync(join(R, "acc", sid)); // thư mục tên thật có sẵn, rỗng, không manifest
    const w = new SnapshotWriter(R, "acc", "acc-src");
    await w.write([item(9)]);
    await w.finalize(COV);
    unpin();
    check(w.snapshotId !== sid && w.snapshotId.startsWith(sid + "-"), `writer mới lấy hậu tố (${w.snapshotId})`);
    check(ls(join(R, "acc", sid)).length === 0, "should-NOT-fire: thư mục cũ cùng tên không bị ghi vào");
    check(tronVen(join(R, "acc", w.snapshotId), ["acc-9"]) === "ok", "snapshot mới trọn vẹn");
  } finally { unpin(); rmSync(R, { recursive: true, force: true }); }
  finish("TEN-THAT-CO-SAN");
}

const modes = { "dang-ghi": modeDangGhi, "trung-ms": modeTrungMs, "ten-that-co-san": modeTenThatCoSan };
const mode = process.argv[2];
if (!modes[mode]) { console.error(`dùng: node scripts/snapshot-nguyen-tu/acceptance.mjs <${Object.keys(modes).join("|")}>`); process.exit(2); }
await modes[mode]();
