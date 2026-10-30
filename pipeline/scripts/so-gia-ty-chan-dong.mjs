// so-gia-ty-chan-dong.mjs — hồ sơ _acceptance/s03-gia-ty-chan-dong, AC-6: so đầu ra parsePost của bản nền ghim NEN với bản
// cây trên toàn bộ bài S03 thật. Chỉ đọc (BEGIN READ ONLY trên DATABASE_URL), không ghi gì.
// Đạt khi: 0 bài đổi danh sách SĐT, và mọi bài đổi giá mang dạng giá tỷ chẵn viết bằng đồng. Sai → exit 1, gọi tên bài.
// Lượt đối chứng (luôn chạy) thay bản cây bằng bản sao đưa điều kiện dấu chấm/phẩy vào PHONE_RE dùng chung, thêm một bài tổng hợp có SĐT
//               nối SĐT — phải TRƯỢT và gọi tên bài tổng hợp, không thì thước không đo gì.
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import pg from "pg";

import { loadStgPosts } from "../lib/test-posts.mjs";

const NEN = "ecaf5ff0";
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const PIPE = join(import.meta.dirname, "..");
const BAI_TONG_HOP = { post_id: "tong-hop-sdt-noi-sdt", text: "Cho thuê 2PN 9tr LH 0901234567,0912345678 T.Lan" };
const TY_CHAN = /(?<![\d.,])\d{1,3}(?:\.000){3,}(?![\d.,])/;

async function napBanSao(src, ten) {
  const f = join(PIPE, `.gt-${ten}-${process.pid}.mjs`);
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
  const cu = "const PHONE_RE = /(?<!\\d)(?:";
  if (!src.includes(cu)) throw new Error("so-gia-ty-chan-dong: đột biến không khớp mã nguồn");
  return napBanSao(src.replace(cu, "const PHONE_RE = /(?<!\\d)(?<!\\d[.,])(?:"), "dot-bien");
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

/** Một lượt so: true khi ĐẠT (0 bài đổi SĐT, mọi bài đổi giá mang dạng giá tỷ chẵn). */
async function luot(dotBien) {
  const cay = await napCay(dotBien);
  const posts = dotBien ? [...thatPosts, BAI_TONG_HOP] : thatPosts;
  const doiGia = [];
  const doiSdt = [];
  for (const p of posts) {
    const a = nen.parsePost(p.text);
    const b = cay.parsePost(p.text);
    if (a.priceVnd !== b.priceVnd || a.pricePerm2Vnd !== b.pricePerm2Vnd) {
      doiGia.push({ id: p.post_id, truoc: a.priceVnd, sau: b.priceVnd, nhan: TY_CHAN.test(p.text) ? "gia-ty-chan-dong" : "khac" });
    }
    if (JSON.stringify(a.phones) !== JSON.stringify(b.phones)) doiSdt.push(p.post_id);
  }
  const ten = dotBien ? "lượt đối chứng (điều kiện vào PHONE_RE dùng chung + bài tổng hợp SĐT nối SĐT)" : "lượt cây";
  console.log(`${ten}: ${posts.length} bài · đổi giá ${doiGia.length} · đổi danh sách SĐT ${doiSdt.length}`);
  for (const d of doiGia) console.log(`  đổi giá ${d.id}: ${d.truoc} → ${d.sau} [${d.nhan}]`);
  for (const id of doiSdt) console.log(`  đổi SĐT ${id}`);
  const lech = doiGia.filter((d) => d.nhan !== "gia-ty-chan-dong");
  const dat = !doiSdt.length && !lech.length;
  console.log(`  → ${dat ? "ĐẠT" : "TRƯỢT"}`);
  return { dat, tongHopBat: doiSdt.includes(BAI_TONG_HOP.post_id) };
}

const cay = await luot(false);
const dc = await luot(true);
if (!cay.dat) { console.error("so-gia-ty-chan-dong: lượt cây TRƯỢT"); process.exit(1); }
if (dc.dat || !dc.tongHopBat) { console.error("so-gia-ty-chan-dong: lượt đối chứng không bắt được bài tổng hợp — thước không đo SĐT nối SĐT"); process.exit(1); }
console.log("so-gia-ty-chan-dong: ĐẠT — lượt cây không đổi SĐT, mọi bài đổi giá là giá tỷ chẵn; lượt đối chứng bắt đúng bài tổng hợp");
