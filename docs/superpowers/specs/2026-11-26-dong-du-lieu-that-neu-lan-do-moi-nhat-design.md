# HT30 — dòng «ca dữ liệu thật» nêu lần đỏ mới nhất

Hàng HT30 (cắt từ Ngoài-5 của HT9 `db-thu-tach-khoi-cum-that`, Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng 26/11).

## Vấn đề

Mỗi lượt chấm không kích suite `pipeline_that`, `scripts/suite-neu-doi.mjs` in dòng «ca dữ liệu thật: không kích — lần xanh gần
nhất trên main: <ngày> (<sha>)», lấy dòng xanh CUỐI của sổ soát hằng ngày (`.acceptance-runs/pipeline-that/lan-chay.jsonl`).
Các dòng đỏ mới hơn bị bỏ qua: soát hằng ngày đỏ nhiều ngày liền thì người ký vẫn chỉ thấy một ngày xanh cũ. Thêm nữa,
`duongSo` rơi về đường tương đối `./.acceptance-runs/…` khi `git rev-parse --git-common-dir` lỗi, và dòng in thành «chưa có
lần xanh nào» như sổ trống — không phân biệt «chưa soát» với «không đọc được sổ».

## Thiết kế

`dongDuLieuThat(chay, so)` đọc trọn sổ, giữ dòng xanh cuối và dòng cuối cùng của sổ:

| Sổ | Dòng in (sau «ca dữ liệu thật: không kích — ») |
|---|---|
| dòng cuối xanh | «lần xanh gần nhất trên main: <ngày> (<sha9>)» — như nay |
| có xanh, dòng cuối đỏ | «lần xanh gần nhất trên main: <ngày> (<sha9>); ĐỎ mới hơn: <ngày> (<sha9>) — ca đỏ: <tối đa 3 tên>[ (+n)]» |
| chỉ đỏ | «chưa có lần xanh nào trên main; ĐỎ mới nhất: <ngày> (<sha9>) — ca đỏ: …» |
| sổ vắng hoặc rỗng | «chưa có lần xanh nào trên main» — như nay |
| không đọc được sổ (đường null, lỗi đọc khác «không có tệp») | «không đọc được sổ soát hằng ngày (<lý do>)» |

`duongSo` trả `null` khi git không giải được git-common-dir (thay vì đường tương đối). Dòng «chạy trong lượt này» khi kích
giữ nguyên. Ca đỏ không có tên (`ca_do` rỗng) → «— ca đỏ: không bóc được tên ca».

Không đổi: `pipeline-that-hang-ngay.mjs` (bên ghi sổ), khuôn dòng sổ, quyết định kích/bỏ của `suite-neu-doi`.

## Đặc tả UX

Không chạm UI — chữ là một dòng đầu ra dòng lệnh mà báo cáo bằng chứng chép lại.
