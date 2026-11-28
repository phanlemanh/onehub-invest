---
schema_version: 1
feature: Test thu đuôi S06 không còn đỏ oan khi lượt nạp ngày thật của máy thu đang chạy — cách ly ca e2e khỏi tiến trình thật, giữ nhánh nhường lượt có phép đo
slug: thu-duoi-nhuong-luot-khong-dung-may-that
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: draft
design_doc: docs/superpowers/specs/2026-11-28-thu-duoi-nhuong-luot-khong-dung-may-that-design.md
approved_by:
approved_at:
---

# Acceptance Contract: thu-duoi-nhuong-luot-khong-dung-may-that

## Context

`scripts/thu-duoi-s06.sh` (ZC18) nhường lượt quét đủ bằng `pgrep -f "scripts/chotot-daily.sh"` trên toàn máy. Ca e2e
`pipeline/scripts/thu-duoi-chon-nap-e2e.test.mjs` chạy wrapper thật với `PATH` thật, nên lúc lượt nạp ngày thật của máy thu
đang chạy (05:30 và 14:00 giờ VN) wrapper nhường lượt, không nạp gì, và ca đỏ ở «snapshot C mới thật phải được nạp». Đo thật:
PL43 vòng 4, suite `pipeline_b` 1/872, 28/11 ~07:15Z; cùng ca xanh trên M5. Mỗi lần như vậy mất một lượt khoá s4 khoảng 1,5 giờ.

Hàng này sửa test, không sửa wrapper: ca e2e dùng `pgrep` giả (cùng nếp `scripts/thu-duoi-s06.test.mjs`), và một tệp test mới
chứng nhánh nhường lượt vẫn chạy với `pgrep` thật trên một tiến trình thật do chính test dựng.

## Criteria

- AC-1: Given một tiến trình có dòng lệnh chứa `scripts/chotot-daily.sh` đang sống trên máy, When chạy
  `pipeline/scripts/thu-duoi-chon-nap-e2e.test.mjs` trên DB của riêng lượt, Then cả hai ca xanh (2 pass, 0 fail, 0 skip). Cùng
  điều kiện, bản tệp ấy ở 2beb7d6ba đỏ ở «snapshot C mới thật phải được nạp», và cùng bản ấy với `pgrep` giả thoát 1 thì xanh
  (đối chứng: đỏ là do nhường lượt) — đo hai chiều trong cùng lượt chấm.
- AC-2: Given một tiến trình thật có dòng lệnh chứa `scripts/chotot-daily.sh` do test dựng, bản chép wrapper trong cây tạm,
  `THU_DUOI_S06_GOC` và `HOME` trỏ thư mục tạm, và `node` là shim đếm lời gọi, When wrapper chạy với `pgrep` thật, Then
  wrapper thoát 0, in đúng dòng «nhường lượt — script nạp ngày đang chạy», không gọi `node` lần nào, và khoá chỉ nằm ở gốc tạm.
- AC-3: Given bản chép wrapper với nhánh nhường lượt bị tắt (`if false; then`), When chạy tệp test của AC-2 trên bản chép ấy,
  Then tệp test đỏ đúng ở thông điệp «thiếu dòng nhường lượt» và shim đếm được ≥1 lời gọi `node` — đo trong lượt chấm, mã thật
  không đổi.
- AC-4: Given nhánh so với `origin/main`, When liệt tệp đổi, Then ngoài vật hồ sơ chỉ có
  `pipeline/scripts/thu-duoi-chon-nap-e2e.test.mjs` và `pipeline/scripts/thu-duoi-nhuong-luot.test.mjs`;
  `scripts/thu-duoi-s06.sh` không đổi (hành vi mặc định ở máy thu giữ nguyên).
- AC-5: Given mã mới, When chạy tệp test shim của ZC18 (`scripts/thu-duoi-s06.test.mjs`, `scripts/install-cron-chi.test.mjs`),
  Then xanh như trên main.
- AC-6: Given `soat-tien-trinh.md` của hồ sơ, When rút lại từ mã danh sách tệp trong `scripts/**` và `pipeline/**` gọi
  `pgrep`, `pidof` hay `launchctl list`, Then mỗi tệp có một dòng trong bảng soát kèm kết luận, và dòng của
  `pipeline/scripts/thu-duoi-chon-nap-e2e.test.mjs` ghi «sửa trong hàng».

## Coverage

Không gian ca là các đường một test chạm tiến trình thật của máy, liệt theo mã (dòng `descope` «bỏ coverage-scan» trong sổ).

- Trục nguồn trạng thái máy: tiến trình thật (`pgrep`) · tệp khoá/pid thật · `launchctl` thật → AC-1, AC-6
- Trục khung giờ: có lượt nạp ngày thật đang chạy · không có → AC-1 (dựng tiến trình giả để luôn ở ca «có»), AC-2
- Trục nhánh nhường lượt: còn chạy với `pgrep` thật · bị tắt thì test bắt → AC-2, AC-3
- Trục hành vi chạy thật: wrapper không đổi → AC-4
- Trục không phá lời hứa cũ: test shim ZC18 → AC-5
- Trục các test khác cùng kiểu: bảng soát rút từ mã (`pgrep`, `pidof`, `launchctl`), mỗi dòng có kết luận → AC-6. Phần
  tệp khoá/pid (`*.lock`, `kill -0`) chỉ soát tay, ghi cuối bảng soát — không có máy đo.
- Số đếm (soát 28/11 trên 2beb7d6ba): 1 tệp test phụ thuộc máy thật không chủ ý (ca e2e này); 1 tệp cố ý đọc máy thu thật
  (ON22-AC-10, đã nằm trong `scripts/ci-bo-qua.json`); các tệp còn lại có shim hoặc chạy trên bản chép tạm.
- Ngoài phạm vi, vì: mẫu `pgrep -f` khớp cả tiến trình không phải lượt nạp ngày (đo 28/11: một shell chờ có chuỗi ấy trong dòng
  lệnh cũng khớp) — đó là hành vi chạy thật, đổi là đổi mặc định ở máy thu, ngoài ranh giới hàng test.

## Đường đo

Miễn số trên màn: hàng nền (test, CI). Không có `opportunity.md`. Con số của hàng là «số lượt S4/làn ghim trên Mac mini đỏ oan
vì lượt nạp ngày thật đang chạy»; AC-1 đo đúng điều kiện ấy bằng tiến trình dựng có chủ đích.

## Out of scope

- Sửa `scripts/thu-duoi-s06.sh` (kể cả siết mẫu `pgrep -f` cho khỏi khớp tiến trình lạ): hành vi chạy thật ở máy thu, việc riêng.
- Sửa ca ON22-AC-10 (`pipeline/scripts/ops-facts-so-tong-hop.test.mjs`): cố ý đọc máy thu thật, đã có trong `scripts/ci-bo-qua.json`.
- Cài lịch, plist, launchd cho thu đuôi.

## Notes

- Hàng do U2 viết (GS giao 28/11, cùng dãy viết ZC17, ZC18, ZC26 ở chính các tệp này).
