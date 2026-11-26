// db-sao-luu.test.mjs — hồ sơ db-thu-tach-khoi-cum-that E7: db-sao-luu.sh bỏ DB thử của suite (oneinvest_suite_*, gồm bản
// mẫu) khỏi bản sao lưu và ghi tên DB bỏ vào thong-tin.txt (tệp có trong manifest.sha256). Docker giả trên PATH: không
// chạm cụm thật, không pg_dump thật — giả ghi lại DB nào được dump và tạo tệp dump rỗng ở thư mục đích.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const SH = path.join(import.meta.dirname, "db-sao-luu.sh");
const DS_DB = ["oneinvest", "oneinvest_p2_x", "oneinvest_suite_mau", "oneinvest_suite_pipeline_a_123", "postgres"];

function dung() {
  const d = mkdtempSync(path.join(tmpdir(), "db-sao-luu-"));
  const log = path.join(d, "dump.log");
  writeFileSync(log, "");
  writeFileSync(path.join(d, "docker"), `#!/usr/bin/env bash
case "$1" in
  inspect) [ "$2" = -f ] && echo anh-gia:1; exit 0 ;;
  exec)
    case "$*" in
      *"datname <> 'oneinvest'"*) printf '%s\\n' ${DS_DB.filter((x) => x !== "oneinvest").map((x) => JSON.stringify(x)).join(" ")} ;;
      *"co_db "*) echo "co_db oneinvest 1" ;;
      *"phien_ban"*) printf 'phien_ban gia\\n/var/lib/pg\\n' ;;
      *"-d oneinvest"*)
        while IFS= read -r l; do
          case "$l" in
            *pg_export_snapshot*) echo 00000003-00000002-1 ;;
            *gexec*) printf 'public.t\\t5\\n' ;;
            *__HET_DEM__*) echo __HET_DEM__ ;;
            COMMIT*) exit 0 ;;
          esac
        done ;;
    esac
    exit 0 ;;
  run)
    dich=""; f=""; db=""; prev=""
    for a in "$@"; do
      [ "$prev" = -v ] && dich="\${a%%:/b}"
      [ "$prev" = -f ] && f="\${a#/b/}"
      prev="$a"; db="$a"
    done
    [ -n "$f" ] && : > "$dich/$f"
    case "$*" in *pg_dump\\ *) echo "$db" >> ${JSON.stringify(log)} ;; esac
    exit 0 ;;
esac
exit 0
`);
  chmodSync(path.join(d, "docker"), 0o755);
  return { d, log, dich: path.join(d, "ra") };
}

/** Chạy một bản db-sao-luu.sh; trả { dump: [db được dump], thongTin, r }. */
function chay(ban = SH) {
  const { d, log, dich } = dung();
  const r = spawnSync("bash", [ban, dich], { encoding: "utf8", env: { ...process.env, PATH: `${d}:${process.env.PATH}` } });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  return { dump: readFileSync(log, "utf8").split("\n").filter(Boolean).sort(), thongTin: readFileSync(path.join(dich, "thong-tin.txt"), "utf8"), dich };
}

/** Ném lỗi gọi tên DB suite nếu nó lọt vào danh sách sao lưu. */
function kiem({ dump }) {
  const lot = dump.filter((x) => x.startsWith("oneinvest_suite_"));
  if (lot.length) throw new Error(`DB thử của suite trong danh sách sao lưu: ${lot.join(", ")}`);
}

test("db-sao-luu bỏ DB thử của suite, ghi tên vào thong-tin.txt, DB khác vẫn sao lưu", () => {
  const k = chay();
  kiem(k);
  assert.deepEqual(k.dump, ["oneinvest", "oneinvest_p2_x", "postgres"]);
  const bo = k.thongTin.split("\n").filter((l) => l.startsWith("bỏ DB thử của suite: "));
  assert.deepEqual(bo, ["bỏ DB thử của suite: oneinvest_suite_mau", "bỏ DB thử của suite: oneinvest_suite_pipeline_a_123"]);
  assert.ok(!existsSync(path.join(k.dich, "oneinvest_suite_mau.dump")));
  assert.match(readFileSync(path.join(k.dich, "manifest.sha256"), "utf8"), /thong-tin\.txt/);
});

test("chiều đỏ: bản sao bỏ bộ lọc → ghim oneinvest_suite_mau", () => {
  const goc = readFileSync(SH, "utf8");
  const sua = goc.replace(/^  if \[\[ "\$db" == oneinvest_suite_\* \]\].*\n/m, "");
  assert.notEqual(sua, goc, "bản sao phải khác bản thật");
  const d = mkdtempSync(path.join(tmpdir(), "db-sao-luu-ban-"));
  const ban = path.join(d, "db-sao-luu.sh");
  writeFileSync(ban, sua);
  assert.throws(() => kiem(chay(ban)), /oneinvest_suite_mau/);
});
