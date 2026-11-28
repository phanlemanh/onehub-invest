# Kế hoạch PB10 — data-api-nguon-an-dong-khi-so-rong

Hợp đồng: `_acceptance/data-api-nguon-an-dong-khi-so-rong/contract.md` (duyệt 28/11, Hỏi-1: 503 `HIDDEN_SOURCES_NOT_CONFIGURED`).

| Task | Files | Verify | Phục vụ | independent |
|---|---|---|---|---|
| T1 bộ kiểm sổ | `data-api/src/lib/nguon-an.ts` | typecheck | E1 | false |
| T2 hàm dựng route + 503 | `data-api/src/routes/listings.ts` (giữ nguyên chuỗi ` AND ${NGUON_HIEN}` mà probe PB7 thay; `listingsRoute` vẫn xuất), `data-api/src/app.ts` (openapi) | typecheck + test data-api cũ xanh | E2, E5 | false |
| T3 test sổ hỏng | `data-api/test/nguon-an-dong.test.ts` (AC-1 9 ô, AC-2 216 ô + đối chứng 27 đường, AC-5 không lan) | db-thu + test | E1, E2, E5 | false |
| T4 ô «không lọc» | `data-api/test/tin-hien-thi.test.ts` (LOC thêm «không lọc», khoá cấy xếp đầu, rent_st phân trang hết) | db-thu + test | E4 | false |
| T5 tài liệu | `data-api/README.md`, `data-api/CLAUDE.md` | grep | E6 | false |
| T6 probe | `_acceptance/<slug>/probes/pha.mjs` (4 ô trên bản chép tạm), `probes/pham-vi.mjs` | chạy probe, cây sạch | E3, E6 | false |

Các task phụ thuộc nhau (một tệp route) → làm tuần tự. Trước S4: xin GS gộp hộ main (GS dặn 28/11).
