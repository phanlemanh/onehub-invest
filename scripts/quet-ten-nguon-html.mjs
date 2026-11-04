#!/usr/bin/env node
// quet-ten-nguon-html.mjs — hồ sơ chu-nguon-tren-cong: lấy HTML thật của các trang cổng Invest, đếm tên nguồn thật (AGENTS.md
// luật 6) trong chữ hiện lẫn toàn bộ HTML, gồm metadata, thẻ OG, aria và dữ liệu nhúng trong <script>. Sổ tên rút từ
// db/migrations (scripts/lib/tier-a-source-names.mjs), không viết cứng. Báo bằng mã S0x + trang, KHÔNG in tên.
// Dùng: node scripts/quet-ten-nguon-html.mjs [--base <url>] [--trang /a,/b]   (BASE_URL cũng được; mặc định :3456)
// Thoát: 0 sạch · 1 còn tên · 2 không đo được (không tới được, mã khác 200, hoặc trang không phải HTML có <h1>).
import { realpathSync } from "node:fs";
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

/** Tiêu đề listing do chủ nhà gõ có thể chứa tên nguồn. Đây là dữ liệu, không phải chữ của cổng: chỉ hai trang này đếm riêng, không đỏ
 *  (hồ sơ chu-nguon-tren-cong, Known limits). Danh sách tiêu đề đọc từ DB máy thu, không đoán từ trang, nên chữ của cổng không lọt theo;
 *  không đọc được DB thì không miễn gì. */
const CO_TIEU_DE_TIN = new Set([O_NGAN_HAN, MAU_LISTING]);
/** Ngoại lệ có tên (Mạnh chốt 04/11): đường link của nút mở trang gốc trên `/listing/[id]`, đúng khuôn hàm dựng link ở listing-labels.ts. */
const CO_LINK_GOC = new Set([MAU_LISTING]);

/** Tiêu đề tin được miễn trên một trang: vượt trần thì không còn là ca lẻ của dữ liệu. */
const TRAN_TIEU_DE_TIN = 5; // số tiêu đề khác nhau mang tên trên một trang
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

const thoatHtml = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
// Như htmlEscapeJsonString của Next: dữ liệu nhúng thoát & < > thành \\uXXXX.
const thoatNhung = (t) => t.replace(/&/g, "\\u0026").replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
const trongJson = (t) => JSON.stringify(t).slice(1, -1);

/** Mọi dạng một tiêu đề có thể hiện trong HTML: chữ thô, thoát HTML, dữ liệu nhúng một lớp và hai lớp JSON. */
function dangCua(t) {
  const motLop = trongJson(t);
  const haiLop = trongJson(motLop);
  return [...new Set([t, thoatHtml(t), motLop, thoatNhung(motLop), haiLop, thoatNhung(haiLop)])];
}

/** Hit nào nằm trọn trong một lần xuất hiện của tiêu đề, và các tiêu đề có mặt, trên `text`. */
function trongTieuDe(text, tieuDe) {
  const f = fold(text);
  const ranges = [];
  const coMat = new Set();
  for (const t of tieuDe) {
    for (const g of dangCua(t).map(fold)) {
      for (let i = f.indexOf(g); i !== -1; i = f.indexOf(g, i + 1)) {
        ranges.push([i, i + g.length]);
        coMat.add(t);
      }
    }
  }
  return { la: (h) => ranges.some(([a, b]) => h.start >= a && h.end <= b), coMat };
}

/** { hien, html, tieuDeTin, linkGoc, soTieuDe }: mỗi ô {S01: n}, không tính phần miễn. `tieuDe` là tiêu đề listing mang tên, đọc từ DB;
 *  tieuDeTin đếm toàn tệp, soTieuDe là số tiêu đề khác nhau có mặt trên trang. */
/** @param {string} html @param {{ code: string, realName: string }[]} entries @param {{ tieuDe?: string[], coLinkGoc?: boolean }} [tuyChon] */
export function quetHtml(html, entries, { tieuDe = [], coLinkGoc = false } = {}) {
  const chu = chuHien(html);
  const toanBo = findSourceNames(html, entries);
  const ranges = coLinkGoc ? linkGocRanges(html, entries) : [];
  const laLink = (h) => h.code === "S01" && ranges.some(([a, b]) => h.start >= a && h.end <= b);
  const trenHtml = trongTieuDe(html, tieuDe);
  const trenChu = trongTieuDe(chu, tieuDe);
  return {
    hien: demTheoMa(findSourceNames(chu, entries).filter((h) => !trenChu.la(h))),
    html: demTheoMa(toanBo.filter((h) => !laLink(h) && !trenHtml.la(h))),
    tieuDeTin: demTheoMa(toanBo.filter((h) => !laLink(h) && trenHtml.la(h))),
    linkGoc: demTheoMa(toanBo.filter(laLink)),
    soTieuDe: trenHtml.coMat.size,
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

async function voiDb(viec) {
  const pg = createRequire(path.join(ROOT, "app", "package.json"))("pg");
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest", connectionTimeoutMillis: 3000 });
  await c.connect();
  try {
    return await viec(c);
  } finally {
    await c.end();
  }
}

/** Sổ migration cộng `source_registry` local, và listing có tiêu đề mang tên. Thiếu DB thì nói ra: sổ hẹp hơn, không miễn tiêu đề nào. */
async function docDb(log) {
  const seeds = sourceRegistrySeeds();
  try {
    return await voiDb(async (c) => {
      const { rows } = await c.query("SELECT code, real_name FROM source_registry WHERE real_name IS NOT NULL");
      const them = rows.map((r) => ({ code: r.code, realName: r.real_name }));
      const entries = [...seeds, ...them.filter((t) => !seeds.some((s) => s.code === t.code && s.realName === t.realName))];
      const ds = (await c.query("SELECT id, name FROM listings WHERE name IS NOT NULL ORDER BY id")).rows.filter((r) => findSourceNames(r.name, entries).length);
      log(`sổ tên: ${[...new Set(entries.map((e) => e.code))].sort().join(" ")} (migration + source_registry local) · ${ds.length} tiêu đề listing mang tên`);
      return { entries, listings: ds };
    });
  } catch {
    log(`sổ tên: ${[...new Set(seeds.map((e) => e.code))].sort().join(" ")} (chỉ migration, không đọc được DB) · không miễn tiêu đề nào`);
    return { entries: seeds, listings: [] };
  }
}

/** Mã một listing cho `/listing/:mau`: ưu tiên listing có tiêu đề mang tên, là ca khó của ngoại lệ; không có thì lấy từ ô thuê ngắn hạn. */
async function layMauListing(base, listings) {
  if (listings[0]) return listings[0].id;
  const html = await (await fetch(base + O_NGAN_HAN)).text();
  return /\/listing\/([A-Za-z0-9_-]+)/.exec(html)?.[1] ?? null;
}

export async function quetTrang({ base: goc, trang = TRANG, entries: soKhai, listings: dsKhai, log = console.log }) {
  const base = goc.replace(/\/$/, "");
  const { entries, listings } = soKhai ? { entries: soKhai, listings: dsKhai ?? [] } : await docDb(log);
  const tieuDeDb = listings.map((l) => l.name);
  let conTen = 0;
  let khongDo = 0;
  for (const p of trang) {
    try {
      const mau = p === MAU_LISTING ? await layMauListing(base, listings) : null;
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
      const { hien, html: toanBo, tieuDeTin, linkGoc, soTieuDe } = quetHtml(html, entries, { tieuDe: CO_TIEU_DE_TIN.has(p) ? tieuDeDb : [], coLinkGoc: CO_LINK_GOC.has(p) });
      const chu = chuHien(html);
      const tieuDeVuot = soTieuDe > TRAN_TIEU_DE_TIN;
      const thieu = (PHAI_CO[p] ?? []).filter((c) => !chu.includes(c));
      const cauSai = CAU_SAI.test(chu);
      const sach = Object.keys(toanBo).length === 0 && Object.keys(hien).length === 0 && !tieuDeVuot && !thieu.length && !cauSai;
      if (!sach) conTen++;
      if (tieuDeVuot) log(`VƯỢT-TRẦN ${p}: ${soTieuDe} tiêu đề tin mang tên, trần ${TRAN_TIEU_DE_TIN}`);
      if (cauSai) log(`CÂU-SAI ${p}: còn câu nói dữ liệu là giả lập hoặc mô phỏng`);
      if (thieu.length) log(`THIẾU-CHỮ ${p}: ${thieu.join(" · ")}`);
      const rieng = [
        Object.keys(tieuDeTin).length ? ` · tiêu đề tin (dữ liệu, không đỏ) ${soTieuDe} tiêu đề, ${inMa(tieuDeTin)}` : "",
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

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const lay = (ten) => (args.includes(ten) ? args[args.indexOf(ten) + 1] : undefined);
  const base = lay("--base") ?? process.env.BASE_URL ?? "http://localhost:3456";
  const trang = lay("--trang")?.split(",") ?? TRANG;
  process.exit(await quetTrang({ base, trang }));
}
