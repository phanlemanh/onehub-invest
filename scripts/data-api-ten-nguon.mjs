#!/usr/bin/env node
// data-api-ten-nguon.mjs — hồ sơ data-api-don-ten-nguon (PB5): soát tên nguồn thật (tầng A, AGENTS.md luật 6) trong
// cây `data-api/` — bản công khai qua subtree sang repo onehub-data-api. Mỗi cụm tên được xếp theo chỗ nó đứng:
//   chu-thich · chuoi (giá trị dữ liệu) · dinh-danh (tên bảng, cột, chỉ mục) · ten-tep.
// Tên bảng/cột là khoản nợ «dọn tên nguồn trong lược đồ» (đổi = migration + DDL cloud + mọi bên đọc) — ngoài PB5; chúng
// chỉ được có mặt khi dạng che bằng mã («S02»_listings) nằm trong DINH_DANH_BIET. Mọi cụm khác là vi phạm.
// Danh sách tên thật rút từ db/migrations (tier-a-source-names) — tệp này không chứa tên nào. Báo bằng mã S0x + tệp:dòng.
//   node scripts/data-api-ten-nguon.mjs            in tổng theo loại; thoát 0 sạch · 1 còn vi phạm
//   node scripts/data-api-ten-nguon.mjs --chi-tiet in thêm từng cụm (đã che)
import { readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { findSourceNames, sourceRegistrySeeds } from "./lib/tier-a-source-names.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Dạng che của mọi tên bảng/cột/chỉ mục mang tên nguồn đang có trong lược đồ mẫu và route của data-api (đo 25/11 trên
 * origin/main 78ea448dd: 89 cụm). Thêm dạng mới ở đây là thêm nợ lược đồ — phải có hàng lộ trình nêu lý do.
 */
export const DINH_DANH_BIET = new Set([
  "«S01»_snapshots",
  "idx_«S01»_snapshots_collected_at",
  "stg_«S03»_posts",
  "idx_stg_«S03»_posts_captured_at",
  "stg_«S04»_boundaries",
  "«S04»_id",
  "«S02»_markets",
  "«S02»_id",
  "«S02»_scores",
  "«S02»_market_metrics",
  "«S02»_submarket_metrics",
  "«S02»_sub_id",
  "«S02»_sub_monthly",
  "«S02»_future_daily",
  "«S02»_market_id",
  "«S02»_listings",
  "«S02»_listings_market_idx",
  "«S02»_listings_combined_idx",
  "idx_«S02»_listings_captured_at",
  "idx_«S02»_markets_captured_at",
  "«S02»_photos",
  "«S02»Id",
]);

const BO_QUA = new Set(["node_modules", "dist", ".git"]);

/** Mọi tệp chữ dưới `<root>/data-api` (bỏ node_modules, dist), đường tương đối gốc kho, xếp theo chữ. */
export function tepDataApi(root = ROOT) {
  const out = [];
  const di = (rel) => {
    for (const n of readdirSync(path.join(root, rel)).sort()) {
      if (BO_QUA.has(n)) continue;
      const con = path.posix.join(rel, n);
      if (statSync(path.join(root, con)).isDirectory()) di(con);
      else out.push(con);
    }
  };
  di("data-api");
  return out;
}

/**
 * Loại từng ký tự của một tệp: "m" mã · "c" chú thích · "s" chuỗi. SQL: `--`, `/* *\/`, '…' ('' là nháy trong chuỗi);
 * "…" là định danh có nháy → mã. TS/JS: `//`, `/* *\/`, '…', "…" là chuỗi; nội dung template `…` là câu SQL (đọc theo luật
 * SQL), `${…}` trong template là mã. Tệp khác (md, json…) coi cả tệp là chú thích — chữ người đọc.
 */
export function loaiKyTu(text, file) {
  const n = text.length;
  const L = new Array(n).fill("m");
  if (!/\.(sql|ts|tsx|js|mjs|cjs)$/i.test(file)) return L.fill("c");
  const sql = file.endsWith(".sql");
  const to = (a, b, k) => { for (let j = a; j < b && j < n; j++) L[j] = k; };
  // Quét SQL từ i tới khi gặp `dung` (ký tự kết, vd backtick) ở cấp ngoài; trả vị trí dừng.
  const quetSql = (i, dung) => {
    while (i < n) {
      const c = text[i];
      if (dung && c === dung) return i;
      if (dung && c === "$" && text[i + 1] === "{") { i = quetTs(i + 2, "}"); i++; continue; }
      if (c === "-" && text[i + 1] === "-") { const e = text.indexOf("\n", i); const k = e < 0 ? n : e; to(i, k, "c"); i = k; continue; }
      if (c === "/" && text[i + 1] === "*") { const e = text.indexOf("*/", i + 2); const k = e < 0 ? n : e + 2; to(i, k, "c"); i = k; continue; }
      if (c === "'") {
        let j = i + 1;
        while (j < n) { if (text[j] === "'" && text[j + 1] === "'") { j += 2; continue; } if (text[j] === "'") break; if (dung && text[j] === dung) break; j++; }
        to(i, j + 1, "s"); i = j + 1; continue;
      }
      i++;
    }
    return n;
  };
  // Quét TS từ i tới `dung` ở cấp ngoặc 0; trả vị trí dừng.
  const quetTs = (i, dung) => {
    let sau = 0;
    while (i < n) {
      const c = text[i];
      if (dung && c === dung && sau === 0) return i;
      if (c === "{") sau++;
      else if (c === "}") sau--;
      if (c === "/" && text[i + 1] === "/") { const e = text.indexOf("\n", i); const k = e < 0 ? n : e; to(i, k, "c"); i = k; continue; }
      if (c === "/" && text[i + 1] === "*") { const e = text.indexOf("*/", i + 2); const k = e < 0 ? n : e + 2; to(i, k, "c"); i = k; continue; }
      if (c === "'" || c === '"') {
        let j = i + 1;
        while (j < n && text[j] !== c && text[j] !== "\n") { if (text[j] === "\\") j++; j++; }
        to(i, j + 1, "s"); i = j + 1; continue;
      }
      if (c === "`") { const e = quetSql(i + 1, "`"); i = e + 1; continue; }
      i++;
    }
    return n;
  };
  if (sql) quetSql(0, null);
  else quetTs(0, null);
  return L;
}

const TU = /[A-Za-z0-9_]/;

/** Che một chuỗi: mỗi cụm tên thật → «S0x». */
export function che(s, entries) {
  for (const h of findSourceNames(s, entries).sort((a, b) => b.start - a.start)) s = `${s.slice(0, h.start)}«${h.code}»${s.slice(h.end)}`;
  return s;
}

/**
 * Quét cây data-api. Trả { cum: [{ file, dong, cot, code, loai, dang, hop_le }], tenTep: [{ file, code }] }.
 * `dang` = từ (với định danh) hay cả dòng đã che (với loại khác) — không bao giờ chứa tên thật.
 * Định danh hợp lệ khi `dang` ∈ DINH_DANH_BIET; chuỗi mà nội dung che đúng bằng một định danh biết (vd '«S02»_listings'::regclass)
 * cũng là định danh.
 */
export function quet(root = ROOT, { entries = sourceRegistrySeeds(root), files = tepDataApi(root), biet = DINH_DANH_BIET } = {}) {
  const cum = [];
  const tenTep = [];
  for (const file of files) {
    for (const h of findSourceNames(path.posix.basename(file), entries)) tenTep.push({ file: che(file, entries), code: h.code });
    let text;
    try { text = readFileSync(path.join(root, file), "utf8"); } catch { continue; }
    if (text.includes("\u0000")) continue; // tệp nhị phân
    const hits = findSourceNames(text, entries);
    if (hits.length === 0) continue;
    const L = loaiKyTu(text, file);
    for (const h of hits) {
      const k = L[h.start];
      const dong = text.slice(0, h.start).split("\n").length;
      const dau = text.lastIndexOf("\n", h.start - 1) + 1;
      let loai = k === "c" ? "chu-thich" : k === "s" ? "chuoi" : "dinh-danh";
      let a = h.start;
      let b = h.end;
      if (loai === "dinh-danh") { while (a > 0 && TU.test(text[a - 1])) a--; while (b < text.length && TU.test(text[b])) b++; }
      if (loai === "chuoi") {
        // giá trị chuỗi là đúng một tên bảng biết → định danh (tham chiếu lược đồ bằng chuỗi)
        let x = h.start; let y = h.end;
        while (x > 0 && L[x - 1] === "s" && TU.test(text[x - 1])) x--;
        while (y < text.length && L[y] === "s" && TU.test(text[y])) y++;
        if (text[x - 1] === "'" && text[y] === "'" && biet.has(che(text.slice(x, y), entries))) { loai = "dinh-danh"; a = x; b = y; }
      }
      const dang = loai === "dinh-danh" ? che(text.slice(a, b), entries) : che(text.slice(dau, text.indexOf("\n", h.start) < 0 ? text.length : text.indexOf("\n", h.start)), entries).trim();
      cum.push({ file: che(file, entries), dong, cot: h.start - dau + 1, code: h.code, loai, dang, hop_le: loai === "dinh-danh" && biet.has(dang) });
    }
  }
  return { cum, tenTep, soTep: files.length };
}

/** Tách một tệp SQL thành câu tại `;` nằm trong mã (không trong chú thích hay chuỗi); bỏ câu rỗng. */
export function tachCauSql(text, file = "x.sql") {
  const L = loaiKyTu(text, file);
  const out = [];
  let dau = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === ";" && L[i] === "m") { out.push(text.slice(dau, i + 1)); dau = i + 1; }
  }
  out.push(text.slice(dau));
  return out.filter((c) => c.split("").some((ch, j) => !/\s/.test(ch) && loaiKyTu(c, file)[j] === "m"));
}

/**
 * Dựng lược đồ mẫu của bản công khai lên DB trống qua `client` (pg): mọi `<dir>/db/*.sql` theo thứ tự tên rồi `<dir>/seed.sql`,
 * từng câu một như `psql -f` (câu lỗi không dừng tệp; trong BEGIN đã lỗi thì câu sau là 25P02). Trả
 * { loi: ["<số lần> LOI <3 ký tự đầu tên tệp> <SQLSTATE>"], doiTuong: ["BASE TABLE <tên>" | "VIEW <tên>"], nguon: ["<mã> | <real_name> |
 * <source_ids>"], macDinh: ["<bảng>.<cột> = <mặc định>"] } — tên chưa che.
 */
export async function dungLuocDoMau(dir, client) {
  const tep = readdirSync(path.join(dir, "db")).filter((n) => n.endsWith(".sql")).sort().map((n) => path.join(dir, "db", n));
  tep.push(path.join(dir, "seed.sql"));
  const dem = new Map();
  for (const f of tep) {
    for (const cau of tachCauSql(readFileSync(f, "utf8"), f)) {
      try { await client.query(cau); } catch (e) {
        const k = `LOI ${path.basename(f).slice(0, 3)} ${e.code ?? "?????"}`;
        dem.set(k, (dem.get(k) ?? 0) + 1);
      }
    }
  }
  const loi = [...dem].map(([k, n]) => `${n} ${k}`).sort();
  const { rows } = await client.query("SELECT table_type || ' ' || table_name AS d FROM information_schema.tables WHERE table_schema = 'public' ORDER BY 1");
  // quan hệ giữa các tệp: dòng source_registry (mã · real_name · source_ids) và mọi giá trị mặc định của cột
  const sr = await client.query("SELECT code || ' | ' || real_name || ' | ' || array_to_string(source_ids, ',') AS d FROM source_registry ORDER BY code");
  const md = await client.query("SELECT table_name || '.' || column_name || ' = ' || column_default AS d FROM information_schema.columns WHERE table_schema = 'public' AND column_default IS NOT NULL ORDER BY 1");
  return { loi, doiTuong: rows.map((r) => r.d), nguon: sr.rows.map((r) => r.d), macDinh: md.rows.map((r) => r.d) };
}

/** Tổng theo loại + danh sách vi phạm (cụm không hợp lệ và tên tệp). */
export function tongKet({ cum, tenTep, soTep = 0 }) {
  const theoLoai = {};
  for (const c of cum) theoLoai[c.loai] = (theoLoai[c.loai] ?? 0) + 1;
  const viPham = cum.filter((c) => !c.hop_le);
  return { soTep, tong: cum.length, theoLoai, tenTep: tenTep.length, dinhDanhBiet: cum.filter((c) => c.hop_le).length, viPham, viPhamTenTep: tenTep };
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const k = tongKet(quet());
  console.log(`data-api ten-nguon: ${k.soTep} tệp đã quét · ${k.tong} cụm trong nội dung (${Object.entries(k.theoLoai).map(([l, s]) => `${l} ${s}`).join(" · ") || "0"}) · tên tệp ${k.tenTep} · định danh lược đồ đã biết ${k.dinhDanhBiet}`);
  for (const v of k.viPham) console.log(`  VI PHẠM ${v.loai} ${v.code} ${v.file}:${v.dong}:${v.cot} — ${process.argv.includes("--chi-tiet") ? v.dang : ""}`);
  for (const v of k.viPhamTenTep) console.log(`  VI PHẠM ten-tep ${v.code} ${v.file}`);
  const ok = k.viPham.length === 0 && k.viPhamTenTep.length === 0;
  console.log(ok ? "data-api ten-nguon: SẠCH — ngoài định danh lược đồ đã biết, 0 cụm" : `data-api ten-nguon: ĐỎ — ${k.viPham.length + k.viPhamTenTep.length} vi phạm`);
  process.exit(ok ? 0 : 1);
}
