// nhanh-bai-s03.mjs — DF6 `bai-nhan-tru-bai-chi-anh`: nhánh của từng bài S03 cho «Dòng chảy dữ liệu» (600_data_flow.sql),
// tính bằng CHÍNH các hàm của transform — không chép luật sang SQL (parsePost là regex JS, \b chỉ ASCII):
//   - `anh-da-ghep`  bài chỉ-ảnh mà PL28 gán vào một tin S03 (`baiAnhCuaTin` của transform-media.mjs);
//   - `anh-chua-ghep` bài chỉ-ảnh còn lại (`laChiAnh` của lib/gop-anh.mjs);
//   - `yeu-cau`      bài có chữ, parsePost không ra loại và `laYeuCau` đúng — đúng nhánh `yeu-cau` của suyLoai.
// Bài khác không có dòng. «Đọc được» (bài trong post_ids của tin) do 600 tự đếm và THẮNG mọi nhánh ở đây, nên tin đọc từ
// lượt transform cũ vẫn là tin. Kết quả nạp vào bảng TẠM `flow_s03_branch` của phiên và bật `oneinvest.flow_branch`;
// 600 chạy trên cùng phiên đọc bảng ấy (bộ chạy: refresh-data-flow.mjs). Chỉ đọc bảng thật.
import { baiAnhCuaTin } from "../transform-media.mjs";
import { laYeuCau, parsePost } from "../transform-zalo.mjs";
import { laChiAnh } from "./gop-anh.mjs";
import { loadStgPosts } from "./test-posts.mjs";

/** Nhãn nhánh — khớp từng chữ với 600_data_flow.sql. */
export const NHANH = Object.freeze({ anhDaGhep: "anh-da-ghep", anhChuaGhep: "anh-chua-ghep", yeuCau: "yeu-cau" });

/**
 * Nhánh của một bài (hàm thuần). `daGhep` = tập post_id bài chỉ-ảnh đã vào một tin.
 * @param {{ post_id: string, text: string|null }} bai
 * @param {Set<string>} daGhep
 * @returns {string|null}
 */
export function nhanhCuaBai(bai, daGhep) {
  if (laChiAnh(bai.text)) return daGhep.has(bai.post_id) ? NHANH.anhDaGhep : NHANH.anhChuaGhep;
  if (!parsePost(bai.text ?? "").kind && laYeuCau(bai.text)) return NHANH.yeuCau;
  return null;
}

/**
 * Nhánh mọi bài S03 thật (đã gạt bài thử) trên DB của `c`.
 * @param {import("pg").Client} c
 * @returns {Promise<Map<string, string>>} post_id → nhánh
 */
export async function tinhNhanhBai(c) {
  const daGhep = new Set();
  for (const rows of (await baiAnhCuaTin(c)).values()) for (const r of rows) daGhep.add(r.post_id);
  const { posts } = await loadStgPosts(c, "zalo");
  const out = new Map();
  for (const p of posts) {
    const n = nhanhCuaBai(p, daGhep);
    if (n) out.set(p.post_id, n);
  }
  return out;
}

const LO = 20000;

/**
 * Nạp nhánh vào bảng tạm `flow_s03_branch` của phiên `c` và bật cờ `oneinvest.flow_branch` (mức phiên) — gọi ngay trước
 * khi chạy 600 trên CÙNG client. Trả số dòng theo nhánh.
 * @param {import("pg").Client} c
 */
export async function napNhanhBai(c) {
  const nhanh = await tinhNhanhBai(c);
  await c.query("CREATE TEMP TABLE IF NOT EXISTS flow_s03_branch (post_id text PRIMARY KEY, branch text NOT NULL)");
  await c.query("TRUNCATE flow_s03_branch");
  const ds = [...nhanh];
  for (let i = 0; i < ds.length; i += LO) {
    const lo = ds.slice(i, i + LO);
    await c.query("INSERT INTO flow_s03_branch (post_id, branch) SELECT * FROM unnest($1::text[], $2::text[])", [
      lo.map(([id]) => id),
      lo.map(([, n]) => n),
    ]);
  }
  await c.query("ANALYZE flow_s03_branch");
  await c.query("SELECT set_config('oneinvest.flow_branch', 'on', false)");
  const dem = Object.fromEntries(Object.values(NHANH).map((n) => [n, 0]));
  for (const n of nhanh.values()) dem[n]++;
  return dem;
}
