---
schema_version: 1
feature: Bản chép DB đã lọc cho máy phát triển M5 — chỉ tập dữ liệu Invest và API công khai đọc, không tầng A, có bộ soát trên DB đích
slug: ban-chep-da-loc-cho-may-phat-trien
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-25T06:17:17Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-25-ban-chep-da-loc-cho-may-phat-trien-design.md
---

# Acceptance Contract: ban-chep-da-loc-cho-may-phat-trien

## Context

Máy M5 chỉ chạy API công khai và cổng Invest, không được giữ tầng A (AGENTS.md luật 6). Để chạy ca dữ liệu thật trên M5 cần một
bản DB đã lọc. Bảng phủ ở design doc §1 (đếm trên DB máy thu 25/11): tập M5 đọc trùng tập cloud của `pipeline/sync-cloud.mjs`,
cộng ba chỗ phải quyết (hồ sơ user app, `source_registry`, `stg_zalo_posts`). Hàng dựng một lệnh chép theo đúng bộ lọc của
sync-cloud vào DB đích trên máy thu, soát tầng A trên chính DB đích, rồi xuất một tệp dump. Không chuyển tệp sang M5 (Hỏi-1).
Căn cứ: GS giao HT18 ngày 24/11.

## Criteria

- AC-1: Given DB máy thu, When chạy lệnh chép, Then DB đích có dòng ở đúng các bảng FILL của sync-cloud (cùng số dòng mà câu đọc
  của sync-cloud trả, bảng con chỉ dòng có cha sống), `airdna_*` mang tên `ref_calib_*`; ngoài FILL chỉ `source_registry` (AC-5) và
  bảng của extension PostGIS (`spatial_ref_sys`) được có dòng, mọi bảng `public` khác 0 dòng; extension PostGIS có trên đích.
- AC-2: Given bảng người bán, When chép, Then cột lên đích đúng bằng cột sync-cloud gửi (CLOUD_ALLOW trừ PII_EXCLUDE, SOURCE_EXCLUDE),
  `seller_ref` dạng `<S0x>:<số>`, tên/SĐT mang tên nguồn về NULL; cột local mới chưa duyệt không lên đích. Mọi giá trị chữ/json
  khác mang tên nguồn được che trước bộ soát: chữ tự do thay tên bằng mã S0x (cùng lõi che của app), phần tử URL trúng bị bỏ khỏi
  mảng, khoá json trúng đổi thành mã; số ô che theo bảng.cột ghi vào `ke.json` và bằng số ô bộ quét thô trúng trước khi che.
- AC-3: Given token tên nguồn thật đọc từ `source_registry` máy thu, When bộ soát đọc lại DB đích, Then 0 chỗ chứa token ở cả dữ
  liệu (ô text, json, mảng text) lẫn lược đồ (thân hàm, định nghĩa view, COMMENT, DEFAULT, CHECK, nhãn enum, tên ràng buộc, tên
  chỉ mục; định danh lược đồ có sẵn — tên bảng, tên cột — không tính); cấy tên nguồn thật vào từng chỗ ấy thì lệnh thoát 1, nêu chỗ, không in giá trị, xoá DB đích, không ghi dump; từ điển
  chặn không xuất hiện trong mọi dòng lệnh in ra.
- AC-4: Given bảng cấm (hồ sơ user app: `users`, `sessions`, `machine_tokens`, `user_events`, `user_profile`, `saved_markets`; mọi
  `stg_*`; `airbnb_snapshots`; `review_queue`), When soát, Then 0 dòng; cấy một dòng vào `sessions`, `stg_s08_inventory` (hay bảng
  `stg_*` có ở đích) thì thoát 1 nêu bảng.
- AC-5: Given `source_registry` đích, When soát, Then chỉ còn mã S0x và vai trò, mọi cột khác (tên, miền, `real_name`,
  `source_ids`) NULL; cấy một `real_name` thì thoát 1.
- AC-6: Given cột tên khớp ngày sinh/giới tính (`dob|birth|gender|ngay_sinh|gioi_tinh`) hoặc khoá JSON khớp, When soát, Then không
  giá trị khác NULL; cấy một cột `seller_dob` có giá trị và một khoá `gender` trong json thì thoát 1. Schema ngoài `public` (trừ
  PostGIS) có ở đích thì thoát 1.
- AC-7: Given lệnh chạy, When đọc DB máy thu, Then chỉ trong giao dịch READ ONLY; vân tay số dòng và lược đồ của DB nguồn trước và
  sau như nhau; lệnh từ chối đích là `oneinvest` hay tên không dạng `oneinvest_m5_*`.
- AC-8: Given bản chép xanh, When `--kiem <dump>`, Then khôi phục vào DB tạm, bộ soát xanh, số dòng từng bảng bằng `ke.json`, sha256
  khớp; tệp dump bị sửa thì đỏ nêu «sha256»; dump hợp lệ mà `ke.json` lệch một dòng ở một bảng thì đỏ nêu đúng bảng; DB tạm bị xoá
  cả khi đỏ; `--kiem <dump> --khong-tu-dien` (để chạy trên M5) soát sha256, số dòng, bảng cấm, ngày sinh/giới tính mà không cần từ
  điển tên nguồn.
- AC-10: Given đã có một DB `oneinvest_m5_*`, When chép bản mới, Then bản cũ bị xoá (trần một bản sống); lệnh lỗi giữa chừng thì
  không còn DB đích; `--don` xoá mọi `oneinvest_m5_*`; thư mục `state/ban-chep-m5/` bị git bỏ qua và nằm ngoài nguồn của sao lưu
  ra ngoài máy.
- AC-11: Given tệp kê (`ke.json`) và mọi tệp nằm cạnh dump, When ghi, Then không tệp nào mang tên nguồn thật: khoá theo tên bảng
  đã đổi, không cặp đổi tên, chữ của tệp qua bộ soát trước khi ghi; cấy tên nguồn vào một mục tệp kê thì lượt chép đỏ trước khi ghi,
  không tệp nào được ghi (GS 26/11 mở phạm vi, lý do tầng A).
- AC-9: Given bản chép từ DB máy thu thật, When chạy data-api và app (`RENAME_REFCALIB=1`) trỏ vào nó, Then `/v1/listings` của
  data-api và trang Invest khu Hà Nội trả dữ liệu (số dòng > 0, HTTP 200); in cỡ dump, số bảng có dòng, thời gian.

## Coverage

- Bảng: tập FILL → AC-1; bảng cấm → AC-4; còn lại → AC-1 (0 dòng); `source_registry` → AC-5; schema lạ → AC-6
- Cột: cho phép, loại, che → AC-2
- Tầng A: tên nguồn trong giá trị và lược đồ → AC-3; trong tệp kê đi kèm dump → AC-11; hồ sơ user app, định danh tài khoản thu, phiên/khoá → AC-4; ngày sinh/giới tính → AC-6
- Chiều: xanh trên dữ liệu thật → AC-9 (data-api bằng lệnh, trang Invest bằng mắt trên bản chạy thử); cấy đỏ → AC-3, AC-4, AC-5, AC-6; dump hỏng → AC-8
- Nguồn: DB máy thu chỉ đọc → AC-7
- Rác và lối rời máy: DB tạm, thư mục đầu ra ngoài git và sao lưu → AC-10

## Out of scope

- Chuyển bản chép sang M5: hàng HT25 `day-ban-chep-sang-may-phat-trien` (T3, sau HT18); hàng này chỉ để tệp ở `state/ban-chep-m5/`.
- Ops trên M5, tài khoản user thật trên M5: ngoài phạm vi, vì M5 chỉ chạy API + Invest.
- Đổi bộ lọc của sync-cloud: hàng chỉ dùng lại, không sửa `pipeline/sync-cloud.mjs`.
- Lịch chép tự động (launchd): chưa; chạy tay khi cần.
- Route data-api đọc bảng S02 (`/v1/markets`, `/v1/coverage`): không chạy trên bản chép, vì bảng S02 lên bản chép dưới tên trung tính
  `ref_calib_*` như cloud mà data-api chưa có bộ đổi tên; ngoài phạm vi, vì số S02 không thuộc Invest và API công khai (luật 5).

## Notes

- DB đích không ép toàn vẹn ở bốn khoá ngoại trỏ sang bảng gốc 0 dòng (tên ghi trong `ke.json` mục khoá ngoại đã bỏ).

- Phạm vi tệp: `scripts/ban-chep-da-loc*` (mã, test) và chín khoá lệnh kiểm `bcl_*` trong `_acceptance/config.yaml` (GS 25/11:
  khoá executor là đường T3, khai trong phạm vi). Không sửa `pipeline/sync-cloud.mjs`.
- GS phán 25/11 ba câu cách làm (sổ quyết định): danh sách nguồn chỉ mã; không chép mọi `stg_*`; lược đồ đổ từ DB máy thu kèm
  soát DDL.

- Đầu ra ở `state/` (gitignored). Không ghi cloud. DB máy thu chỉ đọc.
