// node --test pipeline/scripts/ops-facts-so-tong-hop.test.mjs (cd pipeline && npm test)
// ON22 `ops-facts-so-tong-hop` (ADR-0014): push-ops-facts THẬT đẩy năm khối số tổng hợp, mỗi khối có measured_at, qua bộ
// soát tầng A. Lược đồ tạm trong DB local (ops-facts-fixture.mjs), máy chủ thu tạm (capture-ops-facts.mjs). Tên thật lấy
// lúc chạy từ db/migrations — tệp này không chứa tên. Tên ca mở đầu bằng mã AC. Phía app (AC-3, AC-5, AC-9):
// app/tests/ops-facts-so-tong-hop.test.tsx.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, describe, test } from "node:test";
import pg from "pg";
import { findSourceNames, maskSourceNames } from "../lib/mask-source-names.mjs";
import { runCheck } from "../../scripts/check-freshness.mjs";
import { sourceRegistrySeeds } from "../../scripts/lib/tier-a-source-names.mjs";
import { captureOpsFacts, localDbUrl, mutantPush } from "./capture-ops-facts.mjs";
import { dropOpsSchema, makeOpsSchema, schemaUrl } from "./ops-facts-fixture.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SEEDS = sourceRegistrySeeds();
const ENTRIES = SEEDS.map(({ code, realName }) => ({ code, realName }));
const name = (code) => SEEDS.find((s) => s.code === code).realName;
// ON5 (luong-7-ngay-dung-so) thêm khối thứ sáu `luong7`, ON4 (nhom-s03-tren-cloud) khối thứ bảy `s03` — cùng khuôn
// {measured_at, …} của ON22. DF1 (dong-chay-len-cloud) thêm khối thứ tám `dataFlow`: measured_at là computed_at CŨ NHẤT
// của bảng tính sẵn data_flow_snapshot — có thể trước lượt chạy (làm tươi ở bước cloud-sync trước), không được sau.
const BLOCKS = ["freshness", "jobs", "lockdown", "records24h", "reviewQueue", "luong7", "s03", "dataFlow"];
const OLD_KEYS = ["pushedAt", "funnel", "health", "jobs", "sourceRuns", "rotation", "zaloGroups", "zaloFlow", "zaloAccounts"];
const S = `on22_pipe_${process.pid}`;
const LOGS = () => ({
  "airdna-daily.log": `2026-10-24T19:06:00 ${name("S02")} rotation xong\n`,
  "launchd-smoke.log": "2026-10-24T20:00:00 smoke ok\n",
  "chotot.log": "2026-10-24T20:10:00 xong\n",
});
const admin = new pg.Client({ connectionString: localDbUrl() });
/** DF1: bảng tính sẵn 051 THẬT trên lược đồ tạm + ba dòng tối thiểu — khối `dataFlow` đo được như các khối khác. */
async function withFlow(schema) {
  const c = new pg.Client({ connectionString: schemaUrl(schema) });
  await c.connect();
  try {
    await c.query(readFileSync(path.join(HERE, "..", "..", "db/migrations/051_data_flow_snapshot.sql"), "utf8"));
    await c.query(`INSERT INTO data_flow_snapshot (time_window, computed_at, facts) SELECT w, now(), '{}'::jsonb FROM unnest(ARRAY['7d','30d','all']) w`);
  } finally {
    await c.end();
  }
}
const extra = []; // lược đồ phụ của ca «không đo được»

before(async () => {
  await admin.connect();
  await makeOpsSchema(admin, S);
  await withFlow(S);
});
after(async () => {
  for (const x of [S, ...extra]) await dropOpsSchema(admin, x).catch(() => {});
  await admin.end();
});

const run = (opts = {}) => captureOpsFacts({ logs: LOGS(), ...opts, env: { DATABASE_URL: schemaUrl(S), ...(opts.env ?? {}) } });
const factsLines = (stderr) => stderr.split("\n").filter((l) => l.startsWith("FACTS CHẶN"));

/** Lỗi khuôn năm khối: ["<khối>: <vì sao>"] — rỗng = đạt. */
function blockProblems(payload, t0, t1) {
  const out = [];
  const keys = Object.keys(payload?.blocks ?? {}).sort();
  if (JSON.stringify(keys) !== JSON.stringify([...BLOCKS].sort())) out.push(`blocks: khoá ${keys.join(",")} ≠ năm khối`);
  for (const b of BLOCKS) {
    const at = Date.parse(payload?.blocks?.[b]?.measured_at ?? "");
    if (!Number.isFinite(at)) out.push(`${b}: thiếu measured_at`);
    else if ((at < t0 - 1000 && !(b === "dataFlow" && !payload.blocks[b].error)) || at > t1 + 1000) out.push(`${b}: measured_at ngoài khoảng chạy`);
  }
  return out;
}

describe("ON22-AC-1 năm khối", () => {
  test("ON22-AC-1 bản tin có đúng năm khối, mỗi khối measured_at trong khoảng chạy, khoá cũ còn đủ", async () => {
    const t0 = Date.now();
    const r = await run();
    const t1 = Date.now();
    assert.equal(r.code, 0, r.stderr.slice(0, 800));
    assert.equal(r.posts, 1);
    assert.deepEqual(blockProblems(r.payload, t0, t1), []);
    for (const k of OLD_KEYS) assert.ok(k in r.payload, `khoá cũ ${k} mất khỏi bản tin`);
  });
  test("ON22-AC-1 bản sao bỏ measured_at một khối → ca bắt, nêu tên khối", async () => {
    const f = mutantPush("bo-moc.mjs", (s) => s.replace("return { measured_at: new Date().toISOString(), ...data };", "return { ...data };"));
    const t0 = Date.now();
    const r = await run({ script: f });
    const probs = blockProblems(r.payload, t0, Date.now());
    assert.ok(probs.includes("freshness: thiếu measured_at"), `phép đo không bắt khối thiếu mốc đo: ${probs.join(" | ")}`);
  });
});

describe("ON22-AC-2 độ tươi một định nghĩa", () => {
  const freshDiff = async (payload, now) => {
    const c = new pg.Client({ connectionString: schemaUrl(S) });
    await c.connect();
    try {
      const want = JSON.parse((await runCheck(c, { now, json: true })).stdout[0]);
      const got = payload.blocks.freshness.rows;
      assert.ok(want.length >= 3, "check-freshness phải có hàng để so");
      return want.filter((w, i) => JSON.stringify(w) !== JSON.stringify(got[i])).map((w) => w.code).concat(got.length !== want.length ? ["số hàng"] : []);
    } finally {
      await c.end();
    }
  };
  test("ON22-AC-2 khối freshness bằng từng hàng check-freshness --json cùng now", async () => {
    const now = new Date();
    const r = await run({ env: { OPS_FACTS_NOW: now.toISOString() } });
    assert.equal(r.code, 0, r.stderr.slice(0, 800));
    assert.deepEqual(await freshDiff(r.payload, now), []);
  });
  test("ON22-AC-2 bản sao đổi SLO một mã → phép so bắt đúng mã", async () => {
    const f = mutantPush("lech-slo.mjs", (s) => s.replace("rows: await readFreshness(client, { now })",
      "rows: (await readFreshness(client, { now })).map((x) => (x.code === \"S01\" ? { ...x, sloHours: 1 } : x))"));
    const now = new Date();
    const r = await run({ script: f, env: { OPS_FACTS_NOW: now.toISOString() } });
    assert.deepEqual(await freshDiff(r.payload, now), ["S01"]);
  });
});

describe("ON22-AC-4 thẻ chờ duyệt", () => {
  const WANT = { byType: [{ type: "agent_output", n: 2 }, { type: "entity_match", n: 3 }], total: 5 };
  const shapeProblems = (b) => {
    const keys = Object.keys(b).sort().join(",");
    return keys === "byType,measured_at,total" ? [] : [`khoá khối reviewQueue: ${keys}`];
  };
  test("ON22-AC-4 reviewQueue = số thẻ pending theo item_type, chỉ ba khoá", async () => {
    const r = await run();
    const { measured_at: _m, ...data } = r.payload.blocks.reviewQueue;
    assert.deepEqual(data, WANT);
    assert.deepEqual(shapeProblems(r.payload.blocks.reviewQueue), []);
  });
  test("ON22-AC-4 bản sao đẩy tiêu đề thẻ → bắt", async () => {
    const f = mutantPush("tieu-de.mjs", (s) => s.replace("measure(() => readReviewQueue(client))",
      "measure(async () => ({ ...(await readReviewQueue(client)), titles: (await client.query(\"SELECT title FROM review_queue\")).rows.map((x) => x.title) }))"));
    const r = await run({ script: f });
    assert.deepEqual(shapeProblems(r.payload.blocks.reviewQueue), ["khoá khối reviewQueue: byType,measured_at,titles,total"]);
  });
});

describe("ON22-AC-6 job launchd", () => {
  test("ON22-AC-6 khối jobs khớp bản chụp launchctl 23/10: mỗi nhãn của pipeline/cron có mặt, lastExit, pid, nhãn che S0x", async () => {
    const t0 = Date.now();
    const r = await run();
    const items = r.payload.blocks.jobs.items;
    // bản chụp 23/10: «-\t0\tcom.oneinvest.smoke», «-\t0\tcom.oneinvest.<S06>»; plist đọc theo tên tệp
    const want = ["com.oneinvest.chotot", "com.oneinvest.smoke"].map((l) => maskSourceNames(l, ENTRIES));
    assert.deepEqual(items.map((j) => j.id), want);
    assert.ok(want[0].includes("S06"), "nhãn mang tên nguồn thật phải thành mã S0x");
    for (const j of items) {
      assert.equal(j.pid, null);
      assert.equal(j.lastExit, 0);
      assert.equal(j.running, false);
      assert.ok(Date.parse(j.lastLogAt) >= t0 - 1000, `${j.id}: lastLogAt phải là mốc ghi tệp log của lượt này`);
    }
    assert.deepEqual(findSourceNames(JSON.stringify(r.payload.blocks.jobs), ENTRIES), []);
  });
  // Bản liệt viết trước: nhãn ngoài cron, pid số, mã thoát khác 0, tệp log vắng (launchd-collector-api.log không tạo).
  const LISTING = ["PID\tStatus\tLabel", "123\t0\tcom.oneinvest.collector-api", "-\t2\tcom.oneinvest.chotot",
    "-\t0\tcom.oneinvest.smoke", "456\t0\tcom.apple.ngoai-cron", ""].join("\n");
  const WANT = { "com.oneinvest.chotot": [null, 2, false, true], "com.oneinvest.collector-api": [123, 0, true, false], "com.oneinvest.smoke": [null, 0, false, true] };
  const declared = () => readdirSync(path.join(HERE, "..", "cron")).filter((f) => f.endsWith(".plist")).sort()
    .map((f) => readFileSync(path.join(HERE, "..", "cron", f), "utf8").match(/<key>Label<\/key>\s*<string>([^<]+)</)[1]);
  const jobsProblems = (items) => {
    const want = declared().filter((l) => l in WANT).map((l) => maskSourceNames(l, ENTRIES));
    const out = [];
    if (JSON.stringify(items.map((j) => j.id)) !== JSON.stringify(want)) out.push(`nhãn ${items.map((j) => j.id).join(",")} ≠ ${want.join(",")}`);
    for (const [label, [pid, exit, running, hasLog]] of Object.entries(WANT)) {
      const j = items.find((x) => x.id === maskSourceNames(label, ENTRIES));
      if (!j) continue;
      if (j.pid !== pid || j.lastExit !== exit || j.running !== running) out.push(`${j.id}: pid/lastExit/running`);
      if ((j.lastLogAt !== null) !== hasLog) out.push(`${j.id}: lastLogAt`);
    }
    return out;
  };
  test("ON22-AC-6 bản liệt viết trước: đúng các nhãn cron có mặt, pid số, mã thoát, lastLogAt null khi tệp log vắng, nhãn ngoài cron bị loại", async () => {
    const r = await run({ launchctl: LISTING });
    assert.equal(r.code, 0, r.stderr.slice(0, 800));
    assert.deepEqual(jobsProblems(r.payload.blocks.jobs.items), []);
  });
  test("ON22-AC-6 bản sao mất bộ lọc nhãn cron → bắt", async () => {
    const f = mutantPush("mat-loc.mjs", (s) => s.replace("items: await readLaunchdJobs({",
      "items: [{ id: \"com.apple.ngoai-cron\", pid: 456, lastExit: 0, running: true, lastLogAt: null }, ...await readLaunchdJobs({").replace(
      "launchctl: process.env.LAUNCHCTL ?? \"launchctl\",\n      }),", "launchctl: process.env.LAUNCHCTL ?? \"launchctl\",\n      })],"));
    const r = await run({ script: f, launchctl: LISTING });
    assert.ok(jobsProblems(r.payload.blocks.jobs.items).some((p) => p.startsWith("nhãn ")), "phép đo phải thấy nhãn ngoài cron");
  });
  test("ON22-AC-6 launchctl không chạy → error, 0 hàng", async () => {
    const r = await run({ launchctl: null });
    assert.equal(r.code, 0, r.stderr.slice(0, 800));
    assert.match(r.payload.blocks.jobs.error ?? "", /^không đo được/);
    assert.equal(r.payload.blocks.jobs.items, undefined);
  });
});

describe("ON22-AC-7 khối không đo được", () => {
  // ma trận viết trước: [khối, cách làm hỏng]
  // [khối làm hỏng, cách làm hỏng, ĐÚNG tập khối được phép lỗi] — độ tươi cũng đọc airbnb_snapshots (S01/S03/S05/S06)
  const MATRIX = [
    ["reviewQueue", { omit: ["review_queue"] }, ["reviewQueue"]],
    ["jobs", { launchctl: null }, ["jobs"]],
    ["freshness", { omit: ["stg_chotot_ads"] }, ["freshness"]],
    ["records24h", { omit: ["airbnb_snapshots"] }, ["freshness", "records24h"]],
    // ON4: cấu hình OpenClaw không đọc được → chỉ khối s03 lỗi.
    ["s03", { noCfg: true }, ["s03"]],
    // DF1: máy thu chưa áp 051 → chỉ khối dataFlow lỗi.
    ["dataFlow", { omit: ["data_flow_snapshot"] }, ["dataFlow"]],
  ];
  /** Cấu hình OpenClaw tối thiểu + nhật ký cổng rỗng ở HOME tạm để khối s03 đo được (ON4) — ca `noCfg` bỏ cả hai. */
  const CFG_HOME = { ".openclaw/openclaw.json": JSON.stringify({ channels: { zalouser: { groups: {} } } }), ".openclaw/logs/oneinvest-zalo-pipe.log": "" };
  const errored = (payload) => BLOCKS.filter((b) => payload.blocks[b].error !== undefined);
  const DATA = { freshness: "rows", jobs: "items", records24h: "bySource", reviewQueue: "byType", s03: "groups", dataFlow: "windows" };
  const caseRun = async ([block, how], script) => {
    let schema = S;
    if (how.omit) {
      schema = `on22_pipe_${block.toLowerCase()}_${process.pid}`;
      extra.push(schema);
      await makeOpsSchema(admin, schema, { omit: how.omit });
      if (!how.omit.includes("data_flow_snapshot")) await withFlow(schema);
    }
    return captureOpsFacts({ script, logs: LOGS(), home: how.noCfg ? {} : CFG_HOME, ...(how.launchctl === null ? { launchctl: null } : {}), env: { DATABASE_URL: schemaUrl(schema) } });
  };
  test("ON22-AC-7 ma trận khối không đo được → {measured_at, error}, khối khác vẫn đo, bản tin vẫn gửi", async () => {
    for (const c of MATRIX) {
      const [block] = c;
      const r = await caseRun(c);
      assert.equal(r.code, 0, `${block}: ${r.stderr.slice(0, 500)}`);
      assert.equal(r.posts, 1, `${block}: bản tin vẫn phải gửi`);
      const b = r.payload.blocks[block];
      assert.match(b.error ?? "", /^không đo được/, `${block}: phải ghi lỗi`);
      assert.ok(Number.isFinite(Date.parse(b.measured_at)), `${block}: lỗi vẫn có measured_at`);
      assert.equal(b[DATA[block]], undefined, `${block}: khối lỗi không được mang số`);
      assert.deepEqual(errored(r.payload), c[2], `${block}: đúng tập khối lỗi viết trước — mọi khối khác vẫn đo`);
    }
  });
  test("ON22-AC-7 bản sao lỗi dây chuyền (độ tươi hỏng kéo khối khác) → bắt", async () => {
    const f = mutantPush("day-chuyen.mjs", (s) => s.replace(
      "const records24hBlock = await measure(",
      "const records24hBlock = freshnessBlock.error ? { measured_at: new Date().toISOString(), error: \"không đo được: dây chuyền\" } : await measure("));
    const r = await caseRun(MATRIX[2], f);
    assert.notDeepEqual(errored(r.payload), MATRIX[2][2], "phép đo phải thấy khối records24h lỗi theo");
  });
  test("ON22-AC-7 bản sao thay lỗi bằng 0 → bắt", async () => {
    const f = mutantPush("loi-thanh-0.mjs", (s) => s.replace(
      "return { measured_at: new Date().toISOString(), error: msg ? `không đo được: ${msg}` : \"không đo được\" };",
      "return { measured_at: new Date().toISOString(), rows: [], items: [], bySource: [], byType: [], total: 0 };"));
    const r = await caseRun(MATRIX[0], f);
    assert.equal(r.payload.blocks.reviewQueue.error, undefined, "khuôn đột biến phải làm mất chữ lỗi");
    assert.throws(() => assert.match(r.payload.blocks.reviewQueue.error ?? "", /^không đo được/), /không đo được/);
  });
});

describe("ON22-AC-8 bộ soát tầng A trên năm khối", () => {
  const ANCHOR = "  // NT2: bộ soát tầng A chung";
  test("ON22-AC-8 ma trận cấy tên vào năm khối → mỗi bản thoát ≠0, 0 POST, dòng chặn nêu blocks.<khối> viết trước", async () => {
    const f = mutantPush("cay-khoi.mjs", (s) => s.replace(ANCHOR,
      `  new Function("payload", "N", process.env.NT2_CAY)(payload, REG.names.find((n) => n.code === "S02").realName);\n${ANCHOR}`));
    const MATRIX = [
      ...BLOCKS.map((b) => [`payload.blocks.${b}.cay = N;`, `blocks.${b}.cay`]),
      ["payload.blocks.lockdown.layers[0].desc = N;", "blocks.lockdown.layers[0].desc"],
    ];
    for (const [code, p] of MATRIX) {
      const r = await run({ script: f, env: { NT2_CAY: code } });
      assert.notEqual(r.code, 0, `${p}: phải thoát ≠ 0`);
      assert.equal(r.posts, 0, `${p}: không được gửi`);
      assert.ok(factsLines(r.stderr).includes(`FACTS CHẶN [tầng A] ${p} S02`), `${p}: ${factsLines(r.stderr).join(" | ")}`);
    }
  });
});

describe("ON22-AC-10 máy thu thật", () => {
  // log + cấu hình + DB + launchctl THẬT; không nhánh skip — thiếu thứ gì thì ca đỏ, nêu thứ thiếu.
  const mainRoot = () => path.dirname(execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: HERE, encoding: "utf8" }).trim());
  const realEnv = () => ({ HOME: homedir(), ONEINVEST_ROOT: mainRoot(), DATABASE_URL: localDbUrl(), LAUNCHCTL: "/bin/launchctl", OPENCLAW_LOG_DIR: "/tmp/openclaw", ONEINVEST_CRON_DIR: path.join(HERE, "..", "cron") });
  test("ON22-AC-10 máy thu thật, chế độ khô: năm khối có measured_at, freshness bằng check-freshness, 0 chỗ chặn, đầu ra chỉ tên khối + trạng thái", async () => {
    const real = new pg.Client({ connectionString: localDbUrl() });
    await real.connect().catch((e) => assert.fail(`DB local :5433 không tới được — ca không bỏ qua: ${e.message}`));
    try {
      execFileSync("/bin/launchctl", ["list"], { stdio: "ignore" });
    } catch (e) {
      await real.end();
      assert.fail(`launchctl không chạy được — ca không bỏ qua: ${e.message}`);
    }
    try {
      const kho = await captureOpsFacts({ args: ["--kho"], env: realEnv() });
      assert.equal(kho.code, 0, factsLines(kho.stderr).join(" | ") || kho.stderr.slice(0, 800));
      assert.equal(kho.posts, 0, "chế độ khô không được gửi");
      assert.match(kho.stdout, /ops-facts khô: sạch, 0 chỗ chặn/);
      const line = kho.stdout.split("\n").find((l) => l.startsWith("khối: "));
      // DF1: khối dataFlow đo được khi máy thu đã áp migration 051 (bảng tính sẵn); trước đó nó phải nói «không đo được».
      const co051 = (await real.query(`SELECT to_regclass('public.data_flow_snapshot')::text AS r`)).rows[0].r !== null;
      console.log(`# ON22-AC-10 bảng data_flow_snapshot ở máy thu: ${co051 ? "có" : "chưa áp 051"}`);
      const trang = (b) => (b === "dataFlow" && !co051 ? "không đo được" : "đo được");
      assert.equal(line, `khối: ${BLOCKS.map((b) => `${b} ${trang(b)}`).join(" · ")}`, "năm khối phải đo được trên máy thật");
      assert.deepEqual(findSourceNames(kho.stdout + kho.stderr.replace(/^(FACTS CHẶN \[tầng A\]) \S+/gm, "$1"), ENTRIES), []);
      const now = new Date();
      const sent = await captureOpsFacts({ env: { ...realEnv(), OPS_FACTS_NOW: now.toISOString() } }); // gửi về máy chủ thu tạm, không lên cloud
      assert.equal(sent.code, 0, sent.stderr.slice(0, 800));
      assert.deepEqual(blockProblems(sent.payload, now.getTime() - 60_000, Date.now()), []);
      const want = JSON.parse((await runCheck(real, { now, json: true })).stdout[0]);
      assert.deepEqual(sent.payload.blocks.freshness.rows, want);
    } finally {
      await real.end();
    }
  });
});
