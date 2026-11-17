# Review findings: nap-s16-vao-danh-ba (round 1)

## Trong hợp đồng

- **Bộ soát S16 trong sync-cloud sẽ chặn trọn mỗi lượt đồng bộ vì trùng mã căn có thật trong tin rao công khai**
  AC: AC-9
  file: `pipeline/sync-cloud.mjs:735`
  severity: high
  source: conventions
  detail: syncOnce gọi soatDuLieu(data, await tokenS16(local)) trên mọi bảng FILL. Gặp một token là ném PhaseError('scan'), nên không dòng nào được đẩy lên cloud. tokenS16 (pipeline/lib/s16-soat.mjs) lấy mọi ma_can, toa_id, khu_id từ 4 ký tự trở lên trong stg_s16_*. Đã đo: dựng tập token từ ba bản thu S16 thật (98.414 token) rồi so với DB local theo đúng luật tách TACH. Có 43 dòng sale_offers trúng, nằm ở field_provenance (40) và block_raw (3). Đây là mã căn do người bán tự ghi trong tin rao, là dữ liệu tầng C và đã lên cloud từ trước, không phải giá trị lấy bằng phiên đăng nhập S16. Mã căn của S08 cũng đã được chốt là công khai (ROADMAP §3 mục 38). Vì vậy khi 103 được áp và nạp S16 trên máy thu, sync-cloud sẽ dừng ở pha scan ngay lượt đầu và cloud ngừng cập nhật. Bộ soát phải bỏ qua những token cũng có trong nguồn công khai (S08, tin rao), hoặc chỉ soát những cột có thể mang giá trị S16 như evidence của thẻ và bảng vật thể. Soát mọi giá trị của sale_offers thì sẽ trúng nhầm.
  rationale: AC-9 đòi payload sạch thì bộ soát xanh; finding cho thấy bộ soát đỏ nhầm trên dữ liệu công khai thật.

- **Phép đo E10 «sync chạy thử: 0 token S16» xanh vì không có dữ liệu để soát**
  AC: AC-10
  file: `pipeline/scripts/danh-ba-s16-that.mjs:203`
  severity: medium
  source: conventions
  detail: DB thử của E10 chỉ chép asset_nodes, airbnb_snapshots, s08_*, buildings, stacks, units, registry_aliases từ máy thu. Các bảng FILL khác (sale_offers, properties, listings…) đều rỗng. Vòng lặp `for (const t of FILL)` vì thế gần như chỉ soát asset_nodes, nên dòng «0 token S16 trong mọi bảng sẽ đẩy» của AC-9/AC-10 (contract.md dòng 136) không chứng minh được điều nó ghi. Phép đo này cũng không bắt được lỗi chặn nhầm ở finding trên, mà lỗi đó có thật: 43 dòng sale_offers trên DB local trúng token. Cần chép thêm các bảng FILL (hoặc đọc chỉ-đọc thẳng từ máy thu) thì E10 mới làm đúng việc của nó là thước đo.
  rationale: AC-10 đòi sync-cloud chạy thử cho 0 token S16 trong mọi bảng sẽ đẩy; phép đo hiện không chứng minh được điều đó.

- **Bộ nạp ghi NULL vào cột stg_s16_can.toa_ten là NOT NULL (và thuộc khoá chính), nên cả lượt nạp hỏng**
  AC: AC-1
  file: `pipeline/lib/s16-danh-muc.mjs:409`
  severity: medium
  source: bugs
  detail: Migration 103 khai `toa_ten text NOT NULL DEFAULT ''` và cột này nằm trong PRIMARY KEY (snapshot_id, du_an, khu_nhan, toa_ten, ma_can). Còn dongS16 lại gán `toa_ten = chuoi(r.toa_ten)` ở pha 1 và `chuoi(c.toa) ?? chuoi(o.toaTen)` ở pha 2/3, mà `chuoi` đổi chuỗi rỗng hay thiếu thành `null`. DEFAULT chỉ có hiệu lực khi câu chèn bỏ hẳn cột; ở đây napS16 truyền NULL tường minh qua `unnest($5::text[])`, nên gặp một dòng căn không có tên toà là lô 5000 dòng vi phạm NOT NULL, ném lỗi, và giao dịch nạp cả bản thu bị lùi. Với khu_nhan thì code đã làm đúng (`?? ""`), riêng toa_ten bị sót. Thiết kế có tính tới ca này: view dùng `NULLIF(btrim(toa_ten), '')`, bộ đếm độc lập đếm căn không tên toà là mơ hồ. Ca này vì thế không bao giờ tới được view, mà làm chết bộ nạp. Cách sửa: `toa_ten: chuoi(...) ?? ""` ở cả hai chỗ gọi ganCan.
  rationale: AC-1 đòi hàm dùng chung nạp bản thu hợp lệ vào stg; một dòng căn không tên toà làm cả lượt nạp lùi.

- **Căn S16 có thể được gắn vào trục (stack) của một toà khác khi hai toà S16 mới đúc trùng tên trong cùng dự án**
  AC: AC-6
  file: `pipeline/lib/s16-dung.mjs:205`
  severity: medium
  source: bugs
  detail: Khi đúc căn, trục được tìm bằng `trucCo.get(kt) ?? s16.get(biDanhTrucS16(du_an, kq.toa, kq.truc))`. Vế thứ hai là bí danh `${du_an}/${toa}/${truc}`, không chứa building_key. Lấy ví dụ hai toà S16 có toa_id khác nhau nhưng cùng toa_ten (ca 'một tên toà ở hai khu' mà spec §edge nêu) và cả hai không khớp toà có sẵn nào. Khi đó cả hai đi vào nhánh đúc mới (dòng 145–156; nhomTen chỉ chặn nhánh khớp tên). Căn của toà thứ hai có cùng số trục sẽ trượt trucCo (khoá theo bkey) nhưng trúng `s16.get(...)`, và lấy stack_key của toà thứ nhất. Kết quả là `units.building_key = B2` trong khi `stack_key` lại thuộc B1, sub_id = stack:floor có thể trùng với căn của B1. Không ràng buộc DB nào bắt lỗi này (082 không kiểm stack thuộc cùng toà), nên dữ liệu sai được ghi lặng lẽ, và ở các lượt sau cũng lặp lại vì bí danh trỏ một trục duy nhất. napS16TheoKhu (dòng 265) cũng có cùng va chạm khi khoá m.toa chỉ theo tên chuẩn hoá. itest không có ca hai toà mới đúc trùng tên.
  rationale: AC-6 đòi căn mới có trục và tầng đúng; gắn nhầm trục của toà khác làm sai điều đó.

- **Hình dạng 1: ô1, ô2 của ma trận AC-3 trong test thuần đo hàm `nhomMot` viết ngay trong test, không đo đầu ra của mã thật; riêng ô1 không có khu khác nhau**
  AC: AC-3
  file: `pipeline/lib/s16-danh-muc.test.mjs:13`
  severity: low
  source: measurement
  detail: `nhomMot` được định nghĩa trong tệp test (`new Set(dong.map(d => du_an|khoaMa(ma_can))).size`), không phải hàm gom căn của pipeline (dongS16, v_s16_can, s16-dung). Ô1 «cùng mã khác nhãn khu → một căn» truyền hai dòng y hệt `{du_an:'q', ma_can:'QS2.081101'}` và không có trường khu nào, nên ra 1 là hiển nhiên, không chạm tới luật gom khác khu. Assert vì thế đo lại hàm phụ của chính test, không đo đầu ra thật. E3 tính là «một assert mỗi ô» trên ma trận năm ô, nhưng ô1, ô2 ở tệp này không kiểm được gì. Bản itest dòng 90-108 chạy ma trận qua v_s16_can với khu khác nhau thật nên bù được một phần.
  rationale: AC-3 đòi mỗi ô ma trận một assert trên hàm chọn toà thật; assert hiện đo hàm phụ của test.

- **Hình dạng 3: AC-4 hứa in số căn bị bỏ của đúng dự án không nối, nhưng assert là tổng mọi dự án và dùng `>= 2`**
  AC: AC-4
  file: `pipeline/scripts/danh-ba-s16.itest.mjs:214`
  severity: low
  source: measurement
  detail: E4 hứa: dự án không nối thì «lệnh in số căn bị bỏ của nó». Fixture có dự án DC với đúng 2 căn. Assert lại là `Object.values(tk1.bo_du_an).reduce(+) >= 2`: tổng của mọi dự án bị bỏ, so bằng bất đẳng thức. Như vậy test không ghim được rằng số in ra là của dự án DC và bằng đúng 2. Một lỗi đếm thừa, hoặc bỏ nhầm dự án đã nối (DB), vẫn qua. Lời hứa là quan hệ (số bỏ của DC = số căn DC trong stg), cần assert bằng nhau trên đúng mục của dự án đó.
  rationale: AC-4 đòi lệnh in số căn bị bỏ của dự án không nối; assert không ghim đúng dự án và đúng số.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Ba executor mới trong config.yaml thiếu chú thích ánh xạ eval, khác mẫu của các dòng xung quanh**
  Người dùng thấy gì: Người đọc cấu hình nghiệm thu khó biết phép đo nào ứng với tiêu chí nào. Người dùng cuối không thấy ảnh hưởng.
  Căn cứ: Chỉ ảnh hưởng người bảo trì, không mất hay lộ dữ liệu, thêm chú thích sau rất rẻ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: wont-fix

- **pipeline/CLAUDE.md chưa ghi bước S16 mới của danh-ba-vat-the và các lib s16-***
  Người dùng thấy gì: Tài liệu hướng dẫn của đường ống chưa nhắc tới bước nạp S16 mới, người làm sau có thể bỏ sót nó.
  Căn cứ: Không ảnh hưởng dữ liệu hay người dùng, bổ sung tài liệu sau rất rẻ.
  file: `pipeline/danh-ba-vat-the.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
