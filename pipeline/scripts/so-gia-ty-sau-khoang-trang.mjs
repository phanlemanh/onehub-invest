// so-gia-ty-sau-khoang-trang.mjs — hồ sơ _acceptance/s03-gia-ty-sau-khoang-trang, AC-6: so TOÀN BỘ đầu ra parsePost của bản nền
// ghim NEN với bản cây trên mọi bài S03 thật. Chỉ đọc (BEGIN READ ONLY trên DATABASE_URL), không ghi gì.
// Đạt khi: đã so ít nhất một bài; 0 bài đổi danh sách SĐT; mọi bài đổi đầu ra mang nhãn quan hệ — chữ có số tiền nhóm nghìn +
// khoảng trắng + 1–2 chữ số, giá mới bằng đúng giá trị số tiền ấy, và mọi trường khác bị đổi chỉ đổi từ null sang đúng số đuôi.
// Bài tổng hợp «Bán nhà 3.000.000.000\n50m2» là đối chứng dương của nhãn ở cả hai lượt. Sai → exit 1, gọi tên bài.
// Lượt đối chứng (luôn chạy) thay bản cây bằng bản sao bỏ điều kiện nhóm cuối «000», thêm một bài tổng hợp có SĐT 3-3-3 kèm
//               đuôi — phải TRƯỢT và gọi tên bài tổng hợp, không thì thước không đo gì.
// SD2 (boc-sdt-du-va-chon-ro, giám sát duyệt P1-81): bộ bóc SĐT đổi có chủ ý sau bản nền, nên phone/phones «trước» lấy bằng bộ bóc
//               của cây — thước chỉ đo phần giá của hồ sơ này.
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import pg from "pg";

import { loadStgPosts } from "../lib/test-posts.mjs";

const NEN = "ec899d03";
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const PIPE = join(import.meta.dirname, "..");
const BAI_TONG_HOP = { post_id: "tong-hop-sdt-333-duoi", text: "Cho thuê 9tr LH 2.098.765.432 1 T.Lan" };
// Đối chứng dương của nhãn (cả hai lượt): bài thuộc đúng dạng phải đổi và mang nhãn quan hệ, không thì nhãn không đo gì.
const BAI_DUONG = { post_id: "tong-hop-gia-sau-khoang-trang", text: "Bán nhà 3.000.000.000\n50m2" };
// Số tiền nhóm nghìn + khoảng trắng + 1–2 chữ số; nhóm 1 = số tiền, nhóm 2 = số đuôi.
const SAU_KHOANG_TRANG = /(?<![\p{L}\d.,])(\d{1,3}(?:\.\d{3}){2,})\s(\d{1,2})(?!\d)/gu;
const GIA = ["priceVnd", "pricePerm2Vnd"];

async function napBanSao(src, ten) {
  const f = join(PIPE, `.gs-${ten}-${process.pid}.mjs`);
  writeFileSync(f, src);
  try {
    return await import(pathToFileURL(f).href);
  } finally {
    rmSync(f, { force: true });
  }
}

const nen = await napBanSao(execFileSync("git", ["show", `${NEN}:pipeline/transform-zalo.mjs`], { cwd: PIPE, encoding: "utf8" }), "nen");
async function napCay(dotBien) {
  if (!dotBien) return import(pathToFileURL(join(PIPE, "transform-zalo.mjs")).href);
  const src = readFileSync(join(PIPE, "transform-zalo.mjs"), "utf8");
  const cu = 'than.endsWith("000") && ';
  if (!src.includes(cu)) throw new Error("so-gia-ty-sau-khoang-trang: đột biến không khớp mã nguồn");
  return napBanSao(src.replace(cu, ""), "dot-bien");
}

const c = new pg.Client({ connectionString: DB_URL });
await c.connect();
let thatPosts;
try {
  await c.query("BEGIN READ ONLY");
  ({ posts: thatPosts } = await loadStgPosts(c, "zalo"));
} finally {
  await c.query("ROLLBACK").catch(() => {});
  await c.end();
}

/** Bài đổi đúng quan hệ: một số tiền «nhóm nghìn + khoảng trắng + 1–2 chữ số» trong chữ cho giá mới, và mọi trường khác bị
 *  đổi (ngoài giá) đi từ null sang đúng số đuôi của chính số tiền ấy. */
function dungQuanHe(text, a, b, doi) {
  return [...text.matchAll(SAU_KHOANG_TRANG)].some(([, tien, duoi]) => doi.includes("priceVnd")
    && b.priceVnd === Number(tien.replace(/\./g, ""))
    && doi.every((k) => GIA.includes(k) || (a[k] == null && b[k] === Number(duoi))));
}

/** Một lượt so: true khi ĐẠT. */
async function luot(dotBien) {
  const cay = await napCay(dotBien);
  const boc = (await napCay(false)).extractPhones;
  const posts = dotBien ? [...thatPosts, BAI_DUONG, BAI_TONG_HOP] : [...thatPosts, BAI_DUONG];
  const doi = [];
  const doiSdt = [];
  for (const p of posts) {
    const a = nen.parsePost(p.text);
    a.phones = boc(p.text);
    a.phone = a.phones[0] ?? null;
    const b = cay.parsePost(p.text);
    const truong = Object.keys({ ...a, ...b }).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
    if (truong.includes("phones") || truong.includes("phone")) doiSdt.push(p.post_id);
    const conLai = truong.filter((k) => k !== "phones" && k !== "phone");
    if (conLai.length) {
      doi.push({ id: p.post_id, truong: conLai.map((k) => `${k} ${a[k]} → ${b[k]}`).join(", "),
        nhan: dungQuanHe(p.text, a, b, conLai) ? "gia-sau-khoang-trang" : "khac" });
    }
  }
  const ten = dotBien ? "lượt đối chứng (bỏ điều kiện nhóm cuối «000» + bài tổng hợp SĐT 3-3-3 kèm đuôi)" : "lượt cây";
  console.log(`${ten}: ${thatPosts.length} bài thật + ${posts.length - thatPosts.length} bài tổng hợp đã so · đổi đầu ra ${doi.length} · đổi danh sách SĐT ${doiSdt.length}`);
  for (const d of doi) console.log(`  đổi ${d.id}: ${d.truong} [${d.nhan}]`);
  for (const id of doiSdt) console.log(`  đổi SĐT ${id}`);
  const lech = doi.filter((d) => d.nhan !== "gia-sau-khoang-trang");
  const duong = doi.some((d) => d.id === BAI_DUONG.post_id && d.nhan === "gia-sau-khoang-trang");
  const dat = thatPosts.length > 0 && duong && !doiSdt.length && !lech.length;
  console.log(`  → ${dat ? "ĐẠT" : "TRƯỢT"}${thatPosts.length ? "" : " (không có bài thật nào để so — DB rỗng hay trỏ nhầm)"}${duong ? "" : " (bài đối chứng dương không mang nhãn quan hệ)"}`);
  return { dat, tongHopBat: lech.some((d) => d.id === BAI_TONG_HOP.post_id) || doiSdt.includes(BAI_TONG_HOP.post_id) };
}

const cay = await luot(false);
const dc = await luot(true);
if (!cay.dat) { console.error("so-gia-ty-sau-khoang-trang: lượt cây TRƯỢT"); process.exit(1); }
if (dc.dat || !dc.tongHopBat) { console.error("so-gia-ty-sau-khoang-trang: lượt đối chứng không bắt được bài tổng hợp — thước không đo SĐT 3-3-3 kèm đuôi"); process.exit(1); }
console.log("so-gia-ty-sau-khoang-trang: ĐẠT — lượt cây không đổi SĐT, mọi bài đổi đúng quan hệ giá/đuôi; lượt đối chứng bắt đúng bài tổng hợp");
