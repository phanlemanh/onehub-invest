## Luật riêng — Đợt 0 «Cầm máu» (dot0-cam-mau)

Gốc đợt: audit 23/10 §6 «Đợt 0 — Cầm máu» (`docs/audit/2026-10-23-hien-trang-va-lo-trinh.md`) và
`docs/plan/BOI-CANH.md` §6 bước 1–2. Dãy và hàng:

| Dãy | Hàng (thứ tự) | Ghi chú |
|---|---|---|
| P1 API | AU2 → NT4 | NT4 chỉ mở khi AU2 đã merge (`sau`) |
| P2 Sync | AU7 → AU1 | AU7 nhỏ (compose), chạy trước để dãy không đứng chờ 037 |
| P3 Giám sát | AU3 → AU4 → AU5 → AU6 | AU6 sau AU4 (cùng nguồn số SLO) |
| P4 Dữ liệu | PL2 | PL1 (importer) là làn ZCode, giao qua phiên điều phối liên làn, không ở đợt này |

### Trước S1 (mọi thợ)
1. Đọc `docs/plan/BOI-CANH.md` §0–§2 và §4 dòng của hàng mình; đọc hàng ở `docs/plan/lo-trinh.json`
   (câu giao, `bat_khi`, `vi_sao`); đọc `AGENTS.md` (luật bất biến, phân làn) và `.claude/rules/` khớp tệp.
2. Không hỏi lại điều đã chốt ở ROADMAP §3 và BOI-CANH §2 «Đã chốt».
3. Làm việc bằng tiếng Việt. Trình duyệt: skill `ego-browser` (có sẵn phiên ops ở localhost:3456); không dùng
   Chrome extension.

### Ghi chú từng hàng
- **AU1**: ba quan hệ PostGIS do `supabase_admin` làm chủ vẫn để anon đọc (Known limit của 037) — leak gate phải
  chừa chúng. **Không xin merge AU1 trước khi Mạnh áp 037 lên Supabase prod** (BOI-CANH §5 dòng 1): áp gate khi
  anon còn đọc 37/37 bảng thì mọi lượt sync dừng đỏ. Xong Cổng Bằng chứng mà 037 chưa áp → `yeu-cau can-nguoi`.
- **AU2**: chữ `build` của Mạnh cho hàng này là câu trả lời audit Q3 (tạm đóng `/api/v1/deals`). Mở lại khi PL2
  đã rút tin mock là việc sau, không thuộc hàng.
- **NT4**: `/api/v1/offers` theo đúng chế độ AU2; beacon `user-events` không 401 với khách; `/api/zalo-media`
  không tải được ảnh QR đăng nhập.
- **AU3**: ranh giới với ZC3 — AU3 là job pipeline/cron làn Claude báo lỗi thật; collector/hook/watchdog là ZC3
  làn ZCode. Bước thu/nạp trong `scripts/*-daily.sh` là làn ZCode: không sửa, gửi
  `yeu-cau viec-phu --noi-dung '{"tieu_de":"ZCode: <việc>","hang":"AU3"}'` — giám sát chuyển phiên liên làn.
  Đầu vào: lớp L5b + P1.5 trên nhánh `zcode/audit-p1-resilience`.
- **AU4/AU5/AU6**: số đo gốc ở audit L5, L6, L14. AU5 sửa cổng `/ops` về `:3456`.
- **PL2** (T3): dọn qua `reconcile_stale_offers` để có `ops_audit`; transform từ chối post thử kể cả khi PL1
  chưa merge; tính lại bait gap. Không sửa tay DB prod — lượt sync kế tự dọn cloud. Đọc
  `docs/architecture/classification-enrich-review.md` §0.3 và §2 mã L19.

### Làn, migration, dữ liệu
- Tệp làn ZCode (khoá `bao_ve`: `collector/**`, `pipeline/collect-*|import-*|apify-*`, `scripts/zalo-*.sh`,
  `scripts/install-*`…) không sửa; lỗi tích hợp thật thì `yeu-cau cham-tep --tep …` nêu lý do.
- Cần migration mới → `yeu-cau khac --chan --noi-dung '{"tieu_de":"xin số migration","hang":"<mã>"}'`; giám sát xin
  số ở sổ `~/dev/onehub-coord/SO-MIGRATION.md` qua phiên liên làn. Không tự lấy số NNN.
- DB local :5433 dùng chung với ZCode và launchd: không TRUNCATE/DROP bảng ngoài hàng mình; thử phá hoại (tắt
  DB, AU3/AU7) báo giám sát trước bằng `yeu-cau can-nguoi` vì job đêm đang chạy trên cùng DB.
- SPL: nguồn gọi bằng mã S0x trong PR, commit, artifact, kênh GitHub. Người bán trên tin rao là tầng C.

### Merge
- Thợ KHÔNG tự merge trừ khi pha đợt ghi quyền tự merge. Điều kiện merge: CI xanh (`gate` + `ui-lint`) +
  `bash scripts/pre-merge-check.sh <cây> --base origin/main` sạch + (Mạnh ký HOẶC hồ sơ T1/T2 `machine-cleared`).
  **T3 (AU1, AU2, PL2) luôn phải Mạnh ký.**
- Merge bằng `gh pr merge --merge --match-head-commit <sha>`, rồi `git -C ~/dev/onehub-invest pull --ff-only origin main`.
  Không merge trên máy rồi push main.
- Lỗi của acceptance-gate-kit → báo giám sát (`yeu-cau khac`), không tự sửa kit.

### Chờ người
Thợ đứng chờ người — kể cả chờ hộp quyền trong lượt chấm S4 — thì tự ghi
`node <thư mục đợt>/loi/dieu-phoi.mjs yeu-cau can-nguoi --chan --noi-dung '{"tieu_de":"<cần gì>"}'`, không chỉ hỏi
bằng chữ trong hội thoại. Giám sát gom mọi quyết định cổng thành MỘT bảng mỗi lần báo Mạnh.
