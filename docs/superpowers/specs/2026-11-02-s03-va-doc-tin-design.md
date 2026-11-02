# Vá hẹp bộ đọc tin S03 (SV1, `s03-va-doc-tin`)

Căn cứ: `docs/research/s03-audit-trich-xuat-0211.md` §3, §8 hạng 1 + 1b, §10. Mạnh chốt 02/11 «Chọn làm hết», hai PR tách
nhau. Hàng này là PR một: không migration, T2. Tầng và hướng là SV2 (`s03-luu-tang-huong`).

## Vấn đề

Bộ đọc `parsePost` đọc sai hoặc bỏ sót những dạng môi giới viết thường ngày: «45,7m2» ra 7 m², «2N1WC» không ra phòng ngủ,
«hướng Tây Nam» thành phường Tây Nam (75/97 tin có phường), «cắt 450tr» thành giá, «4.9xx tỷ» mất giá. Mã toà và trục có trong
chữ nhưng không được lưu.

## Thiết kế

Tất cả nằm trong `pipeline/transform-zalo.mjs`, cộng một hàm phát biểu ở `pipeline/lib/assert.mjs`. `parsePost` là nguồn chân
lý chung nên S05 (`transform-fb.mjs`) đi cùng; phép đo in số đổi của S05, không đặt ngưỡng vì không có nhãn S05.

| Lỗi | Cách vá | Biên |
|---|---|---|
| DT có phẩy | Regex diện tích nhận phẩy thập phân, dùng cùng cách đọc của `MET_TRAN` | «1.234m2» giữ cách đọc cũ; không đặt sàn mới |
| PN viết tắt | Thêm `2N`, `1N+`, `2n1wc`, `3n2vs`, `2 ngủ`, `1+`, `studio` (0 phòng) | Không khớp «2 năm», «3 nữ», «5 ngày», «1 ngõ», «1+1»; `1N+` lưu 1, dấu cộng chưa có chỗ lưu |
| Phường theo hướng | Tên phường trùng hướng ghép (hiện chỉ có Tây Nam) chỉ khớp khi có «phường/p./xã» đứng ngay trước | Chỉ ở `matchPhuongThiTruong`; `matchPhuong` của S05, S06 giữ nguyên vì không có ca sai |
| Số ngữ cảnh | Giá có nhãn «giá …» xét trước; số đứng sau danh sách đóng (cắt, lỗ, vốn, vay, cọc, đã vào, chênh, giảm, hỗ trợ…, liệt kê đủ ở AC-4) không thành giá, trừ khi có «còn, giá, bán, chỉ» ngay trước số; số dính chữ cái («S702») không thành giá | Tin chỉ có số ngữ cảnh thì không giá. «cắt lỗ 2,9 tỷ» một mình không có giá vì cùng dạng với «cắt lỗ 1 tỷ» |
| Thuê ≥ 1 tỷ | `rent_lt` + giá ≥ 1 tỷ + không có đơn vị tháng, năm → `sale` | «1 tỷ/tháng», «1,2 tỷ/năm» vẫn bị chốt khoảng gạt |
| Giá che số | «4.9xx tỷ», «giá 36xx», «1.9x thu về» lưu **số sàn** (4,9 tỷ; 3,6 tỷ; 1,9 tỷ) (Hỏi-2) | Chỉ có một cột giá; PL13 lo giá khoảng. Sai số tới khoảng 5% («1.8x tỷ»), không phân biệt được với giá chính xác ở hàng này. Không nhãn, không đơn vị thì không đọc |
| Giá không đơn vị | Làm sau cùng, sau công tắc `giaKhongDonVi` mặc định bật. Chỉ nhận số có nhãn «giá …» ngay trước, hoặc «net, thu về, thu nét, btp, bao thuế, allin» ngay sau. Tin bán: «4100» là 4,1 tỷ, «4.1» là 4,1 tỷ. Tin thuê: «12000» là 12 triệu, «8.5» là 8,5 triệu | «Bán căn 2PN 2800» không nhãn thì không đọc. Làm tụt giá đúng so với lúc tắt → bỏ khỏi hàng theo nhánh trong hợp đồng; không hạ ngưỡng |
| Toà, trục | Bộ đọc mới `docToaTruc` trả toà và mã giữ nguyên chữ môi giới; mỗi bài một phát biểu `block_raw`, `unit_number` (`parser`) | Bài ≥ 2 mã: trống trục, chờ PL18; toà chỉ giữ khi mọi mã cùng toà. «S1.03» là tên toà, không phải trục. Mã nội bộ của sàn («S115451», «NTL22688») không đọc |

**Khoá gom:** `repostKey` thêm trục mới đọc (viết hoa) vào khoá, ở cả nhánh đủ phường + DT, để hai căn khác trục không chung một tin
và các bài của một tin không phát biểu hai trục khác nhau. Bài có mã và bài đăng lại thiếu mã giữ hai tin vì không chứng được cùng căn;
phép đo in số này. Bài không trục giữ nguyên khoá cũ. `offer_id` vẫn dính theo post (PL14).

**Hạng phân xử:** parser (hạng 2) thắng đề xuất LLM (hạng 4), nên `block_raw` S03 đang đến từ LLM có thể đổi khi bộ đọc đọc ra
giá trị khác. Đó là luật phân xử đã có; phép đo in số ô đổi (đo 02/11: thêm 1.276, đổi 4).

**Mức đổi trên dữ liệu thật** (đo 02/11, chỉ đọc): S03 2.772 → 3.015 tin; `offer_id` giữ 2.638, nghỉ 134, mọc 377; bán 854 → 1.180; thuê
1.925 → 1.835; 576 bài thuê từ 1 tỷ đổi thành bán. S05 đi cùng bộ đọc: 18/100 bài đổi, chủ yếu thêm phòng ngủ; S05 hiện 28 tin. Phép đo
đặt trần, xem AC-9.

## Tám câu ADR-0013

1. **Lớp:** toà, trục ghi lên tin (`Property`), là điều bài rao nói, chưa là sự thật của căn; ghép căn là PL20.
2. **DD 2.1:** `UnitNumber` có sẵn; `block_raw` đã có trong sổ, không thêm field.
3. **Khoá:** `offer_id` dính theo post, không suy từ nội dung; `repostKey` chỉ gom, đổi nó không đổi khoá của tin giữ lại.
4. **Ai ghi:** phát biểu `parser`, chỉ bộ phân xử ghi cột.
5. **Nguồn gốc:** mỗi giá trị truy về phát biểu có `method_version`, chữ gốc ở bài.
6. **Thời gian:** `observed_at` là `posted_at`; đổi giá đi qua lịch sử có sẵn.
7. **Nâng bậc:** không nâng bậc căn (0 tin S03 tới căn); tăng độ đúng và độ đầy trường tin S03.
8. **SPL:** chỉ mã S03, S05; không thêm tên nguồn; người đăng không đổi.

## Đo

- **Ma trận viết tay** ở `pipeline/scripts/va-doc-tin.test.mjs` (kho công khai nên không dùng chữ bài thật), mỗi lỗi một ca đỏ
  trên bản sao đột biến.
- **Tập nhãn audit** (383 bài, do tác tử gắn, **không phải nhãn vàng**) ở `research-local/s03-audit-0211/`, không vào kho, ghim sha256.
  Chia theo băm `post_id`: 2/3 để chỉnh, 1/3 giữ lại không xem lỗi; in cả hai phần. Script tìm tập ở `research-local/` của
  cây rồi của checkout chính (qua `git rev-parse --git-common-dir`); thiếu thì dừng có tên, không báo đạt.
- **Toàn bộ bài thật, chỉ đọc:** so bản nền ghim với bản cây, tính lại khoá gom và phép gán khoá dính để ra số tin, giữ, nghỉ,
  mọc. Không chạy transform trên DB chung. Một lần ở S3 chạy transform thật trên DB thử (bản chép dữ liệu `db-thu.sh`) để đối chiếu số tính lại.

## Không làm

Không chạy transform trên DB chung. Đường đêm `scripts/zalo-import-daily.sh` chạy transform từ checkout chính lúc 00:00, nên gộp là có
hiệu lực ở lượt kế (Hỏi-1). Điều phối xếp `reassign-areas` → 300 + 400 trước lượt kiểm cloud của `tin-rao-tren-invest`.

## Phương án đã loại

- **Sửa theo từng nhóm chat:** audit §4 cho thấy không đáng.
- **Giá che số lưu trung điểm:** đặt ra chữ số môi giới không viết. Lưu số trên làm tăng giá. Để trống là lối còn sống, trình ở Hỏi-2:
  2.435/51.442 bài tiếp tục không có giá.
- **Chỉ bóc `maToaCan` có sẵn để lưu:** bộ này chỉ đọc chữ hoa và bỏ dạng «PR6.3x13», «S1.12.08».
