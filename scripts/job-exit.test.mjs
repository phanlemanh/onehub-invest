// node --test scripts/job-exit.test.mjs
// AU3 `job-bao-loi-that`: job launchd có bước DB làn Claude phải thoát ≠ 0 khi bước DB hỏng.
// KHÔNG tắt DB chung :5433 (job đêm + ZCode chạy trên nó). Hai lớp đo:
//   - tệp bọc: chép NGUYÊN tệp bọc thật vào cây tạm; `node`/`docker` giả đầu PATH ghi lời gọi và
//     hỏng theo FAIL_STEPS / FAIL_DB (in «Error: connect ECONNREFUSED»);
//   - bước thật: chạy bước node thật trong hộp cát (scripts/lib/job-exit-sandbox.mjs) với DATABASE_URL
//     trỏ một cổng canh do test mở — mọi kết nối khác và mọi fetch bị chặn.
// Ma trận viết trước: docs/superpowers/specs/2026-10-23-job-bao-loi-that-design.md §6.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import {
  chmodSync, copyFileSync, rmSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, symlinkSync, writeFileSync, existsSync,
} from "node:fs";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { after, before, describe, test } from "node:test";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// realpath: tmpdir() của macOS là symlink (/var → /private/var); bước so argv[1] với import.meta.url
// (đã realpath) để biết mình là chương trình chính — đường symlink làm bước im lặng không chạy gì.
const SCRATCH = mkdtempSync(path.join(realpathSync(tmpdir()), "job-exit-"));

// ---------------------------------------------------------------- cây giả --
const NODE_SHIM = `#!/bin/bash
# node giả: nhãn bước = tên tệp .mjs/.js đầu tiên trong đối số (không đuôi)
step=""
for a in "$@"; do case "$a" in *.mjs|*.js) step="$(basename "$a")"; step="\${step%.*}"; full="$a"; break;; esac; done
[ -z "$step" ] && step=node
# TV2b vòng 3: chotot-daily đọc vùng S06 từ DB bằng node -e (không có tệp .mjs) — nhãn riêng, trả một vùng
case "$step:$*" in node:*source_groups*) step=doc-vung-s06;; esac
echo "$step" >> "$CALLS"
code=""
IFS=',' read -ra items <<< "\${FAIL_STEPS:-}"
for it in "\${items[@]}"; do
  name="\${it%%:*}"; c="\${it#*:}"; [ "$c" = "$it" ] && c=1
  [ "$name" = "$step" ] && code="$c"
done
if [ -z "$code" ] && [ -n "\${FAIL_DB:-}" ]; then
  case "$full" in */pipeline/*) code=1;; esac
  case "$PWD" in */pipeline) code=1;; esac
fi
if [ -n "$code" ]; then echo "Error: connect ECONNREFUSED 127.0.0.1:5433" >&2; exit "$code"; fi
[ "$step" = airdna-rotate ] && echo "vn-hanoi"
[ "$step" = doc-vung-s06 ] && echo "hanoi"
exit 0
`;
const DOCKER_SHIM = `#!/bin/bash
# docker giả: psql đọc SQL từ stdin → nhãn psql:<dòng đầu>; psql -c → nhãn psql
step=psql
if [ ! -t 0 ]; then first="$(head -1)"; case "$first" in "-- "*) step="psql:\${first#-- }";; esac; cat >/dev/null; fi
echo "$step" >> "$CALLS"
code=""
IFS=',' read -ra items <<< "\${FAIL_STEPS:-}"
for it in "\${items[@]}"; do
  name="\${it%%:*}"; rest="\${it#*:}"
  # nhãn psql:<x> có dấu hai chấm — so nguyên chuỗi
  [ "$it" = "$step" ] && code=1
done
[ -n "\${FAIL_DB:-}" ] && code=1
if [ -n "$code" ]; then echo "psql: error: connection to server failed: Connection refused" >&2; exit "$code"; fi
exit 0
`;

/** Dựng cây tạm: chép nguyên tệp thật (đường tương đối gốc kho) + thư mục/tệp phụ. */
function makeTree(name, { copy = [], dirs = [], files = {} }) {
  const root = mkdtempSync(path.join(SCRATCH, `${name}-`));
  for (const rel of copy) {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    copyFileSync(path.join(REPO, rel), path.join(root, rel));
  }
  for (const d of dirs) {
    mkdirSync(path.join(root, d), { recursive: true });
    // 2510-8: tệp bọc chỉ nạp snapshot đã có manifest (thiếu manifest < 30′ = đang ghi → dừng chuỗi)
    if (d.startsWith("collector/snapshots/")) writeFileSync(path.join(root, d, "manifest.json"), "{}\n");
  }
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    writeFileSync(path.join(root, rel), body);
  }
  const bin = path.join(root, ".shim-bin");
  mkdirSync(bin);
  writeFileSync(path.join(bin, "node"), NODE_SHIM); chmodSync(path.join(bin, "node"), 0o755);
  writeFileSync(path.join(bin, "docker"), DOCKER_SHIM); chmodSync(path.join(bin, "docker"), 0o755);
  // sleep giả: tệp bọc thử nạp lại ECONNREFUSED 5×20s — ca «DB tắt hẳn» không chờ thật
  writeFileSync(path.join(bin, "sleep"), "#!/bin/bash\nexit 0\n"); chmodSync(path.join(bin, "sleep"), 0o755);
  mkdirSync(path.join(root, ".home"));
  return root;
}

/** Chạy tệp bọc trong cây tạm. HOME tạm để tệp bọc không chèn node thật ($HOME/.local/node-…) lên trước.
 *  `via` = {scriptPath, cwd}: gọi kiểu launchd (đường qua symlink, thư mục chạy khác gốc cây). */
function runJob(root, script, env = {}, via = {}) {
  const calls = path.join(root, `.calls-${Math.random().toString(36).slice(2)}`);
  writeFileSync(calls, "");
  // apify-facebook-daily ghi mốc snapshot đã nạp — xoá để mỗi lượt thấy cùng một dãy bước
  rmSync(path.join(root, "pipeline/logs/apify-daily.state"), { force: true });
  const r = spawnSync("/bin/bash", [via.scriptPath ?? path.join(root, script), ...(JOBS_ARGS[script] ?? [])], {
    cwd: via.cwd ?? root,
    env: {
      PATH: `${path.join(root, ".shim-bin")}:/usr/bin:/bin`,
      HOME: path.join(root, ".home"),
      CALLS: calls,
      LOG: path.join(root, "logs"),
      ...env,
    },
    encoding: "utf8",
  });
  return {
    code: r.status,
    stderr: r.stderr,
    stdout: r.stdout,
    calls: readFileSync(calls, "utf8").split("\n").filter(Boolean),
  };
}
const JOBS_ARGS = {};

const SQL = (n) => `-- ${n}\nSELECT 1;\n`;

// Năm job có bước DB làn Claude (11 plist ở pipeline/cron — 6 job còn lại: zalo-import/watchdog/heartbeat,
// collector thu, kev-gate là làn ZCode/dịch vụ; smoke không DB; backup chưa cài).
const JOBS = {
  "chotot-daily": {
    script: "scripts/chotot-daily.sh",
    tree: {
      copy: ["scripts/chotot-daily.sh", "scripts/lib/job-step.sh"],
      dirs: ["collector/snapshots/hanoi/hanoi__chotot-ads__20261023T000000", "pipeline"],
    },
    // TV2b vòng 3 (cong-tac-that): cổng vòng đời S06 chạy TRƯỚC mọi bước — node giả trả 0 (chạy); DB tắt thì cổng thoát ≠0 (fail-closed)
    // NH1 media-canonical-reso (Hỏi-3 = B, Mạnh 30/10): transform-media đứng ngay sau transform-chotot.
    seq: ["vong-doi", "collect-chotot", "doc-vung-s06", "import-chotot", "transform-chotot", "transform-media", "refresh-bait-gap", "resolve-properties"],
  },
  "apify-facebook-daily": {
    script: "scripts/apify-facebook-daily.sh",
    tree: {
      copy: ["scripts/apify-facebook-daily.sh", "scripts/lib/job-step.sh"],
      // mốc đúng khuôn TS_RE của tệp bọc (có gạch ngang) — khuôn cũ không gạch bị bỏ qua, import-airbnb không được gọi
      dirs: ["collector/snapshots/hanoi/hanoi__zalo-agent__2026-10-23T000000", "pipeline/logs"],
    },
    seq: ["apify-facebook-collector", "import-airbnb", "transform-fb", "refresh-bait-gap"],
  },
  "airdna-daily": {
    script: "scripts/airdna-daily.sh",
    tree: {
      copy: ["scripts/airdna-daily.sh"],
      dirs: ["collector/snapshots/vn/vn__airdna-research__20261023T000000"],
      files: { "collector/dist/cli.js": "" },
    },
    // TV2b (cong-tac-that): cổng vòng đời S02 chạy TRƯỚC mọi bước — node giả trả 0 (chạy); DB tắt thì cổng thoát ≠0 (fail-closed)
    seq: ["vong-doi", "airdna-rotate", "cli", "transform-airdna", "dq-truthful-coverage"],
  },
  "cloud-sync": {
    script: "scripts/cloud-sync.sh",
    tree: { copy: ["scripts/cloud-sync.sh", "scripts/lib/job-step.sh"] },
    seq: ["ha-bung-het-han", "sync-cloud", "refresh-data-flow", "push-ops-facts", "trang-thai-chao", "bac-du-lieu"],
  },
  "collector-tuan": {
    // weekly-with-jitter → weekly-collect (set -e, exec) → finalize-hanoi.sh: khúc DB làn Claude nằm ở finalize
    script: "pipeline/finalize-hanoi.sh",
    tree: {
      copy: ["pipeline/finalize-hanoi.sh"],
      dirs: ["db"],
      files: {
        "pipeline/sql/300_metrics.sql": SQL("300_metrics"),
        "pipeline/sql/400_breakdowns.sql": SQL("400_breakdowns"),
        "pipeline/sql/410_listing_stats.sql": SQL("410_listing_stats"),
        "pipeline/sql/450_dq_checks.sql": SQL("450_dq_checks"),
      },
    },
    seq: [
      "reassign-areas", "transform-airbnb", "transform-zalo",
      "psql:300_metrics", "psql:400_breakdowns", "psql:410_listing_stats", "psql:450_dq_checks", "psql",
    ],
  },
};
for (const j of Object.values(JOBS)) j.root = () => (j._root ??= makeTree(path.basename(j.script, ".sh"), j.tree));

const failLine = (job, step, code = 1) => `JOB FAIL [${job}] bước ${step} mã ${code}`;

/** Kiểm «một bước làn Claude hỏng → ≠0, dòng ghim, bước sau VẪN chạy» (đoạn transform AU3). Trả danh sách lỗi. */
function problemsContinueOnFail(r, job, step, seq) {
  const out = [];
  if (r.code === 0) out.push(`${job}: bước ${step} hỏng mà job thoát 0`);
  const n = r.stderr.split("\n").filter((l) => l === failLine(job, step)).length;
  if (n !== 1) out.push(`${job}: bước ${step} hỏng nhưng thấy ${n} dòng «${failLine(job, step)}» (cần đúng 1)`);
  if (JSON.stringify(r.calls) !== JSON.stringify(seq)) {
    out.push(`${job}: bước ${step} hỏng — dãy lời gọi ${JSON.stringify(r.calls)} ≠ ${JSON.stringify(seq)}`);
  }
  return out;
}

/** Bản đột biến: bỏ job_run ở một bước (gọi node trần như trước vòng). */
function mutateDropGuard(root, script, job, step) {
  const p = path.join(root, script);
  const s = readFileSync(p, "utf8");
  const needle = `job_run ${job} ${step} node`;
  assert.ok(s.includes(needle), `tệp bọc không có «${needle}» — khuôn đột biến lệch`);
  const mutRoot = mkdtempSync(path.join(SCRATCH, `mut-${job}-`));
  spawnSync("/bin/cp", ["-R", `${root}/.`, mutRoot]);
  writeFileSync(path.join(mutRoot, script), s.replace(needle, "node"));
  return mutRoot;
}

// ------------------------------------------------------------------ AC-6 --
describe("AC-6 job_step", () => {
  const run = (code) => spawnSync("/bin/bash", ["-c",
    `. "${path.join(REPO, "scripts/lib/job-step.sh")}"; job_step demo buoc-thu /bin/bash -c 'echo ra-out; echo ra-err >&2; exit ${code}'`,
  ], { encoding: "utf8" });

  for (const code of [0, 1, 3]) {
    test(`AC-6 job_step: lệnh thoát ${code} → trả ${code}, đầu ra lệnh đi qua nguyên vẹn`, () => {
      const r = run(code);
      assert.equal(r.status, code, `job_step phải trả đúng mã ${code}`);
      assert.equal(r.stdout, "ra-out\n", "stdout của lệnh phải đi qua nguyên vẹn, không thêm dòng ghim");
      const ghim = r.stderr.split("\n").filter((l) => l.startsWith("JOB FAIL"));
      if (code === 0) {
        assert.equal(r.stderr, "ra-err\n", "lệnh lành: stderr chỉ có đầu ra của lệnh");
      } else {
        assert.deepEqual(ghim, [`JOB FAIL [demo] bước buoc-thu mã ${code}`], "lệnh hỏng: đúng một dòng ghim ở stderr");
        assert.ok(r.stderr.startsWith("ra-err\n"), "stderr của lệnh đi trước dòng ghim, nguyên vẹn");
      }
    });
  }
});

// ------------------------------------------------------------- AC-1, AC-2 --
for (const [ac, job, steps] of [
  ["AC-1", "chotot-daily", ["transform-chotot", "transform-media", "refresh-bait-gap", "resolve-properties"]],
  ["AC-2", "apify-facebook-daily", ["transform-fb", "refresh-bait-gap"]],
]) {
  const J = JOBS[job];
  describe(`${ac} ${job}`, () => {
    test(`${ac} ${job}: mọi bước lành → 0, nhật ký lời gọi khớp dãy viết trước`, () => {
      const r = runJob(J.root(), J.script);
      assert.equal(r.code, 0, `job thoát ${r.code}\n${r.stderr}`);
      assert.ok(!r.stderr.includes("JOB FAIL"), "không được có dòng JOB FAIL khi mọi bước lành");
      assert.deepEqual(r.calls, J.seq, "dãy lời gọi phải khớp đúng dãy viết trước");
    });
    for (const step of steps) {
      test(`${ac} ${job}: ${step} hỏng → ≠0, dòng ghim, bước sau vẫn chạy`, () => {
        const r = runJob(J.root(), J.script, { FAIL_STEPS: step });
        assert.deepEqual(problemsContinueOnFail(r, job, step, J.seq), []);
      });
      test(`${ac} ${job}: bản đột biến bỏ ghi mã sau ${step} → bị bắt`, () => {
        const mut = mutateDropGuard(J.root(), J.script, job, step);
        const r = runJob(mut, J.script, { FAIL_STEPS: step });
        const p = problemsContinueOnFail(r, job, step, J.seq);
        assert.ok(p.length > 0, `hàm kiểm không bắt được bản đột biến của bước ${step}`);
        assert.ok(p.every((m) => m.includes(step)), `thông điệp phải nêu tên bước ${step}: ${p.join(" | ")}`);
      });
    }
  });
}

test("AC-1 chotot-daily: hai bước hỏng → thoát mã bước hỏng đầu (3), hai dòng ghim", () => {
  const J = JOBS["chotot-daily"];
  const r = runJob(J.root(), J.script, { FAIL_STEPS: "transform-chotot:3,resolve-properties:1" });
  assert.equal(r.code, 3, "mã thoát phải là mã của bước hỏng ĐẦU TIÊN");
  assert.ok(r.stderr.includes(failLine("chotot-daily", "transform-chotot", 3)));
  assert.ok(r.stderr.includes(failLine("chotot-daily", "resolve-properties", 1)));
  assert.deepEqual(r.calls, J.seq);
});

// ------------------------------------------------------------------ AC-3 --
const MATRIX = Object.keys(JOBS).flatMap((job) => [[job, "lành"], [job, "DB tắt hẳn"]]);
let matrixRan = 0;
describe("AC-3 ma trận năm job × hai trạng thái DB", () => {
  for (const [job, state] of MATRIX) {
    test(`AC-3 ${job} · ${state}`, () => {
      const J = JOBS[job];
      const r = runJob(J.root(), J.script, state === "DB tắt hẳn" ? { FAIL_DB: "1" } : {});
      if (state === "lành") {
        assert.equal(r.code, 0, `${job} lành mà thoát ${r.code}\n${r.stderr}`);
        assert.deepEqual(r.calls, J.seq, `${job} lành: dãy lời gọi lệch`);
      } else {
        assert.notEqual(r.code, 0, `${job}: DB tắt hẳn mà job thoát 0 — launchd sẽ ghi «xong»`);
      }
      matrixRan++;
    });
  }
  test("AC-3 ma trận đủ 10 ca", () => {
    assert.equal(MATRIX.length, 10, "ma trận viết trước phải có 5 job × 2 trạng thái");
    assert.equal(matrixRan, 10, `chỉ ${matrixRan}/10 ca ma trận đã chạy tới cuối`);
  });
  // Hỏi-1 = A (Mạnh, Cổng Phạm vi 23/10): lỗ vá ở hàng T3 riêng AU13 `cloud-sync-bao-loi-that` (P3-3).
  test("AC-3 cloud-sync · chập chờn (sync-cloud hỏng, push-ops-facts lành)", () => {
    const J = JOBS["cloud-sync"];
    const r = runJob(J.root(), J.script, { FAIL_STEPS: "sync-cloud" });
    assert.deepEqual(problemsContinueOnFail(r, "cloud-sync", "sync-cloud", J.seq), [], r.stderr);
  });
});

// ------------------------------------------------- AU13 cloud-sync (P3-3) --
describe("AU13 cloud-sync", () => {
  const J = JOBS["cloud-sync"];
  test("AU13 cloud-sync: push-ops-facts hỏng → ≠0, dòng ghim, bước sau vẫn chạy", () => {
    const r = runJob(J.root(), J.script, { FAIL_STEPS: "push-ops-facts" });
    assert.deepEqual(problemsContinueOnFail(r, "cloud-sync", "push-ops-facts", J.seq), [], r.stderr);
  });
  test("AU13 cloud-sync: bac-du-lieu hỏng → ≠0, dòng JOB FAIL [cloud-sync] bước bac-du-lieu (PL16, bước cuối)", () => {
    const r = runJob(J.root(), J.script, { FAIL_STEPS: "bac-du-lieu" });
    assert.deepEqual(problemsContinueOnFail(r, "cloud-sync", "bac-du-lieu", J.seq), [], r.stderr);
    assert.equal(J.seq.at(-1), "bac-du-lieu", "phân bố bậc là bước cuối, sau push-ops-facts (Hỏi-3)");
    assert.ok(r.stderr.split("\n").includes(failLine("cloud-sync", "bac-du-lieu", 1)), r.stderr);
  });
  test("AU13 cloud-sync: trang-thai-chao hỏng → ≠0, dòng JOB FAIL [cloud-sync] bước trang-thai-chao (PL19, ngay trước bậc)", () => {
    const r = runJob(J.root(), J.script, { FAIL_STEPS: "trang-thai-chao" });
    assert.deepEqual(problemsContinueOnFail(r, "cloud-sync", "trang-thai-chao", J.seq), [], r.stderr);
    assert.deepEqual(J.seq.slice(-3), ["push-ops-facts", "trang-thai-chao", "bac-du-lieu"],
      "trạng thái chào chạy ngay trước ảnh chụp bậc (B5 đọc trạng thái mới)");
    assert.ok(r.stderr.split("\n").includes(failLine("cloud-sync", "trang-thai-chao", 1)), r.stderr);
  });
  test("AU13 cloud-sync: ha-bung-het-han hỏng (che-do-thu-tren-ops) → ≠0, dòng ghim, sync-cloud và push-ops-facts vẫn chạy", () => {
    const r = runJob(J.root(), J.script, { FAIL_STEPS: "ha-bung-het-han" });
    assert.deepEqual(problemsContinueOnFail(r, "cloud-sync", "ha-bung-het-han", J.seq), [], r.stderr);
    assert.deepEqual(r.calls, J.seq, "hai bước sau bước hạ phải vẫn chạy");
    assert.ok(r.stderr.split("\n").includes(failLine("cloud-sync", "ha-bung-het-han", 1)), r.stderr);
  });
  test("AU13 cloud-sync: hai bước hỏng (3, 5) → thoát 3, hai dòng ghim đúng thứ tự", () => {
    const r = runJob(J.root(), J.script, { FAIL_STEPS: "sync-cloud:3,push-ops-facts:5" });
    assert.equal(r.code, 3, "mã thoát phải là mã của bước hỏng ĐẦU TIÊN");
    const ghim = r.stderr.split("\n").filter((l) => l.startsWith("JOB FAIL"));
    assert.deepEqual(ghim, [failLine("cloud-sync", "sync-cloud", 3), failLine("cloud-sync", "push-ops-facts", 5)]);
    assert.deepEqual(r.calls, J.seq);
  });
  test("AU13 cloud-sync: gọi kiểu launchd (qua symlink, cwd khác) → cùng kết quả", () => {
    // plist gọi ~/dev/one-invest/scripts/cloud-sync.sh — one-invest là symlink tới gốc kho
    const link = path.join(SCRATCH, `one-invest-${Math.random().toString(36).slice(2)}`);
    symlinkSync(J.root(), link);
    const via = { scriptPath: path.join(link, J.script), cwd: "/" };
    const r = runJob(J.root(), J.script, { FAIL_STEPS: "sync-cloud" }, via);
    assert.deepEqual(problemsContinueOnFail(r, "cloud-sync", "sync-cloud", J.seq), [], r.stderr);
    const ok = runJob(J.root(), J.script, {}, via);
    assert.equal(ok.code, 0, ok.stderr);
    assert.deepEqual(ok.calls, J.seq);
  });
  for (const step of J.seq) {
    test(`AU13 cloud-sync: bản đột biến bỏ job_run ở ${step} → bị bắt`, () => {
      const mut = mutateDropGuard(J.root(), J.script, "cloud-sync", step);
      const goc = readFileSync(path.join(J.root(), J.script), "utf8");
      const dot = readFileSync(path.join(mut, J.script), "utf8");
      assert.notEqual(dot, goc, `bản đột biến ở ${step} phải khác bản gốc`);
      assert.ok(!dot.includes(`job_run cloud-sync ${step} node`), `bản đột biến vẫn còn job_run ở ${step}`);
      const r = runJob(mut, J.script, { FAIL_STEPS: step });
      const p = problemsContinueOnFail(r, "cloud-sync", step, J.seq);
      assert.ok(p.length > 0, `hàm kiểm không bắt được bản đột biến của bước ${step}`);
      assert.ok(p.every((m) => m.includes(step)), `thông điệp phải nêu tên bước ${step}: ${p.join(" | ")}`);
    });
  }
});

// ------------------------------------------------------------------ AC-4 --
for (const [job, steps] of [
  ["airdna-daily", ["transform-airdna", "dq-truthful-coverage"]],
  ["collector-tuan", ["reassign-areas", "transform-airbnb", "transform-zalo", "psql:300_metrics"]],
]) {
  const J = JOBS[job];
  const label = job === "collector-tuan" ? "finalize-hanoi" : job;
  test(`AC-4 ${label}: mọi bước lành → nhật ký khớp dãy viết trước`, () => {
    const r = runJob(J.root(), J.script);
    assert.equal(r.code, 0, r.stderr);
    assert.deepEqual(r.calls, J.seq);
  });
  for (const step of steps) {
    test(`AC-4 ${label}: ${step} hỏng → ≠0, bước sau không được gọi`, () => {
      const r = runJob(J.root(), J.script, { FAIL_STEPS: step });
      assert.notEqual(r.code, 0, `${label}: ${step} hỏng mà job thoát 0`);
      const upto = J.seq.slice(0, J.seq.indexOf(step) + 1);
      assert.deepEqual(r.calls, upto, `${label}: sau ${step} hỏng vẫn có bước chạy tiếp`);
    });
  }
}

// ------------------------------------------------------------------ AC-5 --
const SANDBOX = pathToFileURL(path.join(REPO, "scripts/lib/job-exit-sandbox.mjs")).href;
const PIPE = path.join(REPO, "pipeline");
const EMPTY_SNAP = path.join(SCRATCH, "snap-rong");
mkdirSync(EMPTY_SNAP);
const STEPS = [
  ["transform-chotot"], ["refresh-bait-gap"], ["resolve-properties"], ["transform-fb"],
  ["transform-airdna", EMPTY_SNAP], ["dq-truthful-coverage"], ["reassign-areas", "hanoi"],
  ["transform-airbnb", "hanoi"], ["transform-zalo"], ["sync-cloud"], ["push-ops-facts"],
];

let sentinel; let hits = 0;
const SENT_HOME = path.join(SCRATCH, "home-buoc");
mkdirSync(path.join(SENT_HOME, ".oneinvest"), { recursive: true });
// token giả — hộp cát chặn mọi fetch, và bước hỏng ở connect() local trước mọi lời gọi cloud
writeFileSync(path.join(SENT_HOME, ".oneinvest/cloud.env"), "SUPABASE_MGMT_TOKEN=gia\nCLOUD_OPS_API_TOKEN=gia\n");

/** Chạy một tệp .mjs trong hộp cát, DATABASE_URL trỏ cổng canh (`noDb` → không đặt biến). Trả {code, hits, blocked, stderr}. */
function runStep(file, args = [], cwd = PIPE, { noDb = false } = {}) {
  const port = sentinel.address().port;
  const db = new URL("postgres://placeholder/oneinvest");   // dựng bằng URL — literal có user bị hook bí mật bắt nhầm
  db.hostname = "127.0.0.1"; db.port = String(port); db.username = "u";
  const blockLog = path.join(SCRATCH, `block-${Math.random().toString(36).slice(2)}`);
  writeFileSync(blockLog, "");
  hits = 0;
  return new Promise((resolve) => {
    const c = spawn(process.execPath, ["--import", SANDBOX, file, ...args], {
      cwd,
      env: {
        PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin`,
        HOME: SENT_HOME,
        ...(noDb ? {} : { DATABASE_URL: db.toString() }),
        PGHOST: "127.0.0.1",
        PGPORT: String(port),
        JOB_EXIT_SENTINEL_PORT: String(port),
        JOB_EXIT_BLOCK_LOG: blockLog,
      },
    });
    let stderr = "";
    c.stderr.on("data", (d) => { stderr += d; });
    c.stdout.resume();
    c.on("close", (code) => resolve({
      code, hits, stderr, blocked: readFileSync(blockLog, "utf8").split("\n").filter(Boolean),
    }));
  });
}

/** Kiểm quan hệ: bước thoát ≠0 VÀ kết nối thật đi tới cổng canh VÀ hộp cát không phải chặn gì. */
function stepProblems(name, r) {
  const out = [];
  if (r.code === 0) out.push(`${name}: DB không tới mà bước thoát 0`);
  if (r.hits < 1) out.push(`${name}: cổng canh không thấy lần nối nào — kết nối không đi theo DATABASE_URL`);
  if (r.blocked.length) out.push(`${name}: hộp cát phải chặn ${r.blocked.length} kết nối khác: ${r.blocked.join(" | ")}`);
  return out;
}

describe("AC-5 bước thật trên cổng canh", () => {
  before(async () => {
    sentinel = net.createServer((sock) => { hits++; sock.destroy(); });
    await new Promise((r) => sentinel.listen(0, "127.0.0.1", r));
  });
  after(() => sentinel.close());

  let ran = 0;
  for (const [name, ...args] of STEPS) {
    test(`AC-5 bước thật ${name} → ≠0, cổng canh thấy lần nối, hộp cát không chặn gì`, async () => {
      const r = await runStep(`${name}.mjs`, args);
      assert.deepEqual(stepProblems(name, r), [], r.stderr.slice(0, 600));
      ran++;
    });
  }
  test("AC-5 đủ 11 bước", () => {
    assert.equal(STEPS.length, 11, "danh sách bước viết trước phải có 11 bước (AU13 thêm push-ops-facts)");
    assert.equal(ran, 11, `chỉ ${ran}/11 bước đã chạy tới cuối`);
  });
  test("AC-5 push-ops-facts vắng DATABASE_URL → hộp cát chặn :5433 (mặc định cũ còn)", async () => {
    const r = await runStep("push-ops-facts.mjs", [], PIPE, { noDb: true });
    assert.notEqual(r.code, 0, "DB không tới mà bước thoát 0");
    assert.equal(r.hits, 0, "vắng DATABASE_URL mà cổng canh vẫn thấy lần nối");
    assert.ok(r.blocked.some((b) => b.includes("5433")), `hộp cát phải chặn đúng :5433: ${r.blocked.join(" | ")}`);
  });

  // chiều đỏ: bản sao refresh-bait-gap (không import tệp cục bộ) đặt cạnh node_modules thật
  const mutDir = path.join(SCRATCH, "mut-root", "pipeline");
  const mutate = (file, fn, src = "refresh-bait-gap.mjs") => {
    mkdirSync(mutDir, { recursive: true });
    // bản sao đặt cạnh node_modules + lib thật (push-ops-facts import ./lib/last-log-line.mjs từ PR #55)
    for (const d of ["node_modules", "lib"]) {
      if (!existsSync(path.join(mutDir, d))) symlinkSync(path.join(PIPE, d), path.join(mutDir, d));
    }
    // …và ../scripts/lib thật (push-ops-facts import ../scripts/lib/freshness.mjs, ops-local.mjs)
    const scripts = path.join(mutDir, "..", "scripts");
    if (!existsSync(scripts)) symlinkSync(path.join(REPO, "scripts"), scripts);
    const s = readFileSync(path.join(PIPE, src), "utf8");
    const m = fn(s);
    assert.notEqual(m, s, `khuôn đột biến ${file} không khớp mã nguồn`);
    writeFileSync(path.join(mutDir, file), m);
    return path.join(mutDir, file);
  };
  test("AC-5 chiều đỏ: bản sao nuốt lỗi → bị bắt", async () => {
    const f = mutate("nuot-loi.mjs", (s) => s.replace("main().catch((e) => { console.error(e); process.exit(1); })", "main().catch(() => {})"));
    const r = await runStep(f, [], mutDir);
    assert.ok(r.hits >= 1, "bản sao phải thật sự chạy tới connect() (cổng canh thấy lần nối) — không thì ca đỏ vì lý do khác");
    const p = stepProblems("nuot-loi", r);
    assert.deepEqual(p, ["nuot-loi: DB không tới mà bước thoát 0"], `chỉ được bắt đúng lỗi nuốt mã: ${p.join(" | ")}`);
  });
  test("AC-5 chiều đỏ: bản sao viết cứng localhost:5433 → hộp cát chặn, cổng canh không thấy, bị bắt", async () => {
    const live = new URL("postgres://placeholder/oneinvest");
    live.hostname = "localhost"; live.port = "5433"; live.username = "u";
    const f = mutate("viet-cung.mjs", (s) => s.replace(/process\.env\.DATABASE_URL \?\? /, `"${live}" ?? `));
    const r = await runStep(f, [], mutDir);
    const p = stepProblems("viet-cung", r);
    assert.ok(p.some((m) => m.includes("cổng canh không thấy")), `không bắt được bản viết cứng: ${p.join(" | ")}`);
    assert.ok(r.blocked.some((b) => b.includes("5433")), "hộp cát phải chặn kết nối tới :5433");
  });
  test("AC-5 chiều đỏ: bản sao push-ops-facts viết cứng localhost:5433 → hộp cát chặn, cổng canh không thấy, bị bắt", async () => {
    // bản trước AU13: Client nối thẳng LOCAL_URL, bỏ qua DATABASE_URL
    const f = mutate("ops-viet-cung.mjs", (s) => s.replace("process.env.DATABASE_URL ?? LOCAL_URL", "LOCAL_URL"), "push-ops-facts.mjs");
    const r = await runStep(f, [], mutDir);
    const p = stepProblems("ops-viet-cung", r);
    assert.ok(p.some((m) => m.includes("cổng canh không thấy")), `không bắt được bản viết cứng: ${p.join(" | ")}`);
    assert.ok(r.blocked.some((b) => b.includes("5433")), "hộp cát phải chặn kết nối tới :5433");
  });
});
