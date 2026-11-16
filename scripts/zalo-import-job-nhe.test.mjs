// node --test scripts/zalo-import-job-nhe.test.mjs
// Hồ sơ s03-len-nhanh-nac-1 AC-1, AC-2: lượt nạp nhanh (--luot-nhanh, hàng s03-nap-nhanh) cho ba bước transform chờ khoá
// DB tối đa S03_NHANH_LOCK_TIMEOUT qua PGOPTIONS; bước hỏng vì khoá → «BỎ LƯỢT», không tính vào mã thoát; bỏ 8 lượt nhanh
// liền → JOB FAIL, thoát 75. Khuôn scripts/enrich-buoc-job.test.mjs: chép NGUYÊN tệp bọc thật + job-step.sh vào cây tạm,
// `node` giả đầu PATH ghi nhãn bước và PGOPTIONS mỗi lần gọi, hỏng theo FAIL_STEPS (<nhãn>:<mã>:<kiểu>; kiểu khoa in chuỗi
// lỗi lock timeout của Postgres, 55p03 in mã SQLSTATE, boom in lỗi khác). Không DB, không node thật, không LLM.
// Chiều đỏ: bản chép tệp bọc đột biến đúng một chỗ, cùng cây tạm, cùng node giả.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, test } from "node:test";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = "scripts/zalo-import-daily.sh";
const THAT = readFileSync(path.join(REPO, SCRIPT), "utf8");
const SCRATCH = mkdtempSync(path.join(realpathSync(tmpdir()), "zalo-import-nhe-"));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));

const SNAP = "collector/snapshots/hanoi/hanoi__zalo-agent__2026-10-25T000000Z";
const STATE = "pipeline/logs/apify-daily.state";
const SO_BO = "pipeline/logs/zalo-import-bo-luot.state";
const DOC_GOP = "pipeline/doc-gop-hang-ngay.sh";
const DOC_GOP_GIA = '#!/bin/bash\nexec node "$(dirname "$0")/doc-gop-hang-ngay.mjs"\n';
const NHANH = ["import-airbnb", "transform-zalo", "transform-media", "refresh-bait-gap", "xep-hang-gia"];
const DEM = [...NHANH, "doc-gop-hang-ngay", "enrich-run"];
const BA = ["transform-zalo", "transform-media", "refresh-bait-gap", "xep-hang-gia"];

const NODE_SHIM = `#!/bin/bash
step=node
for a in "$@"; do case "$a" in *.mjs|*.js|*.ts) step="$(basename "$a")"; step="\${step%.*}"; break;; esac; done
echo "$step|\${PGOPTIONS:-}" >> "$SEEN"
IFS=',' read -ra items <<< "\${FAIL_STEPS:-}"
for it in "\${items[@]}"; do
  IFS=':' read -r name c kieu <<< "$it"
  if [ "$name" = "$step" ]; then
    case "$kieu" in
      khoa) echo "error: canceling statement due to lock timeout" >&2;;
      55p03) echo "error: could not obtain lock on relation (55P03)" >&2;;
      *) echo "Error: boom ($step)" >&2;;
    esac
    exit "$c"
  fi
done
exit 0
`;

function cay(noiDung = THAT) {
  const root = mkdtempSync(path.join(SCRATCH, "cay-"));
  for (const rel of [SCRIPT, "scripts/lib/job-step.sh"]) {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    copyFileSync(path.join(REPO, rel), path.join(root, rel));
  }
  writeFileSync(path.join(root, SCRIPT), noiDung);
  mkdirSync(path.join(root, SNAP), { recursive: true });
  writeFileSync(path.join(root, SNAP, "manifest.json"), "{}\n");
  mkdirSync(path.join(root, "pipeline/logs"), { recursive: true });
  mkdirSync(path.join(root, "agent"));
  writeFileSync(path.join(root, DOC_GOP), DOC_GOP_GIA);
  const bin = path.join(root, ".shim-bin");
  mkdirSync(bin);
  writeFileSync(path.join(bin, "node"), NODE_SHIM);
  chmodSync(path.join(bin, "node"), 0o755);
  writeFileSync(path.join(bin, "sleep"), "#!/bin/bash\nexit 0\n");
  chmodSync(path.join(bin, "sleep"), 0o755);
  mkdirSync(path.join(root, ".home"));
  return root;
}

function chay(root, { nhanh = true, fail = "", env = {}, soBo } = {}) {
  writeFileSync(path.join(root, STATE), "2026-10-24T000000Z");
  if (soBo !== undefined) writeFileSync(path.join(root, SO_BO), `${soBo}\n`);
  const seen = path.join(root, ".seen");
  writeFileSync(seen, "");
  const r = spawnSync("/bin/bash", [path.join(root, SCRIPT), ...(nhanh ? ["--luot-nhanh"] : [])], {
    cwd: root, encoding: "utf8", timeout: 60_000,
    env: {
      PATH: `${path.join(root, ".shim-bin")}:/usr/bin:/bin`, HOME: path.join(root, ".home"),
      DATABASE_URL: "postgres://127.0.0.1:9/khong-co", SEEN: seen, FAIL_STEPS: fail, ...env,
    },
  });
  const dong = readFileSync(seen, "utf8").split("\n").filter(Boolean).map((l) => {
    const i = l.indexOf("|");
    return { buoc: l.slice(0, i), pgo: l.slice(i + 1) };
  });
  let so = null;
  try { so = readFileSync(path.join(root, SO_BO), "utf8").trim(); } catch { /* vắng */ }
  return { code: r.status, stdout: r.stdout, stderr: r.stderr, calls: dong.map((d) => d.buoc), pgo: Object.fromEntries(dong.map((d) => [d.buoc, d.pgo])), so };
}

function dotBien(cu, moi) {
  assert.ok(THAT.includes(cu), `đột biến không khớp chuỗi: ${cu}`);
  return THAT.replace(cu, moi);
}

// ── SN-AC-1 PGOPTIONS ───────────────────────────────────────────────────────────────────────────────────────
function kiemAc1(noiDung) {
  const r1 = chay(cay(noiDung));
  assert.equal(r1.code, 0, r1.stderr);
  assert.deepEqual(r1.calls, NHANH, "SN-AC-1 dãy bước lượt nhanh");
  if (/lock_timeout/.test(r1.pgo["import-airbnb"])) return "SN-AC-1 bước nạp nhận lock_timeout";
  for (const b of BA) if (r1.pgo[b] !== "-c lock_timeout=10s") return "SN-AC-1 lượt nhanh không có lock_timeout";
  const r2 = chay(cay(noiDung), { env: { S03_NHANH_LOCK_TIMEOUT: "3s" } });
  for (const b of BA) assert.equal(r2.pgo[b], "-c lock_timeout=3s", `SN-AC-1 biến tay ${b}`);
  const r3 = chay(cay(noiDung), { nhanh: false });
  assert.equal(r3.code, 0, r3.stderr);
  assert.deepEqual(r3.calls, DEM, "SN-AC-1 lượt 00:00 sáu bước");
  for (const b of DEM) assert.ok(!/lock_timeout/.test(r3.pgo[b]), `SN-AC-1 lượt 00:00 có lock_timeout ở ${b}`);
  const r4 = chay(cay(noiDung), { env: { PGOPTIONS: "-c search_path=public" } });
  for (const b of BA) assert.equal(r4.pgo[b], "-c search_path=public -c lock_timeout=10s", `SN-AC-1 PGOPTIONS sẵn bị ghi đè ở ${b}`);
  return null;
}
test("SN-AC-1 lượt nhanh: ba bước transform có lock_timeout, bước nạp và lượt 00:00 không (kèm chiều đỏ)", () => {
  assert.equal(kiemAc1(THAT), null);
  // Đặt PGOPTIONS ngay khi nhận cờ (trước phần nạp) — bước nạp của làn ZCode cũng nhận lock_timeout.
  const truocNap = dotBien('export S03_LUOT_NHANH="$LUOT_NHANH"\n',
    'export S03_LUOT_NHANH="$LUOT_NHANH"\n[ "$LUOT_NHANH" = "1" ] && export PGOPTIONS="-c lock_timeout=10s"\n');
  assert.equal(kiemAc1(truocNap), "SN-AC-1 bước nạp nhận lock_timeout");
  const boPgo = dotBien('[ "$NHANH" = "1" ] && export PGOPTIONS=', ': && : PGOPTIONS_BO=');
  assert.equal(kiemAc1(boPgo), "SN-AC-1 lượt nhanh không có lock_timeout");
});

// ── SN-AC-2 bỏ lượt ────────────────────────────────────────────────────────────────────────────────────────
const BO = "BỎ LƯỢT [zalo-import-daily] bước transform-zalo: đụng khoá — lượt sau làm";
const MA_TRAN = [
  // [ten, nhanh, fail, ma, coBo, coFail]
  ["nhanh+khoa", true, "transform-zalo:1:khoa", 0, true, null],
  ["nhanh+boom", true, "transform-zalo:4:boom", 4, false, "JOB FAIL [zalo-import-daily] bước transform-zalo mã 4"],
  ["nhanh+xanh", true, "", 0, false, null],
  ["dem+khoa", false, "transform-zalo:1:khoa", 1, false, "JOB FAIL [zalo-import-daily] bước transform-zalo mã 1"],
  ["dem+boom", false, "transform-zalo:4:boom", 4, false, "JOB FAIL [zalo-import-daily] bước transform-zalo mã 4"],
  ["dem+xanh", false, "", 0, false, null],
];
function kiemAc2(noiDung) {
  for (const [ten, nhanh, fail, ma, coBo, coFail] of MA_TRAN) {
    const r = chay(cay(noiDung), { nhanh, fail });
    if (ten === "nhanh+boom" && r.code === 0 && r.stderr.includes("BỎ LƯỢT")) return "SN-AC-2 lỗi thật bị nuốt thành bỏ lượt";
    assert.equal(r.code, ma, `SN-AC-2 ô ${ten} mã thoát: ${r.stderr}`);
    assert.equal(r.stderr.split("\n").includes(BO), coBo, `SN-AC-2 ô ${ten} dòng BỎ LƯỢT`);
    const jf = r.stderr.split("\n").filter((l) => l.startsWith("JOB FAIL"));
    assert.deepEqual(jf, coFail ? [coFail] : [], `SN-AC-2 ô ${ten} dòng JOB FAIL`);
    assert.deepEqual(r.calls, nhanh ? NHANH : DEM, `SN-AC-2 ô ${ten} bước sau vẫn chạy`);
  }
  const t1 = chay(cay(noiDung), { fail: "transform-zalo:1:khoa,refresh-bait-gap:4:boom" });
  assert.equal(t1.code, 4, "SN-AC-2 khoá + lỗi thật → mã lỗi thật");
  const t2 = chay(cay(noiDung), { fail: "transform-media:1:55p03" });
  assert.equal(t2.code, 0, t2.stderr);
  assert.ok(t2.stderr.includes("BỎ LƯỢT [zalo-import-daily] bước transform-media: đụng khoá"), "SN-AC-2 55P03");
  // Đếm liền — số trong sổ trước lượt nhanh+khoá.
  for (const [truoc, sau, ma] of [[0, "1", 0], [6, "7", 0], [7, "8", 75]]) {
    const r = chay(cay(noiDung), { fail: "transform-zalo:1:khoa", soBo: truoc });
    if (truoc === 7 && r.code === 0) return "SN-AC-2 khoá kẹt không báo";
    assert.equal(r.code, ma, `SN-AC-2 đếm ${truoc}→${sau}: ${r.stderr}`);
    assert.equal(r.so, sau, `SN-AC-2 sổ sau lượt (trước ${truoc})`);
    if (ma === 75) assert.ok(r.stderr.split("\n").includes("JOB FAIL [zalo-import-daily] đụng khoá 8 lượt liền"), r.stderr);
  }
  assert.equal(chay(cay(noiDung), { soBo: 5 }).so, "0", "SN-AC-2 lượt nhanh xanh không đặt lại sổ");
  assert.equal(chay(cay(noiDung), { nhanh: false, soBo: 5 }).so, "0", "SN-AC-2 lượt 00:00 không đặt lại sổ");
  return null;
}
test("SN-AC-2 bỏ lượt khi đụng khoá: ma trận 2 lượt × 3 kết cục, đếm liền 0→1, 6→7, 7→8 thoát 75, đặt lại (kèm chiều đỏ)", () => {
  assert.equal(kiemAc2(THAT), null);
  const nuot = dotBien("grep -qE 'lock timeout|55P03' \"$ra\"", "true");
  assert.equal(kiemAc2(nuot), "SN-AC-2 lỗi thật bị nuốt thành bỏ lượt");
  const khongDem = dotBien('if [ "$n" -ge 8 ] && [ "$JOB_RC" -eq 0 ]; then', 'if false; then');
  assert.equal(kiemAc2(khongDem), "SN-AC-2 khoá kẹt không báo");
});
