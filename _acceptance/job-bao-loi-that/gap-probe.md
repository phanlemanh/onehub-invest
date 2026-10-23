---
slug: job-bao-loi-that
at: 2026-10-23T09:40:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract + sổ d-1 | Câu trích t3_paths chỉ nói tệp là T3, không quyết việc để hở lỗ cloud-sync; ca chập chờn (DB rớt lúc sync-cloud, lên trước push-ops-facts) là đúng ca vòng này vá cho chotot/apify | cloud-sync 15′ vẫn ghi last exit 0 khi DB chập chờn; Gate 1 duyệt như lựa chọn kỹ thuật đã đứng | Dòng Hỏi cho Mạnh thay d-1; ca todo cloud-sync chập chờn trong AC-3 | human-gate1: Hỏi-1 (dòng sổ thay d-1), thêm ca todo vào AC-3/E3 |
| P0 | design §4.2 + sổ d-4 | Dừng chuỗi bỏ refresh-bait-gap/resolve-properties là bước liên nguồn; lối «chạy tiếp + gộp mã» còn sống | transform-chotot hỏng bền nhiều đêm thì tin mọi nguồn ngừng thành Một Căn Nhà | Chọn chạy tiếp + mã hỏng đầu, hoặc dòng Hỏi | fixed: đổi sang chạy tiếp + thoát mã hỏng đầu (dòng sổ thay d-4); AC-1/AC-2 đòi bước sau vẫn được gọi, ca hai bước hỏng → mã bước đầu |
| P1 | evals E5 + design §5 | Ca kiểm env chỉ tìm chuỗi có mặt, không đo quan hệ kết nối thật; không gột env; không ca đếm; «(11)» lệch 10 bước | Bước log DATABASE_URL mà Pool viết cứng 5433 → nối DB chung đang sống, chạy transform thật | Env trắng + cổng canh ghi lần nối + hộp cát chặn TCP khác và fetch; ca đếm 10 + 1 todo | fixed: AC-5/E5 viết lại theo cổng canh + hộp cát node --import, chiều đỏ bản sao viết cứng localhost:5433; ca đếm; sửa design §6 |
| P1 | evals E7 + contract AC-7 cũ | Thuộc tính một lần của nhánh đặt trong suite vĩnh viễn | Sau merge, nhánh P3-3/P3-1 sửa đúng phần chừa ra thì đỏ suite; checkout nông thì merge-base lỗi | Tách thành script một lần lúc verify | fixed (descope): bỏ AC-7 cũ khỏi suite — config.yaml là bao_ve nên không thêm khoá lệnh một lần; ranh giới do hook bao_ve + pre-merge-check + soát PR (Notes của contract, dòng sổ descope) |
| P1 | contract + opportunity | Ngưỡng Mạnh duyệt còn vế «có một cảnh báo» mà vế đó thuộc ZC3 | Cổng 2 đọc ngưỡng gốc: AU3 CHẾT tới khi ZC3 merge, hoặc ký đạt cho vế không ai đo | Dòng Hỏi sửa ngưỡng | human-gate1: Hỏi-2 (dòng sổ); bảng Đường đo trỏ Hỏi-2 |

Ghi chú của người phản biện (ngoài cap 5): assert «bước sau không được gọi» thiếu đối chứng dương → fixed: ca
«mọi bước lành» ở AC-1/AC-2/AC-4 đòi nhật ký lời gọi khớp đúng dãy viết trước.
