# Quét độ phủ: `nhom-hai-lan-s03-xu-goc`

Preset test-matrix, chỉnh trục theo bài toán.

## Ngữ cảnh

- Sản phẩm: bước transform S03 và sổ đơn vị thu. Chân sản phẩm: `pipeline/transform-zalo.mjs`, `pipeline/sync-don-vi.mjs`, số đo 05/11 trong design doc.
- Chân ngành: danh mục chuẩn giữ bản ghi trùng ở trạng thái hết hiệu lực thay vì xoá, để giữ lịch sử và mã đã cấp `[NGÀNH: MDM survivorship, DAMA-DMBOK]`; ghi nhãn dòng là giá trị đề xuất, chờ Mạnh chọn.

## Trục

- **Dạng khoá của bài và sổ**: trần | `group:` | `<kênh>:group:` | khoá lạ có dấu hai chấm | không có khoá. Thước CE: bảng AC-4 của `nhom-dang-ky-hai-lan-s03` `[SUY-TỪ-REPO: pipeline/lib/eval-labels.mjs]`.
- **Chỗ đọc khoá trong transform**: mục đích nhóm | loại hình nhóm | thị trường khai | tầng loại tin. Thước CE: mọi chỗ dùng `conversation_id` `[SUY-TỪ-REPO: pipeline/transform-zalo.mjs]`.
- **Trạng thái dòng phụ sau dọn**: giữ `active` | `paused` do đồng bộ | `retired` | đã xoá. Thước CE: `CUOI` trong `pipeline/sync-don-vi.mjs` `[SUY-TỪ-REPO: pipeline/sync-don-vi.mjs]`.
- **Dữ liệu**: fixture trong giao dịch lùi | bản sao thật. Thước CE: 3 cặp, 91 bài có tiền tố đo 05/11 `[SUY-TỪ-REPO: pipeline/import-airbnb.mjs]`.

## Core

1. Hai dạng khoá × mục đích, loại hình, thị trường: AC-1, AC-2.
2. Khoá lạ và không có khoá không bị gộp: AC-3.
3. Bản sao thật, trước và sau: AC-4.
4. Dọn sổ, chạy thử và ghi, chặn khi mất thông tin: AC-5, AC-6.
5. Sau dọn, đồng bộ sổ và lấy mẫu vẫn đúng: AC-7.
6. Hai lỗ phép đo và quét khoá: AC-8, AC-9, AC-10.

## Later

- Chuẩn hoá `gop-anh`: đo 05/11, 0 cặp bài khác dạng khoá cùng người dưới 2 phút.
- Chặn dòng trùng mới bằng ràng buộc: chưa có ca trùng mới sau 31/10.
- Chuẩn hoá `do-cam-mau-s03`: thước lịch sử, chưa cần số mới.

## Never

- Sửa `conversation_id` trong bảng bài S03: lượt nạp lại từ raw snapshot đảo ngược.

## Áp mọi ô Core

- Không ghi khoá nhóm thật, tên kênh vào tệp kho hay đầu ra (AC-5, AC-10).
- Dữ liệu thật chỉ đổi sau lời Mạnh và sau mốc 05/11.
