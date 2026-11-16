# L2 bảo thủ + dời năm probe dữ liệu thật ra khỏi suite chung — thiết kế

Hàng `l2-bao-thu-doi-probe-that`, T2, đợt dot0-cam-mau. Hàng này do GS giao sau khi `tach-o-duong-dau-vao-ban` gộp (#460,
main f78e7382). Nó gộp ba việc mà Mạnh đã chọn ở Cổng Bằng chứng của hàng trước:
- Ngoài-2 và Ngoài-3 «mở hợp đồng mới»;
- Hỏi-2 «dời ở hàng riêng»;
- Ngoài-1 (tsconfig).

## 1. L2 bảo thủ

Bước L2 của `khoaDuong` bóc «số nhà trần rồi dấu phẩy». Hai lượt chấm liên tiếp bắt lỗi cùng lớp: L2 bóc cả cái
không phải số nhà.
- r1: tên đường «3/2, Phường 12».
- r2: bề rộng «3,5m»; viết tắt «15, Q1», «208, P12», «12, Phuong 5»; tên phường «50 , Tân Khánh».

Lớp lỗi là «luật cho phép theo danh sách loại trừ». Mỗi lượt đo lại lộ thêm một kiểu loại trừ còn thiếu. GS chốt đổi
sang **danh sách cho phép**: chỉ bóc số nhà trước phẩy khi đoạn sau phẩy mở đầu bằng một tiền tố tên đường rõ ràng —
`Đường`, `Phố`, `Đ.`, `duong`, `pho` — hoặc một cụm vị trí `Hẻm/Ngõ/Ngách/Kiệt` (có hay không dấu), và tiền tố
phải là một TỪ trọn (theo sau là khoảng trắng, chấm hay gạch): «12, Phong Phú», «8, Phổ Quang» không bóc.

Bảng phủ ca, đo trên DB máy thu 15/11 (15.413 giá trị khác nhau). L2 hiện tại bóc 14 giá trị (15 tin).

| Giá trị | Khoá hôm nay | Khoá sau L2 bảo thủ | Đánh giá |
|---|---|---|---|
| «46, Đường Điện Biên Phủ, …» | điện biên phủ | điện biên phủ | giữ (đúng) |
| «33/3, Đường 25A» | 25a | 25a | giữ |
| «141A, Đường số 1» | số 1 | số 1 | giữ |
| «237/6, Hẻm 237 Đường Hoàng Diệu» | hoàng diệu | hoàng diệu | giữ |
| «3,5m» «4,5m» «7,5m» «4,3m» | 5m / 3m (rác) | — (Thiếu) | **sửa** |
| «50 , Tân Khánh , tân Uyên…» | tân khánh (tên phường) | — | **sửa** |
| «44d/17, Khu Pho Binh Đáng, …» | khu pho binh dang | 44d/17 (số) | **sửa** |
| «2A, Khu dân cư Vĩnh Phú 1» | khu dan cu vinh phu 1 | 2a | **sửa** |
| «10,8385278, 106,5705000» (toạ độ) | — | — | như cũ (không đổi khoá) |
| «208, Nguyễn Hữu Cảnh, Phường 22, …» | nguyễn hữu cảnh | — (Thiếu) | **mất** (đúng → trung tính) |
| «34/1A, Đỗ Mười» | đỗ mười | — | **mất** (đúng → trung tính) |

Ngoài nhóm L2 đang bóc, lối này còn giữ đúng hai lớp sau:
- tên đường dạng ngày/tháng trước phẩy («3/2, Phường 12», «19/5, Tân Bình»): không bóc vì đoạn sau không phải tiền tố
  đường. Danh sách ngày/tháng cố định của hàng trước bỏ được.
- viết tắt hành chính («15, Q1», «208, P12», «12, Phuong 5»): DB hiện có 0 giá trị dạng này; ca cố định giữ.

L2 trên main bóc 14 giá trị. Lối bảo thủ:
- giữ bóc 4: «46, Đường…», «33/3, Đường 25A», «141A, Đường số 1», «237/6, Hẻm 237…»;
- đổi khoá 9: 7 dọn rác (bốn bề rộng, «50 , Tân Khánh…», «44d/17, Khu Pho…», «2A, Khu dân cư…») và 2 đúng thành Thiếu
  («208, Nguyễn Hữu Cảnh…», «34/1A, Đỗ Mười»);
- như cũ 1: toạ độ.

Thiếu là trung tính trong luật (không ra khac_duong), còn rác thì gây loại nhầm. Hai giá trị «đúng thành Thiếu» là
giá của lối chặt (Hỏi-1).

Ca «208, Nguyễn Hữu Cảnh» là ca cố định đã ký ở CD-AC-9 L2 của `tach-o-duong-dau-vao-ban`. Hợp đồng này đổi kỳ vọng
của ca đó thành Thiếu, có ghi tên.

## 2. Dời năm probe dữ liệu thật (khuôn C đã duyệt)

| Ca | Tệp suite hiện tại | Chuyển sang | Executor đã ký chạy thêm tệp mới | Hồ sơ đã ký |
|---|---|---|---|---|
| KD-AC-6 phần (b) | agent/tests/judge-entity-khong-dau.test.ts | agent/probes/khong-dau-that.test.ts | `judge_entity_khong_dau` | duong-thang-n-khong-dau |
| LT-AC-6 «probe thẻ đã quyết» + «bộ nạp cặp thật» | agent/tests/judge-luat.test.ts | agent/probes/judge-luat-that.test.ts | `judge_luat` | judge-luat-loai-tru-dac-trung |
| AC-9 «chỉ kết quả land đổi trên tin thật của DB local» | agent/tests/context-resolver.test.ts | agent/probes/context-resolver-that.test.ts | (xem Hỏi-2) | enrich-hau-ky (E9 chạy qua suite `executors.test.agent`) |
| TPL-AC-6 probe DB máy thu | app/tests/the-duyet-phuong-lech-gia.test.tsx | app/probes/the-duyet-phuong-that.test.tsx | `the_duyet_phuong` | the-duyet-phuong-lech-gia |

KD-AC-6 phần (a) là tập viết trước, không DB, nên ở lại suite. Các ca cố định đi kèm từng probe đã có sẵn trong suite và
ở lại:
- KD-AC-1…5, KD-AC-6(a);
- LT-AC-1…5;
- AC-8 và AC-9 «E1 đất từ nội dung tin»;
- TPL-AC-1…5.

Hợp đồng ghim tên các ca đó, để việc dời không kéo theo ca cố định.

**Hỏi-2 — enrich-hau-ky E9.** Eval E9 chạy bằng `executors.test.agent`, tức chính suite chung. Dời ca DB ra khỏi suite
thì E9 thôi đo vế DB mà vẫn xanh. Có hai lối:
- **(khuyến nghị)** E9 khai `status: not-run` + `superseded_by: l2-bao-thu-doi-probe-that#AC-5`, theo cơ chế kit 2.24.
  Hồ sơ này nhận thay bằng bảng «eval cũ → AC mới» ở §4, và AC-5 đo lại cả vế cố định lẫn vế DB.
- Giữ ca DB của context-resolver trong suite như một khoản nợ có tên (CD-AC-10 cho nợ 1). Cái bẫy «một dòng dữ liệu
  chặn cả kho» khi đó còn mở ở ca này.

**Probe chạy ở đâu và ai đọc.**
- `scripts/probe-du-lieu-that.sh` chạy bốn tệp probe mới, mỗi tệp một dòng ✅/❌.
- `audit-all.sh` thêm mục B5 «Probe dữ liệu thật» gọi script đó, đổi mã thoát thành pass/fail. /ops-check đọc mỗi
  sáng, như B4.
- Chế độ trong-script không tạo tệp đột biến và không chạy chiều đỏ (cùng khuôn `o-duong-that.test.ts`).
- Nhánh ❌ của script kiểm bằng biến `PROBE_GIA_DO=<tên tệp probe>`: tệp được gọi tên ném lỗi ghim ngay đầu ca DB, không
  sửa mã nguồn, không tạo tệp. Script phải thoát 1 và in dòng ❌ gọi đúng tên tệp ấy.

**Phép kiểm suite (CD-AC-10).** Danh sách nợ về 0 cho cả agent (`tests/*.test.ts`) lẫn app (`tests/*.test.tsx`):
- không tệp suite nào còn dấu `t.skip("cần DB máy thu`;
- không tệp nào khai các tên ca probe đã dời.

## 3. tsconfig

`agent/tsconfig.json` thêm `"probes/**/*.ts"` vào `include`. `tsc --noEmit` kiểm cả bốn tệp probe agent.

## 4. Bảng eval cũ → AC mới (cho cơ chế superseded_by)

| Eval cũ | AC mới đo lại |
|---|---|
| enrich-hau-ky/E9 | AC-5 |

## 5. Ngoài phạm vi

- Số nhà dính chữ đứng một mình («2A», «44d/17») vẫn ra khoá số như trước vòng, không làm mới.
- Probe dữ liệu thật ở các module khác (pipeline, data-api) — chỉ quét agent và app.
- Đẩy cảnh báo chủ động khi probe ❌.
