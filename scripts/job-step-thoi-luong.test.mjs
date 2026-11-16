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
