# Bản phạm vi — nền tảng, bảo mật, dữ liệu còn lại (23/10)

> Nguồn: hai khảo sát lượt cắt chung 23/10 trên main `d30974d` — «nền & vận hành» (mã `VH*`) và «tồn đọng & hậu kỳ»
> (mã `TD*`). Mục hai khảo sát cùng tìm ra giữ MỘT mã: `VH1` = TD1 (Ngoài-4 sync), `VH6` = TD4 (dựng DB từ
> migrations), `VH12` = TD15 (dq-truthful-coverage). `VH13g` là phần `.gitignore` của VH13 (phần dọn nhánh là việc
> của người, ở «Ra khỏi kho»). Chỉ mã PHÁT TRIỂN làn Claude; việc làn ZCode ở `pham-vi-zcode-2310.md`.
> Đã loại vì trùng hàng có sẵn: leak gate quyền anon (AU1), `/api/v1/deals` (AU2), job/watchdog DB sập phía Claude
> (AU3), freshness (AU4), audit-all (AU5), SLO (AU6), compose restart (AU7), ROADMAP (AU8), ranh giới + Đà Nẵng
> (AU9), sổ migration (AU10), CI (AU11), coverage cloud (AU12), backup (AH1), deploy data-api (AH2), tin mock
> (PL1/PL2), CASCADE property_offers (PL14). Ghép thành tiêu chí của hàng có sẵn (không mở hàng): xem
> `docs/plan/BOI-CANH.md` §4.

<!-- <<<PHAM-VI-MA -->
```
dot: nen-tang-2310
dang: lan-va
nguon: onehub-invest-tri-thuc:wiki/dot/nen-tang-2310.md#f1b3e246e47f23674931a2d25a2b4197331a8c94

- `VH1` — pha tráo lỗi phía client không xoá staging khi giao dịch có thể còn chạy; cloud không COMMIT bảng FILL rỗng
- `TD2` — bảng cloud có khoá ngoại trỏ vào bảng đồng bộ không làm lượt tráo gãy
- `VH2` — payload ops-facts lên cloud không mang tên nguồn thật; soát chặn khi lỗi bằng danh sách từ source_registry local
- `TD3` — leak gate soát cả cột PII trên cloud, không chỉ quyền anon
- `VH3` — sessions.token lưu dạng băm; phiên cũ hết hiệu lực khi chuyển
- `VH4` — sổ bề mặt API /api/v1 không thuộc ops, test đỏ khi route đọc sale_offers công khai chưa khai; /api/v1/offers theo chế độ AU2
- `TD7` — beacon /api/v1/user-events không gây 401 cho khách chưa đăng nhập
- `TD30` — admin không xem được ảnh QR đăng nhập Zalo qua /api/zalo-media
- `VH6` — dựng DB trống từ db/migrations chạy xanh (012, 031), có lệnh kiểm «dựng từ đầu»
- `VH14` — runbook 037 và DATA-CONTRACT khớp code hiện tại
- `VH13g` — .acceptance-runs/ không lọt vào git
- `TD9` — enrich-run không treo thẻ trong một giao dịch dài, đếm và cảnh báo lỗi LLM, dòng tổng kết đếm đúng
- `TD8` — mọi tin P1 trong backlog có phát biểu của bộ đọc E1/E2 mới, gồm tin S03 mất đề xuất trước 039
- `VH12` — dq-truthful-coverage chạy lại không nhân dòng, ghi overlap mức listing
- `TD11` — media_files từ stg lên canonical theo RESO Media; cột media hết jsonb 'null'
- `TD31` — bản công khai của app không đỏ test vì đọc tệp mẫu trong agent/
- `TD32` — chép lại lớp CI (pre-merge-check.sh + lib) khi kit vá lỗ T1-escape
- `TD33` — sync bỏ qua bảng không đổi
```
<!-- PHAM-VI-MA>>> -->
