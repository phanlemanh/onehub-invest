// node --test pipeline/scripts/soat-tang-a.test.mjs (cd pipeline && npm test)
// NT2 `soat-tang-a-moi-duong-len-cloud`: MỘT bộ soát tầng A (pipeline/lib/tier-a-guard.mjs) cho sync-cloud và push-ops-facts.
// Tên thật lấy lúc chạy từ db/migrations — tệp này không chứa tên. Tên ca mở đầu bằng mã AC.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";
import { findSourceNames, fold } from "../lib/mask-source-names.mjs";
import { guardValues } from "../lib/tier-a-guard.mjs";
import { assertNoSourceNames, scanSourceNames } from "../sync-cloud.mjs";
import { sourceRegistrySeeds } from "../../scripts/lib/tier-a-source-names.mjs";
import { captureOpsFacts, mutantPush, payloadLeaks } from "./capture-ops-facts.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SEEDS = sourceRegistrySeeds();
const ENTRIES = SEEDS.map(({ code, realName }) => ({ code, realName }));
const name = (code) => SEEDS.find((s) => s.code === code).realName;
const FORMS = {
  full: (n) => n, upper: (n) => n.toUpperCase(), fold: (n) => fold(n),
  joined: (n) => fold(n).replace(/[\s.\-_/]+/g, ""), suffix: (n) => fold(n).replace(/[\s.\-_/]+/g, "") + "user",
  first: (n) => n.split(/\s+/)[0],
};
const expand = (s) => s.replace(/\{(S0\d):(\w+)\}/g, (_, code, form) => FORMS[form](name(code)));

describe("NT2-AC-6 một bộ soát", () => {
  test("NT2-AC-6 bảng ca ON7 qua scanSourceNames và guardValues → cùng kết quả từng ca", () => {
    const { cases } = JSON.parse(readFileSync(path.join(HERE, "mask-source-names.cases.json"), "utf8"));
    const withNames = cases.filter((c) => !c.names);
    assert.ok(withNames.length >= 9, "bảng ca phải có đủ ca viết trước");
    const tokens = SEEDS.map((s) => s.realName);
    let hits = 0;
    for (const c of withNames) {
      const text = expand(c.in);
      const viaSync = scanSourceNames(text, tokens) !== null;
      const viaGuard = guardValues(text, ENTRIES).length > 0;
      assert.equal(viaSync, viaGuard, `hai đường lệch ở ca «${c.ten}»`);
      if (viaGuard) hits++;
    }
    assert.ok(hits >= 6 && hits < withNames.length, `bảng ca phải có cả ca trúng lẫn ca không trúng (trúng ${hits}/${withNames.length})`);
  });
});

describe("che-ten AC-2: bộ soát bảng người bán soát từng giá trị đã giải JSON", () => {
  const tk = [{ token: "Lumora Thịnh", wholeOnly: true }, { token: "market.lumorathinh.vn", wholeOnly: true }];
  const dong = (v) => new Map([["sale_offers", [JSON.stringify({ offer_id: "o1", street_raw: v })]]]);
  for (const v of ["ngõ Lumora\nThịnh 3", "ngõ Lumora\tThịnh 3", "ngõ Lumora – Thịnh 3"]) test(`cụm khai cờ trong cột ngoài nhóm người bán bị chặn (dài ${v.length})`, () => {
    assert.throws(() => assertNoSourceNames(dong(v), tk), /định danh nguồn/, "AC-2 bộ soát bảng để lọt cụm qua chuỗi JSON");
  });
  test("đối chứng: tên mang thương hiệu đi qua", () => assert.doesNotThrow(() => assertNoSourceNames(dong("dự án Lumora Park"), tk)));
});

describe("che-ten AC-4: guardValues với dòng khai khớp nguyên cụm (tải giả)", () => {
  const co = (wholeOnly) => [{ code: "S90", realName: "Lumora Thịnh", wholeOnly }, { code: "S90", realName: "market.lumorathinh.vn", wholeOnly }];
  test("tên dự án mang thương hiệu: 0 chỗ trúng khi khai cờ, ≥ 1 khi không khai", () => {
    assert.equal(guardValues({ a: ["dự án Lumora Park"] }, co(true)).length, 0);
    assert.ok(guardValues({ a: ["dự án Lumora Park"] }, co(false)).length >= 1);
  });
  for (const v of ["cron Lumora Thịnh", "tải market.lumorathinh.vn", "lumora-thinh"]) test(`cụm tên hay tên miền bị bắt ở cả hai trạng thái cờ (dài ${v.length})`, () => {
    assert.ok(guardValues({ a: v }, co(true)).length >= 1);
    assert.ok(guardValues({ a: v }, co(false)).length >= 1);
  });
});

// ---- AC-1…AC-5, AC-10: push-ops-facts THẬT (và bản sao đột biến) chạy qua máy chủ thu tạm ----
const LOGS = () => ({
  "airdna-daily.log": `2026-10-24T19:05:00 bắt đầu\n2026-10-24T19:06:00 ${name("S02")} rotation xong 6 market\n`,
  "launchd-smoke.log": `2026-10-24T20:00:00 smoke ${FORMS.joined(name("S01"))} ok\n`,
  "weekly-20261024.log": `2026-10-24T19:30:00 collect ${FORMS.fold(name("S06"))} xong\n`,
  "cloud-sync.log": `2026-10-24T19:45:00 heartbeat ${FORMS.suffix(name("S03"))} ok\n`,
});
const TIER_C = [/^zaloGroups\[\d+\]\.name$/];
const factsLines = (stderr) => stderr.split("\n").filter((l) => l.startsWith("FACTS CHẶN"));
const namesIn = (text) => findSourceNames(text, ENTRIES);
// Khoá JSON của bản tin (zaloGroups…) đã chốt giữ nguyên (ON7, ngoài phạm vi) — soát tên trên đầu ra trừ đường JSON của dòng chặn.
const outputNames = (text) => namesIn(text.replace(/^(FACTS CHẶN \[tầng A\]) \S+/gm, "$1"));
// Bản sao cấy giá trị: đoạn mã trong NT2_CAY chạy trên payload ngay trước bộ soát, N = tên thật của S02.
const ANCHOR = "  // NT2: bộ soát tầng A chung";
const cayCopy = () => mutantPush("cay.mjs", (s) => s.replace(ANCHOR,
  `  new Function("payload", "N", process.env.NT2_CAY)(payload, REG.names.find((n) => n.code === "S02").realName);\n${ANCHOR}`));

function assertBlocked(r, wantLine) {
  assert.notEqual(r.code, 0, "bản tin còn tên phải thoát ≠ 0");
  assert.equal(r.posts, 0, "máy chủ thu không được nhận POST nào");
  assert.ok(factsLines(r.stderr).includes(wantLine), `thiếu dòng «${wantLine}»: ${factsLines(r.stderr).join(" | ")}`);
  assert.deepEqual(outputNames(r.stderr + r.stdout), [], "đầu ra không được chứa tên nguồn thật");
}

describe("NT2-AC-1…AC-5 push-ops-facts qua bộ soát", () => {
  test("NT2-AC-1 bản tin lành → thoát 0, máy chủ thu nhận đúng một POST", async () => {
    const r = await captureOpsFacts({ logs: LOGS() });
    assert.equal(r.code, 0, r.stderr.slice(0, 800));
    assert.equal(r.posts, 1, "bản tin lành phải đi đúng một POST");
    assert.deepEqual(factsLines(r.stderr), [], "bản tin lành không được có dòng chặn");
    assert.deepEqual(payloadLeaks(r.payload, ENTRIES, TIER_C), [], "bản tin lành còn tên nguồn thật");
  });

  test("NT2-AC-2 bản sao bỏ bộ che → thoát ≠0, 0 POST, dòng FACTS CHẶN [tầng A] jobs[0].lastLine S02, không in tên", async () => {
    const f = mutantPush("bo-che.mjs", (s) => s.replace("lastLine: maskSourceNames(j.lastLine, REG.names)", "lastLine: j.lastLine"));
    assertBlocked(await captureOpsFacts({ script: f, logs: LOGS() }), "FACTS CHẶN [tầng A] jobs[0].lastLine S02");
  });

  // Ma trận viết trước: mỗi khoá cấp một của bản tin một ca, cộng một chuỗi lồng sâu và trường anh em cạnh đường miễn.
  const MATRIX = [
    { key: "pushedAt", code: "payload.pushedAt = N;", path: "pushedAt" },
    { key: "funnel", code: "payload.funnel.cay = N;", path: "funnel.cay" },
    { key: "health", code: "payload.health.lastHeartbeatAt = N;", path: "health.lastHeartbeatAt" },
    { key: "jobs", code: "payload.jobs[3].label = N;", path: "jobs[3].label" },
    { key: "sourceRuns", code: "payload.sourceRuns.unshift({ code: \"S09\", label_vi: N });", path: "sourceRuns[0].label_vi" },
    { key: "rotation", code: "payload.rotation.cay = N;", path: "rotation.cay" },
    { key: "zaloGroups", code: "payload.zaloGroups.unshift({ name: \"nhóm thử\", ownerAccount: N });", path: "zaloGroups[0].ownerAccount" },
    { key: "zaloFlow", code: "payload.zaloFlow[\"2026-10-24\"] = { ghi: N };", path: "zaloFlow.2026-10-24.ghi" },
    { key: "zaloAccounts", code: "payload.zaloAccounts.unshift({ accountId: \"x\", name: null, profile: N });", path: "zaloAccounts[0].profile" },
    { key: "blocks", code: "payload.blocks.cay = N;", path: "blocks.cay" }, // ON22: năm khối số tổng hợp
    { key: null, code: "payload.rotation.next = [{ id: \"1\", meta: { tags: [\"a\", N] } }];", path: "rotation.next[0].meta.tags[1]" },
  ];
  test("NT2-AC-3 ma trận viết trước: mỗi khoá cấp một + một chuỗi lồng sâu + trường anh em cạnh đường miễn → mỗi bản thoát ≠0, 0 POST, dòng chặn nêu đúng đường JSON viết trước", async () => {
    const healthy = await captureOpsFacts({ logs: LOGS() });
    assert.equal(healthy.code, 0, healthy.stderr.slice(0, 800));
    const healthyKeys = Object.keys(healthy.payload).sort();
    assert.deepEqual(MATRIX.filter((m) => m.key).map((m) => m.key).sort(), healthyKeys, "ma trận phải phủ ĐÚNG mọi khoá cấp một của bản tin");
    const f = cayCopy();
    for (const m of MATRIX) {
      const r = await captureOpsFacts({ script: f, logs: LOGS(), env: { NT2_CAY: m.code } });
      assertBlocked(r, `FACTS CHẶN [tầng A] ${m.path} S02`);
    }
  });

  test("NT2-AC-3 tên trong zaloGroups[0].name (tầng C) → không chặn", async () => {
    const r = await captureOpsFacts({ script: cayCopy(), logs: LOGS(), env: { NT2_CAY: "payload.zaloGroups.unshift({ name: N });" } });
    assert.equal(r.code, 0, r.stderr.slice(0, 800));
    assert.equal(r.posts, 1, "tên nhóm S03 là tầng C — bản tin phải đi");
    assert.equal(namesIn(r.payload.zaloGroups[0].name).length, 1, "ca phải thật sự mang tên trong zaloGroups[0].name");
  });

  const ACCOUNTS = JSON.stringify({ channels: { zalouser: { accounts: {
    default: { name: "Tài khoản chính", groups: { g1: { enabled: true } } },
    phu: { name: "Tài khoản phụ", profile: "phu", groups: {} },
  } } } });
  test("NT2-AC-4 cấu hình tài khoản có tên → bản tin gửi zaloAccounts[i].name null", async () => {
    const r = await captureOpsFacts({ logs: LOGS(), home: { ".openclaw/openclaw.json": ACCOUNTS } });
    assert.equal(r.code, 0, r.stderr.slice(0, 800));
    assert.equal(r.posts, 1);
    assert.deepEqual(r.payload.zaloAccounts.map((a) => a.accountId), ["default", "phu"], "phải dựng đủ hai tài khoản từ cấu hình");
    assert.deepEqual(r.payload.zaloAccounts.map((a) => a.name), [null, null], "tên tài khoản thu là tầng A — gửi null");
  });

  test("NT2-AC-4 bản sao gửi tên tài khoản → chặn, nêu zaloAccounts[0].name", async () => {
    const f = mutantPush("ten-tk.mjs", (s) => s.replace("name: null, profile:", "name: z.accounts?.[id]?.name ?? null, profile:"));
    const r = await captureOpsFacts({ script: f, logs: LOGS(), home: { ".openclaw/openclaw.json": ACCOUNTS } });
    assertBlocked(r, "FACTS CHẶN [tầng A] zaloAccounts[0].name tên tài khoản thu");
    assert.ok(!r.stderr.includes("Tài khoản chính"), "dòng chặn không được in tên tài khoản");
  });

  test("NT2-AC-5 không đọc được source_registry → chặn, 0 POST, dòng nói không có danh sách tên", async () => {
    const f = mutantPush("reg-rong.mjs", (s) => s.replace("REG.names = await docSourceNameEntries(client);", "REG.names = [];"));
    const r = await captureOpsFacts({ script: f, logs: LOGS() });
    assert.notEqual(r.code, 0);
    assert.equal(r.posts, 0, "không có danh sách tên thì không được gửi");
    assert.ok(factsLines(r.stderr).some((l) => l.includes("không có danh sách tên để soát")), r.stderr.slice(0, 800));
  });
});

describe("DD-AC-6 bản tin không mang mã nhóm (dinh-danh-tai-khoan-thu-theo-vai, Hỏi-1 = A)", () => {
  // Hai tài khoản: «default» (không mục accounts riêng — profile = mã) bật 2 nhóm, «phu» bật 1 nhóm.
  const CAU_HINH = JSON.stringify({ channels: { zalouser: { groups: { "dd-grp-a": { enabled: true }, "dd-grp-b": { enabled: true } }, accounts: {
    phu: { profile: "phu", groups: { "dd-grp-c": { enabled: true } } },
  } } } });
  test("DD-AC-6 bản tin gửi soNhomBat, enabledGroups rỗng", async () => {
    const r = await captureOpsFacts({ logs: LOGS(), home: { ".openclaw/openclaw.json": CAU_HINH } });
    assert.equal(r.code, 0, r.stderr.slice(0, 800));
    assert.equal(r.posts, 1);
    const acc = r.payload.zaloAccounts;
    // Quan hệ tài khoản → số nhóm bật của chính nó, ghim trọn bảng (không chỉ «có một tài khoản 2 nhóm»).
    assert.deepEqual(Object.fromEntries(acc.map((a) => [a.accountId, a.soNhomBat])), { default: 2, phu: 1 }, "bảng tài khoản → soNhomBat");
    for (const [i, a] of acc.entries()) {
      assert.deepEqual(a.enabledGroups, [], `zaloAccounts[${i}].enabledGroups phải rỗng`);
      assert.equal(typeof a.soNhomBat, "number", `zaloAccounts[${i}].soNhomBat`);
      assert.equal(a.name, null, `zaloAccounts[${i}].name`);
    }
    assert.ok(!JSON.stringify(r.payload.zaloAccounts).includes("dd-grp-"), "bản tin còn mã nhóm");
  });
  test("DD-AC-6 bản sao gửi cùng một số nhóm cho mọi tài khoản → bảng tài khoản đỏ", async () => {
    const f = mutantPush("so-nhom-sai.mjs", (s) => s.replace("soNhomBat: nhomBat.length", "soNhomBat: 2"));
    const r = await captureOpsFacts({ script: f, logs: LOGS(), home: { ".openclaw/openclaw.json": CAU_HINH } });
    assert.equal(r.code, 0, r.stderr.slice(0, 800));
    assert.throws(
      () => assert.deepEqual(Object.fromEntries(r.payload.zaloAccounts.map((a) => [a.accountId, a.soNhomBat])), { default: 2, phu: 1 }, "bảng tài khoản → soNhomBat"),
      /bảng tài khoản → soNhomBat/,
    );
  });
  test("DD-AC-6 bản sao gửi mã nhóm → chặn, nêu zaloAccounts[0].enabledGroups", async () => {
    const f = mutantPush("ma-nhom.mjs", (s) => s.replace("enabledGroups: [], soNhomBat", "enabledGroups: nhomBat, soNhomBat"));
    const r = await captureOpsFacts({ script: f, logs: LOGS(), home: { ".openclaw/openclaw.json": CAU_HINH } });
    assertBlocked(r, "FACTS CHẶN [tầng A] zaloAccounts[0].enabledGroups mã nhóm");
  });
});

describe("NT2-AC-10 bản tin thật, chế độ khô", () => {
  // log + cấu hình thật của máy thu: HOME thật, cây log ở checkout chính (launchd ghi ở đó, không ở worktree)
  const mainRoot = () => path.dirname(execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: HERE, encoding: "utf8" }).trim());
  test("NT2-AC-10 bản tin dựng từ log và cấu hình thật (chế độ khô, không gửi) → 0 chỗ trúng", async () => {
    const r = await captureOpsFacts({ args: ["--kho"], env: { HOME: homedir(), ONEINVEST_ROOT: mainRoot() } });
    assert.equal(r.code, 0, factsLines(r.stderr).join(" | ") || r.stderr.slice(0, 800));
    assert.equal(r.posts, 0, "chế độ khô không được gửi");
    assert.match(r.stdout, /ops-facts khô: sạch, 0 chỗ chặn/);
  });
  test("NT2-AC-10 chiều đỏ: chế độ khô với bản sao cấy tên → thoát ≠0, chỉ in đường JSON + mã S0x", async () => {
    const r = await captureOpsFacts({ script: cayCopy(), args: ["--kho"], env: { HOME: homedir(), ONEINVEST_ROOT: mainRoot(), NT2_CAY: "payload.funnel.cay = N;" } });
    assertBlocked(r, "FACTS CHẶN [tầng A] funnel.cay S02");
    assert.match(r.stdout, /ops-facts khô: \d+ chỗ chặn/);
  });
});

// ---- che-ten-nguon-khong-lay-tu-dau AC-4: chỗ đọc sổ đi qua MỘT hàm nạp chung ----
const CHO_DOC = [
  "pipeline/sync-cloud.mjs", "pipeline/push-ops-facts.mjs", "pipeline/do-hang-ngay.mjs",
  "app/src/lib/offers-public.ts", "app/src/lib/collections-queries.ts", "scripts/quet-ten-nguon-html.mjs",
];
// Câu SQL tự đọc tên/định danh từ sổ để dựng danh sách che: real_name hoặc source_ids trong cùng câu với FROM source_registry.
const tuDocSo = (src) => /(?:real_name|source_ids|\*)[^;`]*?\bFROM\s+(?:public\.)?"?source_registry\b/i.test(src);
describe("che-ten AC-4 chỗ đọc qua hàm nạp chung", () => {
  const REPO_GOC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  test("AC-4 sáu chỗ đọc không còn tự đọc real_name/source_ids từ source_registry; mỗi chỗ gọi hàm nạp chung", () => {
    for (const f of CHO_DOC) {
      const src = readFileSync(path.join(REPO_GOC, f), "utf8");
      assert.equal(tuDocSo(src), false, `AC-4 chỗ đọc tự dựng danh sách che: ${f}`);
      assert.match(src, /docSourceNameEntries/, `AC-4 ${f} không gọi hàm nạp chung`);
    }
  });
  for (const cau of ["SELECT code, real_name FROM source_registry", "SELECT real_name FROM public.source_registry", "SELECT * FROM source_registry", 'SELECT source_ids FROM "source_registry"']) test(`AC-4 chiều đỏ: chèn câu tự đọc sổ vào bản sao → đỏ ghim «AC-4 chỗ đọc tự dựng danh sách che» (${cau.length})`, () => {
    const src = readFileSync(path.join(REPO_GOC, CHO_DOC[0]), "utf8") + `\nconst x = \`${cau}\`;\n`;
    assert.throws(() => assert.equal(tuDocSo(src), false, `AC-4 chỗ đọc tự dựng danh sách che: ${CHO_DOC[0]}`),
      /AC-4 chỗ đọc tự dựng danh sách che/);
  });
});

describe("che-ten AC-4: bộ soát bảng không hẹp hơn bản trên main (S4 vòng 3, lời Mạnh 19/11 sửa ngay)", () => {
  // Luật của bản trên main (origin/main b6be3c6f2, pipeline/sync-cloud.mjs assertNoSourceNames): soát chuỗi JSON thô của cả dòng,
  // `if (!scanSourceNames(j, tokens)) continue;`. Chép lại ở đây làm thước, vì sau khi gộp main không còn bản cũ để so. Thước dùng lõi
  // khớp hiện tại: phần nới có chủ đích của AC-2 (thương hiệu của dòng khai cờ) không tính là lọt; so ở đây là so HÌNH DẠNG soát.
  const banMain = (j, tokens) => scanSourceNames(j, tokens) !== null;
  const tk = [
    { token: "Lumora Thịnh", wholeOnly: true },
    { token: "market.lumorathinh.vn", wholeOnly: true },
    { token: "Veridia Sàn", wholeOnly: false },
  ];
  const ten = ["Lumora Thịnh", "lumora thinh", "LUMORA THỊNH", "lumorathinh", "Lumora-Thịnh", "Lumora\nThịnh", "market.lumorathinh.vn",
    "Veridia Sàn", "veridia", "veridiasan", "dự án Lumora Park", "ngõ 3 phố Huế"];
  const cho = {
    "giá trị": (n) => ({ offer_id: "o1", street_raw: n }),
    "khoá đỉnh": (n) => ({ offer_id: "o1", [n]: 1 }),
    "khoá lồng jsonb": (n) => ({ offer_id: "o1", raw: { meta: { [n]: true } } }),
    "khoá trong mảng": (n) => ({ offer_id: "o1", raw: [{ a: 1 }, { [n]: "x" }] }),
    "giá trị lồng": (n) => ({ offer_id: "o1", raw: { a: [n] } }),
    // Hai mảnh kề nhau ghép thành cụm trong chuỗi thô («Lumora","Thịnh») — chỉ cách soát chuỗi thô của main bắt được.
    "hai phần tử mảng kề": (n) => ({ offer_id: "o1", raw: n.split(/\s+/) }),
    "giá trị rồi khoá kề": (n) => ({ offer_id: "o1", raw: { a: n.split(/\s+/)[0], [n.split(/\s+/).slice(1).join(" ") || "x"]: 1 } }),
  };
  const mau = Object.entries(cho).flatMap(([vi, f]) => ten.map((n) => ({ ca: `${vi} · ${JSON.stringify(n)}`, j: JSON.stringify(f(n)) })));
  const chan = (j) => {
    try {
      assertNoSourceNames(new Map([["sale_offers", [j]]]), tk);
      return false;
    } catch (e) {
      if (!/định danh nguồn/.test(e.message)) throw e;
      return true;
    }
  };
  test("mọi mẫu cấy bản trên main chặn thì bản mới cũng chặn", () => {
    const main = mau.filter((m) => banMain(m.j, tk));
    assert.ok(main.length >= 25, `thước phải bắt đủ mẫu (bắt ${main.length})`);
    const lot = main.filter((m) => !chan(m.j)).map((m) => m.ca);
    assert.deepEqual(lot, [], "bản mới để lọt thứ bản trên main bắt được");
  });
  for (const vi of ["khoá đỉnh", "khoá lồng jsonb", "khoá trong mảng"]) {
    test(`${vi}: cụm hai từ, tên miền, cụm xuống dòng đều bị chặn`, () => {
      for (const n of ["Lumora Thịnh", "market.lumorathinh.vn", "Lumora\nThịnh", "veridia"]) assert.ok(chan(JSON.stringify(cho[vi](n))), `lọt ${JSON.stringify(n)}`);
    });
  }
  test("đối chứng: khoá mang thương hiệu (dòng khai cờ) và khoá thường đi qua", () => {
    for (const n of ["dự án Lumora Park", "ngõ 3 phố Huế"]) for (const f of Object.values(cho)) assert.equal(chan(JSON.stringify(f(n))), false, n);
  });
});
