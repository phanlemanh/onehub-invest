---
schema_version: 1
feature: Đo làm giàu hằng ngày — theo từng đường làm giàu, số giá trị thêm, đổi, máy rút, người sửa hay rút mỗi ngày và kiểm ngược bỏ-một-ra mỗi tuần kèm cận dưới Wilson; lát thị trường, phường/xã, dự án, toà; xem trên /ops/quality
slug: do-lam-giau
owner: phanlemanh@gmail.com
risk_tier: T3      # lộ trình ghi T2; máy nâng T3 vì sửa scripts/cloud-sync.sh và cần migration (cả hai thuộc t3_paths)
surfaces: [ui, db, script]
status: signed-off
design_doc: docs/superpowers/specs/2026-11-08-do-lam-giau-design.md
approved_by: Mạnh
approved_at: 2026-11-08
lo_trinh_ma: DO3
---

# Acceptance Contract: do-lam-giau

## Context

Hàng DO3 (`docs/plan/lo-trinh.json`). Cổng Đáng: Mạnh quyết build ngày 08/11, ngưỡng SỐNG «Mỗi đường làm giàu đang chạy có
số thêm/sửa/rút theo ngày và một lượt kiểm ngược mỗi tuần kèm cận dưới Wilson» (`opportunity.md`). Hôm nay có hai đường ghi giá
trị lên tin: số qua người đăng (901 tin S03) và loại hình theo nhóm (34.610 phát biểu). Diện tích suy ra (GC2/GC3) chưa có mã.
Danh mục CĐT mới ghi ở mức toà (18 toà, chưa xuống tin). Thiết kế: `design_doc`.

## Criteria

- **AC-1** — Given sổ đường làm giàu của `pipeline/lib/do-lam-giau.mjs` có bốn đường `so-qua-nguoi-dang`, `quy-uoc-nhom`,
  `dien-tich-suy-ra`, `danh-muc-cdt`, When chạy `pipeline/do-lam-giau.mjs --write` ngày D (giờ VN), Then `dq_check_results` có
  đúng một dòng `do3-thay-doi` của ngày D cho mỗi đường. Đường có giá trị sống trên tin ghi số và `status = 'pass'`. `status`
  chỉ là `'fail'` khi bộ tự soát lệch: `song` hôm nay khác `song` hôm qua + `them` − `may_rut` − `nguoi_rut`, hoặc tổng các ô
  của một chiều lát khác tổng chung; detail ghi tên phép soát lệch. Đường không có giá trị sống nào ghi `status = 'skip'`,
  lý do `chua-chay`, không có ô số 0. Chạy lại cùng ngày thay dòng của ngày D, không thêm dòng.
- **AC-2** — Given ảnh chụp giá trị sống ở `enrichment_value_state` của lần chạy trước, When giá trị đổi rồi chạy
  `do-lam-giau.mjs --write`, Then `enrichment_value_change` có đúng một dòng mỗi chủ thể đổi trong ngày D, hướng `them`, `doi`
  hoặc `may_rut`. Trên đường mà sổ đường khai có lối người rút, chủ thể rời đường vì phát biểu bị người rút trong ngày
  (`hitl-thay`, `hoan-tac:*`) chỉ đếm ở `nguoi_rut` (AC-3), không vào `may_rut`. Hai lần chạy cùng ngày gộp về một dòng: giữ giá trị đầu ngày, lấy giá trị mới nhất, về lại giá
  trị đầu ngày thì xoá dòng. Detail `do3-thay-doi` có `song`, `them`, `doi`, `may_rut` khớp các dòng ấy. Lần chạy đầu chỉ lập mốc: 0 dòng
  đổi, dq `skip` «lập mốc». Chủ thể không đổi không sinh dòng.
- **AC-3** — Given trong ngày D: phát biểu `hitl` ghi bằng lối người của 045 (`apply_enrichment`) đè cùng chủ thể, cùng ô
  với giá trị sống của một đường phát biểu; nhãn người (`eval_labels`) gắn ngày D cùng ô trên bài của tin đang mang giá trị
  của đường; và, với đường mà sổ đường khai có lối người rút, phát biểu của đường bị rút với lý do `hitl-thay` hoặc
  `hoan-tac:*`, When chạy `do-lam-giau.mjs --write`, Then detail `do3-thay-doi` có `nguoi_sua` bằng số nhãn khác giá trị
  đường sau chuẩn hoá (`seller_phone` theo E.164, `property_type` theo mã) cộng số chủ thể có phát biểu `hitl` ngày D khác
  giá trị đường; `nguoi_sua_de` bằng phần đè ấy; `nhan_da_so` bằng số nhãn đã so; `nguoi_rut` bằng số phát biểu người rút.
  Phát biểu `hitl` cùng giá trị đường, hoặc ghi ngày khác, không vào `nguoi_sua`. Rút với lý do `thay-boi-luot` không vào
  `nguoi_rut`. Đường không có lối người rút ghi `duong_nguoi_rut: false` thay số `nguoi_rut`; đường không có lối ghi đè không
  có khoá `nguoi_sua_de`. Hôm nay cả `so-qua-nguoi-dang` (không có thẻ duyệt) lẫn `quy-uoc-nhom` (người sửa bằng cách ghi đè,
  không rút phát biểu nhóm) đều không có lối người rút (Mạnh chốt 09/11).
- **AC-4** — Given tin S03 có số riêng (không phải số suy) và có Người, When một lượt chạy trong tuần ISO W mà đường
  `so-qua-nguoi-dang` chưa có dòng `do3-kiem-nguoc` của tuần W, Then mỗi tin được suy lại bằng `rutLienLac` + `chonSoNguoi`
  trên bài và tin của Người, trừ chính tin đó, bài sinh ra nó và mọi tin khác của bài ấy (bỏ một ra). Dòng `do3-kiem-nguoc`
  `entity = so-qua-nguoi-dang` của tuần W có `tap_do` (mô tả tập), `n`, `dung`, `sai`, `khong_ra`,
  `ty_le_dung = dung / (dung + sai)`, Wilson 95%, `phu`, cùng `chenh`, `co_y_nghia`, `nguong_phat_hien` so tuần trước. Không
  có lời gọi model. Tuần W đã có dòng thì lượt sau không ghi thêm; lượt lỗi giữa chừng không để lại dòng, và lượt kế trong tuần
  chạy lại.
- **AC-5** — Given bài S03 không phải bài thử có loại hình đọc từ chữ bài, When một lượt chạy trong tuần ISO W mà đường
  `quy-uoc-nhom` chưa có dòng `do3-kiem-nguoc` của tuần W, Then loại hình theo nhóm của mỗi bài được tính lại bằng `loaiHinhNhom` trên các bài cùng nhóm trừ bài đó. Dòng
  `do3-kiem-nguoc` `entity = quy-uoc-nhom` có cùng bộ số như AC-4. Đường đang chạy mà chưa có hàm kiểm ngược ghi `skip` «chưa
  có kiểm ngược».
- **AC-6** — Given số của AC-1..AC-5, When `detail` được ghi, Then mỗi nhóm số có phân rã theo thị trường, phường/xã, dự án, toà
  của tin mang giá trị. Mỗi chiều dưới thị trường có hai ô chưa gắn tách nhau, `khong-tin-hieu` và `chua-co-danh-ba` (tin có
  chữ toà mà chưa có liên kết toà), tối đa 30 ô lớn nhất + `khac`. Tổng các ô của mỗi chiều bằng tổng chung.
- **AC-7** (cross-layer) — Given dòng `do3-*` trong `dq_check_results`, When người vận hành mở `/ops/quality` (máy thu hay
  cloud), Then khối «Làm giàu» hiện mỗi đường một dòng: hôm nay và 7 ngày (thêm, đổi, máy rút, người sửa, người rút), kiểm ngược
  tuần này và tuần trước (tỉ lệ đúng, cận dưới Wilson, n, dấu «chênh có ý nghĩa»). Lát chọn theo `?lat-do=` dùng chung với khối
  «Đo hằng ngày». Khối có trạng thái tải, trống kèm lệnh, lập mốc, chưa chạy, không có đường người rút, chưa kiểm ngược, lỗi
  kèm «Thử lại». Bảng «Kiểm chất lượng» chung không lặp dòng `do3-*`. `app/src/lib/dq-labels.ts` có nhãn cho hai `check_name`
  mới.
- **AC-8** — Given mọi dòng `do3-*` ghi ra, When kiểm `detail`, Then không chứa SĐT, băm SĐT, tên hay tài khoản người đăng,
  chữ bài, `labeler_id`, tên nguồn thật (`source_registry.real_name`, tên miền). Chỉ có số, tỉ lệ, khoá đường, `rule_id`, mã
  S0x, mã khu vực, khoá vật thể. `enrichment_value_state`, `enrichment_value_change` không vào FILL của `sync-cloud.mjs`.
  Bộ chặn rò dùng chung với DO1; có rò thì lệnh dừng, không ghi.
- **AC-9** — Given `scripts/cloud-sync.sh` sau #373, When thêm bước đo, Then bước `do-lam-giau`
  (`node pipeline/do-lam-giau.mjs --write`) đứng ngay sau `do-hang-ngay`. `scripts/job-exit.test.mjs` khớp dãy bước mới. Dòng
  `fail` của DO3 không đổi mã thoát; lỗi chạy (DB, SQL) làm job ≠ 0 với `JOB FAIL [cloud-sync] bước do-lam-giau`.

## Coverage

Quét hình thái (preset entity-feature, thực thể = giá trị làm giàu) ở `design_doc` mục «Bốn đường» và sổ S1. Trục:

| Trục | Giá trị | AC |
|---|---|---|
| Đường | số qua người đăng · quy ước nhóm · diện tích suy ra (chưa chạy) · danh mục CĐT (chưa xuống tin) | AC-1, AC-4, AC-5 |
| Thay đổi | thêm · đổi · máy rút · người sửa (nhãn, ghi đè) · người rút · không đổi · lập mốc | AC-2, AC-3 |
| Kiểm ngược | đúng · sai · không ra · tuần trước · chưa có hàm · lượt sau trong tuần | AC-4, AC-5 |
| Nhịp | lượt 15′ trong ngày · lượt đầu tuần · lần đầu | AC-1, AC-2, AC-4, AC-9 |
| Lát | tổng · thị trường · phường/xã · dự án · toà · `khong-tin-hieu` · `chua-co-danh-ba` · `khac` | AC-6 |
| Mặt | pipeline ghi · `/ops/quality` máy thu · cloud · bước đêm | AC-7, AC-9 |
| Rò rỉ | SĐT · băm SĐT · người đăng · chữ bài · labeler · tên nguồn thật · bảng ảnh chụp lên cloud | AC-8 |

[CE: ngành — kiểm ngược bỏ-một-ra (leave-one-out cross-validation) cho luật suy] · [CE chưa kiểm chứng] Trục «Mặt cloud»
chỉ chứng bằng `dq_check_results` có trong FILL; không chụp trang cloud thật ở vòng này.

## Đường đo

Ngưỡng của `opportunity.md` (Mạnh 08/11):
- SỐNG «số thêm/sửa/rút theo ngày» → dòng `do3-thay-doi` mỗi đường đang chạy mỗi ngày (AC-1, AC-2, AC-3); đếm 14 ngày liền
  bằng `SELECT count(DISTINCT detail::jsonb->>'ngay') FROM dq_check_results WHERE check_name = 'do3-thay-doi' AND entity = <đường>`.
- SỐNG «một lượt kiểm ngược mỗi tuần kèm cận dưới Wilson» → dòng `do3-kiem-nguoc` mỗi tuần ISO, có `wilson.thap` (AC-4, AC-5).
- Timebox hai tuần tính từ ngày bước đêm chạy thật (AC-9 gộp và triển khai).

## Out of scope

- Ghi giá trị cho diện tích suy ra (GC2, GC3), quy ước nhóm có phiên bản (GCQ1, GCQ2), liên kết tin → toà/trục (PL20) — các
  hàng ấy thêm một dòng vào sổ đường khi bắt đầu ghi.
- Lối người duyệt hay rút số qua người đăng.
- Kiểm ngược đường danh mục CĐT ở mức toà (Hỏi-1).
- Chấm đạt/đỏ theo đích (báo cáo ngày làm).
- Độ phủ (C2b), chi phí (PL31), đo định vị và gắn căn (DO2).

## Notes

- Lõi kiểm ngược gọi đúng hàm của bước ghi (`rutLienLac`, `chonSoNguoi`, `loaiHinhNhom`) để đo đúng thứ đang chạy, không
  một bản chép.
- Known limits — chọn ở Cổng Bằng chứng 2026-11-09:
  - Ngoài-1: người vận hành chạy tay lệnh đo với ngày cũ hay thiếu giá trị ngày thì số của hôm nay có thể ghi nhầm vào ngày khác; lượt đêm tự động không dính.
  - Ngoài-2: hai cột mới của bảng đo làm giàu mang tên tiếng Việt (`duong`, `huong`), lệch quy ước tên tiếng Anh; người dùng không thấy gì khác.
  - Ngoài-3: lưới kiểm phần chia số theo khu vực, dự án, toà còn lỏng; một nhóm số mất phần chia sau này có thể không bị bắt ngay.
  - Ngoài-4: phép thử màn Làm giàu dùng dòng kiểm ngược dựng tay cho hai ca, nên khuôn dữ liệu đổi mà màn không theo kịp thì có thể không bị báo.
  - Ngoài-5: trạng thái lỗi «Thử lại» của khối Làm giàu mới được kiểm qua mã nguồn, chưa thử khi dữ liệu tải hỏng thật.
- Chiều dự án, toà (và trục) của lát là **định vị** theo thang bậc mới (Mạnh «Đồng ý đổi» 08/11: B2 «Định vị», B3 «Gắn căn» = nhận diện duy nhất); DO3 không gọi chiều này là «gắn căn» và không dùng bậc B0–B5 làm mẫu số cho số nào.
