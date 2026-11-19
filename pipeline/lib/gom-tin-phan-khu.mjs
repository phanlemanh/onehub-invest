// gom-tin-phan-khu.mjs — GT5 khoa-gom-hai-tang AC-5: tập phân khu nêu trong chữ bài, đọc theo danh bạ (chỉ đọc).
// Tên phân khu = nút `subzone` con của nút `project` trong asset_nodes: tên, mảng aliases, và bí danh `ten` còn sống của nút trong
// registry_aliases (object_key `node:<id>`). Viết tắt (ori, rb…) do dãy danh bạ thêm làm bí danh (Hỏi-1, Mạnh duyệt 20/11) — mã này
// không giữ bảng viết tắt nào.
// Khoá phân khu = `<id dự án>:<tên đã gập, bỏ «the»>`: hai nút trùng tên chờ nối (DA46, ví dụ «Rainbow» và «The Rainbow») cùng một khoá.
import { fold } from "./mask-source-names.mjs";

const gon = (s) => fold(String(s ?? "").normalize("NFC")).replace(/[^\p{L}\p{N}]+/gu, " ").trim();
/** Tên đã gập, bỏ từ «the». */
export const khoaTen = (ten) => gon(ten).split(" ").filter((w) => w && w !== "the").join(" ");

export const SQL = Object.freeze({
  tuDien: `SELECT p.id::text AS du_an, n.id::text AS nut, n.name, n.aliases,
                  coalesce(array_agg(a.value) FILTER (WHERE a.value IS NOT NULL), '{}') AS bi_danh
             FROM asset_nodes n
             JOIN asset_nodes p ON p.id = n.parent_id AND p.node_type = 'project'
             LEFT JOIN registry_aliases a ON a.object_key = 'node:' || n.id AND a.kind = 'ten' AND a.retired_at IS NULL
            WHERE n.node_type = 'subzone'
            GROUP BY p.id, n.id, n.name, n.aliases`,
});

/**
 * Từ điển phân khu: mỗi phần tử một cụm chữ đã gập trỏ về khoá phân khu; sắp cụm dài trước.
 * @param {{ du_an: string, name: string, aliases?: string[]|null, bi_danh?: string[]|null }[]} dong
 * @returns {{ cum: string, khoa: string }[]}
 */
export function dungTuDien(dong) {
  const ra = new Map();
  for (const r of dong) {
    const khoa = `${r.du_an}:${khoaTen(r.name)}`;
    for (const t of [r.name, ...(r.aliases ?? []), ...(r.bi_danh ?? [])]) {
      for (const cum of new Set([gon(t), khoaTen(t)])) if (cum.length >= 2 && !ra.has(cum)) ra.set(cum, khoa);
    }
  }
  return [...ra].map(([cum, khoa]) => ({ cum, khoa })).sort((a, b) => b.cum.length - a.cum.length || a.cum.localeCompare(b.cum));
}

/** @param {import("pg").Client} client */
export async function docTuDienPhanKhu(client) {
  return dungTuDien((await client.query(SQL.tuDien)).rows);
}

const thoat = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Khoá phân khu nêu trong chữ: khớp cụm dài trước, theo ranh giới từ; cụm đã khớp bị xoá trước khi khớp cụm ngắn hơn
 * («beverly solari» không đếm thêm «beverly»). Sắp xếp, không trùng.
 * @param {string} text @param {{ cum: string, khoa: string }[]} tuDien
 * @returns {string[]}
 */
export function tapPhanKhu(text, tuDien) {
  let t = ` ${gon(text)} `;
  const ra = new Set();
  for (const { cum, khoa } of tuDien) {
    const re = new RegExp(` ${thoat(cum)} `, "g");
    if (!re.test(t)) continue;
    ra.add(khoa);
    t = t.replace(new RegExp(` ${thoat(cum)}(?= )`, "g"), " ");
  }
  return [...ra].sort();
}
