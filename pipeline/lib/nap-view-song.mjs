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
