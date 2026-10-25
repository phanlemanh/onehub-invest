#!/usr/bin/env node
// Đọc tĩnh .github/workflows/ci-test.yml (AU11 `ci-test-module` AC-1, AC-2). Luật: đúng năm job tên module; trigger
// đúng tập (pull_request không lọc, push main + ci-probe/**); không `secrets.`; không continue-on-error / `|| true` /
// `if:` trên bước typecheck-test; job gọi ci-db-init có service PostGIS kartoza 17-3.5 cổng 5433:5432 + healthcheck;
// mỗi job chạy đúng lệnh typecheck/test của module (bảng viết trước). Mỗi luật có chiều đỏ trên bản sao đột biến.
// Chạy: node scripts/check-ci-test.mjs
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const yaml = createRequire(path.join(ROOT, "app/package.json"))("js-yaml");
const WF = path.join(ROOT, ".github/workflows/ci-test.yml");

export const JOBS = ["app", "pipeline", "agent", "data-api", "scripts"];
/** Lệnh từng job phải chạy (bước · thư mục · chuỗi bắt buộc). */
export const LENH = {
  app: [["typecheck", "app", ["next typegen", "tsc --noEmit"]], ["test", "app", ["npm test"]]],
  pipeline: [["kiểm cú pháp .mjs", ".", ["node --check", "pipeline"]], ["test", "pipeline", ["npm test"]]],
  agent: [["typecheck", "agent", ["tsc --noEmit"]], ["test", "agent", ["npm test"]]],
  "data-api": [["typecheck", "data-api", ["npm run typecheck"]]],
  scripts: [["kiểm cú pháp .mjs", ".", ["node --check", "scripts"]], ["test", ".", ["node --test scripts/*.test.mjs"]]],
};
const PG = { image: "kartoza/postgis:17-3.5", port: "5433:5432" };

/** Danh sách lỗi [luật, chi tiết] của một văn bản workflow. */
export function loiWorkflow(text) {
  const out = [];
  const add = (luat, chiTiet) => out.push([luat, chiTiet]);
  const wf = yaml.load(text);
  const on = wf.on ?? wf[true];
  const jobs = Object.keys(wf.jobs ?? {});
  if (JSON.stringify([...jobs].sort()) !== JSON.stringify([...JOBS].sort())) add("nam-job", `job: ${jobs.join(", ")}`);
  const trig = Object.keys(on ?? {}).sort();
  if (JSON.stringify(trig) !== JSON.stringify(["pull_request", "push"])) add("trigger", `trigger: ${trig.join(", ")}`);
  const pr = on?.pull_request;
  if (pr && Object.keys(pr).length) add("pull-request-loc", `pull_request có ${Object.keys(pr).join(", ")}`);
  const pushB = [...(on?.push?.branches ?? [])].sort();
  if (JSON.stringify(pushB) !== JSON.stringify(["ci-probe/**", "main"]) || Object.keys(on?.push ?? {}).length !== 1)
    add("push-nhanh", `push: ${JSON.stringify(on?.push)}`);
  if (/secrets\./.test(text)) add("secrets", "có tham chiếu secrets.");
  for (const job of jobs) {
    const j = wf.jobs[job];
    if ("continue-on-error" in j) add("continue-on-error", `job ${job}`);
    for (const s of j.steps ?? []) {
      if ("continue-on-error" in s) add("continue-on-error", `${job} · ${s.name}`);
      if (s.run && /\|\|\s*true/.test(s.run)) add("or-true", `${job} · ${s.name}`);
      if (s.if && /typecheck|test|cú pháp/.test(s.name ?? "")) add("if-buoc", `${job} · ${s.name}`);
    }
    const dungDb = (j.steps ?? []).some((s) => /ci-db-init/.test(s.run ?? ""));
    if (dungDb) {
      const p = j.services?.postgres;
      const opts = String(p?.options ?? "");
      if (!p || p.image !== PG.image || !(p.ports ?? []).includes(PG.port) || !/--health-cmd/.test(opts))
        add("service-pg", `${job}: ${JSON.stringify(p ?? null)}`);
    }
    for (const [ten, wd, can] of LENH[job] ?? []) {
      const s = (j.steps ?? []).find((x) => x.name === ten);
      const okWd = (s?.["working-directory"] ?? ".") === wd;
      const thieu = can.filter((c) => !String(s?.run ?? "").includes(c));
      if (!s || !okWd || thieu.length) add("lenh", `${job} · ${ten}: ${!s ? "vắng bước" : !okWd ? `thư mục ${s["working-directory"] ?? "."} ≠ ${wd}` : `thiếu ${thieu.join(", ")}`}`);
    }
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const text = readFileSync(WF, "utf8");
  const fails = [];
  const check = (ok, msg) => {
    console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
    if (!ok) fails.push(msg);
  };
  const loi = loiWorkflow(text);
  const co = (luat) => loi.filter(([l]) => l === luat);
  check(!co("nam-job").length, co("nam-job")[0]?.[1] ?? `năm job: ${JOBS.join(", ")}`);
  check(!co("trigger").length && !co("pull-request-loc").length && !co("push-nhanh").length, "trigger đúng tập (pull_request không lọc paths, push main + ci-probe/**)");
  check(!co("secrets").length, "không secrets.");
  check(!co("continue-on-error").length && !co("or-true").length && !co("if-buoc").length, "không continue-on-error / || true / if: trên bước typecheck-test");
  check(!co("service-pg").length, co("service-pg")[0]?.[1] ?? "service PostGIS kartoza 17-3.5 5433:5432 + healthcheck ở mọi job gọi ci-db-init");
  const wf = yaml.load(text);
  for (const job of JOBS) {
    const l = co("lenh").filter(([, c]) => c.startsWith(`${job} ·`));
    const mo = (LENH[job] ?? []).map(([ten]) => `${ten}: ${wf.jobs[job]?.steps?.find((s) => s.name === ten)?.run?.trim().split("\n")[0] ?? "—"}`).join(" · ");
    check(!l.length, l.length ? l.map(([, c]) => c).join(" | ") : `${job}: ${mo}`);
  }
  for (const x of loi) if (!["nam-job", "trigger", "pull-request-loc", "push-nhanh", "secrets", "continue-on-error", "or-true", "if-buoc", "service-pg", "lenh"].includes(x[0])) check(false, x.join(": "));

  // chiều đỏ: mỗi đột biến trên bản sao văn bản phải bị đúng luật gọi tên
  const dotBien = [
    ["bỏ job data-api", "nam-job", (t) => t.replace(/\n  data-api:[\s\S]*?(?=\n  scripts:)/, "")],
    ["thêm paths cho pull_request", "pull-request-loc", (t) => t.replace("  pull_request:\n", '  pull_request:\n    paths: ["app/**"]\n')],
    ["push '**'", "push-nhanh", (t) => t.replace('branches: [main, "ci-probe/**"]', 'branches: ["**"]')],
    ["thêm secrets.X", "secrets", (t) => t.replace("run: npm run typecheck", "run: npm run typecheck\n        env:\n          K: ${{ secrets.X }}")],
    ["thêm continue-on-error", "continue-on-error", (t) => t.replace("      - name: test\n        working-directory: app", "      - name: test\n        continue-on-error: true\n        working-directory: app")],
    ["đổi cổng service", "service-pg", (t) => t.replace('ports: ["5433:5432"]', 'ports: ["5432:5432"]')],
    ["lệnh test thành true", "lenh", (t) => t.replace('NODE_OPTIONS="$(node ../scripts/lib/ci-can-du-lieu.mjs agent)" npm test', "true")],
  ];
  for (const [ten, luat, f] of dotBien) {
    const t2 = f(text);
    if (t2 === text) {
      check(false, `chiều đỏ: ${ten} — mẫu đột biến không khớp workflow`);
      continue;
    }
    const hit = loiWorkflow(t2).find(([l]) => l === luat);
    check(Boolean(hit), hit ? `chiều đỏ: ${ten} → báo ${luat} (${hit[1]})` : `chiều đỏ: ${ten} KHÔNG bị luật ${luat} báo`);
  }
  console.log(fails.length === 0 ? "\ncheck-ci-test: PASS" : `\ncheck-ci-test: FAIL (${fails.length})`);
  process.exit(fails.length === 0 ? 0 : 1);
}
