-- Lùi bước 1d: bốn bảng stg_s16_* khai REFERENCES airbnb_snapshots ON DELETE CASCADE, xoá dòng bản thu S16 là gỡ trọn lượt nạp.
DELETE FROM airbnb_snapshots WHERE source = 'S16';
