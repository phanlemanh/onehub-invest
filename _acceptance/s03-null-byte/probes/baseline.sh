#!/bin/bash
# AC-3: đối chứng âm — importer TRƯỚC bản sửa (merge-base với origin/main) nạp cùng snapshot giả phải ĐỎ với lỗi Postgres về U+0000.
set -uo pipefail
R="${1:?gốc kho}"; cd "$R"
B=$(git merge-base HEAD origin/main); OLD=pipeline/.import-airbnb-base-$$.mjs; trap 'rm -f "$OLD"' EXIT
git show "$B:pipeline/import-airbnb.mjs" > "$OLD"
grep -q stripNullBytes "$OLD" && { echo "baseline đã có bản sửa — không đối chứng được"; exit 2; }
o=$(bash _acceptance/s03-null-byte/probes/fixture.sh "$R" "$R/$OLD" 2>&1); rc=$?
echo "$o"; echo "fixture exit $rc"; bad=0
[ "$rc" != 0 ] || { echo "baseline phải đỏ"; bad=1; }
echo "$o" | grep -qE 'invalid byte sequence for encoding "UTF8": 0x00|unsupported Unicode escape sequence' || { echo "lỗi không phải U+0000"; bad=1; }
[ "$bad" = 0 ] && echo "BASE OK"
exit "$bad"
