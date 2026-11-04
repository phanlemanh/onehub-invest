#!/usr/bin/env node
// quet-ten-nguon-html.mjs — hồ sơ chu-nguon-tren-cong: lấy HTML thật của các trang cổng Invest, đếm tên nguồn thật (AGENTS.md
// luật 6) trong chữ hiện lẫn toàn bộ HTML, gồm metadata, thẻ OG, aria và dữ liệu nhúng trong <script>. Sổ tên rút từ
// db/migrations (scripts/lib/tier-a-source-names.mjs), không viết cứng. Báo bằng mã S0x + trang, KHÔNG in tên.
// Dùng: node scripts/quet-ten-nguon-html.mjs [--base <url>] [--trang /a,/b]   (BASE_URL cũng được; mặc định :3456)
// Thoát: 0 sạch · 1 còn tên · 2 không đo được (không tới được, mã khác 200, hoặc trang không phải HTML có <h1>).
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findSourceNames, fold, sourceRegistrySeeds } from "./lib/tier-a-source-names.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Các trang công khai đo được của cổng Invest; `/listing/:mau` là một listing thật lấy từ ô thuê ngắn hạn. */
const O_NGAN_HAN = "/vn/hanoi/listings/rent?term=short";
const MAU_LISTING = "/listing/:mau";
export const TRANG = [
  "/",
  "/vn",
  "/vn/hanoi",
  "/vn/hanoi/map",
  "/vn/hanoi/listings/sale",
  "/vn/hanoi/listings/rent",
  O_NGAN_HAN,
  MAU_LISTING,
  "/yield?area=vn-hanoi",
  "/compare?areas=vn-hanoi,vn-hcmc",
  "/register",
  "/methodology",
];

/** Tiêu đề listing do chủ nhà gõ, nằm trong dữ liệu nhúng `"name":"…"`, có thể chứa tên nguồn. Đây là dữ liệu, không phải chữ của
 *  cổng: chỉ hai trang này được đếm riêng, không đỏ (hồ sơ chu-nguon-tren-cong, Known limits). */
const CO_TIEU_DE_TIN = new Set([O_NGAN_HAN, MAU_LISTING]);
const TRONG_TIEU_DE_TIN = /\\*"name\\*":\\*"[^"\\]*$/;
/** Ngoại lệ có tên (Mạnh chốt 04/11): đường link của nút mở trang gốc trên `/listing/[id]`, đúng khuôn hàm dựng link ở listing-labels.ts. */
const CO_LINK_GOC = new Set([MAU_LISTING]);

/** Tiêu đề tin được miễn trên một trang: vượt trần thì không còn là ca lẻ của dữ liệu. */
const TRAN_TIEU_DE_TIN = 5;
/** Câu sai hiện trạng trong chữ hiện. */
const CAU_SAI = /giả lập|dữ liệu mô phỏng/i;
/** Đối chứng dương: chữ phải có trong chữ hiện, để thước không xanh khi cả mục bị xoá. */
export const PHAI_CO = {
  "/": ["OpenStreetMap"], // câu về giá ở mục hỏi đáp đóng sẵn, không trong HTML lúc tải: ca CN-AC-3 đo tệp
  "/vn/hanoi": ["chưa phải giá giao dịch", "MÔ PHỎNG", "OpenStreetMap"],
  "/yield?area=vn-hanoi": ["chưa phải giá giao dịch", "MÔ PHỎNG"],
  "/methodology": ["nền tảng thuê ngắn hạn", "nguồn tham chiếu trả phí", "chưa phải giá giao dịch", "OpenStreetMap"],
};

// Thuộc tính mang chữ người đọc hay máy tìm kiếm đọc được; id, class, href, src chỉ tính ở phép đếm toàn HTML.
const THUOC_TINH_HIEN = /\s(?:title|aria-label|aria-description|alt|placeholder|content)="([^"]*)"/g;

/** Chữ hiện của một trang: phần chữ ngoài <script>/<style> và giá trị các thuộc tính ở THUOC_TINH_HIEN, kể cả thẻ <meta>. */
export function chuHien(html) {
  const than = html.replace(/<script\b[\s\S]*?<\/script>/gi, " ").replace(/<style\b[\s\S]*?<\/style>/gi, " ");
  const thuocTinh = [...than.matchAll(THUOC_TINH_HIEN)].map((m) => m[1]);
  return [...than.split(/<[^>]*>/), ...thuocTinh].join("\n");
}

function demTheoMa(hits) {
  const out = {};
  for (const h of hits) out[h.code] = (out[h.code] ?? 0) + 1;
  return out;
}

/** Vị trí các đường link trang gốc của S01 trên bản gập: chỉ đúng khuôn `https://www.<tên>.com/rooms/<số>`, không mở rộng. */
function linkGocRanges(html, entries) {
  const s01 = entries.find((e) => e.code === "S01");
  if (!s01) return [];
  const ten = fold(s01.realName.trim()).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...fold(html).matchAll(new RegExp(`https://www\\.${ten}\\.com/rooms/\\d+`, "g"))].map((m) => [m.index, m.index + m[0].length]);
}

/** { hien, html, tieuDeTin, linkGoc }, mỗi ô {S01: n}: chữ hiện · toàn tệp · phần được đếm riêng là tiêu đề tin · là link trang gốc. */
export function quetHtml(html, entries, { coTieuDeTin = false, coLinkGoc = false } = {}) {
  const toanBo = findSourceNames(html, entries);
  const ranges = coLinkGoc ? linkGocRanges(html, entries) : [];
  const laLink = (h) => h.code === "S01" && ranges.some(([a, b]) => h.start >= a && h.end <= b);
  const laTieuDe = (h) => coTieuDeTin && !laLink(h) && TRONG_TIEU_DE_TIN.test(html.slice(Math.max(0, h.start - 300), h.start));
  return {
    hien: demTheoMa(findSourceNames(chuHien(html), entries)),
    html: demTheoMa(toanBo.filter((h) => !laLink(h) && !laTieuDe(h))),
    tieuDeTin: demTheoMa(toanBo.filter(laTieuDe)),
    linkGoc: demTheoMa(toanBo.filter(laLink)),
  };
}

/** Một trang đo được là trang 200, kiểu HTML và có <h1>: trang lỗi hay trang trống không được tính là sạch. */
export function loiDoDuoc(status, contentType, html) {
  if (status !== 200) return `mã ${status}`;
  if (!/text\/html/.test(contentType ?? "")) return `kiểu ${contentType ?? "không rõ"}`;
  if (!/<h1[\s>]/.test(html)) return "không có <h1>";
  return null;
}

const inMa = (dem) => Object.entries(dem).map(([ma, n]) => `${ma}=${n}`).join(" ") || "0";

/** Sổ migration cộng `source_registry` local khi đọc được: S07, S08 chỉ có ở local. Thiếu DB thì nói ra, không im. */
async function soTen(log) {
  const seeds = sourceRegistrySeeds();
  try {
    const pg = createRequire(path.join(ROOT, "app", "package.json"))("pg");
    const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest", connectionTimeoutMillis: 3000 });
    await c.connect();
    try {
      const { rows } = await c.query("SELECT code, real_name FROM source_registry WHERE real_name IS NOT NULL");
      const them = rows.map((r) => ({ code: r.code, realName: r.real_name }));
      const out = [...seeds, ...them.filter((t) => !seeds.some((s) => s.code === t.code && s.realName === t.realName))];
      log(`sổ tên: ${[...new Set(out.map((e) => e.code))].sort().join(" ")} (migration + source_registry local)`);
      return out;
    } finally {
      await c.end();
    }
  } catch {
    log(`sổ tên: ${[...new Set(seeds.map((e) => e.code))].sort().join(" ")} (chỉ migration, không đọc được source_registry)`);
    return seeds;
  }
}

/** Mã một listing thật cho `/listing/:mau`, lấy từ ô thuê ngắn hạn; không có thì trang đó thành không đo được. */
async function layMauListing(base) {
  const html = await (await fetch(base + O_NGAN_HAN)).text();
  return /\/listing\/([A-Za-z0-9_-]+)/.exec(html)?.[1] ?? null;
}

export async function quetTrang({ base: goc, trang = TRANG, entries, log = console.log }) {
  const base = goc.replace(/\/$/, "");
  entries ??= await soTen(log);
  let conTen = 0;
  let khongDo = 0;
  for (const p of trang) {
    try {
      const mau = p === MAU_LISTING ? await layMauListing(base) : null;
      if (p === MAU_LISTING && !mau) {
        khongDo++;
        log(`KHONG-DO ${p}: không lấy được mã listing mẫu`);
        continue;
      }
      const res = await fetch(base + (mau ? `/listing/${mau}` : p), { redirect: "follow" });
      const html = await res.text();
      const loi = loiDoDuoc(res.status, res.headers.get("content-type"), html);
      if (loi) {
        khongDo++;
        log(`KHONG-DO ${p}: ${loi}`);
        continue;
      }
      const { hien, html: toanBo, tieuDeTin, linkGoc } = quetHtml(html, entries, { coTieuDeTin: CO_TIEU_DE_TIN.has(p), coLinkGoc: CO_LINK_GOC.has(p) });
      const chu = chuHien(html);
      const tieuDeVuot = Object.values(tieuDeTin).reduce((a, b) => a + b, 0) > TRAN_TIEU_DE_TIN;
      const thieu = (PHAI_CO[p] ?? []).filter((c) => !chu.includes(c));
      const cauSai = CAU_SAI.test(chu);
      const sach = Object.keys(toanBo).length === 0 && Object.keys(hien).length === 0 && !tieuDeVuot && !thieu.length && !cauSai;
      if (!sach) conTen++;
      if (tieuDeVuot) log(`VƯỢT-TRẦN ${p}: tiêu đề tin mang tên quá ${TRAN_TIEU_DE_TIN}`);
      if (cauSai) log(`CÂU-SAI ${p}: còn câu nói dữ liệu là giả lập hoặc mô phỏng`);
      if (thieu.length) log(`THIẾU-CHỮ ${p}: ${thieu.join(" · ")}`);
      const rieng = [
        Object.keys(tieuDeTin).length ? ` · tiêu đề tin (dữ liệu, không đỏ) ${inMa(tieuDeTin)}` : "",
        Object.keys(linkGoc).length ? ` · link trang gốc (ngoại lệ, không đỏ) ${inMa(linkGoc)}` : "",
      ].join("");
      log(`${sach ? "sạch" : "CÒN-TÊN"} ${p}: chữ hiện ${inMa(hien)} · toàn HTML ${inMa(toanBo)}${rieng} · ${html.length} byte`);
    } catch (e) {
      khongDo++;
      log(`KHONG-DO ${p}: ${e.cause?.code ?? e.message}`);
    }
  }
  log(`tổng: ${trang.length} trang · còn tên ${conTen} · không đo được ${khongDo}`);
  return khongDo > 0 ? 2 : conTen > 0 ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const lay = (ten) => (args.includes(ten) ? args[args.indexOf(ten) + 1] : undefined);
  const base = lay("--base") ?? process.env.BASE_URL ?? "http://localhost:3456";
  const trang = lay("--trang")?.split(",") ?? TRANG;
  process.exit(await quetTrang({ base, trang }));
}
