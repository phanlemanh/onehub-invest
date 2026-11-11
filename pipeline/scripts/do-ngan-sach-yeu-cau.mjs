#!/usr/bin/env node
// do-ngan-sach-yeu-cau.mjs — YC1 sua-doc-ngan-sach-yeu-cau AC-7: so bộ đọc ngân sách mới với bộ đọc ở commit gốc trên toàn
// bộ bài S03 khớp `laYeuCau`, CHỈ ĐỌC DB (giao dịch read only). Không ghi gì, không gọi model.
//
//   node pipeline/scripts/do-ngan-sach-yeu-cau.mjs --goc <sha>   # DB: DATABASE_URL, mặc định DB máy thu :5433
//   node pipeline/scripts/do-ngan-sach-yeu-cau.mjs --tu-kiem     # chiều đỏ: bộ ca dựng sẵn, bộ đọc làm rơi «tc 8tr» → thoát 1
//
// In dòng «YCNS-DO tổng … · có ngân sách cũ … mới … · mất … · thêm … · đổi giá trị … · thuê từ 100 triệu … · min lớn hơn
// max …» và tối đa 30 mẫu đổi giá trị. Thoát 1 khi số có ngân sách giảm, có bài mất ngân sách, có bài thuê từ 100
// triệu/tháng hay có min > max; thoát 2 khi gọi sai.
import { execFileSync } from "node:child_process";
import { realpathSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import pg from "pg";
import { laYeuCau } from "../transform-zalo.mjs";
import { docDichVu, docNganSach } from "../lib/yeu-cau.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LIB = path.join(HERE, "..", "lib");
const TRAN_THUE = 100e6;
const SO_MAU = 30;

/** Bộ đọc ngân sách ở commit `sha`: dựng tệp tạm cạnh yeu-cau.mjs (giữ import tương đối), nạp, xoá. */
async function docCuTaiCommit(sha) {
  const nguon = execFileSync("git", ["show", `${sha}:pipeline/lib/yeu-cau.mjs`], { cwd: path.join(HERE, "..", ".."), encoding: "utf8" });
  const tep = path.join(LIB, `.yeu-cau-goc-${process.pid}.mjs`);
  writeFileSync(tep, nguon);
  try { return (await import(pathToFileURL(tep).href)).docNganSach; } finally { rmSync(tep, { force: true }); }
}

/** So hai bộ đọc trên danh sách {id, text}; trả số đếm và mẫu đổi giá trị. */
export function soSanh(bai, docCu, docMoi) {
  const d = { tong: 0, cu: 0, moi: 0, mat: 0, them: 0, doi: 0, thue100: 0, nguoc: 0, mau: [], matMau: [] };
  const co = (b) => b.min != null || b.max != null;
  for (const { id, text } of bai) {
    d.tong++;
    const kind = docDichVu(text);
    const a = docCu(text, kind), b = docMoi(text, kind);
    if (co(a)) d.cu++;
    if (co(b)) d.moi++;
    if (co(a) && !co(b)) { d.mat++; if (d.matMau.length < SO_MAU) d.matMau.push({ id, cu: a, text }); }
    if (!co(a) && co(b)) d.them++;
    if (co(a) && co(b) && (a.min !== b.min || a.max !== b.max)) {
      d.doi++;
      if (d.mau.length < SO_MAU) d.mau.push({ id, cu: a, moi: b, text });
    }
    if (kind === "rent_lt" && ((b.max ?? 0) >= TRAN_THUE || (b.min ?? 0) >= TRAN_THUE)) d.thue100++;
    if (b.min != null && b.max != null && b.min > b.max) d.nguoc++;
  }
  return d;
}

/** Lý do đỏ của một lượt đo, rỗng khi đạt. */
export function lyDoDo(d) {
  const ly = [];
  if (d.moi < d.cu) ly.push("SO CO NGAN SACH GIAM");
  if (d.mat > 0) ly.push("MAT NGAN SACH");
  if (d.thue100 > 0) ly.push("THUE TU 100 TRIEU");
  if (d.nguoc > 0) ly.push("MIN LON HON MAX");
  return ly;
}

const ty = (v) => (v == null ? "—" : v >= 1e9 ? `${v / 1e9} tỷ` : `${v / 1e6} triệu`);
const ngan = (t) => t.replace(/\s+/g, " ").slice(0, 120);

function inKetQua(d) {
  console.log(`YCNS-DO tổng ${d.tong} · có ngân sách cũ ${d.cu} mới ${d.moi} · mất ${d.mat} · thêm ${d.them} · đổi giá trị ${d.doi}` +
    ` · thuê từ 100 triệu ${d.thue100} · min lớn hơn max ${d.nguoc}`);
  for (const m of d.mau) console.log(`  đổi ${m.id}: ${ty(m.cu.min)}..${ty(m.cu.max)} → ${ty(m.moi.min)}..${ty(m.moi.max)} | ${ngan(m.text)}`);
  for (const m of d.matMau) console.log(`  mất ${m.id}: ${ty(m.cu.min)}..${ty(m.cu.max)} → trống | ${ngan(m.text)}`);
  const ly = lyDoDo(d);
  if (ly.length) console.log(`YCNS-DO DO ${ly.join(" · ")}`);
  return ly.length ? 1 : 0;
}

async function main(argv) {
  if (argv.includes("--tu-kiem")) {
    // Chiều đỏ: bộ đọc làm rơi «tc 8tr» nhưng đọc thêm một bài khác — tổng không giảm mà vẫn phải đỏ vì có bài mất.
    const bai = [{ id: "a", text: "cần thuê 2pn tc 8tr" }, { id: "b", text: "cần mua 2ty6" }, { id: "c", text: "cần thuê tài chính 7" }];
    const roi = (t, k) => (t.includes("tc 8tr") ? { min: null, max: null } : docNganSach(t, k));
    return inKetQua(soSanh(bai, (t, k) => (t.includes("tài chính 7") ? { min: null, max: null } : docNganSach(t, k)), roi));
  }
  const i = argv.indexOf("--goc");
  const sha = i >= 0 ? argv[i + 1] : null;
  if (!sha || !/^[0-9a-f]{7,40}$/.test(sha)) {
    console.error("dùng: do-ngan-sach-yeu-cau.mjs --goc <sha> | --tu-kiem");
    return 2;
  }
  const docCu = await docCuTaiCommit(sha);
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await c.connect();
  try {
    await c.query("BEGIN READ ONLY");
    const { rows } = await c.query(
      "SELECT DISTINCT ON (post_id) post_id AS id, text FROM stg_zalo_posts WHERE text IS NOT NULL ORDER BY post_id, captured_at DESC");
    await c.query("ROLLBACK");
    return inKetQua(soSanh(rows.filter((r) => laYeuCau(r.text)), docCu, docNganSach));
  } finally {
    await c.end();
  }
}

// So bằng realpath: launchd gọi qua symlink ~/dev/one-invest (entrypoint-symlink.test.mjs AC-3).
const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) process.exitCode = await main(process.argv.slice(2));
