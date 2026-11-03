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
