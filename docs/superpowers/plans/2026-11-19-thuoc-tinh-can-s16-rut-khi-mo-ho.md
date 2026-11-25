# Kế hoạch: thuoc-tinh-can-s16-rut-khi-mo-ho (DA48)

Các task chạy tuần tự trên cùng một lệnh và một tệp test, `independent: false`.

1. **Ca đỏ cho bước rút.** Tệp: `pipeline/tests/thuoc-tinh-can-s16-rut.itest.mjs`. Kiểm: `bash _acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/kiem.sh db` đỏ trên mã cũ. Phục vụ E1–E5.
2. **Bước rút trong lệnh.** Tệp: `pipeline/scripts/thuoc-tinh-can-s16.mjs`. Kiểm: lệnh trên xanh. Phục vụ E1–E5.
3. **Ca lớp đọc của trang dự án.** Tệp: `app/tests/thuoc-tinh-can-rut.test.tsx`. Kiểm: `kiem.sh app`. Phục vụ E6.
4. **Sửa hai phép đo của TTC-AC-1.** Tệp: `pipeline/tests/thuoc-tinh-can-s16.itest.mjs`, `probes/ttc.sh`. Kiểm: `kiem.sh ttc`. Phục vụ E7.
5. **Phép đo số thật.** Tệp: `probes/that.mjs`. Kiểm: `kiem.sh that` sau khi DA40 áp. Phục vụ E8.
