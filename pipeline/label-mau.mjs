#!/usr/bin/env node
// label-mau.mjs — PL8 `tap-nhan-mau-ocp1`: sinh tập tin mẫu của một lát (đáp án biết sẵn) cho PL9 chấm cách đọc tin.
//   node pipeline/label-mau.mjs --lat ocp1 --n 200 --seed <s> [--out <tệp.jsonl>]
// In tóm tắt (ý định × loại tin, dev/test); --out ghi JSONL. Hàm thuần lib/tap-mau.mjs — không DB, cùng tham số ra cùng
// tệp từng byte. Mọi tin mang dấu mẫu (mau: true, id «mau-…»); không có cờ bỏ dấu.
import { realpathSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { sinhTapMau, veJsonl } from "./lib/tap-mau.mjs";

function docCo(argv) {
  const co = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (["--lat", "--n", "--seed", "--out"].includes(a) && i + 1 < argv.length) co[a.slice(2)] = argv[++i];
    else throw new Error(`label-mau: co la «${a}» — chỉ nhận --lat --n --seed --out`);
  }
  if (!co.lat) throw new Error("label-mau: thiếu --lat");
  const n = Number(co.n);
  if (!Number.isInteger(n) || n <= 0) throw new Error("label-mau: --n phải là số nguyên dương");
  if (!co.seed) throw new Error("label-mau: thiếu --seed");
  return { lat: co.lat, n, seed: co.seed, out: co.out ?? null };
}

function main() {
  const co = docCo(process.argv.slice(2));
  const tap = sinhTapMau(co);
  const dem = new Map();
  for (const t of tap.tin) {
    const k = `${t.nhan.listing_intent.value} × ${t.nhan.kind.value ?? "không nêu"}`;
    dem.set(k, (dem.get(k) ?? 0) + 1);
  }
  const dev = tap.tin.filter((t) => t.split === "dev").length;
  console.log(`label-mau: lát ${tap.lat} · seed ${tap.seed} · n ${tap.n} · khuôn bản ${tap.khuon_ban.slice(0, 12)}`);
  for (const [k, v] of [...dem].sort()) console.log(`  ${k}: ${v}`);
  console.log(`dev ${dev} / test ${tap.n - dev}`);
  if (co.out) {
    writeFileSync(co.out, veJsonl(tap));
    console.log(`đã ghi ${co.out}`);
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    main();
  } catch (e) {
    console.error(e.message ?? e);
    process.exit(1);
  }
}
