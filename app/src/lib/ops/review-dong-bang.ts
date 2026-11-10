/**
 * Thẻ Ghép căn đóng băng (V7, Mạnh chốt Q1 08/11 — gắn căn = nhận diện duy nhất, FRAMING §3.4): duyệt thẻ `entity_match`
 * không gắn tin vào căn nào, nên thẻ ĐANG CHỜ không hiện ở hàng duyệt và không được đếm ở bất kỳ số «chờ duyệt» nào. Dữ liệu
 * giữ nguyên trong `review_queue`; thẻ đã quyết (kể cả hoãn) vẫn hiện để xem lại. Thay thế: danh bạ vật thể (DB1) và chuỗi
 * gắn căn GC0–GC3.
 *
 * MỘT vị từ cho mọi bên đọc. Bên đọc `.mjs` (scripts/lib/ops-local.mjs, scripts/bao-cao-ngay.mjs, pipeline/do-the-duyet.mjs)
 * chép đúng chuỗi này; `scripts/ops-local-dong-bang.test.mjs` so chuỗi và quét mọi câu đọc `review_queue` của kho.
 */
export const THE_DONG_BANG_SQL = "(item_type = 'entity_match' AND status = 'pending')";

/** Mệnh đề lọc bỏ thẻ đóng băng — dán sau WHERE / AND. */
export const KHONG_DONG_BANG_SQL = `NOT ${THE_DONG_BANG_SQL}`;
