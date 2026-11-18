// nap-view-song.mjs — cho test và phép đo nạp lại migration cũ (044, 045, 059, 061) trên DB đã áp 070 (kiem-do-sau-ap-070-sua).
// Bốn tệp ấy dựng view sống bằng SELECT *, mà view sau 070 có thêm cột cuối seller_phone_inferred, nên CREATE OR REPLACE báo
// «cannot drop columns from view». Migration đã commit không sửa được; bộ nạp bỏ đúng câu ấy khi view đã mang cột.
// Bỏ an toàn: 070 liệt cột tường minh sau khi 061 thêm xong cột vào bảng, nên view đã đủ cột của cả bốn tệp.
import { daCoNhan070 } from "./nap-070.mjs";

export const CAU_VIEW_SONG = "CREATE OR REPLACE VIEW sale_offers AS SELECT * FROM sale_offer_records WHERE retired_at IS NULL;";

/** SQL để nạp lại trong giao dịch đang mở: view chưa có cột của 070 thì giữ nguyên từng byte. */
export async function sqlNapLai(client, sql) {
  return (await daCoNhan070(client)) ? sql.replace(CAU_VIEW_SONG, "-- view đã có cột của 070: bỏ câu dựng lại") : sql;
}

// Câu ràng buộc trường phát biểu của 059. Nạp lại 059 trên DB đã áp 061/082 (thêm trường) thì câu này vỡ vì phát biểu
// của các trường mới (V6 tin-ngung-rao-khong-thay-lai, đo 09/11: bộ PL19 đỏ 15/15 trên bản chép máy thu).
// Bắt theo khuôn (không chép giá trị trục ra đây — sổ từ vựng là nguồn duy nhất của giá trị).
export const CAU_TRUONG_059 = /ALTER TABLE field_assertions ADD CONSTRAINT field_assertions_field_chk\s+CHECK \(field IN \([^)]*\)\);/;

/** SQL 059 để nạp lại trong giao dịch đang mở: ràng buộc trường giữ định nghĩa đang sống trên DB (rộng hơn 059). */
export async function sqlNapLai059(client, sql) {
  const { rows: [r] } = await client.query(`SELECT pg_get_constraintdef(oid) AS d FROM pg_constraint
    WHERE conname = 'field_assertions_field_chk' AND conrelid = 'field_assertions'::regclass`);
  const s = await sqlNapLai(client, sql);
  if (!r) return s;
  if (!CAU_TRUONG_059.test(s)) throw new Error("sqlNapLai059: 059 không còn câu ràng buộc trường phát biểu — sửa bộ nạp");
  return s.replace(CAU_TRUONG_059, () => `ALTER TABLE field_assertions ADD CONSTRAINT field_assertions_field_chk ${r.d};`);
}

// Hàng itest-nap-lai-migration-cu-sau-095: mọi migration đụng trục phát biểu (059, 061, 082, 095, rồi 096…) đều DROP rồi
// ADD lại field_assertions_field_chk với danh sách của thời mình. Nạp lại một tệp cũ lên DB đủ migration thì ràng buộc vỡ
// («violated by some row») hoặc bị thu hẹp lặng lẽ. Luật chung, bền với migration mới: câu ADD của tệp đang nạp được thay
// bằng HỢP của tập trường đang sống và tập của tệp — không bỏ trường nào của cả hai phía. Tập sống nằm trọn trong tập tệp
// thì giữ nguyên từng byte. Bắt theo khuôn câu (không chép giá trị trục ra đây).
export const CAU_TRUONG = /ALTER TABLE field_assertions ADD CONSTRAINT field_assertions_field_chk\s+CHECK \(field IN \(([^)]*)\)\);/g;
const tachTruong = (s) => [...String(s).matchAll(/'([a-z_0-9]+)'/g)].map((m) => m[1]);

/** Tập trường của ràng buộc đang sống trên DB (null khi bảng hay ràng buộc chưa có). */
export async function truongSong(client) {
  const { rows: [r] } = await client.query(`SELECT pg_get_constraintdef(c.oid) AS d FROM pg_constraint c
    WHERE c.conname = 'field_assertions_field_chk' AND c.conrelid = to_regclass('field_assertions')`);
  return r ? tachTruong(r.d) : null;
}

/** Thay mọi câu ADD ràng buộc trường trong `sql` bằng HỢP tập sống ∪ tập tệp; sống ⊆ tệp → giữ nguyên câu ấy. */
export function giuTruong(sql, song) {
  if (!song) return sql;
  return sql.replace(CAU_TRUONG, (cau, ds) => {
    const tep = tachTruong(ds);
    const them = song.filter((f) => !tep.includes(f));
    if (them.length === 0) return cau;
    return `ALTER TABLE field_assertions ADD CONSTRAINT field_assertions_field_chk\n  CHECK (field IN (${[...tep, ...them].map((f) => `'${f}'`).join(", ")}));`;
  });
}

/** Như sqlNapLai, thêm luật giữ trục phát biểu — dùng khi nạp lại migration cũ lên DB đủ migration. */
export async function sqlNapLaiDayDu(client, sql) {
  return giuTruong(await sqlNapLai(client, sql), await truongSong(client));
}
