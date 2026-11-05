# Xử gốc nhóm S03 đăng ký hai lần — thiết kế (`nhom-hai-lan-s03-xu-goc`)

Ngày: 2026-11-05 · Nguồn: Out of scope và Notes của `_acceptance/nhom-dang-ky-hai-lan-s03/contract.md` · Hạng: T2.
Mạnh đã chốt: không sửa dữ liệu thật khi chưa có lời Mạnh; việc này gộp và áp sau mốc 05/11.

## Số đo 05/11 (chỉ đọc, hoặc giao dịch lùi trên DB thử `oneinvest_nhl_xu`)

- Ba cặp S03-N004/N022, N005/N018, N010/N024. Cả sáu dòng đang `active`, cùng thị trường, cùng thẻ.
- Dòng có tiền tố: lần lượt 43, 3, 45 bài, bài mới nhất 21/10. Dòng khoá trần: 7.836, 369, 2.626 bài, bài mới nhất 04/11.
- Bảng bài: 78.954 bài sau gạt post thử, 91 bài có tiền tố.
- 0 dòng `eval_label_items` mang mã phụ. Lát `s03-theo-nhom`, Mạnh sắp gắn: 367 bài, 25 tầng, 65 dòng ở ba mã đại diện. Việc này không đổi `stratum`, AC-7 giữ băm lát.
- Chuẩn hoá khoá ở transform, bản dựng thử, chạy trên bản sao thật:
  - Mục đích nhóm và thị trường khai: 0 bài đổi. Loại hình theo nhóm: 2 nhóm đổi, 74 bài đổi giá trị suy theo nhóm.
  - Tin S03: 4.050 trước, 4.050 sau. Hiện trên cổng: 1.382 trước, 1.382 sau (bán 940, thuê 442). 0 tin rời, 0 tin thêm, 0 tin đổi loại hình hay khu vực.
- `gop-anh`: 0 cặp bài khác dạng khoá cùng người dưới 2 phút.

Vậy phần transform không đổi số tin hôm nay. Giá trị của nó là chặn lệch về sau: lượt nạp lại bài cũ, hay dòng sổ trùng mới, không còn chia đôi nhóm, và xoá dòng phụ không làm 91 bài mất thị trường. Nó vẫn là đổi đường dữ liệu lên cổng, nên là Hỏi-2: chỉ dọn sổ theo lối A thì không cần đổi transform, vì `docThiTruongNhom` không lọc trạng thái. Lối chuẩn hoá lúc nạp trong `import-airbnb.mjs` không chọn: thuộc làn ZCode và phải nạp lại toàn bộ bài mới có tác dụng.

## Dọn sổ: chờ lời Mạnh

Ai đang dựa vào dòng phụ:

| Chỗ | Khi dòng phụ `retired` | Khi dòng phụ bị xoá |
|---|---|---|
| `sync-don-vi.mjs` | Không chạm (`CUOI`) | Không còn dòng |
| `khai-so-nhom.mjs` | Tệp khai giữ nguyên | Tệp khai có mã lạ, lệnh dừng, phải sửa tệp |
| `/ops/sources` | Vẫn 30 dòng, ba dòng hiện «Đã gỡ», công tắc không bật lại | 27 dòng |
| `docThiTruongNhom` | Không lọc trạng thái, vẫn đọc | Sau chuẩn hoá vẫn đủ nhờ dòng khoá trần |
| `label-sample` | Vẫn báo gộp, vẫn một tầng | Hết dòng báo gộp |
| `eval_label_items` | 0 dòng mang mã phụ | 0 dòng mang mã phụ |

Ba lối:

- **A. Chuyển ba dòng phụ sang `retired`, ghi lý do, giữ dòng và mã** (máy khuyên): mỗi nhóm một dòng còn hiệu lực, không mất lịch sử; hoàn lại bằng một câu UPDATE. Sổ vẫn có 30 dòng.
- **B. Xoá ba dòng phụ**: sổ đúng một dòng mỗi nhóm về mặt vật lý. Mất mã và dấu vết đăng ký 31/10, phải sửa tệp khai trong `research-local/`, chỉ khôi phục được từ bản sao lưu.
- **C. Không dọn**: lượt `sync-don-vi` kế tự đổi ba dòng sang `paused`, trông như nhóm tạm dừng dù không có nhóm nào dừng; sổ vẫn báo sai.

Lệnh `pipeline/don-nhom-hai-lan.mjs`: mặc định chỉ in, `--ghi` mới ghi. Tính cặp bằng `donViTheoNhomThat`, không viết tay mã, đổi trạng thái dòng phụ, ghi `reason` nêu mã đại diện và ghi `ops_audit` kèm trạng thái cũ trong một giao dịch. Dòng phụ đang `paused` do `sync-don-vi` cũng được dọn. Dòng hiệu lực là dòng có trạng thái ngoài `retired`, `completed`. Cặp không có dòng khoá trần, hai dòng lệch thẻ, thị trường, dự án, hay đại diện đã gỡ thì bỏ qua và báo, vì dọn sẽ mất thông tin hoặc để nhóm không còn dòng hiệu lực. Công tắc không bật lại dòng `retired` là hành vi có sẵn của hồ sơ `cong-tac-khong-ha-nhom-go`, không đo lại ở đây. Chạy lần hai không đổi gì. Lối B thì lệnh đổi `retired` thành `DELETE`, các phép đo còn lại giữ nguyên.

Hỏi-1 chỉ chọn lối. Lệnh chạy trên DB local máy thu sớm nhất ngày 06/11, sau khi PR gộp và Mạnh nói rõ cho chạy. Sổ là tầng A, không lên cloud nên không có bước trên cloud. Lối B thì xuất ba dòng ra `research-local/` trước khi xoá.

Thời điểm gộp mã là Hỏi-3: hồ sơ trước ghi việc này làm sau mốc; giám sát đợt nhắn 05/11 rằng có chữ ký và CI xanh là gộp, không cần đợi mốc. Máy khuyên gộp mã theo giám sát vì đo 0 tin đổi, còn lệnh ghi sổ vẫn chờ.

## Chuẩn hoá khoá ở transform

Đọc bài xong, `runTransformZalo` đổi `conversation_id` của từng bài sang khoá thật bằng chính `khoaNhomThat`, một chỗ. Mọi phép gom phía sau (mục đích, loại hình, thị trường) tự nhận khoá đã chuẩn hoá. `tangLoai` làm cùng cách. Offer không lưu khoá nhóm nên không có gì khác đổi.

`docThiTruongNhom` trả cả khoá nguyên văn lẫn khoá thật, dòng khoá trần thắng khi hai dòng khác thị trường: AC-6 của hồ sơ trước và các thước đang tra nguyên văn vẫn đúng.

Tham số `khoaNhom` của `runTransformZalo` theo đúng khuôn tham số `parse` đang có, chỉ để thước truyền hàm đột biến: khoá nguyên văn là hành vi cũ, gộp quá tay là bản lỗi.

Phương án đã bỏ:

- **Sửa `conversation_id` trong bảng bài S03**: `import-airbnb.mjs` ghi đè từ raw snapshot, lượt nạp lại đảo ngược.
- **Thêm ràng buộc DB chặn khoá trùng**: cần migration, chưa có ca trùng mới sau 31/10.
- **Chuẩn hoá `gop-anh`, `do-cam-mau-s03`**: đo 0 cặp ở `gop-anh`; `do-cam-mau-s03` là thước lịch sử.

## Hai lỗ phép đo trong `that-chi-doc.mjs`

- **AC-7 vế không vượt hạn mức**: `chon` luôn không quá `can` nên vế cũ không thể đỏ. Đo lại trên cả nhóm thật: tổng `chon` của mọi mã cùng một khoá thật không quá `can` của đại diện. Bản khoá nguyên văn cho 30 + 5 hay 5 + 3 nên đỏ với thông điệp `loi vuot han muc`.
- **AC-8 danh sách viết tay**: lấy tệp từ `git diff --name-only` của commit gộp PR #315 và của nhánh hiện tại so với nhánh chính. Danh sách rỗng là đỏ. Đối chứng dương: một kho git tạm có commit chứa khoá mồi, bộ quét theo diff phải đỏ.

Bộ quét theo diff đặt ở một tệp dùng chung để hồ sơ này quét luôn tệp của chính nó.

## Đặc tả UX

Không chạm giao diện (dòng sổ `bỏ đặc-tả-UX`).

## Phép đo

Fixture trong `BEGIN…ROLLBACK` trên DB thử `oneinvest_nhl_xu`, lệnh và hàm thật. Mỗi phép đo mới có cặp hai chiều trên cùng fixture: bản thật xanh, hàm đột biến hay dữ liệu mồi đỏ với thông điệp ghim. Đầu ra chỉ có số đếm và mã `S03-N…`.
