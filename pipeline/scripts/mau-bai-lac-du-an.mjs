#!/usr/bin/env node
// mau-bai-lac-du-an.mjs — AC-10 của hồ sơ _acceptance/dong-dau-dia-chi-luc-nap (TG2).
//
// Thước kiểm chính TIỀN ĐỀ của hàng: «bối cảnh nhóm là mặc định». Nó đo tỉ lệ bài THẬT SỰ nói về một dự án
// khác dự án của nhóm, trên mẫu bài của các nhóm sổ ghi đúng một dự án. Máy rút mẫu và tính; NGƯỜI gắn nhãn.
// Cỡ mẫu và hạt giống khai TRƯỚC khi ai nhìn bài nào — đó là điều làm phép đo này đáng tin.
//
//   node scripts/mau-bai-lac-du-an.mjs --rut --n 100 --seed <chuỗi> > evidence/mau-bai-lac-du-an.md
//   node scripts/mau-bai-lac-du-an.mjs --tinh evidence/mau-bai-lac-du-an.md
//
// Bài đọc QUA loadStgPosts (gạt bài thử) — không đọc thẳng stg_zalo_posts.
import { createHash } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { khoaNhomThat } from "../lib/eval-labels.mjs";
import { loadStgPosts } from "../lib/test-posts.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const Z = 1.959964; // 95%

/**
 * Khoảng Wilson 95% cho tỉ lệ k/n. Dùng Wilson chứ không dùng khoảng chuẩn vì mẫu nhỏ và tỉ lệ gần 0 —
 * khoảng chuẩn cho cận dưới âm và cận trên hẹp giả, đúng hai chỗ phép đo này dễ bị đọc sai.
 * @returns {{ p: number, duoi: number, tren: number, n: number, k: number }}
 */
export function wilson95(k, n) {
  if (!Number.isInteger(n) || n <= 0) throw new Error(`wilson95: cỡ mẫu phải là số nguyên dương (nhận ${n})`);
  if (!Number.isInteger(k) || k < 0 || k > n) throw new Error(`wilson95: số ca lạc phải trong [0, ${n}] (nhận ${k})`);
  const p = k / n;
  const z2 = Z * Z;
  const mau = 1 + z2 / n;
  const tam = (p + z2 / (2 * n)) / mau;
  const nua = (Z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / mau;
  return { p, duoi: Math.max(0, tam - nua), tren: Math.min(1, tam + nua), n, k };
}

/**
 * Rút mẫu xác định theo hạt giống: xếp bài theo băm (hạt giống + post_id) rồi lấy n bài đầu. Không ai chọn được
 * bài dễ, và cùng hạt giống TRÊN CÙNG MỘT KHO cho cùng mẫu. Kho lớn lên thì mẫu đổi — nên thứ khoá mẫu là
 * DANH SÁCH MÃ BÀI ghi trong hồ sơ, không phải một mình hạt giống.
 */
export function chonMau(bai, n, seed) {
  if (bai.length < n) throw new Error(`chonMau: kho không đủ bài (${bai.length} < ${n})`);
  return [...bai]
    .map((b) => ({ b, h: createHash("sha256").update(`${seed}|${b.post_id}`).digest("hex") }))
    .sort((x, y) => (x.h < y.h ? -1 : x.h > y.h ? 1 : 0))
    .slice(0, n)
    .map((x) => x.b);
}

/** Bài của các nhóm mà sổ nhóm ghi ĐÚNG MỘT dự án — tập mà tiền đề «bối cảnh nhóm» nói là an toàn. */
async function docBaiNhomMotDuAn(client) {
  const { rows: nhom } = await client.query(
    `SELECT group_key, project_node_ids[1] AS du_an FROM collection_units
      WHERE source_code = 'S03' AND cardinality(project_node_ids) = 1`);
  const cua = new Map(nhom.map((r) => [khoaNhomThat(r.group_key), String(r.du_an)]));
  const { posts } = await loadStgPosts(client, "zalo");
  const ra = [];
  for (const p of posts) {
    const k = p.conversation_id == null ? null : khoaNhomThat(p.conversation_id);
    if (k && cua.has(k)) ra.push({ post_id: p.post_id, nhom: k, du_an_nhom: cua.get(k), text: p.text ?? "" });
  }
  return { bai: ra, soNhom: cua.size };
}

const PHAN_TRAM = (x) => `${(x * 100).toFixed(2)}%`;

function inBangTrong({ mau, n, seed, soNhom, tongBai, mocDo }) {
  const d = [];
  d.push("# AC-10 — mẫu nhãn người: tỉ lệ bài lạc dự án", "");
  d.push("> Hai dòng dưới được ghi TRƯỚC khi ai nhìn bài nào. Đổi chúng sau khi gắn nhãn là làm hỏng phép đo.", "");
  d.push(`- **Cỡ mẫu khai trước:** n = ${n}`);
  d.push(`- **Hạt giống:** \`${seed}\``);
  d.push(`- Rút lúc: ${mocDo}`);
  d.push(`- Kho rút từ: ${tongBai} bài của ${soNhom} nhóm mà sổ ghi đúng một dự án`);
  d.push(`- Ngưỡng của hợp đồng: **cận TRÊN Wilson 95% ≤ 10%**. Với n = 100 thì nhiều nhất **4 bài lạc** mới đạt.`);
  d.push("", "## Cách điền", "");
  d.push("Cột `lac`: ghi `x` nếu bài THẬT SỰ nói về một dự án khác dự án của nhóm; để trống nếu không.", "");
  d.push("| # | lac | post_id | dự án của nhóm | đầu bài |", "|---|---|---|---|---|");
  mau.forEach((b, i) => {
    const dau = b.text.replace(/\s+/g, " ").slice(0, 70).replace(/\|/g, "\\|");
    d.push(`| ${i + 1} |  | \`${b.post_id}\` | ${b.du_an_nhom} | ${dau} |`);
  });
  // Danh sách mã bài: rút theo băm trên TOÀN KHO, nên kho lớn lên là mẫu đổi — hạt giống một mình KHÔNG đủ để
  // rút lại đúng mẫu này. Danh sách dưới đây mới là thứ khoá mẫu, và nó chép được vào hồ sơ (post_id không phải tầng A).
  d.push("", "## Mã bài của mẫu (chép vào hồ sơ — đây mới là thứ khoá mẫu)", "", "```");
  d.push(mau.map((b) => b.post_id).join("\n"), "```");
  d.push("", "## Kết quả", "", "_Chạy `--tinh` trên tệp này sau khi điền xong, rồi dán kết quả vào đây._", "");
  return d.join("\n");
}

/**
 * Đọc bảng đã điền: đếm dòng nhãn và số ô `lac` có dấu. Dòng chỉ được tính khi cột 1 là số thứ tự VÀ cột 3 là
 * mã bài trong dấu nháy ngược — tệp bằng chứng còn những bảng khác (bảng ngưỡng «| 5 | 11,18% | chưa đạt |»),
 * và đếm nhầm chúng là đếm ra ca lạc không có thật.
 */
export function docBangDaDien(md) {
  let n = 0, k = 0;
  for (const l of md.split("\n")) {
    const o = l.split("|");
    if (o.length < 5) continue;
    if (!/^\s*\d+\s*$/.test(o[1] ?? "")) continue;
    if (!/^\s*`[^`]+`\s*$/.test(o[3] ?? "")) continue;
    n++;
    if ((o[2] ?? "").trim() !== "") k++;
  }
  return { n, k };
}

/** Cỡ mẫu từ dòng lệnh. Không nhận NaN hay 0: bảng 0 dòng thoát 0 là một phép đo im lặng sai. */
export function soMau(raw) {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) throw new Error(`cỡ mẫu phải là số nguyên dương (nhận ${raw ?? "thiếu"})`);
  return n;
}

async function main() {
  const argv = process.argv.slice(2);
  const lay = (c, md) => { const i = argv.indexOf(c); return i < 0 ? md : argv[i + 1]; };

  if (argv.includes("--tinh")) {
    const tep = lay("--tinh");
    const { n, k } = docBangDaDien(readFileSync(tep, "utf8"));
    const w = wilson95(k, n);
    console.log(`cỡ mẫu thật: ${n} · bài lạc: ${k} · tỉ lệ: ${PHAN_TRAM(w.p)}`);
    console.log(`khoảng Wilson 95%: ${PHAN_TRAM(w.duoi)} — ${PHAN_TRAM(w.tren)}`);
    console.log(`cận trên so ngưỡng 10%: ${w.tren <= 0.1 ? "ĐẠT" : "CHƯA ĐẠT"}`);
    console.log(w.tren <= 0.1
      ? "Kết luận: bối cảnh nhóm đủ làm mặc định cho dự án của tin."
      : "Kết luận: bối cảnh nhóm CHƯA đủ làm mặc định — hàng phải đổi hướng, không phải ghi chú.");
    process.exit(w.tren <= 0.1 ? 0 : 1);
  }

  if (!argv.includes("--rut")) {
    console.error("dùng: --rut --n <số> --seed <chuỗi>   hoặc   --tinh <tệp>");
    process.exit(2);
  }
  const n = soMau(lay("--n", "100"));
  const seed = lay("--seed");
  if (!seed) { console.error("--rut cần --seed (hạt giống khai trước)"); process.exit(2); }

  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  try {
    const { bai, soNhom } = await docBaiNhomMotDuAn(client);
    const mau = chonMau(bai, n, seed);
    console.log(inBangTrong({ mau, n, seed, soNhom, tongBai: bai.length, mocDo: new Date().toISOString() }));
  } finally {
    await client.end();
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
