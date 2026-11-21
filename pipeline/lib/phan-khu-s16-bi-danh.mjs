// phan-khu-s16-bi-danh.mjs — DA51 bi-danh-viet-tat-phan-khu: tên viết tắt phân khu (ori, rb, bs, gh) trên `asset_nodes.aliases`
// của nút phân khu, qua thẻ luật có băm (khuôn DA32/DA46). Lõi thuần + câu đọc dùng chung; lệnh ghi ở
// pipeline/scripts/bi-danh-viet-tat-phan-khu.mjs. Bảng phủ ca và lựa chọn: docs/superpowers/specs/2026-11-20-bi-danh-viet-tat-phan-khu-design.md.
import { createHash } from "node:crypto";
import { fold } from "./mask-source-names.mjs";

export const NGUON_BI_DANH = "S03";
export const CAN_CU_BI_DANH = "S03-bi-danh-viet-tat-phan-khu";
/** Khoá meta trên nút đích: `{ "<rule_id>": ["ori"] }` — đúng các tên chính lượt đó thêm. */
export const KHOA_META = "bi_danh_viet_tat";

/**
 * Bảng tên tắt (GT5 Hỏi-1, bảng phủ ca 19/11 của khoa-gom-hai-tang): tên tắt → tên phân khu đã gập bỏ «the», trong dự án `du_an` (slug).
 * Sau khi áp, danh bạ là nơi giữ tên tắt; bảng này chỉ là đầu vào của thẻ.
 */
export const BANG_VIET_TAT = Object.freeze([
  Object.freeze({ vt: "ori", ten: "origami", du_an: "vinhomes-grand-park" }),
  Object.freeze({ vt: "rb", ten: "rainbow", du_an: "vinhomes-grand-park" }),
  Object.freeze({ vt: "bs", ten: "beverly solari", du_an: "vinhomes-grand-park" }),
  Object.freeze({ vt: "gh", ten: "glory heights", du_an: "vinhomes-grand-park" }),
]);

/** Chữ đã gập dấu, chỉ còn chữ và số cách nhau một dấu cách (cùng luật GT5 gom-tin-phan-khu.mjs). */
export const gon = (s) => fold(String(s ?? "").normalize("NFC")).replace(/[^\p{L}\p{N}]+/gu, " ").trim();
/** Tên đã gập, bỏ từ «the». */
export const khoaTen = (ten) => gon(ten).split(" ").filter((w) => w && w !== "the").join(" ");

/**
 * Chọn nút đích cho từng tên tắt. `nut`: nút `subzone` con trực tiếp của nút dự án, `{ id, name, du_an_slug, nghi, luat_duc }`
 * (`luat_duc` = nút do luật S16 đúc). Nút nghỉ không bao giờ là ứng viên; hai ứng viên thì bỏ nút luật đúc; còn đúng một thì gán.
 * @returns {{ vt: string, ten: string, du_an: string, node_id: number|null, node_ten: string|null, ly_do: string|null }[]}
 */
export function chonDich(bang, nut) {
  return bang.map(({ vt, ten, du_an }) => {
    let ung = nut.filter((n) => n.du_an_slug === du_an && !n.nghi && khoaTen(n.name) === ten);
    if (ung.length > 1) ung = ung.filter((n) => !n.luat_duc);
    if (ung.length === 1) return { vt, ten, du_an, node_id: ung[0].id, node_ten: ung[0].name, ly_do: null };
    return { vt, ten, du_an, node_id: null, node_ten: null, ly_do: ung.length ? "nhieu-ung-vien" : "khong-co-nut" };
  });
}

/** Băm thẻ: phủ bảng và đích, không phủ số tin (số tin đổi mỗi đêm nạp). */
export function bamThe(dong) {
  const loi = dong.map((d) => ({ vt: d.vt, ten: d.ten, du_an: d.du_an, node_id: d.node_id, ly_do: d.ly_do }));
  return createHash("sha256").update(JSON.stringify(loi)).digest("hex");
}

/** Thẻ luật dạng markdown. `soTin`: Map vt → số tin S03 chứa token (tuỳ chọn). */
export function vietThe(dong, bam, soTin = new Map()) {
  const gan = dong.filter((d) => d.node_id != null);
  const khong = dong.filter((d) => d.node_id == null);
  const l = ["# Thẻ bí danh viết tắt phân khu", "", "| Tên tắt | Tên phân khu | Nút đích | Dự án | Tin S03 chứa tên tắt |", "|---|---|---|---|---:|"];
  for (const d of gan) l.push(`| ${d.vt} | ${d.ten} | ${d.node_id} ${d.node_ten} | ${d.du_an} | ${soTin.get(d.vt) ?? "—"} |`);
  l.push("", "## Không gán", "", "| Tên tắt | Tên phân khu | Dự án | Vì sao |", "|---|---|---|---|");
  for (const d of khong) l.push(`| ${d.vt} | ${d.ten} | ${d.du_an} | ${d.ly_do === "nhieu-ung-vien" ? "còn hơn một nút ứng viên, cần người chọn" : "không có nút phân khu mang tên này"} |`);
  if (!khong.length) l.push("| — | — | — | — |");
  l.push("", `Tổng: ${gan.length} tên gán · ${khong.length} tên không gán`, "", `băm: ${bam}`, "");
  return l.join("\n");
}

/**
 * Giao diện đọc cho GT5: nút `subzone` chưa nghỉ, con trực tiếp của dự án, kèm `aliases` (tên tắt nằm ở đây) và bí danh `ten` còn sống
 * ở `registry_aliases` — cùng cột với `SQL.tuDien` của gom-tin-phan-khu.mjs, thêm lọc nút nghỉ.
 */
export const SQL_TEN_PHAN_KHU = `
  SELECT p.id::text AS du_an, n.id::text AS nut, n.name, n.aliases,
         coalesce(array_agg(a.value) FILTER (WHERE a.value IS NOT NULL), '{}') AS bi_danh
    FROM asset_nodes n
    JOIN asset_nodes p ON p.id = n.parent_id AND p.node_type = 'project'
    LEFT JOIN registry_aliases a ON a.object_key = 'node:' || n.id AND a.kind = 'ten' AND a.retired_at IS NULL
   WHERE n.node_type = 'subzone' AND COALESCE((n.meta ->> 'nghi')::boolean, false) = false
   GROUP BY p.id, n.id, n.name, n.aliases`;

/** @param {import("pg").Client} client @returns {Promise<{ du_an: string, nut: string, name: string, aliases: string[], bi_danh: string[] }[]>} */
export async function docTenPhanKhu(client) {
  return (await client.query(SQL_TEN_PHAN_KHU)).rows;
}

/**
 * Từ điển phân khu theo dự án (luật GT5): mỗi cụm chữ đã gập trỏ về khoá `<id dự án>:<tên đã gập bỏ «the»>`, sắp cụm dài trước.
 * `bo`: tập tên bí danh bỏ qua (để đo «trước khi áp»).
 * @returns {Map<string, { cum: string, khoa: string }[]>}
 */
export function dungTuDien(dong, { bo = new Set() } = {}) {
  const theo = new Map();
  for (const r of dong) {
    const m = theo.get(r.du_an) ?? new Map();
    const khoa = `${r.du_an}:${khoaTen(r.name)}`;
    for (const t of [r.name, ...(r.aliases ?? []), ...(r.bi_danh ?? [])]) {
      if (bo.has(t)) continue;
      for (const cum of new Set([gon(t), khoaTen(t)])) if (cum.length >= 2 && !m.has(cum)) m.set(cum, khoa);
    }
    theo.set(r.du_an, m);
  }
  return new Map([...theo].map(([d, m]) => [d, [...m].map(([cum, khoa]) => ({ cum, khoa }))
    .sort((a, b) => b.cum.length - a.cum.length || a.cum.localeCompare(b.cum))]));
}

const thoat = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Khoá phân khu nêu trong chữ: cụm dài trước, theo ranh giới từ, cụm đã khớp bị xoá trước khi khớp cụm ngắn hơn. */
export function tapPhanKhu(text, tuDien = []) {
  let t = ` ${gon(text)} `;
  const ra = new Set();
  for (const { cum, khoa } of tuDien) {
    if (!new RegExp(` ${thoat(cum)} `).test(t)) continue;
    ra.add(khoa);
    t = t.replace(new RegExp(` ${thoat(cum)}(?= )`, "g"), " ");
  }
  return [...ra].sort();
}
/** Chữ có token tên tắt đứng riêng (ranh giới từ). */
export const coToken = (text, vt) => ` ${gon(text)} `.includes(` ${vt} `);

/**
 * Đếm số tin đọc được phân khu trước và sau (trước = bỏ các tên tắt `bo`). `tin`: `{ du_an, text }[]` (du_an = id dự án dạng chữ).
 * `theoTen[vt]` = số tin chỉ đọc được phân khu nhờ tên ấy (trước rỗng, sau có khoá đích, chữ có token).
 */
export function demDoc(tin, dongTen, bang) {
  const vts = new Set(bang.map((b) => b.vt));
  const sau = dungTuDien(dongTen), truoc = dungTuDien(dongTen, { bo: vts });
  // Đích của tên tắt theo từng dự án: khoá phân khu của nút mang tên ấy trong chính dự án của tin.
  const dichCua = new Map();
  for (const r of dongTen) for (const b of bang) if ((r.aliases ?? []).includes(b.vt)) dichCua.set(`${r.du_an}|${b.vt}`, `${r.du_an}:${khoaTen(r.name)}`);
  const ra = { tin: tin.length, truoc: 0, sau: 0, moi: 0, mat: 0, theoTen: Object.fromEntries(bang.map((b) => [b.vt, 0])) };
  for (const t of tin) {
    const a = tapPhanKhu(t.text, truoc.get(t.du_an)), s = tapPhanKhu(t.text, sau.get(t.du_an));
    if (a.length) ra.truoc++;
    if (s.length) ra.sau++;
    if (a.some((k) => !s.includes(k))) ra.mat++;
    if (!a.length && s.length) {
      ra.moi++;
      for (const b of bang) {
        const dich = dichCua.get(`${t.du_an}|${b.vt}`);
        if (dich && s.includes(dich) && coToken(t.text, b.vt)) ra.theoTen[b.vt]++;
      }
    }
  }
  return ra;
}
