# Review findings: do-hieu-qua-hang-ngay (round 2)

Review incomplete: không (mọi finder đều chạy xong).

## Trong hợp đồng

- **Cổng chặn rò của DO1 tự viết lại, không dùng tier-a-guard: thiếu source_ids, thiếu biến thể tên, bỏ qua khi registry rỗng**
  file: `pipeline/do-hang-ngay.mjs:235` · severity: medium · source: conventions · AC: AC-9
  detail: Theo design, dq_check_results đã nằm trong FILL của sync-cloud và leak gate của sync không quét bảng này, nên chanLo/chuoiCam là rào DUY NHẤT trước khi detail do1-* lên cloud. Tuy vậy chuoiCam chỉ lấy `SELECT real_name FROM source_registry` và bỏ tên ngắn hơn 4 ký tự. AGENTS.md luật 6 xếp `source_ids` vào tầng A, và sync-cloud.mjs:678 lấy token từ `real_name UNION source_ids`, nhưng chuoiCam không lấy source_ids. gapChu/chanLo ở lib/do-hang-ngay.mjs:379-395 cũng là bản viết lại. Repo đã có đường dùng chung cho payload JSON lên cloud: `guardValues` + `nameVariants` (lib/tier-a-guard.mjs, lib/mask-source-names.mjs), như push-ops-facts.mjs:195-197 đang làm. Đường đó còn bắt bản viết liền và từ đầu của tên nguồn (ví dụ tên nhiều từ viết liền thành tên miền); chanLo thì không. Ngoài ra push-ops-facts dừng (fail-closed) khi danh sách tên rỗng, còn chuoiCam rỗng phần TEN NGUON thì vẫn ghi. Hệ quả: khoá lát `theo-chu-bai:<project>`, lấy từ chữ bài do model đọc, có thể mang tên nguồn dạng viết liền hoặc source_id mà vẫn đi qua cổng AC-9. Cách sửa: dựng danh sách tên từ real_name ∪ source_ids, gọi guardValues(detail, entries), và ném lỗi khi danh sách rỗng.

- **oThe bỏ qua nhãn «Không suy ra được» của người và lấy nháp máy, nên thẻ người đã soát bị xếp sai ô ở lát Toà và Khu đô thị**
  file: `pipeline/do-hang-ngay.mjs:117` · severity: medium · source: bugs · AC: AC-7
  detail: Hàm `oThe = (t, f) => t.nhan?.[f]?.value ?? t.draft?.cach_doc?.[t.draft?.hien]?.o?.[f] ?? null` được dùng cho KHOA_LAT_THE.du_an, .toa (mới trong vòng này) và .du_an_theo_chu. chuanHoaLuot (app/src/lib/labels-normalize.ts:252-264) bắt người điền mọi ô, hoặc chọn «Không suy ra được». Lựa chọn này lưu thành dòng `{value: null, not_stated: true}`, và docThe đọc đúng dòng đó vào `t.nhan[f]`. Vì vậy với thẻ đã soát (latThe chỉ chạy trên `the.filter(t => t.nhan)`), khi người kết luận bài KHÔNG nêu toà hay dự án, `value` là null, `??` rơi sang nháp máy, và nếu nháp có giá trị (ví dụ 'S8.02') thì thẻ được đếm vào «chua-co-danh-ba» thay cho «khong-tin-hieu». Ở du_an_theo_chu, thẻ còn bị gán vào `theo-chu-bai:<tên máy đọc>`. Đây đúng là cách tách hai ô chưa gắn mà AC-7 cần đo, và nó bị nhãn máy đè lên phán đoán của người một cách lặng lẽ. Cách sửa: chỉ rơi sang nháp khi người chưa gắn ô đó, ví dụ `t.nhan && f in t.nhan ? t.nhan[f].value : <nháp>`.

## Ngoài hợp đồng (Cổng 2 quyết)

- **Ảnh chứng E11-step1.png và E11-step2.png giống hệt nhau từng byte, chụp bài thật chưa che người bán thay vì bài bịa**
  file: `_acceptance/do-hieu-qua-hang-ngay/evidence/E11-step2.png:-` · severity: high · source: conventions
  detail: shasum cho cả hai tệp cùng ra 4f3f3cafa1733dbb7f63ef1f2c3df9f98373a4fb. Vì vậy ảnh 2 không chứng minh điều E11 hứa: thẻ ngày 2025-06-06 mang huy hiệu «Nháp máy · bo-doc-luat». Trong khi đó E11-network.txt ghi step2 là xem=11567, còn ảnh hiện #11543. Ảnh cũng là thẻ của bài THẬT: «#11543 · S03 · Yeshomes.vn · Người đăng: Hồng Vân · ID 1979843494194762056 · đăng 2026-10-31», kèm chữ bài gốc. Nó không phải bài bịa do1dt* mà evals E11 bắt buộc («thẻ rút bằng mau-soat-cuon-chieu thật trên bài bịa»), và cũng không khớp do1-dung-thu.mjs được commit cùng lúc (đã chuyển sang ngày mẫu 2025-06-01/06 «không có bài thật»). Kho đã công khai, và lệ hiện hành (memory 04/11 «ảnh chứng mới vẫn che như lệ», luật 6 chưa sửa) là ảnh chứng mới phải che định danh người bán. Cần chụp lại E11 step1/step2 trên dữ liệu do1dt* của script hiện tại, hai ảnh phải khác nhau.
  đề xuất: known-limits

- **Nhãn lát «Phường/xã» lệch thuật ngữ chuẩn «Phường» của CONTEXT.md**
  file: `app/src/lib/do-hang-ngay.ts:61` · severity: low · source: conventions
  detail: Quy ước của AGENTS.md: chữ UI lấy nhãn từ CONTEXT.md. Mục **Phường** (CONTEXT.md:34) ghi rõ «nhãn chung ghi "Phường"», bao luôn phường/xã/đặc khu. LAT_DO lại dùng «Phường/xã». Ngoài khối DO1 này, app không còn chỗ nào dùng nhãn đó; mục mới «Đo hằng ngày» trong CONTEXT.md chép lại nhãn lệch này, không thêm thuật ngữ riêng. Test visible-strings vẫn xanh chỉ vì «Phường/xã» không nằm trong _Avoid_. Nên dùng «Phường» cho khớp từ vựng chuẩn.
  đề xuất: wont-fix

- **Trạng thái trống «Lát này chưa có số» không có hành động; chỉ bảo người dùng tự chọn «Tổng» bằng chữ**
  file: `app/src/components/ops/quality/do-hang-ngay.tsx:119` · severity: low · source: conventions
  detail: Luật ReUI số 5 (AGENTS.md) và .agents/skills/reui/SKILL.md yêu cầu mỗi vùng dữ liệu có trạng thái trống kèm 1 hành động. Khối Empty của lát trống chỉ có EmptyTitle/EmptyDescription («Chọn «Tổng» hoặc chạy lại bước đo ở máy thu»), không có EmptyContent hay nút. Hành động ở đây rẻ và làm được ngay trên màn: một nút gọi chonLat("tong"). Đó là pattern repo đang dùng với EmptyContent ở review-queue.tsx, people-view.tsx, deal-similar.tsx.
  đề xuất: known-limits

- **DELETE theo ngày đo vẫn giữ vế OR theo giờ chạy: lần chạy hằng ngày xoá lặng lẽ các dòng do1-* của ngày khác đã ghi bù trong cùng ngày**
  file: `pipeline/do-hang-ngay.mjs:223` · severity: low · source: bugs
  detail: Chú thích ghi «xoá theo ngày đo ghi trong detail (không theo giờ chạy)», nhưng điều kiện là `detail::jsonb ->> 'ngay' = $1 OR (checked_at >= $2 AND checked_at < $3)`, với [tu, den] = khoangNgay(ngay). Lệnh `--ngay 2026-11-05 --write` chạy ngày 07/11 ghi các dòng `ngay = 2026-11-05` mang `checked_at = clock_timestamp()` của 07/11. Sau đó lần chạy thường `--write` (ngay = 07/11) khớp vế cửa sổ giờ chạy và xoá mất các dòng của 05/11, không báo gì. Ngược lại, ghi bù ngày X sẽ xoá mọi dòng có checked_at rơi vào cửa sổ ngày X dù detail.ngay là ngày khác. Kết quả là khoá «một dòng mỗi (kiểm, đối tượng, ngày đo)» mà chú thích hứa không được giữ. Cách sửa: chỉ giữ vế cửa sổ cho dòng cũ không mang `ngay` (`detail::jsonb ->> 'ngay' IS NULL AND checked_at …`).
  đề xuất: known-limits

- **Hình dạng 4 (khẳng định âm một mình, không đối chứng dương): «AC-4 qua bộ ghi» chỉ đo bo = 0, mà fixture dựng sao cho bo luôn bằng 0**
  file: `pipeline/scripts/do-hang-ngay.test.mjs:650` · severity: high · source: measurement
  detail: Ở dòng 613-615, nhãn người được suy ngược từ chính nháp: `yd = bo.trang_thai === "co" ? "offer" : "not_listing"`. Vì vậy mọi thẻ gắn «offer» đều có nháp bộ đọc luật «co», và không thẻ nào vừa gắn offer vừa có nháp «khong-tin». Dòng 651-654 assert `[boLuat.n, boLuat.bo]` bằng `[tinRao.length, 0]`, nhưng bo = 0 đúng theo cấu trúc fixture: một boSot không bao giờ đếm bỏ sót, hoặc đọc trang_thai sai khoá, vẫn xanh. n = tinRao.length cũng được tính bằng chính quy tắc đã sinh nhãn, nên vòng tròn. Ca này không có thẻ dương (người gắn offer, máy nói không tin) để chứng minh bộ ghi đếm được bỏ sót, cũng không có chiều đỏ. Lời hứa của E4 «thẻ rút bằng hàm ghi của mau-soat-cuon-chieu … bo-doc-luat n=12 bo=3, doc-gop bo=1 thieu_nhap=2» vẫn chỉ được đo trên fixture viết tay theBoSot() (dòng 113-125). Finding Hình dạng 2 của AC-4 ở vòng 1 vì thế chưa đóng.
  đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): AC-7 dựng đơn vị tay, có building_key mà bộ ghi không bao giờ sinh**
  file: `pipeline/scripts/do-hang-ngay.test.mjs:183` · severity: high · source: measurement
  detail: donViLat() (dòng 183-190) tự viết các đối tượng {market_id, ward_id, building_key, project_key, core.toa_chu} theo khuôn mà KHOA_LAT_DON_VI đọc. Dòng 189 cho một đơn vị `building_key: "bld_X"`, và dòng 209 assert `lat.toa.o.bld_X === 1`. Nhưng donViHienTai của bộ ghi (pipeline/do-hang-ngay.mjs:53) đặt cứng `building_key: null`, nên đầu ra thật không bao giờ có ô toà theo danh bạ. Test đang xác nhận một trạng thái mà writer không tạo ra được. Các assert 30 ô + khac, khong-tin-hieu = 6, toa khong-tin-hieu = 823 và chiều đỏ TONG LAT LECH / GOP HAI O CHUA GAN / THIEU THI TRUONG đều chạy trên các hàng dựng tay này. E7 ghi rõ «kiểm quan hệ trên mọi nhóm của detail thật sinh từ hàm ghi, không trên fixture dựng tay». Đoạn đi qua bộ ghi ở AC-9 (dòng 641-646) chỉ kiểm tổng ô = tong. Lần sửa vòng này đã đổi KHOA_LAT tự viết sang KHOA_LAT_DON_VI, nhưng chưa round-trip từ donViHienTai.
  đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay): trạng thái «đã lập mốc» của AC-8 nay render từ đối tượng dựng tay thay vì dòng skip của bộ ghi**
  file: `app/tests/do-hang-ngay-quality.test.tsx:94` · severity: medium · source: measurement
  detail: Vòng trước, trạng thái lập mốc đến từ lần doHangNgay đầu tiên. Nay dung() chạy doHangNgay hai lần nên dữ liệu thật không còn skip. Dòng 94 thay bằng `ve({ ...data, chuyenBac: { status: "skip", ly_do: "lap-moc", don_vi: 12 } })`, tức một đối tượng viết tay theo khuôn mà DoHangNgay đọc (status, don_vi), bỏ qua đường writer → dq_check_results → loadDo1/gomDo1. Nếu gomDo1 gộp status/detail của dòng skip khác khuôn này (vd status nằm trong detail, hoặc don_vi bị đổi tên), test vẫn xanh. E8 hứa «dòng do1-* rút từ hàm ghi của pipeline, không dựng tay» và «do1-chuyen-bac skip → 'đã lập mốc'».
  đề xuất: known-limits

- **Hình dạng 3 (chuỗi có mặt thay cho quan hệ): «Đổi khoá tách riêng» chỉ kiểm tiêu đề cột, không có số đổi khoá nào đi vào bảng**
  file: `app/tests/do-hang-ngay-quality.test.tsx:91` · severity: medium · source: measurement
  detail: Dòng 91 `assert.ok(bac.includes("Đổi khoá"))` chỉ thấy chữ tiêu đề. BangChuyenBac luôn in tiêu đề này từ hằng HUONG, kể cả khi bảng không có dữ liệu. Fixture của dung() chỉ có một tin S03 tụt bậc, không có cặp đổi khoá, nên theo_nguon.*.doi_khoa = 0 hoặc không có. Quan hệ E8 hứa, rằng số đổi khoá tách khỏi Mất/Mới và nằm đúng cột Đổi khoá, không được đo. Một renderer dồn doi_khoa vào cột Mất vẫn xanh. Phép regex ở dòng 92 chỉ ghim cột Tụt.
  đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): nối «truy vấn ném lỗi → Alert + Thử lại» của trang vẫn chỉ bằng grep page.tsx, regex còn bị nới**
  file: `app/tests/do-hang-ngay-quality.test.tsx:136` · severity: medium · source: measurement
  detail: Dòng 135-136 đọc mã nguồn page.tsx rồi `assert.match(trang, /<RegionError what="số đo hằng ngày">/)`. Vòng này regex bỏ phần `<Suspense fallback={<DoHangNgaySkeleton />}>`, nên nay chỉ cần chuỗi đó có ở đâu đó trong tệp, không cần nó bọc khối DO1. Phần render thật veLoi() (dòng 141-164) dựng `<RegionError><Hong /></RegionError>` với một component ném lỗi đồng bộ do test tự viết, không phải khối DoHangNgay/loadDo1 của trang. Vì vậy test chỉ chứng minh RegionError chung hiện Alert, còn việc trang /ops/quality bọc đúng khối DO1 và lỗi của loadDo1 tới được vùng đó vẫn chỉ đo trên chữ mã nguồn.
  đề xuất: known-limits

- **Hình dạng 2 (không round-trip trọn): DO1-RT vẫn dùng giaTriGui chép tay thay cho đường gửi thật của LabelFormNhom**
  file: `app/tests/do-hang-ngay-labels.test.tsx:131` · severity: medium · source: measurement
  detail: Vòng này DO1-RT đã đi qua ghiNhan và docThe/giuNhap thật. Nhưng giá trị gửi vẫn do giaTriGui() (dòng 67-79) dựng, có chú thích «như hàm luu của LabelFormNhom». Đây là bản chép tay logic gửi (basis 'kien_thuc_nghe', unit = donVi, ép multi_unit 'no', ô unknown → not_stated) chứ không phải hàm luu/guiNhan thật (label-form-nhom.tsx:99). Nếu biểu mẫu thật gửi khác bản chép (vd đơn vị giá, ô trống, basis), lệch giữa đường người lưu thật và bộ đo giữ nháp sẽ không lộ ra. Chiều đỏ dòng 155-159 cũng không đột biến đường chuẩn hoá: nó UPDATE thẳng eval_labels thành '3,4' rồi thấy kiem đỏ. Như vậy chỉ chứng minh kiem phát hiện được giá trị lệch, không chứng minh bỏ chuẩn hoá hay dung sai (giuO có sẵn dotBien 'bo-dung-sai' nhưng không dùng) làm test đỏ.
  đề xuất: known-limits

