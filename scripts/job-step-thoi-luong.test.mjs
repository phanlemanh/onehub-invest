// node --test scripts/job-step-thoi-luong.test.mjs
// job-step-ghi-thoi-luong: mỗi bước của job nạp in một dòng ghim ra stderr kèm giây treo —
//   JOB STEP [<job>] bước <nhãn> mã <n> giây <s> nhanh <c>
// Vòng KHÔNG mở và KHÔNG ghi tệp nào: hai plist của job nạp đã đổ cả stdout lẫn stderr vào log
// riêng của từng lượt (s03-nap-15phut.log, zalo-import.log), nên dòng ghim đã nằm sẵn trong một
// tệp đọc được.
//
// Khuôn đo (như scripts/job-exit.test.mjs, scripts/s03-nap-nhanh.test.mjs): chép NGUYÊN
// scripts/lib/job-step.sh (và tệp bọc thật ở Task 2) vào cây tạm; `node`/`date`/`sleep` giả đầu
// PATH; HOME tạm. Không node thật, không DB, không mạng.
//
// Chiều đỏ của mọi ca: bản sao job-step.sh (hay tệp bọc) bị đột biến trong CÙNG cây tạm, rồi đòi
// đúng ca ấy đỏ. Ma trận viết trước ở _acceptance/job-step-ghi-thoi-luong/evals.yaml.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync,
  rmSync, statSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, test } from "node:test";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LIB = "scripts/lib/job-step.sh";
// realpath: tmpdir() của macOS là symlink (/var → /private/var) — đường symlink làm phép so cây và
// phép so stdout lệch nhau giữa hai lượt.
const SCRATCH = mkdtempSync(path.join(realpathSync(tmpdir()), "job-step-tl-"));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));

let dem = 0;

/** Cây tạm chỉ có thư viện; `doiBan` đột biến bản chép để dựng chiều đỏ. */
function cayLib(doiBan = (s) => s) {
  const root = mkdtempSync(path.join(SCRATCH, "lib-"));
  mkdirSync(path.join(root, "scripts/lib"), { recursive: true });
  writeFileSync(path.join(root, LIB), doiBan(readFileSync(path.join(REPO, LIB), "utf8")));
  return root;
}

/** Ghi một tệp bọc thử nạp thư viện rồi chạy `than`; trả đường dẫn. */
function tepBoc(root, than) {
  const f = path.join(root, `thu-${++dem}.sh`);
  writeFileSync(f, `#!/bin/bash\n. "${path.join(root, LIB)}"\n${than}\n`);
  chmodSync(f, 0o755);
  return f;
}

function chay(tep, { cwd, env = {}, home } = {}) {
  const root = path.dirname(tep);
  return spawnSync("/bin/bash", [tep], {
    cwd: cwd || root,
    encoding: "utf8",
    env: { PATH: "/usr/bin:/bin", HOME: home || root, ...env },
  });
}

/** Chạy thẳng một thân bash trên cây mới — lối tắt cho ca không cần giữ tệp bọc. */
function chayThan(root, than, opts) {
  return chay(tepBoc(root, than), opts);
}

const dongGhim = (err) => err.split("\n").filter((l) => /^JOB STEP /.test(l));
const dongHong = (err) => err.split("\n").filter((l) => /^JOB FAIL /.test(l));
const KHUON = /^JOB STEP \[[^\]]+\] bước \S+ mã \d+ giây \d+ nhanh [01]$/;

function buoc(err, nhan) {
  const d = dongGhim(err).find((l) => l.includes(` bước ${nhan} `));
  assert.ok(d, `không có dòng ghim cho bước ${nhan}:\n${err}`);
  const m = /mã (\d+) giây (\d+) nhanh ([01])$/.exec(d);
  assert.ok(m, `dòng ghim sai khuôn: ${d}`);
  return { dong: d, ma: Number(m[1]), giay: Number(m[2]), nhanh: Number(m[3]) };
}

/** Ảnh chụp cây: đường → "cỡ:mtimeMs", duyệt đệ quy. */
function anhChup(root) {
  const ra = new Map();
  const di = (d) => {
    for (const t of readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, t.name);
      if (t.isDirectory()) di(p);
      else {
        const s = statSync(p);
        ra.set(path.relative(root, p), `${s.size}:${s.mtimeMs}`);
      }
    }
  };
  di(root);
  return ra;
}

function soCay(truoc, sau) {
  const moi = [...sau.keys()].filter((k) => !truoc.has(k));
  const doi = [...sau.keys()].filter((k) => truoc.has(k) && truoc.get(k) !== sau.get(k));
  const mat = [...truoc.keys()].filter((k) => !sau.has(k));
  return { moi, doi, mat };
}

// ---------------------------------------------------------------- JST-AC-1 --
test("JST-AC-1 bước mã 0: đúng một dòng ghim, không JOB FAIL, stdout không đổi", () => {
  const root = cayLib();
  const r = chayThan(root, `job_step jst-thu xanh /bin/echo xin-chao`);

  assert.equal(r.status, 0);
  const g = dongGhim(r.stderr);
  assert.equal(g.length, 1, `phải đúng một dòng ghim, có ${g.length}:\n${r.stderr}`);
  assert.match(g[0], /^JOB STEP \[jst-thu\] bước xanh mã 0 giây \d+ nhanh [01]$/);
  assert.equal(dongHong(r.stderr).length, 0, "bước xanh không được có dòng JOB FAIL");

  // stdout phải bằng ĐÚNG BYTE đầu ra của chính lệnh ấy khi chạy không qua job_step
  const truc = spawnSync("/bin/echo", ["xin-chao"], { encoding: "utf8" });
  assert.equal(r.stdout, truc.stdout);
});

// ---------------------------------------------------------------- JST-AC-2 --
test("JST-AC-2 giây là số đo: bước ngủ ≥ 2, bước tức thì ≤ 1", () => {
  const root = cayLib();
  const r = chayThan(root, [
    `job_step jst-thu cham /bin/sleep 2`,
    `job_step jst-thu tucthi /usr/bin/true`,
  ].join("\n"));

  assert.equal(r.status, 0);
  assert.ok(buoc(r.stderr, "cham").giay >= 2, `bước ngủ phải ≥ 2 giây:\n${r.stderr}`);
  assert.ok(buoc(r.stderr, "tucthi").giay <= 1, `bước tức thì phải ≤ 1 giây:\n${r.stderr}`);
});

// ---------------------------------------------------------------- JST-AC-3 --
test("JST-AC-3 bốn mã thoát: mã giữ nguyên, dòng ghim đứng trước JOB FAIL nguyên văn", () => {
  for (const ma of [1, 3, 42, 127]) {
    const root = cayLib();
    const r = chayThan(root, `job_step jst-thu do /bin/sh -c 'exit ${ma}'; echo "ra=$?"`);

    assert.equal(buoc(r.stderr, "do").ma, ma);
    assert.ok(r.stdout.includes(`ra=${ma}`), `job_step phải trả đúng mã ${ma}:\n${r.stdout}`);

    const dong = r.stderr.split("\n");
    const iGhim = dong.findIndex((l) => /^JOB STEP \[jst-thu\] bước do /.test(l));
    const iHong = dong.findIndex((l) => l === `JOB FAIL [jst-thu] bước do mã ${ma}`);
    assert.ok(iHong >= 0, `dòng JOB FAIL phải giữ NGUYÊN VĂN:\n${r.stderr}`);
    assert.ok(iGhim >= 0 && iGhim < iHong, "dòng ghim phải đứng TRƯỚC dòng JOB FAIL");
  }
});

// ---------------------------------------------------------------- JST-AC-4 --
test("JST-AC-4 job_run: luôn trả 0, JOB_RC giữ mã hỏng ĐẦU TIÊN, mỗi bước một dòng ghim", () => {
  const root = cayLib();
  const r = chayThan(root, [
    `job_run jst-thu xanh /usr/bin/true; echo "rc=$?"`,
    `job_run jst-thu do3 /bin/sh -c 'exit 3'; echo "rc=$?"`,
    `job_run jst-thu do4 /bin/sh -c 'exit 4'; echo "rc=$?"`,
    `exit "$JOB_RC"`,
  ].join("\n"));

  assert.equal(r.status, 3, "JOB_RC phải là mã hỏng ĐẦU TIÊN, không bị mã sau đè");
  assert.deepEqual(r.stdout.trim().split("\n"), ["rc=0", "rc=0", "rc=0"], "job_run luôn trả 0");
  assert.equal(dongGhim(r.stderr).length, 3);
  assert.deepEqual(
    ["xanh", "do3", "do4"].map((n) => buoc(r.stderr, n).ma),
    [0, 3, 4],
  );
});

// ---------------------------------------------------------------- JST-AC-5 --
test("JST-AC-5 ma trận cờ: chỉ đúng chuỗi 1 mới là lượt nhanh", () => {
  const o = [
    [{ S03_LUOT_NHANH: "1" }, 1],
    [{}, 0],
    [{ S03_LUOT_NHANH: "0" }, 0],
    [{ S03_LUOT_NHANH: "true" }, 0],
  ];
  for (const [env, mong] of o) {
    const root = cayLib();
    const r = chayThan(root, [
      `job_step jst-thu a /usr/bin/true`,
      `job_step jst-thu b /usr/bin/true`,
      `job_step jst-thu c /usr/bin/true`,
    ].join("\n"), { env });

    const g = dongGhim(r.stderr);
    assert.equal(g.length, 3);
    for (const d of g) assert.match(d, KHUON, `dòng sai khuôn với env ${JSON.stringify(env)}`);
    for (const n of ["a", "b", "c"]) {
      assert.equal(buoc(r.stderr, n).nhanh, mong, `cờ ${JSON.stringify(env)} phải cho nhanh ${mong}`);
    }
  }
});

// ---------------------------------------------------------------- JST-AC-6 --
test("JST-AC-6 cây còn y nguyên, và lượt chạy được trong thư mục chỉ đọc", () => {
  const root = cayLib();
  const than = [
    `job_step jst-thu xanh /bin/echo mot-dong`,
    `job_step jst-thu do5 /bin/sh -c 'exit 5'`,
    `exit 7`,
  ].join("\n");

  // (1) không tệp mới, không tệp đổi
  const tep = tepBoc(root, than);
  const truoc = anhChup(root);
  const r1 = chay(tep);
  const { moi, doi, mat } = soCay(truoc, anhChup(root));
  assert.deepEqual(moi, [], "vòng không được tạo tệp nào");
  assert.deepEqual(doi, [], "vòng không được đổi tệp nào");
  assert.deepEqual(mat, [], "vòng không được xoá tệp nào");

  // (2) thư mục làm việc và HOME đều chỉ đọc
  const lv = path.join(root, "lv");
  const nha = path.join(root, "nha");
  mkdirSync(lv);
  mkdirSync(nha);
  chmodSync(lv, 0o500);
  chmodSync(nha, 0o500);
  let r2;
  try {
    r2 = chay(tep, { cwd: lv, home: nha });
  } finally {
    chmodSync(lv, 0o700);
    chmodSync(nha, 0o700);
  }

  assert.equal(r2.status, r1.status, "mã thoát không được đổi vì môi trường chỉ đọc");
  assert.equal(dongGhim(r2.stderr).length, 2, "cả hai dòng ghim vẫn phải in ra stderr");
  assert.equal(r2.stdout, r1.stdout, "stdout phải bằng ĐÚNG BYTE lượt thường");
  const ra = r2.stdout + r2.stderr;
  assert.ok(!ra.includes("Permission denied"), `đầu ra lọt lỗi ghi:\n${ra}`);
  assert.ok(!ra.includes("No such file"), `đầu ra lọt lỗi ghi:\n${ra}`);
});

// -------------------------------------------------------------------- RF-1 --
test("RF-1 đồng hồ lùi giữa bước: giây về 0, không bao giờ âm", () => {
  const root = cayLib();
  const bin = path.join(root, "bin-gio");
  mkdirSync(bin);
  // date giả: lần gọi đầu trả mốc lớn, lần sau trả mốc NHỎ HƠN (NTP bước lùi)
  writeFileSync(path.join(bin, "date"), [
    "#!/bin/bash",
    'n=$(cat "$DEM" 2>/dev/null || echo 0); n=$((n + 1)); echo "$n" > "$DEM"',
    'if [ "$n" = "1" ]; then echo 1000000; else echo 999993; fi',
  ].join("\n") + "\n");
  chmodSync(path.join(bin, "date"), 0o755);

  const r = chayThan(root, `job_step jst-thu lui /usr/bin/true`, {
    env: { PATH: `${bin}:/usr/bin:/bin`, DEM: path.join(bin, ".dem") },
  });

  assert.equal(buoc(r.stderr, "lui").giay, 0, `đồng hồ lùi phải cho giây 0:\n${r.stderr}`);
});

// -------------------------------------------------------------------- RF-2 --
test("RF-2 bước bị SIGTERM: mã 143 giữ nguyên, vẫn có dòng ghim và JOB FAIL", () => {
  const root = cayLib();
  const r = chayThan(root, `job_step jst-thu giet /bin/sh -c 'kill -TERM $$'; echo "ra=$?"`);

  assert.equal(buoc(r.stderr, "giet").ma, 143);
  assert.ok(r.stdout.includes("ra=143"));
  assert.ok(r.stderr.includes("JOB FAIL [jst-thu] bước giet mã 143"));
});

// -------------------------------------------------------------------- RF-3 --
test("RF-3 JOB_RC chưa đặt: lượt đầu vẫn chạy, JOB_RC nhận mã hỏng", () => {
  const root = cayLib();
  const r = chayThan(root, `job_run jst-thu do5 /bin/sh -c 'exit 5'; echo "JOB_RC=$JOB_RC"`);

  assert.equal(r.status, 0);
  assert.ok(r.stdout.includes("JOB_RC=5"), `JOB_RC phải nhận mã hỏng:\n${r.stdout}`);
});

// -------------------------------------------------------------------- RF-5 --
test("RF-5 stderr lệnh không có newline cuối: bộ đọc không neo đầu dòng vẫn thấy dòng ghim", () => {
  const root = cayLib();
  const r = chayThan(root, `job_step jst-thu dinh /bin/sh -c 'printf du-dang >&2'`);

  // hành vi giữ y như dòng JOB FAIL cũ: không chen thêm ký tự xuống dòng
  assert.ok(r.stderr.includes("du-dangJOB STEP [jst-thu] bước dinh "), `stderr:\n${r.stderr}`);
  // nên bộ đọc ở design §4.4 dùng grep KHÔNG neo đầu dòng
  assert.ok(r.stderr.includes("JOB STEP ["), "bộ đọc không neo đầu dòng vẫn phải thấy dòng ghim");
});

// ------------------------------------------------------- chiều đỏ Task 1 ----
// Mỗi ô: bản sao job-step.sh bị đột biến trong CÙNG cây tạm, rồi đòi đúng ca ấy ĐỎ.
test("chiều đỏ: bản đột biến làm đúng ca tương ứng đỏ", () => {
  const dotBien = {
    "JST-AC-1 dòng JOB STEP lọt vào stdout": [
      (s) => s.replace(/(echo "JOB STEP .*)" >&2/, '$1"'),
      (root) => {
        const r = chayThan(root, `job_step jst-thu xanh /bin/echo xin-chao`);
        const truc = spawnSync("/bin/echo", ["xin-chao"], { encoding: "utf8" });
        return r.stdout !== truc.stdout && dongGhim(r.stderr).length === 0;
      },
    ],
    "JST-AC-1 bước xanh không có dòng ghim": [
      (s) => s.replace(/^(\s*)(job_step_ghi "\$job")/m, '$1if [ "$rc" -ne 0 ]; then $2; fi #'),
      (root) => dongGhim(chayThan(root, `job_step jst-thu xanh /usr/bin/true`).stderr).length === 0,
    ],
    "JST-AC-2 giây là hằng, không phải số đo": [
      (s) => s.replace(/job_step_ghi "\$job" "\$label" "\$rc" "\$giay"/, 'job_step_ghi "$job" "$label" "$rc" 0'),
      (root) => buoc(chayThan(root, `job_step jst-thu cham /bin/sleep 2`).stderr, "cham").giay === 0,
    ],
    "JST-AC-3 job_step nuốt mã thoát": [
      (s) => s.replace(/^\s*return "\$rc"$/m, "  return 0"),
      (root) => chayThan(root, `job_step jst-thu do /bin/sh -c 'exit 3'; echo "ra=$?"`).stdout.includes("ra=0"),
    ],
    "JST-AC-3 dòng JOB FAIL cũ bị đổi chữ": [
      (s) => s.replace(/JOB FAIL \[\$job\] bước \$label mã \$rc/, "JOB FAIL [$job] bước $label mã $rc giây $giay"),
      (root) => !chayThan(root, `job_step jst-thu do /bin/sh -c 'exit 3'`).stderr
        .includes("JOB FAIL [jst-thu] bước do mã 3\n"),
    ],
    "JST-AC-4 JOB_RC lấy mã hỏng cuối": [
      (s) => s.replace(/\[ "\$JOB_RC" -eq 0 \]/, '[ "$JOB_RC" -ge 0 ]'),
      (root) => chayThan(root, [
        `job_run jst-thu do3 /bin/sh -c 'exit 3'`,
        `job_run jst-thu do4 /bin/sh -c 'exit 4'`,
        `exit "$JOB_RC"`,
      ].join("\n")).status === 4,
    ],
    "JST-AC-5 dòng ghim thiếu cột nhanh": [
      (s) => s.replace(/ nhanh \$nhanh"/, '"'),
      (root) => !KHUON.test(dongGhim(chayThan(root, `job_step jst-thu a /usr/bin/true`).stderr)[0]),
    ],
    "JST-AC-5 cột nhanh không theo đúng chuỗi 1": [
      (s) => s.replace(/\[ "\$\{S03_LUOT_NHANH:-\}" = "1" \]/, '[ -n "${S03_LUOT_NHANH:-}" ]'),
      (root) => buoc(chayThan(root, `job_step jst-thu a /usr/bin/true`, {
        env: { S03_LUOT_NHANH: "true" },
      }).stderr, "a").nhanh === 1,
    ],
    "JST-AC-6 vòng đã mở đường ghi tệp": [
      (s) => s.replace(/^(\s*)(echo "JOB STEP .*>&2)$/m,
        '$1$2\n$1echo "$1 $2 $3 $4" >> "$(dirname "${BASH_SOURCE[0]}")/../../so-thoi-luong.txt" 2>/dev/null || true'),
      (root) => {
        const tep = tepBoc(root, `job_step jst-thu xanh /usr/bin/true`);
        const truoc = anhChup(root);
        chay(tep);
        return soCay(truoc, anhChup(root)).moi.length > 0;
      },
    ],
    "RF-1 giây âm khi đồng hồ lùi": [
      (s) => s.replace(/^\s*if \[ "\$giay" -lt 0 \]; then giay=0; fi$/m, "  :"),
      (root) => {
        const bin = path.join(root, "bin-gio");
        mkdirSync(bin);
        writeFileSync(path.join(bin, "date"), [
          "#!/bin/bash",
          'n=$(cat "$DEM" 2>/dev/null || echo 0); n=$((n + 1)); echo "$n" > "$DEM"',
          'if [ "$n" = "1" ]; then echo 1000000; else echo 999993; fi',
        ].join("\n") + "\n");
        chmodSync(path.join(bin, "date"), 0o755);
        const r = chayThan(root, `job_step jst-thu lui /usr/bin/true`, {
          env: { PATH: `${bin}:/usr/bin:/bin`, DEM: path.join(bin, ".dem") },
        });
        return / giây -\d+ /.test(r.stderr);
      },
    ],
  };

  for (const [ten, [doi, doDo]] of Object.entries(dotBien)) {
    const root = cayLib(doi);
    const goc = readFileSync(path.join(REPO, LIB), "utf8");
    assert.notEqual(
      readFileSync(path.join(root, LIB), "utf8"), goc,
      `đột biến «${ten}» không khớp mã thật — phép đo mất chiều đỏ`,
    );
    assert.ok(doDo(root), `đột biến «${ten}» không làm ca tương ứng đỏ`);
  }
});

// ===================================================== Task 2 — tệp bọc ====
// Cây tạm theo khuôn scripts/s03-nap-nhanh.test.mjs: chép NGUYÊN tệp bọc thật + job-step.sh,
// `node` và `sleep` giả đầu PATH, HOME tạm, DATABASE_URL cổng đóng. Bản đối chứng là tệp bọc ở
// origin/main chạy trên CÙNG `node` giả — không viết tay dãy nhãn hay mã thoát ở bất kỳ ô nào.
const BOC = "scripts/zalo-import-daily.sh";
const MOC_LAN = "# Từ đây trở xuống là làn Claude";
const SNAP = "collector/snapshots/hanoi/hanoi__zalo-agent__2026-10-25T000000Z";
const STATE = "pipeline/logs/apify-daily.state";

// node giả: nhãn = tên tệp .mjs/.js/.ts đầu tiên; ghi «nhãn cờ» vào CALLS; CHAM_BUOC ngủ THẬT.
const NODE_GIA = `#!/bin/bash
step=node
for a in "$@"; do case "$a" in *.mjs|*.js|*.ts) step="$(basename "$a")"; step="\${step%.*}"; break;; esac; done
echo "$step \${S03_LUOT_NHANH:-unset}" >> "$CALLS"
[ -n "\${CHAM_BUOC:-}" ] && [ "$step" = "$CHAM_BUOC" ] && /bin/sleep "\${CHAM_GIAY:-2}"
IFS=',' read -ra items <<< "\${FAIL_STEPS:-}"
for it in "\${items[@]}"; do
  name="\${it%%:*}"; rest="\${it#*:}"; c="\${rest%%:*}"; msg="\${rest#*:}"
  [ "$name" = "$step" ] || continue
  [ "$msg" = "$rest" ] && msg="boom ($step)"
  echo "$msg" >&2; exit "$c"
done
exit 0
`;

/** Cây tệp bọc. `ban` = nội dung tệp bọc (mặc định bản trong cây làm việc). */
function cayBoc(ban) {
  const root = mkdtempSync(path.join(SCRATCH, "boc-"));
  mkdirSync(path.join(root, "scripts/lib"), { recursive: true });
  copyFileSync(path.join(REPO, LIB), path.join(root, LIB));
  writeFileSync(path.join(root, BOC), ban ?? readFileSync(path.join(REPO, BOC), "utf8"));
  mkdirSync(path.join(root, SNAP), { recursive: true });
  writeFileSync(path.join(root, SNAP, "manifest.json"), "{}\n");
  mkdirSync(path.join(root, "pipeline/logs"), { recursive: true });
  mkdirSync(path.join(root, "agent"));
  writeFileSync(path.join(root, "pipeline/doc-gop-hang-ngay.sh"),
    '#!/bin/bash\nexec node "$(dirname "$0")/doc-gop-hang-ngay.mjs"\n');
  writeFileSync(path.join(root, STATE), "2026-10-24T000000Z");
  const bin = path.join(root, ".shim-bin");
  mkdirSync(bin);
  writeFileSync(path.join(bin, "node"), NODE_GIA);
  chmodSync(path.join(bin, "node"), 0o755);
  writeFileSync(path.join(bin, "sleep"), "#!/bin/bash\nexit 0\n"); // vòng chờ khoá không chờ thật
  chmodSync(path.join(bin, "sleep"), 0o755);
  mkdirSync(path.join(root, ".home"));
  return root;
}

function chayBoc(root, args = [], extra = {}) {
  const calls = path.join(root, `.calls-${++dem}`);
  writeFileSync(calls, "");
  const r = spawnSync("/bin/bash", [path.join(root, BOC), ...args], {
    cwd: root,
    encoding: "utf8",
    timeout: 60_000,
    env: {
      PATH: `${path.join(root, ".shim-bin")}:/usr/bin:/bin`,
      HOME: path.join(root, ".home"),
      DATABASE_URL: "postgres://127.0.0.1:9/khong-co",
      CALLS: calls,
      ...extra,
    },
  });
  const goi = readFileSync(calls, "utf8").split("\n").filter(Boolean);
  return {
    ma: r.status,
    ra: r.stdout + r.stderr,
    err: r.stderr,
    goi: goi.map((l) => l.split(" ")[0]),   // dãy lời gọi node giả — tín hiệu có ở CẢ hai bản
    co: goi.map((l) => l.split(" ")[1]),
  };
}

const banGoc = () =>
  spawnSync("git", ["show", `origin/main:${BOC}`], { cwd: REPO, encoding: "utf8" }).stdout;

/**
 * Hàm thuần dùng chung cho cả ba ô của lưới phạm vi làn: nhận văn bản diff -U0 (theo ref hay --no-index đều in
 * cùng khuôn đầu khối `@@ -N[,M] +…`), trả các đầu khối bắt đầu ở dòng ≤ số dòng của mốc.
 */
function khoiTrenMoc(diff, socMoc) {
  const lan = [];
  for (const d of diff.split("\n")) {
    const m = /^@@ -(\d+)/.exec(d);
    if (m && Number(m[1]) <= socMoc) lan.push(d);
  }
  return lan;
}

/** Bản origin/main của tệp bọc, KIỂM mã thoát và đầu ra — thiếu ref thì ném chứ không trả chuỗi rỗng. */
function banGocChat() {
  const r = spawnSync("git", ["show", `origin/main:${BOC}`], { cwd: REPO, encoding: "utf8", timeout: 30_000 });
  if (r.status !== 0 || !r.stdout) {
    throw new Error(`JST-AC-8 không đọc được bản origin/main của tệp bọc (git show mã ${r.status}): ${r.stderr}`);
  }
  return r.stdout;
}

/** Số dòng (đếm từ 1) của mốc ranh giới làn trong một bản tệp bọc. */
function soDongMoc(ban) {
  const i = ban.split("\n").findIndex((l) => l.startsWith(MOC_LAN));
  assert.ok(i >= 0, "bản origin/main phải có dòng mốc ranh giới làn");
  return i + 1;
}

/** Ô (i): lưới phạm vi làn trên CHÍNH cây làm việc — CHỈ ĐỌC (git diff theo ref). */
function kiemRanhGioiLan() {
  const socMoc = soDongMoc(banGocChat());
  assert.ok(
    readFileSync(path.join(REPO, BOC), "utf8").includes(MOC_LAN),
    "dòng mốc ranh giới làn phải còn nguyên trong cây",
  );
  const diff = spawnSync("git", ["diff", "-U0", "origin/main", "--", BOC], {
    cwd: REPO, encoding: "utf8", timeout: 30_000,
  }).stdout;
  return { lan: khoiTrenMoc(diff, socMoc), socMoc };
}

/**
 * Ô (ii)/(iii): chèn một dòng vào BẢN CHÉP của bản origin/main rồi so hai tệp tạm bằng git diff --no-index.
 * Không một byte nào được ghi vào cây làm việc (job-step-do-tren-ban-chep, Ngoài-1 + Ngoài-5).
 */
function voiDongChen(truocMoc) {
  const goc = banGocChat();
  const socMoc = soDongMoc(goc);
  const dong = goc.split("\n");
  const i = socMoc - 1;
  dong.splice(truocMoc ? i - 1 : i + 2, 0, "# dòng chèn tạm của phép đo JST-AC-8");
  const d = mkdtempSync(path.join(SCRATCH, "lan-"));
  const pGoc = path.join(d, "goc.sh");
  const pSua = path.join(d, "sua.sh");
  writeFileSync(pGoc, goc);
  writeFileSync(pSua, dong.join("\n"));
  // --no-index thoát 1 khi hai tệp khác nhau — đó là bình thường, chỉ ≥ 2 mới là lỗi.
  const r = spawnSync("git", ["diff", "--no-index", "-U0", pGoc, pSua], { encoding: "utf8", timeout: 30_000 });
  assert.ok(r.status === 0 || r.status === 1, `git diff --no-index lỗi (mã ${r.status}): ${r.stderr}`);
  return khoiTrenMoc(r.stdout, socMoc);
}

// ---------------------------------------------------------------- JST-AC-7 --
test("JST-AC-7 buoc_nhanh ba kết cục: mỗi kết cục một dòng ghim, dòng cũ nguyên văn, mã thoát không đổi", () => {
  const o = [
    ["xanh", {}, 0],
    ["khoa", { FAIL_STEPS: "transform-zalo:1:canceling statement due to lock timeout" }, 1],
    ["hong", { FAIL_STEPS: "transform-zalo:3:boom" }, 3],
  ];
  for (const [ten, env, maBuoc] of o) {
    const r = chayBoc(cayBoc(), ["--luot-nhanh"], env);
    const g = chayBoc(cayBoc(banGoc()), ["--luot-nhanh"], env);

    assert.equal(r.ma, g.ma, `[${ten}] mã thoát phải bằng bản origin/main`);
    const b = buoc(r.err, "transform-zalo");
    assert.equal(b.ma, maBuoc, `[${ten}] mã trên dòng ghim`);
    assert.equal(b.nhanh, 1, `[${ten}] lượt nhanh phải cho nhanh 1`);
    assert.equal(
      dongGhim(r.err).filter((l) => l.includes(" bước transform-zalo ")).length, 1,
      `[${ten}] phải đúng MỘT dòng ghim cho transform-zalo`,
    );
    if (ten === "khoa") {
      assert.ok(r.err.includes("BỎ LƯỢT [zalo-import-daily] bước transform-zalo: đụng khoá — lượt sau làm"),
        `[khoa] dòng BỎ LƯỢT phải nguyên văn:\n${r.err}`);
      assert.equal(dongHong(r.err).filter((l) => l.includes(" bước transform-zalo ")).length, 0);
    }
    if (ten === "hong") {
      assert.ok(r.err.includes("JOB FAIL [zalo-import-daily] bước transform-zalo mã 3"),
        `[hong] dòng JOB FAIL phải nguyên văn:\n${r.err}`);
    }
  }
});

// ---------------------------------------------------------------- JST-AC-8 --
test("JST-AC-8 bước truoc-lan-claude: đứng trước mọi bước transform, giây đo thật", () => {
  const r = chayBoc(cayBoc(), ["--luot-nhanh"]);
  const g = dongGhim(r.err);
  const iTruoc = g.findIndex((l) => l.includes(" bước truoc-lan-claude "));
  assert.equal(g.filter((l) => l.includes(" bước truoc-lan-claude ")).length, 1, `phải ĐÚNG MỘT dòng:\n${r.err}`);
  const iTransform = g.findIndex((l) => / bước transform-/.test(l));
  assert.ok(iTransform >= 0 && iTruoc < iTransform, "bước gộp phải đứng TRƯỚC mọi bước transform");
  assert.ok(buoc(r.err, "truoc-lan-claude").giay <= 1, "lượt không cấy ngủ phải ≤ 1 giây");

  const cham = chayBoc(cayBoc(), ["--luot-nhanh"], { CHAM_BUOC: "import-airbnb", CHAM_GIAY: "2" });
  assert.ok(buoc(cham.err, "truoc-lan-claude").giay >= 2,
    `cấy ngủ 2s vào vòng nạp phải cho giây ≥ 2:\n${cham.err}`);
});

test("JST-AC-8 lưới phạm vi làn: cây hiện tại xanh, chèn dưới mốc xanh, chèn trên mốc đỏ", () => {
  assert.deepEqual(kiemRanhGioiLan().lan, [], "JST-AC-8 sửa phần trên ranh giới làn Claude — ô cây hiện tại");
  assert.deepEqual(voiDongChen(false), [], "chèn DƯỚI mốc phải xanh");
  assert.ok(voiDongChen(true).length > 0,
    "chèn TRÊN mốc phải đỏ — JST-AC-8 sửa phần trên ranh giới làn Claude");
});

// ------------------------------------------------ job-step-do-tren-ban-chep --
// Ca lưới phạm vi làn được chạy RIÊNG trong một kho git tạm (gốc kho của tệp test suy từ import.meta.url, nên
// trong kho tạm nó là kho tạm). Kho tạm là chỗ duy nhất có thể bị ghi — cây thật không bao giờ là fixture, và
// vẫn được chụp trước/sau làm lưới đỡ.
const TEST_TEP = "scripts/job-step-thoi-luong.test.mjs";
const MAU_LUOI = "JST-AC-8 lưới phạm vi làn";
const GIT_DANH = {
  GIT_AUTHOR_NAME: "kho-tam", GIT_AUTHOR_EMAIL: "kho-tam@local.test",
  GIT_COMMITTER_NAME: "kho-tam", GIT_COMMITTER_EMAIL: "kho-tam@local.test",
};

function chupTep(p) {
  const s = statSync(p);
  return { bam: createHash("sha256").update(readFileSync(p)).digest("hex"), mtime: s.mtimeMs, ctime: s.ctimeMs };
}

function git(cwd, args) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", timeout: 30_000, env: { ...process.env, ...GIT_DANH } });
  assert.equal(r.status, 0, `git ${args.join(" ")} lỗi (mã ${r.status}): ${r.stderr}`);
  return r.stdout;
}

/** Kho git tạm: tệp bọc + lib chép từ cây, tệp test = `nguonTest`; một commit (plumbing, không chạy hook). */
function khoTam(nguonTest, { coOriginMain = true } = {}) {
  const k = mkdtempSync(path.join(SCRATCH, "kho-"));
  mkdirSync(path.join(k, "scripts/lib"), { recursive: true });
  copyFileSync(path.join(REPO, BOC), path.join(k, BOC));
  copyFileSync(path.join(REPO, LIB), path.join(k, LIB));
  writeFileSync(path.join(k, TEST_TEP), nguonTest);
  git(k, ["init", "-q"]);
  git(k, ["add", "-A"]);
  const sha = git(k, ["commit-tree", "--no-gpg-sign", git(k, ["write-tree"]).trim(), "-m", "kho tam"]).trim();
  git(k, ["update-ref", "HEAD", sha]);
  if (coOriginMain) git(k, ["update-ref", "refs/remotes/origin/main", sha]);
  return k;
}

/** Chạy RIÊNG ca lưới phạm vi làn trong kho tạm; trả mã thoát, đầu ra và số ca pass/fail mà reporter đếm. */
function chayLuoiTrong(k) {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;   // không thì tiến trình con nói giao thức của runner cha, không in số đếm
  const r = spawnSync(process.execPath,
    ["--test", "--test-reporter=spec", "--test-name-pattern", MAU_LUOI, path.join(k, TEST_TEP)],
    { cwd: k, encoding: "utf8", env, timeout: 120_000 });
  const ra = r.stdout + r.stderr;
  const so = (ten) => Number((new RegExp(`ℹ ${ten} (\\d+)`).exec(ra) ?? [])[1] ?? -1);
  return { ma: r.status, ra, pass: so("pass"), fail: so("fail") };
}

/** Đột biến bản chép: `tu` phải có mặt ĐÚNG một lần — không thì đột biến không đổi gì và chiều đỏ rỗng. */
function doiMot(nguon, tu, thanh) {
  assert.equal(nguon.split(tu).length, 2, `đột biến phải thật sự đổi nguồn — «${tu}» phải có đúng một lần`);
  return nguon.replace(tu, thanh);
}

test("JST-AC-1-bc ô đột biến của lưới làn không ghi vào cây làm việc (kho tạm, kèm chiều đỏ)", () => {
  const that = path.join(REPO, BOC);
  const that0 = chupTep(that);
  const nguon = readFileSync(path.join(REPO, TEST_TEP), "utf8");

  const k = khoTam(nguon);
  const t0 = chupTep(path.join(k, BOC));
  const r = chayLuoiTrong(k);
  assert.equal(r.ma, 0, `ca lưới trong kho tạm phải xanh:\n${r.ra}`);
  assert.deepEqual([r.pass, r.fail], [1, 0], `phải đúng MỘT ca khớp đã chạy (không xanh rỗng):\n${r.ra}`);
  assert.deepEqual(chupTep(path.join(k, BOC)), t0, "JST-AC-1-bc ô đột biến đã ghi vào cây làm việc");
  assert.equal(git(k, ["status", "--porcelain"]), "", "JST-AC-1-bc ô đột biến đã ghi vào cây làm việc");

  // chiều đỏ CÙNG fixture: bản chép cho ô chèn ghi vào tệp bọc của kho (đúng hành vi đời trước)
  const dot = doiMot(nguon, "const pSua = path.join(d, " + '"sua.sh");', "const pSua = path.join(REPO, BOC);");
  const kd = khoTam(dot);
  const td0 = chupTep(path.join(kd, BOC));
  chayLuoiTrong(kd);
  assert.notDeepEqual(chupTep(path.join(kd, BOC)), td0,
    "chiều đỏ: bản ghi vào cây phải làm phép đo đỏ — JST-AC-1-bc ô đột biến đã ghi vào cây làm việc");
  assert.notEqual(git(kd, ["status", "--porcelain"]), "", "chiều đỏ: git status của kho tạm phải thấy tệp bọc đổi");

  assert.deepEqual(chupTep(that), that0, "JST-AC-1-bc phép đo đã chạm tệp bọc thật");
});

test("JST-AC-2-bc ba ô của lưới làn dùng chung một hàm tách khối; thiếu origin/main thì đỏ có tên", () => {
  const that = path.join(REPO, BOC);
  const that0 = chupTep(that);
  const nguon = readFileSync(path.join(REPO, TEST_TEP), "utf8");
  const LAN = "JST-AC-8 sửa phần trên ranh giới làn Claude";
  const THIEU = "JST-AC-8 không đọc được bản origin/main của tệp bọc";
  const DAU_HAM = "function khoiTrenMoc" + "(diff, socMoc) {";

  // thiếu origin/main → đỏ với lời báo có tên, không xanh trên hai bản chép rỗng
  const rt = chayLuoiTrong(khoTam(nguon, { coOriginMain: false }));
  assert.notEqual(rt.ma, 0, `thiếu origin/main mà ca lưới vẫn xanh:\n${rt.ra}`);
  assert.ok(rt.ra.includes(THIEU), `JST-AC-2-bc mất lời báo thiếu origin/main\n${rt.ra}`);

  // hàm luôn trả rỗng → ô (iii) đỏ
  const r2 = chayLuoiTrong(khoTam(doiMot(nguon, DAU_HAM, `${DAU_HAM}\n  return [];`)));
  assert.notEqual(r2.ma, 0, `chiều đỏ: hàm trả rỗng mà ca lưới vẫn xanh:\n${r2.ra}`);
  assert.ok(r2.ra.includes(`chèn TRÊN mốc phải đỏ — ${LAN}`), `ô (iii) phải đỏ với thông điệp ghim:\n${r2.ra}`);

  // hàm luôn trả một khối giả → ô (i) đỏ: ô cây hiện tại đi qua CÙNG hàm
  const r3 = chayLuoiTrong(khoTam(doiMot(nguon, DAU_HAM, `${DAU_HAM}\n  return ["@@ -1 +1 @@ khối giả"];`)));
  assert.notEqual(r3.ma, 0, `chiều đỏ: hàm trả khối giả mà ca lưới vẫn xanh:\n${r3.ra}`);
  assert.ok(r3.ra.includes(`${LAN} — ô cây hiện tại`), `ô (i) phải đỏ với thông điệp ghim:\n${r3.ra}`);

  // bỏ lời kiểm mã thoát của git show → ca thiếu origin/main mất lời báo có tên
  const r4 = chayLuoiTrong(khoTam(doiMot(nguon, "if (r.status !== 0 " + "|| !r.stdout) {", "if (false) {"),
    { coOriginMain: false }));
  assert.ok(!r4.ra.includes(THIEU), `chiều đỏ: bỏ kiểm mà lời báo vẫn còn — phép đo không phân biệt:\n${r4.ra}`);

  assert.deepEqual(chupTep(that), that0, "JST-AC-1-bc phép đo đã chạm tệp bọc thật");
});

// ---------------------------------------------------------------- JST-AC-9 --
test("JST-AC-9 hai lượt: dãy lời gọi và mã thoát bằng bản origin/main, cột nhanh đúng", () => {
  for (const [ten, args, nhanh] of [["nhanh", ["--luot-nhanh"], 1], ["00:00", [], 0]]) {
    const r = chayBoc(cayBoc(), args);
    const g = chayBoc(cayBoc(banGoc()), args);

    assert.deepEqual(r.goi, g.goi, `[${ten}] dãy lời gọi phải bằng bản origin/main`);
    assert.equal(r.ma, g.ma, `[${ten}] mã thoát phải bằng bản origin/main`);
    assert.ok(r.goi.length > 0, `[${ten}] bản đối chứng phải gọi ít nhất một bước`);

    // tín hiệu thứ hai, CHỈ có ở bản sau vòng: cột nhanh trên dòng ghim
    const cot = dongGhim(r.err).map((l) => Number(/ nhanh ([01])$/.exec(l)[1]));
    assert.deepEqual([...new Set(cot)], [nhanh], `[${ten}] mọi dòng ghim phải mang nhanh ${nhanh}`);
    // truoc-lan-claude chỉ có ở bản sau vòng nên nằm NGOÀI phép so đối chứng ở trên
    assert.ok(dongGhim(r.err).some((l) => l.includes(" bước truoc-lan-claude ")));
    assert.ok(!g.goi.includes("truoc-lan-claude"));
  }
});

// -------------------------------------------------------------------- RF-4 --
test("RF-4 mọi nhãn bước tệp bọc truyền vào đều không chứa khoảng trắng", () => {
  const r = chayBoc(cayBoc(), []);
  const nhan = dongGhim(r.err).map((l) => /\] bước (.+) mã \d+ giây/.exec(l)[1]);
  assert.ok(nhan.length > 0);
  for (const n of nhan) {
    assert.ok(!/\s/.test(n), `nhãn «${n}» có khoảng trắng — bộ đọc ở design §4.4 tách trường sai`);
  }
});

// ------------------------------------------------------- chiều đỏ Task 2 ----
test("chiều đỏ tệp bọc: bản đột biến làm đúng ca tương ứng đỏ", () => {
  const goc = readFileSync(path.join(REPO, BOC), "utf8");
  const o = [
    ["JST-AC-7 buoc_nhanh không ghi thời lượng",
      (s) => s.replace(/^\s*job_step_ghi "\$job" "\$nhan" "\$rc" "\$giay"$/m, "  :"),
      (root) => dongGhim(chayBoc(root, ["--luot-nhanh"]).err)
        .filter((l) => l.includes(" bước transform-zalo ")).length === 0],
    ["JST-AC-7 dòng BỎ LƯỢT biến mất",
      (s) => s.replace(/^(\s*job_step_ghi "\$job" "\$nhan" "\$rc" "\$giay")$/m, "$1\n  return 0"),
      (root) => !chayBoc(root, ["--luot-nhanh"], {
        FAIL_STEPS: "transform-zalo:1:canceling statement due to lock timeout",
      }).err.includes("BỎ LƯỢT [zalo-import-daily] bước transform-zalo")],
    ["JST-AC-8 không có bước truoc-lan-claude",
      (s) => s.replace(/^job_step_ghi zalo-import-daily truoc-lan-claude .*$/m, ":"),
      (root) => !dongGhim(chayBoc(root, ["--luot-nhanh"]).err).some((l) => l.includes(" bước truoc-lan-claude "))],
    ["JST-AC-9 chuỗi bước lượt 00:00 đã đổi",
      (s) => s.replace(/^buoc zalo-import-daily xep-hang-gia .*$/m, ":"),
      (root) => {
        const r = chayBoc(root, []);
        return JSON.stringify(r.goi) !== JSON.stringify(chayBoc(cayBoc(banGoc()), []).goi);
      }],
    ["JST-AC-9 cột nhanh sai ở lượt 00:00",
      (s) => s.replace(/^export S03_LUOT_NHANH="\$LUOT_NHANH"$/m, 'export S03_LUOT_NHANH=1'),
      (root) => dongGhim(chayBoc(root, []).err).some((l) => / nhanh 1$/.test(l))],
  ];

  for (const [ten, doi, doDo] of o) {
    const ban = doi(goc);
    assert.notEqual(ban, goc, `đột biến «${ten}» không khớp mã thật — phép đo mất chiều đỏ`);
    assert.ok(doDo(cayBoc(ban)), `đột biến «${ten}» không làm ca tương ứng đỏ`);
  }
});
