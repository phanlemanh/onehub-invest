-- 098_khoa_gop_can.sql — DA6 khoa-gop-can-khong-gia: mỗi tin thuộc nhiều nhất một căn (ADR-0013 câu 3)
-- Thiết kế: docs/superpowers/specs/2026-11-12-khoa-gop-can-khong-gia-design.md · Hỏi-1 (Mạnh 13/11): giữ căn tạo sớm nhất.
-- Dọn link thừa (tin gắn hơn một căn) vào nhật ký khôi phục được, rồi thêm UNIQUE (offer_id). Không xoá căn nào (M-1).
-- Bảng nhật ký KHÔNG sync cloud. Áp máy thu và DDL UNIQUE trên cloud là lời riêng của Mạnh, đúng thứ tự (hợp đồng, Out of scope).
-- Idempotent: lần hai không còn link trùng để dọn, ràng buộc đã có thì bỏ qua. Bước dọn là MỘT câu (DELETE … RETURNING chèn nhật ký)
-- nên nhật ký và việc gỡ không bao giờ lệch nhau; không bọc BEGIN/COMMIT để itest áp được trong giao dịch, SAVEPOINT của nó.

CREATE TABLE IF NOT EXISTS property_offer_unlinks (
  property_id bigint NOT NULL,
  offer_id    text NOT NULL,
  score       numeric,
  signals     jsonb NOT NULL,
  linked_at   timestamptz NOT NULL,
  unlinked_at timestamptz NOT NULL DEFAULT now(),
  reason      text NOT NULL
);
CREATE INDEX IF NOT EXISTS property_offer_unlinks_offer_idx ON property_offer_unlinks(offer_id);

-- Mỗi offer_id giữ link tới căn created_at sớm nhất (hoà thì id nhỏ); các link còn lại chép trọn vào nhật ký rồi xoá.
WITH xep AS (
  SELECT po.property_id, po.offer_id,
         row_number() OVER (PARTITION BY po.offer_id ORDER BY p.created_at, p.id) AS hang
    FROM property_offers po JOIN properties p ON p.id = po.property_id
), go AS (
  DELETE FROM property_offers po USING xep
   WHERE xep.hang > 1 AND po.property_id = xep.property_id AND po.offer_id = xep.offer_id
  RETURNING po.property_id, po.offer_id, po.score, po.signals, po.linked_at
)
INSERT INTO property_offer_unlinks (property_id, offer_id, score, signals, linked_at, reason)
SELECT property_id, offer_id, score, signals, linked_at, 'DA6 gop: giu can tao som nhat' FROM go;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'property_offers_offer_id_key'
                   AND conrelid = 'property_offers'::regclass) THEN
    ALTER TABLE property_offers ADD CONSTRAINT property_offers_offer_id_key UNIQUE (offer_id);
  END IF;
END $$;
