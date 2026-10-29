## Trong hợp đồng

- **pham-vi.sh: kiểm 'lưới trước gộp do-nen-hieu-nang clean' rỗng — luôn xanh dù bằng chứng đã hoá cũ**
  AC: AC-5
  file: `_acceptance/rao-db-local-do-nen/probes/pham-vi.sh:28`
  severity: high
  source: bugs
  detail: AC-5 yêu cầu lưới trước gộp của hồ sơ đã ký do-nen-hieu-nang phải xanh ở đầu nhánh, và ghi rõ rằng sửa do.mjs làm hồ sơ đó hoá cũ nên phải ghim lại. Đầu dò kiểm điều này bằng lệnh `bash scripts/pre-merge-check.sh . --slug do-nen-hieu-nang --base origin/main`. Khi có `--base`, pre-merge-check bỏ qua luật hoá cũ (khối STALE-DIFF-SCOPE-GUARD) cho mọi slug mà thư mục `_acceptance/<slug>/` không nằm trong diff PR. Nhánh này chưa đụng tệp nào của `_acceptance/do-nen-hieu-nang/`, nên luật hoá cũ không chạy và lệnh vẫn in 'pre-merge-check: clean' (rc 0). Thêm `--recheck-all` cũng ra clean. Tôi đã chạy thử ở HEAD 93981949: chưa có lần ghim lại nào mà đầu dò vẫn in 'ok luoi truoc gop do-nen-hieu-nang: clean' rồi 'PHAM-VI OK'. Còn chạy cùng lệnh mà bỏ `--base` thì ra `VIOLATION [do-nen-hieu-nang]: evidence is stale ... (verified_commit c74b704b) Changed: scripts/do-nen-hieu-nang/do.mjs`. Ngoài ra, danh sách cho phép trong `cho_phep` chỉ CHO PHÉP `run-log.jsonl` và `evidence-report.md` chứ không BẮT BUỘC chúng có trong diff, dù AC-5 đòi 'đúng hai tệp ghim lại'. Hệ quả: E5 xanh giả trong khi bằng chứng của hồ sơ đã ký vẫn hoá cũ. Đây là lỗi im lặng đúng loại mà AC-5 đặt ra để chặn. Cách sửa: kiểm hoá cũ không phụ thuộc phạm vi diff, ví dụ chạy pre-merge-check không có `--base` (hoặc so `verified_commit` trong `_acceptance/do-nen-hieu-nang/evidence-report.md` với lần đổi gần nhất của do.mjs), và đòi hai tệp ghim lại phải có trong `git diff --name-only $base HEAD`.
  rationale: AC-5 đòi lưới trước-gộp của do-nen-hieu-nang xanh ở đầu nhánh và đòi đúng hai tệp ghim lại nằm trong diff. Đầu dò báo xanh trong khi bằng chứng đã hoá cũ và hai tệp ghim chưa có trong diff, nên AC-5 không được chứng minh và thực tế không đạt.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
