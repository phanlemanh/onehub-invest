// mau-hai-khu.mjs — PL35 tap-nhan-ghep-tin-hai-khu: chọn mẫu lát `hai-khu-ghep` (phần thuần + đọc danh bạ khu).
// Bài S03 của nhóm khớp đúng một khu (khuCuaNhom), gạt bài chữ nêu loại nhà khác (laLoaiKhac), khử trùng (khuTrung), phân tầng khu × mức gắn (lib/tang-ghep.mjs),
// mỗi tầng min(75, số bài khác nhau) chọn tất định bằng chonMau theo seed. Không đọc phát biểu hay kết quả gắn của PL20:
// danh bạ khu đọc từ buildings, stacks, asset_nodes, registry_aliases (AC-4, AC-7).
import { chonMau, khuCuaNhom, khuTrung } from "./eval-labels.mjs";
import { CO_TANG, TANG_BAT_BUOC, TANG_HAI_KHU, mucGan, tangCua, wilsonDuoiDungHet } from "./tang-ghep.mjs";

export const LAT_HAI_KHU = "hai-khu-ghep";

// Lọc căn hộ chỉ bằng chữ bài (loại nhà có cấu trúc nằm ở phát biểu — AC-7 cấm đọc): bài nêu loại nhà khác và không nêu dấu hiệu
// căn hộ thì không vào lát. Bài không nêu gì vẫn vào (đa số bài căn hộ trong nhóm cư dân không ghi chữ «căn hộ»).
const LOAI_KHAC = /(?<![\p{L}\p{N}])(?:nhà phố|shophouse|shop house|biệt thự|liền kề|đất nền|lô đất|nhà riêng|văn phòng|mặt bằng|ki ?ốt)(?![\p{L}\p{N}])/iu;
const CAN_HO = /(?<![\p{L}\p{N}])(?:căn hộ|chung cư|cc|studio|duplex|penthouse|\d ?pn|\d ?phòng ngủ|\d ?ngủ)(?![\p{L}\p{N}])/iu;
/** Bài nêu loại nhà khác căn hộ và không nêu dấu hiệu căn hộ. */
export const laLoaiKhac = (text) => { const t = String(text ?? "").normalize("NFC"); return LOAI_KHAC.test(t) && !CAN_HO.test(t); };
/** Khu → slug nút project của danh bạ. */
export const KHU_SLUG = Object.freeze({ op1: "vinhomes-ocean-park-1", gp: "vinhomes-grand-park" });

/**
 * Danh bạ của một khu: toà (khoá + mọi bí danh `ten`) và trục (toà + mã trục từ bí danh ma_nguon `<p>/<toà>/<trục>`).
 * Toà thuộc khu khi nút vùng là khu, con hay cháu của khu.
 * @param {import("pg").Client} c @param {string} slug
 * @returns {Promise<{ toa: Array<{key: string, ten: string[]}>, truc: Array<{toa_key: string, truc: string}> }>}
 */
export async function docDanhBaKhu(c, slug) {
  const { rows: toa } = await c.query(
    `SELECT b.building_key AS key, array_agg(DISTINCT a.value) FILTER (WHERE a.kind = 'ten') AS ten
       FROM buildings b
       JOIN asset_nodes n ON n.id = b.region_node_id
       LEFT JOIN asset_nodes p ON p.id = n.parent_id
       LEFT JOIN asset_nodes g ON g.id = p.parent_id
       JOIN asset_nodes k ON k.node_type = 'project' AND k.slug = $1 AND k.id IN (n.id, p.id, g.id)
       LEFT JOIN registry_aliases a ON a.object_key = b.building_key AND a.retired_at IS NULL
      WHERE b.status = 'active'
      GROUP BY b.building_key ORDER BY 1`, [slug]);
  const keys = toa.map((t) => t.key);
  const { rows: truc } = keys.length
    ? await c.query(
      `SELECT s.building_key AS toa_key, split_part(a.value, '/', 3) AS truc
         FROM stacks s JOIN registry_aliases a ON a.object_key = s.stack_key AND a.kind = 'ma_nguon' AND a.retired_at IS NULL
        WHERE s.status = 'active' AND s.building_key = ANY($1) AND split_part(a.value, '/', 3) <> ''
        GROUP BY 1, 2 ORDER BY 1, 2`, [keys])
    : { rows: [] };
  return { toa: toa.map((t) => ({ key: t.key, ten: (t.ten ?? []).filter(Boolean) })), truc };
}

/**
 * Chọn mẫu phân tầng hai khu. Khử trùng trên cả lô trước (bản trùng giữ bài đại diện), rồi tầng theo bài đại diện.
 * @param {{ post_id: string, text: string, group_name?: string }[]} posts bài đã gạt post thử
 * @param {{ op1: object, gp: object }} danhBa danh bạ từng khu (docDanhBaKhu)
 * @param {{ seed: string, co?: number, tinCua?: Map<string,string> }} opts
 */
export function chonMauHaiKhu(posts, danhBa, { seed, co = CO_TANG, tinCua = new Map() }) {
  const khuBai = new Map();
  let boNhom = 0, boLoaiKhac = 0;
  const cuaLat = [];
  const demNhom = new Map(); // tên nhóm → { khu, so } cho mọi nhóm của lô (bảng nhóm → khu của AC-9)
  for (const p of posts) {
    const khu = khuCuaNhom(p.group_name);
    const dn = demNhom.get(p.group_name ?? "") ?? { khu, so: 0 };
    dn.so++;
    demNhom.set(p.group_name ?? "", dn);
    if (!khu) { boNhom++; continue; }
    if (laLoaiKhac(p.text)) { boLoaiKhac++; continue; }
    khuBai.set(p.post_id, khu);
    cuaLat.push(p);
  }
  const { dai, bo_su_kien, bo_vi_trung } = khuTrung(cuaLat, tinCua);
  const theoTang = new Map(TANG_HAI_KHU.map((t) => [t, []]));
  for (const p of dai) {
    const khu = khuBai.get(p.post_id);
    theoTang.get(tangCua(khu, mucGan(p.text, danhBa[khu])))?.push(p);
  }
  const chon = [], moiTang = {};
  for (const t of TANG_HAI_KHU) {
    const r = chonMau(theoTang.get(t), { n: co, seed: `${seed}:${t}`, tinCua });
    chon.push(...r.chon.map((x) => ({ ...x, stratum: t })));
    const thieu = Math.max(0, co - r.chon.length);
    moiTang[t] = {
      co: r.khac_nhau, chon: r.chon.length, thieu,
      wilson_toi_da: Number(wilsonDuoiDungHet(r.chon.length).toFixed(4)),
      ...(thieu ? { nhan: TANG_BAT_BUOC.includes(t) ? "bắt buộc" : "cho PL36" } : {}),
    };
  }
  return { chon, moiTang, tin_cua_lat: cuaLat.length, khac_nhau: dai.length, bo_nhom: boNhom, bo_loai_khac: boLoaiKhac, dem_nhom: demNhom, bo_su_kien, bo_vi_trung };
}
