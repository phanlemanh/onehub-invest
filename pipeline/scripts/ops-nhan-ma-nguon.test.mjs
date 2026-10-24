// node --test pipeline/scripts/ops-nhan-ma-nguon.test.mjs (cd pipeline && npm test)
// ON7 `ops-nhan-ma-nguon`: AC-7 bộ che tên nguồn thật (bản pipeline + bản app trên cùng bảng ca) và AC-4 payload facts
// do push-ops-facts thật đẩy. Tên thật lấy lúc chạy từ db/migrations — tệp này không chứa tên. Tên ca mở đầu bằng mã AC.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";
import * as pipe from "../lib/mask-source-names.mjs";
import * as app from "../../app/src/lib/mask-source-names.ts";
import { sourceRegistrySeeds } from "../../scripts/lib/tier-a-source-names.mjs";
import { EXEMPT, PUSH, captureOpsFacts, payloadLeaks } from "./capture-ops-facts.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SEEDS = sourceRegistrySeeds();
const ENTRIES = SEEDS.map(({ code, realName }) => ({ code, realName }));
const name = (code) => SEEDS.find((s) => s.code === code).realName;
const FORMS = {
  full: (n) => n,
  upper: (n) => n.toUpperCase(),
  fold: (n) => pipe.fold(n),
  joined: (n) => pipe.fold(n).replace(/[\s.\-_/]+/g, ""),
  suffix: (n) => pipe.fold(n).replace(/[\s.\-_/]+/g, "") + "user",
  first: (n) => n.split(/\s+/)[0],
};
const expand = (s) => s?.replace(/\{(S0\d):(\w+)\}/g, (_, code, form) => FORMS[form](name(code)));

describe("ON7-AC-7 bộ che", () => {
  const { cases } = JSON.parse(readFileSync(path.join(HERE, "mask-source-names.cases.json"), "utf8"));
  test("ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau", () => {
    assert.ok(cases.length >= 10, "bảng ca phải đủ 10 ca viết trước");
    for (const c of cases) {
      const input = expand(c.in);
      const want = c.out === null ? null : expand(c.out);
      const names = c.names ?? ENTRIES;
      assert.equal(pipe.maskSourceNames(input, names), want, `bản pipeline sai ở ca «${c.ten}»`);
      assert.equal(app.maskSourceNames(input, names), want, `bản app sai ở ca «${c.ten}»`);
    }
  });
  test("ON7-AC-7 tên ba ký tự giữa một từ khác không bị thay", () => {
    const short = SEEDS.find((s) => pipe.nameVariants(s.realName).some((v) => v.length < 4));
    assert.ok(short, "migration phải có ít nhất một tên ba ký tự để ca này có nghĩa");
    const inWord = `x${pipe.fold(short.realName)}y`;
    for (const m of [pipe, app]) assert.equal(m.maskSourceNames(inWord, ENTRIES), inWord, "tên ngắn giữa từ bị thay nhầm");
  });
  test("ON7-AC-7 danh sách tên rỗng → cả hai bản trả null", () => {
    for (const m of [pipe, app]) {
      assert.equal(m.maskSourceNames(`lỗi ${name("S02")}`, []), null, "đóng chặt: không được trả chuỗi gốc");
      assert.equal(m.maskSourceNames(`lỗi ${name("S02")}`, null), null);
    }
  });
});

// ---- AC-4: payload facts do push-ops-facts THẬT đẩy ----
// Dòng log cuối của mỗi job mang tên thật ở một dạng khác nhau (đủ, viết liền, dính hậu tố) — bên đọc phải che.
const LOGS = () => ({
  "airdna-daily.log": `2026-10-24T19:05:00 bắt đầu\n2026-10-24T19:06:00 ${name("S02")} rotation xong 6 market\n`,
  "launchd-smoke.log": `2026-10-24T20:00:00 smoke ${FORMS.joined(name("S01"))} ok\n`,
  "weekly-20261024.log": `2026-10-24T19:30:00 collect ${FORMS.fold(name("S06"))} xong\n`,
  "cloud-sync.log": `2026-10-24T19:45:00 heartbeat ${FORMS.suffix(name("S03"))} ok\n`,
});

function mutantCopy(file, fn) {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "ops-facts-mut-")));
  for (const d of ["node_modules", "lib"]) if (!existsSync(path.join(dir, d))) symlinkSync(path.join(HERE, "..", d), path.join(dir, d));
  // NT2 chặn bản tin còn tên trước khi gửi — bản sao của thước ON7 gỡ bộ soát ấy để máy chủ thu nhận payload mà đo.
  const src = readFileSync(PUSH, "utf8");
  const noGuard = src.replace("const chan = factsChan(payload, REG.names);", "const chan = [];");
  assert.notEqual(noGuard, src, "khuôn gỡ bộ soát NT2 không khớp mã nguồn push-ops-facts");
  const out = fn(noGuard);
  assert.notEqual(out, noGuard, `khuôn đột biến ${file} không khớp mã nguồn push-ops-facts`);
  writeFileSync(path.join(dir, file), out);
  return path.join(dir, file);
}

describe("ON7-AC-4 payload facts", () => {
  test("ON7-AC-4 push-ops-facts thật → payload bắt được: 6 job, 0 tên nguồn thật trong MỌI giá trị chuỗi (trừ zaloGroups[].name và zaloAccounts[]), id trung tính, dòng log cuối mang mã S0x", async () => {
    const r = await captureOpsFacts({ logs: LOGS() });
    assert.equal(r.code, 0, r.stderr.slice(0, 800));
    assert.ok(r.payload, "máy chủ thu không nhận được payload");
    assert.equal(r.payload.jobs.length, 6, "payload phải đủ 6 job");
    assert.deepEqual(payloadLeaks(r.payload, ENTRIES, EXEMPT), [], "payload còn tên nguồn thật");
    const byId = Object.fromEntries(r.payload.jobs.map((j) => [j.id, j]));
    assert.deepEqual(Object.keys(byId).sort(), ["cloud-sync", "collector-api", "kev", "s01-smoke", "s01-weekly", "s02-daily"]);
    assert.equal(byId["s02-daily"].lastLine, "2026-10-24T19:06:00 S02 rotation xong 6 market");
    assert.equal(byId["s01-smoke"].lastLine, "2026-10-24T20:00:00 smoke S01 ok");
    assert.equal(byId["s01-weekly"].lastLine, "2026-10-24T19:30:00 collect S06 xong");
    assert.equal(byId["cloud-sync"].lastLine, "2026-10-24T19:45:00 heartbeat S03user ok");
    assert.match(byId["s02-daily"].label, /^S02 · \S/, "nhãn job phải là «S02 · vai trò»");
  });
  test("ON7-AC-4 chiều đỏ: bản sao bỏ bộ che → bắt dòng log cuối, nêu mã S0x", async () => {
    const f = mutantCopy("bo-che.mjs", (s) => s.replace("lastLine: maskSourceNames(j.lastLine, REG.names)", "lastLine: j.lastLine"));
    const r = await captureOpsFacts({ script: f, logs: LOGS() });
    assert.equal(r.code, 0, r.stderr.slice(0, 800));
    const leaks = payloadLeaks(r.payload, ENTRIES, EXEMPT);
    assert.ok(leaks.includes("jobs[0].lastLine S02"), `phép đo không bắt dòng log cuối của job S02: ${leaks.join(" | ")}`);
    assert.deepEqual(findLeakedNames(leaks), [], "thông điệp không được chứa tên");
  });
  test("ON7-AC-4 chiều đỏ: bản sao thêm giá trị mang tên thật ngoài jobs → bắt, nêu đường JSON", async () => {
    const f = mutantCopy("them-truong.mjs", (s) => s.replace("pushedAt: new Date().toISOString(),", "pushedAt: new Date().toISOString(), debugSource: REG.names[1]?.realName,"));
    const r = await captureOpsFacts({ script: f, logs: LOGS() });
    assert.equal(r.code, 0, r.stderr.slice(0, 800));
    const leaks = payloadLeaks(r.payload, ENTRIES, EXEMPT);
    assert.ok(leaks.some((l) => /^debugSource S0\d$/.test(l)), `phép đo không bắt giá trị ngoài jobs: ${leaks.join(" | ")}`);
  });
});
const findLeakedNames = (msgs) => msgs.flatMap((m) => pipe.findSourceNames(m, ENTRIES));
