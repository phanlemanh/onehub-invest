# Suite pipeline của lượt chấm chạy trên cụm dùng một lần, ca dữ liệu thật tách riêng — thiết kế (HT9 `db-thu-tach-khoi-cum-that`)

Ngày 2026-11-25 · dãy U1 · hạng T2 · hồ sơ `_acceptance/db-thu-tach-khoi-cum-that/`

## Vấn đề (số đo 25/11, đo lại — không chép số GS)

- **Khe s4 là nút cổ chai của đợt.** Trung vị phút giữ khoá s4 trên Mac mini là **99′** (15 lượt cấp từ 23/11 12Z tới 25/11
  03Z, tính từ lần cấp này tới lần cấp hay thu hồi kế trong `su-kien.jsonl` của đợt — nhật ký không ghi lần nhả nên đây là cận
  trên của phút giữ, sát phút giữ khi hàng chờ không rỗng; p75 174′). GS ước ~70′: số thật cao hơn.
- **Hai nửa suite pipeline ăn 69′ của một lượt chấm T2 một tệp.** Lượt r1 của HT12 (24/11, chỉ đổi `scripts/`): pipeline_a
  46′ (437 ca), pipeline_b 23′ (729 ca), chạy nối nhau. Vùng kích hiện tại kéo cả hai nửa chỉ vì `LO-TRINH.html` đổi.
- **14 ca chiếm 84% thời gian** (3.425 s trên 4.076 s): SLT-DC đối chiếu DB máy thu 478 s; test-posts AC-2/4/5/6/8/9
  424 + 298 + 285 + 258 + 329 + 129 s; DO1-AC-6 721 s; DO3-AC-2/3/4/6 + DO1-AC-9 ~383 s; TRG-AC-2 105 s; MCS-AC-5 72 s. Chúng
  chậm vì chạy trên bản chép 3,7 GB dữ liệu thật.
- **CI chạy cùng bộ pipeline trên DB trống dựng từ migration trong 9′** (job pipeline của run main 24/11 23:55Z, gồm cài phụ
  thuộc), bỏ đúng 30 ca của `scripts/ci-bo-qua.json` (ca cần dữ liệu thật). M5 đo `ci-test-local` pipeline 353 s.
- **Cụm thật đang mang ~23 GB DB thử** (25/11 03:5xZ): hai bản `oneinvest_suite_pipeline_a_<pid>` 4,1 GB mỗi bản, bản mẫu
  `oneinvest_suite_mau` 3,7 GB, cùng các DB thử của dãy. `scripts/db-sao-luu.sh` sao lưu MỌI DB trừ `oneinvest`, nên bản sao
  lưu chép theo cả DB thử của suite.
- Tên DB suite ĐÃ theo lượt (`<bộ>_<pid>`, hồ sơ test-suite-db-thu) — hai lượt không đụng tên; điểm (2) của GS đã có, cái
  chặn chấm song song là khoá s4 của đợt (gói `dieu-phoi`), không phải tên DB.

## Hướng đã cân (GS 25/11: a, b, c, d)

| Hướng | Số đo / lý do | Chọn |
|---|---|---|
| (a) tách suite chuẩn-CI chạy DB trống khỏi ca dữ liệu thật | ca ngoài `ci-bo-qua` chạy trên DB trống nhanh (CI 9′ cả cài đặt); 30 ca dữ liệu thật giữ trên bản chép | **có** |
| (b) thu hẹp vùng kích theo tệp suite thật đọc | áp cho bộ ca dữ liệu thật (đắt ~30′): chỉ chạy khi nhánh đổi tệp chúng nạp/chạy; bộ chuẩn-CI rẻ nên giữ vùng cũ | **có, cho ca dữ liệu thật** |
| (c) tên DB theo lượt | đã có từ test-suite-db-thu (đuôi pid) | không làm — đã có |
| (d) dùng lại kết quả suite cho hai hồ sơ cùng commit | là việc của kit (carry suite), không sửa bản chép kit trong kho | đề xuất gửi kit, ghi `de-xuat-kit.md` |

## Hình dạng

1. **`db/db-thu.sh --chay-trong <lệnh…>`** — cụm PostGIS DÙNG MỘT LẦN cho lượt: một container riêng (ảnh như job pipeline của
   `ci-test.yml`, tên và cổng theo pid), dựng DB trống từ migration bằng `scripts/ci-db-init.mjs`, chạy lệnh với `CI=true`
   và `NODE_OPTIONS` của `scripts/lib/ci-can-du-lieu.mjs` (bỏ đúng ca của `ci-bo-qua.json`), xoá container khi lệnh dừng,
   kể cả khi bị TERM/INT. Không tạo DB nào trong cụm thật. Dùng lại cách `scripts/ci-test-local.mjs` dựng PostGIS dùng một
   lần (tiền lệ AU11), nhưng chạy trên worktree hiện có (không clone, không `npm ci`).
2. **`pipeline_a` / `pipeline_b` của lượt chấm** đổi `db-thu.sh … --chay` thành `--chay-trong` (lệnh `test:a`, `test:b` của
   pipeline). Vùng kích giữ nguyên (bộ rẻ).
3. **Suite mới `pipeline_that`** — chạy ĐÚNG 30 ca pipeline của `ci-bo-qua.json` trên bản chép (`db-thu.sh --chay` như
   nay), không ca nào khác. Vùng kích hẹp = tệp test của các ca + tệp chúng nạp/chạy (đồ thị import tĩnh + tệp SQL/mjs chúng
   chạy), có test canh phủ như bảng vùng hiện có (S4V-AC-5).
4. **`scripts/db-sao-luu.sh`** bỏ DB thử của suite (`oneinvest_suite_*`, gồm bản mẫu) khỏi bản sao lưu, ghi tên DB bỏ vào
   manifest; DB khác giữ như cũ.
5. **`scripts/do-phut-s4.mjs`** — lệnh đo đích: trung vị và p75 phút giữ khoá s4 từ `su-kien.jsonl` của đợt (lần cấp → lần
   cấp kế, có cửa sổ thời gian).
6. **`_acceptance/config.yaml`**: thêm `executors.suite.pipeline_that` vào `feature_loop.suite_keys`, lệnh `test:a`/`test:b`
   trỏ cụm dùng một lần. Đây là đổi cổng nghiệm thu → câu hỏi ở Cổng Phạm vi.

## Lựa chọn trong vòng

- **Cụm dùng một lần mỗi lượt, không cụm thường trực.** Cụm thường trực (container `one-invest-db-thu` thứ hai giữ bản mẫu)
  mới gánh được bản chép dữ liệu thật ra khỏi cụm thật, nhưng là dịch vụ nền mới của máy — cần lời riêng của Mạnh. Tách
  thành hàng sau (HT24); vòng này gánh phần có số đo lớn nhất.
- **Ca dữ liệu thật vẫn chép trong cụm thật**, nhưng chỉ khi nhánh đổi tệp chúng đọc — đa số lượt chấm một tệp không chạm.
- **Bộ chuẩn-CI giữ vùng kích cũ** (LOI_PIPELINE): rẻ, và thu vùng cho bộ rẻ không đổi đáng kể phút giữ khoá.
- Bỏ bản chép dữ liệu thật cho bộ chuẩn-CI là câu hỏi cho Mạnh (Hỏi-1), không phải lựa chọn máy đã có căn cứ. Liên quan:
  hồ sơ danh-ba-s16 (18/11) ghi bản chép chưa áp migration của hàng nên không lộ lỗi view — DB dựng từ migration bắt được lớp lỗi đó.

## Rủi ro đã biết (đưa ra Cổng Phạm vi)

- Ca KHÔNG có trong `ci-bo-qua.json` mà chỉ lộ lỗi trên dữ liệu thật (AC-2 transform S03, DO1-AC-6, DO3-*, TRG-AC-2,
  MCS-AC-5 — hôm nay chạy trên bản chép ở lượt chấm) sẽ thôi chạy trên dữ liệu thật ở lượt chấm. CI hôm nay cũng chỉ chạy
  chúng trên DB trống. Ca nào cần dữ liệu thật thật sự thì thêm vào `ci-bo-qua.json` (có lý do), lúc ấy nó vào `pipeline_that`.

## Bỏ đặc tả UX

Không chạm giao diện (surface cli).
