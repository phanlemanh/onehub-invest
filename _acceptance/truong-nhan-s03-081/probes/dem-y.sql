-- Đếm ý trên lát s03-theo-nhom (chỉ đọc, 06/11). Chạy: psql với PGOPTIONS='-c default_transaction_read_only=on' < dem-y.sql
-- Sàn dưới: mẫu chữ, không bắt viết tắt lạ hay bài chỉ ảnh. Chỉ in số đếm, không in chữ bài.
WITH it AS (
  SELECT i.item_id, coalesce(i.ghep->>'chu_ref', i.ref_id) AS r
  FROM eval_label_items i WHERE i.lat='s03-theo-nhom' AND (i.ghep->>'trung_voi') IS NULL
), t AS (
  SELECT it.item_id, lower(coalesce((SELECT p.text FROM stg_zalo_posts p WHERE p.post_id=it.r ORDER BY p.captured_at DESC LIMIT 1),'')) AS x FROM it
)
SELECT 'tong', count(*) FROM t
UNION ALL SELECT 'co_chu', count(*) FILTER (WHERE length(x)>0) FROM t
UNION ALL SELECT 'furnished', count(*) FILTER (WHERE x ~ '(nội thất|full đồ|full nt|\mntcb\M|đồ cơ bản|nhà trống|căn trống|để trống|fully|furnish|đầy đủ đồ|nhà mới tinh)') FROM t
UNION ALL SELECT 'huong', count(*) FILTER (WHERE x ~ '(hướng|ban công|bc|cửa)\s*:?\s*(đông|tây|nam|bắc)' OR x ~ '\m(đn|đb|tn|tb)\M') FROM t
UNION ALL SELECT 'view', count(*) FILTER (WHERE x ~ '(view|tầm nhìn|nhìn (ra|thẳng|xuống)|hướng (hồ|biển|sông|công viên|vườn|nội khu|phố|thành phố|bể bơi|quảng trường))') FROM t
UNION ALL SELECT 'ngay_vao', count(*) FILTER (WHERE x ~ '(vào (ở|luôn|ngay)|ở (luôn|ngay)|bàn giao|nhận nhà|dọn vào|có thể vào|trống từ|từ ngày|đầu tháng|cuối tháng|tháng \d+/)') FROM t
UNION ALL SELECT 'phi', count(*) FILTER (WHERE x ~ '(phí (quản lý|dịch vụ|ql|dv)|\mpql\M|\mpdv\M|bao phí|bao (điện|nước|net|internet|wifi)|(đã|chưa) (gồm|bao gồm|bao) (phí|điện|nước)|miễn phí (dịch vụ|quản lý|gửi xe))') FROM t
UNION ALL SELECT 'co_so_gia', count(*) FILTER (WHERE x ~ '(thu về|\mnet\M|\mnét\M|gồm phí|bao phí|(chưa|đã) (gồm|bao gồm|bao)|bao sang tên|(chưa|đã) vat|bao thuế)') FROM t
UNION ALL SELECT 'ma_can', count(*) FILTER (WHERE x ~ '\m[a-z]{1,4}\d{0,2}[.\-]?(xx|\d{2})\d{2}\M' OR x ~ '[a-z0-9]x{2}\d') FROM t
UNION ALL SELECT 'ma_can_xx', count(*) FILTER (WHERE x ~ '[a-z0-9.]x{2}\d') FROM t
UNION ALL SELECT 'phap_ly', count(*) FILTER (WHERE x ~ '(sổ (đỏ|hồng|lâu dài|sẵn)|\mhđmb\M|hợp đồng mua bán|pháp lý|chờ sổ|đã có sổ)') FROM t
UNION ALL SELECT 'vay', count(*) FILTER (WHERE x ~ '(\mvay\M|hỗ trợ lãi|ngân hàng|ân hạn|lãi suất|\mhtls\M)') FROM t
UNION ALL SELECT 'coc', count(*) FILTER (WHERE x ~ '\mcọc\M') FROM t
UNION ALL SELECT 'ban_cong_goc', count(*) FILTER (WHERE x ~ '(ban công|lô gia|logia|lôgia|căn góc)') FROM t
UNION ALL SELECT 'gia_ptt', count(*) FILTER (WHERE x ~ '(\mtts\M|\mttc\M|\mttv\M|thanh toán (sớm|chuẩn|vay|nhanh)|chính sách bán hàng|\mcsbh\M)') FROM t;
