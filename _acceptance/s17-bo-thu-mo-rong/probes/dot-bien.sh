#!/bin/bash
# dot-bien.sh — ZC21 s17-bo-thu-mo-rong: chiều đỏ của các tính chất an toàn bộ thu S17. Chạy trên collector/dist ĐÃ dựng (lệnh gọi
# build trước). Bản lành: 13 tệp test S17 xanh trọn. Mỗi đột biến: chép dist sang thư mục tạm, sửa ĐÚNG một chỗ trên bản chép
# (mẫu lệch mã → FAIL «mẫu lệch»), chạy lại 13 tệp test S17 với HOME + TMPDIR tạm → phải ĐỎ, và ca ghim phải nằm trong ca đỏ.
# Không mạng ngoài, không phiên, không trình duyệt: test S17 dùng vận chuyển giả. Gốc kho suy từ vị trí tệp này.
# In «DOT-BIEN PASS» (mã 0) hoặc từng dòng FAIL (mã 1).
set -uo pipefail
R="$(cd "$(dirname "$0")/../../.." && pwd)"; C="$R/collector"; FAIL=0
[ -d "$C/dist/test" ] || { echo "FAIL chưa có $C/dist — chạy build collector trước"; exit 1; }
T=$(mktemp -d "${TMPDIR:-/tmp}/zc21-dot-bien.XXXXXX"); trap 'rm -rf "$T"' EXIT
H="$T/home"; mkdir -p "$H"; ln -s "$C/node_modules" "$T/node_modules"; cp "$C/package.json" "$T/"
chay() { (cd "$T" && HOME="$H" TMPDIR="$H" node --test "$T/$1"/test/s17-*.test.js 2>&1); }
dem() { echo "$1" | sed -n "s/^ℹ $2 //p" | tail -1; }
cp -R "$C/dist" "$T/lanh"
out=$(chay lanh); rc=$?
# Khoá số ca (gap-probe P1): đúng SO_CA ca, 0 bỏ qua, 0 todo — xoá hay skip ca an toàn thì đỏ ở đây.
SO_CA=263
if [ $rc = 0 ] && [ "$(dem "$out" fail)" = 0 ] && [ "$(dem "$out" tests)" = "$SO_CA" ] && [ "$(dem "$out" skipped)" = 0 ] && [ "$(dem "$out" todo)" = 0 ]; then echo "PASS bản lành: $(dem "$out" pass)/$(dem "$out" tests) ca S17 xanh, skipped 0, todo 0"; else echo "FAIL bản lành: mã $rc, tests $(dem "$out" tests) (khoá $SO_CA), fail $(dem "$out" fail), skipped $(dem "$out" skipped), todo $(dem "$out" todo)"; FAIL=1; fi
# Ca nêu tên trong evals.yaml (E1–E6) phải chạy XANH trong bản lành — đoạn đầu tên, khớp nguyên văn.
thieu=0
while IFS= read -r ca; do [ -z "$ca" ] && continue; grep -qF "✔ $ca" <<<"$out" || { echo "FAIL ca nêu tên không chạy xanh: «$ca»"; thieu=1; }; done <<'TEN'
parseCli: thiếu trần lời gọi hoặc trần thời gian thì từ chối
parseCli: nhịp ngoài 150–400 ms bị từ chối
getJsonMany: concurrency ngoài 1–8
getJsonMany: một lời trong đợt gặp 403 → dừng cả lượt
tăng tốc: bị chặn một lần thì ghi vào trạng thái
tăng tốc: bị chặn hai lần thì dừng hẳn
taiAnh: HTTP 200 nhưng thân là trang HTML là trang thử thách
pha ảnh: nhiều lỗi mạng liền nhau thì dừng cả lượt
khoá chung mọi pha cần phiên: một lúc chỉ một pha giữ khoá
tiến trình trình duyệt: khoá chung đang được một pha cần phiên khác giữ
executePhase: số dư giảm thì dừng cả lượt với lý do balance-spent
executePhase: không đọc được số dư thì dừng TRƯỚC khi chạy pha
assertBalanceUnchanged: số dư giảm thì dừng cả lượt
diaChiNoiBo: IPv4 dải riêng
taiAnh: máy chủ ngoài có tên trỏ tới địa chỉ dải riêng
taiAnh: chuyển hướng tới máy chủ KHÔNG được phép
taiAnh: máy chủ khai content-length lớn hơn trần cỡ
pha ảnh máy chủ nguồn: lỗi cấp máy chủ
projects: chốt snapshot hỏng thì trạng thái KHÔNG nói đã làm việc chưa xuống đĩa
pha ảnh: lô chốt hỏng thì KHÔNG ghi tiến độ
BatchWriter: ghi lô nhỏ; mỗi snapshot mang schemaVersion 17
tệp DUNG xuất hiện giữa lượt → lượt dừng sạch
executePhase: trạng thái lưu ra tệp; chạy lại đọc lại và không lặp việc đã xong
TEN
[ $thieu = 0 ] && echo "PASS 23 ca nêu tên trong evals chạy xanh" || FAIL=1
# Phạm vi nhánh (gap-probe P1): tệp đổi so với gốc nhánh chỉ thuộc danh sách trắng; cờ --bo-doc-so-du (commit 4d026c6d2, soát chưa đạt) vắng.
ngoai=$(git -C "$R" diff --name-only "$(git -C "$R" merge-base origin/main HEAD)" HEAD | grep -vE '^(collector/src/collectors/s17-thua-dinh-gia/|collector/src/test/s17-|_acceptance/s17-bo-thu-mo-rong/|_acceptance/config\.yaml$|docs/superpowers/specs/2026-11-26-s17-bo-thu-mo-rong-design\.md$|PRODUCT-MAP\.md$|LO-TRINH\.html$)' || true)
[ -z "$ngoai" ] && echo "PASS phạm vi nhánh: mọi tệp đổi nằm trong danh sách trắng" || { echo "FAIL tệp ngoài danh sách trắng: $(echo $ngoai)"; FAIL=1; }
if grep -rqn 'bo-doc-so-du' "$C/src"; then echo "FAIL có cờ --bo-doc-so-du trong collector/src (commit 4d026c6d2 ngoài phạm vi)"; FAIL=1; else echo "PASS không có cờ --bo-doc-so-du"; fi
# danh sách ngăn bằng TAB (chuỗi tìm có thể chứa «|»): <tên> <tệp js trong collectors/s17-thua-dinh-gia> <chuỗi tìm> <chuỗi thay> <đoạn tên ca phải đỏ>
while IFS=$'\t' read -r ten tep tim thay ca; do
  [ -z "$ten" ] && continue
  rm -rf "$T/pha"; cp -R "$C/dist" "$T/pha"; f="$T/pha/collectors/s17-thua-dinh-gia/$tep"
  python3 - "$f" "$tim" "$thay" <<'PY' || { echo "FAIL $ten: mẫu lệch mã ($tep)"; FAIL=1; continue; }
import sys; p,a,b=sys.argv[1:4]; s=open(p).read()
if s.count(a)!=1: sys.exit(1)
open(p,'w').write(s.replace(a,b))
PY
  out=$(chay pha); rc=$?
  if [ $rc != 0 ] && grep -E '^✖' <<<"$out" | grep -qF "$ca"; then echo "PASS $ten → ĐỎ $(dem "$out" fail) ca, gồm «$ca…»"; else echo "FAIL $ten không làm đỏ ca «$ca…»: mã $rc, fail $(dem "$out" fail)"; FAIL=1; fi
done <<'DS'
khoa-phien-bo-another-run	khoa-phien.js	typeof pid === "number" && conSong(pid)	false	khoá chung mọi pha cần phiên: một lúc chỉ một pha giữ khoá
loi-may-chu-thanh-vinh-vien	pha-anh.js	lop === "nguon" || mayChuCapLoi.size	mayChuCapLoi.size	pha ảnh máy chủ nguồn: lỗi cấp máy chủ
bo-chan-dia-chi-noi-bo	anh.js	export function diaChiNoiBo(ip) {	export function diaChiNoiBo(ip) { return false;	diaChiNoiBo: IPv4 dải riêng
bo-dung-khi-so-du-giam	kinds.js	    if (after < before)	    if (false)	số dư giảm
bo-bat-buoc-tran-loi	main.js	calls: positive("--caps-calls", values["caps-calls"])	calls: Number(values["caps-calls"] ?? 1e9)	parseCli: thiếu trần lời gọi hoặc trần thời gian thì từ chối
bo-dung-khi-403	client.js	if (res && res.status === 403) {	if (false) {	403: dừng cả lượt, mọi lời sau không gửi nữa
bo-dung-han-khi-chan-hai-lan	runner.js	const khoaTangToc = state.blockedRuns >= 2	const khoaTangToc = state.blockedRuns >= 99	tăng tốc: bị chặn hai lần thì dừng hẳn
bo-kiem-tep-dung	client.js	if (this.o.shouldStop?.())	if (false)	tệp DUNG xuất hiện giữa lượt
ghi-tien-do-khi-lo-chua-chot	run.js	if (o.writer.pendingCount === 0)	if (true)	projects: chỉ lưu trạng thái khi snapshot đã chốt
DS
[ $FAIL = 0 ] && echo "DOT-BIEN PASS"
exit $FAIL
