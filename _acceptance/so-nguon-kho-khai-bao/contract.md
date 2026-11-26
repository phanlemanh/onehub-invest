---
schema_version: 1
feature: "Sổ nguồn khai họ nguồn, nhịp, tổng thể, bảng nạp; độ tươi đọc nhịp từ sổ và đo nguồn kho qua bảng nạp — S16 thôi «chưa khai SLO», S09 hiện, S01 chỉ đo thị trường có lịch, S11 về tạm dừng, sổ có dòng S09 và S17"
slug: so-nguon-kho-khai-bao
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli, ui]
status: signed-off
design_doc: docs/superpowers/specs/2026-11-21-so-nguon-kho-khai-bao-design.md
approved_by: Mạnh
approved_at: 2026-11-21
---

# Acceptance Contract: so-nguon-kho-khai-bao

## Context

Hàng NK1 (lát A của ROADMAP §3 mục 58; Mạnh «Theo khuyến nghị» 02:27Z 20/11 cho bốn câu khung; Cổng Đáng «làm» 21/11). Đếm 21/11
trên DB máy thu (chỉ đọc, `phu-ca.md`): sổ nguồn 15 dòng, không có S09, S17, không có cột họ, nhịp, tổng thể, bảng nạp; nhịp là hằng
`SLO_HOURS` chép ở `scripts/lib/freshness.mjs` và `app/src/lib/freshness.ts`. CLI hôm nay đỏ ở S16 «chưa khai SLO», S01/hcmc
(305+ giờ), S01/vn (670+ giờ), S11 «chưa có dữ liệu»; S09 (345 dòng `stg_s09_item`, snapshot 13/11) vô hình. Migration **122**.
`source_registry` không đồng bộ cloud → không DDL cloud.

## Criteria

- AC-1 (khai báo): Given DB của lượt đã áp tới 122, When đọc `source_registry` và áp lại tệp 122 lần nữa, Then có năm cột
  `family` (CHECK `flow`|`stock`), `cadence_hours` (CHECK > 0), `universe` (jsonb, mặc định `{}`), `stg_tables` (text[], mặc định `{}`),
  `measured_markets` (text[]); mọi dòng có `family`; `cadence_hours` của S01, S02, S03, S05, S06, S08, S10, S11 bằng đúng hằng trước
  hàng (192, 840, 72, 96, 36, 192, 192, 192); S16 192 với năm bảng `stg_s16_*`; S09 `active` với `{stg_s09_item}`; S17 `draft`; S01
  `measured_markets {hanoi}`; S11 `paused` có `reason`; lần áp thứ hai không đổi một ô nào (kể cả `match_whole`).
- AC-2 (một nguồn nhịp): Given sổ ở AC-1, When chạy CLI `check-freshness --json` và `readFreshness` của app trên cùng lược đồ cấy dữ
  liệu, Then hai bản không còn hằng nhịp trong mã, đọc nhịp từ `cadence_hours`, ra từng hàng bằng bảng mong đợi viết trước cho S01
  hanoi, S02, S03, S06, S08, S10; S05 và S11 (paused) không có hàng, đổi sang active thì có hàng; sửa `cadence_hours` của một mã thì cả CLI lẫn app đổi theo; sổ thiếu cột thì cả hai ném lỗi gọi
  tên migration 122, không rơi về số cũ.
- AC-3 (nguồn kho đo qua bảng nạp): Given S16 có snapshot với `source` ngoài `source_ids` và dòng ở `stg_s16_can_chi_tiet`, S09 có dòng
  `stg_s09_item`, When chạy CLI, Then không còn «S16: nguồn active chưa khai SLO»; tuổi S16, S09 bằng max `collected_at` của snapshot có
  dòng ở một bảng trong `stg_tables` của chính mã; snapshot chỉ có dòng ở bảng ngoài `stg_tables` không được tính; tên bảng sai khuôn
  hoặc không có thật cho hàng «chưa có dữ liệu» kèm lý do, không chạy câu SQL nào mang tên đó.
- AC-4 (thị trường có lịch): Given S01 có snapshot ở hanoi, hcmc, vn và `measured_markets {hanoi}`, When chạy CLI và app, Then S01 chỉ có
  hàng hanoi; mã có `measured_markets` NULL vẫn ra mọi thành phố có dữ liệu như trước.
- AC-5 (tạm dừng, trang Thu thập): Given sổ ở AC-1, When chạy CLI và dựng trọn bảng «Sức khoẻ nguồn» của `/ops/collections` trên lược đồ
  cấy, Then S11 không còn hàng «chưa có dữ liệu»; bảng có hàng S09 với tuổi từ `stg_s09_item`, không có hàng S01/hcmc, S01/vn, không có
  «chưa khai SLO» của S16.
- AC-6 (tầng A): Given nhánh so với merge-base `origin/main`, When quét mọi tệp đổi bằng danh sách tên thật S09, S17 đọc từ tệp cục
  bộ của máy thu cùng các biến thể gập (chữ thường, bỏ đuôi miền, bỏ khoảng trắng và gạch), kể cả tệp trong hồ sơ này, Then 0 chỗ trúng; dòng S09, S17 trong migration có `real_name` NULL và `source_ids '{}'`; cấy một tên vào bản chép
  tạm của migration thì bộ quét đỏ và chỉ in mã nguồn, số chỗ, không in tên.
- AC-7 (DB máy thu, số trên màn): Given 122 áp lên DB máy thu theo `ap-may-thu.md` và tên thật S09, S17 đã điền trên máy, When chạy
  `node scripts/check-freshness.mjs` và hàm `readFreshness` của app (bản ở checkout chính — hàm trang Thu thập đọc), Then hết «S16
  chưa khai SLO», hết hàng S01/hcmc, S01/vn, hết «S11 chưa có dữ liệu», có hàng S09, và app ra cùng từng hàng với CLI; danh sách
  tên mà bộ soát tầng A của `push-ops-facts` đọc có mục cho S09 và S17 (chỉ in số mục).
- AC-8 (phạm vi): Given nhánh so với merge-base `origin/main`, When liệt kê tệp đổi, Then chỉ trong vùng của hàng (migration 122, hai
  bản độ tươi và CLI, các test độ tươi đã khai ở vùng, hồ sơ này, `_acceptance/config.yaml`, thiết kế, kế hoạch, tệp máy sinh).

## Coverage

Bảng phủ ca `_acceptance/so-nguon-kho-khai-bao/phu-ca.md` (đếm trên DB máy thu 21/11, chỉ đọc): mã nguồn S01–S17 × sáu trục
{khai báo · nhịp · cách đo · thị trường đo · trạng thái · tầng A}, mỗi ô có số đếm, đích sau hàng và cột «ai đọc phía sau». Ô nằm
ngoài phạm vi ghi «ngoài phạm vi, vì …» ngay trong bảng. Không chạy quét hình thái riêng: bảng phủ ca đã là ma trận trục × giá trị
(dòng sổ `descope` «bỏ coverage-scan»).

## Đường đo

- «hết S16 chưa khai SLO / hết S01 hcmc, vn / hết S11 chưa có dữ liệu / có hàng S09» — số từ `node scripts/check-freshness.mjs --json`
  trên DB máy thu sau áp; AC-7 bảo đảm, AC-3, AC-4, AC-5 chứng trên lược đồ cấy trước gộp.
- «sổ có dòng S09, S17 với tên thật điền trên máy; bộ soát tầng A nhận cả hai» — số mục của `docSourceNameEntries` cho S09, S17; AC-7.
- «app và CLI đọc cùng một nhịp từ sổ» — AC-2.

## Out of scope

- Nạp S07, S10, S11, gói 2 S09, plist launchd mới — làn thu.
- Ghi số `universe` — để `{}` tới khi có số nguồn tự công bố kèm mốc và nơi lấy (Mạnh câu 3).
- Thước vận hành, biến động, co rút, xanh giả S02 — NK2; phễu, phủ — NK3; chất lượng kho — NK4.
- Lịch thu hcmc cho S01 — làn thu nếu cần; hàng này chỉ thôi đo thị trường không có lịch.
- Dọn chỗ trúng tên S09, S17 trên phần cây ngoài nhánh này — bộ quét đếm và báo giám sát, cắt hàng riêng.

## Notes

- `cadence_hours` 192 của S16, S09 là số giữ chỗ theo khuôn S08, không phải ngưỡng đã ký; đổi khi làn thu khai lịch plist.
- Áp: `ap-may-thu.md` đủ năm thứ (lệnh áp, số chạy thử trên bản chép, sao lưu bảng, lùi bằng `lui-122.sql` + khôi phục, lệnh kiểm).
  Thứ tự áp: gộp PR → áp 122 lên DB máy thu từ bản `origin/main` khi checkout chính CHƯA kéo (122 chỉ thêm cột và dòng, mã cũ vẫn
  chạy) → điền S09, S17 → kéo main. Mã mới ném lỗi khi sổ chưa có cột (AC-2), nên không kéo trước khi áp. Lùi: lùi mã trước (revert
  + kéo), DB sau. Cloud không gọi `readFreshness` (không có `source_registry`; đọc khối `freshness` đẩy lên), nên không có lỗi phía cloud.
- Hai tệp `tam/s09-mien.txt`, `tam/s17-mien.txt` (ZCode ghi, LL kiểm) dùng đúng một lần lúc điền rồi xoá; không in, không commit.
- Ngoài-1 (máy định tuyến 2026-11-21, đề xuất S4 known-limits): Nếu người vận hành tự bật lại một nguồn đã tạm dừng hoặc cố ý bỏ trống nhịp rồi áp lại bản cập nhật sổ nguồn, các lựa chọn đó bị đặt lại về giá trị ban đầu. Hiện chỉ có lượt áp hai lần liền nhau theo hồ sơ nên chưa ai gặp. — `db/migrations/122_source_registry_family_cadence.sql`
- Ngoài-3 (máy định tuyến 2026-11-21, đề xuất S4 known-limits): Trong khoảng sau khi áp bản cập nhật mà chưa điền tên thật cho hai nguồn mới, trang danh sách nguồn có thể hiện ô tên trống không có nhãn giải thích. — `app/src/components/ops/sources/registry-table.tsx`
- Ngoài-5 (máy định tuyến 2026-11-21, đề xuất S4 known-limits): Nếu người vận hành cố ý tắt đo một nguồn bằng cách để trống rồi áp lại bản cập nhật, nguồn đó sẽ được đo lại như cũ. — `db/migrations/122_source_registry_family_cadence.sql`
- Ngoài-6 (máy định tuyến 2026-11-21, đề xuất S4 known-limits): Bài kiểm tự động cho các ô phủ thị trường có thể vẫn xanh dù bộ đọc trả về rỗng, nên chưa chứng minh chắc việc ẩn S01 hcmc và S11 trên màn. — `app/tests/slo-mot-nguon.test.tsx`
- Ngoài-7 (máy định tuyến 2026-11-21, đề xuất S4 known-limits): Bài kiểm chỉ bảo đảm S11 không hiện «Chưa có dữ liệu», chưa chứng minh nó hiện đúng nhãn «Ngừng» trên màn. — `app/tests/slo-mot-nguon.test.tsx`
- Ngoài-8 (máy định tuyến 2026-11-21, đề xuất S4 known-limits): Bài kiểm bảng Sức khoẻ nguồn chỉ thấy mã S09, S16 có mặt đâu đó trong trang, chưa chắc hàng S16 không mang nhãn «Chưa khai SLO». — `app/tests/slo-mot-nguon.test.tsx`
- Ngoài-9 (máy định tuyến 2026-11-21, đề xuất S4 known-limits): Bài kiểm có thể xanh dù bản chép dữ liệu thiếu một vài nguồn, khi đó nhịp và thị trường đo của nguồn thiếu không được kiểm. — `scripts/so-nguon-kho.test.mjs`
- Ngoài-10 (máy định tuyến 2026-11-21, đề xuất S4 known-limits): Phép tự kiểm của bộ soát tên nguồn thật luôn xanh theo cách dựng, nên chưa chứng minh được nó bắt các cách viết tên khác nhau như hoa thường, khoảng trắng, tên miền đầy đủ. — `_acceptance/so-nguon-kho-khai-bao/probes/tang-a.mjs`
- Known limits — chọn ở Cổng Bằng chứng 2026-11-22:
  - Ngoài-1: Áp lại bản cập nhật sổ nguồn sẽ đặt lại về giá trị ban đầu nguồn mà người vận hành tự bật lại sau tạm dừng, hay ô nhịp cố ý bỏ trống.
  - Ngoài-3: Khoảng sau áp mà chưa điền tên thật, trang danh sách nguồn có thể hiện ô tên trống không có nhãn giải thích.
  - Ngoài-5: Nguồn mà người vận hành cố ý tắt đo bằng cách để trống sẽ được đo lại khi áp lại bản cập nhật.
  - Ngoài-6: Bài kiểm các ô phủ thị trường có thể xanh dù bộ đọc trả rỗng, nên chưa chứng chắc việc ẩn S01 hcmc và S11 trên màn.
  - Ngoài-7: Bài kiểm chỉ bảo đảm S11 không hiện «Chưa có dữ liệu», chưa chứng nó hiện đúng nhãn «Ngừng».
  - Ngoài-8: Bài kiểm bảng Sức khoẻ nguồn chỉ thấy mã S09, S16 có mặt trong trang, chưa chắc hàng S16 không mang nhãn «Chưa khai SLO».
  - Ngoài-9: Bài kiểm có thể xanh dù bản chép thiếu vài nguồn; khi đó nhịp và thị trường đo của nguồn thiếu không được kiểm.
  - Ngoài-10: Phép tự kiểm của bộ soát tên nguồn thật chưa chứng nó bắt các cách viết khác nhau của cùng một tên.
