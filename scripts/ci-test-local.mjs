#!/usr/bin/env node
// Chạy lại cục bộ năm job của .github/workflows/ci-test.yml (AU11 `ci-test-module` AC-5…AC-7). Rút từ CHÍNH tệp workflow
// lệnh `run:`, `working-directory`, `node-version` và khối `services` của từng job; chạy mỗi bước bằng
// `bash -eo pipefail` với CI=true trong docker: PostGIS dùng một lần (ảnh của workflow) + node (bản của workflow) dùng
// chung mạng `--network container:`, bộ chuyển cổng 5433→5432 để `localhost:5433` như trên runner. Chạy trên git clone
// sạch của HEAD trong .acceptance-runs/ci-test-module/local — không đụng DB thật :5433 hay node_modules của máy.
// Lệch còn lại so với CI thật: máy arm64, runner amd64 (AC-8 đo).
//   node scripts/ci-test-local.mjs                 năm job trên bản sạch (AC-6)
//   node scripts/ci-test-local.mjs --cay           ma trận cấy lỗi 5×5 (AC-7)
//   node scripts/ci-test-local.mjs --agent-types   agent cài sạch tsc + chiều đỏ thiếu @types/json-schema (AC-5)
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const yaml = createRequire(path.join(ROOT, "app/package.json"))("js-yaml");
const WF = path.join(ROOT, ".github/workflows/ci-test.yml");
const WORK = path.join(ROOT, ".acceptance-runs/ci-test-module/local");
export const JOBS = ["app", "pipeline", "agent", "data-api", "scripts"];
const BO_CHUYEN = `const n=require("net");n.createServer(c=>{const s=n.connect(5432,"127.0.0.1");c.pipe(s);s.pipe(c);c.on("error",()=>{});s.on("error",()=>{})}).listen(5433);`;

/** Lỗi cấy theo module (Hỏi-4): TS → lỗi kiểu ở bước typecheck; JS → lỗi kiểu thật trong tệp có test phủ, bước test bắt. */
export const CAY = {
  app: { tep: "app/src/lib/log-root.ts", loai: "lỗi kiểu TS", buoc: "typecheck", sua: (s) => `${s}\nexport const __ciCay: number = "lỗi cấy";\n` },
  // JS: tệp chỉ test của chính module dùng — vn-day.mjs, freshness.mjs… được test của app/pipeline/scripts dùng chung, cấy vào
  // đó thì nhiều job cùng đỏ (đúng hành vi CI, nhưng không đo được «đỏ đúng job»).
  pipeline: { tep: "pipeline/lib/write-offers.mjs", loai: "gọi hàm không tồn tại (Object.key)", buoc: "test", sua: (s) => s.replace("const cols = Object.keys(row);", "const cols = Object.key(row);") },
  agent: { tep: "agent/src/runtime/models.ts", loai: "lỗi kiểu TS", buoc: "typecheck", sua: (s) => `${s}\nexport const __ciCay: number = "lỗi cấy";\n` },
  "data-api": { tep: "data-api/src/index.ts", loai: "lỗi kiểu TS", buoc: "typecheck", sua: (s) => `${s}\nexport const __ciCay: number = "lỗi cấy";\n` },
  scripts: { tep: "scripts/lib/ops-visible-strings.mjs", loai: "gọi hàm không tồn tại (createSourceFil)", buoc: "test", sua: (s) => s.replace("ts.createSourceFile(file,", "ts.createSourceFil(file,") },
};

const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 28, ...opts });

/** Cấu hình một job rút từ workflow. */
export function cauHinh(wf, job) {
  const j = wf.jobs[job];
  const node = j.steps.find((s) => String(s.uses ?? "").startsWith("actions/setup-node"))?.with?.["node-version"];
  const svc = j.services?.postgres ?? null;
  const steps = j.steps.filter((s) => s.run).map((s) => ({ name: s.name ?? "(không tên)", run: s.run, wd: s["working-directory"] ?? "." }));
  return { node: String(node), svc, steps, env: j.env ?? {} };
}

function clone(dir) {
  rmSync(dir, { recursive: true, force: true });
  // Template rỗng: máy này cài hook git-secrets qua init.templateDir (/etc/gitconfig); hook đó trỏ /opt/git-secrets
  // vốn không có trong container node, nên mọi `git commit` của test trong bản clone bị chặn. Runner GitHub không có hook.
  const rong = mkdtempSync(path.join(tmpdir(), "ci-local-tpl-"));
  execFileSync("git", ["clone", "-q", "--no-hardlinks", `--template=${rong}`, ROOT, dir]);
  rmSync(rong, { recursive: true, force: true });
  return execFileSync("git", ["-C", dir, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

/** Chạy một job trên `repo`; trả { code, buocDo, giay, tests, pass, fail, boQua, log }. */
export function chayJob(cfg, job, repo, { boCaiDat = false, them = "" } = {}) {
  const pgName = `ci-local-${job}-${process.pid}`;
  const t0 = Date.now();
  let netArgs = [];
  if (cfg.svc) {
    const env = Object.entries(cfg.svc.env ?? {}).flatMap(([k, v]) => ["-e", `${k}=${v}`]);
    sh("docker", ["rm", "-f", pgName]);
    const r = sh("docker", ["run", "-d", "--name", pgName, ...env, cfg.svc.image]);
    if (r.status !== 0) return { code: 99, buocDo: "service", giay: 0, log: r.stderr };
    for (let i = 0; i < 60; i++) {
      if (sh("docker", ["exec", pgName, "pg_isready", "-h", "localhost", "-U", "oneinvest", "-d", "oneinvest"]).status === 0) break;
      sh("sleep", ["2"]);
    }
    sh("sleep", ["3"]);
    netArgs = ["--network", `container:${pgName}`];
  }
  // Như Actions: mỗi `run:` ghi ra một tệp rồi chạy `bash -eo pipefail <tệp>` trong working-directory — lệnh không qua
  // một lớp trích dẫn nào của shell ngoài (`$(…)`, nháy trong lệnh giữ nguyên nghĩa).
  const thuMucBuoc = path.join(repo, ".ci-local");
  mkdirSync(thuMucBuoc, { recursive: true });
  const buoc = cfg.steps
    .filter((s) => !(boCaiDat && s.name === "cài phụ thuộc"))
    .map((s, i) => {
      writeFileSync(path.join(thuMucBuoc, `${job}-${i}.sh`), `${s.run}\n`);
      return `echo "::buoc ${i} ${s.name}"; (cd ${JSON.stringify(s.wd)} && bash -eo pipefail /repo/.ci-local/${job}-${i}.sh) || { echo "::do ${s.name}"; exit 1; }`;
    })
    .join("\n");
  const script = `set -u\ngit config --global --add safe.directory '*'\n${cfg.svc ? `node -e '${BO_CHUYEN}' &\nsleep 1\n` : ""}${them}\n${buoc}\necho "::xong"`;
  const envArgs = ["-e", "CI=true", "-e", "GITHUB_ACTIONS=true", ...Object.entries(cfg.env).flatMap(([k, v]) => ["-e", `${k}=${v}`])];
  const r = sh("docker", ["run", "--rm", ...netArgs, ...envArgs, "-v", `${repo}:/repo`, "-w", "/repo", `node:${cfg.node}`, "bash", "-c", script]);
  if (cfg.svc) sh("docker", ["rm", "-f", pgName]);
  const log = `${r.stdout}\n${r.stderr}`;
  const so = (k) => {
    const m = [...log.matchAll(new RegExp(`^ℹ ${k} (\\d+)`, "gm"))];
    return m.length ? m.reduce((n, x) => n + Number(x[1]), 0) : null;
  };
  const bq = log.match(/ci-can-du-lieu: \S+ — bỏ qua (\d+) ca/);
  return {
    code: r.status,
    buocDo: log.match(/^::do (.+)$/m)?.[1] ?? null,
    giay: Math.round((Date.now() - t0) / 1000),
    tests: so("tests"),
    pass: so("pass"),
    fail: so("fail"),
    boQua: bq ? Number(bq[1]) : 0,
    log,
  };
}

const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const wf = yaml.load(readFileSync(WF, "utf8"));
  mkdirSync(WORK, { recursive: true });
  const mode = process.argv.includes("--cay") ? "cay" : process.argv.includes("--agent-types") ? "types" : "sach";
  const chiJob = process.argv.includes("--job") ? process.argv[process.argv.indexOf("--job") + 1] : null;

  if (mode === "sach") {
    const repo = path.join(WORK, "sach");
    const sha = clone(repo);
    const boQua = JSON.parse(readFileSync(path.join(repo, "scripts/ci-bo-qua.json"), "utf8"));
    console.log(`bản sạch: clone ${sha} → ${path.relative(ROOT, repo)}`);
    for (const job of chiJob ? [chiJob] : JOBS) {
      const cfg = cauHinh(wf, job);
      console.log(`     ${job}: node ${cfg.node} · service ${cfg.svc?.image ?? "—"} ${cfg.svc?.ports?.join(",") ?? ""} · ${cfg.steps.length} bước (${cfg.steps.map((s) => `${s.name}@${s.wd}`).join(" · ")})`);
      const r = chayJob(cfg, job, repo);
      writeFileSync(path.join(WORK, `sach-${job}.log`), r.log);
      check(r.code === 0, `job ${job}: exit ${r.code}${r.buocDo ? ` (đỏ ở bước «${r.buocDo}»)` : ""} · ${r.giay}s · test ${r.pass ?? "—"}/${r.tests ?? "—"}${r.fail ? ` (fail ${r.fail})` : ""} · bỏ qua ${r.boQua}`);      // tập ca bỏ qua thực tế = danh sách viết trước: mỗi ca của danh sách không có dòng ✔/✖ nào trong nhật ký job
      const ds = boQua[job] ?? [];
      const vanChay = ds.filter((m) => r.log.split("\n").some((l) => /^\s*[✔✖] /.test(l) && l.includes(m.ca)));
      if (ds.length || r.boQua) check(r.boQua === ds.length && !vanChay.length, vanChay.length ? `job ${job}: ca trong danh sách vẫn chạy — ${vanChay.map((m) => m.ca).join(" | ")}` : `job ${job}: tập ca bỏ qua khớp scripts/ci-bo-qua.json (${ds.length} ca)`);
    }
  }

  if (mode === "types") {
    const cfg = cauHinh(wf, "agent");
    const repo = path.join(WORK, "types");
    clone(repo);
    const cai = cfg.steps.find((s) => s.name === "cài phụ thuộc");
    const tc = cfg.steps.find((s) => s.name === "typecheck");
    const chi = { ...cfg, svc: null, steps: [cai, tc] };
    const r = chayJob(chi, "agent", repo);
    check(r.code === 0, r.code === 0 ? "agent cài sạch: tsc exit 0" : `agent cài sạch: tsc exit ${r.code}`);
    const red = chayJob({ ...chi, steps: [cai, { name: "gỡ @types/json-schema", run: "rm -rf node_modules/@types/json-schema", wd: "agent" }, tc] }, "agent", repo);
    const ts7016 = /TS7016/.test(red.log);
    check(red.code !== 0 && ts7016, red.code !== 0 && ts7016 ? "chiều đỏ: bản cây thiếu @types/json-schema → TS7016" : `chiều đỏ: thiếu @types/json-schema KHÔNG báo TS7016 (exit ${red.code})`);
  }

  if (mode === "cay") {
    // Bản gốc riêng (không dùng chung «sach» — chạy song song với chế độ sạch thì hai bên giẫm nhau): clone HEAD rồi chạy
    // đúng bước «cài phụ thuộc» của từng job một lần; năm bản cấy chép từ đây (cp -c, APFS) và bỏ bước cài.
    const base = path.join(WORK, "cay-base");
    const head = clone(base);
    for (const job of JOBS) {
      const cfg = cauHinh(wf, job);
      const r = chayJob({ ...cfg, svc: null, steps: cfg.steps.filter((x) => x.name === "cài phụ thuộc") }, job, base);
      if (r.code !== 0) {
        console.log(`FAIL cài phụ thuộc job ${job} cho bản gốc cấy lỗi: exit ${r.code}`);
        process.exit(1);
      }
    }
    console.log(`ma trận cấy lỗi trên ${head} (bản gốc riêng đã cài phụ thuộc; bỏ bước «cài phụ thuộc» ở bản cấy)`);
    const bang = [];
    for (const m of JOBS) {
      const c = CAY[m];
      const repo = path.join(WORK, `cay-${m}`);
      rmSync(repo, { recursive: true, force: true });
      execFileSync("cp", ["-cR", base, repo]);
      const f = path.join(repo, c.tep);
      const truoc = readFileSync(f, "utf8");
      const sau = c.sua(truoc);
      if (sau === truoc) {
        check(false, `cấy ${m}: mẫu sửa không khớp ${c.tep}`);
        continue;
      }
      writeFileSync(f, sau);
      const hang = {};
      for (const job of JOBS) {
        const r = chayJob(cauHinh(wf, job), job, repo, { boCaiDat: true });
        writeFileSync(path.join(WORK, `cay-${m}-${job}.log`), r.log);
        hang[job] = r.code === 0 ? "xanh" : `đỏ@${r.buocDo}`;
      }
      bang.push({ m, c, hang });
      console.log(`     cấy ${m} (${c.loai} · ${c.tep}): ${JOBS.map((j) => `${j}=${hang[j]}`).join(" · ")}`);
    }
    let dung = 0;
    for (const { m, c, hang } of bang)
      for (const job of JOBS) {
        const muon = job === m ? `đỏ@${c.buoc}` : "xanh";
        if (hang[job] === muon) dung++;
        else console.log(`FAIL ô (${m}, ${job}): muốn ${muon}, được ${hang[job]}`);
      }
    check(dung === 25, `ma trận cấy lỗi khớp viết trước (${dung}/25 ô)`);
  }

  console.log(fails.length === 0 ? `\nci-test-local ${mode}: PASS` : `\nci-test-local ${mode}: FAIL (${fails.length})`);
  process.exit(fails.length === 0 ? 0 : 1);
}
