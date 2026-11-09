// chon.mjs — E8 (AC-8): bộ chọn mã thật (pipeline/lib/chon-ma-ho-so.mjs) trên DB thử trong giao dịch ROLLBACK, cộng các ca không
// được chọn dựng trên chính mã đã chọn; snapshot hồ sơ chưa nạp dựng trong thư mục tạm. Không in mã.
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { LUOT_THU, NGUON_SNAPSHOT_HO_SO, chonMa, docVaChon, duongYeuCauHopLe } from "../../pipeline/lib/chon-ma-ho-so.mjs";
import { SQL_LL } from "../../pipeline/lib/lien-lac-nguoi.mjs";
import { nap079 } from "../../pipeline/lib/nap-079.mjs";
import { nap080 } from "../../pipeline/lib/nap-080.mjs";
import { boKiem, trongGiaoDich } from "./chung.mjs";

/** Bảng bài của kênh, suy cùng cách bộ chọn suy (từ câu đọc bài của bộ ghi liên lạc). */
const BANG_BAI = SQL_LL.bai.match(/FROM\s+(\w+)/)[1];

/** Một snapshot hồ sơ chưa nạp: chỉ manifest + items, đúng khuôn SnapshotWriter. */
function snapshotHoSo(goc, ma, luc) {
  const sid = `hanoi__${NGUON_SNAPSHOT_HO_SO}__lnb`;
  const dir = join(goc, "hanoi", sid);
  mkdirSync(dir, { recursive: true });
  const items = [{ source: NGUON_SNAPSHOT_HO_SO, sourceId: `${ma}__${luc}`, kind: "ho-so", fetchedAt: luc,
    payload: { ma_tai_khoan: ma, username: "", loai: "khong-username" } }];
  writeFileSync(join(dir, "items-0001.json.gz"), gzipSync(JSON.stringify(items)));
  writeFileSync(join(dir, "manifest.json"), JSON.stringify({ snapshotId: sid, source: NGUON_SNAPSHOT_HO_SO, files: [{ name: "items-0001.json.gz" }] }));
}

export async function chay() {
  const k = boKiem("chon");

  // Phần thuần: mã mang tiền tố hay hậu tố, người chỉ có trong bài (không có tin) không bao giờ được chọn.
  const p = new Map([["111", "A"], ["222", "B"], ["333", "C"]]);
  const thuan = chonMa(
    [{ ma: "111", n_tin: 5, co_so: false }, { ma: "111_0", n_tin: 9, co_so: false }, { ma: "x222", n_tin: 9, co_so: false },
      { ma: "222", n_tin: 2, co_so: false }, { ma: "333", n_tin: 4, co_so: true }],
    p, new Set(), new Set(), ["444", "111", "555", "666"]);
  k.kiem("thuần: chỉ mã toàn chữ số, đủ tin, không số", JSON.stringify(thuan.mas) === '["111"]' && thuan.dem.ma_sai_khuon === 2);
  k.kiem("thuần: đối chứng 2 mã, không trùng mã đã chọn", JSON.stringify(thuan.doi_chung) === '["444","555"]');
  k.kiem("tệp yêu cầu không được trong ~/.openclaw hay snapshots/",
    !duongYeuCauHopLe(join(homedir(), ".openclaw", "x", "yeu-cau.json")) && !duongYeuCauHopLe("/a/collector/snapshots/yeu-cau.json")
    && duongYeuCauHopLe(join(homedir(), ".oneinvest", "s03-tra", "yeu-cau.json")));

  const goc = mkdtempSync(join(tmpdir(), "lnb-snap-"));
  try {
    await trongGiaoDich(async (c) => {
      await nap079(c);
      await nap080(c);
      const ban = await docVaChon(c, { snapshots: goc, soMa: LUOT_THU.soMa });
      k.kiem(`lượt thử chọn đủ ${LUOT_THU.soMa} mã + ${LUOT_THU.doiChung} đối chứng`,
        ban.mas.length === LUOT_THU.soMa && ban.doi_chung.length === LUOT_THU.doiChung);
      // Bất biến trên mọi mã đã chọn, đo độc lập bằng SQL.
      const bv = (await c.query(
        `WITH m AS (SELECT unnest($1::text[]) ma)
         SELECT count(*) FILTER (WHERE m.ma !~ '^[0-9]+$')::int sai,
                count(*) FILTER (WHERE (SELECT count(*) FROM sale_offer_records r WHERE r.source = 'S03' AND r.seller_ref = m.ma) < 3)::int it,
                count(*) FILTER (WHERE EXISTS (SELECT 1 FROM sale_offer_records r WHERE r.source = 'S03' AND r.seller_ref = m.ma
                                                 AND r.seller_phone IS NOT NULL))::int co_so
           FROM m`, [ban.mas])).rows[0];
      k.kiem("mọi mã chọn: toàn chữ số, ≥ 3 tin, không tin nào có số", bv.sai === 0 && bv.it === 0 && bv.co_so === 0);
      const [m1, m2, m3, m4, m5, m6, m7] = ban.mas;
      const nguoiCua = async (ma) => (await c.query(
        `SELECT object_key FROM registry_aliases WHERE retired_at IS NULL AND source = 'S03' AND kind = 'tai_khoan_nguon' AND value = $1`, [ma])).rows[0].object_key;

      // m1: một tin có số → không chọn.
      await c.query(`UPDATE sale_offer_records SET seller_phone = '+84912000002'
                      WHERE offer_id = (SELECT min(offer_id) FROM sale_offer_records WHERE source = 'S03' AND seller_ref = $1)`, [m1]);
      // m2: Người theo SĐT (có bí danh sdt) đã nối vào Người của m2 (HD13) → không chọn.
      const nguoiSo = (await c.query(
        `SELECT p.party_key FROM parties p JOIN registry_aliases a ON a.object_key = p.party_key AND a.kind = 'sdt' AND a.retired_at IS NULL
          WHERE p.status = 'active' LIMIT 1`)).rows[0].party_key;
      await c.query("UPDATE parties SET status = 'merged', merged_into = $2 WHERE party_key = $1", [nguoiSo, await nguoiCua(m2)]);
      // m3: tra 29 ngày trước → không chọn; m4: tra 31 ngày trước → chọn lại.
      await c.query(`INSERT INTO stg_s03_ho_so (source_id, ma_tai_khoan, username, loai, captured_at)
                     VALUES ($1, $2, '', 'khong-username', now() - interval '29 days'), ($3, $4, '', 'khong-username', now() - interval '31 days')`,
        [`${m3}__lnb29`, m3, `${m4}__lnb31`, m4]);
      // m5: chỉ có trong snapshot hồ sơ chưa nạp (1 ngày trước) → không chọn.
      snapshotHoSo(goc, m5, new Date(Date.now() - 864e5).toISOString());
      // m6, m7 vừa được chọn ở lượt trên (đối chứng dương cùng dữ liệu). Kho không có bảng thành viên nhóm hay bình luận riêng:
      // tài khoản «chỉ bình luận» là người gửi bài trong bảng bài mà không còn tin; «chỉ là thành viên» là bí danh tài khoản không có
      // tin lẫn bài. Gỡ tin của cả hai (seller_ref về NULL, Người và bí danh giữ nguyên) → không được chọn.
      await c.query("UPDATE sale_offer_records SET seller_ref = NULL WHERE source = 'S03' AND seller_ref = ANY($1::text[])", [[m6, m7]]);
      await c.query(`CREATE TEMP TABLE lnb_bai ON COMMIT DROP AS SELECT * FROM ${BANG_BAI} WHERE sender_id IS NOT NULL LIMIT 3`);
      await c.query("UPDATE lnb_bai SET post_id = post_id || '_lnb6', sender_id = $1, captured_at = now()", [m6]);
      await c.query(`INSERT INTO ${BANG_BAI} SELECT * FROM lnb_bai`);
      await c.query(`UPDATE ${BANG_BAI} SET sender_id = sender_id || '_lnb7' WHERE sender_id = $1`, [m7]);
      const daDung = (await c.query(
        `SELECT (SELECT count(*) FROM ${BANG_BAI} WHERE sender_id = $1)::int bai6,
                (SELECT count(*) FROM sale_offer_records WHERE seller_ref = ANY($2::text[]))::int tin67,
                (SELECT count(*) FROM registry_aliases WHERE retired_at IS NULL AND source = 'S03' AND kind = 'tai_khoan_nguon'
                   AND value = ANY($2::text[]))::int bi_danh67`, [m6, [m6, m7]])).rows[0];
      k.kiem("dựng ca: m6 có ≥ 3 bài mà 0 tin, m7 có bí danh mà 0 tin, 0 bài",
        daDung.bai6 >= 3 && daDung.tin67 === 0 && daDung.bi_danh67 === 2);

      const sau = await docVaChon(c, { snapshots: goc, soMa: LUOT_THU.soMa });
      const co = new Set(sau.mas);
      k.kiem("tài khoản có một tin mang số không được chọn", !co.has(m1));
      k.kiem("Người có số qua Người theo SĐT đã nối không được chọn", !co.has(m2));
      k.kiem("mã tra 29 ngày trước không được chọn", !co.has(m3));
      k.kiem("mã tra 31 ngày trước được chọn lại", co.has(m4));
      k.kiem("mã chỉ có trong snapshot hồ sơ chưa nạp không được chọn", !co.has(m5));
      k.kiem("mã chỉ có bài hay bình luận (không tin) không được chọn, dù lượt trước đã chọn", ban.mas.includes(m6) && !co.has(m6));
      k.kiem("mã chỉ là thành viên (bí danh, không tin, không bài) không được chọn, dù lượt trước đã chọn",
        ban.mas.includes(m7) && !co.has(m7));
      k.kiem("đối chứng không trùng mã đã chọn", sau.doi_chung.every((m) => !co.has(m)));
    });
  } finally {
    rmSync(goc, { recursive: true, force: true });
  }
  return k.ketThuc();
}
