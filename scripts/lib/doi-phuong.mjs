// Thước «tin có phường hợp lệ trước lượt bị gỡ hay đổi phường» — nối tin trước/sau một lượt transform theo TỪNG BÀI.
// Mã tin S03/S05 băm cả phường (transform-zalo/fb) nên đổi phường là đổi mã; bài đăng (post_ids) là khoá nối còn lại.
// Tin S06 không có bài (mã băm list_id, bền) → nối theo offer_id. Hàng tin-rao-doi-phuong-noi-post-ids.
import { phuongHopLe } from "../../pipeline/lib/osm.mjs";

/**
 * @typedef {{ offer_id: string, source: string, area_id: string|null, hop_le: boolean|null, post_ids?: string[]|null }} Tin
 * @param {Map<string, Tin>} truoc chụp trước lượt
 * @param {Map<string, Tin>} sau chụp sau lượt
 * @returns {{ lech: { offer_id: string, post_id: string|null, loai: "mat-phuong"|"doi-phuong", truoc: string, sau: string|null }[],
 *             khongCon: { offer_id: string, post_id: string|null, source: string }[] }}
 */
export function lechTheoBai(truoc, sau) {
  // bài → tin của lần chụp sau (một bài thuộc một tin sau dedup; trùng thì lấy tin có offer_id nhỏ nhất)
  const tinCuaBai = new Map();
  for (const t of [...sau.values()].sort((a, b) => a.offer_id.localeCompare(b.offer_id))) {
    for (const p of t.post_ids ?? []) if (!tinCuaBai.has(p)) tinCuaBai.set(p, t);
  }
  const lech = [];
  const khongCon = [];
  const so = (o, t, post_id) => {
    if (t.area_id === o.area_id) return;
    lech.push({ offer_id: o.offer_id, post_id, loai: t.area_id === null ? "mat-phuong" : "doi-phuong", truoc: o.area_id, sau: t.area_id });
  };
  for (const o of truoc.values()) {
    if (!o.hop_le) continue;
    const bai = o.post_ids ?? [];
    if (bai.length) {
      for (const p of bai) {
        const t = tinCuaBai.get(p);
        if (t) so(o, t, p);
        else khongCon.push({ offer_id: o.offer_id, post_id: p, source: o.source });
      }
    } else {
      const t = sau.get(o.offer_id);
      if (t) so(o, t, null);
      else khongCon.push({ offer_id: o.offer_id, post_id: null, source: o.source });
    }
  }
  return { lech, khongCon };
}

export const NGUON_TIN_RAO = ["S03", "S05", "S06"];

/** Chụp tin S03/S05/S06: offer_id → Tin; hop_le = area_id là phường hợp lệ (null khi không có phường). */
export async function chupTin(c) {
  const { rows } = await c.query(
    `SELECT o.offer_id, o.source, o.area_id, o.post_ids,
            CASE WHEN o.area_id IS NULL THEN NULL
                 ELSE EXISTS (SELECT 1 FROM areas a WHERE a.id = o.area_id AND a.region_type = 'submarket' AND ${phuongHopLe("a.")})
            END AS hop_le
     FROM sale_offers o WHERE o.source = ANY($1)`,
    [NGUON_TIN_RAO],
  );
  return new Map(rows.map((r) => [r.offer_id, r]));
}

/** Phường hợp lệ mồi + một bài S03 và một bài S05 nhắc tên nó — đối chứng dương của thước (AC-2, AC-3). Gọi trong transaction. */
export const MOI = {
  area: "vn-hanoi-moi-doi-phuong-trg",
  ten: "Mồi Đổi Phường Trg",
  snap: "hanoi__zalo-agent__2099-03-03T000000",
};
export async function chenMoi(c) {
  await c.query(
    `INSERT INTO areas (id, region_type, name, country_code) VALUES ('vn-hanoi', 'market', 'Hà Nội', 'vn') ON CONFLICT (id) DO NOTHING`,
  );
  await c.query(
    `INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'zalo-agent', '{}') ON CONFLICT (snapshot_id) DO NOTHING`,
    [MOI.snap],
  );
  await c.query(
    `INSERT INTO areas (id, parent_id, region_type, name, country_code, meta)
     VALUES ($1, 'vn-hanoi', 'submarket', $2, 'vn', '{"source":"osm-phuong"}'::jsonb)`,
    [MOI.area, MOI.ten],
  );
  const bai = [];
  for (const [tag, agent, nhom, m2, gia] of [["s03", "openclaw-hook", "BĐS Hà Nội", 61.7, "2.61"], ["s05", "apify-facebook", "MUA BÁN NHÀ ĐẤT HÀ NỘI", 62.7, "2.62"]]) {
    const id = `t_dp_${tag}_${process.pid}`;
    await c.query(
      `INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, text, posted_at)
       VALUES ($1, $2, $3, $4, $5, '2026-10-25T08:00:00Z')`,
      [id, MOI.snap, agent, nhom, `Bán căn hộ 2PN ${m2}m2 ${MOI.ten}, giá ${gia} tỷ. LH 0977${tag === "s03" ? "111" : "222"}333`],
    );
    bai.push(id);
  }
  return bai;
}
export const danhDauLac = (c) => c.query(`UPDATE areas SET meta = meta || '{"lac": true}'::jsonb WHERE id = $1`, [MOI.area]);
