#!/usr/bin/env node
// eval-classify.mjs — PL9 `eval-classify-wilson`: độ đúng từng ô (cách đọc × trường × phân khúc) theo cận dưới Wilson so
// với ngưỡng F3.
//   npm run eval:classify -- --lat ocp1 [--split test|dev] [--dry]   nhãn người (DB local) → dq_check_results
//   npm run eval:classify -- --tap-mau <tệp.jsonl>                   tập mẫu PL8 (label-mau.mjs --out) → chỉ in
// Nhãn người đọc trong giao dịch chỉ đọc; ghi mỗi ô một dòng `eval-classify` trong một giao dịch (--dry: không ghi). Tập
// mẫu không mở kết nối DB và không ghi gì (Hỏi-1): số mẫu dễ hơn tin thật, không đứng cạnh số người trên /ops/quality.
import { randomBytes } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { chamO, docNhanNguoi, docTapMau, ghiKetQua } from "./lib/eval-classify.mjs";

function docCo(argv) {
  const co = { split: "test", dry: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry") co.dry = true;
    else if (["--lat", "--split", "--tap-mau"].includes(a) && i + 1 < argv.length) co[a.slice(2)] = argv[++i];
    else throw new Error(`eval-classify: cờ lạ «${a}» — chỉ nhận --lat --split --dry --tap-mau`);
  }
  if (co["tap-mau"]) {
    if (co.lat || co.dry) throw new Error("eval-classify: --tap-mau không đi cùng --lat/--dry (tập mẫu không ghi DB)");
    return co;
  }
  if (!co.lat) throw new Error("eval-classify: thiếu --lat (hoặc --tap-mau <tệp>)");
  if (!["test", "dev"].includes(co.split)) throw new Error("eval-classify: --split phải là test hoặc dev");
  return co;
}

const so = (x) => (x == null ? "—" : x.toFixed(4).replace(".", ","));

function inBang(o) {
  for (const x of o) {
    const ket = x.trang_thai === "skip" ? `bỏ qua (${x.ly_do})` : `${x.trang_thai} — cận dưới ${so(x.can_duoi)} / ngưỡng ${so(x.nguong)}`;
    console.log(`  ${x.phan_khuc}|${x.cach_doc}|${x.truong}  n ${x.n}  đúng ${x.dung ?? "—"}  ${ket}`);
  }
  const dem = (s) => o.filter((x) => x.trang_thai === s).length;
  console.log(`${o.length} ô · ${dem("pass")} đạt · ${dem("fail")} không đạt · ${dem("skip")} bỏ qua`);
}

async function main() {
  const co = docCo(process.argv.slice(2));
  if (co["tap-mau"]) {
    const tap = docTapMau(readFileSync(co["tap-mau"], "utf8"));
    console.log(`eval-classify: tập mẫu ${co["tap-mau"]} · lát ${tap.lat} · seed ${tap.seed} · ${tap.tin.length} tin — chỉ in, không ghi DB`);
    inBang(chamO({ tin: tap.tin }));
    return;
  }
  const { default: pg } = await import("pg");
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest",
  });
  await client.connect();
  try {
    const { tin, bat_dong, mat_chu } = await docNhanNguoi(client, { lat: co.lat, split: co.split });
    const o = chamO({ tin });
    const run = `ecw-${new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15)}-${randomBytes(3).toString("hex")}`;
    console.log(`eval-classify: nhãn người · lát ${co.lat} · split ${co.split} · ${tin.length} tin · bất đồng ${bat_dong} · mất chữ ${mat_chu} · run ${run}`);
    inBang(o);
    if (co.dry) console.log("--dry: không ghi dq_check_results");
    else console.log(`đã ghi ${await ghiKetQua(client, o, { lat: co.lat, run, tap: "nguoi", split: co.split, bat_dong, mat_chu })} dòng dq_check_results`);
  } finally {
    await client.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  });
}
