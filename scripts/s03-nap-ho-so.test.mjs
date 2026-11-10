// node --test scripts/s03-nap-ho-so.test.mjs
// claudedp-1011-12 (link-nguoi-ban-s03 Ngoài-1/5/6): tệp bọc nạp S03 nạp thêm snapshot HỒ SƠ người bán (nguồn
// s03-ho-so) vào stg_s03_ho_so với con trỏ RIÊNG pipeline/logs/s03-ho-so.state. Ngoài-6: DB thiếu 080 thì importer in
// CHUA-AP-080 rồi thoát 0 mà không nạp — tệp bọc phải GIỮ con trỏ để lượt sau (đã áp 080) nạp lại đủ, không trùng.
// Khuôn scripts/s03-nap-nhanh.test.mjs: bản chép tệp bọc thật + job-step.sh trong cây tạm, node/sleep giả, không DB.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, test } from "node:test";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PLIST_SRC = readFileSync(path.join(REPO, "pipeline/cron/com.oneinvest.s03-nap-15phut.plist"), "utf8");
const SCRIPT = PLIST_SRC.match(/<string>__ROOT__\/(scripts\/[^<]+\.sh)<\/string>/)[1];
const KENH = SCRIPT.match(/scripts\/([a-z]+)-import-daily\.sh/)[1];
const SCRATCH = mkdtempSync(path.join(realpathSync(tmpdir()), "s03-nap-ho-so-"));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));

const TIN = `collector/snapshots/hanoi/hanoi__${KENH}-agent__2026-10-25T000000Z`;
const STATE = "pipeline/logs/apify-daily.state";
const HS_STATE = "pipeline/logs/s03-ho-so.state";
const KHOA = `${STATE}.lock`;
const hoSo = (ts) => `collector/snapshots/hanoi/hanoi__s03-ho-so__${ts}`;
const HS1 = "2026-11-10T080000000";
const HS2 = "2026-11-10T090000000";
const HS_CU = "2026-10-20T000000000"; // mốc CŨ hơn con trỏ tin — con trỏ riêng vẫn phải nạp

// node giả: ghi «nhãn [tên thư mục snapshot]»; snapshot hồ sơ: HS_CHUA=1 → in CHUA-AP-080 rồi thoát 0 (hành vi importer
// khi DB thiếu 080), HS_HONG=1 → thoát 2. FAIL_STEPS như các bộ test tác vụ nạp khác.
const NODE_SHIM = `#!/bin/bash
step=node; arg=""
for a in "$@"; do case "$a" in *.mjs|*.js|*.ts) step="$(basename "$a")"; step="\${step%.*}";; */collector/snapshots/*) arg="$(basename "$a")";; esac; done
echo "$step $arg" >> "$CALLS"
case "$arg" in *__s03-ho-so__*)
  [ "\${HS_HONG:-}" = 1 ] && { echo "Error: boom ho-so" >&2; exit 2; }
  [ "\${HS_CHUA_TO:-}" = 1 ] && { echo "CHUA-AP-080: bảng stg_s03_ho_so chưa có (migration 080 chưa áp)"; for i in $(seq 1 20000); do echo "dòng log dài $i ................................................"; done; exit 0; }
  [ "\${HS_CHUA:-}" = 1 ] && { echo "CHUA-AP-080: bảng stg_s03_ho_so chưa có (migration 080 chưa áp)"; echo "đã nạp: 0 hồ sơ S03 (+1 BỎ do CHUA-AP-080)"; exit 0; }
  echo "đã nạp: 1 hồ sơ S03"; exit 0;;
esac
IFS=',' read -ra items <<< "\${FAIL_STEPS:-}"
for it in "\${items[@]}"; do name="\${it%%:*}"; c="\${it#*:}"; [ "$name" = "$step" ] && { echo "Error: boom ($step)" >&2; exit "$c"; }; done
exit 0
`;

function cay({ hoSoTs = [HS1], tin = true } = {}) {
  const root = mkdtempSync(path.join(SCRATCH, "cay-"));
  for (const rel of [SCRIPT, "scripts/lib/job-step.sh"]) {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    copyFileSync(path.join(REPO, rel), path.join(root, rel));
  }
  const snap = (rel) => { mkdirSync(path.join(root, rel), { recursive: true }); writeFileSync(path.join(root, rel, "manifest.json"), "{}\n"); };
  if (tin) snap(TIN);
  for (const ts of hoSoTs) snap(hoSo(ts));
  mkdirSync(path.join(root, "pipeline/logs"), { recursive: true });
  mkdirSync(path.join(root, "agent"));
  writeFileSync(path.join(root, "pipeline/doc-gop-hang-ngay.sh"), '#!/bin/bash\nexec node "$(dirname "$0")/doc-gop-hang-ngay.mjs"\n');
  writeFileSync(path.join(root, STATE), "2026-11-01T000000Z");
  const bin = path.join(root, ".shim-bin");
  mkdirSync(bin);
  writeFileSync(path.join(bin, "node"), NODE_SHIM);
  chmodSync(path.join(bin, "node"), 0o755);
  writeFileSync(path.join(bin, "sleep"), "#!/bin/bash\nexit 0\n");
  chmodSync(path.join(bin, "sleep"), 0o755);
  mkdirSync(path.join(root, ".home"));
  return root;
}

function chay(root, args = [], extra = {}) {
  const calls = path.join(root, ".calls");
  writeFileSync(calls, "");
  const env = { PATH: `${path.join(root, ".shim-bin")}:/usr/bin:/bin`, HOME: path.join(root, ".home"), DATABASE_URL: "postgres://127.0.0.1:9/khong-co", CALLS: calls, ...extra };
  const r = spawnSync("/bin/bash", [path.join(root, SCRIPT), ...args], { cwd: root, env, encoding: "utf8", timeout: 60_000, maxBuffer: 64 * 1024 * 1024 });
  const goi = readFileSync(calls, "utf8").split("\n").filter(Boolean);
  const hs = path.join(root, HS_STATE);
  return {
    code: r.status,
    out: r.stdout + r.stderr,
    buoc: goi.map((l) => l.split(" ")[0]),
    napHoSo: goi.filter((l) => l.includes("__s03-ho-so__")).map((l) => l.split("__").pop()),
    hsState: existsSync(hs) ? readFileSync(hs, "utf8").trim() : null,
    conKhoa: existsSync(path.join(root, KHOA)),
  };
}

test("HS-1 lượt 00:00: snapshot hồ sơ mới được nạp, con trỏ hồ sơ tiến, chuỗi tin chạy đủ, mã 0", () => {
  const r = chay(cay());
  assert.equal(r.code, 0, r.out);
  assert.deepEqual(r.napHoSo, [HS1]);
  assert.equal(r.hsState, HS1);
  assert.ok(r.buoc.includes("refresh-bait-gap") && r.buoc.includes("enrich-run"), r.buoc.join(","));
  // nạp hồ sơ đứng TRƯỚC transform — refresh-bait-gap (ghi link hồ sơ) đọc được bảng vừa nạp
  assert.ok(r.buoc.lastIndexOf("import-airbnb") < r.buoc.indexOf(`transform-${KENH}`), r.buoc.join(","));
  assert.equal(r.conKhoa, false);
});

test("HS-2 Ngoài-6 thứ tự: DB thiếu 080 → GIỮ con trỏ hồ sơ, JOB FAIL nap-ho-so mã 4, chuỗi tin vẫn chạy; áp 080 rồi chạy lại → nạp đủ, không trùng", () => {
  const root = cay({ hoSoTs: [HS1, HS2] });
  const a = chay(root, [], { HS_CHUA: "1" });
  assert.equal(a.code, 4, a.out);
  assert.ok(a.out.includes(`JOB FAIL [${KENH}-import-daily] bước nap-ho-so mã 4`), a.out);
  assert.ok(a.out.includes("CHƯA nạp, giữ con trỏ hồ sơ"), a.out);
  assert.deepEqual(a.napHoSo, [HS1], "gặp CHUA-AP-080 phải dừng vòng hồ sơ ngay");
  assert.equal(a.hsState, "00000000T000000", "thiếu 080 mà con trỏ hồ sơ vẫn nhảy — snapshot sẽ mất vĩnh viễn");
  assert.ok(a.buoc.includes("refresh-bait-gap"), "hồ sơ hỏng không được chặn chuỗi tin");
  const b = chay(root);
  assert.equal(b.code, 0, b.out);
  assert.deepEqual(b.napHoSo, [HS1, HS2], "lượt sau khi đã áp 080 phải nạp lại đủ cả hai");
  assert.equal(b.hsState, HS2);
  const c = chay(root);
  assert.deepEqual(c.napHoSo, [], "lượt thứ ba nạp lại hồ sơ đã nạp — trùng");
  assert.equal(c.hsState, HS2);
});

test("HS-3 con trỏ riêng: snapshot hồ sơ mốc CŨ hơn con trỏ tin vẫn được nạp; con trỏ tin không bị kéo theo", () => {
  const root = cay({ hoSoTs: [HS_CU] });
  const r = chay(root);
  assert.equal(r.code, 0, r.out);
  assert.deepEqual(r.napHoSo, [HS_CU]);
  assert.equal(r.hsState, HS_CU);
  assert.equal(readFileSync(path.join(root, STATE), "utf8").trim(), "2026-11-01T000000Z", "con trỏ tin bị vòng hồ sơ ghi đè");
});

test("HS-4 nạp hồ sơ hỏng → giữ con trỏ, JOB FAIL nap-ho-so mã 1, chuỗi tin vẫn chạy, khoá được nhả", () => {
  const r = chay(cay(), [], { HS_HONG: "1" });
  assert.equal(r.code, 1, r.out);
  assert.ok(r.out.includes(`JOB FAIL [${KENH}-import-daily] bước nap-ho-so mã 1`), r.out);
  assert.equal(r.hsState, "00000000T000000");
  assert.ok(r.buoc.includes("refresh-bait-gap"));
  assert.equal(r.conKhoa, false);
});

test("HS-5 lượt nhanh cũng nạp hồ sơ (để link hồ sơ lên trong ngày), vẫn bỏ đọc gộp + làm giàu", () => {
  const r = chay(cay(), ["--luot-nhanh"]);
  assert.equal(r.code, 0, r.out);
  assert.deepEqual(r.napHoSo, [HS1]);
  assert.equal(r.hsState, HS1);
  assert.equal(r.buoc.includes("enrich-run"), false);
});

test("HS-6 đối chứng: không có snapshot hồ sơ nào → không gọi nạp hồ sơ, con trỏ hồ sơ ở mốc gốc, mã 0", () => {
  const r = chay(cay({ hoSoTs: [] }));
  assert.equal(r.code, 0, r.out);
  assert.deepEqual(r.napHoSo, []);
  assert.equal(r.hsState, "00000000T000000");
});

test("HS-7 snapshot hồ sơ đang ghi (thư mục .partial) không bị nạp", () => {
  const root = cay({ hoSoTs: [] });
  mkdirSync(path.join(root, `collector/snapshots/hanoi/.hanoi__s03-ho-so__${HS1}.partial`), { recursive: true });
  const r = chay(root);
  assert.equal(r.code, 0, r.out);
  assert.deepEqual(r.napHoSo, []);
});

test("HS-8 CHUA-AP-080 ở ĐẦU một đầu ra rất lớn (~1 MB) vẫn bị bắt: giữ con trỏ, mã 4 (review: SIGPIPE dưới pipefail)", () => {
  const r = chay(cay(), [], { HS_CHUA_TO: "1" });
  assert.equal(r.code, 4, r.out.slice(-500));
  assert.equal(r.hsState, "00000000T000000", "đầu ra lớn làm lọt CHUA-AP-080 — con trỏ hồ sơ nhảy qua snapshot chưa nạp");
});

test("HS-9 snapshot hồ sơ thiếu manifest: <30′ thì dừng, giữ con trỏ; ≥30′ (mồ côi) thì bỏ qua và nạp tiếp snapshot sau", () => {
  const root = cay({ hoSoTs: [HS2] });
  const moCoi = path.join(root, hoSo(HS1));
  mkdirSync(moCoi, { recursive: true });
  const a = chay(root);
  assert.equal(a.code, 0, a.out);
  assert.deepEqual(a.napHoSo, [], "snapshot đang ghi (<30′) mà vòng hồ sơ vẫn đi tiếp");
  assert.equal(a.hsState, "00000000T000000");
  spawnSync("touch", ["-t", "202611100000", moCoi]);
  const b = chay(root);
  assert.equal(b.code, 0, b.out);
  assert.ok(b.out.includes("mồ côi"), b.out);
  assert.deepEqual(b.napHoSo, [HS2]);
  assert.equal(b.hsState, HS2);
});
