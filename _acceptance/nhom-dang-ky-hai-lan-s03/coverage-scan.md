# Quét độ phủ: `nhom-dang-ky-hai-lan-s03`

Preset test-matrix, chỉnh trục theo bài toán.

## Ngữ cảnh

- Sản phẩm: lấy mẫu gắn nhãn tin S03 theo từng nhóm. Chân sản phẩm: `docs/product/CONTEXT-PRODUCT.md`, `pipeline/label-sample.mjs`, 30 dòng sổ đo 04/11.
- Chân ngành: chọn mẫu phân tầng đòi các tầng rời nhau `[NGÀNH: Cochran, Sampling Techniques]`; một đơn vị thuộc hai tầng là lỗi khung mẫu.

## Trục

- **Dạng dòng của một nhóm**: một dòng khoá trần | một dòng có tiền tố | một khoá lạ | hai dòng trần và tiền tố | hai dòng khác kênh | ba dòng. Thước CE: sổ thật đo 04/11 `[SUY-TỪ-REPO: scripts/lib/ops-local.mjs]`.
- **Dạng khoá của bài**: khoá trần | có tiền tố | không có khoá | không có trong sổ. Thước CE: `stg_zalo_posts` đo 04/11 `[SUY-TỪ-REPO: pipeline/import-airbnb.mjs]`.
- **Lát và chế độ chạy**: lát mới ghi | `--thu` | lát sạch đã có | lát có tầng phụ. Thước CE: luật lát đã có dòng của GC0 `[SUY-TỪ-REPO: pipeline/label-sample.mjs]`.

Trục trạng thái dòng không tách riêng: đổi trạng thái không đổi kết quả, chỉ cần một ô chứng điều đó.

## Core

1. Hai dòng trần và tiền tố × bài cả hai dạng × lát mới: đúng lỗi đo được (AC-1, AC-2).
2. Ba dòng, khác kênh, dòng phụ `paused`, khoá lạ, không gộp quá tay: bảng AC-4.
3. Lát có tầng phụ: AC-5.
4. Chạy `--thu` và ghi: AC-3, AC-6.
5. Bản sao dữ liệu thật: AC-7.

## Later

- Hợp nhất ba dòng trong sổ và chuẩn hoá khoá ở transform: cần lời Mạnh, sau 05/11.
- Gắn đơn vị cho bài không có khoá (94 bài sau lọc): đã đếm, không lẫn tầng.

## Never

- Sửa `conversation_id` trong `stg_zalo_posts`: lượt nạp lại từ raw bất biến đảo ngược.

## Áp mọi ô Core

- Không sửa dữ liệu thật. Không in khoá nhóm.
